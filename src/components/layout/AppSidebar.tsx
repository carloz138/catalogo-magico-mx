// /src/components/layout/AppSidebar.tsx - VERSIÓN CORREGIDA
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
// CONFIGURACIÓN DEL MENÚ SIMPLIFICADA
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
        badge: "Nuevo",
        badgeColor: "bg-green-100 text-green-800",
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
    badgeColor: "bg-purple-100 text-purple-800",
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
// COMPONENTE PRINCIPAL CORREGIDO
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
  // RENDER FUNCTIONS SIMPLIFICADAS
  // ==========================================

  const renderMenuItem = (item: MenuItem) => {
    const isActive = item.path ? isActiveRoute(item.path) : false;
    const hasChildren = item.items && item.items.length > 0;

    if (hasChildren) {
      return (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton className="w-full">
            <item.icon className="w-4 h-4" />
            <span>{item.title}</span>
            <ChevronRight className="ml-auto h-4 w-4" />
          </SidebarMenuButton>
          <SidebarMenuSub>
            {item.items?.map((subItem) => (
              <SidebarMenuSubItem key={subItem.title}>
                <SidebarMenuSubButton
                  asChild
                  isActive={subItem.path ? isActiveRoute(subItem.path) : false}
                >
                  <button
                    onClick={() => subItem.path && navigate(subItem.path)}
                    className="flex items-center w-full gap-2"
                  >
                    <subItem.icon className="w-4 h-4" />
                    <span>{subItem.title}</span>
                    {subItem.badge && (
                      <Badge
                        className={`text-xs ml-auto ${
                          subItem.badgeColor || "bg-gray-100 text-gray-800"
                        }`}
                        variant="outline"
                      >
                        {subItem.badge}
                      </Badge>
                    )}
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
            className="flex items-center w-full gap-2"
          >
            <item.icon className="w-4 h-4" />
            <span>{item.title}</span>
            {item.badge && (
              <Badge
                className={`text-xs ml-auto ${
                  item.badgeColor || "bg-gray-100 text-gray-800"
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
  // ✅ RENDER PRINCIPAL SIMPLIFICADO
  // ==========================================

  return (
    <Sidebar>
      {/* ✅ HEADER SIMPLIFICADO */}
      <SidebarHeader className="border-b border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">CatalogPro</h2>
            <p className="text-xs text-gray-500">v2.0</p>
          </div>
        </div>
      </SidebarHeader>

      {/* ✅ USER INFO SIMPLIFICADO */}
      <SidebarGroup className="border-b border-gray-200">
        <SidebarGroupContent>
          <div className="flex items-center space-x-3 p-2">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.email?.split("@")[0] || "Usuario"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email || "email@ejemplo.com"}
              </p>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Bell className="w-4 h-4" />
            </Button>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* ✅ NAVIGATION CONTENT SIMPLIFICADO */}
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-gray-500 uppercase tracking-wider">
            NAVEGACIÓN
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuData.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ✅ FOOTER SIMPLIFICADO */}
      <SidebarFooter className="border-t border-gray-200 p-4">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4 mr-3" />
          Cerrar Sesión
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}