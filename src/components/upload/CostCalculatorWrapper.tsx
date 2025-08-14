
import React from 'react';
import { CostCalculator } from './CostCalculator';

export interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  url?: string;
  analysis?: any;
  productData?: any;
}

interface CostCalculatorWrapperProps {
  files: UploadedFile[];
}

export const CostCalculatorWrapper = ({ files }: CostCalculatorWrapperProps) => {
  const productCount = files.length;
  const creditsPerProduct = 1; // Default credits per product
  const userCredits = 100; // Mock user credits - this should come from user context

  const handleProcessCatalog = () => {
    console.log('Processing catalog...');
    // Implementation for processing catalog
  };

  const handleBuyCredits = () => {
    console.log('Buying credits...');
    // Implementation for buying credits
  };

  return (
    <CostCalculator
      productCount={productCount}
      creditsPerProduct={creditsPerProduct}
      userCredits={userCredits}
      onProcessCatalog={handleProcessCatalog}
      onBuyCredits={handleBuyCredits}
      processing={false}
    />
  );
};
