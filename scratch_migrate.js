const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'src');

const replacements = {
  // Old Tokens
  "accent-green": "verified-green",
  "card-border": "stone",
  "secondary-border": "stone",
  "muted-gray-text": "charcoal/60",
  "secondary-hover-bg": "warm-beige",
  "green-tint-bg": "soft-white",
  
  // Hardcoded Hex classes to Tokens (catching bg-[HEX], text-[HEX], border-[HEX], etc.)
  "\\\\[#F4F1EA\\\\]": "soft-white",
  "\\\\[#F7F4EE\\\\]": "soft-white",
  "\\\\[#FAF9F6\\\\]": "soft-white",
  "\\\\[#F8FAFC\\\\]": "soft-white",
  "\\\\[#EFE7DA\\\\]": "warm-beige",
  "\\\\[#E8E1D5\\\\]": "stone",
  "\\\\[#D8CCB8\\\\]": "stone",
  
  "\\\\[#F2BB84\\\\]": "muted-brass",
  "\\\\[#EAAA6D\\\\]": "muted-brass",
  "\\\\[#d08535\\\\]": "muted-brass",
  "\\\\[#b07a3a\\\\]": "muted-brass",
  
  "\\\\[#23533e\\\\]": "verified-green",
  "\\\\[#2E6A4F\\\\]": "verified-green",
  
  "\\\\[#1E1E1C\\\\]": "charcoal",
  "\\\\[#1B1B1B\\\\]": "charcoal",
  "\\\\[#1E1E1E\\\\]": "charcoal",
  "\\\\[#2A2A2A\\\\]": "charcoal",
  
  "\\\\[#E2D6C3\\\\]": "deep-beige",
  
  // Standard hex attributes (e.g. stroke="#2E6A4F") -> Since they are inline SVGs, we replace them with standard hexes of the new tokens, OR we use tailwind classes if we can't easily parse. We'll just replace the raw hex strings.
  "#2E6A4F": "#137547", // verified-green
  "#F2BB84": "#B29A68", // muted-brass
  "#EAAA6D": "#B29A68",
  "#d08535": "#B29A68",
  "#b07a3a": "#B29A68",
  "#F4F1EA": "#FAF9F7", // soft-white
  "#E8E1D5": "#D9D2C5", // stone
  "#23533e": "#137547", // verified-green
  "#1E1E1C": "#1B1B1B", // charcoal
  "#1E1E1E": "#1B1B1B",
  "#2A2A2A": "#1B1B1B"
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

const allFiles = walk(srcDir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

let changedFiles = 0;

allFiles.forEach(f => {
  // EXCLUSIONS
  if (f.endsWith('Header.tsx') || f.endsWith('AmenitiesSection.tsx')) {
    return; // Do not touch
  }

  let content = fs.readFileSync(f, 'utf8');
  let originalContent = content;

  // Replace tokens and hexes
  for (const [oldVal, newVal] of Object.entries(replacements)) {
    // For bracketed hexes like `bg-[#F4F1EA]`, the key is `\\[#F4F1EA\\]`
    // We want to replace it using a global regex
    const regex = new RegExp(oldVal, 'gi'); // Case insensitive so we catch #f4f1ea as well
    content = content.replace(regex, newVal);
  }

  if (content !== originalContent) {
    fs.writeFileSync(f, content, 'utf8');
    changedFiles++;
    console.log(`Updated ${f.replace(process.cwd(), '')}`);
  }
});

console.log(`Migration complete. Updated ${changedFiles} files.`);
