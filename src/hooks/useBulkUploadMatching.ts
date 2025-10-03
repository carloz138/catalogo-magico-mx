import { useState, useCallback } from 'react';
import { CSVProduct, ImageFile, ProductMatch } from '@/types/bulk-upload';
import { productMatcher } from '@/lib/matching-engine';

export const useBulkUploadMatching = () => {
  const [matches, setMatches] = useState<ProductMatch[]>([]);

  const cleanFileName = (fileName: string): string => {
    // Remove extension
    const withoutExt = fileName.replace(/\.[^/.]+$/, '');
    // Remove common prefixes/suffixes and special chars
    return withoutExt
      .replace(/^(foto_|img_|image_|producto_)/i, '')
      .replace(/(_\d+|_[a-z])$/i, '')
      .replace(/[_-]/g, ' ')
      .toLowerCase()
      .trim();
  };

  const findMatch = useCallback((image: ImageFile, csvProducts: CSVProduct[]): ProductMatch => {
    const cleanName = image.cleanName;
    
    // Usar el nuevo motor de matching
    const matches = productMatcher.match(cleanName, csvProducts);
    
    if (matches.length === 0) {
      return {
        image,
        csvData: null,
        matchScore: 0,
        matchType: 'none'
      };
    }

    // Tomar el mejor match
    const bestMatch = matches[0];
    
    return {
      image,
      csvData: bestMatch.product,
      matchScore: Math.round(bestMatch.score * 100),
      matchType: bestMatch.method as 'exact' | 'contains' | 'fuzzy' | 'none'
    };
  }, []);

  const processMatches = useCallback((images: ImageFile[], csvProducts: CSVProduct[]) => {
    const primaryImages: ImageFile[] = [];
    const secondaryImages: Map<string, ImageFile[]> = new Map();

    // Separate primary and secondary images
    images.forEach(img => {
      const match = img.cleanName.match(/(.+?)(_\d+|_[a-z])$/);
      if (match) {
        const baseName = match[1];
        if (!secondaryImages.has(baseName)) {
          secondaryImages.set(baseName, []);
        }
        secondaryImages.get(baseName)!.push(img);
      } else {
        primaryImages.push(img);
      }
    });

    // Match primary images
    const productMatches: ProductMatch[] = primaryImages.map(img => {
      const match = findMatch(img, csvProducts);
      
      // Check for secondary images
      const baseName = img.cleanName;
      const secondary = secondaryImages.get(baseName) || [];
      
      return {
        ...match,
        secondaryImages: secondary.length > 0 ? secondary : undefined
      };
    });

    setMatches(productMatches);
    return productMatches;
  }, [findMatch]);

  const getStats = useCallback(() => {
    const matched = matches.filter(m => m.csvData !== null).length;
    const unmatched = matches.filter(m => m.csvData === null).length;
    const withSecondary = matches.filter(m => m.secondaryImages && m.secondaryImages.length > 0).length;

    return { matched, unmatched, total: matches.length, withSecondary };
  }, [matches]);

  return {
    matches,
    setMatches,
    processMatches,
    getStats,
    cleanFileName
  };
};
