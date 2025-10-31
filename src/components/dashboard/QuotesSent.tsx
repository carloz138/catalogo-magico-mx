import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, ExternalLink, Clock, CheckCircle, XCircle, Truck } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface QuoteSent {
  id: string;
  order_number: string;
  status: "pending" | "accepted" | "rejected" | "shipped";
  created_at: string;
  customer_name: string;
  total: number;
  catalog_name: string;
  tracking_token: string | null;
}

export function QuotesSent() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState<QuoteSent[]>([]);

  useEffect(() => {
    if (user) loadQuotes();
  }, [user]);

  const loadQuotes = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Obtener cotizaciones donde el usuario es el CLIENTE (customer_email)
      const { data: quotesData, error } = await supabase
        .from("quotes")
        .select(`
          id,
          order_number,
          status,
          created_at,
          customer_name,
          customer_email,
          catalog_id,
          quote_items (subtotal)
        `)
        .eq("customer_email", user.email)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Obtener nombres de catálogos y tracking tokens
      const quotesWithDetails = await Promise.all(
        (quotesData || []).map(async (quote: any) => {
          // Obtener nombre del catálogo
          const { data: catalog } = await supabase
            .from("digital_catalogs")
            .select("name")
            .eq("id", quote.catalog_id)
            .single();

          // Obtener tracking token
          const { data: tracking } = await supabase
            .from("quote_tracking_tokens")
            .select("token")
            .eq("quote_id", quote.id)
            .single();

          // Calcular total
          const total = (quote.quote_items || []).reduce(
            (sum: number, item: any) => sum + (item.subtotal || 0),
            0
          );

          return {
            id: quote.id,
            order_number: quote.order_number,
            status: quote.status,
            created_at: quote.created_at,
            customer_name: quote.customer_name,
            catalog_name: catalog?.name || "Catálogo",
            total,
            tracking_token: tracking?.token || null,
          };
        })
      );

      setQuotes(quotesWithDetails as QuoteSent[]);
    } catch (error) {
      console.error("Error loading sent quotes:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: { icon: Clock, label: "Pendiente", color: "bg-yellow-100 text-yellow-700" },
      accepted: { icon: CheckCircle, label: "Aceptada", color: "bg-green-100 text-green-700" },
      rejected: { icon: XCircle, label: "Rechazada", color: "bg-red-100 text-red-700" },
      shipped: { icon: Truck, label: "Enviado", color: "bg-blue-100 text-blue-700" },
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p className="font-medium">Aún no has enviado cotizaciones</p>
        <p className="text-sm mt-1">Navega por catálogos y solicita presupuestos</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {quotes.map((quote) => {
        const statusConfig = getStatusConfig(quote.status);
        const StatusIcon = statusConfig.icon;

        return (
          <Card key={quote.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">
                      Pedido #{quote.order_number}
                    </h3>
                    <Badge className={statusConfig.color}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <strong>Catálogo:</strong> {quote.catalog_name}
                    </p>
                    <p>
                      <strong>Total:</strong> ${(quote.total / 100).toLocaleString("es-MX")} MXN
                    </p>
                    <p className="text-xs">
                      {format(new Date(quote.created_at), "d 'de' MMMM, yyyy 'a las' HH:mm", {
                        locale: es,
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {quote.tracking_token && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`/tracking/${quote.tracking_token}`, "_blank")}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Ver Estado
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
