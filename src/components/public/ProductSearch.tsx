import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ProductSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
  placeholder?: string;
}

export default function ProductSearch({
  query,
  onQueryChange,
  placeholder = 'Buscar productos...',
}: ProductSearchProps) {
  const handleClear = () => {
    onQueryChange('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="pl-10 pr-10"
      />
      {query && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
