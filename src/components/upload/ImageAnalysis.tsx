
// src/components/upload/ImageAnalysis.tsx
export interface ImageAnalysis {
  complexityScore: number;        // 0-100
  recommendedApi: 'pixelcut' | 'removebg';
  estimatedCredits: number;       // 1 para pixelcut, 20 para removebg
  estimatedCost: number;          // 0.20 para pixelcut, 4.09 para removebg
  confidence: number;             // 0-100
  tips: string[];
  backgroundUniformity?: number;
  contrastRatio?: number;
}

export const analyzeImageQuality = (file: File, productName = '', category = ''): Promise<ImageAnalysis> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Crear canvas para análisis
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      // Redimensionar para análisis
      const maxSize = 300;
      const ratio = Math.min(maxSize / img.width, maxSize / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Análisis simplificado pero efectivo
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const analysis = performAnalysis(imageData, productName, category);
      
      resolve(analysis);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

function performAnalysis(imageData: ImageData, productName: string, category: string): ImageAnalysis {
  // Análisis por keywords (igual que n8n)
  const text = `${productName} ${category}`.toLowerCase();
  
  const complexKeywords = [
    'encaje', 'transparente', 'red', 'crochet', 'pelo', 'cabello', 'pluma',
    'joyería', 'cadena', 'mascota', 'animal', 'estampado', 'bordado'
  ];
  
  const simpleKeywords = [
    'fondo blanco', 'estudio', 'básico', 'sólido', 'uniforme', 'algodón'
  ];
  
  // Calcular complejidad base por categoría
  const categoryComplexity: Record<string, number> = {
    'Ropa y Textiles': 60,
    'Belleza y Cuidado Personal': 70,
    'Mascotas y Artículos Pet': 80,
    'Joyería y Accesorios': 65,
    'Juguetes y Figuras': 20,
    'Electrónicos y Tecnología': 10
  };
  
  const baseComplexity = categoryComplexity[category] || 30;
  
  // Detectar keywords
  let keywordScore = 0;
  complexKeywords.forEach(keyword => {
    if (text.includes(keyword)) keywordScore += 15;
  });
  simpleKeywords.forEach(keyword => {
    if (text.includes(keyword)) keywordScore -= 10;
  });
  
  // Score final
  const complexityScore = Math.max(0, Math.min(100, baseComplexity + keywordScore));
  
  // Recomendación
  const recommendedApi = complexityScore >= 75 ? 'removebg' : 'pixelcut';
  const estimatedCredits = recommendedApi === 'removebg' ? 20 : 1;
  const estimatedCost = recommendedApi === 'removebg' ? 4.09 : 0.20;
  
  const confidence = complexityScore >= 75 || complexityScore <= 25 ? 85 : 70;
  
  const tips = [
    complexityScore >= 75 ? '🎯 Complejidad alta - Remove.bg recomendado' : '💰 Complejidad baja - Pixelcut óptimo',
    '📸 Para mejores resultados use fondo uniforme',
    '💡 Asegure buen contraste producto/fondo'
  ];
  
  return {
    complexityScore,
    recommendedApi,
    estimatedCredits,
    estimatedCost,
    confidence,
    tips
  };
}
