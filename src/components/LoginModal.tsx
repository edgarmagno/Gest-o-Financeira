import React from 'react';
import {
  Cloud,
  CheckCircle2,
  RefreshCw,
  Shield,
  Smartphone,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LoginModal: React.FC = () => {
  const {
    isLoginModalOpen,
    setIsLoginModalOpen,
    currentUser,
    lastSyncTime,
  } = useApp();

  if (!isLoginModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200/80">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Status do Sistema</h3>
              <p className="text-xs text-slate-500">Conexão e sincronização em tempo real</p>
            </div>
          </div>
          <button
            onClick={() => setIsLoginModalOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Current Active Profile Card */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white shadow-xs">
              {currentUser.name ? currentUser.name.charAt(0) : 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold text-xs text-slate-900 truncate">{currentUser.name}</p>
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800 border border-emerald-200">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">Acesso Liberado Sem Restrições</p>
            </div>
          </div>

          <div className="mt-3.5 pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <Cloud className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-[11px]">Sincronização em tempo real</span>
            </div>
            <span className="text-[11px] font-medium text-slate-500">{lastSyncTime}</span>
          </div>
        </div>

        {/* Multi-device sync note */}
        <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1.5">
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs">
            <Smartphone className="h-3.5 w-3.5" />
            <span>Acesso Total Disponível</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Seus produtos, vendas, orçamentos e financeiro estão salvos e sincronizados automaticamente na nuvem.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-5 space-y-2">
          <button
            type="button"
            onClick={() => setIsLoginModalOpen(false)}
            className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
          >
            Continuar no Sistema
          </button>
        </div>
      </div>
    </div>
  );
};
