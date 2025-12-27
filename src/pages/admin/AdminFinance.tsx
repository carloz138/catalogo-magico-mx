import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { useAdminFinance } from "@/hooks/useAdminFinance"; // Tu hook existente
import { supabase } from "@/integrations/supabase/client"; // Cliente Supabase
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Landmark,
  TrendingUp,
  Wallet,
  AlertCircle,
  Download,
  Building2,
  CreditCard,
  Users,
  CheckCircle2,
  Copy,
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

  // 1. DATA DE VENTAS (Tu hook original)
  const { summary, isLoadingSummary, payoutQueue, isLoadingPayoutQueue, refetch: refetchMerchants } = useAdminFinance();

  // 2. DATA DE REFERIDOS (Nueva lógica manual)
  const [referralsQueue, setReferralsQueue] = useState<any[]>([]);
  const [loadingReferrals, setLoadingReferrals] = useState(true);

  // 3. ESTADOS PARA MODALES
  const [modalType, setModalType] = useState<"product" | "referral" | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Redirect if not super admin
  useEffect(() => {
    if (!isLoadingAdmin && !isSuperAdmin) {
      toast.error("Acceso denegado");
      navigate("/dashboard");
    }
  }, [isSuperAdmin, isLoadingAdmin, navigate]);

  // Cargar Referidos al iniciar
  useEffect(() => {
    if (isSuperAdmin) fetchReferralsQueue();
  }, [isSuperAdmin]);

  const fetchReferralsQueue = async () => {
    setLoadingReferrals(true);
    // Usamos 'as any' para evitar errores de tipado si no has regenerado types
    const { data, error } = await supabase.from("admin_pending_payouts_view" as any).select("*");
    if (error) {
      console.error("Error cargando referidos:", error);
      toast.error("Error al cargar cola de referidos");
    } else {
      setReferralsQueue(data || []);
    }
    setLoadingReferrals(false);
  };

  // --- ACCIÓN 1: MARCAR PAGADO (PRODUCTOS / COMISIONES DE VENTA) ---
  const handleMarkProductBatchPaid = async () => {
    if (!selectedItem || modalType !== "product") return;
    setProcessingPayment(true);

    try {
      // Buscamos todas las transacciones de este merchant que estén "pendientes" (payout_status IS NULL)
      // y que la plataforma tenga los fondos.
      // NOTA: Asumimos que tu tabla se llama 'payment_transactions'. Ajusta si es diferente.
      const { error } = await supabase
        .from("payment_transactions" as any)
        .update({
          payout_status: "paid",
          payout_date: new Date().toISOString(),
          payout_reference: "MANUAL_BATCH", // Opcional: podrías pedir un input de referencia
        })
        .eq("net_to_merchant", selectedItem.merchant_id) // Usamos el ID del merchant de la cola
        .eq("funds_held_by_platform", true) // Solo fondos que tenemos nosotros
        .is("payout_status", null); // Que no hayan sido pagados antes

      if (error) throw error;

      toast.success(`Pagos registrados para ${selectedItem.business_name}`);
      setModalType(null);
      refetchMerchants(); // Recargar la lista de useAdminFinance
    } catch (error: any) {
      console.error(error);
      toast.error("Error al actualizar transacciones: " + error.message);
    } finally {
      setProcessingPayment(false);
    }
  };

  // --- ACCIÓN 2: MARCAR PAGADO (REFERIDOS / SUSCRIPCIONES) ---
  const handleMarkReferralPaid = async () => {
    if (!selectedItem || modalType !== "referral") return;
    setProcessingPayment(true);

    try {
      // A. Crear Batch
      const { data: batch, error: batchError } = await supabase
        .from("payout_batches" as any)
        .insert({ total_amount: selectedItem.total_to_pay, status: "completed" })
        .select()
        .single();

      if (batchError) throw batchError;

      const batchId = (batch as any).id;

      // B. Actualizar registros individuales
      const { error: updateError } = await supabase
        .from("affiliate_payouts" as any)
        .update({ status: "processed", batch_id: batchId })
        .eq("user_id", selectedItem.user_id)
        .eq("status", "ready");

      if (updateError) throw updateError;

      toast.success(`Pago de referidos registrado para ${selectedItem.email}`);
      setModalType(null);
      fetchReferralsQueue(); // Recargar lista manual
    } catch (error: any) {
      toast.error("Error al procesar pago: " + error.message);
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleExportCSV = () => {
    if (payoutQueue.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }
    const headers = ["Nombre Negocio", "CLABE", "Monto a Pagar", "Email", "Transacciones", "Fecha Más Antigua"];
    const rows = payoutQueue.map((item) => [
      item.business_name,
      item.clabe_deposit,
      item.amount_to_pay.toFixed(2),
      item.contact_email,
      item.transactions_count.toString(),
      format(new Date(item.oldest_payment_date), "yyyy-MM-dd"),
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `dispersiones_ventas_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    toast.success("CSV exportado correctamente");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado al portapapeles");
  };

  if (isLoadingAdmin)
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="animate-spin" />
      </div>
    );
  if (!isSuperAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Landmark className="h-7 w-7 text-indigo-500" />
            Finanzas Admin
          </h1>
          <p className="text-muted-foreground mt-1">Panel de control financiero unificado</p>
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
                Deuda Ventas
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

        {/* --- TABS --- */}
        <Tabs defaultValue="merchants" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 max-w-md">
            <TabsTrigger value="merchants" className="flex gap-2">
              <Building2 className="h-4 w-4" /> Dispersión Ventas
            </TabsTrigger>
            <TabsTrigger value="referrals" className="flex gap-2">
              <Users className="h-4 w-4" /> Dispersión Referidos
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: VENTAS DE PRODUCTOS */}
          <TabsContent value="merchants">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Cola de Dispersión (Ventas)</h2>
                <p className="text-sm text-muted-foreground">Pago a proveedores por productos vendidos</p>
              </div>
              <Button onClick={handleExportCSV} className="gap-2" disabled={payoutQueue.length === 0}>
                <Download className="h-4 w-4" /> CSV Bancario
              </Button>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Negocio</TableHead>
                    <TableHead>CLABE</TableHead>
                    <TableHead className="text-center">Transacciones</TableHead>
                    <TableHead className="text-right">Monto a Pagar</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingPayoutQueue ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        Cargando...
                      </TableCell>
                    </TableRow>
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
                          <p className="font-medium">{item.business_name}</p>
                          <p className="text-xs text-muted-foreground">{item.contact_email}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-muted px-2 py-1 rounded">{item.clabe_deposit}</code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(item.clabe_deposit)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{item.transactions_count}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-emerald-600">
                          {formatCurrency(item.amount_to_pay)}
                        </TableCell>
                        <TableCell className="text-right">
                          {/* AQUÍ AGREGUÉ EL BOTÓN QUE FALTABA */}
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedItem(item);
                              setModalType("product");
                            }}
                          >
                            Marcar Pagado
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* TAB 2: REFERIDOS */}
          <TabsContent value="referrals">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-foreground">Cola de Dispersión (Referidos)</h2>
              <p className="text-sm text-muted-foreground">Comisiones por suscripciones (Lógica 2 meses)</p>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario / Email</TableHead>
                    <TableHead className="text-center">Pagos</TableHead>
                    <TableHead className="text-right">Total a Pagar</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingReferrals ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        Cargando...
                      </TableCell>
                    </TableRow>
                  ) : referralsQueue.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No hay comisiones pendientes
                      </TableCell>
                    </TableRow>
                  ) : (
                    referralsQueue.map((item) => (
                      <TableRow key={item.user_id}>
                        <TableCell className="font-medium">{item.email}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{item.pending_items_count}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-emerald-600">
                          {formatCurrency(item.total_to_pay)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedItem(item);
                              setModalType("referral");
                            }}
                          >
                            Pagar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>

        {/* MODAL DE CONFIRMACIÓN ÚNICO (ADAPTATIVO) */}
        <Dialog open={modalType !== null} onOpenChange={(open) => !open && setModalType(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Pago Manual</DialogTitle>
              <DialogDescription>
                {modalType === "product"
                  ? "Esto marcará todas las transacciones pendientes de este negocio como 'Pagadas'. Asegúrate de haber hecho la transferencia."
                  : "Esto marcará las comisiones de referido como 'Pagadas'."}
              </DialogDescription>
            </DialogHeader>

            {selectedItem && (
              <div className="py-4 text-center">
                <p className="text-sm text-slate-500">Destinatario</p>
                <p className="font-bold mb-2">
                  {modalType === "product" ? selectedItem.business_name : selectedItem.email}
                </p>

                <p className="text-sm text-slate-500">Monto Transferido</p>
                <p className="text-3xl font-bold text-emerald-600">
                  {formatCurrency(modalType === "product" ? selectedItem.amount_to_pay : selectedItem.total_to_pay)}
                </p>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setModalType(null)}>
                Cancelar
              </Button>
              <Button
                onClick={modalType === "product" ? handleMarkProductBatchPaid : handleMarkReferralPaid}
                disabled={processingPayment}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {processingPayment ? <Loader2 className="animate-spin h-4 w-4" /> : "Confirmar Pago"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
