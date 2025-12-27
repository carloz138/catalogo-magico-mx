import React, { useState } from "react";
import { useMerchantStats } from "@/hooks/useMerchantStats";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // <--- IMPORTANTE
import {
  CircleDollarSign,
  Clock,
  CheckCircle2,
  TrendingUp,
  Calendar,
  Receipt,
  Wallet,
  HandCoins,
  Users,
  Lock,
  Unlock,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount / 100); // asumiendo centavos
};

const formatCurrencyRaw = (amount: number) => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
};

// --- MOCK DATA PARA REFERIDOS (Hasta que conectemos el Hook real) ---
// Esto simula la lógica de "2 meses" que hablamos
const mockReferralPayouts = [
  {
    id: "pay-101",
    referred_user: "Disfraces Monterrey",
    amount: 25000, // $250.00
    status: "ready", // Mes 1 (Ya pasó)
    release_date: "2025-01-01T00:00:00Z",
    payment_number: 1,
    total_payments: 2,
  },
  {
    id: "pay-102",
    referred_user: "Disfraces Monterrey",
    amount: 25000, // $250.00
    status: "locked", // Mes 2 (Futuro)
    release_date: "2025-02-01T00:00:00Z",
    payment_number: 2,
    total_payments: 2,
  },
  {
    id: "pay-103",
    referred_user: "Fiestas Juan",
    amount: 25000,
    status: "processed", // Ya pagado
    release_date: "2024-12-01T00:00:00Z",
    payment_number: 1,
    total_payments: 2,
  },
];

export default function MoneyDashboard() {
  const { stats, isLoadingStats, transactions, isLoadingTransactions } = useMerchantStats();

  // Calcular totales de referidos (Simulado)
  const referralAvailable = mockReferralPayouts
    .filter((p) => p.status === "ready")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const referralLocked = mockReferralPayouts
    .filter((p) => p.status === "locked")
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header General */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <CircleDollarSign className="h-7 w-7 text-indigo-600" />
            Panel Financiero
          </h1>
          <p className="text-muted-foreground mt-1">Gestiona tus ingresos por ventas y referidos</p>
        </div>

        {/* --- SISTEMA DE PESTAÑAS --- */}
        <Tabs defaultValue="sales" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="sales" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Ventas de Productos
            </TabsTrigger>
            <TabsTrigger value="referrals" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Programa de Referidos
            </TabsTrigger>
          </TabsList>

          {/* =================================================================================
                                          TAB 1: VENTAS (Tu código original)
             ================================================================================= */}
          <TabsContent value="sales">
            {/* KPI Cards Ventas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {/* Por Cobrar */}
              <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    Por Cobrar (Ventas)
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
                  <p className="text-xs text-muted-foreground mt-1">Ventas pendientes de depósito</p>
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
                  <p className="text-xs text-muted-foreground mt-1">Total transferido a tu cuenta</p>
                </CardContent>
              </Card>

              {/* Ventas Totales */}
              <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    Ventas Totales
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
                  <p className="text-xs text-muted-foreground mt-1">Volumen bruto de ventas</p>
                </CardContent>
              </Card>
            </div>

            {/* Transactions Section */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Receipt className="h-5 w-5 text-muted-foreground" />
                Historial de Ventas
              </h2>

              {isLoadingTransactions ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="p-4">
                    <Skeleton className="h-16 w-full" />
                  </Card>
                ))
              ) : transactions.length === 0 ? (
                <Card className="p-8 text-center">
                  <CircleDollarSign className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No hay ventas pagadas aún</p>
                </Card>
              ) : (
                transactions.map((tx) => {
                  const commission = tx.amount_total - tx.net_to_merchant;
                  const isPlatformFunds = tx.funds_held_by_platform;

                  return (
                    <Card
                      key={tx.id}
                      className="p-4 hover:shadow-md transition-shadow border-l-4 border-l-transparent hover:border-l-primary/20"
                    >
                      {/* ... (Todo tu código interno de la tarjeta de transacción se mantiene igual) ... */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(tx.paid_at), "dd MMM, HH:mm", { locale: es })}
                          </span>
                        </div>
                        {isPlatformFunds ? (
                          <Badge
                            variant="secondary"
                            className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-indigo-200"
                          >
                            <Wallet className="w-3 h-3 mr-1" /> Saldo en Plataforma
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200"
                          >
                            <HandCoins className="w-3 h-3 mr-1" /> Cobrado por Ti
                          </Badge>
                        )}
                      </div>

                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-xs text-muted-foreground">Orden: {tx.quote_id.slice(0, 8)}</p>
                          <p className="text-sm font-medium">Venta: {formatCurrency(tx.amount_total)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-rose-500 mb-1">Comisión: -{formatCurrency(commission)}</p>
                          <p className="text-lg font-bold text-emerald-600">+{formatCurrency(tx.net_to_merchant)}</p>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* =================================================================================
                                          TAB 2: REFERIDOS (NUEVO)
             ================================================================================= */}
          <TabsContent value="referrals">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {/* Disponible Ahora */}
              <Card className="border-emerald-500/20 bg-emerald-50/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-emerald-700 flex items-center gap-2">
                    <Unlock className="h-4 w-4" />
                    Disponible para Corte
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-emerald-700">{formatCurrency(referralAvailable)}</p>
                  <p className="text-xs text-emerald-600/80 mt-1">Se depositará en tu próximo corte</p>
                </CardContent>
              </Card>

              {/* Bloqueado (Mes 2) */}
              <Card className="border-slate-200 bg-slate-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Retenido (En espera)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-slate-600">{formatCurrency(referralLocked)}</p>
                  <p className="text-xs text-slate-400 mt-1">Comisiones futuras (2do mes)</p>
                </CardContent>
              </Card>
            </div>

            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              Desglose de Comisiones
            </h2>

            <div className="space-y-3">
              {mockReferralPayouts.map((payout) => (
                <Card key={payout.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-700">{payout.referred_user}</span>
                      <Badge variant="outline" className="text-xs font-normal">
                        Pago {payout.payment_number} de {payout.total_payments}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Liberación: {format(new Date(payout.release_date), "dd MMM yyyy", { locale: es })}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-lg text-slate-700">{formatCurrency(payout.amount)}</p>
                    {payout.status === "locked" && (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">
                        <Lock className="w-3 h-3 mr-1" /> Bloqueado
                      </Badge>
                    )}
                    {payout.status === "ready" && (
                      <Badge
                        variant="secondary"
                        className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Listo
                      </Badge>
                    )}
                    {payout.status === "processed" && (
                      <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-slate-200 text-[10px]">
                        Pagado
                      </Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
