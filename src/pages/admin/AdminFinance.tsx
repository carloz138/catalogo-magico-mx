import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { useAdminFinance } from "@/hooks/useAdminFinance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Landmark,
  TrendingUp,
  Wallet,
  AlertCircle,
  Download,
  Building2,
  CreditCard,
  Calendar,
  Hash,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
};

export default function AdminFinance() {
  const navigate = useNavigate();
  const { isSuperAdmin, isLoading: isLoadingAdmin } = useSuperAdmin();
  const { summary, isLoadingSummary, payoutQueue, isLoadingPayoutQueue } = useAdminFinance();

  // Redirect if not super admin
  useEffect(() => {
    if (!isLoadingAdmin && !isSuperAdmin) {
      toast.error("Acceso denegado");
      navigate("/dashboard");
    }
  }, [isSuperAdmin, isLoadingAdmin, navigate]);

  const handleExportCSV = () => {
    if (payoutQueue.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }

    // Create CSV content
    const headers = ["Nombre Negocio", "CLABE", "Monto a Pagar", "Email", "Transacciones", "Fecha Más Antigua"];
    const rows = payoutQueue.map((item) => [
      item.business_name,
      item.clabe_deposit,
      (item.amount_to_pay).toFixed(2), // Raw number for bank
      item.contact_email,
      item.transactions_count.toString(),
      format(new Date(item.oldest_payment_date), "yyyy-MM-dd"),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `dispersiones_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();

    toast.success("CSV exportado correctamente");
  };

  if (isLoadingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Landmark className="h-7 w-7 text-indigo-500" />
            Finanzas Admin
          </h1>
          <p className="text-muted-foreground mt-1">Panel de control financiero de la plataforma</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Ventas Brutas */}
          <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                Ventas Brutas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingSummary ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <p className="text-xl md:text-2xl font-bold text-blue-600">
                  {formatCurrency(summary?.total_sales_gross ?? 0)}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Ganancia SaaS */}
          <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Wallet className="h-4 w-4 text-emerald-500" />
                Ganancia Plataforma
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingSummary ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <p className="text-xl md:text-2xl font-bold text-emerald-600">
                  {formatCurrency(summary?.total_earnings_saas ?? 0)}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Ya Dispersado */}
          <Card className="border-slate-500/20 bg-gradient-to-br from-slate-500/5 to-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-slate-500" />
                Ya Dispersado
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingSummary ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <p className="text-xl md:text-2xl font-bold text-slate-600">
                  {formatCurrency(summary?.total_paid_out ?? 0)}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Deuda Pendiente */}
          <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                Deuda Pendiente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingSummary ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <p className="text-xl md:text-2xl font-bold text-amber-600">
                  {formatCurrency(summary?.pending_payout_balance ?? 0)}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payout Queue Section */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              Cola de Dispersión
            </h2>
            <p className="text-sm text-muted-foreground">
              Usuarios pendientes de pago
            </p>
          </div>
          <Button onClick={handleExportCSV} className="gap-2" disabled={payoutQueue.length === 0}>
            <Download className="h-4 w-4" />
            Exportar CSV Bancario
          </Button>
        </div>

        {/* Mobile Cards View */}
        <div className="block lg:hidden space-y-3">
          {isLoadingPayoutQueue ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-48 mb-3" />
                <Skeleton className="h-6 w-24" />
              </Card>
            ))
          ) : payoutQueue.length === 0 ? (
            <Card className="p-8 text-center">
              <Landmark className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No hay pagos pendientes</p>
            </Card>
          ) : (
            payoutQueue.map((item) => (
              <Card key={item.merchant_id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-foreground">{item.business_name}</p>
                    <p className="text-xs text-muted-foreground">{item.contact_email}</p>
                  </div>
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                    Pendiente
                  </Badge>
                </div>
                
                <div className="space-y-2 mt-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <CreditCard className="h-3 w-3" /> CLABE
                    </span>
                    <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                      {item.clabe_deposit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Hash className="h-3 w-3" /> Transacciones
                    </span>
                    <span className="text-sm font-medium">{item.transactions_count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Más antigua
                    </span>
                    <span className="text-sm">
                      {format(new Date(item.oldest_payment_date), "dd MMM", { locale: es })}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-border bg-emerald-500/10 -mx-4 -mb-4 px-4 py-3 rounded-b-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-emerald-700">Monto a Pagar</span>
                    <span className="text-lg font-bold text-emerald-600">
                      {formatCurrency(item.amount_to_pay)}
                    </span>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Negocio</TableHead>
                  <TableHead>CLABE</TableHead>
                  <TableHead className="text-center">Transacciones</TableHead>
                  <TableHead>Fecha Más Antigua</TableHead>
                  <TableHead className="text-right">Monto a Pagar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingPayoutQueue ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : payoutQueue.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No hay pagos pendientes
                    </TableCell>
                  </TableRow>
                ) : (
                  payoutQueue.map((item) => (
                    <TableRow key={item.merchant_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.business_name}</p>
                          <p className="text-xs text-muted-foreground">{item.contact_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {item.clabe_deposit}
                        </code>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{item.transactions_count}</Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(item.oldest_payment_date), "dd MMM yyyy", { locale: es })}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-bold text-emerald-600">
                          {formatCurrency(item.amount_to_pay)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </div>
  );
}
