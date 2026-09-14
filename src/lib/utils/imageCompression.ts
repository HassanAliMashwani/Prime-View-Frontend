/**
 * Client-side utility for compressing and converting uploaded receipts to Base64 Data URLs.
 * Ensures fast loading, avoids broken blob URLs across sessions, and keeps storage footprint small.
 */
export async function compressAndEncodeReceipt(
  file: File,
  maxWidth: number = 1000,
  quality: number = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If not an image (e.g., PDF document), convert directly to data URL without canvas
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file as Data URL'));
        }
      };
      reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

          // Proportionally scale down if wider than maxWidth
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            // Fallback to raw data url if canvas context unavailable
            resolve(readerEvent.target?.result as string);
            return;
          }

          // Fill white background for transparent PNGs converted to JPEG
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Export as optimized JPEG base64 data URL
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch {
          // Fallback if canvas export fails
          resolve(readerEvent.target?.result as string);
        }
      };

      img.onerror = () => {
        // Fallback to raw reader result if image parsing fails
        if (typeof readerEvent.target?.result === 'string') {
          resolve(readerEvent.target.result);
        } else {
          reject(new Error('Failed to parse image file'));
        }
      };

      img.src = readerEvent.target?.result as string;
    };

    reader.onerror = () => reject(reader.error || new Error('FileReader failed'));
    reader.readAsDataURL(file);
  });
}
