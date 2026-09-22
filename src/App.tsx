import React, { useState } from 'react';
import { BarChart3, Cloud, Loader2 } from 'lucide-react';
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
  const { activeModule, authUser, isAuthLoading } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 1. Loading state while checking Firebase session
  if (isAuthLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#F8FAFC] text-slate-800">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
          <BarChart3 className="h-6 w-6 stroke-[2.2]" />
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-600">
          <Loader2 className="h-4 w-4 text-slate-900" />
          <span>Iniciando sessão segura em nuvem...</span>
        </div>
      </div>
    );
  }

  // 2. If user is not authenticated, show modern Auth Screen
  if (!authUser) {
    return <AuthScreen />;
  }

  // 3. User authenticated - render full application modules
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
