export interface CompressedImageResult {
  dataUrl: string;
  mimeType: 'image/jpeg';
}

/**
 * Resizes an image file to a maximum dimension of 1280px while preserving aspect ratio,
 * converts to JPEG format at 0.8 quality, and strips EXIF, GPS, and camera metadata.
 *
 * @param file Raw File object from user upload
 * @returns Promise resolving to the compressed image dataUrl and mimeType
 */
export function compressImage(file: File): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        const maxSide = 1280;

        if (width > maxSide || height > maxSide) {
          if (width > height) {
            height = Math.round((height * maxSide) / width);
            width = maxSide;
          } else {
            width = Math.round((width * maxSide) / height);
            height = maxSide;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context.'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Drawing to canvas and re-encoding strips EXIF, GPS, and metadata
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve({ dataUrl, mimeType: 'image/jpeg' });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
