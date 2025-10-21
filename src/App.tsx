import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { RoleProvider } from "@/contexts/RoleContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Upload from "./pages/Upload";
import Products from "./pages/Products";
import ProductsManagement from "./pages/ProductsManagement";
import DeletedProducts from "./pages/DeletedProducts";
import Analytics from "./pages/Analytics";
import Catalogs from "./pages/Catalogs";
import DigitalCatalogForm from "./pages/DigitalCatalogForm";
import ImageReview from "./pages/ImageReview";
import PublicCatalog from "./pages/PublicCatalog";
import TemplateSelectionEnhanced from "@/components/enhanced/TemplateSelectionEnhanced";
import Checkout from "./pages/Checkout";
import PaymentInstructions from "./pages/PaymentInstructions";
import NotFound from "./pages/NotFound";
import PaymentSuccess from "./pages/PaymentSuccess";
import BusinessInfoPage from "./pages/BusinessInfoPage";
import OnboardingPage from "./pages/OnboardingPage";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ResetPassword from "./pages/ResetPassword";
import BulkUpload from "./pages/BulkUpload";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import QuotesPage from "./pages/quotes/index";
import QuoteDetailPage from "./pages/quotes/QuoteDetail";
import ActivateCatalog from "./pages/ActivateCatalog";
import DistributionNetwork from "./pages/DistributionNetwork";
import ResellerDashboard from "./pages/ResellerDashboard";
import CompleteActivation from "./pages/CompleteActivation";

// ✅ NUEVA IMPORTACIÓN: Importar el dashboard principal
import MainDashboard from "./pages/MainDashboard";

const queryClient = new QueryClient();

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <Routes>
            {/* Rutas Públicas */}
            <Route path="/" element={<Index />} />
            <Route path="/creditos" element={<Navigate to="/checkout" replace />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/c/:slug" element={<PublicCatalog />} />
            <Route path="/activar/:token" element={<ActivateCatalog />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />

            {/* Rutas Protegidas Agrupadas */}
            <Route
              element={
                <RoleProvider>
                  <ProtectedRoute />
                </RoleProvider>
              }
            >
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
              <Route path="/network" element={<DistributionNetwork />} />
              <Route path="/dashboard/reseller" element={<ResellerDashboard />} />
              <Route path="/complete-activation" element={<CompleteActivation />} />
              <Route path="/business-info" element={<BusinessInfoPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-instructions/:transactionId" element={<PaymentInstructions />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
