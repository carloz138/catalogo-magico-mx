import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMarketplace, MarketplaceCatalog } from '@/hooks/useMarketplace';
import { useSubscribedProducts } from '@/hooks/useSubscribedProducts';
import { MarginModal } from '@/components/marketplace/MarginModal';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Store,
  Package,
  Search,
  CheckCircle,
  ExternalLink,
  Loader2,
  ShoppingBag,
  Sparkles,
  Building
} from 'lucide-react';

export default function Marketplace() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { catalogs, loading, subscribing, subscribeWithMargin, unsubscribeFromCatalog } = useMarketplace();
  const { products: subscribedProducts, productsByVendor, loading: loadingProducts, refetch: refetchProducts } = useSubscribedProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [marginModalCatalog, setMarginModalCatalog] = useState<MarketplaceCatalog | null>(null);

  // Filter catalogs by search
  const filteredCatalogs = catalogs.filter(catalog => {
    const query = searchQuery.toLowerCase();
    return (
      catalog.catalog_name.toLowerCase().includes(query) ||
      catalog.vendor_name.toLowerCase().includes(query) ||
      (catalog.catalog_description?.toLowerCase().includes(query) ?? false)
    );
  });

  const handleSubscribeClick = (catalog: MarketplaceCatalog) => {
    if (catalog.is_subscribed) {
      unsubscribeFromCatalog(catalog.catalog_id);
    } else {
      // Open margin modal for new subscriptions
      setMarginModalCatalog(catalog);
    }
  };

  const handleConfirmMargin = async (marginPercentage: number) => {
    if (!marginModalCatalog) return;
    
    const result = await subscribeWithMargin(marginModalCatalog.catalog_id, marginPercentage);
    if (result?.success) {
      setMarginModalCatalog(null);
      refetchProducts();
      // Navigate to products tab
      navigate('/marketplace?tab=products');
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
            <div className="text-2xl font-bold">{subscribedProducts.length}</div>
            <p className="text-sm text-muted-foreground">Productos sincronizados</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {Object.keys(productsByVendor).length}
            </div>
            <p className="text-sm text-muted-foreground">Proveedores activos</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="catalogs" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="catalogs" className="flex items-center gap-2">
            <Store className="w-4 h-4" />
            Catálogos
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Mis Productos
            {subscribedProducts.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {subscribedProducts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalogs" className="space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar catálogos o proveedores..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
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
                  onSubscribe={handleSubscribeClick}
                  isSubscribing={subscribing === catalog.catalog_id}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          {loadingProducts ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-square w-full" />
                  <CardContent className="p-3">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : subscribedProducts.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Sin productos sincronizados</h3>
              <p className="text-muted-foreground mb-6">
                Suscríbete a catálogos para sincronizar productos automáticamente
              </p>
              <Button onClick={() => document.querySelector('[value="catalogs"]')?.dispatchEvent(new Event('click'))}>
                <Store className="w-4 h-4 mr-2" />
                Ver Catálogos
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(productsByVendor).map(([vendorName, products]) => (
                <div key={vendorName}>
                  <div className="flex items-center gap-2 mb-4">
                    <Building className="w-5 h-5 text-muted-foreground" />
                    <h3 className="font-semibold text-lg">{vendorName}</h3>
                    <Badge variant="outline" className="ml-2">
                      {products.length} productos
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {products.map((product) => (
                      <SubscribedProductCard key={product.product_id} product={product} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Margin Modal */}
      <MarginModal
        open={!!marginModalCatalog}
        onOpenChange={(open) => !open && setMarginModalCatalog(null)}
        catalogName={marginModalCatalog?.catalog_name || ''}
        onConfirm={handleConfirmMargin}
        isLoading={!!subscribing}
      />
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

// Subscribed Product Card with Vendor Badge
interface SubscribedProductCardProps {
  product: {
    product_id: string;
    product_name: string;
    product_sku: string | null;
    price_retail: number | null;
    category: string | null;
    image_url: string | null;
    vendor_name: string;
    catalog_name: string;
  };
}

function SubscribedProductCard({ product }: SubscribedProductCardProps) {
  const price = product.price_retail ? product.price_retail / 100 : 0;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow group">
      <div className="aspect-square bg-muted relative overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.product_name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        
        {/* Vendor Badge */}
        <Badge 
          variant="secondary" 
          className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 bg-background/90 backdrop-blur-sm"
        >
          <Building className="w-3 h-3 mr-1" />
          {product.vendor_name}
        </Badge>
      </div>

      <CardContent className="p-3">
        <h4 className="font-medium text-sm line-clamp-2 mb-1">{product.product_name}</h4>
        
        <div className="flex items-center justify-between">
          <span className="font-bold text-primary">${price.toFixed(2)}</span>
          {product.category && (
            <Badge variant="outline" className="text-[10px]">
              {product.category}
            </Badge>
          )}
        </div>
        
        {product.product_sku && (
          <p className="text-xs text-muted-foreground mt-1">SKU: {product.product_sku}</p>
        )}
      </CardContent>
    </Card>
  );
}
