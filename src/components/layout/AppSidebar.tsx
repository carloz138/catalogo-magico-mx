
// /src/components/layout/AppSidebar.tsx - DISEÑO SÓLIDO Y PROFESIONAL
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
// CONFIGURACIÓN DEL MENÚ CON ICONOS CORREGIDOS
// ==========================================

const menuData: MenuItem[] = [
  {
    title: "Dashboard",
    path: "/",
    icon: Home,
  },
  {
    title: "Productos",
    icon: Package,
    items: [
      {
        title: "Subir Productos",
        path: "/upload",
        icon: Upload,
      },
      {
        title: "Mi Biblioteca",
        path: "/products",
        icon: Layers,
      },
      {
        title: "Gestión Avanzada",
        path: "/products-management",
        icon: Settings,
      },
      {
        title: "Centro de Imágenes",
        path: "/image-review",
        icon: FileImage,
      },
    ],
  },
  {
    title: "Catálogos",
    icon: FileText,
    items: [
      {
        title: "Crear Catálogo",
        path: "/template-selection",
        icon: Palette,
      },
      {
        title: "Mis Catálogos",
        path: "/catalogs",
        icon: FileText,
      },
    ],
  },
  {
    title: "Créditos",
    path: "/checkout",
    icon: CreditCard,
    badge: "Comprar",
    badgeColor: "bg-purple-100 text-purple-700 border-purple-200",
  },
  {
    title: "Configuración",
    icon: Settings,
    items: [
      {
        title: "Info del Negocio",
        path: "/business-info",
        icon: Building2,
      },
    ],
  },
];

// ==========================================
// COMPONENTE PRINCIPAL CON DISEÑO SÓLIDO
// ==========================================

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
  // RENDER FUNCTIONS CON ICONOS CONSISTENTES
  // ==========================================

  const renderMenuItem = (item: MenuItem) => {
    const isActive = item.path ? isActiveRoute(item.path) : false;
    const hasChildren = item.items && item.items.length > 0;

    if (hasChildren) {
      return (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton className="w-full group hover:bg-slate-100 transition-colors min-h-[44px]">
            <item.icon className="w-5 h-5 text-slate-600 group-hover:text-slate-800 flex-shrink-0" />
            <span className="text-slate-700 group-hover:text-slate-900 font-medium flex-1 text-left">{item.title}</span>
            <ChevronRight className="ml-2 h-4 w-4 text-slate-400 group-hover:text-slate-600 flex-shrink-0" />
          </SidebarMenuButton>
          <SidebarMenuSub>
            {item.items?.map((subItem) => (
              <SidebarMenuSubItem key={subItem.title}>
                <SidebarMenuSubButton
                  asChild
                  isActive={subItem.path ? isActiveRoute(subItem.path) : false}
                  className="hover:bg-slate-50 min-h-[40px]"
                >
                  <button
                    onClick={() => subItem.path && navigate(subItem.path)}
                    className={`flex items-center w-full gap-3 px-3 py-2 rounded-md transition-all text-sm ${
                      subItem.path && isActiveRoute(subItem.path)
                        ? "bg-blue-50 text-blue-700 border-l-3 border-blue-500"
                        : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    <subItem.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium flex-1 text-left">{subItem.title}</span>
                  </button>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </SidebarMenuItem>
      );
    }

    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild isActive={isActive}>
          <button
            onClick={() => item.path && navigate(item.path)}
            className={`flex items-center w-full gap-3 px-3 py-2 rounded-md transition-all min-h-[44px] ${
              isActive
                ? "bg-blue-50 text-blue-700 border-l-3 border-blue-500"
                : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium flex-1 text-left">{item.title}</span>
            {item.badge && (
              <Badge
                className={`text-xs flex-shrink-0 border ml-2 ${
                  item.badgeColor || "bg-slate-100 text-slate-700 border-slate-200"
                }`}
                variant="outline"
              >
                {item.badge}
              </Badge>
            )}
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
            <h2 className="font-bold text-slate-900 text-lg">CatalogPro</h2>
            <p className="text-xs text-slate-500 font-medium">v2.0 Professional</p>
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
              <p className="text-sm font-semibold text-slate-900 truncate">
                {user?.email?.split("@")[0] || "Usuario"}
              </p>
              <p className="text-xs text-slate-500 truncate">
                Plan Profesional
              </p>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-100">
              <Bell className="w-4 h-4 text-slate-400" />
            </Button>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* ✅ NAVIGATION CONTENT CON FONDO SÓLIDO */}
      <SidebarContent className="px-3 py-4 bg-white">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3 px-3">
            NAVEGACIÓN
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuData.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
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
