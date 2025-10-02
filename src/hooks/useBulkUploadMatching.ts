import { useState, useCallback } from 'react';
import Fuse from 'fuse.js';
import { CSVProduct, ImageFile, ProductMatch } from '@/types/bulk-upload';

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
    
    // 1. Exact match by SKU
    const exactSKU = csvProducts.find(p => 
      p.sku.toLowerCase() === cleanName.toLowerCase()
    );
    if (exactSKU) {
      return {
        image,
        csvData: exactSKU,
        matchScore: 100,
        matchType: 'exact'
      };
    }

    // 2. Contains match
    const containsMatch = csvProducts.find(p => {
      const sku = p.sku.toLowerCase();
      const nombre = p.nombre.toLowerCase();
      return cleanName.includes(sku) || sku.includes(cleanName) ||
             cleanName.includes(nombre) || nombre.includes(cleanName);
    });
    if (containsMatch) {
      return {
        image,
        csvData: containsMatch,
        matchScore: 85,
        matchType: 'contains'
      };
    }

    // 3. Fuzzy match
    const fuse = new Fuse(csvProducts, {
      keys: ['sku', 'nombre'],
      threshold: 0.3, // Lower is stricter (0.3 = 70% similarity)
      includeScore: true
    });

    const fuzzyResults = fuse.search(cleanName);
    if (fuzzyResults.length > 0 && fuzzyResults[0].score && fuzzyResults[0].score < 0.3) {
      return {
        image,
        csvData: fuzzyResults[0].item,
        matchScore: Math.round((1 - fuzzyResults[0].score) * 100),
        matchType: 'fuzzy'
      };
    }

    // No match
    return {
      image,
      csvData: null,
      matchScore: 0,
      matchType: 'none'
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
    processMatches,
    getStats,
    cleanFileName
  };
};
