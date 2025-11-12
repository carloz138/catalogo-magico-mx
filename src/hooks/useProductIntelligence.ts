import { useState } from 'react';
import { generateSmartTags } from '@/lib/ai/smartProductUtils';
import { toast } from 'sonner';

export const useProductIntelligence = () => {
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);

  // Función para analizar texto y generar sugerencias
  const analyzeTags = (name: string, description: string = "") => {
    const combinedText = `${name} ${description}`;
    const tags = generateSmartTags(combinedText);
    
    setSuggestedTags(tags);
    
    if (tags.length > 0) {
      // Opcional: Feedback visual sutil
      console.log("Tags generados:", tags);
    } else {
      toast.info("Escribe un nombre más descriptivo para generar tags.");
    }
  };

  return {
    suggestedTags,
    analyzeTags,
    clearSuggestions: () => setSuggestedTags([])
  };
};
