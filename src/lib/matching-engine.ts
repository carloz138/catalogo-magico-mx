import stringSimilarity from 'string-similarity';
import { distance as levenshteinDistance } from 'fastest-levenshtein';

interface MatchResult {
  score: number;
  confidence: 'high' | 'medium' | 'low' | 'none';
  method: 'exact' | 'dice' | 'levenshtein' | 'contains';
}

class ProductMatcher {
  private weights = {
    sku: 0.5,      // Mayor peso - más confiable
    name: 0.3,     // Peso medio
    combined: 0.2  // Peso menor - búsqueda general
  };

  // Normalizar texto para comparación
  private normalize(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, ' ')           // Quitar caracteres especiales
      .replace(/\s+/g, ' ')               // Comprimir espacios
      .replace(/\b(the|a|an|el|la|los|las)\b/g, '') // Quitar artículos
      .trim();
  }

  // Expandir abreviaciones comunes
  private expandAbbreviations(text: string): string {
    const abbreviations: Record<string, string> = {
      'ml': 'milliliter',
      'oz': 'ounce',
      'kg': 'kilogram',
      'gr': 'gram',
      'cm': 'centimeter',
      'm': 'metro',
      'l': 'liter'
    };

    let expanded = text;
    Object.entries(abbreviations).forEach(([abbr, full]) => {
      const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
      expanded = expanded.replace(regex, full);
    });

    return expanded;
  }

  // Match exacto por SKU
  private exactMatch(cleanImageName: string, productSku: string): MatchResult | null {
    const normalizedImage = this.normalize(cleanImageName);
    const normalizedSku = this.normalize(productSku);

    if (normalizedImage === normalizedSku) {
      return {
        score: 1.0,
        confidence: 'high',
        method: 'exact'
      };
    }

    return null;
  }

  // Match por contains
  private containsMatch(cleanImageName: string, productSku: string, productName: string): MatchResult | null {
    const normalizedImage = this.normalize(cleanImageName);
    const normalizedSku = this.normalize(productSku);
    const normalizedName = this.normalize(productName);

    const imageContainsSku = normalizedImage.includes(normalizedSku);
    const skuContainsImage = normalizedSku.includes(normalizedImage);
    const imageContainsName = normalizedImage.includes(normalizedName);
    const nameContainsImage = normalizedName.includes(normalizedImage);

    if (imageContainsSku || skuContainsImage) {
      return {
        score: 0.85,
        confidence: 'high',
        method: 'contains'
      };
    }

    if (imageContainsName || nameContainsImage) {
      return {
        score: 0.75,
        confidence: 'medium',
        method: 'contains'
      };
    }

    return null;
  }

  // Dice coefficient (string-similarity)
  private diceMatch(text1: string, text2: string): number {
    const normalized1 = this.expandAbbreviations(this.normalize(text1));
    const normalized2 = this.expandAbbreviations(this.normalize(text2));
    
    return stringSimilarity.compareTwoStrings(normalized1, normalized2);
  }

  // Levenshtein distance (normalizado 0-1)
  private levenshteinMatch(text1: string, text2: string): number {
    const normalized1 = this.normalize(text1);
    const normalized2 = this.normalize(text2);
    
    const distance = levenshteinDistance(normalized1, normalized2);
    const maxLength = Math.max(normalized1.length, normalized2.length);
    
    if (maxLength === 0) return 0;
    
    return 1 - (distance / maxLength);
  }

  // Calcular score combinado con pesos
  private calculateWeightedScore(
    cleanImageName: string,
    productSku: string,
    productName: string
  ): number {
    let totalScore = 0;
    let totalWeight = 0;

    // Score por SKU (Dice + Levenshtein promediados)
    const skuDice = this.diceMatch(cleanImageName, productSku);
    const skuLev = this.levenshteinMatch(cleanImageName, productSku);
    const skuScore = (skuDice * 0.6) + (skuLev * 0.4);
    
    totalScore += skuScore * this.weights.sku;
    totalWeight += this.weights.sku;

    // Score por nombre
    const nameDice = this.diceMatch(cleanImageName, productName);
    const nameLev = this.levenshteinMatch(cleanImageName, productName);
    const nameScore = (nameDice * 0.6) + (nameLev * 0.4);
    
    totalScore += nameScore * this.weights.name;
    totalWeight += this.weights.name;

    // Score combinado (imagen vs SKU+Nombre concatenado)
    const combined = `${productSku} ${productName}`;
    const combinedScore = this.diceMatch(cleanImageName, combined);
    
    totalScore += combinedScore * this.weights.combined;
    totalWeight += this.weights.combined;

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  // Determinar nivel de confianza
  private getConfidence(score: number): 'high' | 'medium' | 'low' | 'none' {
    if (score >= 0.90) return 'high';
    if (score >= 0.70) return 'medium';
    if (score >= 0.50) return 'low';
    return 'none';
  }

  // Función principal de matching
  public match(
    cleanImageName: string,
    products: Array<{ sku: string; nombre: string }>
  ): Array<{ product: any; score: number; confidence: string; method: string }> {
    const results: Array<{ product: any; score: number; confidence: string; method: string }> = [];

    for (const product of products) {
      // 1. Intentar match exacto
      const exact = this.exactMatch(cleanImageName, product.sku);
      if (exact) {
        results.push({
          product,
          score: exact.score,
          confidence: exact.confidence,
          method: exact.method
        });
        continue;
      }

      // 2. Intentar contains
      const contains = this.containsMatch(cleanImageName, product.sku, product.nombre);
      if (contains) {
        results.push({
          product,
          score: contains.score,
          confidence: contains.confidence,
          method: contains.method
        });
        continue;
      }

      // 3. Calcular weighted score
      const score = this.calculateWeightedScore(cleanImageName, product.sku, product.nombre);
      const confidence = this.getConfidence(score);

      if (score >= 0.50) { // Solo incluir si tiene al menos 50% de match
        results.push({
          product,
          score,
          confidence,
          method: score >= 0.80 ? 'dice' : 'levenshtein'
        });
      }
    }

    // Ordenar por score descendente
    return results.sort((a, b) => b.score - a.score);
  }
}

export const productMatcher = new ProductMatcher();
