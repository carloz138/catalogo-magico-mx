import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Providers
import { AuthProvider } from "@/contexts/AuthContext";
import { RoleProvider } from "@/contexts/RoleContext";
import { DevSimulationProvider } from "@/contexts/DevSimulationContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { QuoteCartProvider } from "@/contexts/QuoteCartContext";
import { SaaSMarketingProvider } from "@/providers/SaaSMarketingProvider";

// Dev Tools
import { DevToolbar } from "@/components/dev/DevToolbar";
import { MockModeBanner } from "@/components/dev/MockModeBanner";

// Components & Layouts
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";

// --- Pages ---
// Public Pages
import Index from "@/pages/Index";
import LoginPage from "@/pages/LoginPage";
import DemoPage from "@/pages/DemoPage";
import PublicCatalog from "@/pages/PublicCatalog";
import { SubdomainRouter } from "@/components/routing/SubdomainRouter";
import ActivateCatalog from "@/pages/ActivateCatalog";
import CompleteActivation from "@/pages/CompleteActivation";
import TermsAndConditions from "@/pages/TermsAndConditions";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import ResetPassword from "@/pages/ResetPassword";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import NotFound from "@/pages/NotFound";
import WhySubscribePage from "@/pages/WhySubscribePage";
import QuoteTracking from "@/pages/QuoteTracking";
import TrackQuotePage from "@/pages/TrackQuotePage";
import OpenpayDemo from "@/pages/OpenpayDemo";

// Protected (Dashboard) Pages
import MainDashboard from "@/pages/MainDashboard";
import Analytics from "@/pages/Analytics";
import Upload from "@/pages/Upload";
import Products from "@/pages/Products";
import ProductsManagement from "@/pages/ProductsManagement";
import DeletedProducts from "@/pages/DeletedProducts";
import Catalogs from "@/pages/Catalogs";
import DigitalCatalogForm from "@/pages/DigitalCatalogForm";
import ImageReview from "@/pages/ImageReview";
import TemplateSelectionEnhanced from "@/components/enhanced/TemplateSelectionEnhanced";
import Checkout from "@/pages/Checkout";
import PaymentInstructions from "@/pages/PaymentInstructions";
import PaymentSuccess from "@/pages/PaymentSuccess";
import BusinessInfoPage from "@/pages/BusinessInfoPage";
import BusinessInfoSettings from "@/pages/BusinessInfoSettings";
import OnboardingPage from "@/pages/OnboardingPage";
import BulkUpload from "@/pages/BulkUpload";
import QuotesPage from "@/pages/quotes/index";
import QuoteDetailPage from "@/pages/quotes/QuoteDetail";
import DistributionNetwork from "@/pages/DistributionNetwork";
import ResellerDashboard from "@/pages/ResellerDashboard";
import ProductPriceEditor from "@/pages/reseller/ProductPriceEditor";
import ConsolidateOrderPage from "@/pages/reseller/ConsolidateOrderPage";
import ConsolidatedOrdersListPage from "@/pages/reseller/ConsolidatedOrdersListPage";
import MarketRadar from "@/pages/MarketRadar";
import Marketplace from "@/pages/Marketplace";
import BankingSettings from "@/pages/dashboard/BankingSettings";
import OrdersPage from "@/pages/orders/index";
import SupplierOrdersPage from "@/pages/supplier/SupplierOrdersPage"; // ✅ NUEVA PÁGINA IMPORTADA

const queryClient = new QueryClient();

