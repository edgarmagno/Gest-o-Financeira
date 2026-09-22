import React from 'react';
import {
  DollarSign,
  FileText,
  Package,
  PlusCircle,
  ShoppingBag,
  UserPlus,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const QuickActionModal: React.FC = () => {
  const { isQuickActionOpen, setIsQuickActionOpen, setActiveModule } = useApp();

  if (!isQuickActionOpen) return null;

  const actions = [
    {
      title: 'Abrir PDV / Nova Venda',
      desc: 'Realizar venda rápida com catálogo ou busca por código de barras',
      icon: ShoppingBag,
      color: 'border-slate-200/80 bg-white hover:bg-slate-50/80',
      iconBg: 'bg-slate-900 text-white',
      module: 'pos',
    },
    {
      title: 'Cadastrar Novo Produto',
      desc: 'Adicionar item com custo, preço de venda e controle de estoque',
      icon: Package,
      color: 'border-slate-200/80 bg-white hover:bg-slate-50/80',
      iconBg: 'bg-slate-900 text-white',
      module: 'products',
    },
    {
      title: 'Novo Lançamento (Despesa / Receita)',
      desc: 'Registrar saída operacional ou entrada no histórico unificado',
      icon: DollarSign,
      color: 'border-slate-200/80 bg-white hover:bg-slate-50/80',
      iconBg: 'bg-slate-900 text-white',
      module: 'sales',
    },
    {
      title: 'Criar Orçamento / Proposta',
      desc: 'Elaborar cotação comercial com itens e converter em venda',
      icon: FileText,
      color: 'border-slate-200/80 bg-white hover:bg-slate-50/80',
      iconBg: 'bg-slate-900 text-white',
      module: 'quotes',
    },
    {
      title: 'Cadastrar Novo Cliente',
      desc: 'Registrar dados de contato, WhatsApp e limite comercial',
      icon: UserPlus,
      color: 'border-slate-200/80 bg-white hover:bg-slate-50/80',
      iconBg: 'bg-slate-900 text-white',
      module: 'customers',
    },
  ];

  const handleSelect = (module: string) => {
    setActiveModule(module as any);
    setIsQuickActionOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200/80">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
              <PlusCircle className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Ações Rápidas</h3>
              <p className="text-xs text-slate-500">Escolha o que deseja iniciar agora</p>
            </div>
          </div>
          <button
            onClick={() => setIsQuickActionOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.title}
                onClick={() => handleSelect(act.module)}
                className={`flex w-full items-center gap-3.5 rounded-xl border p-3 text-left transition-all ${act.color} shadow-xs`}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${act.iconBg}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-xs text-slate-900">{act.title}</div>
                  <div className="text-[11px] text-slate-500">{act.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-5 text-center">
          <button
            onClick={() => setIsQuickActionOpen(false)}
            className="text-[11px] font-medium text-slate-400 hover:text-slate-700"
          >
            Fechar janela
          </button>
        </div>
      </div>
    </div>
  );
};
