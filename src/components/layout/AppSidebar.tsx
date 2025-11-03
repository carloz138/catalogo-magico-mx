// /src/components/layout/AppSidebar.tsx - VERSIÓN CORREGIDA SIN COLLAPSE
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
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Upload,
  Package,
  BarChart3,
  Settings,
  LogOut,
  CreditCard,
  Building2,
  FileText,
  BookOpen,
  PackageOpen,
  ClipboardList,
  Network,
  LayoutDashboard,
  PlayCircle,
  AlertTriangle,
  Sparkles,
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
  primary?: boolean;
}

// ==========================================
// ✅ NAVEGACIÓN OPTIMIZADA (5-7 items principales)
// ==========================================
const navigationItems: MenuItem[] = [
  // GRUPO 1: Acciones Principales (5 items)
  {
    title: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    primary: true,
  },
  {
    title: "Subir Productos",
    path: "/upload",
    icon: Upload,
    primary: true,
  },
  {
    title: "Crear Catálogo",
    path: "/products",
    icon: Package,
    primary: true,
  },
  {
    title: "Mis Catálogos",
    path: "/catalogs",
    icon: BookOpen,
    primary: true,
  },
  {
    title: "Cotizaciones",
    path: "/quotes",
    icon: ClipboardList,
    primary: true,
  },

  // GRUPO 2: Herramientas
  {
    title: "Red de Distribución",
    path: "/network",
    icon: Network,
    badge: "Nuevo",
  },
  {
    title: "Nuevo Catálogo Digital",
    path: "/catalogs/new",
    icon: FileText,
  },
  {
    title: "Carga Masiva",
    path: "/products/bulk-upload",
    icon: PackageOpen,
    badge: "Beta",
  },
  {
    title: "Editar Productos",
    path: "/products-management",
    icon: Settings,
  },
  {
    title: "Analytics",
    path: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Comprar Créditos",
    path: "/checkout",
    icon: CreditCard,
  },

  // GRUPO 3: Configuración
  {
    title: "Guía de Inicio",
    path: "/onboarding",
    icon: PlayCircle,
    badge: "5 min",
  },
  {
    title: "Info del Negocio",
    path: "/business-info",
    icon: Building2,
  },
];

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export function AppSidebar() {
  const { user, signOut } = useAuth();
  const { businessInfo } = useBusinessInfo();
  const navigate = useNavigate();
  const location = useLocation();

  // ==========================================
  // VERIFICACIÓN DE NEGOCIO
  // ==========================================
  const isBusinessInfoIncomplete = () => {
    if (!businessInfo) return true;
    const requiredFields = [businessInfo.business_name, businessInfo.phone, businessInfo.email, businessInfo.address];
    return requiredFields.some((field) => !field || field.trim() === "");
  };

  const showBusinessWarning = isBusinessInfoIncomplete();

  // ==========================================
  // HANDLERS
  // ==========================================
  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });
      navigate("/login");
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cerrar la sesión",
        variant: "destructive",
      });
    }
  };

  const isActiveRoute = (path?: string) => {
    if (!path) return false;
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path) && path !== "/";
  };

  // ==========================================
  // RENDER NAVEGACIÓN
  // ==========================================
  const renderNavItem = (item: MenuItem) => {
    const isActive = isActiveRoute(item.path);
    const isPrimary = item.primary;

    return (
      <SidebarMenuItem key={item.path}>
        <SidebarMenuButton asChild isActive={isActive}>
          <button
            onClick={() => item.path && navigate(item.path)}
            disabled={!item.path}
            className={`
              flex items-center gap-3 w-full px-3 rounded-lg transition-all duration-200
              ${isPrimary ? "min-h-[48px] py-3" : "min-h-[44px] py-2.5"}
              ${
                isActive
                  ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600 shadow-sm"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              }
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            `}
            aria-current={isActive ? "page" : undefined}
          >
            <item.icon className={`flex-shrink-0 ${isPrimary ? "w-5 h-5" : "w-4 h-4"}`} aria-hidden="true" />
            <span className="flex-1 text-left text-sm truncate">{item.title}</span>
            {item.badge && <Badge className="text-xs bg-green-100 text-green-700 border-green-200">{item.badge}</Badge>}
          </button>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  // ==========================================
  // HELPER: OBTENER INICIALES
  // ==========================================
  const getUserInitials = () => {
    if (!user?.email) return "U";
    const email = user.email;
    const name = businessInfo?.business_name || email;

    if (name.includes(" ")) {
      const parts = name.split(" ");
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // ==========================================
  // ✅ RENDER PRINCIPAL - SIN COLLAPSE
  // ==========================================
  return (
    <Sidebar collapsible="none" className="border-r border-slate-200 bg-white">
      {/* ============================================ */}
      {/* HEADER - LOGO Y BRANDING */}
      {/* ============================================ */}
      <SidebarHeader className="border-b border-slate-200 bg-gradient-to-r from-blue-50 to-slate-50 p-4">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
            <Sparkles className="w-6 h-6 text-white" aria-hidden="true" />
          </div>

          {/* Branding */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-slate-900 truncate">CatifyPro</h1>
            <p className="text-xs text-slate-500 truncate">Tu catálogo profesional</p>
          </div>
        </div>
      </SidebarHeader>

      {/* ============================================ */}
      {/* USER INFO */}
      {/* ============================================ */}
      <SidebarGroup className="border-b border-slate-200 bg-slate-50">
        <SidebarGroupContent className="px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <Avatar className="w-10 h-10 border-2 border-white shadow-sm flex-shrink-0">
              <AvatarImage src={user?.user_metadata?.avatar_url} alt="Usuario" />
              <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">{getUserInitials()}</AvatarFallback>
            </Avatar>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {businessInfo?.business_name || "Mi Negocio"}
              </p>
              <p className="text-xs text-slate-500 truncate">{user?.email || "usuario@email.com"}</p>
            </div>
          </div>

          {/* WARNING: Perfil Incompleto */}
          {showBusinessWarning && (
            <div
              className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 cursor-pointer hover:bg-amber-100 transition-colors"
              onClick={() => navigate("/business-info")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate("/business-info");
                }
              }}
            >
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-amber-900">Completa tu perfil</p>
                <p className="text-xs text-amber-700 mt-0.5">Falta información del negocio</p>
              </div>
            </div>
          )}
        </SidebarGroupContent>
      </SidebarGroup>

      {/* ============================================ */}
      {/* NAVIGATION CONTENT */}
      {/* ============================================ */}
      <SidebarContent className="px-3 py-4">
        {/* Grupo Principal */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase px-3 mb-2 tracking-wider">
            Principal
          </SidebarGroupLabel>
          <SidebarMenu className="space-y-1">
            {navigationItems.filter((item) => item.primary).map(renderNavItem)}
          </SidebarMenu>
        </SidebarGroup>

        {/* Separador */}
        <div className="h-px bg-slate-200 my-4 mx-3" aria-hidden="true" />

        {/* Grupo Herramientas */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase px-3 mb-2 tracking-wider">
            Herramientas
          </SidebarGroupLabel>
          <SidebarMenu className="space-y-1">
            {navigationItems
              .filter((item) => !item.primary && item.path !== "/onboarding" && item.path !== "/business-info")
              .map(renderNavItem)}
          </SidebarMenu>
        </SidebarGroup>

        {/* Separador */}
        <div className="h-px bg-slate-200 my-4 mx-3" aria-hidden="true" />

        {/* Grupo Configuración */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase px-3 mb-2 tracking-wider">
            Configuración
          </SidebarGroupLabel>
          <SidebarMenu className="space-y-1">
            {navigationItems
              .filter((item) => item.path === "/onboarding" || item.path === "/business-info")
              .map(renderNavItem)}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* ============================================ */}
      {/* FOOTER - LOGOUT */}
      {/* ============================================ */}
      <SidebarFooter className="border-t border-slate-200 bg-slate-50 p-4">
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full justify-start gap-3 h-11 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors"
          aria-label="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          <span className="text-sm font-medium">Cerrar Sesión</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
