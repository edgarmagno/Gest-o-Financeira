import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  Cloud,
  Layers,
  LogOut,
  Menu,
  Moon,
  Plus,
  RefreshCw,
  Shield,
  Sun,
  User,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const {
    currentUser,
    authUser,
    notifications,
    lastSyncTime,
    isCloudSyncing,
    syncSavedData,
    logout,
    setIsQuickActionOpen,
    setIsLoginModalOpen,
    setActiveModule,
    markNotificationAsRead,
    clearNotifications,
    isDarkMode,
    toggleDarkMode,
  } = useApp();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Formatted date in Portuguese
  const today = new Date();
  const dateFormatted = today.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const capitalizedDate = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return isDarkMode
          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      case 'GERENTE':
        return isDarkMode
          ? 'bg-indigo-950/80 text-indigo-300 border-indigo-800/60'
          : 'bg-indigo-50 text-indigo-700 border-indigo-200/80';
      case 'VENDEDOR':
        return isDarkMode
          ? 'bg-amber-950/80 text-amber-300 border-amber-800/60'
          : 'bg-amber-50 text-amber-700 border-amber-200/80';
      default:
        return isDarkMode
          ? 'bg-slate-800 text-slate-300 border-slate-700'
          : 'bg-slate-50 text-slate-700 border-slate-200/80';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 px-4 md:px-6 transition-colors">
      {/* Left side: Mobile burger + Current Date + App title */}
      <div className="flex items-center gap-3">
        <button
          id="btn-toggle-sidebar"
          onClick={onToggleSidebar}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 lg:hidden"
          title="Abrir Menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="hidden sm:block">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {capitalizedDate}
            </span>
          </div>
        </div>
      </div>

      {/* Right side: Dark Mode Toggle + Cloud sync indicator + Quick actions + Notifications + User profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Dark Mode Quick Switch in Header */}
        <button
          id="btn-toggle-darkmode-header"
          onClick={toggleDarkMode}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-amber-300 hover:bg-slate-50 dark:hover:bg-slate-750 shadow-xs transition-colors"
          title={isDarkMode ? 'Mudar para Modo Claro' : 'Mudar para Modo Noturno'}
        >
          {isDarkMode ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-slate-600" />
          )}
        </button>

        {/* Cloud Online Status & Sync Button */}
        <button
          id="btn-cloud-sync-header"
          onClick={() => syncSavedData()}
          disabled={isCloudSyncing}
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer ${
            authUser?.isAnonymous
              ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/90 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60'
              : 'border-slate-200/80 dark:border-slate-750 bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750'
          }`}
          title="Clique para sincronizar todos os seus dados salvos com a nuvem"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isCloudSyncing ? 'animate-spin text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
          <span className="hidden sm:inline">
            {isCloudSyncing ? 'Sincronizando...' : authUser?.isAnonymous ? 'Sincronizar Dados Salvos' : `Nuvem: ${lastSyncTime}`}
          </span>
          <span className="sm:hidden">
            {isCloudSyncing ? '...' : 'Sincronizar'}
          </span>
        </button>

        {/* Quick Action Button */}
        <button
          id="btn-quick-action"
          onClick={() => setIsQuickActionOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white shadow-xs"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span className="hidden sm:inline">Ação Rápida</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            id="btn-notifications"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 shadow-xs"
            title="Notificações e Alertas"
          >
            <Bell className="h-3.5 w-3.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[9px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 p-3.5 shadow-lg ring-1 ring-black/5 z-50">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2.5 mb-2.5">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                  <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">Notificações & Alertas</span>
                </div>
                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  >
                    Limpar todas
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                    <CheckCircle2 className="mx-auto mb-1 h-5 w-5 text-slate-300 dark:text-slate-600" />
                    Tudo em dia! Sem alertas pendentes no momento.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markNotificationAsRead(n.id);
                        if (n.linkModule) {
                          setActiveModule(n.linkModule as any);
                          setIsNotifOpen(false);
                        }
                      }}
                      className={`cursor-pointer rounded-lg p-2.5 text-xs transition-colors border ${
                        n.read
                          ? 'bg-slate-50/60 dark:bg-slate-750/50 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                          : 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-200/70 dark:border-amber-800/60 text-slate-800 dark:text-amber-200 font-medium'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{n.title}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">Hoje</span>
                      </div>
                      <p className="mt-1 text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Switcher */}
        <div className="relative">
          <button
            id="btn-user-profile-menu"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 rounded-lg border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 sm:px-2.5 sm:py-1.5 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-xs"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 text-[11px] font-bold text-white">
              {currentUser.name ? currentUser.name.charAt(0) : 'U'}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-none">{currentUser.name}</p>
            </div>
            <span className={`hidden sm:inline-block rounded px-1.5 py-0.5 text-[9px] font-bold border ${getRoleBadge(currentUser.role)}`}>
              {currentUser.role}
            </span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-60 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 shadow-lg ring-1 ring-black/5 z-50">
              <div className="border-b border-slate-100 dark:border-slate-700/60 p-2.5">
                <p className="text-xs font-bold text-slate-900 dark:text-white">{currentUser.name || 'Edgar Magno'}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                  {authUser?.email || 'edgar.magno@live.com'}
                </p>
                <span className={`mt-1.5 inline-block rounded px-1.5 py-0.5 text-[9px] font-semibold border ${getRoleBadge(currentUser.role)}`}>
                  Nível: {currentUser.role}
                </span>
              </div>

              <div className="py-1 space-y-0.5">
                <button
                  id="btn-menu-sync"
                  onClick={async () => {
                    setIsUserMenuOpen(false);
                    await syncSavedData();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                  Sincronizar Dados Salvos
                </button>

                <button
                  id="btn-menu-sync-modal"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setIsLoginModalOpen(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <Cloud className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                  Central de Sincronização
                </button>

                <button
                  id="btn-open-settings"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setActiveModule('settings');
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <Shield className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                  Configurações do Sistema
                </button>

                <div className="border-t border-slate-100 dark:border-slate-750 my-1"></div>

                <button
                  id="btn-menu-logout"
                  onClick={async () => {
                    setIsUserMenuOpen(false);
                    await logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sair da Conta (Logout)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
