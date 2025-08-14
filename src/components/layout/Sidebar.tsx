
import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
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
  X,
  Menu
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  title: string;
  path?: string;
  icon: React.ComponentType<any>;
  badge?: string;
  badgeColor?: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    path: '/',
    icon: Home
  },
  {
    title: 'Productos',
    icon: Package,
    children: [
      {
        title: 'Subir Productos',
        path: '/upload',
        icon: Upload,
        badge: 'Nuevo',
        badgeColor: 'bg-green-100 text-green-800'
      },
      {
        title: 'Mi Biblioteca',
        path: '/products',
        icon: Layers
      },
      {
        title: 'Gestión Avanzada',
        path: '/products-management',
        icon: Settings
      },
      {
        title: 'Centro de Imágenes',
        path: '/image-review',
        icon: FileImage
      }
    ]
  },
  {
    title: 'Catálogos',
    icon: FileText,
    children: [
      {
        title: 'Crear Catálogo',
        path: '/template-selection',
        icon: Palette
      },
      {
        title: 'Mis Catálogos',
        path: '/catalogs',
        icon: FileText
      }
    ]
  },
  {
    title: 'Créditos',
    path: '/checkout',
    icon: CreditCard,
    badge: 'Comprar',
    badgeColor: 'bg-blue-100 text-blue-800'
  },
  {
    title: 'Configuración',
    icon: Settings,
    children: [
      {
        title: 'Info del Negocio',
        path: '/business-info',
        icon: Building2
      }
    ]
  }
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Productos', 'Catálogos', 'Configuración']);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const toggleMenu = (title: string) => {
    setExpandedMenus(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const renderMenuItem = (item: MenuItem, isChild = false) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.includes(item.title);
    const active = item.path ? isActive(item.path) : false;

    if (hasChildren) {
      return (
        <div key={item.title} className="space-y-1">
          <button
            onClick={() => toggleMenu(item.title)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors",
              isChild ? "pl-6" : "",
              "text-gray-700 hover:bg-gray-100"
            )}
          >
            <div className="flex items-center">
              <item.icon className="w-5 h-5 mr-3" />
              <span>{item.title}</span>
            </div>
            <ChevronRight className={cn(
              "w-4 h-4 transition-transform",
              isExpanded ? "rotate-90" : ""
            )} />
          </button>
          {isExpanded && (
            <div className="space-y-1 ml-3 border-l border-gray-200 pl-3">
              {item.children.map(child => renderMenuItem(child, true))}
            </div>
          )}
        </div>
      );
    }

    return (
      <NavLink
        key={item.title}
        to={item.path!}
        onClick={onClose}
        className={({ isActive }) => cn(
          "flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors",
          isChild ? "pl-6" : "",
          isActive || active
            ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
            : "text-gray-700 hover:bg-gray-100"
        )}
      >
        <div className="flex items-center">
          <item.icon className="w-5 h-5 mr-3" />
          <span>{item.title}</span>
        </div>
        {item.badge && (
          <span className={cn(
            "px-2 py-1 text-xs font-medium rounded-full",
            item.badgeColor || "bg-gray-100 text-gray-800"
          )}>
            {item.badge}
          </span>
        )}
      </NavLink>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out",
        "lg:translate-x-0 lg:static lg:z-auto",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-bold text-gray-900">CatalogPro</h1>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.email?.split('@')[0] || 'Usuario'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email || 'email@ejemplo.com'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map(item => renderMenuItem(item))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-700 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </>
  );
};
