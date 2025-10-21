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
  // Home, // Cambiado por LayoutDashboard
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
  ClipboardList,
  Network,
  LayoutDashboard, // <-- ✅ 1. IMPORTAR ICONO
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

// ==========================================
// TIPOS E INTERFACES (Sin cambios)
// ==========================================
interface MenuItem {
  title: string;
  path?: string;
  icon: React.ComponentType<any>;
  badge?: string;
  badgeColor?: string;
  items?: MenuItem[];
  primary?: boolean; // Añadido para claridad
}

// ==========================================
// NAVEGACIÓN PLANA Y CLARA
// ==========================================

const navigationItems: MenuItem[] = [
  // Añadido tipo MenuItem[]
  // GRUPO 1: Acciones Principales (44px altura mínima)
  // 👇 ✅ 2. AÑADIR NUEVO ITEM AL PRINCIPIO 👇
  { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard, primary: true },
  // 👆 FIN DEL NUEVO ITEM 👆
  { title: "Subir Productos", path: "/upload", icon: Upload, primary: true },
  { title: "Crear Catalogo", path: "/products", icon: Package, primary: true },
  { title: "Mis Catálogos", path: "/catalogs", icon: BookOpen, primary: true },
  { title: "Nuevo Catálogo Digital", path: "/catalogs/new", icon: FileText, primary: true },
  { title: "Cotizaciones", path: "/quotes", icon: ClipboardList, primary: true },
  { title: "Red de Distribución", path: "/network", icon: Network, primary: true, badge: "Nuevo" },

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
// COMPONENTE PRINCIPAL CON DISEÑO SÓLIDO (Sin cambios en la lógica principal)
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
  // HANDLERS (Sin cambios)
  // ==========================================

  const handleLogout = async () => {
    /* ... sin cambios ... */
  };

  const isActiveRoute = (path?: string) => {
    // path es opcional
    if (!path) return false; // Si no hay path, no puede estar activo
    // Manejo especial para la ruta raíz si fuera necesario, aunque Dashboard es /dashboard
    if (path === "/dashboard") return location.pathname === "/dashboard";
    // Para otras rutas, verifica si el pathname comienza con la ruta del item
    return location.pathname.startsWith(path) && path !== "/";
  };

  // ==========================================
  // RENDER NAVEGACIÓN PLANA (Sin cambios en la función, usará el nuevo item)
  // ==========================================

  const renderNavItem = (item: MenuItem) => {
    // Usar tipo MenuItem
    const isActive = isActiveRoute(item.path);
    const isPrimary = item.primary;

    return (
      <SidebarMenuItem key={item.path}>
        <SidebarMenuButton asChild isActive={isActive}>
          <button
            onClick={() => item.path && navigate(item.path)} // Solo navega si hay path
            disabled={!item.path} // Deshabilita si no hay path
            className={`
              flex items-center gap-3 w-full px-3 rounded-lg transition-all
              ${isPrimary ? "min-h-[44px] py-3" : "min-h-[40px] py-2"}
              ${
                isActive
                  ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600" // Ajustado border-l-4
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              }
            `}
          >
            <item.icon className={`flex-shrink-0 ${isPrimary ? "w-5 h-5" : "w-4 h-4"}`} /> {/* Añadido flex-shrink-0 */}
            <span className="flex-1 text-left text-sm truncate">{item.title}</span> {/* Añadido truncate */}
            {item.badge && <Badge className="text-xs bg-green-100 text-green-700 border-green-200">{item.badge}</Badge>}
          </button>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  // ==========================================
  // ✅ RENDER PRINCIPAL CON DISEÑO SÓLIDO (Sin cambios estructurales)
  // ==========================================

  return (
    <Sidebar className="border-r border-slate-200 bg-white w-72 min-w-72">
      {/* HEADER (Sin cambios) */}
      <SidebarHeader className="border-b border-slate-200 bg-slate-50 p-4">{/* ... sin cambios ... */}</SidebarHeader>

      {/* USER INFO (Sin cambios) */}
      <SidebarGroup className="border-b border-slate-200 bg-slate-50">
        <SidebarGroupContent>{/* ... sin cambios ... */}</SidebarGroupContent>
      </SidebarGroup>

      {/* NAVIGATION CONTENT (Renderizará el nuevo item automáticamente) */}
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

      {/* FOOTER (Sin cambios) */}
      <SidebarFooter className="border-t border-slate-200 bg-slate-50 p-4">{/* ... sin cambios ... */}</SidebarFooter>
    </Sidebar>
  );
}
