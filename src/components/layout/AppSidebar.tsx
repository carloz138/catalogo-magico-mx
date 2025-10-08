// /src/components/layout/AppSidebar.tsx - DISEÑO SÓLIDO Y PROFESIONAL
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessInfo } from "@/hooks/useBusinessInfo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Home,
  Upload,
  Package,
  Palette,
  BarChart3,
  Settings,
  LogOut,
  User,
  CreditCard,
  FileImage,
  Layers,
  Crown,
  Building2,
  FileText,
  ChevronRight,
  Bell,
  PlayCircle,
  AlertTriangle,
  BookOpen,
  PackageOpen,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

// ==========================================
// TIPOS E INTERFACES
// ==========================================

interface MenuItem {
  title: string;
  path?: string;
  icon: React.ComponentType<any>;
  badge?: string;
  badgeColor?: string;
  items?: MenuItem[];
}

// ==========================================
// NAVEGACIÓN PLANA Y CLARA
// ==========================================

const navigationItems = [
  // GRUPO 1: Acciones Principales (44px altura mínima)
  { title: "Subir Productos", path: "/upload", icon: Upload, primary: true },
  { title: "Crear Catalogo", path: "/products", icon: Package, primary: true },
  { title: "Mis Catálogos", path: "/catalogs", icon: BookOpen, primary: true },

  // GRUPO 2: Acciones Secundarias
  { title: "Carga Masiva", path: "/products/bulk-upload", icon: PackageOpen, badge: "Nuevo" },
  { title: "Editar Productos", path: "/products-management", icon: Settings },
  { title: "Analytics", path: "/analytics", icon: BarChart3 },
  { title: "Comprar Créditos", path: "/checkout", icon: CreditCard },

  // GRUPO 3: Configuración
  { title: "Guía de Inicio", path: "/onboarding", icon: PlayCircle, badge: "5 min" },
  { title: "Info del Negocio", path: "/business-info", icon: Building2 },
];

// ==========================================
// COMPONENTE PRINCIPAL CON DISEÑO SÓLIDO
// ==========================================

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const { businessInfo, hasBusinessInfo } = useBusinessInfo();
  const navigate = useNavigate();
  const location = useLocation();

  // Verificar si falta información importante del negocio
  const isBusinessInfoIncomplete = () => {
    if (!businessInfo) return true;

    const requiredFields = [businessInfo.business_name, businessInfo.phone, businessInfo.email, businessInfo.address];

    return requiredFields.some((field) => !field || field.trim() === "");
  };

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "No se pudo cerrar la sesión",
        variant: "destructive",
      });
    }
  };

  const isActiveRoute = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  // ==========================================
  // RENDER NAVEGACIÓN PLANA
  // ==========================================

  const renderNavItem = (item: (typeof navigationItems)[0]) => {
    const isActive = isActiveRoute(item.path);
    const isPrimary = item.primary;

    return (
      <SidebarMenuItem key={item.path}>
        <SidebarMenuButton asChild isActive={isActive}>
          <button
            onClick={() => navigate(item.path)}
            className={`
              flex items-center gap-3 w-full px-3 rounded-lg transition-all
              ${isPrimary ? "min-h-[44px] py-3" : "min-h-[40px] py-2"}
              ${
                isActive
                  ? "bg-blue-50 text-blue-700 font-semibold border-l-3 border-blue-600"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              }
            `}
          >
            <item.icon className={isPrimary ? "w-5 h-5" : "w-4 h-4"} />
            <span className="flex-1 text-left text-sm">{item.title}</span>
            {item.badge && <Badge className="text-xs bg-green-100 text-green-700 border-green-200">{item.badge}</Badge>}
          </button>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  // ==========================================
  // ✅ RENDER PRINCIPAL CON DISEÑO SÓLIDO
  // ==========================================

  return (
    <Sidebar className="border-r border-slate-200 bg-white w-72 min-w-72">
      {/* ✅ HEADER CON DISEÑO PREMIUM */}
      <SidebarHeader className="border-b border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-lg">CatifyPro</h2>
          </div>
        </div>
      </SidebarHeader>

      {/* ✅ USER INFO CON DISEÑO SÓLIDO */}
      <SidebarGroup className="border-b border-slate-200 bg-slate-50">
        <SidebarGroupContent>
          <div className="flex items-center space-x-3 p-3 mx-2 rounded-lg bg-white border border-slate-200 shadow-sm">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user?.email?.split("@")[0] || "Usuario"}</p>
              <p className="text-xs text-slate-500 truncate">Plan Profesional</p>
            </div>
            <div className="flex items-center space-x-1">
              {isBusinessInfoIncomplete() && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-orange-100 relative"
                  onClick={() => navigate("/business-info")}
                  title="Completar información del negocio"
                >
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <Badge className="absolute -top-1 -right-1 h-2 w-2 p-0 bg-red-500 border-white">
                    <span className="sr-only">Información incompleta</span>
                  </Badge>
                </Button>
              )}
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-100">
                <Bell className="w-4 h-4 text-slate-400" />
              </Button>
            </div>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* ✅ NAVIGATION CONTENT CON JERARQUÍA VISUAL CLARA */}
      <SidebarContent className="px-3 py-4">
        {/* Grupo Principal */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase px-3 mb-2">
            Principal
          </SidebarGroupLabel>
          <SidebarMenu className="space-y-1">
            {navigationItems.filter((item) => item.primary).map(renderNavItem)}
          </SidebarMenu>
        </SidebarGroup>

        {/* Espaciador visual */}
        <div className="h-px bg-slate-200 my-4 mx-3" />

        {/* Grupo Herramientas */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase px-3 mb-2">
            Herramientas
          </SidebarGroupLabel>
          <SidebarMenu className="space-y-1">
            {navigationItems
              .filter((item) => !item.primary && item.path !== "/onboarding" && item.path !== "/business-info")
              .map(renderNavItem)}
          </SidebarMenu>
        </SidebarGroup>

        {/* Espaciador visual */}
        <div className="h-px bg-slate-200 my-4 mx-3" />

        {/* Grupo Configuración */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase px-3 mb-2">
            Configuración
          </SidebarGroupLabel>
          <SidebarMenu className="space-y-1">
            {navigationItems
              .filter((item) => item.path === "/onboarding" || item.path === "/business-info")
              .map(renderNavItem)}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* ✅ FOOTER CON DISEÑO SÓLIDO */}
      <SidebarFooter className="border-t border-slate-200 bg-slate-50 p-4">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 font-medium"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Cerrar Sesión
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
