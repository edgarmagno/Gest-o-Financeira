import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Edit2,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  MessageCircle,
  Package,
  Phone,
  Plus,
  Printer,
  Search,
  Sparkles,
  Tag,
  Trash2,
  User,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  ProductionOrder,
  ProductionOrderLog,
  ProductionPriority,
  ProductionStatus,
} from '../types';
import {
  formatCurrency,
  formatDate,
  formatNumber,
} from '../utils/formatters';

// Status focados em Loja de Personalizados
const STATUS_CONFIG: Record<
  ProductionStatus,
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    icon: React.ComponentType<{ className?: string }>;
    next?: ProductionStatus;
    nextActionLabel?: string;
  }
> = {
  PENDENTE: {
    label: 'A Fazer / Na Fila',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
    icon: Clock,
    next: 'EM_PRODUCAO',
    nextActionLabel: 'Iniciar Produção',
  },
  EM_PRODUCAO: {
    label: 'Em Produção / Personalizando',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
    icon: Sparkles,
    next: 'PRONTO',
    nextActionLabel: 'Marcar como Pronto',
  },
  PRONTO: {
    label: 'Pronto p/ Retirada',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: CheckCircle2,
    next: 'ENTREGUE',
    nextActionLabel: 'Marcar como Entregue',
  },
  ENTREGUE: {
    label: 'Entregue ao Cliente',
    bg: 'bg-slate-100 dark:bg-slate-800/80',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
    icon: Check,
  },
  CANCELADO: {
    label: 'Cancelado',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-800',
    icon: AlertCircle,
  },
};

const KANBAN_STAGES: ProductionStatus[] = [
  'PENDENTE',
  'EM_PRODUCAO',
  'PRONTO',
  'ENTREGUE',
];

const PRIORITY_CONFIG: Record<
  ProductionPriority,
  { label: string; badge: string }
