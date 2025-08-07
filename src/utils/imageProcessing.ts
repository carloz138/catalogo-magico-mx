// 🔧 CÓDIGO COMPLETO - REEMPLAZAR TODO EL ARCHIVO DE UTILS

export const downloadImageFromUrl = async (url: string): Promise<Blob> => {
  try {
    console.log(`📥 Downloading image from: ${url}`);
    
    // ✅ MEJORADO - Intentar fetch directo primero (más confiable)
    try {
      const directResponse = await fetch(url, {
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (directResponse.ok) {
        const blob = await directResponse.blob();
        console.log(`✅ Direct download successful: ${blob.type}, ${blob.size} bytes`);
        return blob;
      }
    } catch (directError) {
      console.log('Direct fetch failed, trying proxy...');
    }
    
    // Fallback: usar proxy solo si el directo falla
    const proxyUrl = `https://cors-anywhere.herokuapp.com/${url}`;
    const response = await fetch(proxyUrl, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }
    
    const blob = await response.blob();
    console.log(`✅ Proxy download successful: ${blob.type}, ${blob.size} bytes`);
    return blob;
    
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
      let { width, height } = img;
      
      // Calculate new dimensions
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
      
      // 🎯 PRESERVAR TRANSPARENCIA - Limpiar canvas antes de dibujar
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      
      // ✅ DETECCIÓN INTELIGENTE DE TRANSPARENCIA
      const hasTransparency = blob.type.includes('png') || 
                             blob.type.includes('webp') || 
                             blob.type.includes('gif') ||
                             blob.type === 'image/png';
      
      if (hasTransparency) {
        console.log(`🖼️ Preserving transparency - resizing as PNG (${width}x${height})`);
        canvas.toBlob(resolve, 'image/png'); // ✅ PNG PARA TRANSPARENCIA
      } else {
        console.log(`📷 No transparency detected - resizing as JPEG (${width}x${height})`);
        canvas.toBlob(resolve, 'image/jpeg', quality); // JPG para fotos normales
      }
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
  
  // 🎯 DETECCIÓN INTELIGENTE DE FORMATO
  const hasTransparency = originalBlob.type.includes('png') || 
                         originalBlob.type.includes('webp') || 
                         originalBlob.type.includes('gif') ||
                         originalBlob.type === 'image/png';
  
  const fileExtension = hasTransparency ? 'png' : 'jpg';
  const contentType = hasTransparency ? 'image/png' : 'image/jpeg';
  
  console.log(`📁 Processing ${filename}:`);
  console.log(`   📊 Original type: ${originalBlob.type}`);
  console.log(`   🎨 Has transparency: ${hasTransparency}`);
  console.log(`   💾 Will save as: ${fileExtension} (${contentType})`);
  
  // Generate different sizes with transparency preservation
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
    // ✅ USAR EXTENSIÓN CORRECTA SEGÚN TRANSPARENCIA
    const fileName = `${baseFilename}_${suffix}.${fileExtension}`;
    
    console.log(`⬆️ Uploading ${fileName} (${blob?.type || contentType})`);
    
    const { data, error } = await supabase.storage
      .from('processed-images')
      .upload(fileName, blob, {
        contentType: contentType, // ✅ CONTENT-TYPE DINÁMICO
        upsert: false,
        // ✅ METADATA PARA DEBUGGING
        metadata: {
          hasTransparency: hasTransparency.toString(),
          originalType: originalBlob.type,
          processedAt: new Date().toISOString(),
          size: size,
          productId: productId
        }
      });

    if (error) {
      console.error(`❌ Upload failed for ${fileName}:`, error);
      throw error;
    }

    const { data: urlData } = supabase.storage
      .from('processed-images')
      .getPublicUrl(fileName);

    uploadedUrls[size] = urlData.publicUrl;
    
    // ✅ VERIFICAR QUE LA URL TENGA LA EXTENSIÓN CORRECTA
    const urlExtension = urlData.publicUrl.split('.').pop()?.toLowerCase();
    if (urlExtension !== fileExtension) {
      console.warn(`⚠️ Extension mismatch for ${size}! Expected: ${fileExtension}, Got: ${urlExtension}`);
    } else {
      console.log(`✅ ${size} uploaded successfully: ${urlData.publicUrl}`);
    }
  }

  console.log(`🎉 All sizes uploaded for ${productId}`);
  console.log(`   📐 Thumbnail: ${uploadedUrls.thumbnail}`);
  console.log(`   📘 Catalog: ${uploadedUrls.catalog}`);
  console.log(`   💎 Luxury: ${uploadedUrls.luxury}`);
  console.log(`   🖨️ Print: ${uploadedUrls.print}`);

  return uploadedUrls;
};