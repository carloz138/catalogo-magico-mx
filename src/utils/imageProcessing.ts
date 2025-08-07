// 🔧 ARCHIVO COMPLETO CORREGIDO - utils/imageProcessing.ts 
// 🎯 TRANSPARENCIA PRESERVADA - NO MÁS FONDOS NEGROS

export const downloadImageFromUrl = async (url: string): Promise<Blob> => {
  try {
    console.log(`📥 Downloading image from: ${url}`);
    
    // ✅ MEJORADO - Intentar fetch directo primero
    try {
      const directResponse = await fetch(url, {
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (directResponse.ok) {
        const blob = await directResponse.blob();
        
        // 🔍 DEBUGGING CRÍTICO - Ver qué MIME type regresa Pixelcut
        console.log(`📊 Downloaded blob details:`, {
          type: blob.type,
          size: blob.size,
          url: url.substring(url.lastIndexOf('/') + 1),
          isPng: url.toLowerCase().includes('.png'),
          isFromPixelcut: url.includes('pixelcut') || url.includes('cdn2')
        });
        
        // 🎯 FIX CRÍTICO: Si es de Pixelcut y termina en .png, forzar tipo PNG
        if ((url.includes('pixelcut') || url.includes('cdn2')) && url.toLowerCase().includes('.png')) {
          console.log(`🔧 FIXING: Pixelcut PNG detected, forcing image/png type`);
          // Crear nuevo blob con tipo correcto
          const fixedBlob = new Blob([blob], { type: 'image/png' });
          console.log(`✅ Fixed blob type: ${fixedBlob.type}`);
          return fixedBlob;
        }
        
        return blob;
      }
    } catch (directError) {
      console.log('Direct fetch failed, trying proxy...', directError);
    }
    
    // Fallback: usar proxy
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
    
    // 🎯 MISMO FIX PARA PROXY
    if ((url.includes('pixelcut') || url.includes('cdn2')) && url.toLowerCase().includes('.png')) {
      console.log(`🔧 FIXING: Pixelcut PNG detected via proxy, forcing image/png type`);
      const fixedBlob = new Blob([blob], { type: 'image/png' });
      console.log(`✅ Fixed proxy blob type: ${fixedBlob.type}`);
      return fixedBlob;
    }
    
    return blob;
    
  } catch (error) {
    console.error('Error downloading image:', error);
    throw new Error('Failed to download processed image');
  }
};

// 🎯 FUNCIÓN CRÍTICA CORREGIDA - resizeImage CON TRANSPARENCIA
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
      
      // ✅ DETECCIÓN MEJORADA DE TRANSPARENCIA
      const hasTransparency = blob.type === 'image/png' || 
                             blob.type.includes('png') || 
                             blob.type.includes('webp') || 
                             blob.type.includes('gif');
      
      // 🔍 DEBUGGING CRÍTICO
      console.log(`🖼️ Resizing image:`, {
        originalType: blob.type,
        hasTransparency: hasTransparency,
        outputFormat: hasTransparency ? 'PNG' : 'JPEG',
        dimensions: `${width}x${height}`,
        quality: hasTransparency ? 'lossless' : quality
      });
      
      // 🎯 FIX CRÍTICO: USAR PNG PARA TRANSPARENCIA, JPG PARA FOTOS
      if (hasTransparency) {
        console.log(`✅ Preserving transparency - resizing as PNG`);
        canvas.toBlob((result) => {
          if (result) {
            console.log(`✅ PNG resize successful: ${result.type}, ${result.size} bytes`);
            resolve(result);
          } else {
            reject(new Error('PNG conversion failed'));
          }
        }, 'image/png'); // ✅ PNG PARA TRANSPARENCIA
      } else {
        console.log(`📷 No transparency detected - resizing as JPEG`);
        canvas.toBlob((result) => {
          if (result) {
            console.log(`✅ JPEG resize successful: ${result.type}, ${result.size} bytes`);
            resolve(result);
          } else {
            reject(new Error('JPEG conversion failed'));
          }
        }, 'image/jpeg', quality); // JPG para fotos normales
      }
    };

    img.onerror = () => reject(new Error('Failed to load image for resizing'));
    img.src = URL.createObjectURL(blob);
  });
};

