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
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Upload,
  Package,
  BarChart3,
  Settings,
  LogOut,
  CreditCard,
  BookOpen,
  PackageOpen,
  ClipboardList,
  Network,
  LayoutDashboard,
  PlayCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Radar,
  PackageSearch,
  Landmark,
  Truck, // ✅ Icono para Pedidos
} from "lucide-react";
import { toast } from "sonner";

// --- TEMA OSCURO PREMIUM ---
const THEME = {
  sidebarBg: "bg-slate-950",
  sidebarBorder: "border-slate-800",
  textInactive: "text-slate-400",
  textActive: "text-white",
  textHover: "group-hover:text-slate-200",
  bgActive: "bg-indigo-600",
  bgHover: "hover:bg-slate-800/80",
  footerBorder: "border-t border-slate-800",
};

interface MenuItem {
  title: string;
  path?: string;
  icon: React.ComponentType<any>;
  badge?: string;
  badgeColor?: string;
  primary?: boolean;
}

const navigationItems: MenuItem[] = [
  { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard, primary: true },
  { title: "Cotizaciones", path: "/quotes", icon: ClipboardList, primary: true },
  // ✅ NUEVO ÍTEM: Mis Pedidos
  { title: "Mis Pedidos", path: "/orders", icon: Truck, primary: true },
  { title: "Mis Catálogos", path: "/catalogs", icon: BookOpen, primary: true },
  {
    title: "Radar de Mercado",
    path: "/market-radar",
    icon: Radar,
    badge: "IA",
    badgeColor: "bg-violet-500/20 text-violet-200 border-violet-500/30",
    primary: true,
  },
  {
    title: "Red de Distribución",
    path: "/network",
    icon: Network,
    badge: "Viral",
    badgeColor: "bg-emerald-500/20 text-emerald-200 border-emerald-500/30",
  },
  {
    title: "Gestión de Productos",
    path: "/products-management",
    icon: PackageSearch,
    primary: true,
  },
  { title: "Inventario", path: "/products", icon: Package },
  { title: "Carga Masiva", path: "/products/bulk-upload", icon: PackageOpen },
  { title: "Subir Productos", path: "/upload", icon: Upload },
  { title: "Analytics", path: "/analytics", icon: BarChart3 },
  { title: "Facturación", path: "/checkout", icon: CreditCard },
  { title: "Guía de Inicio", path: "/onboarding", icon: PlayCircle },
  {
    title: "Datos Bancarios",
    path: "/dashboard/banking",
    icon: Landmark,
    badge: "$",
    badgeColor: "bg-green-900/50 text-green-300 border-green-700/50",
  },
  { title: "Configuración", path: "/business-info", icon: Settings },
];

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const { businessInfo, hasBusinessInfo, hasMerchantAccount } = useBusinessInfo();
  const navigate = useNavigate();
  const location = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  const displayName =
    businessInfo?.business_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Mi Cuenta";

  const getUserInitials = () => {
    const source = displayName || "CP";
    return source.substring(0, 2).toUpperCase();
  };

  const getWarningConfig = () => {
    if (!hasBusinessInfo) {
      return {
        show: true,
        title: "Completar Perfil",
        desc: "Necesario para vender.",
        path: "/business-info",
        color: "text-amber-500",
        bg: "bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20",
      };
    }
    if (!hasMerchantAccount) {
      return {
        show: true,
        title: "Configurar Pagos",
        desc: "Vincula tu banco para cobrar.",
        path: "/dashboard/banking",
        color: "text-rose-400",
        bg: "bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20",
      };
    }
    return { show: false };
  };

  const warning = getWarningConfig();

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

  const renderNavItem = (item: MenuItem) => {
    const isActive = isActiveRoute(item.path);

    return (
      <SidebarMenuItem key={item.path}>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          tooltip={isCollapsed ? item.title : undefined}
          className={`
              mb-1 transition-all duration-200 ease-in-out rounded-lg group
              ${
                isActive
                  ? `${THEME.bgActive} ${THEME.textActive} shadow-[0_0_20px_rgba(79,70,229,0.3)] font-medium`
                  : `${THEME.textInactive} ${THEME.bgHover} ${THEME.textHover}`
              }
            `}
        >
          <button onClick={() => item.path && navigate(item.path)} className="flex items-center w-full p-2.5">
            <item.icon
              className={`h-5 w-5 flex-shrink-0 transition-colors ${isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"}`}
            />
            {!isCollapsed && (
              <>
                <span className="ml-3 flex-1 truncate text-sm">{item.title}</span>
                {item.badge && (
                  <span
                    className={`ml-auto text-[10px] px-1.5 py-0.5 rounded border ${item.badgeColor || "bg-slate-800 text-slate-400 border-slate-700"}`}
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
      <SidebarHeader className={`h-16 flex items-center px-4 border-b ${THEME.sidebarBorder} bg-slate-950 shrink-0`}>
        <div className="flex items-center justify-between w-full overflow-hidden">
          <div
            className={`flex items-center gap-3 transition-all duration-300 ${isCollapsed ? "justify-center w-full" : "flex-1 min-w-0"}`}
          >
            <div className="bg-indigo-600 p-1.5 rounded-lg shrink-0 shadow-lg shadow-indigo-500/20">
              <Network className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="text-base font-bold text-white tracking-tight leading-none truncate">CatifyPro</span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              onClick={toggleSidebar}
              className="text-slate-500 hover:text-white transition-colors p-1.5 rounded-md hover:bg-white/5 shrink-0 ml-2"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4 custom-scrollbar">
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-2">
              Plataforma
            </SidebarGroupLabel>
          )}
          <SidebarMenu className="gap-1">{navigationItems.filter((i) => i.primary).map(renderNavItem)}</SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-6">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-2">
              Herramientas
            </SidebarGroupLabel>
          )}
          <SidebarMenu className="gap-1">
            {navigationItems
              .filter((i) => !i.primary && !["/onboarding", "/business-info"].includes(i.path || ""))
              .map(renderNavItem)}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={`${THEME.footerBorder} bg-slate-950 p-2`}>
        {warning.show && !isCollapsed && (
          <div
            onClick={() => warning.path && navigate(warning.path)}
            className={`mb-3 mx-1 p-3 rounded-lg border cursor-pointer transition-all group ${warning.bg}`}
          >
            <div className={`flex items-center gap-2 mb-1 ${warning.color}`}>
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="text-xs font-bold">{warning.title}</span>
            </div>
            <p className="text-[10px] text-slate-400 group-hover:text-slate-300 leading-tight">{warning.desc}</p>
          </div>
        )}

        <SidebarMenu>
          <SidebarMenuItem>
            <div
              className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer group transition-all duration-200 hover:bg-white/5 border border-transparent hover:border-white/5 ${isCollapsed ? "justify-center" : ""}`}
              onClick={() => navigate("/business-info")}
            >
              <Avatar className="h-9 w-9 rounded-lg border border-slate-700 shadow-sm group-hover:border-indigo-500/50 transition-colors">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="rounded-lg bg-gradient-to-br from-indigo-600 to-violet-700 text-white text-xs font-bold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="grid flex-1 text-left leading-tight min-w-0">
                  <span className="truncate font-semibold text-slate-200 group-hover:text-white text-sm transition-colors">
                    {displayName}
                  </span>
                  <span className="truncate text-xs text-slate-500 group-hover:text-slate-400 transition-colors">
                    {user?.email}
                  </span>
                </div>
              )}
            </div>
          </SidebarMenuItem>
          <button
            onClick={handleLogout}
            className={`w-full mt-1 flex items-center ${isCollapsed ? "justify-center" : "justify-start px-3"} py-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 group`}
          >
            <LogOut className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            {!isCollapsed && <span className="ml-3 text-xs font-medium">Cerrar Sesión</span>}
          </button>
        </SidebarMenu>
      </SidebarFooter>

      {isCollapsed && (
        <div className="absolute -right-3 top-9 z-50 hidden md:block">
          <button
            onClick={toggleSidebar}
            className="bg-indigo-600 rounded-full p-1 shadow-[0_0_10px_rgba(79,70,229,0.5)] text-white hover:bg-indigo-500 hover:scale-110 transition-all"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      )}
    </Sidebar>
  );
}
