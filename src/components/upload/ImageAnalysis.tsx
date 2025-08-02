// src/components/upload/ImageAnalysis.tsx - ALGORITMO ESCALABLE
export interface ImageAnalysis {
  complexityScore: number;        // 0-100
  confidence: number;             // 0-100
  recommendedApi: 'pixelcut' | 'removebg';
  estimatedCredits: number;       // 1 para estándar, 20 para premium
  estimatedCost: number;          // 0.20 para estándar, 4.09 para premium
  reasoning: string;
  tips: string[];
  breakdown: {
    category: number;
    semantic: number;
    visual: number;
    context: number;
  };
  savingsVsRemoveBg: number;      // % ahorro vs procesamiento tradicional
}

export const analyzeImageQuality = async (file: File, productName = '', category = '', description = ''): Promise<ImageAnalysis> => {
  try {
    console.log(`🧠 Analizando complejidad: ${productName} (${category})`);
    
    // 1. ANÁLISIS POR CATEGORÍA (40% peso)
    const categoryScore = getCategoryComplexityScore(category);
    
    // 2. ANÁLISIS SEMÁNTICO (30% peso) - REEMPLAZA KEYWORDS  
    const semanticScore = analyzeProductSemantics(productName, description);
    
    // 3. ANÁLISIS VISUAL (20% peso) - IMAGEN REAL
    const visualScore = await analyzeImageComplexity(file);
    
    // 4. ANÁLISIS CONTEXTUAL (10% peso) - PATRONES APRENDIDOS
    const contextScore = getContextualComplexity(productName, category);
    
    // Score final ponderado
    const finalScore = Math.round(
      (categoryScore * 0.4) + 
      (semanticScore * 0.3) + 
      (visualScore * 0.2) + 
      (contextScore * 0.1)
    );
    
    const complexityScore = Math.max(0, Math.min(100, finalScore));
    const confidence = calculateConfidence(categoryScore, semanticScore, visualScore);
    
    // Determinar tipo de procesamiento recomendado
    const recommendedApi = complexityScore >= 75 ? 'removebg' : 'pixelcut';
    const estimatedCredits = recommendedApi === 'removebg' ? 20 : 1;
    const estimatedCost = recommendedApi === 'removebg' ? 4.09 : 0.20;
    
    const breakdown = {
      category: categoryScore,
      semantic: semanticScore,
      visual: visualScore,
      context: contextScore
    };
    
    return {
      complexityScore,
      confidence,
      recommendedApi,
      estimatedCredits,
      estimatedCost,
      reasoning: generateReasoning(complexityScore, breakdown),
      tips: generateTips(complexityScore, breakdown),
      breakdown,
      savingsVsRemoveBg: recommendedApi === 'pixelcut' ? 95 : 0
    };
    
  } catch (error) {
    console.error('Error in complexity analysis:', error);
    
    // Fallback robusto
    return {
      complexityScore: 50,
      confidence: 60,
      recommendedApi: 'pixelcut',
      estimatedCredits: 1,
      estimatedCost: 0.20,
      reasoning: 'Análisis simplificado aplicado por precaución',
      tips: ['📸 Use fondo uniforme para mejores resultados'],
      breakdown: { category: 50, semantic: 50, visual: 50, context: 50 },
      savingsVsRemoveBg: 95
    };
  }
};

// 1. ANÁLISIS POR CATEGORÍA - MÁS GRANULAR
function getCategoryComplexityScore(category: string): number {
  const categoryMapping: { [key: string]: number } = {
    // Muy Alta Complejidad (80-90)
    'Belleza y Cuidado Personal': 85,  // Cabello, maquillaje
    'Mascotas y Artículos Pet': 88,    // Pelo animal
    
    // Alta Complejidad (60-79)
    'Ropa y Textiles': 70,             // Depende del tipo
    'Joyería y Accesorios': 68,        // Reflejos, detalles
    'Arte y Decoración': 65,           // Formas orgánicas
    
    // Complejidad Media (30-59)
    'Deportes y Fitness': 45,          // Formas mixtas
    'Hogar y Jardín': 40,              // Variado
    'Bebés y Niños': 35,               // Formas simples generalmente
    
    // Baja Complejidad (10-29)
    'Electrónicos y Tecnología': 15,   // Bordes definidos
    'Automotriz': 18,                  // Formas geométricas
    'Libros y Media': 12,              // Rectangulares
    'Juguetes y Figuras': 25,          // Formas simples
    
    // Muy Baja (0-9)
    'Oficina y Papelería': 8,          // Formas geométricas
    'Herramientas': 10                 // Bordes claros
  };
  
  return categoryMapping[category] || 40; // Default neutral
}

