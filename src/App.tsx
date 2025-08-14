
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
import Catalogs from "./pages/Catalogs";
import ImageReview from "./pages/ImageReview";
// ✅ CAMBIO: Importar el nuevo componente mejorado
import TemplateSelectionEnhanced from "@/components/enhanced/TemplateSelectionEnhanced";
import Checkout from "./pages/Checkout";
import PaymentInstructions from "./pages/PaymentInstructions";
import NotFound from "./pages/NotFound";
import PaymentSuccess from "./pages/PaymentSuccess";
import BusinessInfoPage from "./pages/BusinessInfoPage";


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
            <Route path="/upload" element={
              <ProtectedRoute>
                <Upload />
              </ProtectedRoute>
            } />
            <Route path="/products" element={
              <ProtectedRoute>
                <Products />
              </ProtectedRoute>
            } />
            <Route path="/products-management" element={
              <ProtectedRoute>
                <ProductsManagement />
              </ProtectedRoute>
            } />
            <Route path="/image-review" element={
              <ProtectedRoute>
                <ImageReview />
              </ProtectedRoute>
            } />
            {/* ✅ CAMBIO: Usar el nuevo componente mejorado */}
            <Route path="/template-selection" element={
              <ProtectedRoute>
                <TemplateSelectionEnhanced />
              </ProtectedRoute>
            } />
            <Route path="/catalogs" element={
              <ProtectedRoute>
                <Catalogs />
              </ProtectedRoute>
            } />
            <Route path="/business-info" element={
              <ProtectedRoute>
                <BusinessInfoPage />
              </ProtectedRoute>
            } />
            <Route path="/checkout" element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            } />
            <Route path="/payment-success" element={
              <ProtectedRoute>
                <PaymentSuccess />
              </ProtectedRoute>
            } />
            <Route path="/payment-instructions/:transactionId" element={
              <ProtectedRoute>
                <PaymentInstructions />
              </ProtectedRoute>
            } />
            {/* Redirect old /creditos route to /checkout */}
            <Route path="/creditos" element={<Navigate to="/checkout" replace />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
