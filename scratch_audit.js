const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'src');
const appDir = path.join(srcDir, 'app');

const audit = {
  colors: {},
  spacing: {},
  typography: {},
  animations: {},
  routes: [],
  components: []
};

function walk(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      walk(path.join(dir, file), fileList);
    } else {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

const allFiles = walk(srcDir);
const tsxFiles = allFiles.filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

// Parse Routes
const pageFiles = tsxFiles.filter(f => f.endsWith('page.tsx'));
pageFiles.forEach(f => {
  const routePath = f.replace(appDir, '').replace('page.tsx', '').replace(/\\/g, '/');
  audit.routes.push(routePath || '/');
});

// Regex Patterns
const classNameRegex = /className=(?:\"([^\"]+)\"|{([^}]+)})/g;
const stringLiteralRegex = /[\"\']([^\"\']+)[\"\']/g;

const colorPattern = /\b(bg|text|border|ring|fill|stroke|from|via|to)-([a-z]+-[0-9]+|white|black|transparent|[a-z]+-?[a-z]+)\b/g;
const hexPattern = /#([a-fA-F0-9]{3,8})\b/g;
const customColorPattern = /\b(bg|text|border|ring)-\[([^\]]+)\]/g;

const spacingPattern = /\b(m|mt|mb|ml|mr|mx|my|p|pt|pb|pl|pr|px|py|gap)-([0-9]+(\.[0-9]+)?|px|[a-z]+|\[[^\]]+\])\b/g;
const typographyPattern = /\b(text-(xs|sm|base|lg|xl|[2-9]xl|\[[^\]]+\])|font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black|sans|serif|mono|display)|tracking-[a-z]+|leading-(none|tight|snug|normal|relaxed|loose|\[[^\]]+\]))\b/g;
const animationPattern = /\b(hover|focus|active|group-hover|transition(-[a-z]+)?|duration-[0-9]+|ease-[a-z-]+|animate-[a-z-]+)\b/g;

tsxFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const shortName = f.replace(srcDir, '');
  
  audit.components.push(shortName);

  let classNamesMatch;
  let allClasses = '';
  
  while ((classNamesMatch = classNameRegex.exec(content)) !== null) {
    if (classNamesMatch[1]) {
      allClasses += ' ' + classNamesMatch[1];
    } else if (classNamesMatch[2]) {
      let strMatch;
      while ((strMatch = stringLiteralRegex.exec(classNamesMatch[2])) !== null) {
         allClasses += ' ' + strMatch[1];
      }
    }
  }

  // Also catch generic tailwind classes loosely in quotes
  let strMatch;
  while ((strMatch = stringLiteralRegex.exec(content)) !== null) {
      if (strMatch[1].includes('flex ') || strMatch[1].includes('text-') || strMatch[1].includes('bg-')) {
          allClasses += ' ' + strMatch[1];
      }
  }

  const trackItem = (dict, item, file) => {
    if (!dict[item]) dict[item] = new Set();
    dict[item].add(file);
  };

  const colors = [...allClasses.matchAll(colorPattern)].map(m => m[0])
    .concat([...allClasses.matchAll(hexPattern)].map(m => m[0]))
    .concat([...allClasses.matchAll(customColorPattern)].map(m => m[0]));
    
  colors.forEach(c => trackItem(audit.colors, c, shortName));

  const spacing = [...allClasses.matchAll(spacingPattern)].map(m => m[0]);
  spacing.forEach(s => trackItem(audit.spacing, s, shortName));

  const typography = [...allClasses.matchAll(typographyPattern)].map(m => m[0]);
  typography.forEach(t => trackItem(audit.typography, t, shortName));

  const animations = [...allClasses.matchAll(animationPattern)].map(m => m[0]);
  animations.forEach(a => trackItem(audit.animations, a, shortName));
  
  if (content.includes('motion.')) {
     trackItem(audit.animations, 'framer-motion', shortName);
  }
});

let md = '# Comprehensive Codebase Audit\n\n';

md += '## 1. Color Inventory\n';
md += 'Every hex value and Tailwind color class used, grouped by frequency.\n\n';

const colorEntries = Object.entries(audit.colors).sort((a,b) => b[1].size - a[1].size);
for (const [color, files] of colorEntries) {
  const isRare = files.size <= 2 ? '⚠️ Rare' : '✅ Broad';
  md += '- **' + color + '** (' + isRare + ', used in ' + files.size + ' files)\n';
  if (files.size <= 2) {
    md += '  - Used in: ' + Array.from(files).map(f => '`'+f.replace(/\\/g, '/')+'`').join(', ') + '\n';
  }
}

md += '\n## 2. Spacing Inventory\n';
const spacingEntries = Object.entries(audit.spacing).sort((a,b) => b[1].size - a[1].size);
md += 'Top 20 most used spacing classes:\n\n';
spacingEntries.slice(0, 20).forEach(([s, files]) => {
  md += '- `' + s + '` (in ' + files.size + ' files)\n';
});
md += '\nRare/Custom spacing (likely inconsistent):\n\n';
spacingEntries.filter(e => e[1].size <= 2 && e[0].includes('[')).forEach(([s, files]) => {
  md += '- `' + s + '` -> ' + Array.from(files)[0].replace(/\\/g, '/') + '\n';
});

md += '\n## 3. Typography Inventory\n';
const typeEntries = Object.entries(audit.typography).sort((a,b) => b[1].size - a[1].size);
for (const [t, files] of typeEntries) {
   md += '- `' + t + '` (in ' + files.size + ' files)\n';
}

md += '\n## 4. Component Duplication Analysis\n';
md += 'Found ' + audit.components.length + ' TSX/TS files.\n';
md += 'Potential duplicates (similar naming):\n';
const names = audit.components.map(f => path.basename(f, '.tsx'));
const duplicates = names.filter((e, i, a) => a.indexOf(e) !== i);
md += duplicates.length > 0 ? duplicates.join(', ') : 'No exact filename duplicates found. Look out for AboutHeroSection vs ReferenceAboutView.\n';

md += '\n## 5. Route/Page List\n';
audit.routes.forEach(r => {
  md += '- `' + r + '`\n';
});

md += '\n## 6. Animation/Interaction Inventory\n';
const animEntries = Object.entries(audit.animations).sort((a,b) => b[1].size - a[1].size);
for (const [a, files] of animEntries) {
   md += '- `' + a + '` (in ' + files.size + ' files)\n';
}

fs.writeFileSync(path.join(process.cwd(), 'docs', 'comprehensive_audit.md'), md);
console.log('Audit complete.');
