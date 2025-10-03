import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DuplicateInfo } from '@/hooks/useDuplicateDetection';

interface DuplicateWarningProps {
  duplicates: DuplicateInfo[];
  onContinue: () => void;
  onCancel: () => void;
}

export const DuplicateWarning = ({ duplicates, onContinue, onCancel }: DuplicateWarningProps) => {
  return (
    <Alert className="border-yellow-500/50 bg-yellow-500/10">
      <AlertTriangle className="h-5 w-5 text-yellow-600" />
      <AlertTitle className="text-lg font-semibold mb-2">
        Se detectaron {duplicates.length} producto{duplicates.length > 1 ? 's' : ''} duplicado{duplicates.length > 1 ? 's' : ''}
      </AlertTitle>
      <AlertDescription>
        <div className="space-y-3">
          <p className="text-sm">
            Los siguientes SKUs ya existen en tu catálogo:
          </p>
          
          <div className="max-h-32 overflow-y-auto bg-background/50 rounded p-2 space-y-1">
            {duplicates.slice(0, 10).map((dup, idx) => (
              <div key={idx} className="text-xs font-mono">
                • {dup.sku} {dup.productName && `(${dup.productName})`}
              </div>
            ))}
            {duplicates.length > 10 && (
              <div className="text-xs text-muted-foreground">
                ... y {duplicates.length - 10} más
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onContinue}
              className="flex-1"
            >
              Omitir duplicados y continuar
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Al continuar, solo se subirán los productos con SKUs únicos.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
};
