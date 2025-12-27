import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; // AJUSTA ESTA RUTA SI ES NECESARIO
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, Copy, Loader2, Building2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminPayoutDashboard() {
  const { toast } = useToast();
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    setLoading(true);
    // Consultamos la VISTA SQL
    const { data, error } = await supabase.from('admin_pending_payouts_view').select('*');
    if (error) console.error(error);
    else setPayouts(data || []);
    setLoading(false);
  };

  const markAsPaid = async () => {
    if (!selectedPayout) return;
    setProcessing(true);
    try {
      // 1. Crear registro de Lote
      const { data: batch, error: batchErr } = await supabase
        .from('payout_batches')
        .insert({ total_amount: selectedPayout.total_to_pay, status: 'completed' })
        .select()
        .single();
      
      if (batchErr) throw batchErr;

      // 2. Actualizar pagos individuales a 'processed'
      const { error: updateErr } = await supabase
        .from('affiliate_payouts')
        .update({ status: 'processed', batch_id: batch.id })
        .eq('user_id', selectedPayout.user_id)
        .eq('status', 'ready');

      if (updateErr) throw updateErr;

      toast({ title: "Pago registrado exitosamente" });
      setConfirmModalOpen(false);
      fetchPayouts(); // Recargar lista
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex gap-2 items-center">
            <Building2 /> Admin de Pagos Referidos
        </h1>
      </div>

      <Card>
        <CardHeader><CardTitle>Pendientes de Pago</CardTitle></CardHeader>
        <CardContent>
            {loading ? <Loader2 className="animate-spin" /> : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email Usuario</TableHead>
                            <TableHead className="text-right">A Pagar</TableHead>
                            <TableHead className="text-right">Acción</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payouts.map((p) => (
                            <TableRow key={p.user_id}>
                                <TableCell>{p.email}</TableCell>
                                <TableCell className="text-right font-bold">${p.total_to_pay}</TableCell>
                                <TableCell className="text-right">
                                    <Button onClick={() => { setSelectedPayout(p); setConfirmModalOpen(true); }}>
                                        Pagar
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {payouts.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-4">Todo al día</TableCell></TableRow>}
                    </TableBody>
                </Table>
            )}
        </CardContent>
      </Card>

      {/* Modal Confirmación */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Confirmar Transferencia</DialogTitle></DialogHeader>
            <DialogDescription>¿Ya transferiste <b>${selectedPayout?.total_to_pay}</b> a este usuario?</DialogDescription>
            <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmModalOpen(false)}>Cancelar</Button>
                <Button onClick={markAsPaid} disabled={processing} className="bg-green-600">
                    {processing ? <Loader2 className="animate-spin" /> : <><CheckCircle2 className="mr-2 h-4 w-4"/> Confirmar</>}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
