import React, { useState } from 'react';
import {
  Cloud,
  Globe,
  Laptop,
  LogIn,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  User,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AuthScreen: React.FC = () => {
  const { loginWithGoogle, loginGuest } = useApp();

  const [customName, setCustomName] = useState('Eddy Arcanjo');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.warn('Google login error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('A janela do Google foi fechada antes de concluir.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('O navegador bloqueou a janela pop-up do Google. Utilize a opção "Entrar Sem Senha" abaixo.');
      } else {
        setError(err.message || 'Falha ao autenticar com o Google. Use o Acesso Direto abaixo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await loginGuest(customName.trim() || 'Eddy Arcanjo');
    } catch (err: any) {
      console.warn('Quick login error:', err);
      setError('Erro ao iniciar acesso instantâneo. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-[#F8FAFC] dark:bg-[#0b0f19] p-4 sm:p-6 lg:p-8 text-slate-800 dark:text-slate-100 antialiased selection:bg-indigo-600 selection:text-white">
      {/* Brand Header */}
      <div className="w-full max-w-md text-center mb-6">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
          <Sparkles className="h-6 w-6 stroke-[2.2]" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          GESTÃO PRO
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Loja de Personalizados, Estoque, PDV & Finanças em Nuvem
        </p>
      </div>

      {/* Main Auth Card */}
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-850 p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none">
        {/* Value Prop Banner */}
        <div className="mb-6 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <Cloud className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="font-medium text-[11px]">Banco em nuvem sincronizado</span>
          </div>
          <span className="flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Firestore Ativo
          </span>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* PRIMARY ACTION: 1-Click Google Sign-In */}
        <div className="space-y-3">
          <button
            id="btn-google-login"
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 py-3.5 px-4 text-sm font-bold text-slate-800 dark:text-white shadow-sm hover:shadow-md transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
          >
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isLoading ? 'Conectando...' : 'Entrar com Google'}</span>
          </button>
          <p className="text-center text-[11px] text-slate-500 dark:text-slate-400">
            Acesso em 1 clique com sua conta Google (sem precisar digitar senha)
          </p>
        </div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
            <span className="bg-white dark:bg-slate-850 px-3 text-slate-400 dark:text-slate-500">
              Ou Acesso Direto Sem Senha
            </span>
          </div>
        </div>

        {/* SECONDARY ACTION: Passwordless Instant Access */}
        <form onSubmit={handleQuickLogin} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nome do Operador / Loja
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                id="input-operator-name"
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Seu Nome ou Nome da Loja"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 font-medium"
              />
            </div>
          </div>

          <button
            id="btn-quick-login"
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 py-3 text-xs font-bold text-white shadow-md shadow-indigo-600/20 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Zap className="h-4 w-4 fill-white" />
            <span>{isLoading ? 'Entrando...' : 'Entrar no Sistema Sem Senha'}</span>
          </button>
        </form>

        {/* Security badge */}
        <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>Login protegido sem risco de erro de credenciais</span>
        </div>
      </div>

      {/* Multi-device badges footer */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-slate-500 dark:text-slate-400 text-xs">
        <div className="flex items-center gap-1.5">
          <Smartphone className="h-3.5 w-3.5 text-slate-400" />
          <span>Celular (Android / iOS)</span>
        </div>
        <span className="text-slate-300 dark:text-slate-700">•</span>
        <div className="flex items-center gap-1.5">
          <Laptop className="h-3.5 w-3.5 text-slate-400" />
          <span>Computador & Notebook</span>
        </div>
        <span className="text-slate-300 dark:text-slate-700">•</span>
        <div className="flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5 text-slate-400" />
          <span>Qualquer Navegador</span>
        </div>
      </div>
    </div>
  );
};
