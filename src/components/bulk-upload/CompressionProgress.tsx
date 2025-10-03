import { Progress } from '@/components/ui/progress';
import { Loader2, Image as ImageIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface CompressionProgressProps {
  current: number;
  total: number;
  fileName: string;
  percentage: number;
}

export const CompressionProgress = ({ current, total, fileName, percentage }: CompressionProgressProps) => {
  return (
    <Card className="p-4 bg-primary/5 border-primary/20">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="font-medium text-sm">Optimizando imágenes...</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {current} / {total}
          </span>
        </div>
        
        <Progress value={percentage} className="h-2" />
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ImageIcon className="h-3 w-3" />
          <span className="truncate">{fileName}</span>
        </div>
      </div>
    </Card>
  );
};
