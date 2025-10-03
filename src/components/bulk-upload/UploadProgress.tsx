import { Progress } from '@/components/ui/progress';
import { UploadProgress as UploadProgressType } from '@/types/bulk-upload';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface UploadProgressProps {
  progress: UploadProgressType;
}

export const UploadProgress = ({ progress }: UploadProgressProps) => {
  const percentage = Math.round((progress.uploaded / progress.total) * 100);
  const isComplete = progress.uploaded === progress.total;

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isComplete ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          )}
          <span className="font-medium">
            {isComplete ? 'Carga completa' : 'Subiendo productos...'}
          </span>
        </div>
        <span className="text-sm text-muted-foreground">
          {progress.uploaded} / {progress.total}
        </span>
      </div>

      <Progress value={percentage} className="h-2" />

      {!isComplete && progress.uploaded > 0 && (
        <div className="text-xs text-muted-foreground">
          <span>
            Velocidad: ~{Math.round((progress.uploaded / Math.max(progress.uploaded, 1)) * 60)} productos/min
          </span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span>Exitosos: {progress.uploaded}</span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-destructive" />
          <span>Fallidos: {progress.failed}</span>
        </div>
        <div className="text-muted-foreground">
          {!isComplete && `Actual: ${progress.current}`}
        </div>
      </div>
      
      {progress.retrying && (
        <div className="flex items-center gap-2 text-xs text-yellow-600 mt-2 p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Reintentando conexión...</span>
        </div>
      )}
    </div>
  );
};
