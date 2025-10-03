import { useState } from 'react';
import { ProductMatch, CSVProduct } from '@/types/bulk-upload';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, XCircle, AlertCircle, Image as ImageIcon, Edit2, Check, X } from 'lucide-react';

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
    if (match.matchType === 'none') {
      return <XCircle className="h-4 w-4 text-destructive" />;
    }
    if (match.matchType === 'fuzzy') {
      return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
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
      className = score >= 80 ? "bg-green-500/80 hover:bg-green-600/80 text-white" : "bg-blue-500/80 hover:bg-blue-600/80 text-white";
      tooltipText = "Nombre contiene SKU o nombre del producto";
    } else if (score >= 80) {
      variant = 'default';
      className = "bg-blue-600 hover:bg-blue-700 text-white";
      tooltipText = "Match por similitud textual (Dice coefficient)";
    } else if (score >= 70) {
      variant = 'secondary';
      tooltipText = "Match por similitud textual (aceptable)";
    } else if (score >= 50) {
      variant = 'outline';
      className = "border-yellow-500 text-yellow-700 dark:text-yellow-400";
      tooltipText = "Match débil por similitud (Levenshtein)";
    }
    
    return (
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant={variant} className={className}>
                {match.matchType === 'none' ? 'Sin match' : `${match.matchScore}%`}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{tooltipText}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {isManual && (
          <Badge variant="outline" className="text-xs">
            Manual
          </Badge>
        )}
      </div>
    );
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="max-h-96 overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background">
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead className="w-20">Imagen</TableHead>
              <TableHead>Archivo</TableHead>
              <TableHead>Match</TableHead>
              <TableHead>Producto CSV</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Precio Mayoreo</TableHead>
              <TableHead className="text-center">Imágenes</TableHead>
              <TableHead>Selección Manual</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matches.map((match, idx) => {
              const isManualMatch = match.matchType === 'exact' && match.matchScore === 100 && match.csvData !== null;
              
              return (
                <TableRow key={idx} className={match.csvData ? '' : 'bg-destructive/5'}>
                  <TableCell>
                    {getMatchIcon(match)}
                  </TableCell>
                  <TableCell>
                    <img
                      src={match.image.preview}
                      alt={match.image.file.name}
                      className="w-12 h-12 object-cover rounded border"
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {editingIndex === idx ? (
                      <div className="flex items-center gap-1">
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="h-7 text-xs font-mono"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              onRenameImage?.(idx, editingName);
                              setEditingIndex(null);
                            }
                            if (e.key === 'Escape') {
                              setEditingIndex(null);
                            }
                          }}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => {
                            onRenameImage?.(idx, editingName);
                            setEditingIndex(null);
                          }}
                        >
                          <Check className="h-3 w-3 text-green-600" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => setEditingIndex(null)}
                        >
                          <X className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>{match.image.file.name}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 opacity-50 hover:opacity-100"
                          onClick={() => {
                            setEditingIndex(idx);
                            setEditingName(match.image.cleanName);
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {getMatchBadge(match, isManualMatch)}
                  </TableCell>
                <TableCell>
                  {match.csvData ? (
                    <div>
                      <p className="font-medium text-sm">{match.csvData.nombre}</p>
                      <p className="text-xs text-muted-foreground">SKU: {match.csvData.sku}</p>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">No encontrado</span>
                  )}
                </TableCell>
                <TableCell>
                  {match.csvData ? (
                    <span className="font-medium">${match.csvData.precio}</span>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  {match.csvData?.precio_mayoreo ? (
                    <span className="font-medium text-muted-foreground">${match.csvData.precio_mayoreo}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <ImageIcon className="h-3 w-3" />
                      <span className="text-sm">
                        {1 + (match.secondaryImages?.length || 0)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {match.matchScore < 90 && csvProducts.length > 0 ? (
                      <Select
                        value={match.csvData?.sku || ''}
                        onValueChange={(sku) => {
                          const product = csvProducts.find(p => p.sku === sku);
                          if (product) {
                            onManualMatch?.(idx, product);
                          }
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs w-full">
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {csvProducts.map((product) => (
                            <SelectItem key={product.sku} value={product.sku}>
                              {product.sku} - {product.nombre.substring(0, 30)}{product.nombre.length > 30 ? '...' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : match.matchScore >= 90 ? (
                      <span className="text-xs text-muted-foreground">Auto-match OK</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin CSV</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
