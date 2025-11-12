import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Providers
import { AuthProvider } from "@/contexts/AuthContext";
import { RoleProvider } from "@/contexts/RoleContext"; // 👈 ¡IMPORTANTE! Faltaba este
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";

// Components & Layouts
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layouts/DashboardLayout"; // 👈 El nuevo layout

// --- Pages ---
// Public Pages
import Index from "@/pages/Index";
import LoginPage from "@/pages/LoginPage";
import PublicCatalog from "@/pages/PublicCatalog";
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

const queryClient = new QueryClient();

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          {/* 👇 El RoleProvider debe envolver al SubscriptionProvider */}
          <RoleProvider>
            <SubscriptionProvider>
              <Routes>
                {/* --- Rutas Públicas (Sin Sidebar) --- */}
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/creditos" element={<Navigate to="/checkout" replace />} />
                <Route path="/why-subscribe" element={<WhySubscribePage />} />
                <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/c/:slug" element={<PublicCatalog />} />
                <Route path="/activar/:token" element={<ActivateCatalog />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/tracking/:token" element={<QuoteTracking />} />
                <Route path="/track/:token" element={<TrackQuotePage />} />

                {/* --- Rutas Protegidas (Con Sidebar) --- */}
                <Route element={<ProtectedRoute />}>
                  {/* 👇 AQUÍ ESTÁ EL CAMBIO: DashboardLayout envuelve todo */}
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
                    <Route path="/quotes" element={<QuotesPage />} />
                    <Route path="/quotes/:id" element={<QuoteDetailPage />} />
                    <Route path="/market-radar" element={<MarketRadar />} />
                    <Route path="/network" element={<DistributionNetwork />} />
                    <Route path="/dashboard/reseller" element={<ResellerDashboard />} />
                    <Route path="/reseller/edit-prices" element={<ProductPriceEditor />} />
                    <Route path="/reseller/consolidated-orders" element={<ConsolidatedOrdersListPage />} />
                    <Route path="/reseller/consolidate/:supplierId" element={<ConsolidateOrderPage />} />
                    <Route path="/complete-activation" element={<CompleteActivation />} />
                    <Route path="/business-info" element={<BusinessInfoPage />} />
                    <Route path="/settings/business" element={<BusinessInfoSettings />} />
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
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
