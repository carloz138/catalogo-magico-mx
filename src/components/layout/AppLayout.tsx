import React, { useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useBreakpoint } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  showSidebar?: boolean;
}

export function AppLayout({ children, title, subtitle, actions, showSidebar = true }: AppLayoutProps) {
  const { isMobile } = useBreakpoint();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Si showSidebar es false, renderizar solo el contenido
  if (!showSidebar) {
    return (
      <div className="min-h-screen bg-background">
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* SIDEBAR - Desktop siempre visible, Mobile como drawer */}
      {!isMobile && <AppSidebar />}
      {isMobile && (
        <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* MOBILE HEADER con hamburger */}
        {isMobile && (
          <header className="sticky top-0 z-40 bg-card border-b px-4 py-3 flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="h-10 w-10 p-0"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">C</span>
              </div>
              <h1 className="font-bold">CatifyPro</h1>
            </div>
            {actions && <div className="ml-auto">{actions}</div>}
          </header>
        )}

        {/* PAGE TITLE SECTION (Desktop only) */}
        {!isMobile && (title || subtitle) && (
          <div className="bg-card border-b px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                {title && <h1 className="text-2xl font-bold">{title}</h1>}
                {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
              </div>
              {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
          </div>
        )}

        {/* PAGE CONTENT - Con padding apropiado */}
        <main
          className={cn(
            "flex-1 overflow-auto",
            isMobile ? "p-4" : "p-8"
          )}
        >
          {/* Container con max-width para mejor legibilidad */}
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