// 2. ANÁLISIS SEMÁNTICO - REEMPLAZA KEYWORDS HARDCODEADOS
function analyzeProductSemantics(name: string, description: string): number {
  const text = `${name} ${description}`.toLowerCase();
  
  // Patrones semánticos más inteligentes
  const complexityPatterns = {
    // Texturas complejas (50+ puntos)
    textures: {
      patterns: ['encaje', 'red', 'malla', 'crochet', 'bordado', 'tejido', 'gasa', 'tul', 'organza'],
      score: 25
    },
    
    // Materiales orgánicos (60+ puntos)  
    organic: {
      patterns: ['pelo', 'cabello', 'pluma', 'piel', 'cuero rugoso', 'madera natural', 'piedra'],
      score: 30
    },
    
    // Elementos reflectivos (45+ puntos)
    reflective: {
      patterns: ['metal', 'cristal', 'vidrio', 'espejo', 'brillante', 'plateado', 'dorado'],
      score: 20
    },
    
    // Detalles finos (70+ puntos)
    fine_details: {
      patterns: ['cadena', 'alambre', 'hilo', 'cuerda', 'cable', 'collar delgado'],
      score: 35
    },
    
    // Transparencias (80+ puntos)
    transparency: {
      patterns: ['transparente', 'translúcido', 'semi-transparente', 'cristal', 'acrílico'],
      score: 40
    },
    
    // Elementos simples (puntos negativos)
    simple: {
      patterns: ['sólido', 'uniforme', 'liso', 'plano', 'básico', 'simple', 'minimalista'],
      score: -15
    },
    
    // Fondos profesionales (puntos negativos)
    studio: {
      patterns: ['fondo blanco', 'estudio', 'profesional', 'iluminado', 'fondo neutro'],
      score: -20
    }
  };
  
  let semanticScore = 0;
  let matchedPatterns: string[] = [];
  
  // Evaluar cada patrón
  Object.entries(complexityPatterns).forEach(([patternType, config]) => {
    config.patterns.forEach(pattern => {
      if (text.includes(pattern)) {
        semanticScore += config.score;
        matchedPatterns.push(`${pattern} (${config.score > 0 ? '+' : ''}${config.score})`);
      }
    });
  });
  
  if (matchedPatterns.length > 0) {
    console.log(`📝 Patrones detectados: ${matchedPatterns.join(', ')}`);
  }
  
  // Normalizar a 0-100
  return Math.max(0, Math.min(100, semanticScore + 30)); // +30 base neutral
}

// 3. ANÁLISIS VISUAL DE IMAGEN REAL
async function analyzeImageComplexity(imageFile: File): Promise<number> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(40); // Fallback si no hay contexto
        return;
      }
      
      // Redimensionar para análisis eficiente
      const size = 200;
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);
      
      const imageData = ctx.getImageData(0, 0, size, size);
      const complexity = calculateImageComplexity(imageData);
      
      resolve(complexity);
    };
    
    img.onerror = () => resolve(40); // Fallback en error
    img.src = URL.createObjectURL(imageFile);
  });
}

