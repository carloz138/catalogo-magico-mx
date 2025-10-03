import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CSVProduct } from '@/types/bulk-upload';

export interface DuplicateInfo {
  sku: string;
  existsInDB: boolean;
  productName?: string;
}

export const useDuplicateDetection = () => {
  const [duplicates, setDuplicates] = useState<DuplicateInfo[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  const checkDuplicates = async (products: CSVProduct[]): Promise<DuplicateInfo[]> => {
    setIsChecking(true);
    
    const skus = products.map(p => p.sku);
    
    const { data: existingProducts, error } = await supabase
      .from('products')
      .select('sku, name')
      .in('sku', skus);

    if (error) {
      console.error('Error checking duplicates:', error);
      setIsChecking(false);
      return [];
    }

    const existingSkus = new Set(existingProducts?.map(p => p.sku) || []);
    
    const duplicateInfo: DuplicateInfo[] = products
      .filter(p => existingSkus.has(p.sku))
      .map(p => {
        const existing = existingProducts?.find(ep => ep.sku === p.sku);
        return {
          sku: p.sku,
          existsInDB: true,
          productName: existing?.name
        };
      });

    setDuplicates(duplicateInfo);
    setIsChecking(false);
    return duplicateInfo;
  };

  return {
    duplicates,
    checkDuplicates,
    isChecking
  };
};
