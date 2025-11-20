// /src/components/layout/AppSidebar.tsx
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
  useSidebar,
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
  ChevronLeft,
  ChevronRight,
  Radar,
} from "lucide-react";
import { toast } from "sonner"; // Cambié a sonner que vi en tu index

// --- CONFIGURACIÓN DE DISEÑO ---
// Usamos Slate-900 para fondo y Slate-400 para textos inactivos
const THEME = {
  sidebarBg: "bg-slate-950",
  sidebarBorder: "border-slate-800",
  textInactive: "text-slate-400",
  textActive: "text-white",
  bgActive: "bg-indigo-600", // Tu color de marca primario
  hoverBg: "hover:bg-slate-800",
  hoverText: "hover:text-slate-100",
};

interface MenuItem {
  title: string;
  path?: string;
  icon: React.ComponentType<any>;
  badge?: string;
  badgeColor?: string; // Para diferenciar insignias
  primary?: boolean;
}

const navigationItems: MenuItem[] = [
  // Bloque Operativo (El día a día)
  { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard, primary: true },
  { title: "Cotizaciones", path: "/quotes", icon: ClipboardList, primary: true }, // Subido de prioridad
  { title: "Mis Catálogos", path: "/catalogs", icon: BookOpen, primary: true },

  // Bloque de Crecimiento (Estratégico)
  {
    title: "Radar de Mercado",
    path: "/market-radar",
    icon: Radar,
    badge: "IA",
    badgeColor: "bg-violet-500/20 text-violet-300",
    primary: true,
  },
  {
    title: "Red de Distribución",
    path: "/network",
    icon: Network,
    badge: "Viral",
    badgeColor: "bg-emerald-500/20 text-emerald-300",
  },

  // Bloque de Gestión
  { title: "Inventario (L1)", path: "/products", icon: Package },
  { title: "Carga Masiva", path: "/products/bulk-upload", icon: PackageOpen },
  { title: "Subir Productos", path: "/upload", icon: Upload }, // Quizás redundante con gestión, pero ok

  // Herramientas
  { title: "Analytics", path: "/analytics", icon: BarChart3 },
  { title: "Facturación y Créditos", path: "/checkout", icon: CreditCard },

  // Configuración
  { title: "Guía de Inicio", path: "/onboarding", icon: PlayCircle },
  { title: "Configuración", path: "/business-info", icon: Settings }, // Renombrado para ser más estándar
];

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const { businessInfo } = useBusinessInfo();
  const navigate = useNavigate();
  const location = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  // Verificación de perfil
  const isBusinessInfoIncomplete = () => {
    if (!businessInfo) return true;
    const requiredFields = [businessInfo.business_name, businessInfo.phone, businessInfo.email];
    return requiredFields.some((field) => !field || field.trim() === "");
  };
  const showBusinessWarning = isBusinessInfoIncomplete();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Sesión cerrada correctamente");
      navigate("/login");
    } catch (error) {
      toast.error("Error al cerrar sesión");
    }
  };

  const isActiveRoute = (path?: string) => {
    if (!path) return false;
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path) && path !== "/";
  };

  const getUserInitials = () => {
    if (!user?.email) return "CP";
    const name = businessInfo?.business_name || user.email;
    return name.substring(0, 2).toUpperCase();
  };

  // Renderizador de Items
  const renderNavItem = (item: MenuItem) => {
    const isActive = isActiveRoute(item.path);

    return (
      <SidebarMenuItem key={item.path}>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          tooltip={isCollapsed ? item.title : undefined}
          className={`
                mb-1 transition-all duration-200 ease-in-out rounded-md
                ${
                  isActive
                    ? `${THEME.bgActive} ${THEME.textActive} shadow-lg shadow-indigo-900/20 font-medium`
                    : `${THEME.textInactive} ${THEME.hoverBg} ${THEME.hoverText}`
                }
            `}
        >
          <button onClick={() => item.path && navigate(item.path)} className="flex items-center w-full p-2">
            <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />

            {!isCollapsed && (
              <>
                <span className="ml-3 flex-1 truncate text-sm leading-none">{item.title}</span>
                {item.badge && (
                  <span
                    className={`ml-auto text-[10px] px-1.5 py-0.5 rounded font-medium ${item.badgeColor || "bg-slate-800 text-slate-400"}`}
                  >
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </button>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" className={`border-r ${THEME.sidebarBorder} ${THEME.sidebarBg}`}>
      {/* HEADER: Branding */}
      <SidebarHeader className={`h-16 flex items-center justify-between px-4 border-b ${THEME.sidebarBorder}`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 shadow-lg shadow-indigo-500/30 text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white tracking-tight">CatifyPro</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Business OS</span>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <button onClick={toggleSidebar} className="text-slate-500 hover:text-white transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </SidebarHeader>

      {/* CONTENT: Navigation */}
      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 px-2">
              Plataforma
            </SidebarGroupLabel>
          )}
          <SidebarMenu>{navigationItems.filter((i) => i.primary).map(renderNavItem)}</SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 px-2">
              Gestión
            </SidebarGroupLabel>
          )}
          <SidebarMenu>
            {navigationItems
              .filter((i) => !i.primary && !["/onboarding", "/business-info"].includes(i.path || ""))
              .map(renderNavItem)}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* FOOTER: User & Config */}
      <SidebarFooter className={`border-t ${THEME.sidebarBorder} bg-slate-950/50 p-2`}>
        {/* Warning de perfil incompleto - Estilo tarjeta oscura */}
        {showBusinessWarning && !isCollapsed && (
          <div
            onClick={() => navigate("/business-info")}
            className="mb-4 mx-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 cursor-pointer hover:bg-amber-500/20 transition-all group"
          >
            <div className="flex items-center gap-2 text-amber-500 mb-1">
              <AlertTriangle className="h-3 w-3" />
              <span className="text-xs font-bold">Acción Requerida</span>
            </div>
            <p className="text-[10px] text-slate-400 group-hover:text-slate-300">
              Completa los datos de tu negocio para activar el cotizador.
            </p>
          </div>
        )}

        <SidebarMenu>
          {/* Menú de Usuario estilo Dropdown Trigger visual */}
          <SidebarMenuItem>
            <div
              className={`flex items-center gap-3 p-2 rounded-lg ${THEME.hoverBg} cursor-pointer group`}
              onClick={() => navigate("/business-info")}
            >
              <Avatar className="h-8 w-8 rounded-lg border border-slate-700">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="rounded-lg bg-slate-800 text-slate-300 text-xs">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-slate-200 group-hover:text-white transition-colors">
                    {businessInfo?.business_name || "Mi Cuenta"}
                  </span>
                  <span className="truncate text-xs text-slate-500">{user?.email}</span>
                </div>
              )}
            </div>
          </SidebarMenuItem>

          <button
            onClick={handleLogout}
            className={`w-full mt-2 flex items-center ${isCollapsed ? "justify-center" : "justify-start px-2"} py-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors`}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2 text-xs font-medium">Cerrar Sesión</span>}
          </button>
        </SidebarMenu>
      </SidebarFooter>

      {/* Botón de toggle flotante para móvil o cuando está colapsado */}
      {isCollapsed && (
        <div className="absolute -right-3 top-8 z-50 hidden md:block">
          <button
            onClick={toggleSidebar}
            className="bg-indigo-600 rounded-full p-1 shadow-lg text-white hover:bg-indigo-500"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      )}
    </Sidebar>
  );
}
