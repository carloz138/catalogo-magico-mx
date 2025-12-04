import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ConsolidatedOrderService } from "@/services/consolidated-order.service";
import {
  ConsolidatedOrderWithDetails,
  ConsolidatedOrderItemInput,
  SendConsolidatedOrderDTO,
  ConsolidatedOrderStatus,
} from "@/types/consolidated-order";
import { useToast } from "@/hooks/use-toast";

interface UseConsolidatedOrdersOptions {
  supplierId?: string;
  status?: ConsolidatedOrderStatus;
  autoLoad?: boolean;
}

export function useConsolidatedOrders(options: UseConsolidatedOrdersOptions = {}) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [orders, setOrders] = useState<ConsolidatedOrderWithDetails[]>([]);
  const [currentDraft, setCurrentDraft] = useState<ConsolidatedOrderWithDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [sending, setSending] = useState(false);

  /**
   * Cargar lista de consolidados
   */
  const loadOrders = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const data = await ConsolidatedOrderService.getConsolidatedOrders(user.id, {
        status: options.status,
        supplier_id: options.supplierId,
      });

      setOrders(data);
    } catch (error: any) {
      console.error("Error loading consolidated orders:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los pedidos consolidados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, options.status, options.supplierId, toast]);

  /**
   * Obtener o crear borrador para un proveedor
   */
  const getOrCreateDraft = async (
    supplierId: string,
    originalCatalogId: string,
    replicatedCatalogId: string
  ) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "Debes estar autenticado",
        variant: "destructive",
      });
      return null;
    }

    setLoading(true);
    try {
      const response = await ConsolidatedOrderService.getOrCreateDraft(
        user.id,
        supplierId,
        originalCatalogId,
        replicatedCatalogId
      );

      if (response.is_new) {
        toast({
          title: "✅ Borrador creado",
          description: `Se creó un nuevo borrador con ${response.items.length} productos de cotizaciones aceptadas`,
        });
      }

      // Cargar draft completo con detalles
      const draft = await ConsolidatedOrderService.getDraftForSupplier(user.id, supplierId);
      setCurrentDraft(draft);

      return draft;
    } catch (error: any) {
      console.error("Error getting/creating draft:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el borrador",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cargar borrador específico
   */
  const loadDraft = async (supplierId: string) => {
    if (!user?.id) return null;

    setLoading(true);
    try {
      const draft = await ConsolidatedOrderService.getDraftForSupplier(user.id, supplierId);
      setCurrentDraft(draft);
      return draft;
    } catch (error: any) {
      console.error("Error loading draft:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo cargar el borrador",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sincronizar borrador con cotizaciones nuevas
   */
  const syncDraft = async (consolidatedOrderId: string, replicatedCatalogId: string) => {
    if (!user?.id) return;

    setSyncing(true);
    try {
      await ConsolidatedOrderService.syncDraftWithQuotes(
        consolidatedOrderId,
        user.id,
        replicatedCatalogId
      );

      toast({
        title: "✅ Sincronizado",
        description: "El borrador se actualizó con nuevas cotizaciones",
      });

      // Recargar draft
      if (currentDraft) {
        await loadDraft(currentDraft.supplier_id);
      }
    } catch (error: any) {
      console.error("Error syncing draft:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo sincronizar",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  /**
   * Actualizar cantidad de un item
   */
  const updateItemQuantity = async (itemId: string, quantity: number) => {
    if (!user?.id) return;

    try {
      await ConsolidatedOrderService.updateItemQuantity(itemId, quantity, user.id);

      // Actualizar estado local
      if (currentDraft) {
        setCurrentDraft((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            items: prev.items.map((item) => {
              if (item.id === itemId) {
                const newSubtotal = quantity * item.unit_price;
                return { ...item, quantity, subtotal: newSubtotal };
              }
              return item;
            }),
            total_amount: prev.items.reduce((sum, item) => {
              if (item.id === itemId) {
                return sum + quantity * item.unit_price;
              }
              return sum + item.subtotal;
            }, 0),
          };
        });
      }
    } catch (error: any) {
      console.error("Error updating quantity:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la cantidad",
        variant: "destructive",
      });
    }
  };

  /**
   * Eliminar item
   */
  const removeItem = async (itemId: string) => {
    if (!user?.id) return;

    try {
      await ConsolidatedOrderService.removeItem(itemId, user.id);

      toast({
        title: "✅ Producto eliminado",
      });

      // Actualizar estado local
      if (currentDraft) {
        setCurrentDraft((prev) => {
          if (!prev) return prev;
          const newItems = prev.items.filter((item) => item.id !== itemId);
          return {
            ...prev,
            items: newItems,
            items_count: newItems.length,
            total_amount: newItems.reduce((sum, item) => sum + item.subtotal, 0),
          };
        });
      }
    } catch (error: any) {
      console.error("Error removing item:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el producto",
        variant: "destructive",
      });
    }
  };

  /**
   * Agregar producto manualmente
   */
  const addProduct = async (productData: ConsolidatedOrderItemInput) => {
    if (!user?.id || !currentDraft) {
      toast({
        title: "Error",
        description: "No hay borrador activo",
        variant: "destructive",
      });
      return;
    }

    try {
      const newItem = await ConsolidatedOrderService.addProduct(
        currentDraft.id,
        productData,
        user.id
      );

      toast({
        title: "✅ Producto agregado",
        description: productData.product_name,
      });

      // Actualizar estado local
      setCurrentDraft((prev) => {
        if (!prev) return prev;
        const existingIndex = prev.items.findIndex(
          (item) =>
            item.product_id === newItem.product_id &&
            (item.variant_id || null) === (newItem.variant_id || null)
        );

        let newItems;
        if (existingIndex >= 0) {
          // Actualizar item existente
          newItems = [...prev.items];
          newItems[existingIndex] = newItem;
        } else {
          // Agregar nuevo item
          newItems = [...prev.items, newItem];
        }

        return {
          ...prev,
          items: newItems,
          items_count: newItems.length,
          total_amount: newItems.reduce((sum, item) => sum + item.subtotal, 0),
        };
      });
    } catch (error: any) {
      console.error("Error adding product:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo agregar el producto",
        variant: "destructive",
      });
    }
  };

  /**
   * Enviar pedido consolidado
   */
  const sendOrder = async (consolidatedOrderId: string, notes?: string) => {
    if (!user?.id) return null;

    setSending(true);
    try {
      const quoteId = await ConsolidatedOrderService.sendOrder(
        {
          consolidated_order_id: consolidatedOrderId,
          notes,
        },
        user.id
      );

      toast({
        title: "🎉 Pedido enviado",
        description: "Tu proveedor recibirá la cotización consolidada",
      });

      // Limpiar draft actual
      setCurrentDraft(null);

      // Recargar lista
      await loadOrders();

      return quoteId;
    } catch (error: any) {
      console.error("Error sending order:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el pedido",
        variant: "destructive",
      });
      return null;
    } finally {
      setSending(false);
    }
  };

  /**
   * Actualizar notas
   */
  const updateNotes = async (consolidatedOrderId: string, notes: string) => {
    if (!user?.id) return;

    try {
      await ConsolidatedOrderService.updateNotes(consolidatedOrderId, notes, user.id);

      // Actualizar estado local
      if (currentDraft?.id === consolidatedOrderId) {
        setCurrentDraft((prev) => (prev ? { ...prev, notes } : prev));
      }
    } catch (error: any) {
      console.error("Error updating notes:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudieron actualizar las notas",
        variant: "destructive",
      });
    }
  };

  // Auto-load on mount si autoLoad está habilitado
  useEffect(() => {
    if (options.autoLoad !== false && user?.id) {
      loadOrders();
    }
  }, [user?.id, options.autoLoad, loadOrders]);

  return {
    // Estado
    orders,
    currentDraft,
    loading,
    syncing,
    sending,

    // Acciones
    loadOrders,
    getOrCreateDraft,
    loadDraft,
    syncDraft,
    updateItemQuantity,
    removeItem,
    addProduct,
    sendOrder,
    updateNotes,
  };
}
