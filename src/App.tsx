import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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
// ✅ CAMBIO: Importar el nuevo componente mejorado
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
// ✅ AGREGAR estas importaciones
import QuotesPage from "./pages/quotes/index";
import QuoteDetailPage from "./pages/quotes/QuoteDetail";
import ActivateCatalog from "./pages/ActivateCatalog";
import DistributionNetwork from "./pages/DistributionNetwork";
import ResellerDashboard from "./pages/ResellerDashboard";
import CompleteActivation from "./pages/CompleteActivation";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <Upload />
                </ProtectedRoute>
              }
            />
            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <Products />
                </ProtectedRoute>
              }
            />
            <Route
              path="/products/bulk-upload"
              element={
                <ProtectedRoute>
                  <BulkUpload />
                </ProtectedRoute>
              }
            />
            <Route
              path="/products-management"
              element={
                <ProtectedRoute>
                  <ProductsManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/deleted-products"
              element={
                <ProtectedRoute>
                  <DeletedProducts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/image-review"
              element={
                <ProtectedRoute>
                  <ImageReview />
                </ProtectedRoute>
              }
            />
            {/* ✅ CAMBIO: Usar el nuevo componente mejorado */}
            <Route
              path="/template-selection"
              element={
                <ProtectedRoute>
                  <TemplateSelectionEnhanced />
                </ProtectedRoute>
              }
            />
            <Route
              path="/catalogs"
              element={
                <ProtectedRoute>
                  <Catalogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/catalogs/new"
              element={
                <ProtectedRoute>
                  <DigitalCatalogForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/catalogs/:id/edit"
              element={
                <ProtectedRoute>
                  <DigitalCatalogForm />
                </ProtectedRoute>
              }
            />
            {/* ✅ AGREGAR estas rutas - Quotes Dashboard */}
            <Route
              path="/quotes"
              element={
                <ProtectedRoute>
                  <QuotesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quotes/:id"
              element={
                <ProtectedRoute>
                  <QuoteDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/network"
              element={
                <ProtectedRoute>
                  <DistributionNetwork />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/reseller"
              element={
                <ProtectedRoute>
                  <ResellerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/complete-activation"
              element={
                <ProtectedRoute>
                  <CompleteActivation />
                </ProtectedRoute>
              }
            />

            <Route
              path="/business-info"
              element={
                <ProtectedRoute>
                  <BusinessInfoPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment-success"
              element={
                <ProtectedRoute>
                  <PaymentSuccess />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment-instructions/:transactionId"
              element={
                <ProtectedRoute>
                  <PaymentInstructions />
                </ProtectedRoute>
              }
            />
            {/* Redirect old /creditos route to /checkout */}
            <Route path="/creditos" element={<Navigate to="/checkout" replace />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Public catalog route - no auth required */}
            <Route path="/c/:slug" element={<PublicCatalog />} />
            <Route path="/activar/:token" element={<ActivateCatalog />} />

            {/* Blog routes - public, no auth required */}
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
