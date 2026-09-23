import React, { useState } from 'react';
import {
  CheckCircle2,
  Cloud,
  Download,
  Eye,
  EyeOff,
  FolderSync,
  Lock,
  LogIn,
  LogOut,
  Mail,
  Package,
  RefreshCw,
  ShieldCheck,
  Upload,
  UserCheck,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LoginModal: React.FC = () => {
  const {
    isLoginModalOpen,
    setIsLoginModalOpen,
    currentUser,
    authUser,
    lastSyncTime,
    isCloudSyncing,
    syncSavedData,
    loginWithEmail,
    logout,
    products,
    sales,
    customers,
    quotes,
    transactions,
    productionOrders,
    exportBackupJSON,
    importBackupJSON,
  } = useApp();

  const [inputEmail, setInputEmail] = useState('edgar.magno@live.com');
  const [inputPass, setInputPass] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!isLoginModalOpen) return null;

  const handleSyncNow = async () => {
    setFeedback('Sincronizando dados com a conta edgar.magno@live.com...');
    const result = await syncSavedData();
    setFeedback(result.message);
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleQuickLogin = async (targetEmail = 'edgar.magno@live.com', targetPass = '123456') => {
    setIsSubmitting(true);
    setFeedback('Autenticando...');
    try {
      await loginWithEmail(targetEmail, targetPass);
      setFeedback('Login efetuado com sucesso! Dados sincronizados.');
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback(`Erro ao autenticar: ${err?.message || 'Verifique as credenciais.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsLoginModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportBackup = () => {
    try {
      setIsExporting(true);
      const json = exportBackupJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-gestao-comercial-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setFeedback('Backup baixado com sucesso!');
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback('Erro ao gerar backup.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        setFeedback('Restaurando dados do arquivo...');
        const res = await importBackupJSON(text);
        setFeedback(res.message);
        setTimeout(() => setFeedback(null), 5000);
      } catch {
        setFeedback('Erro ao ler arquivo de backup.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <FolderSync className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Central de Login & Sincronização
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Acesso direto sem Google e sincronização em nuvem
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsLoginModalOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="mt-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 p-3 text-xs text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 shrink-0 ${isCloudSyncing || isSubmitting ? 'animate-spin' : ''}`} />
            <span>{feedback}</span>
          </div>
        )}

        {/* Active Account Status Card */}
        <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-sm font-black text-white shadow-xs">
                EM
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-slate-900 dark:text-white">
                    {currentUser.name || 'Edgar Magno'}
                  </p>
                  <span className="rounded bg-indigo-100 dark:bg-indigo-950/60 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                    {currentUser.role || 'ADMIN'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {authUser?.email || 'edgar.magno@live.com'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Sincronizado
              </span>
              <p className="mt-1 text-[10px] text-slate-400">Última sinc: {lastSyncTime}</p>
            </div>
          </div>

          {/* Records summary grid */}
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-200/80 dark:border-slate-700/60 pt-3">
            <div className="rounded-lg bg-white dark:bg-slate-800 p-2 text-center border border-slate-200/60 dark:border-slate-700/50">
              <p className="text-base font-extrabold text-slate-900 dark:text-white">{products.length}</p>
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Produtos</p>
            </div>
            <div className="rounded-lg bg-white dark:bg-slate-800 p-2 text-center border border-slate-200/60 dark:border-slate-700/50">
              <p className="text-base font-extrabold text-slate-900 dark:text-white">{sales.length}</p>
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Vendas</p>
            </div>
            <div className="rounded-lg bg-white dark:bg-slate-800 p-2 text-center border border-slate-200/60 dark:border-slate-700/50">
              <p className="text-base font-extrabold text-slate-900 dark:text-white">{customers.length}</p>
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Clientes</p>
            </div>
            <div className="rounded-lg bg-white dark:bg-slate-800 p-2 text-center border border-slate-200/60 dark:border-slate-700/50">
              <p className="text-base font-extrabold text-slate-900 dark:text-white">{quotes.length}</p>
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Orçamentos</p>
            </div>
            <div className="rounded-lg bg-white dark:bg-slate-800 p-2 text-center border border-slate-200/60 dark:border-slate-700/50">
              <p className="text-base font-extrabold text-slate-900 dark:text-white">{transactions.length}</p>
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Financeiro</p>
            </div>
            <div className="rounded-lg bg-white dark:bg-slate-800 p-2 text-center border border-slate-200/60 dark:border-slate-700/50">
              <p className="text-base font-extrabold text-slate-900 dark:text-white">{productionOrders.length}</p>
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Produção</p>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={handleSyncNow}
            disabled={isCloudSyncing}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${isCloudSyncing ? 'animate-spin' : ''}`} />
            <span>{isCloudSyncing ? 'Sincronizando...' : 'Sincronizar Meus Dados Salvos'}</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 px-4 py-2.5 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sair</span>
          </button>
        </div>

        {/* 1-Click Quick Login or Re-authentication */}
        {authUser?.email !== 'edgar.magno@live.com' && (
          <div className="mt-4 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/50 dark:bg-indigo-950/30 p-3.5">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Conectar Conta Edgar Magno
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-3">
              Entre diretamente com a conta oficial para sincronizar todos os registros.
            </p>
            <button
              type="button"
              onClick={() => handleQuickLogin('edgar.magno@live.com', '123456')}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Entrar com edgar.magno@live.com (Senha: 123456)</span>
            </button>
          </div>
        )}

        {/* Local Backup & Export Options */}
        <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/50 dark:bg-slate-850/50">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
            Cópia de Segurança (Backup JSON)
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
            Baixe uma cópia dos seus dados sincronizados ou restaure a partir de um arquivo.
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleExportBackup}
              disabled={isExporting}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Baixar Backup</span>
            </button>

            <label className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer">
              <Upload className="h-3.5 w-3.5" />
              <span>Restaurar Arquivo</span>
              <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
            </label>
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-5">
          <button
            type="button"
            onClick={() => setIsLoginModalOpen(false)}
            className="w-full rounded-xl bg-slate-100 dark:bg-slate-800 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Fechar e Voltar ao Sistema
          </button>
        </div>
      </div>
    </div>
  );
};
