
export const downloadImageFromUrl = async (url: string): Promise<Blob> => {
  try {
    // Use a proxy service to bypass CORS restrictions
    const proxyUrl = `https://cors-anywhere.herokuapp.com/${url}`;
    const response = await fetch(proxyUrl, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    
    if (!response.ok) {
      // Fallback: try direct fetch
      const directResponse = await fetch(url, {
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!directResponse.ok) {
        throw new Error(`Failed to download image: ${response.status}`);
      }
      
      return await directResponse.blob();
    }
    
    return await response.blob();
  } catch (error) {
    console.error('Error downloading image:', error);
    throw new Error('Failed to download processed image');
  }
};

export const resizeImage = (blob: Blob, maxWidth: number, maxHeight: number, quality = 0.85): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };

    img.onerror = () => reject(new Error('Failed to load image for resizing'));
    img.src = URL.createObjectURL(blob);
  });
};

export const uploadImageToSupabase = async (
  supabase: any,
  productId: string, 
  originalBlob: Blob, 
  filename: string
): Promise<{ thumbnail: string; catalog: string; luxury: string; print: string }> => {
  const timestamp = Date.now();
  const baseFilename = `${timestamp}_${productId}`;
  
  // Generate different sizes
  const [thumbnailBlob, catalogBlob, luxuryBlob, printBlob] = await Promise.all([
    resizeImage(originalBlob, 300, 300, 0.8),   // Thumbnail: 300x300
    resizeImage(originalBlob, 800, 800, 0.85),  // Catalog: 800x800
    resizeImage(originalBlob, 1200, 1200, 0.9), // Luxury: 1200x1200
    resizeImage(originalBlob, 2400, 2400, 0.95) // Print: 2400x2400
  ]);

  const sizes = [
    { blob: thumbnailBlob, suffix: 'thumb', size: 'thumbnail' },
    { blob: catalogBlob, suffix: 'catalog', size: 'catalog' },
    { blob: luxuryBlob, suffix: 'luxury', size: 'luxury' },
    { blob: printBlob, suffix: 'print', size: 'print' }
  ];

  const uploadedUrls: any = {};

  for (const { blob, suffix, size } of sizes) {
    const fileName = `${baseFilename}_${suffix}.jpg`;
    
    const { data, error } = await supabase.storage
      .from('processed-images')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('processed-images')
      .getPublicUrl(fileName);

    uploadedUrls[size] = urlData.publicUrl;
  }

  return uploadedUrls;
};