const App = () => {
  // --- 🔥 FIX CRÍTICO: DETECTOR DE SESIÓN CORRUPTA ---
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        console.log("⚠️ Sesión cerrada o inválida. Limpiando almacenamiento...");
        localStorage.removeItem("sb-aibdxsebwhalbnugsqel-auth-token");
        queryClient.clear();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <SaaSMarketingProvider>
            <AuthProvider>
              <DevSimulationProvider>
                <RoleProvider>
                  <SubscriptionProvider>
                    {/* Dev Tools - only visible to admins */}
                    <MockModeBanner />
                    <DevToolbar />

                    <Routes>
                      {/* --- Rutas Públicas (Sin Sidebar) --- */}
                      <Route path="/" element={<SubdomainRouter fallback={<Index />} />} />
                      <Route path="/login" element={<LoginPage />} />

                      {/* RUTA DEMO INTERACTIVO */}
                      <Route path="/demo" element={<DemoPage />} />

                      <Route path="/creditos" element={<Navigate to="/checkout" replace />} />
                      <Route path="/why-subscribe" element={<WhySubscribePage />} />
                      <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
                      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                      <Route path="/reset-password" element={<ResetPassword />} />

                      {/* Ruta OpenPay Demo */}
                      <Route path="/openpay-demo" element={<OpenpayDemo />} />

                      {/* Ruta Catálogos Públicos */}
                      <Route
                        path="/c/:slug"
                        element={
                          <QuoteCartProvider>
                            <PublicCatalog />
                          </QuoteCartProvider>
                        }
                      />

                      {/* Rutas de Activación y Tracking */}
                      <Route path="/track" element={<ActivateCatalog />} />
                      <Route path="/blog" element={<Blog />} />
                      <Route path="/blog/:slug" element={<BlogPost />} />
                      <Route path="/tracking/:token" element={<QuoteTracking />} />
                      <Route path="/track/:token" element={<TrackQuotePage />} />

                      {/* --- Rutas Protegidas (Con Sidebar) --- */}
                      <Route element={<ProtectedRoute />}>
                        <Route element={<DashboardLayout />}>
                          <Route path="/dashboard" element={<MainDashboard />} />
                          <Route path="/analytics" element={<Analytics />} />
                          <Route path="/upload" element={<Upload />} />
                          <Route path="/products" element={<Products />} />
                          <Route path="/products/bulk-upload" element={<BulkUpload />} />
                          <Route path="/products-management" element={<ProductsManagement />} />
                          <Route path="/deleted-products" element={<DeletedProducts />} />
                          <Route path="/image-review" element={<ImageReview />} />
                          <Route path="/template-selection" element={<TemplateSelectionEnhanced />} />
                          <Route path="/catalogs" element={<Catalogs />} />
                          <Route path="/catalogs/new" element={<DigitalCatalogForm />} />
                          <Route path="/catalogs/:id/edit" element={<DigitalCatalogForm />} />

                          {/* Ventas */}
                          <Route path="/quotes" element={<QuotesPage />} />
                          <Route path="/quotes/:id" element={<QuoteDetailPage />} />

                          {/* Logística L2 (Mis Pedidos como cliente) */}
                          <Route path="/orders" element={<OrdersPage />} />

                          {/* ✅ Logística L1 (Surtir Pedidos) */}
                          <Route path="/supplier/orders" element={<SupplierOrdersPage />} />

                          {/* Red y Revendedores */}
                          <Route path="/market-radar" element={<MarketRadar />} />
                          <Route path="/marketplace" element={<Marketplace />} />
                          <Route path="/network" element={<DistributionNetwork />} />
                          <Route path="/dashboard/reseller" element={<ResellerDashboard />} />
                          <Route path="/reseller/edit-prices" element={<ProductPriceEditor />} />
                          <Route path="/reseller/consolidated-orders" element={<ConsolidatedOrdersListPage />} />
                          <Route path="/reseller/consolidate/:supplierId" element={<ConsolidateOrderPage />} />

                          {/* Configuración y Pagos */}
                          <Route path="/complete-activation" element={<CompleteActivation />} />
                          <Route path="/business-info" element={<BusinessInfoPage />} />
                          <Route path="/settings/business" element={<BusinessInfoSettings />} />
                          <Route path="/dashboard/banking" element={<BankingSettings />} />

                          <Route path="/onboarding" element={<OnboardingPage />} />
                          <Route path="/checkout" element={<Checkout />} />
                          <Route path="/payment-success" element={<PaymentSuccess />} />
                          <Route path="/payment-instructions/:transactionId" element={<PaymentInstructions />} />
                        </Route>
                      </Route>

                      {/* Ruta para Not Found al final */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </SubscriptionProvider>
                </RoleProvider>
              </DevSimulationProvider>
            </AuthProvider>
          </SaaSMarketingProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

export default App;