> = {
  BAIXA: {
    label: 'Baixa',
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  },
  MEDIA: {
    label: 'Normal',
    badge: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  },
  ALTA: {
    label: 'Alta',
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  URGENTE: {
    label: 'Urgente',
    badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800 animate-pulse',
  },
};

// Exemplos rápidos de produtos personalizados
const QUICK_PRODUCTS = [
  'Caneca Personalizada',
  'Camiseta Estampada',
  'Copo Long Drink',
  'Tirante / Cordão',
  'Agenda / Planner',
  'Chaveiro Personalizado',
  'Almofada',
  'Sacola / Ecobag',
  'Adesivos / Rótulos',
  'Troféu / Acrílico',
];

export const ProductionModule: React.FC = () => {
  const {
    productionOrders,
    createProductionOrder,
    updateProductionOrder,
    updateProductionStatus,
    deleteProductionOrder,
    activeProductionDraft,
    setActiveProductionDraft,
    products,
    customers,
    currentUser,
    company,
  } = useApp();

  // Estados de visualização e filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Modais
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ProductionOrder | null>(null);
  const [viewDetailsOrder, setViewDetailsOrder] = useState<ProductionOrder | null>(null);
  const [printOrder, setPrintOrder] = useState<ProductionOrder | null>(null);

  // Formulário Simples: Nome, Produto, Quantidade, Status (+ detalhes úteis)
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [productName, setProductName] = useState('');
  const [selectedCatalogProductId, setSelectedCatalogProductId] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [status, setStatus] = useState<ProductionStatus>('PENDENTE');
  const [customDetails, setCustomDetails] = useState(''); // Tema, nome a estampar, cores
  const [totalValue, setTotalValue] = useState<number>(0);
  const [deadlineDate, setDeadlineDate] = useState('');
  const [priority, setPriority] = useState<ProductionPriority>('MEDIA');
  const [notes, setNotes] = useState('');

  // Sincronizar rascunho vindo de Orçamento ou Venda
  useEffect(() => {
    if (activeProductionDraft) {
      setCustomerName(activeProductionDraft.customerName || '');
      setCustomerPhone(activeProductionDraft.customerPhone || '');
      setSelectedCustomerId(activeProductionDraft.customerId || '');
      
      const firstItem = activeProductionDraft.items?.[0];
      const mainProd = firstItem?.name || activeProductionDraft.title || '';
      setProductName(mainProd);
      setQuantity(firstItem?.quantity || activeProductionDraft.quantity || 1);
      setCustomDetails(firstItem?.specs || activeProductionDraft.customDetails || '');
      setPriority(activeProductionDraft.priority || 'MEDIA');
      setStatus(activeProductionDraft.status || 'PENDENTE');
      
      const calculatedTotal = (activeProductionDraft.items || []).reduce(
        (acc, it) => acc + (it.unitPrice || 0) * (it.quantity || 1),
        0
      );
      setTotalValue(calculatedTotal || activeProductionDraft.totalValue || 0);
      setDeadlineDate(activeProductionDraft.deadlineDate || '');
      setNotes(activeProductionDraft.notes || '');

      setEditingOrder(null);
      setIsFormOpen(true);
      setActiveProductionDraft(null);
    }
  }, [activeProductionDraft, setActiveProductionDraft]);

  // Filtro de Pedidos
  const filteredOrders = useMemo(() => {
    return productionOrders.filter((order) => {
      // Filtro de Status
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'ACTIVE' && (order.status === 'ENTREGUE' || order.status === 'CANCELADO')) {
          return false;
        }
        if (statusFilter !== 'ACTIVE' && order.status !== statusFilter) {
          return false;
        }
      }

      // Filtro de Prioridade
      if (priorityFilter !== 'ALL' && order.priority !== priorityFilter) {
        return false;
      }

      // Busca simples por Nome, Produto ou Código
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchCode = order.code?.toLowerCase().includes(term);
        const matchTitle = (order.productName || order.title)?.toLowerCase().includes(term);
        const matchCustomer = order.customerName?.toLowerCase().includes(term);
        const matchPhone = order.customerPhone?.toLowerCase().includes(term);
        const matchDetails = order.customDetails?.toLowerCase().includes(term);
        return matchCode || matchTitle || matchCustomer || matchPhone || matchDetails;
      }

      return true;
    });
  }, [productionOrders, statusFilter, priorityFilter, searchTerm]);

  // Estatísticas Rápidas
  const stats = useMemo(() => {
    const total = productionOrders.length;
    const pending = productionOrders.filter((o) => o.status === 'PENDENTE').length;
    const inProgress = productionOrders.filter((o) => o.status === 'EM_PRODUCAO').length;
    const ready = productionOrders.filter((o) => o.status === 'PRONTO').length;
    const completed = productionOrders.filter((o) => o.status === 'ENTREGUE').length;
    const totalValueSum = productionOrders
      .filter((o) => o.status !== 'CANCELADO')
      .reduce((acc, o) => acc + (o.totalValue || 0), 0);
    const totalItemsSum = productionOrders
      .filter((o) => o.status !== 'CANCELADO')
      .reduce((acc, o) => acc + (o.quantity || 1), 0);

    return { total, pending, inProgress, ready, completed, totalValueSum, totalItemsSum };
  }, [productionOrders]);

  // Selecionar Cliente Existente
  const handleCustomerSelect = (custId: string) => {
    setSelectedCustomerId(custId);
    if (!custId) return;
    const found = customers.find((c) => c.id === custId);
    if (found) {
      setCustomerName(found.name || '');
      setCustomerPhone(found.phone || '');
    }
  };

  // Selecionar Produto do Estoque / Catálogo
  const handleProductSelect = (prodId: string) => {
    setSelectedCatalogProductId(prodId);
    if (!prodId) return;
    const found = products.find((p) => p.id === prodId);
    if (found) {
      setProductName(found.name || '');
      if (found.price && quantity > 0) {
        setTotalValue(found.price * quantity);
      }
    }
  };

  // Recalcular valor quando quantidade mudar
  const handleQuantityChange = (newQty: number) => {
    const validQty = Math.max(1, newQty);
    setQuantity(validQty);
    if (selectedCatalogProductId) {
      const found = products.find((p) => p.id === selectedCatalogProductId);
      if (found?.price) {
        setTotalValue(found.price * validQty);
      }
    }
  };

  // Abrir Formulário de Novo Pedido
  const handleOpenNewOrder = () => {
    setEditingOrder(null);
    setCustomerName('');
    setCustomerPhone('');
    setSelectedCustomerId('');
    setProductName('');
    setSelectedCatalogProductId('');
    setQuantity(1);
    setStatus('PENDENTE');
    setCustomDetails('');
    setTotalValue(0);
    setDeadlineDate('');
    setPriority('MEDIA');
    setNotes('');
    setIsFormOpen(true);
  };

  // Abrir Formulário de Edição
  const handleOpenEditOrder = (order: ProductionOrder) => {
    setEditingOrder(order);
    setCustomerName(order.customerName || '');
    setCustomerPhone(order.customerPhone || '');
    setSelectedCustomerId(order.customerId || '');
    setProductName(order.productName || order.title || '');
    setSelectedCatalogProductId('');
    setQuantity(order.quantity || 1);
    setStatus(order.status);
    setCustomDetails(order.customDetails || '');
    setTotalValue(order.totalValue || 0);
    setDeadlineDate(order.deadlineDate || '');
    setPriority(order.priority);
    setNotes(order.notes || '');
    setIsFormOpen(true);
  };

  // Salvar Pedido
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalProdName = productName.trim();
    const finalCustName = customerName.trim();

    if (!finalProdName) {
      alert('Por favor, informe o Produto.');
      return;
    }
    if (!finalCustName) {
      alert('Por favor, informe o Nome do Cliente.');
      return;
    }

    const payload = {
      title: finalProdName,
      productName: finalProdName,
      customerName: finalCustName,
      customerPhone: customerPhone.trim() || undefined,
      customerId: selectedCustomerId || undefined,
      quantity: Math.max(1, quantity || 1),
      status,
      customDetails: customDetails.trim() || undefined,
      totalValue: Number(totalValue) || 0,
      deadlineDate: deadlineDate || undefined,
      priority,
      notes: notes.trim() || undefined,
      type: 'PERSONALIZACAO' as const,
    };

    if (editingOrder) {
      await updateProductionOrder(editingOrder.id, payload);
    } else {
      await createProductionOrder(payload);
    }

    setIsFormOpen(false);
  };

  // Avançar Status em 1 Clique
  const handleAdvanceStatus = async (order: ProductionOrder) => {
    const nextStatus = STATUS_CONFIG[order.status].next;
    if (!nextStatus) return;
    await updateProductionStatus(order.id, nextStatus);
  };

  // Enviar Mensagem no WhatsApp
  const handleSendWhatsApp = (order: ProductionOrder) => {
    if (!order.customerPhone) {
      alert('Telefone do cliente não cadastrado.');
      return;
    }
    const cleanPhone = order.customerPhone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    const statusText = STATUS_CONFIG[order.status].label;
    const prodName = order.productName || order.title;

    let message = '';
    if (order.status === 'PRONTO') {
      message = `Olá *${order.customerName || 'Cliente'}*, tudo bem? 🎉\n\n` +
        `Seu pedido personalizado já está *PRONTO PARA RETIRADA*!\n` +
        `📦 *Produto:* ${order.quantity}x ${prodName}\n` +
        (order.customDetails ? `🎨 *Detalhes:* ${order.customDetails}\n` : '') +
        (order.totalValue ? `💰 *Valor:* ${formatCurrency(order.totalValue)}\n` : '') +
        `\nPode passar aqui na loja para retirar quando desejar!\n*${company.tradeName || company.corporateName || 'Nossa Loja'}*`;
    } else {
      message = `Olá *${order.customerName || 'Cliente'}*, tudo bem?\n\n` +
        `Atualização sobre o seu pedido personalizado *(${order.code})*:\n` +
        `📦 *Produto:* ${order.quantity}x ${prodName}\n` +
        `⚡ *Status Atual:* ${statusText}\n` +
        (order.deadlineDate ? `📅 *Previsão de Entrega:* ${formatDate(order.deadlineDate)}\n` : '') +
        `\nQualquer dúvida estamos à disposição!\n*${company.tradeName || company.corporateName || 'Nossa Loja'}*`;
    }

    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 pb-12" id="production-module">
      {/* Header do Módulo */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Pedidos & Personalizados
            </h2>
            <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Controle Simples
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestão simples de produção: <b>Nome</b>, <b>Produto</b>, <b>Quantidade</b> e <b>Status</b>.
          </p>
        </div>

        <div>
          {/* Botão Principal de Cadastro */}
          <button
            id="btn-new-custom-order"
            onClick={handleOpenNewOrder}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 active:scale-98 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>+ Novo Pedido Personalizado</span>
          </button>
        </div>
      </div>

      {/* Cards de Status (Filtro Rápido) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* A Fazer */}
        <button
          onClick={() => setStatusFilter(statusFilter === 'PENDENTE' ? 'ALL' : 'PENDENTE')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            statusFilter === 'PENDENTE'
              ? 'bg-amber-50/90 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 ring-2 ring-amber-500/20'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 text-xs font-bold">
            <span>A Fazer / Fila</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.pending}</span>
            <span className="text-xs text-slate-400">pedidos</span>
          </div>
        </button>

        {/* Em Produção */}
        <button
          onClick={() => setStatusFilter(statusFilter === 'EM_PRODUCAO' ? 'ALL' : 'EM_PRODUCAO')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            statusFilter === 'EM_PRODUCAO'
              ? 'bg-blue-50/90 dark:bg-blue-950/50 border-blue-300 dark:border-blue-800 ring-2 ring-blue-500/20'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-blue-700 dark:text-blue-400 text-xs font-bold">
            <span>Em Produção</span>
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.inProgress}</span>
            <span className="text-xs text-slate-400">estampando</span>
          </div>
        </button>

        {/* Pronto */}
        <button
          onClick={() => setStatusFilter(statusFilter === 'PRONTO' ? 'ALL' : 'PRONTO')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            statusFilter === 'PRONTO'
              ? 'bg-emerald-50/90 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 ring-2 ring-emerald-500/20'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-xs font-bold">
            <span>Pronto p/ Retirada</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.ready}</span>
            <span className="text-xs text-emerald-600 font-semibold">Avisar cliente</span>
          </div>
        </button>

        {/* Entregue */}
        <button
          onClick={() => setStatusFilter(statusFilter === 'ENTREGUE' ? 'ALL' : 'ENTREGUE')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            statusFilter === 'ENTREGUE'
              ? 'bg-slate-100 dark:bg-slate-750 border-slate-400 dark:border-slate-600 ring-2 ring-slate-400/20'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 text-xs font-bold">
            <span>Entregues</span>
            <Check className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.completed}</span>
            <span className="text-xs text-slate-400">concluídos</span>
          </div>
        </button>
      </div>

      {/* Barra de Busca e Alternador de Modo */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-850 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-2xs">
        {/* Campo de Busca */}
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, produto, arte ou código..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Alternador Kanban / Lista */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {statusFilter !== 'ALL' && (
            <button
              onClick={() => setStatusFilter('ALL')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline px-2"
            >
              Limpar Filtro ({statusFilter})
            </button>
          )}

          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              id="btn-view-kanban"
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Quadro (Kanban)
            </button>
            <button
              id="btn-view-table"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Lista Simples
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Nenhum pedido personalizado encontrado
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-5">
            {searchTerm || statusFilter !== 'ALL'
              ? 'Nenhum pedido encontrado para a busca atual. Tente limpar os filtros.'
              : 'Cadastre seus pedidos de canecas, camisetas, brindes e personalizados de forma rápida.'}
          </p>
          <button
            onClick={handleOpenNewOrder}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Adicionar Pedido Personalizado
          </button>
        </div>
      ) : viewMode === 'kanban' ? (
        /* KANBAN SIMPLES */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {KANBAN_STAGES.map((stageKey) => {
            const config = STATUS_CONFIG[stageKey];
            const Icon = config.icon;
            const stageOrders = filteredOrders.filter((o) => o.status === stageKey);

            return (
              <div
                key={stageKey}
                className="flex flex-col bg-slate-100/80 dark:bg-slate-850/60 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800 min-h-[420px]"
              >
                {/* Cabeçalho da Coluna */}
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200 dark:border-slate-700/70">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${config.bg} ${config.text}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {config.label}
                    </span>
                  </div>
                  <span className="text-xs font-black px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {stageOrders.length}
                  </span>
                </div>

                {/* Lista de Cards */}
                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[700px] pr-0.5">
                  {stageOrders.map((order) => {
                    const prodName = order.productName || order.title;

                    return (
                      <div
                        key={order.id}
                        className="bg-white dark:bg-slate-800 rounded-xl p-3.5 border border-slate-200/90 dark:border-slate-700/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div>
                          {/* Nome do Cliente + Código */}
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                              <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[140px]">
                                {order.customerName || 'Cliente'}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 font-semibold">
                              {order.code}
                            </span>
                          </div>

                          {/* Produto e Quantidade em Destaque */}
                          <div className="bg-slate-50 dark:bg-slate-900/70 rounded-lg p-2 mb-2 border border-slate-100 dark:border-slate-800">
                            <div className="flex items-start justify-between gap-1">
                              <span className="text-xs font-black text-slate-800 dark:text-slate-200 leading-snug">
                                {prodName}
                              </span>
                              <span className="shrink-0 text-xs font-black bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md">
                                {order.quantity || 1} un
                              </span>
                            </div>

                            {/* Detalhes da Arte / Tema */}
                            {order.customDetails && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 italic">
                                "{order.customDetails}"
                              </p>
                            )}
                          </div>

                          {/* Prazo & Valor */}
                          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                            {order.deadlineDate ? (
                              <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(order.deadlineDate)}
                              </span>
                            ) : (
                              <span>Sem prazo</span>
                            )}

                            {order.totalValue > 0 && (
                              <span className="font-bold text-slate-900 dark:text-white">
                                {formatCurrency(order.totalValue)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Ações do Card */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/80 space-y-1.5">
                          {/* Botão de Avanço Rápido */}
                          {config.next && (
                            <button
                              onClick={() => handleAdvanceStatus(order)}
                              className="w-full py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                            >
                              <Zap className="w-3.5 h-3.5" />
                              <span>{config.nextActionLabel || 'Avançar'}</span>
                            </button>
                          )}

                          {/* Botões Secundários */}
                          <div className="flex items-center justify-between text-slate-400 pt-0.5">
                            <div className="flex items-center gap-1">
                              {order.customerPhone && (
                                <button
                                  onClick={() => handleSendWhatsApp(order)}
                                  className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-md"
                                  title="Avisar cliente no WhatsApp"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => setPrintOrder(order)}
                                className="p-1 hover:text-slate-700 dark:hover:text-slate-200 rounded-md"
                                title="Imprimir Comprovante / Ficha"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setViewDetailsOrder(order)}
                                className="p-1 hover:text-slate-700 dark:hover:text-slate-200 rounded-md"
                                title="Ver Detalhes"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEditOrder(order)}
                                className="p-1 hover:text-indigo-600 rounded-md"
                                title="Editar Pedido"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={async () => {
                                  if (confirm(`Excluir o pedido ${order.code} de ${order.customerName}?`)) {
                                    await deleteProductionOrder(order.id);
                                  }
                                }}
                                className="p-1 hover:text-rose-600 rounded-md"
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABELA / LISTA SIMPLES */
        <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Nome do Cliente</th>
                  <th className="py-3 px-4">Produto</th>
                  <th className="py-3 px-4 text-center">Quantidade</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Prazo</th>
                  <th className="py-3 px-4 text-right">Valor Total</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOrders.map((order) => {
                  const statusCfg = STATUS_CONFIG[order.status];
                  const prodName = order.productName || order.title;

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Código */}
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {order.code}
                      </td>

                      {/* Nome do Cliente */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {order.customerName || 'Cliente Não Informado'}
                        </div>
                        {order.customerPhone && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {order.customerPhone}
                          </div>
                        )}
                      </td>

                      {/* Produto & Arte */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {prodName}
                        </div>
                        {order.customDetails && (
                          <div className="text-[11px] text-slate-500 italic max-w-xs truncate">
                            {order.customDetails}
                          </div>
                        )}
                      </td>

                      {/* Quantidade */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block font-black text-xs bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                          {order.quantity || 1} un
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                        >
                          <statusCfg.icon className="w-3 h-3" />
                          {statusCfg.label}
                        </span>
                      </td>

                      {/* Prazo */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {order.deadlineDate ? formatDate(order.deadlineDate) : '—'}
                      </td>

                      {/* Valor Total */}
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                        {order.totalValue > 0 ? formatCurrency(order.totalValue) : '—'}
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {statusCfg.next && (
                            <button
                              onClick={() => handleAdvanceStatus(order)}
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 rounded-md font-bold text-[11px]"
                              title={statusCfg.nextActionLabel}
                            >
                              Avançar
                            </button>
                          )}
                          {order.customerPhone && (
                            <button
                              onClick={() => handleSendWhatsApp(order)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md"
                              title="WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setPrintOrder(order)}
                            className="p-1 text-slate-500 hover:text-slate-800 rounded-md"
                            title="Imprimir"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditOrder(order)}
                            className="p-1 text-slate-500 hover:text-indigo-600 rounded-md"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`Excluir ${order.code}?`)) {
                                await deleteProductionOrder(order.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: NOVO / EDITAR PEDIDO PERSONALIZADO (SIMPLES E DIRETO) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-850 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingOrder ? 'Editar Pedido Personalizado' : 'Novo Pedido Personalizado'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Preencha os dados do pedido com facilidade.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitOrder} className="space-y-4">
              {/* 1. NOME DO CLIENTE */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  1. Nome do Cliente *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ex: Maria Eduarda"
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                  {/* Seleção rápida de cliente já cadastrado */}
                  {customers.length > 0 && (
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => handleCustomerSelect(e.target.value)}
                      className="max-w-[140px] px-2 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600"
                    >
                      <option value="">Buscar CRM</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* WhatsApp do Cliente */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  WhatsApp / Telefone (para avisar quando ficar pronto)
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Ex: (11) 99999-8888"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* 2. PRODUTO */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    2. Produto Personalizado *
                  </label>
                  {products.length > 0 && (
                    <span className="text-[11px] text-indigo-600 dark:text-indigo-400">
                      ou escolha do estoque
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Ex: Caneca Mágica Preta, Camiseta Branca M..."
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                  {products.length > 0 && (
                    <select
                      value={selectedCatalogProductId}
                      onChange={(e) => handleProductSelect(e.target.value)}
                      className="max-w-[140px] px-2 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600"
                    >
                      <option value="">Catálogo</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Sugestões Rápidas de Produtos */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {QUICK_PRODUCTS.slice(0, 5).map((quick) => (
                    <button
                      key={quick}
                      type="button"
                      onClick={() => setProductName(quick)}
                      className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                    >
                      + {quick}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. QUANTIDADE & VALOR TOTAL */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    3. Quantidade *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Valor Total (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={totalValue || ''}
                    onChange={(e) => setTotalValue(parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-emerald-600 dark:text-emerald-400"
                  />
                </div>
              </div>

              {/* 4. STATUS DO PEDIDO */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  4. Status Atual *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['PENDENTE', 'EM_PRODUCAO', 'PRONTO', 'ENTREGUE'] as ProductionStatus[]).map((st) => {
                    const cfg = STATUS_CONFIG[st];
                    const isSelected = status === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setStatus(st)}
                        className={`p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                          isSelected
                            ? `${cfg.bg} ${cfg.text} ${cfg.border} ring-2 ring-indigo-500/20`
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <cfg.icon className="w-3.5 h-3.5" />
                        <span>{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Detalhes da Personalização (Arte, Nome, Tema, Foto) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Detalhes da Arte / Estampa / Tema (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={customDetails}
                  onChange={(e) => setCustomDetails(e.target.value)}
                  placeholder="Ex: Nome na caneca: Sophia | Tema: Jardim Encantado | Cor do laço: Rosa bebê"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Prazo de Entrega */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Prazo de Entrega / Data Prometida
                </label>
                <input
                  type="date"
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm"
                >
                  {editingOrder ? 'Salvar Alterações' : 'Criar Pedido'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VER DETALHES DO PEDIDO */}
      {viewDetailsOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-850 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-700">
              <span className="font-mono font-bold text-indigo-600 text-sm">
                {viewDetailsOrder.code}
              </span>
              <button
                onClick={() => setViewDetailsOrder(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block">Cliente</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {viewDetailsOrder.customerName || 'Cliente Não Informado'}
                </span>
                {viewDetailsOrder.customerPhone && (
                  <span className="text-slate-500 block">{viewDetailsOrder.customerPhone}</span>
                )}
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <span className="text-slate-400 block text-[11px]">Produto & Quantidade</span>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {viewDetailsOrder.quantity}x {viewDetailsOrder.productName || viewDetailsOrder.title}
                </div>
                {viewDetailsOrder.customDetails && (
                  <div className="mt-2 text-slate-600 dark:text-slate-300 italic bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                    "{viewDetailsOrder.customDetails}"
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block">Status Atual</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {STATUS_CONFIG[viewDetailsOrder.status].label}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Prazo de Entrega</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {viewDetailsOrder.deadlineDate ? formatDate(viewDetailsOrder.deadlineDate) : 'Sem prazo'}
                  </span>
                </div>
              </div>

              {viewDetailsOrder.totalValue > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-between font-bold text-sm">
                  <span>Valor Total:</span>
                  <span className="text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(viewDetailsOrder.totalValue)}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-5 flex gap-2">
              {viewDetailsOrder.customerPhone && (
                <button
                  onClick={() => handleSendWhatsApp(viewDetailsOrder)}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 text-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </button>
              )}
              <button
                onClick={() => {
                  setPrintOrder(viewDetailsOrder);
                  setViewDetailsOrder(null);
                }}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 text-xs"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE IMPRESSÃO / FICHA DE PRODUÇÃO */}
      {printOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-850 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b">
              <h3 className="font-bold text-sm text-slate-800">Ficha do Pedido Personalizado</h3>
              <button onClick={() => setPrintOrder(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Documento Imprimível */}
            <div id="printable-order" className="p-4 bg-white text-black border border-slate-200 rounded-xl space-y-4 text-xs font-sans">
              {/* Topo com Logo */}
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h4 className="font-black text-base uppercase">{company.tradeName || company.corporateName || 'Loja de Personalizados'}</h4>
                  <p className="text-[11px] text-slate-600">{company.phone || ''} {company.city ? `• ${company.city}` : ''}</p>
                </div>
                <div className="text-right font-mono">
                  <div className="text-sm font-black text-indigo-700">{printOrder.code}</div>
                  <div className="text-[10px] text-slate-500">{formatDate(printOrder.createdAt, true)}</div>
                </div>
              </div>

              {/* Cliente */}
              <div className="bg-slate-50 p-2.5 rounded-lg">
                <span className="font-bold block text-[11px] text-slate-500 uppercase">Dados do Cliente</span>
                <div className="text-sm font-bold text-slate-900 mt-0.5">{printOrder.customerName || 'Cliente Balcão'}</div>
                {printOrder.customerPhone && <div className="text-slate-600 text-xs">WhatsApp: {printOrder.customerPhone}</div>}
              </div>

              {/* Produto & Quantidade */}
              <div className="border border-slate-200 rounded-lg p-3">
                <span className="font-bold block text-[11px] text-slate-500 uppercase">Item a Produzir</span>
                <div className="flex justify-between items-baseline mt-1">
                  <span className="text-sm font-black text-slate-900">{printOrder.productName || printOrder.title}</span>
                  <span className="text-sm font-black bg-slate-100 px-2 py-0.5 rounded">QTD: {printOrder.quantity} un</span>
                </div>

                {printOrder.customDetails && (
                  <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-800">
                    <span className="font-bold block text-[10px] text-slate-500 uppercase">Arte / Tema / Personalização:</span>
                    <p className="mt-0.5 font-medium whitespace-pre-wrap">{printOrder.customDetails}</p>
                  </div>
                )}
              </div>

              {/* Prazo e Valor */}
              <div className="flex justify-between items-center text-xs bg-slate-50 p-2 rounded-lg">
                <div>
                  <span className="text-slate-500">Prazo de Entrega: </span>
                  <span className="font-bold">{printOrder.deadlineDate ? formatDate(printOrder.deadlineDate) : 'A combinar'}</span>
                </div>
                {printOrder.totalValue > 0 && (
                  <div>
                    <span className="text-slate-500">Valor Total: </span>
                    <span className="font-black text-sm">{formatCurrency(printOrder.totalValue)}</span>
                  </div>
                )}
              </div>

              {/* Assinatura */}
              <div className="pt-6 grid grid-cols-2 gap-4 text-center text-[10px] text-slate-500">
                <div className="border-t border-slate-300 pt-1">Assinatura da Loja</div>
                <div className="border-t border-slate-300 pt-1">Assinatura do Cliente</div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setPrintOrder(null)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
              >
                Fechar
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Imprimir Agora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
