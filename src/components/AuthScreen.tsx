import React, { useState } from 'react';
import {
  CheckCircle2,
  Cloud,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Laptop,
  Lock,
  LogIn,
  Mail,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AuthScreen: React.FC = () => {
  const { loginWithEmail, loginWithGoogle, resetPassword } = useApp();

  const [email, setEmail] = useState('edgar.magno@live.com');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleLogin = async (targetEmail = email, targetPass = password) => {
    setError(null);
    setInfoMessage(null);
    setIsLoading(true);
    try {
      await loginWithEmail(targetEmail.trim(), targetPass);
    } catch (err: any) {
      console.warn('Login error:', err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Senha incorreta ou credenciais inválidas. Verifique a senha informada.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Muitas tentativas sem sucesso. Aguarde alguns instantes e tente novamente.');
      } else {
        setError(err.message || 'Falha ao autenticar. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickEdgarLogin = async () => {
    setEmail('edgar.magno@live.com');
    setPassword('123456');
    await handleLogin('edgar.magno@live.com', '123456');
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setError('Informe o e-mail para redefinir a senha.');
      return;
    }
    setError(null);
    try {
      await resetPassword(email.trim());
      setInfoMessage(`Link de redefinição de senha enviado para ${email.trim()}!`);
    } catch (err: any) {
      setError(`Erro ao enviar redefinição: ${err?.message || 'Tente novamente.'}`);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-[#F8FAFC] dark:bg-[#0b0f19] p-4 sm:p-6 lg:p-8 text-slate-800 dark:text-slate-100 antialiased selection:bg-indigo-600 selection:text-white">
      {/* Brand Header */}
      <div className="w-full max-w-md text-center mb-6">
        <div className="mx-auto mb-3 flex h-13 w-13 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/25">
          <Sparkles className="h-6 w-6 stroke-[2.2]" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          GESTÃO COMERCIAL PRO
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Loja de Personalizados, Vendas (PDV), Estoque & Finanças
        </p>
      </div>

      {/* Main Auth Card */}
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-850 p-6 sm:p-8 shadow-xl shadow-slate-200/40 dark:shadow-none">
        {/* Sync Status Banner */}
        <div className="mb-6 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900/50 p-3.5 flex items-center justify-between text-xs text-indigo-950 dark:text-indigo-200">
          <div className="flex items-center gap-2">
            <Cloud className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <div>
              <p className="font-bold text-[11px] leading-tight">Dados Sincronizados em Nuvem</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Banco de Dados Firestore em Tempo Real</p>
            </div>
          </div>
          <span className="flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Online
          </span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* Info Alert */}
        {infoMessage && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div className="flex-1">{infoMessage}</div>
          </div>
        )}

        {/* 1-CLICK QUICK LOGIN BUTTON */}
        <div className="mb-5">
          <button
            id="btn-quick-edgar-login"
            type="button"
            onClick={handleQuickEdgarLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-between rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 p-3.5 text-left text-white shadow-md shadow-indigo-600/20 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 shrink-0 font-bold text-sm">
                EM
              </div>
              <div className="truncate">
                <p className="font-bold text-xs">Entrar como Edgar Magno</p>
                <p className="text-[11px] text-indigo-100 font-mono truncate">edgar.magno@live.com</p>
              </div>
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-white/15 px-2.5 py-1 text-[11px] font-semibold shrink-0">
              {isLoading ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <span>1 Clique</span>
                  <LogIn className="h-3.5 w-3.5" />
                </>
              )}
            </div>
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
            <span className="bg-white dark:bg-slate-850 px-3 text-slate-400 dark:text-slate-500">
              Login com E-mail e Senha (Sem Google)
            </span>
          </div>
        </div>

        {/* Email and Password Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                id="input-login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="edgar.magno@live.com"
                required
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 font-medium"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Senha
              </label>
              <button
                type="button"
                onClick={handleResetPassword}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Esqueci a senha
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                id="input-login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="123456"
                required
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            id="btn-submit-login"
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 py-3 text-xs font-bold text-white shadow-sm active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Autenticando e Sincronizando...</span>
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                <span>Acessar Sistema com edgar.magno@live.com</span>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
            <span className="bg-white dark:bg-slate-850 px-3 text-slate-400 dark:text-slate-500">
              Ou acesse com Google
            </span>
          </div>
        </div>

        {/* Google Login button */}
        <button
          id="btn-google-login"
          type="button"
          onClick={async () => {
            setError(null);
            setIsLoading(true);
            try {
              await loginWithGoogle();
            } catch (err: any) {
              if (err.code !== 'auth/popup-closed-by-user') {
                setError(err.message || 'Falha ao autenticar com Google.');
              }
            } finally {
              setIsLoading(false);
            }
          }}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs cursor-pointer transition-all disabled:opacity-50"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Entrar com Conta Google</span>
        </button>

        {/* Security badge */}
        <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>Login direto com sincronização de produtos, vendas e clientes</span>
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
          <span>Computador & PDV</span>
        </div>
        <span className="text-slate-300 dark:text-slate-700">•</span>
        <div className="flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5 text-slate-400" />
          <span>Sincronização em Nuvem</span>
        </div>
      </div>
    </div>
  );
};