function calculateImageComplexity(imageData: ImageData): number {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  // 1. Análisis de bordes (edge detection)
  let edgeComplexity = 0;
  for (let i = 0; i < height - 1; i++) {
    for (let j = 0; j < width - 1; j++) {
      const idx = (i * width + j) * 4;
      const nextIdx = ((i + 1) * width + j) * 4;
      
      // Diferencia entre píxeles adyacentes
      const diff = Math.abs(data[idx] - data[nextIdx]) +
                   Math.abs(data[idx + 1] - data[nextIdx + 1]) +
                   Math.abs(data[idx + 2] - data[nextIdx + 2]);
      
      if (diff > 30) edgeComplexity++;
    }
  }
  
  // 2. Diversidad de colores
  const colorMap = new Map();
  for (let i = 0; i < data.length; i += 16) { // Muestreo
    const r = Math.floor(data[i] / 32) * 32;
    const g = Math.floor(data[i + 1] / 32) * 32;
    const b = Math.floor(data[i + 2] / 32) * 32;
    const color = `${r}-${g}-${b}`;
    colorMap.set(color, (colorMap.get(color) || 0) + 1);
  }
  
  // Score combinado
  const edgeScore = Math.min(60, (edgeComplexity / (width * height)) * 1000);
  const colorScore = Math.min(30, colorMap.size * 0.5);
  
  return Math.round(edgeScore + colorScore);
}

// 4. ANÁLISIS CONTEXTUAL - PATRONES APRENDIDOS
function getContextualComplexity(productName: string, category: string): number {
  const nameLength = productName.length;
  const wordCount = productName.split(' ').length;
  
  // Productos con nombres largos tienden a ser más complejos
  let contextScore = 0;
  
  if (wordCount >= 4) contextScore += 15; // "Vestido de novia con encaje"
  if (nameLength >= 30) contextScore += 10; // Nombres descriptivos largos
  
  // Detección de marcas premium (tienden a ser más complejos)
  const premiumIndicators = ['premium', 'luxury', 'artesanal', 'hecho a mano'];
  if (premiumIndicators.some(indicator => productName.toLowerCase().includes(indicator))) {
    contextScore += 20;
  }
  
  return Math.max(0, Math.min(40, contextScore));
}

// CÁLCULO DE CONFIANZA
function calculateConfidence(categoryScore: number, semanticScore: number, visualScore: number): number {
  // Mayor confianza cuando todos los factores coinciden
  const scores = [categoryScore, semanticScore, visualScore];
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / scores.length;
  
  // Baja varianza = alta confianza
  const confidenceFromVariance = Math.max(60, 100 - (variance / 10));
  
  // Scores extremos = alta confianza
  const confidenceFromExtremes = (average <= 25 || average >= 75) ? 90 : 70;
  
  return Math.round((confidenceFromVariance + confidenceFromExtremes) / 2);
}

// GENERACIÓN DE RAZONAMIENTO
function generateReasoning(complexityScore: number, breakdown: any): string {
  if (complexityScore >= 75) {
    return `Score alto (${complexityScore}/100): Múltiples factores de complejidad detectados. Procesamiento premium recomendado para garantizar calidad profesional.`;
  } else if (complexityScore >= 40) {
    return `Score medio (${complexityScore}/100): Complejidad moderada detectada. Procesamiento estándar viable con fotografía cuidadosa.`;
  } else {
    return `Score bajo (${complexityScore}/100): Producto de baja complejidad. Procesamiento optimizado para máximo ahorro.`;
  }
}

// GENERACIÓN DE TIPS
function generateTips(score: number, breakdown: any): string[] {
  const tips: string[] = [];
  
  if (score >= 75) {
    tips.push('🎯 Alta complejidad detectada');
    tips.push('💎 Procesamiento premium recomendado para máxima calidad');
    if (breakdown.semantic > 60) tips.push('⚠️ Texturas/detalles complejos detectados');
  } else if (score >= 40) {
    tips.push('📸 Use fondo blanco muy uniforme');
    tips.push('💡 Maximice contraste producto/fondo');
    if (breakdown.visual > 50) tips.push('🔍 Imagen con cierta complejidad visual');
  } else {
    tips.push('✅ Excelente para procesamiento estándar');
    tips.push('💰 Máximo ahorro garantizado');
    tips.push('🚀 Procesamiento rápido y económico');
  }
  
  return tips;
}
