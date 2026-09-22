import React, { useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  Cloud,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Laptop,
  Lock,
  Mail,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  User,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AuthScreen: React.FC = () => {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, loginGuest } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('O login com Google foi cancelado na janela pop-up.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('A janela pop-up foi bloqueada pelo navegador. Permita pop-ups para fazer login.');
      } else {
        setError(err.message || 'Falha ao autenticar com o Google.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Por favor, informe seu e-mail e senha.');
      return;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setError('Por favor, informe seu nome completo ou nome da sua empresa.');
        return;
      }
      if (password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setError('As senhas digitadas não coincidem.');
        return;
      }
    }

    setIsLoading(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(email.trim(), password);
      } else {
        await registerWithEmail(email.trim(), password, name.trim());
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está cadastrado. Tente fazer login.');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha é muito fraca. Escolha uma senha com letras e números.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Formato de e-mail inválido.');
      } else {
        setError(err.message || 'Erro ao realizar autenticação.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await loginGuest();
    } catch (err: any) {
      console.error(err);
      setError('Erro ao iniciar acesso anônimo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-[#F8FAFC] p-4 sm:p-6 lg:p-8 text-slate-800 antialiased selection:bg-slate-900 selection:text-white">
      {/* Brand Header */}
      <div className="w-full max-w-md text-center mb-6">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
          <BarChart3 className="h-6 w-6 stroke-[2.2]" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          GESTAO PRO
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Comercial, Estoque, PDV & Finanças em Nuvem
        </p>
      </div>

      {/* Main Auth Card */}
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
        {/* Value Prop Banner */}
        <div className="mb-6 rounded-xl bg-slate-50 border border-slate-100 p-3 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Cloud className="h-4 w-4 text-slate-900 shrink-0" />
            <span className="font-medium text-[11px]">Banco de dados real sincronizado em nuvem</span>
          </div>
          <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            Firestore
          </span>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* 1-Click Google Sign-In */}
        <button
          id="btn-google-login"
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-3 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:border-slate-300 active:scale-98 transition-all disabled:opacity-50"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
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
          <span>Continuar com Google</span>
        </button>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-white px-2 text-slate-400 font-semibold tracking-wider">
              Ou use seu e-mail
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-lg bg-slate-100 p-1 mb-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-md transition-all ${
              mode === 'login'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-md transition-all ${
              mode === 'register'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Criar Nova Conta
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleEmailAuth} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome Completo / Empresa *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: João da Silva / Loja Central"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              E-mail *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Senha *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : 'Sua senha cadastrada'}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-9 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirmar Senha *
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita sua senha"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>
          )}

          <button
            id="btn-submit-auth"
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-slate-900 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 active:scale-98 transition-all disabled:opacity-50 mt-2"
          >
            {isLoading
              ? 'Processando...'
              : mode === 'login'
              ? 'Entrar no Sistema'
              : 'Criar Minha Conta & Iniciar'}
          </button>
        </form>

        {/* Quick Guest mode */}
        <div className="mt-4 pt-4 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={handleGuestLogin}
            disabled={isLoading}
            className="text-[11px] font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            Deseja testar sem senha agora? <span className="underline">Acesso Imediato</span>
          </button>
        </div>
      </div>

      {/* Multi-device badges footer */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-slate-500 text-xs">
        <div className="flex items-center gap-1.5">
          <Smartphone className="h-3.5 w-3.5 text-slate-400" />
          <span>Celular (Android / iOS)</span>
        </div>
        <span className="text-slate-300">•</span>
        <div className="flex items-center gap-1.5">
          <Laptop className="h-3.5 w-3.5 text-slate-400" />
          <span>Computador & Notebook</span>
        </div>
        <span className="text-slate-300">•</span>
        <div className="flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5 text-slate-400" />
          <span>Qualquer Navegador</span>
        </div>
      </div>
    </div>
  );
};
