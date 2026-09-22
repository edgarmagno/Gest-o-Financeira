import React from 'react';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DollarSign,
  FileSpreadsheet,
  FileText,
  Hammer,
  HelpCircle,
  LayoutDashboard,
  Moon,
  Package,
  Receipt,
  Settings,
  ShoppingBag,
  Sparkles,
  Sun,
  Users,
  X,
} from 'lucide-react';
import { AppModule, useApp } from '../context/AppContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { activeModule, setActiveModule, lowStockProducts, currentUser, isDarkMode, toggleDarkMode, appearance } = useApp();

  const accent = appearance?.accentColor || 'indigo';
  const sidebarStyle = appearance?.sidebarStyle || 'dark';

  // Accent gradient mappings for active navigation and brand logo
  const accentGradients: Record<string, { active: string; brand: string; ring: string }> = {
    indigo: {
      active: 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-indigo-950/60 ring-indigo-400/30',
      brand: 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-950/50',
      ring: 'ring-indigo-500/30',
    },
    emerald: {
      active: 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-950/60 ring-emerald-400/30',
      brand: 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-950/50',
      ring: 'ring-emerald-500/30',
    },
    blue: {
      active: 'bg-gradient-to-r from-blue-600 to-cyan-600 shadow-blue-950/60 ring-blue-400/30',
      brand: 'bg-gradient-to-br from-blue-500 to-cyan-600 shadow-blue-950/50',
      ring: 'ring-blue-500/30',
    },
    violet: {
      active: 'bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-violet-950/60 ring-violet-400/30',
      brand: 'bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-violet-950/50',
      ring: 'ring-violet-500/30',
    },
    rose: {
      active: 'bg-gradient-to-r from-rose-600 to-pink-600 shadow-rose-950/60 ring-rose-400/30',
      brand: 'bg-gradient-to-br from-rose-500 to-pink-600 shadow-rose-950/50',
      ring: 'ring-rose-500/30',
    },
    amber: {
      active: 'bg-gradient-to-r from-amber-600 to-orange-600 shadow-amber-950/60 ring-amber-400/30',
      brand: 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-950/50',
      ring: 'ring-amber-500/30',
    },
    cyan: {
      active: 'bg-gradient-to-r from-cyan-600 to-blue-600 shadow-cyan-950/60 ring-cyan-400/30',
      brand: 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-950/50',
      ring: 'ring-cyan-500/30',
    },
    slate: {
      active: 'bg-gradient-to-r from-slate-700 to-slate-900 shadow-slate-950/60 ring-slate-400/30',
      brand: 'bg-gradient-to-br from-slate-600 to-slate-800 shadow-slate-950/50',
      ring: 'ring-slate-500/30',
    },
  };

  const currentThemeGradient = accentGradients[accent] || accentGradients.indigo;

  // Sidebar container styling depending on selected style
  const getSidebarBgClass = () => {
    if (sidebarStyle === 'dynamic') {
      return isDarkMode
        ? 'bg-slate-900 text-slate-100 border-slate-800'
        : 'bg-white text-slate-800 border-slate-200/80 shadow-md';
    }
    if (sidebarStyle === 'accent') {
      return 'bg-gradient-to-b from-[#0e1329] via-[#151c3b] to-[#0b0f20] text-slate-100 border-indigo-900/40';
    }
    // Default 'dark'
    return 'bg-gradient-to-b from-[#111338] via-[#1a144b] to-[#120e36] text-slate-100 border-indigo-900/50';
  };

  const navItems: {
    id: AppModule;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    badgeColor?: string;
    roles?: ('ADMIN' | 'GERENTE' | 'VENDEDOR')[];
  }[] = [
    {
      id: 'dashboard',
      label: 'Visão Geral',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'GERENTE', 'VENDEDOR'],
    },
    {
      id: 'pos',
      label: 'Frente de Caixa (PDV)',
      icon: ShoppingBag,
      badge: 'PDV',
      badgeColor: 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30',
      roles: ['ADMIN', 'GERENTE', 'VENDEDOR'],
    },
    {
      id: 'products',
      label: 'Estoque & Catálogo',
      icon: Package,
      badge: lowStockProducts.length > 0 ? lowStockProducts.length : undefined,
      badgeColor: 'bg-rose-400/20 text-rose-300 border border-rose-400/30',
      roles: ['ADMIN', 'GERENTE', 'VENDEDOR'],
    },
    {
      id: 'sales',
      label: 'Vendas & Despesas',
      icon: Receipt,
      roles: ['ADMIN', 'GERENTE', 'VENDEDOR'],
    },
    {
      id: 'quotes',
      label: 'Orçamentos & Propostas',
      icon: FileText,
      roles: ['ADMIN', 'GERENTE', 'VENDEDOR'],
    },
    {
      id: 'production',
      label: 'Personalizados & Produção',
      icon: Sparkles,
      badge: 'Produção',
      badgeColor: 'bg-indigo-400/20 text-indigo-300 border border-indigo-400/30',
      roles: ['ADMIN', 'GERENTE', 'VENDEDOR'],
    },
    {
      id: 'customers',
      label: 'Clientes & CRM',
      icon: Users,
      roles: ['ADMIN', 'GERENTE', 'VENDEDOR'],
    },
    {
      id: 'settings',
      label: 'Configurações',
      icon: Settings,
      roles: ['ADMIN', 'GERENTE', 'VENDEDOR'],
    },
  ];

  const handleSelectModule = (id: AppModule) => {
    setActiveModule(id);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/70 lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col border-r transition-all duration-300 ease-in-out ${getSidebarBgClass()} ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'w-64'}`}
      >
        {/* Brand Header */}
        <div className={`flex h-16 items-center justify-between border-b px-4 ${
          sidebarStyle === 'dynamic' && !isDarkMode
            ? 'border-slate-200 bg-slate-50/80 text-slate-900'
            : 'border-white/10 bg-black/20 text-white'
        }`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-md ${currentThemeGradient.brand}`}>
              <BarChart3 className="h-4 w-4 stroke-[2.4]" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className={`font-bold text-sm tracking-tight ${sidebarStyle === 'dynamic' && !isDarkMode ? 'text-slate-900' : 'text-white'}`}>
                  GESTÃO PRO
                </span>
                <span className={`text-[10px] font-medium uppercase tracking-wider ${
                  sidebarStyle === 'dynamic' && !isDarkMode ? 'text-slate-500' : 'text-slate-300/80'
                }`}>
                  Comercial & Finanças
                </span>
              </div>
            )}
          </div>

          {/* Close for mobile, collapse toggle for desktop */}
          <button
            onClick={onClose}
            className={`rounded-lg p-1.5 hover:bg-white/10 lg:hidden ${
              sidebarStyle === 'dynamic' && !isDarkMode ? 'text-slate-600' : 'text-slate-300'
            }`}
          >
            <X className="h-5 w-5" />
          </button>

          <button
            onClick={onToggleCollapse}
            className={`hidden h-7 w-7 items-center justify-center rounded-lg border hover:scale-105 transition-transform lg:flex ${
              sidebarStyle === 'dynamic' && !isDarkMode
                ? 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'border-white/10 bg-white/10 text-slate-200 hover:bg-white/20 hover:text-white'
            }`}
            title={isCollapsed ? 'Expandir Menu' : 'Recolher Menu'}
          >
            {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            const isAllowed = !item.roles || item.roles.includes(currentUser.role);

            const isLightDynamic = sidebarStyle === 'dynamic' && !isDarkMode;

            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => handleSelectModule(item.id)}
                className={`group flex w-full items-center rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                  isActive
                    ? `${currentThemeGradient.active} text-white ring-1 ring-white/20`
                    : isAllowed
                    ? isLightDynamic
                      ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    : isLightDynamic
                    ? 'text-slate-400/50 opacity-50 hover:bg-slate-50'
                    : 'text-slate-500/50 opacity-50 hover:bg-white/5'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    isActive
                      ? 'text-white'
                      : isLightDynamic
                      ? 'text-slate-500 group-hover:text-slate-900'
                      : 'text-slate-400 group-hover:text-white'
                  }`}
                />
                {!isCollapsed && (
                  <span className="ml-3 flex-1 text-left truncate">{item.label}</span>
                )}
                {!isCollapsed && item.badge !== undefined && (
                  <span
                    className={`ml-auto rounded-md px-2 py-0.5 text-[10px] font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.badgeColor || (isLightDynamic ? 'bg-slate-200 text-slate-700' : 'bg-white/10 text-slate-200')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Dark Mode Quick Switch & Sidebar Footer Info */}
        <div className={`border-t p-3 space-y-2 ${
          sidebarStyle === 'dynamic' && !isDarkMode
            ? 'border-slate-200 bg-slate-50'
            : 'border-white/10 bg-black/20'
        }`}>
          {/* Modo Noturno Switcher inside Sidebar */}
          <button
            onClick={toggleDarkMode}
            id="btn-sidebar-theme-toggle"
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
              isDarkMode
                ? 'bg-white/10 text-amber-300 border border-white/10 hover:bg-white/15'
                : sidebarStyle === 'dynamic' && !isDarkMode
                ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 shadow-xs'
                : 'bg-white/10 text-slate-200 hover:bg-white/15'
            }`}
            title="Alternar Modo Noturno / Modo Claro"
          >
            <div className="flex items-center gap-2.5">
              {isDarkMode ? (
                <Moon className="h-4 w-4 text-amber-400 fill-amber-400/30" />
              ) : (
                <Sun className="h-4 w-4 text-amber-500" />
              )}
              {!isCollapsed && (
                <span>{isDarkMode ? 'Modo Noturno' : 'Modo Claro'}</span>
              )}
            </div>
            {!isCollapsed && (
              <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                isDarkMode ? 'bg-black/40 text-amber-300' : 'bg-slate-200/80 text-slate-700'
              }`}>
                {isDarkMode ? 'Ativo' : 'Claro'}
              </span>
            )}
          </button>

          {!isCollapsed ? (
            <div className={`rounded-xl p-2.5 border ${
              sidebarStyle === 'dynamic' && !isDarkMode
                ? 'bg-white border-slate-200'
                : 'bg-white/5 border-white/10'
            }`}>
              <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                <span className={sidebarStyle === 'dynamic' && !isDarkMode ? 'text-slate-700' : 'text-slate-300'}>
                  Local & Firestore
                </span>
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-none"></span>
                  Online
                </span>
              </div>
              <p className={`text-[10px] leading-relaxed ${
                sidebarStyle === 'dynamic' && !isDarkMode ? 'text-slate-500' : 'text-slate-400'
              }`}>
                Nuvem sincronizada em tempo real.
              </p>
            </div>
          ) : (
            <div className="flex justify-center py-1">
              <div className="h-2 w-2 rounded-full bg-emerald-400" title="Sistema Online" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
