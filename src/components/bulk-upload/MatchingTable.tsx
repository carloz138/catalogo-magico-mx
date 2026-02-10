import { useState } from 'react';
import { ProductMatch, CSVProduct } from '@/types/bulk-upload';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, XCircle, AlertCircle, Image as ImageIcon, Edit2, Check, X } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface MatchingTableProps {
  matches: ProductMatch[];
  csvProducts?: CSVProduct[];
  onRenameImage?: (imageIndex: number, newName: string) => void;
  onManualMatch?: (imageIndex: number, product: CSVProduct) => void;
}

export const MatchingTable = ({ matches, csvProducts = [], onRenameImage, onManualMatch }: MatchingTableProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  const getMatchIcon = (match: ProductMatch) => {
    if (match.matchType === 'none') return <XCircle className="h-4 w-4 text-destructive" />;
    if (match.matchType === 'fuzzy') return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  };

  const getMatchBadge = (match: ProductMatch, isManual: boolean) => {
    const score = match.matchScore;
    let variant: "default" | "destructive" | "secondary" | "outline" = "outline";
    let className = "";
    let tooltipText = "";

    if (match.matchType === 'none') {
      variant = 'destructive';
      tooltipText = "No se encontró coincidencia";
    } else if (match.matchType === 'exact') {
      variant = 'default';
      className = "bg-green-600 hover:bg-green-700 text-white";
      tooltipText = isManual ? "Match manual" : "Match exacto por SKU";
    } else if (match.matchType === 'contains') {
      variant = 'secondary';
      className = score >= 80 ? "bg-green-500/80 text-white" : "bg-blue-500/80 text-white";
      tooltipText = "Nombre contiene SKU o nombre del producto";
    } else if (score >= 80) {
      variant = 'default';
      className = "bg-blue-600 hover:bg-blue-700 text-white";
      tooltipText = "Match por similitud textual";
    } else if (score >= 70) {
      variant = 'secondary';
      tooltipText = "Match por similitud textual (aceptable)";
    } else if (score >= 50) {
      variant = 'outline';
      className = "border-yellow-500 text-yellow-700 dark:text-yellow-400";
      tooltipText = "Match débil por similitud";
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5">
              {getMatchIcon(match)}
              <Badge variant={variant} className={className}>
                {match.matchType === 'none' ? 'Sin match' : `${match.matchScore}%`}
              </Badge>
              {isManual && <Badge variant="outline" className="text-[10px]">Manual</Badge>}
            </div>
          </TooltipTrigger>
          <TooltipContent><p>{tooltipText}</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[70vh] overflow-y-auto p-1">
      {matches.map((match, idx) => {
        const isManualMatch = match.matchType === 'exact' && match.matchScore === 100 && match.csvData !== null;
        const hasLowMatch = match.matchScore < 90 && csvProducts.length > 0;

        return (
          <Card
            key={idx}
            className={`overflow-hidden flex flex-col ${!match.csvData ? 'border-destructive/40 bg-destructive/5' : 'border-border'}`}
          >
            {/* Image */}
            <div className="relative aspect-square bg-muted">
              <img
                src={match.image.preview}
                alt={match.image.file.name}
                className="w-full h-full object-cover"
              />
              {/* Match badge overlay */}
              <div className="absolute top-1.5 left-1.5">
                {getMatchBadge(match, isManualMatch)}
              </div>
              {/* Image count */}
              {(match.secondaryImages?.length || 0) > 0 && (
                <div className="absolute top-1.5 right-1.5 bg-background/80 backdrop-blur-sm rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
                  <ImageIcon className="h-3 w-3" />
                  <span className="text-[10px] font-medium">{1 + (match.secondaryImages?.length || 0)}</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-2 flex-1 flex flex-col gap-1.5 min-w-0">
              {/* File name / rename */}
              {editingIndex === idx ? (
                <div className="flex items-center gap-1">
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="h-6 text-[10px] font-mono px-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { onRenameImage?.(idx, editingName); setEditingIndex(null); }
                      if (e.key === 'Escape') setEditingIndex(null);
                    }}
                  />
                  <Button size="icon" variant="ghost" className="h-5 w-5 shrink-0" onClick={() => { onRenameImage?.(idx, editingName); setEditingIndex(null); }}>
                    <Check className="h-3 w-3 text-green-600" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-5 w-5 shrink-0" onClick={() => setEditingIndex(null)}>
                    <X className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ) : (
                <button
                  className="text-[10px] font-mono text-muted-foreground truncate text-left hover:text-foreground flex items-center gap-1"
                  onClick={() => { setEditingIndex(idx); setEditingName(match.image.cleanName); }}
                >
                  <Edit2 className="h-2.5 w-2.5 shrink-0" />
                  <span className="truncate">{match.image.file.name}</span>
                </button>
              )}

              {/* Matched product info */}
              {match.csvData ? (
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{match.csvData.nombre}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>SKU: {match.csvData.sku}</span>
                    <span className="font-semibold text-foreground">${match.csvData.precio}</span>
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground">Sin coincidencia</p>
              )}

              {/* Manual match selector */}
              {hasLowMatch && (
                <Select
                  value={match.csvData?.sku || ''}
                  onValueChange={(sku) => {
                    const product = csvProducts.find(p => p.sku === sku);
                    if (product) onManualMatch?.(idx, product);
                  }}
                >
                  <SelectTrigger className="h-7 text-[10px] w-full">
                    <SelectValue placeholder="Asignar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {csvProducts.map((product) => (
                      <SelectItem key={product.sku} value={product.sku} className="text-xs">
                        {product.sku} - {product.nombre.substring(0, 25)}{product.nombre.length > 25 ? '…' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};
