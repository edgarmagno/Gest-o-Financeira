import React, { useState } from 'react';
import { BarChart3, CheckCircle2, Cloud, Loader2, RefreshCw, X } from 'lucide-react';
import { AuthScreen } from './components/AuthScreen';
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

  // Initial loading state
  if (isAuthLoading && !authUser) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#F8FAFC] dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 dark:bg-indigo-600 text-white shadow-lg animate-pulse">
          <BarChart3 className="h-6 w-6 stroke-[2.2]" />
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <Loader2 className="h-4 w-4 text-slate-900 dark:text-indigo-400 animate-spin" />
          <span>Conectando e sincronizando dados (edgar.magno@live.com)...</span>
        </div>
      </div>
    );
  }

  // If user signed out, display direct login screen without Google
  if (!authUser) {
    return <AuthScreen />;
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