// 🎯 FUNCIÓN CRÍTICA CORREGIDA - uploadImageToSupabase CON EXTENSIÓN DINÁMICA
export const uploadImageToSupabase = async (
  supabase: any,
  productId: string, 
  originalBlob: Blob, 
  filename: string
): Promise<{ thumbnail: string; catalog: string; luxury: string; print: string }> => {
  const timestamp = Date.now();
  const baseFilename = `${timestamp}_${productId}`;
  
  // 🎯 DETECCIÓN MEJORADA DE FORMATO
  const hasTransparency = originalBlob.type === 'image/png' || 
                         originalBlob.type.includes('png') || 
                         originalBlob.type.includes('webp') || 
                         originalBlob.type.includes('gif');
  
  const fileExtension = hasTransparency ? 'png' : 'jpg';
  const contentType = hasTransparency ? 'image/png' : 'image/jpeg';
  
  // 🔍 DEBUGGING COMPLETO
  console.log(`📁 Processing ${filename}:`);
  console.log(`   📊 Original blob type: ${originalBlob.type}`);
  console.log(`   📊 Original blob size: ${originalBlob.size} bytes`);
  console.log(`   🎨 Has transparency: ${hasTransparency}`);
  console.log(`   💾 Will save as: ${fileExtension} (${contentType})`);
  console.log(`   🔗 Expected filename pattern: ${baseFilename}_*.${fileExtension}`);
  
  // ✅ Generate different sizes with transparency preservation
  console.log(`🔄 Starting resize operations...`);
  const [thumbnailBlob, catalogBlob, luxuryBlob, printBlob] = await Promise.all([
    resizeImage(originalBlob, 300, 300, 0.8),   // Thumbnail: 300x300
    resizeImage(originalBlob, 800, 800, 0.85),  // Catalog: 800x800
    resizeImage(originalBlob, 1200, 1200, 0.9), // Luxury: 1200x1200
    resizeImage(originalBlob, 2400, 2400, 0.95) // Print: 2400x2400
  ]);
  
  console.log(`✅ All resize operations completed`);

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
    
    console.log(`⬆️ Uploading ${fileName}:`);
    console.log(`   📦 Blob type: ${blob?.type}`);
    console.log(`   📦 Blob size: ${blob?.size} bytes`);
    console.log(`   📦 Content-Type: ${contentType}`);
    
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
          productId: productId,
          expectedExtension: fileExtension
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
    
    // ✅ VERIFICACIÓN DETALLADA DE LA URL
    const urlExtension = urlData.publicUrl.split('.').pop()?.toLowerCase();
    console.log(`🔍 Upload verification for ${size}:`);
    console.log(`   🌐 Public URL: ${urlData.publicUrl}`);
    console.log(`   🔤 URL extension: ${urlExtension}`);
    console.log(`   ✅ Expected extension: ${fileExtension}`);
    console.log(`   ${urlExtension === fileExtension ? '✅ MATCH' : '❌ MISMATCH'}`);
    
    if (urlExtension !== fileExtension) {
      console.warn(`⚠️ CRITICAL: Extension mismatch for ${size}! Expected: ${fileExtension}, Got: ${urlExtension}`);
      console.warn(`⚠️ This indicates Supabase is converting the format automatically`);
    }
  }

  console.log(`🎉 All uploads completed for ${productId}`);
  console.log(`📋 Final URLs summary:`);
  console.log(`   📐 Thumbnail: ${uploadedUrls.thumbnail}`);
  console.log(`   📘 Catalog: ${uploadedUrls.catalog}`);
  console.log(`   💎 Luxury: ${uploadedUrls.luxury}`);
  console.log(`   🖨️ Print: ${uploadedUrls.print}`);

  return uploadedUrls;
};