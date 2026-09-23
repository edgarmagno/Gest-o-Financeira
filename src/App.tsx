import React, { useState } from 'react';
import { BarChart3, CheckCircle2, Cloud, Loader2, RefreshCw, X } from 'lucide-react';
import { Header } from './components/Header';
import { LoginModal } from './components/LoginModal';
import { QuickActionModal } from './components/QuickActionModal';
import { ReceiptModal } from './components/ReceiptModal';
import { Sidebar } from './components/Sidebar';
import { AppProvider, useApp } from './context/AppContext';
import { CustomersModule } from './modules/CustomersModule';
import { DashboardModule } from './modules/DashboardModule';
import { PosModule } from './modules/PosModule';
import { ProductionModule } from './modules/ProductionModule';
import { ProductsModule } from './modules/ProductsModule';
import { QuotesModule } from './modules/QuotesModule';
import { SalesHistoryModule } from './modules/SalesHistoryModule';
import { SettingsModule } from './modules/SettingsModule';

const MainContent: React.FC = () => {
  const {
    activeModule,
    isAuthLoading,
    authUser,
    syncStatusMessage,
    setSyncStatusMessage,
    syncSavedData,
    isCloudSyncing,
  } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dismissSyncRibbon, setDismissSyncRibbon] = useState(false);

  // Brief initial loading screen if authentication check is pending
  if (isAuthLoading && !authUser) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#F8FAFC] dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 dark:bg-indigo-600 text-white shadow-lg animate-pulse">
          <BarChart3 className="h-6 w-6 stroke-[2.2]" />
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <Loader2 className="h-4 w-4 text-slate-900 dark:text-indigo-400 animate-spin" />
          <span>Iniciando sistema comercial...</span>
        </div>
      </div>
    );
  }

  // Render full application modules directly (no login wall)
  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <DashboardModule />;
      case 'pos':
        return <PosModule />;
      case 'sales':
      case 'finance':
        return <SalesHistoryModule />;
      case 'quotes':
        return <QuotesModule />;
      case 'production':
        return <ProductionModule />;
      case 'products':
        return <ProductsModule />;
      case 'customers':
        return <CustomersModule />;
      case 'settings':
        return <SettingsModule />;
      default:
        return <DashboardModule />;
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F8FAFC] dark:bg-[#0b0f19] font-sans text-slate-800 dark:text-slate-100 antialiased selection:bg-indigo-600 selection:text-white">
      {/* Navigation Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
      />

      {/* Main App Content Viewport */}
      <div
        className={`flex flex-1 flex-col overflow-hidden transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        {/* Global Navigation Header */}
        <Header onToggleSidebar={() => setSidebarOpen(true)} />

        {/* Dynamic Sync Status Alert Banner */}
        {syncStatusMessage && (
          <div className="bg-indigo-600 dark:bg-indigo-700 text-white px-4 py-2 text-xs flex items-center justify-between shadow-xs transition-all z-20">
            <div className="flex items-center gap-2">
              <RefreshCw className={`h-3.5 w-3.5 ${isCloudSyncing ? 'animate-spin' : ''}`} />
              <span className="font-medium">{syncStatusMessage}</span>
            </div>
            <button
              onClick={() => setSyncStatusMessage(null)}
              className="p-1 hover:bg-white/20 rounded transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Sync Saved Data Callout Ribbon for Anonymous / Guest session */}
        {authUser?.isAnonymous && !dismissSyncRibbon && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/30 border-b border-indigo-100 dark:border-indigo-900/50 px-4 py-2 text-xs flex items-center justify-between gap-3 text-indigo-950 dark:text-indigo-200">
            <div className="flex items-center gap-2 min-w-0">
              <Cloud className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <p className="truncate">
                <strong className="font-semibold">Recuperar Dados Salvos:</strong> Conecte sua conta Google para sincronizar todos os seus produtos e vendas cadastrados na nuvem.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                id="btn-sync-ribbon"
                onClick={() => syncSavedData()}
                disabled={isCloudSyncing}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3 py-1 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
              >
                <RefreshCw className={`h-3 w-3 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                <span>{isCloudSyncing ? 'Sincronizando...' : 'Sincronizar Meus Dados Salvos'}</span>
              </button>
              <button
                onClick={() => setDismissSyncRibbon(true)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
                title="Fechar aviso"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Module Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl pb-10">{renderModule()}</div>
        </main>
      </div>

      {/* Global Modals */}
      <ReceiptModal />
      <LoginModal />
      <QuickActionModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
