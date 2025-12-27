import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { useAdminFinance } from "@/hooks/useAdminFinance";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Landmark, Upload, Download, Building2, Users, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

// --- UTILIDAD: DESCARGAR CSV ---
const downloadCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) return;
  const csvContent = [
    Object.keys(data[0]).join(","), // Encabezados
    ...data.map((row) =>
      Object.values(row)
        .map((val) => `"${val}"`)
        .join(","),
    ), // Filas
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

export default function AdminFinance() {
  const navigate = useNavigate();
  const { isSuperAdmin, isLoading: isLoadingAdmin } = useSuperAdmin();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. DATA DE VENTAS (Merchants)
  const { payoutQueue, refetch: refetchMerchants } = useAdminFinance();

  // 2. DATA DE REFERIDOS
  const [referralsQueue, setReferralsQueue] = useState<any[]>([]);
  const [loadingReferrals, setLoadingReferrals] = useState(true);

  // ESTADOS DE UI
  const [processingBatch, setProcessingBatch] = useState(false);
  const [activeTab, setActiveTab] = useState("merchants");

  // VALIDACIÓN DE SEGURIDAD
  useEffect(() => {
    if (!isLoadingAdmin && !isSuperAdmin) {
      toast.error("Acceso denegado");
      navigate("/dashboard");
    }
  }, [isSuperAdmin, isLoadingAdmin, navigate]);

  // CARGAR REFERIDOS
  useEffect(() => {
    if (isSuperAdmin) fetchReferralsQueue();
  }, [isSuperAdmin]);

  const fetchReferralsQueue = async () => {
    setLoadingReferrals(true);
    // ✅ AQUÍ ESTÁ EL CAMBIO: Apuntamos a la vista nueva que acabas de crear
    const { data, error } = await supabase.from("admin_referrals_payout_view" as any).select("*");

    if (error) {
      console.error("Error cargando referidos:", error);
      // No mostramos toast error intrusivo si solo está vacío, pero lo logueamos
    }
    setReferralsQueue(data || []);
    setLoadingReferrals(false);
  };

  // ==============================================================================
  // A. GENERAR LOTE (BATCH) Y DESCARGAR CSV
  // ==============================================================================
  const handleGenerateBatch = async () => {
    const isMerchant = activeTab === "merchants";
    const queue = isMerchant ? payoutQueue : referralsQueue;

    if (queue.length === 0) {
      toast.error("No hay pagos pendientes para generar.");
      return;
    }

    setProcessingBatch(true);
    try {
      // 1. Calcular total del lote
      const totalAmount = queue.reduce((acc, item) => acc + (isMerchant ? item.amount_to_pay : item.total_to_pay), 0);

      // 2. Crear el registro en 'payout_batches'
      const { data: batch, error: batchErr } = await supabase
        .from("payout_batches" as any)
        .insert({
          total_amount: totalAmount,
          status: "sent", // Estado inicial: Enviado al banco
          batch_type: isMerchant ? "merchant" : "referral",
        })
        .select()
        .single();

      if (batchErr) throw batchErr;

      const batchId = (batch as any).id;

      // 3. Vincular los pagos individuales a este Lote (UPDATE masivo)
      if (isMerchant) {
        // Para comercios: Actualizamos payment_transactions
        const merchantIds = queue.map((q) => q.merchant_id);

        await supabase
          .from("payment_transactions" as any)
          .update({ batch_id: batchId }) // Vinculamos al lote
          .in("net_to_merchant", merchantIds)
          .eq("funds_held_by_platform", true)
          .is("payout_status", null);
      } else {
        // Para referidos: Actualizamos affiliate_payouts
        const userIds = queue.map((q) => q.user_id);

        await supabase
          .from("affiliate_payouts" as any)
          .update({ batch_id: batchId }) // Vinculamos al lote
          .in("user_id", userIds)
          .eq("status", "ready")
          .is("batch_id", null);
      }

      // 4. Generar CSV para el Banco
      const batchData = queue.map((item) => ({
        ID_Sistema: isMerchant ? item.merchant_id : item.user_id,
        Beneficiario: isMerchant ? item.business_name : item.email,
        CLABE: isMerchant ? item.clabe_deposit : "PENDIENTE", // Placeholder
        Monto: (isMerchant ? item.amount_to_pay : item.total_to_pay).toFixed(2),
        Concepto: isMerchant ? `Pago Ventas ${batchId.slice(0, 4)}` : `Comis Ref ${batchId.slice(0, 4)}`,
        Batch_ID: batchId,
      }));

      const fileName = `LOTE_${isMerchant ? "VENTAS" : "REF"}_${format(new Date(), "yyyyMMdd")}_${batchId.slice(0, 6)}.csv`;
      downloadCSV(batchData, fileName);

      toast.success("Lote generado y descargado. Súbelo a tu banco.");

      // Recargar listas
      refetchMerchants();
      fetchReferralsQueue();
    } catch (error: any) {
      console.error(error);
      toast.error("Error generando lote: " + error.message);
    } finally {
      setProcessingBatch(false);
    }
  };

  // ==============================================================================
  // B. CONCILIAR RESPUESTA (SUBIR CSV)
  // ==============================================================================
  const handleUploadResponse = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      await processConciliation(text);
    };
    reader.readAsText(file);

    // Limpiar input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const processConciliation = async (csvText: string) => {
    setProcessingBatch(true);
    try {
      const rows = csvText.split("\n").slice(1); // Ignorar header
      let successCount = 0;

      for (const row of rows) {
        if (!row.trim()) continue;
        const cols = row.split(",").map((c) => c.replace(/"/g, "").trim());

        // Validar que tenga datos mínimos
        if (cols.length < 6) continue;

        const userId = cols[0];
        const batchId = cols[5];

        if (activeTab === "merchants") {
          // Marcar VENTAS como pagadas
          const { error } = await supabase
            .from("payment_transactions" as any)
            .update({
              payout_status: "paid",
              payout_date: new Date().toISOString(),
              payout_reference: `BATCH_${batchId}`,
            })
            .eq("net_to_merchant", userId)
            .eq("batch_id", batchId);

          if (!error) successCount++;
        } else {
          // Marcar REFERIDOS como pagados
          const { error } = await supabase
            .from("affiliate_payouts" as any)
            .update({ status: "processed" })
            .eq("user_id", userId)
            .eq("batch_id", batchId);

          if (!error) successCount++;
        }
      }

      toast.success(`Conciliación Finalizada: ${successCount} registros marcados como pagados.`);
      refetchMerchants();
      fetchReferralsQueue();
    } catch (error: any) {
      toast.error("Error al procesar archivo: " + error.message);
    } finally {
      setProcessingBatch(false);
    }
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
        {/* Header con Botones de Acción */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Landmark className="h-7 w-7 text-indigo-500" /> Finanzas Admin
            </h1>
            <p className="text-muted-foreground mt-1">Dispersión Masiva y Conciliación Bancaria</p>
          </div>

          <div className="flex gap-2">
            <Input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleUploadResponse} />

            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={processingBatch}>
              <Upload className="h-4 w-4 mr-2" />
              1. Conciliar Respuesta
            </Button>

            <Button
              onClick={handleGenerateBatch}
              disabled={processingBatch}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {processingBatch ? (
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              2. Generar Lote Bancario
            </Button>
          </div>
        </div>

        {/* --- TABS --- */}
        <Tabs defaultValue="merchants" onValueChange={setActiveTab} className="w-full">
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
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Pagos Pendientes a Comercios</span>
                  <Badge variant="secondary">{payoutQueue.length} pendientes</Badge>
                </CardTitle>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Negocio</TableHead>
                    <TableHead>CLABE</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payoutQueue.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-12 text-muted-foreground flex flex-col items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="h-8 w-8 text-green-500/50" />
                        Todo pagado. No hay ventas pendientes.
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
                          <code className="bg-muted px-2 py-1 rounded text-xs">{item.clabe_deposit}</code>
                        </TableCell>
                        <TableCell className="text-right font-bold text-emerald-600">
                          ${item.amount_to_pay.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                            Por Dispersar
                          </Badge>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Pagos Pendientes a Afiliados</span>
                  <Badge variant="secondary">{referralsQueue.length} pendientes</Badge>
                </CardTitle>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email Usuario</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="text-center">Pagos Agrupados</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingReferrals ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4">
                        <Loader2 className="animate-spin inline mr-2" /> Cargando...
                      </TableCell>
                    </TableRow>
                  ) : referralsQueue.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center py-12 text-muted-foreground flex flex-col items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="h-8 w-8 text-green-500/50" />
                        Todo pagado. No hay comisiones pendientes.
                      </TableCell>
                    </TableRow>
                  ) : (
                    referralsQueue.map((item) => (
                      <TableRow key={item.user_id}>
                        <TableCell>{item.email}</TableCell>
                        <TableCell className="text-right font-bold text-emerald-600">
                          ${item.total_to_pay.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                            {item.payouts_count} comisiones
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
