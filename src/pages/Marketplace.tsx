import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMarketplace, MarketplaceCatalog } from '@/hooks/useMarketplace';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Store,
  Package,
  Search,
  CheckCircle,
  Plus,
  ExternalLink,
  Loader2,
  ShoppingBag,
  Sparkles
} from 'lucide-react';

export default function Marketplace() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { catalogs, loading, subscribing, subscribeToCatalog, unsubscribeFromCatalog } = useMarketplace();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter catalogs by search
  const filteredCatalogs = catalogs.filter(catalog => {
    const query = searchQuery.toLowerCase();
    return (
      catalog.catalog_name.toLowerCase().includes(query) ||
      catalog.vendor_name.toLowerCase().includes(query) ||
      (catalog.catalog_description?.toLowerCase().includes(query) ?? false)
    );
  });

  const handleSubscribe = async (catalog: MarketplaceCatalog) => {
    if (catalog.is_subscribed) {
      await unsubscribeFromCatalog(catalog.catalog_id);
    } else {
      await subscribeToCatalog(catalog.catalog_id);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <Store className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Inicia sesión para explorar</h2>
        <p className="text-muted-foreground mb-6">
          Necesitas una cuenta para suscribirte a catálogos y vender productos
        </p>
        <Button onClick={() => navigate('/login')}>Iniciar Sesión</Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Marketplace de Catálogos</h1>
            <p className="text-muted-foreground">
              Descubre catálogos de proveedores y empieza a vender sus productos
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar catálogos o proveedores..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{catalogs.length}</div>
            <p className="text-sm text-muted-foreground">Catálogos disponibles</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{catalogs.filter(c => c.is_subscribed).length}</div>
            <p className="text-sm text-muted-foreground">Mis suscripciones</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {catalogs.reduce((sum, c) => sum + c.product_count, 0)}
            </div>
            <p className="text-sm text-muted-foreground">Productos totales</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {new Set(catalogs.map(c => c.vendor_id)).size}
            </div>
            <p className="text-sm text-muted-foreground">Proveedores</p>
          </CardContent>
        </Card>
      </div>

      {/* Catalogs Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-40 w-full" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : filteredCatalogs.length === 0 ? (
        <div className="text-center py-16">
          <Store className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            {searchQuery ? 'Sin resultados' : 'No hay catálogos disponibles'}
          </h3>
          <p className="text-muted-foreground">
            {searchQuery 
              ? 'Intenta con otros términos de búsqueda' 
              : 'Los proveedores aún no han publicado catálogos para distribuir'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCatalogs.map((catalog) => (
            <CatalogCard
              key={catalog.catalog_id}
              catalog={catalog}
              onSubscribe={handleSubscribe}
              isSubscribing={subscribing === catalog.catalog_id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CatalogCardProps {
  catalog: MarketplaceCatalog;
  onSubscribe: (catalog: MarketplaceCatalog) => void;
  isSubscribing: boolean;
}

function CatalogCard({ catalog, onSubscribe, isSubscribing }: CatalogCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
      {/* Cover Image / Gradient */}
      <div className="h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-background relative">
        {/* Vendor Logo */}
        <div className="absolute -bottom-6 left-4">
          <Avatar className="w-14 h-14 border-4 border-background shadow-md">
            <AvatarImage src={catalog.vendor_logo || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
              {catalog.vendor_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        
        {/* Subscribed Badge */}
        {catalog.is_subscribed && (
          <Badge className="absolute top-3 right-3 bg-emerald-500 hover:bg-emerald-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Suscrito
          </Badge>
        )}
      </div>

      <CardHeader className="pt-8 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{catalog.catalog_name}</h3>
            <p className="text-sm text-muted-foreground truncate">{catalog.vendor_name}</p>
          </div>
        </div>
        
        {catalog.catalog_description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
            {catalog.catalog_description}
          </p>
        )}
      </CardHeader>

      <CardContent className="pb-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Package className="w-4 h-4" />
            <span>{catalog.product_count} productos</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0 gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => window.open(`/c/${catalog.catalog_slug}`, '_blank')}
        >
          <ExternalLink className="w-4 h-4 mr-1" />
          Ver
        </Button>
        
        <Button
          size="sm"
          className="flex-1"
          variant={catalog.is_subscribed ? "secondary" : "default"}
          onClick={() => onSubscribe(catalog)}
          disabled={isSubscribing}
        >
          {isSubscribing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : catalog.is_subscribed ? (
            <>
              <CheckCircle className="w-4 h-4 mr-1" />
              Suscrito
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-1" />
              Vender
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
