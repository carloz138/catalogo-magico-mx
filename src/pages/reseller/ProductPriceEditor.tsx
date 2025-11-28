import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ResellerPriceService, ProductWithCustomPrice } from "@/services/reseller-price.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ArrowLeft,
  Save,
  Package,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Info,
  Percent,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BulkPriceMarginModal } from "@/components/reseller/BulkPriceMarginModal";

export default function ProductPriceEditor() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const catalogId = searchParams.get("catalog_id");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<ProductWithCustomPrice[]>([]);
  const [changes, setChanges] = useState<Map<string, any>>(new Map());
  const [showMarginModal, setShowMarginModal] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user || !catalogId) {
      navigate("/");
      return;
    }
    loadProducts();
  }, [user, catalogId]);

  const loadProducts = async () => {
    if (!user?.id || !catalogId) return;

    setLoading(true);
    try {
      const data = await ResellerPriceService.getProductsWithPrices(catalogId, user.id);
      setProducts(data);
    } catch (error: any) {
      console.error("Error loading products:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los productos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (itemId: string, field: string, value: string, isVariant: boolean) => {
    const numValue = parseFloat(value) * 100; // Convertir a centavos

    if (isNaN(numValue) || numValue < 0) return;

    setChanges((prev) => {
      const newChanges = new Map(prev);
      const existing = newChanges.get(itemId) || {};
      newChanges.set(itemId, {
        ...existing,
        [field]: numValue,
        isVariant,
      });
      return newChanges;
    });
  };

  const handleStockChange = (itemId: string, inStock: boolean, isVariant: boolean) => {
    setChanges((prev) => {
      const newChanges = new Map(prev);
      const existing = newChanges.get(itemId) || {};
      newChanges.set(itemId, {
        ...existing,
        is_in_stock: inStock,
        isVariant,
      });
      return newChanges;
    });
  };

  const handleSave = async () => {
    if (!user?.id || !catalogId || changes.size === 0) return;

    setSaving(true);
    try {
      const updates = Array.from(changes.entries()).map(([id, data]) => ({
        ...(data.isVariant ? { variant_id: id } : { product_id: id }),
        custom_price_retail: data.custom_price_retail,
        custom_price_wholesale: data.custom_price_wholesale,
        is_in_stock: data.is_in_stock,
        stock_quantity: data.stock_quantity,
      }));

      await ResellerPriceService.batchUpdatePrices(catalogId, user.id, updates);

      toast({
        title: "✅ Cambios guardados",
        description: `Se actualizaron ${updates.length} items`,
      });

      setChanges(new Map());
      await loadProducts(); // Recargar para ver los cambios
    } catch (error: any) {
      console.error("Error saving changes:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudieron guardar los cambios",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleApplyMargin = (margin: number, applyTo: "all" | "in_stock" | "out_of_stock") => {
    const newChanges = new Map(changes);

    products.forEach((product) => {
      // Aplicar a producto base
      let shouldApply = false;

      switch (applyTo) {
        case "all":
          shouldApply = true;
          break;
        case "in_stock":
          shouldApply = getDisplayStock(product.id, product.is_in_stock, false);
          break;
        case "out_of_stock":
          shouldApply = !getDisplayStock(product.id, product.is_in_stock, false);
          break;
      }

      if (shouldApply) {
        const newRetailPrice = Math.round(product.original_price_retail * (1 + margin / 100));
        const newWholesalePrice = Math.round(product.original_price_wholesale * (1 + margin / 100));

        const existing = newChanges.get(product.id) || {};
        newChanges.set(product.id, {
          ...existing,
          custom_price_retail: newRetailPrice,
          custom_price_wholesale: newWholesalePrice,
          isVariant: false,
        });
      }

      // Aplicar a variantes si existen
      if (product.variants) {
        product.variants.forEach((variant) => {
          let shouldApplyVariant = false;

          switch (applyTo) {
            case "all":
              shouldApplyVariant = true;
              break;
            case "in_stock":
              shouldApplyVariant = getDisplayStock(variant.id, variant.is_in_stock, true);
              break;
            case "out_of_stock":
              shouldApplyVariant = !getDisplayStock(variant.id, variant.is_in_stock, true);
              break;
          }

          if (shouldApplyVariant) {
            const newRetailPrice = Math.round(variant.original_price_retail * (1 + margin / 100));
            const newWholesalePrice = Math.round(variant.original_price_wholesale * (1 + margin / 100));

            const existing = newChanges.get(variant.id) || {};
            newChanges.set(variant.id, {
              ...existing,
              custom_price_retail: newRetailPrice,
              custom_price_wholesale: newWholesalePrice,
              isVariant: true,
            });
          }
        });
      }
    });

    setChanges(newChanges);

    toast({
      title: "✅ Margen aplicado",
      description: `Se actualizaron ${newChanges.size} items con ${margin}% de margen`,
    });
  };

  const getDisplayPrice = (itemId: string, field: string, originalValue: number) => {
    const change = changes.get(itemId)?.[field];
    return change !== undefined ? change : originalValue;
  };

  const getDisplayStock = (itemId: string, originalValue: boolean, isVariant: boolean) => {
    const change = changes.get(itemId);
    if (change && change.isVariant === isVariant) {
      return change.is_in_stock !== undefined ? change.is_in_stock : originalValue;
    }
    return originalValue;
  };

  const toggleProductExpanded = (productId: string) => {
    setExpandedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const formatVariantCombination = (combination: Record<string, string>) => {
    return Object.entries(combination)
      .map(([key, value]) => {
        const labelMap: Record<string, string> = {
          color: "Color",
          color_calzado: "Color",
          color_electronico: "Color",
          color_fiesta: "Color",
          talla_ropa: "Talla",
          talla_calzado: "Talla",
          material: "Material",
          capacidad: "Capacidad",
          tamano: "Tamaño",
          tamano_arreglo: "Tamaño",
          tipo_flor: "Tipo de Flor",
        };
        const label = labelMap[key] || key;
        return `${label}: ${value}`;
      })
      .join(", ");
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  const inStockCount = products.reduce((count, p) => {
    let productInStock = getDisplayStock(p.id, p.is_in_stock, false) ? 1 : 0;
    let variantsInStock = p.variants?.filter((v) => getDisplayStock(v.id, v.is_in_stock, true)).length || 0;
    return count + productInStock + variantsInStock;
  }, 0);

  const totalItemsCount = products.reduce((count, p) => {
    return count + 1 + (p.variants?.length || 0);
  }, 0);

  const outOfStockCount = totalItemsCount - inStockCount;

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(`/catalogs`)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Dashboard
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Editor de Inventario y Precios</h1>
              <p className="text-gray-600">
                {products.length} productos • {inStockCount} disponibles • {outOfStockCount} bajo pedido
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowMarginModal(true)}
              variant="outline"
              className="border-purple-600 text-purple-600 hover:bg-purple-50"
            >
              <Percent className="w-4 h-4 mr-2" />
              Margen Global
            </Button>
            <Button
              onClick={handleSave}
              disabled={changes.size === 0 || saving}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? (
                <>Guardando...</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios ({changes.size})
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Info Alerts */}
        <div className="grid md:grid-cols-2 gap-4">
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <strong>Precios:</strong> Solo puedes aumentar los precios, no bajarlos. Deja vacío para usar el precio
              original.
            </AlertDescription>
          </Alert>

          <Alert className="bg-green-50 border-green-200">
            <Package className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900">
              <strong>Inventario:</strong> Los productos/variantes que compraste están "En Stock" automáticamente.
              Puedes mover otros a "En Stock" cuando los tengas disponibles.
            </AlertDescription>
          </Alert>
        </div>

        {/* Tabla de Productos */}
        <Card>
          <CardHeader>
            <CardTitle>Productos del Catálogo</CardTitle>
            <CardDescription>
              Modifica precios e inventario. Los cambios se aplicarán a tu catálogo público.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[350px]">Producto</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right">Original (Menudeo)</TableHead>
                    <TableHead className="text-right">Tu Precio (Menudeo)</TableHead>
                    <TableHead className="text-right">Original (Mayoreo)</TableHead>
                    <TableHead className="text-right">Tu Precio (Mayoreo)</TableHead>
                    <TableHead className="text-center">En Inventario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => {
                    const hasChanges = changes.has(product.id);
                    const currentRetailPrice = getDisplayPrice(
                      product.id,
                      "custom_price_retail",
                      product.custom_price_retail || product.original_price_retail,
                    );
                    const currentWholesalePrice = getDisplayPrice(
                      product.id,
                      "custom_price_wholesale",
                      product.custom_price_wholesale || product.original_price_wholesale,
                    );
                    const currentStock = getDisplayStock(product.id, product.is_in_stock, false);
                    const isExpanded = expandedProducts.has(product.id);

                    return (
                      <>
                        {/* Fila del Producto */}
                        <TableRow key={product.id} className={hasChanges ? "bg-yellow-50" : ""}>
                          {/* Producto */}
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {product.has_variants && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => toggleProductExpanded(product.id)}
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                              {product.image_url && (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              )}
                              <div>
                                <p className="font-medium">{product.name}</p>
                                {product.sku && <p className="text-xs text-gray-500">SKU: {product.sku}</p>}
                                {product.is_purchased && (
                                  <Badge variant="secondary" className="text-xs mt-1">
                                    Comprado originalmente
                                  </Badge>
                                )}
                                {product.has_variants && (
                                  <Badge variant="outline" className="text-xs mt-1 ml-1">
                                    {product.variants?.length} variantes
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          {/* Estado */}
                          <TableCell className="text-center">
                            {currentStock ? (
                              <Badge className="bg-green-100 text-green-700 border-green-300">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Disponible
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Bajo Pedido
                              </Badge>
                            )}
                          </TableCell>

                          {/* Precio Original Menudeo */}
                          <TableCell className="text-right">
                            <span className="text-gray-600">${(product.original_price_retail / 100).toFixed(2)}</span>
                          </TableCell>

                          {/* Tu Precio Menudeo */}
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              step="0.01"
                              min={(product.original_price_retail / 100).toFixed(2)}
                              placeholder={(product.original_price_retail / 100).toFixed(2)}
                              value={
                                currentRetailPrice === product.original_price_retail
                                  ? ""
                                  : (currentRetailPrice / 100).toFixed(2)
                              }
                              onChange={(e) =>
                                handlePriceChange(product.id, "custom_price_retail", e.target.value, false)
                              }
                              className="w-28 text-right"
                            />
                          </TableCell>

                          {/* Precio Original Mayoreo */}
                          <TableCell className="text-right">
                            <span className="text-gray-600">
                              ${(product.original_price_wholesale / 100).toFixed(2)}
                            </span>
                          </TableCell>

                          {/* Tu Precio Mayoreo */}
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              step="0.01"
                              min={(product.original_price_wholesale / 100).toFixed(2)}
                              placeholder={(product.original_price_wholesale / 100).toFixed(2)}
                              value={
                                currentWholesalePrice === product.original_price_wholesale
                                  ? ""
                                  : (currentWholesalePrice / 100).toFixed(2)
                              }
                              onChange={(e) =>
                                handlePriceChange(product.id, "custom_price_wholesale", e.target.value, false)
                              }
                              className="w-28 text-right"
                            />
                          </TableCell>

                          {/* Switch En Inventario */}
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center">
                              <Switch
                                checked={currentStock}
                                onCheckedChange={(checked) => handleStockChange(product.id, checked, false)}
                                disabled={product.is_purchased} // Los comprados siempre están disponibles
                              />
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Variantes (Colapsable) */}
                        {product.has_variants && product.variants && isExpanded && (
                          <>
                            {product.variants.map((variant) => {
                              const hasVariantChanges = changes.has(variant.id);
                              const currentVariantRetailPrice = getDisplayPrice(
                                variant.id,
                                "custom_price_retail",
                                variant.custom_price_retail || variant.original_price_retail,
                              );
                              const currentVariantWholesalePrice = getDisplayPrice(
                                variant.id,
                                "custom_price_wholesale",
                                variant.custom_price_wholesale || variant.original_price_wholesale,
                              );
                              const currentVariantStock = getDisplayStock(variant.id, variant.is_in_stock, true);

                              return (
                                <TableRow
                                  key={variant.id}
                                  className={`${hasVariantChanges ? "bg-yellow-50" : "bg-gray-50"}`}
                                >
                                  {/* Variante */}
                                  <TableCell className="pl-16">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-gray-600">↳</span>
                                      <div>
                                        <p className="text-sm font-medium">
                                          {formatVariantCombination(variant.variant_combination)}
                                        </p>
                                        {variant.sku && <p className="text-xs text-gray-500">SKU: {variant.sku}</p>}
                                        {variant.is_purchased && (
                                          <Badge variant="secondary" className="text-xs mt-1">
                                            Comprada
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </TableCell>

                                  {/* Estado Variante */}
                                  <TableCell className="text-center">
                                    {currentVariantStock ? (
                                      <Badge className="bg-green-100 text-green-700 border-green-300 text-xs">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Disponible
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs">
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                        Bajo Pedido
                                      </Badge>
                                    )}
                                  </TableCell>

                                  {/* Precio Original Menudeo Variante */}
                                  <TableCell className="text-right">
                                    <span className="text-sm text-gray-600">
                                      ${(variant.original_price_retail / 100).toFixed(2)}
                                    </span>
                                  </TableCell>

                                  {/* Tu Precio Menudeo Variante */}
                                  <TableCell className="text-right">
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min={(variant.original_price_retail / 100).toFixed(2)}
                                      placeholder={(variant.original_price_retail / 100).toFixed(2)}
                                      value={
                                        currentVariantRetailPrice === variant.original_price_retail
                                          ? ""
                                          : (currentVariantRetailPrice / 100).toFixed(2)
                                      }
                                      onChange={(e) =>
                                        handlePriceChange(variant.id, "custom_price_retail", e.target.value, true)
                                      }
                                      className="w-28 text-right text-sm"
                                    />
                                  </TableCell>

                                  {/* Precio Original Mayoreo Variante */}
                                  <TableCell className="text-right">
                                    <span className="text-sm text-gray-600">
                                      ${(variant.original_price_wholesale / 100).toFixed(2)}
                                    </span>
                                  </TableCell>

                                  {/* Tu Precio Mayoreo Variante */}
                                  <TableCell className="text-right">
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min={(variant.original_price_wholesale / 100).toFixed(2)}
                                      placeholder={(variant.original_price_wholesale / 100).toFixed(2)}
                                      value={
                                        currentVariantWholesalePrice === variant.original_price_wholesale
                                          ? ""
                                          : (currentVariantWholesalePrice / 100).toFixed(2)
                                      }
                                      onChange={(e) =>
                                        handlePriceChange(variant.id, "custom_price_wholesale", e.target.value, true)
                                      }
                                      className="w-28 text-right text-sm"
                                    />
                                  </TableCell>

                                  {/* Switch En Inventario Variante */}
                                  <TableCell className="text-center">
                                    <div className="flex items-center justify-center">
                                      <Switch
                                        checked={currentVariantStock}
                                        onCheckedChange={(checked) => handleStockChange(variant.id, checked, true)}
                                        disabled={variant.is_purchased}
                                      />
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Modal de Margen Global */}
        <BulkPriceMarginModal
          open={showMarginModal}
          onClose={() => setShowMarginModal(false)}
          onApply={handleApplyMargin}
          totalProducts={totalItemsCount}
          inStockCount={inStockCount}
          outOfStockCount={outOfStockCount}
        />
      </div>
    </div>
  );
}
