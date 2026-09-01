/**
 * Loads an image from a File object
 * @param {File} file 
 * @returns {Promise<HTMLImageElement>}
 */
const loadImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = e.target.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

/**
 * Draws an image to a Canvas with specified bounding dimensions, preserving aspect ratio.
 * @param {HTMLImageElement} img 
 * @param {number} maxWidth 
 * @param {number} maxHeight 
 * @returns {HTMLCanvasElement}
 */
const drawToCanvas = (img, maxWidth, maxHeight) => {
  let width = img.width;
  let height = img.height;

  if (width > height) {
    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }
  } else {
    if (height > maxHeight) {
      width = Math.round((width * maxHeight) / height);
      height = maxHeight;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  // High quality smoothing settings
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
};

/**
 * Formats file sizes to a readable string (e.g. 2.4 MB, 850 KB)
 * @param {number} bytes 
 * @returns {string}
 */
export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Iteratively compresses an image file until it is under the target size (default 1MB).
 * @param {File} file 
 * @param {number} targetSizeInBytes 
 * @returns {Promise<{base64: string, originalSize: number, compressedSize: number, ratio: number, originalFormatted: string, compressedFormatted: string}>}
 */
export const compressImageToLimit = async (file, targetSizeInBytes = 1 * 1024 * 1024) => {
  const originalSize = file.size;
  
  // Load the image
  const img = await loadImage(file);
  
  let maxWidth = 2048; // Max resolution bounding box (extremely clear for products)
  let maxHeight = 2048;
  let quality = 0.92; // Start with very high quality
  let compressedBase64 = '';
  let compressedSize = 0;
  
  // Up to 5 iterations of compression targeting the 1MB limit
  for (let i = 0; i < 5; i++) {
    const canvas = drawToCanvas(img, maxWidth, maxHeight);
    compressedBase64 = canvas.toDataURL('image/jpeg', quality);
    
    // Calculate base64 length in bytes
    compressedSize = Math.round((compressedBase64.length * 3) / 4);
    
    // If it fits our target size, we are done
    if (compressedSize <= targetSizeInBytes) {
      break;
    }
    
    // Otherwise, decrease quality or resolution iteratively
    if (quality > 0.70) {
      quality -= 0.08;
    } else {
      // Reduce dimensions if quality is already at 0.70
      maxWidth = Math.round(maxWidth * 0.8);
      maxHeight = Math.round(maxHeight * 0.8);
      quality = 0.80; // Reset quality slightly higher for scaled down image
    }
  }
  
  // Final safeguard: if still larger than target size, force strict downscale and quality
  if (compressedSize > targetSizeInBytes) {
    const canvas = drawToCanvas(img, 1200, 1200);
    compressedBase64 = canvas.toDataURL('image/jpeg', 0.65);
    compressedSize = Math.round((compressedBase64.length * 3) / 4);
  }
  
  const ratio = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100));
  
  return {
    base64: compressedBase64,
    originalSize,
    compressedSize,
    ratio,
    originalFormatted: formatBytes(originalSize),
    compressedFormatted: formatBytes(compressedSize)
  };
};
