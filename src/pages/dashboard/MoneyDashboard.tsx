import React from "react";
import { useMerchantStats } from "@/hooks/useMerchantStats";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CircleDollarSign, Clock, CheckCircle2, TrendingUp, Calendar, Receipt } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount / 100); // amounts are in cents
};

const formatCurrencyRaw = (amount: number) => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
};

export default function MoneyDashboard() {
  const { stats, isLoadingStats, transactions, isLoadingTransactions } = useMerchantStats();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <CircleDollarSign className="h-7 w-7 text-emerald-500" />
            Mis Ganancias
          </h1>
          <p className="text-muted-foreground mt-1">Tu dinero real disponible</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Por Cobrar */}
          <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                Por Cobrar
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl md:text-3xl font-bold text-amber-600">
                  {formatCurrencyRaw(stats?.balance_pending ?? 0)}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Dinero que ya vendiste pero aún no te depositamos
              </p>
            </CardContent>
          </Card>

          {/* Pagado Histórico */}
          <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Pagado Histórico
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl md:text-3xl font-bold text-emerald-600">
                  {formatCurrencyRaw(stats?.balance_paid ?? 0)}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Lo que ya te hemos transferido anteriormente
              </p>
            </CardContent>
          </Card>

          {/* Ventas Totales */}
          <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                Ventas Totales (Neto)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl md:text-3xl font-bold text-blue-600">
                  {formatCurrencyRaw(stats?.total_earnings ?? 0)}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Suma total de tus ganancias netas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Section */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Receipt className="h-5 w-5 text-muted-foreground" />
            Historial de Ventas Pagadas
          </h2>
          <p className="text-sm text-muted-foreground">
            Desglose de transparencia de cada transacción
          </p>
        </div>

        {/* Transactions List - Mobile Cards */}
        <div className="space-y-3">
          {isLoadingTransactions ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-6 w-32 mb-3" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </Card>
            ))
          ) : transactions.length === 0 ? (
            <Card className="p-8 text-center">
              <CircleDollarSign className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No hay ventas pagadas aún</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Cuando tus clientes paguen, aparecerán aquí
              </p>
            </Card>
          ) : (
            transactions.map((tx) => {
              const commission = tx.amount_total - tx.net_to_merchant;
              return (
                <Card key={tx.id} className="p-4 hover:shadow-md transition-shadow">
                  {/* Header Row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(tx.paid_at), "dd MMM yyyy, HH:mm", { locale: es })}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                      Pagado
                    </Badge>
                  </div>

                  {/* Order ID */}
                  <p className="text-xs text-muted-foreground mb-3">
                    #Orden: <span className="font-mono">{tx.quote_id.slice(0, 8)}</span>
                  </p>

                  {/* Financial Breakdown */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
                    {/* Venta */}
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Venta</p>
                      <p className="text-sm font-medium text-foreground">
                        {formatCurrency(tx.amount_total)}
                      </p>
                    </div>

                    {/* Comisión */}
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Comisión</p>
                      <p className="text-sm font-medium text-rose-500">
                        -{formatCurrency(commission)}
                      </p>
                    </div>

                    {/* Tu Ganancia */}
                    <div className="text-center bg-emerald-500/10 -mx-1 px-1 py-1 rounded">
                      <p className="text-xs text-emerald-600 mb-1">Tu Ganancia</p>
                      <p className="text-sm font-bold text-emerald-600">
                        {formatCurrency(tx.net_to_merchant)}
                      </p>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="mt-3 pt-2 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">
                      Método: <span className="font-medium">{tx.payment_method}</span>
                    </span>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
