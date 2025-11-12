import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
// 👇 IMPORTACIÓN CORREGIDA: Apunta a tu archivo real
import { AppSidebar } from "@/components/layout/AppSidebar"; 

export default function DashboardLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gray-50/50">
        {/* 1. Tu Sidebar (con collapse funcional) */}
        <AppSidebar />
        
        {/* 2. Contenido Principal */}
        <main className="flex-1 overflow-y-auto transition-all duration-300 ease-in-out">
          {/* Botón Hamburguesa (Solo visible en móvil) */}
          <div className="p-4 md:hidden sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b">
            <SidebarTrigger />
          </div>
          
          {/* 3. Aquí se renderizarán tus páginas (Dashboard, Products, etc.) */}
          <div className="w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
