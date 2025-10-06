import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { QuoteService } from '@/services/quote.service';
import { Quote, QuoteItem } from '@/types/digital-catalog';
import { useToast } from '@/hooks/use-toast';

export function useQuoteDetail(quoteId: string | null) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [quote, setQuote] = useState<(Quote & { items: QuoteItem[]; catalog: any }) | null>(null);
  const [loading, setLoading] = useState(false);

  const loadQuote = async () => {
    if (!user || !quoteId) return;
    
    setLoading(true);
    try {
      const data = await QuoteService.getQuoteDetail(quoteId, user.id);
      setQuote(data);
    } catch (error) {
      console.error('Error loading quote detail:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el detalle de la cotización',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (quoteId && user) {
      loadQuote();
    }
  }, [quoteId, user]);

  return {
    quote,
    loading,
    refetch: loadQuote,
  };
}
