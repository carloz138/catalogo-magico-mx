import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useConsolidatedOrders } from "@/hooks/useConsolidatedOrders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProductConsolidationRow } from "@/components/consolidated/ProductConsolidationRow";
import {
  ArrowLeft,
  Send,
  Save,
  RefreshCw,
  Package,
  FileText,
  DollarSign,
  AlertCircle,
  Plus,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ConsolidateOrderPage() {
  const { supplierId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const orderId = searchParams.get("order_id");
  const catalogId = searchParams.get("catalog_id");
  const replicatedCatalogId = searchParams.get("replicated_catalog_id");

  const {
    currentDraft,
    loading,
    syncing,
    sending,
    getOrCreateDraft,
    loadDraft,
    syncDraft,
    updateItemQuantity,
    removeItem,
    sendOrder,
    updateNotes,
  } = useConsolidatedOrders();

  const [notes, setNotes] = useState("");
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [notesChanged, setNotesChanged] = useState(false);

  // Cargar o crear draft al montar
  useEffect(() => {
    if (!user || !supplierId) {
      navigate("/dashboard/reseller");
      return;
    }

    loadData();
  }, [user, supplierId, orderId]);

  // Sincronizar notas con el draft
  useEffect(() => {
    if (currentDraft?.notes) {
      setNotes(currentDraft.notes);
    }
  }, [currentDraft?.id]);

  const loadData = async () => {
    if (!supplierId) return;

    if (orderId) {
      // Cargar draft existente
      await loadDraft(supplierId);
    } else if (catalogId && replicatedCatalogId) {
      // Crear nuevo draft
      await getOrCreateDraft(supplierId, catalogId, replicatedCatalogId);
    } else {
      // Intentar cargar draft
      const draft = await loadDraft(supplierId);
      if (!draft) {
        toast({
          title: "Error",
          description: "No se encontró un borrador activo",
          variant: "destructive",
        });
        navigate("/dashboard/reseller");
      }
    }
  };

  const handleSync = async () => {
    if (!currentDraft) return;
    await syncDraft(currentDraft.id, currentDraft.original_catalog_id);
  };

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    await updateItemQuantity(itemId, quantity);
  };

  const handleRemoveItem = async (itemId: string) => {
    await removeItem(itemId);
  };

  const handleSaveNotes = async () => {
    if (!currentDraft) return;
    await updateNotes(currentDraft.id, notes);
    setNotesChanged(false);
    toast({
      title: "✅ Notas guardadas",
    });
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    setNotesChanged(true);
  };

  const handleSendClick = () => {
    if (!currentDraft || currentDraft.items.length === 0) {
      toast({
        title: "Error",
        description: "No hay productos en el consolidado",
        variant: "destructive",
      });
      return;
    }
    setShowSendDialog(true);
  };

  const handleConfirmSend = async () => {
    if (!currentDraft) return;

    const quoteId = await sendOrder(currentDraft.id, notes);

    if (quoteId) {
      setShowSendDialog(false);
      // Redirigir al dashboard de reseller
      navigate("/dashboard/reseller");
    }
  };

  if (loading && !currentDraft) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!currentDraft) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No se pudo cargar el pedido consolidado. Por favor, intenta nuevamente.
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate("/dashboard/reseller")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const total = currentDraft.items.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard/reseller")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Pedido Consolidado
              </h1>
              <p className="text-gray-600">
                Para: {currentDraft.supplier_business_name || currentDraft.supplier_name}
              </p>
              <p className="text-sm text-gray-500">
                {currentDraft.catalog_name}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSync}
              disabled={syncing}
            >
              {syncing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sincronizar
                </>
              )}
            </Button>

            <Button
              onClick={handleSendClick}
              disabled={sending || currentDraft.items.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Pedido
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Info Alert */}
        <Alert className="bg-blue-50 border-blue-200">
          <FileText className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>Borrador automático:</strong> Este pedido se sincroniza automáticamente
            con tus cotizaciones aceptadas. Puedes editarlo antes de enviarlo.
          </AlertDescription>
        </Alert>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Productos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{currentDraft.items_count}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Cotizaciones Origen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{currentDraft.source_quotes_count}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-emerald-600">
                ${(total / 100).toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                })}{" "}
                MXN
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Productos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Productos Consolidados</CardTitle>
                <CardDescription>
                  Ajusta cantidades o elimina productos antes de enviar
                </CardDescription>
              </div>
              {/* TODO: Botón agregar más productos */}
              {/* <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Productos
              </Button> */}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentDraft.items.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">No hay productos en este consolidado</p>
                <p className="text-sm text-gray-500">
                  Haz clic en "Sincronizar" para agregar productos de cotizaciones aceptadas
                </p>
              </div>
            ) : (
              currentDraft.items.map((item) => (
                <ProductConsolidationRow
                  key={item.id}
                  item={item}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemove={handleRemoveItem}
                  disabled={sending}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Notas */}
        <Card>
          <CardHeader>
            <CardTitle>Notas para el Proveedor</CardTitle>
            <CardDescription>
              Información adicional sobre este pedido (opcional)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Ej: Pedido urgente, necesito antes del viernes..."
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              rows={4}
              disabled={sending}
            />
            {notesChanged && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveNotes}
              >
                <Save className="w-4 h-4 mr-2" />
                Guardar Notas
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Total Final */}
        <Card className="border-2 border-emerald-200 bg-emerald-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-medium text-gray-700">Total del Pedido</p>
                <p className="text-sm text-gray-600">
                  {currentDraft.items_count} producto(s) • De {currentDraft.source_quotes_count} cotización(es)
                </p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-emerald-600">
                  ${(total / 100).toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                  })}
                </p>
                <p className="text-sm text-gray-600">MXN</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de confirmación de envío */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Enviar Pedido Consolidado?</DialogTitle>
            <DialogDescription>
              Estás a punto de enviar un pedido de {currentDraft.items_count} productos
              por un total de ${(total / 100).toLocaleString("es-MX", {
                minimumFractionDigits: 2,
              })} MXN a{" "}
              {currentDraft.supplier_business_name || currentDraft.supplier_name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Una vez enviado, este pedido se convertirá en una cotización que tu proveedor
                podrá aceptar o rechazar. No podrás modificarlo después de enviarlo.
              </AlertDescription>
            </Alert>

            {notes && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Notas incluidas:</p>
                <p className="text-sm text-gray-600">{notes}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSendDialog(false)}
              disabled={sending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmSend}
              disabled={sending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Confirmar y Enviar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
