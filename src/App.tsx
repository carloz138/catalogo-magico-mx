import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes - NO layout */}
            <Route path="/" element={<Index />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/c/:slug" element={<PublicCatalog />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            
            {/* Protected routes - WITH AppLayout */}
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Analytics />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Upload />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Products />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/products/bulk-upload"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <BulkUpload />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/products-management"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ProductsManagement />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/deleted-products"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <DeletedProducts />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/image-review"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ImageReview />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/template-selection"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <TemplateSelectionEnhanced />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/catalogs"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Catalogs />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/catalogs/new"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <DigitalCatalogForm />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/catalogs/:id/edit"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <DigitalCatalogForm />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/quotes"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <QuotesPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/quotes/:id"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <QuoteDetailPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/business-info"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <BusinessInfoPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <OnboardingPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Checkout />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment-success"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <PaymentSuccess />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment-instructions/:transactionId"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <PaymentInstructions />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            
            {/* Redirects */}
            <Route path="/creditos" element={<Navigate to="/checkout" replace />} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
