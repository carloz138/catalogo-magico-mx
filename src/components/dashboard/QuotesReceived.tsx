import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Eye, Clock, CheckCircle, XCircle, Truck } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface QuoteReceived {
  id: string;
  order_number: string;
  status: "pending" | "accepted" | "rejected" | "shipped";
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_company: string | null;
  total: number;
  catalog_name: string;
  items_count: number;
}

export function QuotesReceived() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState<QuoteReceived[]>([]);

  useEffect(() => {
    if (user) loadQuotes();
  }, [user]);

  const loadQuotes = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Obtener cotizaciones donde el usuario es el VENDEDOR (user_id de la cotización)
      const { data: quotesData, error } = await supabase
        .from("quotes")
        .select(`
          id,
          order_number,
          status,
          created_at,
          customer_name,
          customer_email,
          customer_company,
          catalog_id,
          quote_items (subtotal)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Obtener nombres de catálogos
      const quotesWithDetails = await Promise.all(
        (quotesData || []).map(async (quote: any) => {
          // Obtener nombre del catálogo
          const { data: catalog } = await supabase
            .from("digital_catalogs")
            .select("name")
            .eq("id", quote.catalog_id)
            .single();

          // Calcular total
          const items = quote.quote_items || [];
          const total = items.reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0);

          return {
            id: quote.id,
            order_number: quote.order_number,
            status: quote.status,
            created_at: quote.created_at,
            customer_name: quote.customer_name,
            customer_email: quote.customer_email,
            customer_company: quote.customer_company,
            catalog_name: catalog?.name || "Catálogo",
            total,
            items_count: items.length,
          };
        })
      );

      setQuotes(quotesWithDetails as QuoteReceived[]);
    } catch (error) {
      console.error("Error loading received quotes:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: { icon: Clock, label: "Pendiente", color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
      accepted: { icon: CheckCircle, label: "Aceptada", color: "bg-green-100 text-green-700 border-green-300" },
      rejected: { icon: XCircle, label: "Rechazada", color: "bg-red-100 text-red-700 border-red-300" },
      shipped: { icon: Truck, label: "Enviado", color: "bg-blue-100 text-blue-700 border-blue-300" },
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p className="font-medium">Aún no has recibido cotizaciones</p>
        <p className="text-sm mt-1">Comparte tus catálogos para recibir solicitudes</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {quotes.map((quote) => {
        const statusConfig = getStatusConfig(quote.status);
        const StatusIcon = statusConfig.icon;

        return (
          <Card
            key={quote.id}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(`/dashboard/quotes/${quote.id}`)}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-semibold text-lg">
                      Pedido #{quote.order_number}
                    </h3>
                    <Badge className={statusConfig.color}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Cliente</p>
                      <p className="font-medium">{quote.customer_name}</p>
                      {quote.customer_company && (
                        <p className="text-xs text-gray-600">{quote.customer_company}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-gray-500">Catálogo</p>
                      <p className="font-medium">{quote.catalog_name}</p>
                    </div>

                    <div>
                      <p className="text-gray-500">Total</p>
                      <p className="font-bold text-purple-600">
                        ${(quote.total / 100).toLocaleString("es-MX")} MXN
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500">Productos</p>
                      <p className="font-medium">{quote.items_count} items</p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mt-3">
                    Recibida el {format(new Date(quote.created_at), "d 'de' MMMM, yyyy 'a las' HH:mm", {
                      locale: es,
                    })}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/dashboard/quotes/${quote.id}`);
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Detalle
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
