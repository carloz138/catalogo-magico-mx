import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessInfo } from "@/hooks/useBusinessInfo";
import { useBreakpoint } from "@/hooks/useMediaQuery";
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
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Package,
  BarChart3,
  LogOut,
  User,
  CreditCard,
  Crown,
  Building2,
  FileText,
  Bell,
  PlayCircle,
  AlertTriangle,
  BookOpen,
  PackageOpen,
  ClipboardList,
  X,
  Settings,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
// NAVEGACIÓN PLANA Y CLARA
// ==========================================

const navigationItems: MenuItem[] = [
  // Primary Actions
  { title: "Subir Productos", path: "/upload", icon: Upload, primary: true },
  { title: "Crear Catalogo", path: "/products", icon: Package, primary: true },
  { title: "Mis Catálogos", path: "/catalogs", icon: BookOpen, primary: true },
  { title: "Nuevo Catálogo Digital", path: "/catalogs/new", icon: FileText, primary: true },
  { title: "Cotizaciones", path: "/quotes", icon: ClipboardList, primary: true },
  // Secondary Actions
  { title: "Carga Masiva", path: "/products/bulk-upload", icon: PackageOpen, badge: "Nuevo" },
  { title: "Editar Productos", path: "/products-management", icon: Settings },
  { title: "Analytics", path: "/analytics", icon: BarChart3 },
  { title: "Comprar Créditos", path: "/checkout", icon: CreditCard },
  // Configuration
  { title: "Guía de Inicio", path: "/onboarding", icon: PlayCircle, badge: "5 min" },
  { title: "Info del Negocio", path: "/business-info", icon: Building2 },
];

interface AppSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AppSidebar({ isOpen, onClose }: AppSidebarProps) {
  const { user, signOut } = useAuth();
  const { businessInfo } = useBusinessInfo();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile } = useBreakpoint();

  const isBusinessInfoIncomplete = () => {
    if (!businessInfo) return true;
    const requiredFields = [
      businessInfo.business_name,
      businessInfo.phone,
      businessInfo.email,
      businessInfo.address,
    ];
    return requiredFields.some((field) => !field || field.trim() === "");
  };

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

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile && onClose) {
      onClose();
    }
  };

  const renderNavItem = (item: MenuItem) => {
    const isActive = isActiveRoute(item.path!);
    const isPrimary = item.primary;

    return (
      <SidebarMenuItem key={item.path}>
        <SidebarMenuButton asChild isActive={isActive}>
          <button
            onClick={() => handleNavigate(item.path!)}
            className={cn(
              "flex items-center gap-3 w-full px-3 rounded-lg transition-all",
              isPrimary ? "min-h-[44px] py-3" : "min-h-[40px] py-2",
              isActive
                ? "bg-primary/10 text-primary font-semibold border-l-4 border-primary"
                : "text-foreground hover:bg-accent"
            )}
          >
            <item.icon className={isPrimary ? "w-5 h-5" : "w-4 h-4"} />
            <span className="flex-1 text-left text-sm">{item.title}</span>
            {item.badge && (
              <Badge variant="secondary" className="text-xs">
                {item.badge}
              </Badge>
            )}
          </button>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  const SidebarContentComponent = () => (
    <>
      {/* HEADER */}
      <SidebarHeader className="border-b bg-muted/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
              <Crown className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-bold text-lg">CatifyPro</h2>
            </div>
          </div>
          
          {isMobile && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </SidebarHeader>

      {/* USER INFO */}
      <SidebarGroup className="border-b bg-muted/50">
        <SidebarGroupContent>
          <div className="flex items-center space-x-3 p-3 mx-2 rounded-lg bg-card border shadow-sm">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">
                {user?.email?.split("@")[0] || "Usuario"}
              </p>
              <p className="text-xs text-muted-foreground truncate">Plan Profesional</p>
            </div>
            <div className="flex items-center space-x-1">
              {isBusinessInfoIncomplete() && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-orange-100 relative"
                  onClick={() => handleNavigate("/business-info")}
                  title="Completar información del negocio"
                >
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <Badge className="absolute -top-1 -right-1 h-2 w-2 p-0 bg-destructive border-white">
                    <span className="sr-only">Información incompleta</span>
                  </Badge>
                </Button>
              )}
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Bell className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* NAVIGATION CONTENT */}
      <SidebarContent className="px-3 py-4">
        {/* Grupo Principal */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase px-3 mb-2">
            Principal
          </SidebarGroupLabel>
          <SidebarMenu className="space-y-1">
            {navigationItems.filter((item) => item.primary).map(renderNavItem)}
          </SidebarMenu>
        </SidebarGroup>

        <div className="h-px bg-border my-4 mx-3" />

        {/* Grupo Herramientas */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase px-3 mb-2">
            Herramientas
          </SidebarGroupLabel>
          <SidebarMenu className="space-y-1">
            {navigationItems
              .filter(
                (item) =>
                  !item.primary && item.path !== "/onboarding" && item.path !== "/business-info"
              )
              .map(renderNavItem)}
          </SidebarMenu>
        </SidebarGroup>

        <div className="h-px bg-border my-4 mx-3" />

        {/* Grupo Configuración */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase px-3 mb-2">
            Configuración
          </SidebarGroupLabel>
          <SidebarMenu className="space-y-1">
            {navigationItems
              .filter((item) => item.path === "/onboarding" || item.path === "/business-info")
              .map(renderNavItem)}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* FOOTER */}
      <SidebarFooter className="border-t bg-muted/50 p-4">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 border border-destructive/20 font-medium"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Cerrar Sesión
        </Button>
      </SidebarFooter>
    </>
  );

  // MOBILE: Sheet Drawer (no necesita SidebarProvider)
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="left" className="p-0 w-[280px]">
          <div className="flex flex-col h-full border-r bg-background">
            <SidebarContentComponent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // DESKTOP: Sidebar fijo con SidebarProvider
  return (
    <SidebarProvider>
      <Sidebar className="border-r bg-background w-72 min-w-72 h-screen sticky top-0">
        <SidebarContentComponent />
      </Sidebar>
    </SidebarProvider>
  );
}
