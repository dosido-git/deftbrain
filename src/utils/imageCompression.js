// ==================================================================
// IMAGE COMPRESSION UTILITY
// Reusable across all tools: , PlantRescue, CaptionMagic, etc.
// Use this in hooks/useImageCompression.js or utils/imageCompression.js
// ==================================================================

/**
 * Compresses an image file to reduce size while maintaining quality
 * 
 * @param {File} file - The image file to compress
 * @param {Object} options - Compression options
 * @param {number} options.maxWidth - Maximum width in pixels (default: 800)
 * @param {number} options.maxHeight - Maximum height in pixels (default: 800)
 * @param {number} options.quality - JPEG quality 0-1 (default: 0.8)
 * @param {string} options.outputFormat - 'jpeg' or 'png' (default: 'jpeg')
 * @param {number} options.maxSizeKB - Maximum output size in KB (default: 500)
 * @returns {Promise<string>} - Base64 data URL of compressed image
 */
import React, { useState, useRef } from 'react';

export const compressImage = (file, options = {}) => {
  return new Promise((resolve, reject) => {
    // Default options
    const {
      maxWidth = 800,
      maxHeight = 800,
      quality = 0.8,
      outputFormat = 'jpeg',
      maxSizeKB = 500
    } = options;

    // Validate file
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Invalid file type. Please provide an image file.'));
      return;
    }

    // Check original file size
    const originalSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    console.log(`Original image: ${originalSizeMB}MB`);

    const reader = new FileReader();
    
    reader.onerror = () => {
      reject(new Error('Failed to read image file'));
    };
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.onload = () => {
        try {
          // Calculate new dimensions while maintaining aspect ratio
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = (height / width) * maxWidth;
              width = maxWidth;
            } else {
              width = (width / height) * maxHeight;
              height = maxHeight;
            }
          }
          
          // Create canvas for compression
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          
          // Optional: Better image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Draw resized image
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to desired format
          const mimeType = outputFormat === 'png' ? 'image/png' : 'image/jpeg';
          const compressedDataUrl = canvas.toDataURL(mimeType, quality);
          
          // Check final size
          const compressedSizeKB = Math.round((compressedDataUrl.length * 0.75) / 1024);
          console.log(`Compressed image: ${compressedSizeKB}KB (${Math.round((compressedSizeKB / (file.size / 1024)) * 100)}% of original)`);
          
          // Validate max size
          if (compressedSizeKB > maxSizeKB) {
            // Try again with lower quality
            if (quality > 0.5) {
              console.warn('Image still too large, reducing quality...');
              const lowerQuality = Math.max(0.5, quality - 0.2);
              const retryDataUrl = canvas.toDataURL(mimeType, lowerQuality);
              const retrySizeKB = Math.round((retryDataUrl.length * 0.75) / 1024);
              
              if (retrySizeKB <= maxSizeKB) {
                console.log(`Retry successful: ${retrySizeKB}KB at quality ${lowerQuality}`);
                resolve(retryDataUrl);
                return;
              }
            }
            
            reject(new Error(`Image too large (${compressedSizeKB}KB). Maximum is ${maxSizeKB}KB. Try a smaller image.`));
            return;
          }
          
          resolve(compressedDataUrl);
        } catch (err) {
          reject(new Error(`Compression failed: ${err.message}`));
        }
      };
      
      img.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Preset configurations for different use cases
 */
export const CompressionPresets = {
  // For wardrobe thumbnails (localStorage storage)
  THUMBNAIL: {
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.7,
    outputFormat: 'jpeg',
    maxSizeKB: 100
  },
  
  // For API analysis (Claude vision API)
  API_UPLOAD: {
    maxWidth: 1024,
    maxHeight: 1024,
    quality: 0.85,
    outputFormat: 'jpeg',
    maxSizeKB: 800
  },
  
  // For high-quality preview
  PREVIEW: {
    maxWidth: 1600,
    maxHeight: 1600,
    quality: 0.9,
    outputFormat: 'jpeg',
    maxSizeKB: 1500
  },
  
  // For profile pictures
  PROFILE: {
    maxWidth: 500,
    maxHeight: 500,
    quality: 0.8,
    outputFormat: 'jpeg',
    maxSizeKB: 200
  }
};

/**
 * React hook for image compression
 */
export const useImageCompression = () => {
  const [compressing, setCompressing] = React.useState(false);
  const [error, setError] = React.useState(null);

  const compress = async (file, preset = 'API_UPLOAD') => {
    setCompressing(true);
    setError(null);
    
    try {
      const options = CompressionPresets[preset] || CompressionPresets.API_UPLOAD;
      const compressed = await compressImage(file, options);
      setCompressing(false);
      return compressed;
    } catch (err) {
      setError(err.message);
      setCompressing(false);
      throw err;
    }
  };

  return { compress, compressing, error };
};

// ==================================================================
// USAGE EXAMPLES
// ==================================================================

/*

// Example 1:  (localStorage storage)
import { compressImage, CompressionPresets } from '../utils/imageCompression';

const handleImageUpload = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  
  try {
    const compressed = await compressImage(file, CompressionPresets.THUMBNAIL);
    setNewItem(prev => ({ ...prev, imagePreview: compressed }));
  } catch (err) {
    setError(err.message);
  }
};


// Example 2: PlantRescue (API upload)
import { compressImage, CompressionPresets } from '../utils/imageCompression';

const handleImageUpload = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  
  setUploading(true);
  
  try {
    const compressed = await compressImage(file, CompressionPresets.API_UPLOAD);
    setImagePreview(compressed);
    setImageBase64(compressed);
  } catch (err) {
    setError(err.message);
  } finally {
    setUploading(false);
  }
};


// Example 3: CaptionMagic (future)
import { useImageCompression } from '../hooks/useImageCompression';

const CaptionMagic = () => {
  const { compress, compressing, error } = useImageCompression();
  
  const handleUpload = async (file) => {
    try {
      const compressed = await compress(file, 'API_UPLOAD');
      // Use compressed image
    } catch (err) {
      console.error(err);
    }
  };
};


// Example 4: Custom settings
const compressed = await compressImage(file, {
  maxWidth: 600,
  maxHeight: 600,
  quality: 0.75,
  outputFormat: 'jpeg',
  maxSizeKB: 300
});

*/
