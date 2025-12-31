# Documentación Técnica del Sistema de Sidebar

## Índice
1. [Arquitectura General](#1-arquitectura-general)
2. [Componentes Principales](#2-componentes-principales)
3. [Flujo de Comunicación](#3-flujo-de-comunicación)
4. [Sistema de Estilos](#4-sistema-de-estilos)
5. [Contexto y Estado](#5-contexto-y-estado)
6. [Integración en Páginas](#6-integración-en-páginas)
7. [Sistema de Navegación](#7-sistema-de-navegación)
8. [Responsividad y Mobile](#8-responsividad-y-mobile)

---

## 1. Arquitectura General

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              App.tsx                                     │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                          <Route>                                   │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │                     AppLayout.tsx                            │  │  │
│  │  │  ┌────────────────────────────────────────────────────────┐ │  │  │
│  │  │  │                 SidebarProvider                        │ │  │  │
│  │  │  │  ┌─────────────┐    ┌──────────────────────────────┐  │ │  │  │
│  │  │  │  │ AppSidebar  │    │      SidebarInset            │  │ │  │  │
│  │  │  │  │  (Sidebar)  │    │  ┌────────────────────────┐  │  │ │  │  │
│  │  │  │  │             │    │  │      Header            │  │  │ │  │  │
│  │  │  │  │ - Header    │    │  ├────────────────────────┤  │  │ │  │  │
│  │  │  │  │ - Content   │    │  │      {children}        │  │  │ │  │  │
│  │  │  │  │ - Footer    │    │  │   (Page Content)       │  │  │ │  │  │
│  │  │  │  │             │    │  └────────────────────────┘  │  │ │  │  │
│  │  │  │  └─────────────┘    └──────────────────────────────┘  │ │  │  │
│  │  │  └────────────────────────────────────────────────────────┘ │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Archivos Clave

| Archivo | Ubicación | Propósito |
|---------|-----------|-----------|
| `sidebar.tsx` | `src/components/ui/sidebar.tsx` | Componente base Shadcn/UI (primitivos) |
| `AppSidebar.tsx` | `src/components/layout/AppSidebar.tsx` | Implementación específica de la app |
| `AppLayout.tsx` | `src/components/layout/AppLayout.tsx` | Layout wrapper que integra sidebar |
| `sidebar-fixes.css` | `src/styles/sidebar-fixes.css` | Correcciones CSS para posicionamiento |
| `sidebar-solid.css` | `src/styles/sidebar-solid.css` | Estilos de tema sólido/premium |
| `index.css` | `src/index.css` | Variables CSS globales del sidebar |

---

## 2. Componentes Principales

### 2.1 `src/components/ui/sidebar.tsx` (Primitivos Shadcn)

Este archivo exporta los componentes base del sidebar:

```typescript
// Contexto y Provider
export { SidebarProvider, useSidebar }

// Componentes estructurales
export { Sidebar }           // Container principal
export { SidebarTrigger }    // Botón para toggle
export { SidebarRail }       // Barra lateral para resize
export { SidebarInset }      // Área de contenido principal

// Componentes de contenido
export { SidebarHeader }     // Header del sidebar
export { SidebarContent }    // Área scrollable
export { SidebarFooter }     // Footer del sidebar
export { SidebarSeparator }  // Separador visual

// Componentes de navegación
export { SidebarGroup }         // Grupo de menú
export { SidebarGroupLabel }    // Label del grupo
export { SidebarGroupContent }  // Contenido del grupo
export { SidebarMenu }          // Lista de menú
export { SidebarMenuItem }      // Item individual
export { SidebarMenuButton }    // Botón clickeable
export { SidebarMenuBadge }     // Badge de notificación
```

#### Constantes importantes:

```typescript
const SIDEBAR_WIDTH = "16rem"        // 256px - Ancho expandido
const SIDEBAR_WIDTH_MOBILE = "18rem" // 288px - Ancho en mobile
const SIDEBAR_WIDTH_ICON = "3rem"    // 48px - Ancho colapsado
const SIDEBAR_KEYBOARD_SHORTCUT = "b" // Ctrl/Cmd + B para toggle
```

### 2.2 `src/components/layout/AppSidebar.tsx` (Implementación)

Este es el componente que usa los primitivos para crear el sidebar específico de CatifyPro:

```typescript
export function AppSidebar() {
  // === HOOKS DE DATOS ===
  const { user, signOut } = useAuth();                    // Autenticación
  const { businessInfo, hasBusinessInfo } = useBusinessInfo(); // Info del negocio
  const { isL1, isL2, isBoth, userRole } = useUserRole(); // Rol del usuario
  const { isSuperAdmin } = useSuperAdmin();               // Rol admin
  
  // === HOOK DEL SIDEBAR ===
  const { state, toggleSidebar, isMobile, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed";
  
  // === DATOS DINÁMICOS ===
  const { data: stats } = useQuery({...}); // Badges de cotizaciones/pedidos
```

#### Estructura del Menú:

```typescript
interface MenuItem {
  title: string;                    // Texto mostrado
  path: string;                     // Ruta de navegación
  icon: React.ComponentType<any>;   // Icono Lucide
  badge?: string | number;          // Badge opcional
  badgeColor?: string;              // Color del badge
  primary?: boolean;                // Si es item principal
  roles?: string[];                 // Roles que pueden ver: ["L1", "L2", "BOTH", "NONE"]
}

// Ejemplo de item:
{
  title: "Cotizaciones",
  path: "/quotes",
  icon: ClipboardList,
  primary: true,
  roles: ["L1", "L2", "BOTH"],
  badge: stats?.quotes,  // Dinámico desde query
  badgeColor: "bg-amber-500 text-white border-amber-600",
}
```

### 2.3 `src/components/layout/AppLayout.tsx` (Layout Wrapper)

```typescript
const AppLayout = ({ children, showSidebar = true, title, subtitle, actions }) => {
  // Rutas que NO muestran sidebar
  const NO_SIDEBAR_ROUTES = [
    "/login",
    "/register", 
    "/reset-password",
    "/payment-success",
    "/payment-instructions",
  ];

  // Renderizado condicional
  if (!shouldShowSidebar) {
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full overflow-hidden">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <header>...</header>  {/* Header con breadcrumbs */}
          <main>{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
```

---

## 3. Flujo de Comunicación

### 3.1 Diagrama de Flujo

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          SidebarProvider                                  │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                     SidebarContext                                  │  │
│  │  {                                                                  │  │
│  │    state: "expanded" | "collapsed",    // Estado actual             │  │
│  │    open: boolean,                       // Si está abierto          │  │
│  │    setOpen: (open) => void,            // Cambiar estado            │  │
│  │    openMobile: boolean,                 // Estado móvil             │  │
│  │    setOpenMobile: (open) => void,      // Cambiar estado móvil     │  │
│  │    isMobile: boolean,                   // Si es móvil              │  │
│  │    toggleSidebar: () => void,          // Toggle función           │  │
│  │  }                                                                  │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                    ▲                                      │
│                                    │                                      │
│      ┌─────────────────────────────┼────────────────────────────────┐    │
│      │                             │                                │    │
│      ▼                             │                                ▼    │
│  ┌──────────────┐           ┌──────────────┐           ┌──────────────┐ │
│  │ SidebarTrigger│           │  AppSidebar  │           │ SidebarInset │ │
│  │              │           │              │           │              │ │
│  │ useSidebar() │ ────────▶ │ useSidebar() │ ◀──────── │ useSidebar() │ │
│  │ toggleSidebar│           │ state        │           │ data-state   │ │
│  └──────────────┘           │ isCollapsed  │           └──────────────┘ │
│                             └──────────────┘                             │
└──────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Hook `useSidebar()`

Cualquier componente dentro de `SidebarProvider` puede usar:

```typescript
const { 
  state,           // "expanded" | "collapsed"
  open,            // true/false
  setOpen,         // Función para cambiar
  openMobile,      // Estado para móvil
  setOpenMobile,   // Cambiar estado móvil
  isMobile,        // Detecta si es móvil
  toggleSidebar,   // Toggle inteligente (móvil vs desktop)
} = useSidebar();
```

### 3.3 Persistencia de Estado

El estado se guarda en cookie para persistir entre sesiones:

```typescript
document.cookie = `sidebar:state=${openState}; path=/; max-age=${604800}` // 7 días
```

---

## 4. Sistema de Estilos

### 4.1 Variables CSS (`src/index.css`)

```css
:root {
  /* Colores base del sidebar */
  --sidebar-background: 0 0% 100%;          /* Fondo blanco */
  --sidebar-foreground: 222.2 84% 4.9%;     /* Texto oscuro */
  --sidebar-primary: 215 74% 61%;           /* Azul primario */
  --sidebar-primary-foreground: 0 0% 100%;  /* Texto sobre primario */
  --sidebar-accent: 210 40% 96.1%;          /* Fondo hover */
  --sidebar-accent-foreground: 222.2 84% 4.9%;
  --sidebar-border: 214.3 31.8% 91.4%;      /* Bordes */
  --sidebar-ring: 215 74% 61%;              /* Focus ring */
}
```

### 4.2 Tema Oscuro en AppSidebar (`THEME` constant)

```typescript
const THEME = {
  sidebarBg: "bg-slate-950",              // Fondo oscuro
  sidebarBorder: "border-slate-800",      // Bordes sutiles
  textInactive: "text-slate-400",         // Texto inactivo
  textActive: "text-white",               // Texto activo
  textHover: "group-hover:text-slate-200",// Hover
  bgActive: "bg-indigo-600",              // Fondo activo
  bgHover: "hover:bg-slate-800/80",       // Hover fondo
  footerBorder: "border-t border-slate-800",
};
```

### 4.3 Clases CSS por Componente

| Componente | Clases Aplicadas |
|------------|------------------|
| `Sidebar` | `bg-slate-950 border-r border-slate-800 z-50` |
| `SidebarHeader` | `h-16 px-4 border-b border-slate-800 bg-slate-950` |
| `SidebarContent` | `px-3 py-4 custom-scrollbar` |
| `SidebarFooter` | `border-t border-slate-800 bg-slate-950 p-2` |
| Item Activo | `bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)]` |
| Item Inactivo | `text-slate-400 hover:bg-slate-800/80` |

### 4.4 Archivos CSS Adicionales

#### `sidebar-fixes.css` - Correcciones de Layout:

```css
/* Posicionamiento correcto */
[data-sidebar="sidebar"] {
  position: relative !important;
  z-index: 10 !important;
}

/* Mobile: overlay con posición fija */
@media (max-width: 1023px) {
  [data-sidebar="sidebar"] {
    position: fixed !important;
    z-index: 50 !important;
  }
}

/* Scroll en contenido */
[data-sidebar="content"] {
  overflow-y: auto !important;
  max-height: calc(100vh - 200px) !important;
}
```

#### `sidebar-solid.css` - Estilos Premium:

```css
/* Estado activo */
[data-sidebar] button[data-active="true"] {
  background-color: #eff6ff !important;
  color: #1d4ed8 !important;
  border-left: 3px solid #3b82f6 !important;
}

/* Scrollbar personalizado */
[data-sidebar="content"]::-webkit-scrollbar {
  width: 6px !important;
}
[data-sidebar="content"]::-webkit-scrollbar-thumb {
  background: #cbd5e1 !important;
  border-radius: 3px !important;
}
```

---

## 5. Contexto y Estado

### 5.1 Estados del Sidebar

```typescript
// Desktop: controlled by 'open' state
"expanded"  → width: 16rem (256px)
"collapsed" → width: 3rem (48px, solo iconos)

// Mobile: controlled by 'openMobile' state
openMobile: true  → Sheet abierto (overlay)
openMobile: false → Sheet cerrado
```

### 5.2 Data Attributes

El sidebar usa `data-*` attributes para CSS:

```html
<div data-state="expanded">     <!-- o "collapsed" -->
<div data-collapsible="icon">   <!-- tipo de collapse -->
<div data-variant="sidebar">    <!-- o "floating", "inset" -->
<div data-side="left">          <!-- o "right" -->
<div data-sidebar="sidebar">    <!-- identificador -->
<div data-sidebar="header">
<div data-sidebar="content">
<div data-sidebar="footer">
<div data-sidebar="trigger">
```

### 5.3 Comunicación con React Query

El sidebar obtiene badges dinámicos desde Supabase:

```typescript
const { data: stats } = useQuery({
  queryKey: ["sidebar-stats", user?.id],
  queryFn: async () => {
    const { data } = await supabase.rpc("get_sidebar_counts", {
      p_user_id: user.id,
    });
    return {
      quotes: data[0]?.pending_quotes || 0,
      orders: data[0]?.orders_to_ship || 0,
    };
  },
  refetchInterval: 30000, // Actualiza cada 30 segundos
});
```

---

## 6. Integración en Páginas

### 6.1 Cómo se aplica el layout

**En `App.tsx`:**

```tsx
<Route path="/dashboard" element={
  <ProtectedRoute>
    <AppLayout>
      <MainDashboard />
    </AppLayout>
  </ProtectedRoute>
} />
```

**Estructura resultante:**

```
SidebarProvider
├── AppSidebar (fijo a la izquierda)
└── SidebarInset (contenido principal)
    ├── Header (sticky)
    │   ├── SidebarTrigger (hamburger)
    │   ├── Breadcrumb
    │   └── User Actions
    ├── Page Title Section (opcional)
    └── Main Content ({children})
```

### 6.2 Páginas sin Sidebar

Definidas en `NO_SIDEBAR_ROUTES`:

```typescript
const NO_SIDEBAR_ROUTES = [
  "/login",
  "/register", 
  "/reset-password",
  "/payment-success",
  "/payment-instructions",
];
```

Estas páginas renderizan solo `{children}` sin wrapper.

### 6.3 Breadcrumbs Automáticos

```typescript
const ROUTE_BREADCRUMBS = {
  "/": { title: "Dashboard", subtitle: "Resumen de tu actividad" },
  "/quotes": { title: "Cotizaciones", subtitle: "Gestiona solicitudes", parent: "Ventas" },
  "/products": { title: "Mi Biblioteca", subtitle: "Gestiona productos", parent: "Productos" },
  // ...
};
```

---

## 7. Sistema de Navegación

### 7.1 Filtrado por Roles

```typescript
// Roles disponibles
type UserRole = "L1" | "L2" | "BOTH" | "NONE";

// Ejemplo de filtrado
const navigationItems = allNavigationItems.filter((item) => {
  if (!item.roles) return true;
  return (
    item.roles.includes(userRole) ||
    (isBoth && (item.roles.includes("L1") || item.roles.includes("L2")))
  );
});

// Items solo para admin
const adminItems = isSuperAdmin ? [
  { title: "Finanzas Admin", path: "/admin/finance", ... }
] : [];
```

### 7.2 Navegación Programática

```typescript
const handleNavigation = (path: string) => {
  navigate(path);
  if (isMobile) {
    setOpenMobile(false); // Cierra el sidebar en móvil
  }
};
```

### 7.3 Detección de Ruta Activa

```typescript
const isActiveRoute = (path: string) => {
  if (path === "/dashboard") return location.pathname === "/dashboard";
  return location.pathname.startsWith(path) && path !== "/";
};
```

---

## 8. Responsividad y Mobile

### 8.1 Breakpoints

| Breakpoint | Comportamiento |
|------------|----------------|
| < 768px | Sidebar como Sheet (overlay) |
| 768px - 1023px | Sidebar colapsable |
| ≥ 1024px | Sidebar fijo, ancho completo |

### 8.2 Comportamiento Mobile

```typescript
// En sidebar.tsx
if (isMobile) {
  return (
    <Sheet open={openMobile} onOpenChange={setOpenMobile}>
      <SheetContent
        data-sidebar="sidebar"
        data-mobile="true"
        className="w-[--sidebar-width]"
        side="left"
      >
        {children}
      </SheetContent>
    </Sheet>
  );
}
```

### 8.3 Hook `useIsMobile`

```typescript
// src/hooks/use-mobile.tsx
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(
    window.matchMedia("(max-width: 768px)").matches
  );
  
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 768px)");
    const onChange = () => setIsMobile(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  
  return isMobile;
}
```

---

## Apéndice A: Cómo Agregar un Nuevo Item al Menú

1. **Agregar a `allNavigationItems` en `AppSidebar.tsx`:**

```typescript
{
  title: "Mi Nueva Página",
  path: "/nueva-pagina",
  icon: SomeIcon,
  primary: true,               // true = sección "Plataforma", false = "Herramientas"
  roles: ["L1", "BOTH"],       // Quién puede ver
  badge: "Nuevo",              // Opcional
  badgeColor: "bg-pink-500/20 text-pink-200 border-pink-500/30", // Opcional
},
```

2. **Agregar ruta en `App.tsx`:**

```tsx
<Route path="/nueva-pagina" element={
  <ProtectedRoute>
    <AppLayout>
      <NuevaPagina />
    </AppLayout>
  </ProtectedRoute>
} />
```

3. **Opcional - Agregar breadcrumb en `AppLayout.tsx`:**

```typescript
const ROUTE_BREADCRUMBS = {
  // ...
  "/nueva-pagina": { 
    title: "Mi Nueva Página", 
    subtitle: "Descripción breve",
    parent: "Categoría" 
  },
};
```

---

## Apéndice B: Cómo Modificar Estilos

### Cambiar colores del tema:

1. **Actualizar `THEME` en `AppSidebar.tsx`:**

```typescript
const THEME = {
  sidebarBg: "bg-slate-900",      // Cambiar aquí
  bgActive: "bg-blue-600",         // Cambiar color activo
  // ...
};
```

2. **O usar variables CSS en `index.css`:**

```css
:root {
  --sidebar-background: 220 30% 10%;  /* Fondo personalizado */
  --sidebar-primary: 200 80% 50%;     /* Color primario */
}
```

### Cambiar ancho del sidebar:

En `src/components/ui/sidebar.tsx`:

```typescript
const SIDEBAR_WIDTH = "18rem"      // Más ancho
const SIDEBAR_WIDTH_ICON = "4rem"  // Iconos más grandes
```

---

## Apéndice C: Debugging

### Ver estado actual:

```typescript
// En cualquier componente dentro de SidebarProvider
const { state, open, isMobile, openMobile } = useSidebar();
console.log({ state, open, isMobile, openMobile });
```

### Forzar estado:

```typescript
const { setOpen, setOpenMobile } = useSidebar();
setOpen(true);        // Expandir en desktop
setOpenMobile(false); // Cerrar en mobile
```

### Inspeccionar en DevTools:

Buscar elementos con `data-sidebar="*"` para ver la estructura y estados actuales.
