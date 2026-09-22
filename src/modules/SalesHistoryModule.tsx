import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  Ban,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Hammer,
  Layers,
  Plus,
  PlusCircle,
  Printer,
  Receipt,
  Search,
  ShoppingCart,
  Tag,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  FinancialTransaction,
  PaymentMethod,
  Sale,
  TransactionStatus,
  TransactionType,
} from '../types';
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_PAYMENT_METHODS,
} from '../data/initialData';
import { downloadFile, formatCurrency, formatDate } from '../utils/formatters';

type UnifiedTab = 'all' | 'sales' | 'expenses' | 'incomes';

export const SalesHistoryModule: React.FC = () => {
  const {
    sales,
    cancelSale,
    setReceiptSale,
    startProductionFromSale,
    currentUser,
    company,
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useApp();

  // Tab state
  const [activeTab, setActiveTab] = useState<UnifiedTab>('all');

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals state
  const [selectedSaleDetail, setSelectedSaleDetail] = useState<Sale | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [saleToCancel, setSaleToCancel] = useState<Sale | null>(null);
  const [cancelReason, setCancelReason] = useState('Desistência do cliente');

  // New Expense/Income Transaction Modal
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txFormType, setTxFormType] = useState<TransactionType>('EXPENSE');
  const [txFormDescription, setTxFormDescription] = useState('');
  const [txFormAmount, setTxFormAmount] = useState<number>(0);
  const [txFormCategory, setTxFormCategory] = useState('Despesas da Loja');
  const [txFormDate, setTxFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [txFormDueDate, setTxFormDueDate] = useState('');
  const [txFormPaymentMethod, setTxFormPaymentMethod] = useState<PaymentMethod>('PIX');
  const [txFormStatus, setTxFormStatus] = useState<TransactionStatus>('PAID');
  const [txFormNotes, setTxFormNotes] = useState('');

  const EXPENSE_CATEGORIES = company.expenseCategories || DEFAULT_EXPENSE_CATEGORIES;
  const INCOME_CATEGORIES = company.incomeCategories || DEFAULT_INCOME_CATEGORIES;
  const PAYMENT_METHODS = (company.paymentMethods || DEFAULT_PAYMENT_METHODS).filter((pm) => pm.active);

  // --- Calculate Metrics ---
  const completedSales = sales.filter((s) => s.status === 'COMPLETED');
  const totalSalesRevenue = completedSales.reduce((acc, s) => acc + s.total, 0);
  const totalSalesProfit = completedSales.reduce((acc, s) => acc + s.profit, 0);

  const paidExpenses = transactions.filter((t) => t.type === 'EXPENSE' && t.status === 'PAID');
  const totalExpensesAmount = paidExpenses.reduce((acc, t) => acc + t.amount, 0);

  const pendingExpenses = transactions.filter((t) => t.type === 'EXPENSE' && t.status === 'PENDING');
  const totalPendingExpensesAmount = pendingExpenses.reduce((acc, t) => acc + t.amount, 0);

  const paidOtherIncomes = transactions.filter(
    (t) => t.type === 'INCOME' && t.status === 'PAID' && !t.relatedSaleId
  );
  const totalOtherIncomesAmount = paidOtherIncomes.reduce((acc, t) => acc + t.amount, 0);

  // Consolidated Net Balance = Total Vendas + Outras Entradas - Total Despesas
  const consolidatedNetBalance = totalSalesRevenue + totalOtherIncomesAmount - totalExpensesAmount;

  // --- Map and Unify Rows ---
  interface UnifiedRow {
    id: string;
    originType: 'SALE' | 'EXPENSE' | 'INCOME';
    codeOrId: string;
    description: string;
    categoryOrCustomer: string;
    date: string;
    paymentMethod: string;
    amount: number;
    profitOrCost?: number;
    status: string;
    isSale: boolean;
    rawSale?: Sale;
    rawTransaction?: FinancialTransaction;
  }

  const salesRows: UnifiedRow[] = sales.map((s) => ({
    id: s.id,
    originType: 'SALE',
    codeOrId: s.code,
    description: `Venda ${s.code} (${s.items?.length || 0} ${s.items?.length === 1 ? 'item' : 'itens'})`,
    categoryOrCustomer: s.customerName || 'Consumidor Final',
    date: s.createdAt,
    paymentMethod: s.paymentMethod,
    amount: s.total,
    profitOrCost: s.profit,
    status: s.status,
    isSale: true,
    rawSale: s,
  }));

  const transactionRows: UnifiedRow[] = transactions.map((t) => ({
    id: t.id,
    originType: t.type,
    codeOrId: t.id.startsWith('tx_') ? t.id.slice(0, 10).toUpperCase() : t.id.toUpperCase(),
    description: t.description,
    categoryOrCustomer: t.category,
    date: t.date || t.createdAt,
    paymentMethod: t.paymentMethod,
    amount: t.amount,
    status: t.status,
    isSale: false,
    rawTransaction: t,
  }));

  // Combine and sort by date descending
  const allUnifiedRows: UnifiedRow[] = [...salesRows, ...transactionRows].sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  // Filter based on active tab and search criteria
  const filteredRows = allUnifiedRows.filter((row) => {
    // 1. Tab filter
    if (activeTab === 'sales' && row.originType !== 'SALE') return false;
    if (activeTab === 'expenses' && row.originType !== 'EXPENSE') return false;
    if (activeTab === 'incomes' && row.originType !== 'INCOME' && row.originType !== 'SALE') return false;

    // 2. Search filter
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      row.codeOrId.toLowerCase().includes(q) ||
      row.description.toLowerCase().includes(q) ||
      row.categoryOrCustomer.toLowerCase().includes(q) ||
      (row.rawSale?.sellerName && row.rawSale.sellerName.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    // 3. Payment Method filter
    if (methodFilter !== 'ALL' && row.paymentMethod !== methodFilter) return false;

    // 4. Status filter
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'COMPLETED_OR_PAID') {
        if (row.status !== 'COMPLETED' && row.status !== 'PAID') return false;
      } else if (statusFilter === 'PENDING') {
        if (row.status !== 'PENDING') return false;
      } else if (statusFilter === 'CANCELLED') {
        if (row.status !== 'CANCELLED') return false;
      }
    }

    return true;
  });

  // Export CSV
  const handleExportCSV = () => {
    const headers = 'Tipo,Codigo,Descricao,Categoria_Cliente,Data,Pagamento,Valor,Lucro,Status\n';
    const rows = filteredRows
      .map((r) => {
        const typeLabel =
          r.originType === 'SALE' ? 'Venda (Entrada)' : r.originType === 'INCOME' ? 'Outra Entrada' : 'Despesa (Saída)';
        const amountSign = r.originType === 'EXPENSE' ? -r.amount : r.amount;
        return `"${typeLabel}","${r.codeOrId}","${r.description.replace(/"/g, '""')}","${r.categoryOrCustomer}","${formatDate(
          r.date,
          true
        )}","${r.paymentMethod}",${amountSign},${r.profitOrCost ?? ''},"${r.status}"`;
      })
      .join('\n');

    downloadFile(
      headers + rows,
      `extrato_vendas_despesas_${new Date().toISOString().slice(0, 10)}.csv`,
      'text/csv'
    );
  };

  // Sale cancel handlers
  const handleOpenCancel = (sale: Sale) => {
    setSaleToCancel(sale);
    setCancelReason('Desistência do cliente');
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleToCancel) return;
    await cancelSale(saleToCancel.id, cancelReason);
    setIsCancelModalOpen(false);
    setSaleToCancel(null);
  };

  // New Transaction Handlers
  const handleOpenNewTx = (type: TransactionType) => {
    setTxFormType(type);
    setTxFormDescription('');
    setTxFormAmount(0);
    setTxFormCategory(type === 'INCOME' ? 'Vendas de Produtos / Mercadorias' : 'Despesas da Loja / Operacionais');
    setTxFormDate(new Date().toISOString().slice(0, 10));
    setTxFormDueDate('');
    setTxFormPaymentMethod('PIX');
    setTxFormStatus('PAID');
    setTxFormNotes('');
    setIsTxModalOpen(true);
  };

  const handleSaveTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txFormDescription.trim() || txFormAmount <= 0) {
      alert('Preencha a descrição e um valor numérico válido.');
      return;
    }

    await addTransaction({
      type: txFormType,
      description: txFormDescription.trim(),
      amount: Number(txFormAmount),
      category: txFormCategory,
      date: txFormDate,
      dueDate: txFormDueDate || undefined,
      paymentMethod: txFormPaymentMethod,
      status: txFormStatus,
      notes: txFormNotes,
    });

    setIsTxModalOpen(false);
  };

  const handleToggleTxStatus = async (tx: FinancialTransaction) => {
    const nextStatus = tx.status === 'PAID' ? 'PENDING' : 'PAID';
    await updateTransaction(tx.id, { status: nextStatus });
  };

  const handleDeleteTx = async (id: string, desc: string) => {
    if (confirm(`Deseja realmente excluir o lançamento "${desc}"?`)) {
      await deleteTransaction(id);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <span>Histórico de Vendas & Despesas</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Fluxo unificado de entradas (vendas e receitas) e saídas operacionais (despesas, contas e custos).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {currentUser.role !== 'VENDEDOR' && (
            <>
              <button
                type="button"
                onClick={() => handleOpenNewTx('EXPENSE')}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 active:scale-98 transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Nova Despesa (Saída)</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenNewTx('INCOME')}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 active:scale-98 transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Nova Receita (Entrada)</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Entradas / Vendas */}
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Vendas Concluídas ({completedSales.length})
            </span>
            <span className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 p-1.5 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100 font-mono">
            {formatCurrency(totalSalesRevenue)}
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            Lucro Bruto: {formatCurrency(totalSalesProfit)}
          </div>
        </div>

        {/* Despesas Pagas */}
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Despesas Realizadas ({paidExpenses.length})
            </span>
            <span className="rounded-lg bg-rose-50 dark:bg-rose-950/40 p-1.5 text-rose-600 dark:text-rose-400">
              <TrendingDown className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-lg font-bold text-rose-600 dark:text-rose-400 font-mono">
            - {formatCurrency(totalExpensesAmount)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {pendingExpenses.length > 0
              ? `${pendingExpenses.length} pendentes (${formatCurrency(totalPendingExpensesAmount)})`
              : 'Sem despesas pendentes'}
          </div>
        </div>

        {/* Outras Entradas */}
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Outras Entradas / Receitas
            </span>
            <span className="rounded-lg bg-indigo-50 dark:bg-indigo-950/40 p-1.5 text-indigo-600 dark:text-indigo-400">
              <ArrowUpCircle className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-lg font-bold text-indigo-600 dark:text-indigo-400 font-mono">
            + {formatCurrency(totalOtherIncomesAmount)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {paidOtherIncomes.length} outros lançamentos
          </div>
        </div>

        {/* Saldo Líquido Consolidado */}
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Resultado Líquido do Caixa
            </span>
            <span
              className={`rounded-lg p-1.5 ${
                consolidatedNetBalance >= 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
              }`}
            >
              <DollarSign className="h-4 w-4" />
            </span>
          </div>
          <div
            className={`mt-2 text-lg font-bold font-mono ${
              consolidatedNetBalance >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatCurrency(consolidatedNetBalance)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Total Entradas - Despesas pagas
          </div>
        </div>
      </div>

      {/* Tabs Filter (Todas, Somente Vendas, Somente Despesas, Somente Receitas) */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-1 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-1.5 rounded-t-lg border-b-2 px-3.5 py-2 font-semibold transition-all ${
            activeTab === 'all'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Tudo Unificado ({allUnifiedRows.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sales')}
          className={`flex items-center gap-1.5 rounded-t-lg border-b-2 px-3.5 py-2 font-semibold transition-all ${
            activeTab === 'sales'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Receipt className="h-3.5 w-3.5" />
          <span>Vendas Realizadas ({sales.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-1.5 rounded-t-lg border-b-2 px-3.5 py-2 font-semibold transition-all ${
            activeTab === 'expenses'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <ArrowDownCircle className="h-3.5 w-3.5 text-rose-500" />
          <span>Despesas & Saídas ({transactions.filter((t) => t.type === 'EXPENSE').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('incomes')}
          className={`flex items-center gap-1.5 rounded-t-lg border-b-2 px-3.5 py-2 font-semibold transition-all ${
            activeTab === 'incomes'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <ArrowUpCircle className="h-3.5 w-3.5 text-emerald-500" />
          <span>Todas as Entradas ({sales.length + transactions.filter((t) => t.type === 'INCOME').length})</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código, descrição, cliente ou categoria..."
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-1.5 pl-9 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500"
          >
            <option value="ALL">Todos os Meios de Pagamento</option>
            {PAYMENT_METHODS.map((pm) => (
              <option key={pm.id} value={pm.code}>
                {pm.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500"
          >
            <option value="ALL">Todos os Status</option>
            <option value="COMPLETED_OR_PAID">Concluídos / Pagos</option>
            <option value="PENDING">Pendentes (A Pagar / Receber)</option>
            <option value="CANCELLED">Cancelados</option>
          </select>
        </div>
      </div>

      {/* Unified Table */}
      <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2.5">Tipo</th>
                <th className="px-4 py-2.5">Código / ID</th>
                <th className="px-4 py-2.5">Data</th>
                <th className="px-4 py-2.5">Descrição / Cliente / Categoria</th>
                <th className="px-4 py-2.5">Pagamento</th>
                <th className="px-4 py-2.5 text-right">Valor</th>
                <th className="px-4 py-2.5 text-center">Status</th>
                <th className="px-4 py-2.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Nenhum registro encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const isExpense = row.originType === 'EXPENSE';
                  const isIncome = row.originType === 'INCOME';
                  const isSale = row.originType === 'SALE';

                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Tipo badge */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isSale ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <ShoppingCart className="h-3 w-3" />
                            <span>Venda</span>
                          </span>
                        ) : isIncome ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                            <ArrowUpCircle className="h-3 w-3" />
                            <span>Receita</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                            <ArrowDownCircle className="h-3 w-3" />
                            <span>Despesa</span>
                          </span>
                        )}
                      </td>

                      {/* Código */}
                      <td className="px-4 py-3 font-mono font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {row.codeOrId}
                      </td>

                      {/* Data */}
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {formatDate(row.date, true)}
                      </td>

                      {/* Descrição / Categoria */}
                      <td className="px-4 py-3 max-w-[260px]">
                        <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
                          {row.description}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {isSale ? (
                            <span>Cliente: {row.categoryOrCustomer}</span>
                          ) : (
                            <span>Categoria: {row.categoryOrCustomer}</span>
                          )}
                        </div>
                      </td>

                      {/* Pagamento */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-medium text-slate-700 dark:text-slate-300 text-[10px] border border-slate-200/60 dark:border-slate-700">
                          {row.paymentMethod}
                          {row.rawSale?.installments && row.rawSale.installments > 1
                            ? ` (${row.rawSale.installments}x)`
                            : ''}
                        </span>
                      </td>

                      {/* Valor */}
                      <td className="px-4 py-3 text-right font-mono font-bold whitespace-nowrap">
                        <span
                          className={
                            isExpense
                              ? 'text-rose-600 dark:text-rose-400'
                              : isIncome
                              ? 'text-indigo-600 dark:text-indigo-400'
                              : 'text-slate-900 dark:text-slate-100'
                          }
                        >
                          {isExpense ? '-' : '+'} {formatCurrency(row.amount)}
                        </span>
                        {isSale && row.profitOrCost !== undefined && row.status === 'COMPLETED' && (
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                            Lucro: {formatCurrency(row.profitOrCost)}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {row.status === 'COMPLETED' || row.status === 'PAID' ? (
                          <span className="inline-block rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            {isSale ? 'Concluída' : 'Pago'}
                          </span>
                        ) : row.status === 'PENDING' ? (
                          <span className="inline-block rounded-full bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                            Pendente
                          </span>
                        ) : (
                          <span className="inline-block rounded-full bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 text-[10px] font-medium text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 line-through">
                            Cancelada
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {isSale && row.rawSale && (
                            <>
                              <button
                                type="button"
                                onClick={() => startProductionFromSale(row.rawSale!)}
                                className="rounded-md border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 p-1 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-colors"
                                title="Gerar Ordem de Produção / Enviar para Fabricação"
                              >
                                <Hammer className="h-3.5 w-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setSelectedSaleDetail(row.rawSale!)}
                                className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                title="Ver Detalhes dos Itens da Venda"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setReceiptSale(row.rawSale!)}
                                className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                title="Reimprimir Comprovante Não Fiscal"
                              >
                                <Printer className="h-3.5 w-3.5" />
                              </button>

                              {row.rawSale.status === 'COMPLETED' && currentUser.role !== 'VENDEDOR' && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenCancel(row.rawSale!)}
                                  className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 transition-colors"
                                  title="Cancelar Venda & Estornar Estoque"
                                >
                                  <Ban className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </>
                          )}

                          {!isSale && row.rawTransaction && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleToggleTxStatus(row.rawTransaction!)}
                                className={`rounded-md border p-1 transition-colors ${
                                  row.rawTransaction.status === 'PAID'
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                }`}
                                title={
                                  row.rawTransaction.status === 'PAID'
                                    ? 'Marcar como Pendente'
                                    : 'Marcar como Pago'
                                }
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>

                              {currentUser.role !== 'VENDEDOR' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteTx(row.rawTransaction!.id, row.rawTransaction!.description)
                                  }
                                  className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 transition-colors"
                                  title="Excluir Lançamento"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Detail Modal */}
      {selectedSaleDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Detalhes da Venda {selectedSaleDetail.code}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  {formatDate(selectedSaleDetail.createdAt, true)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSaleDetail(null)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2.5 border border-slate-200/80 dark:border-slate-700 text-xs grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Cliente:</span>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {selectedSaleDetail.customerName}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Atendente:</span>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {selectedSaleDetail.sellerName}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Forma de Pagamento:</span>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {selectedSaleDetail.paymentMethod}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Status:</span>
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {selectedSaleDetail.status}
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
                <div className="bg-slate-50 dark:bg-slate-800 px-3 py-1.5 font-medium text-slate-600 dark:text-slate-300 flex justify-between border-b border-slate-100 dark:border-slate-700">
                  <span>Itens Vendidos</span>
                  <span>Subtotal</span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto">
                  {(selectedSaleDetail.items || []).map((item, idx) => (
                    <div key={idx} className="p-2.5 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {item.quantity} {item.unit} x {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                      <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-1 text-xs border-t border-slate-100 dark:border-slate-800 pt-2">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-mono">{formatCurrency(selectedSaleDetail.subtotal)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Desconto:</span>
                  <span className="font-mono">- {formatCurrency(selectedSaleDetail.discount)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-slate-100 pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span>TOTAL:</span>
                  <span className="font-mono">{formatCurrency(selectedSaleDetail.total)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => {
                  setReceiptSale(selectedSaleDetail);
                  setSelectedSaleDetail(null);
                }}
                className="flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Imprimir Recibo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Sale Modal */}
      {isCancelModalOpen && saleToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-rose-600 dark:text-rose-400 text-sm flex items-center gap-1.5">
                <Ban className="h-4 w-4" />
                Cancelar Venda {saleToCancel.code}
              </h3>
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmCancel} className="mt-3 space-y-3">
              <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 p-2.5 text-xs text-rose-900 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                <p className="font-semibold">Atenção:</p>
                <p className="mt-0.5 leading-relaxed">
                  Ao cancelar esta venda de{' '}
                  <span className="font-bold">{formatCurrency(saleToCancel.total)}</span>, todas as
                  quantidades dos produtos vendidos serão devolvidas automaticamente ao estoque.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Motivo do Cancelamento *
                </label>
                <input
                  type="text"
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Ex: Desistência do cliente / Erro na digitação"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 active:scale-98 transition-all"
                >
                  Confirmar Cancelamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Transaction (Expense or Income) Modal */}
      {isTxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    txFormType === 'EXPENSE'
                      ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600'
                      : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600'
                  }`}
                >
                  {txFormType === 'EXPENSE' ? (
                    <ArrowDownCircle className="h-4 w-4" />
                  ) : (
                    <ArrowUpCircle className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {txFormType === 'EXPENSE' ? 'Lançar Nova Despesa (Saída)' : 'Lançar Nova Receita (Entrada)'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Registro financeiro no fluxo de caixa da empresa
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTxModalOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTx} className="mt-4 space-y-3">
              {/* Type toggle */}
              <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setTxFormType('EXPENSE');
                    setTxFormCategory(EXPENSE_CATEGORIES[0] || 'Despesas da Loja');
                  }}
                  className={`flex-1 rounded-md py-1 text-xs font-semibold transition-all ${
                    txFormType === 'EXPENSE'
                      ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Despesa (Saída)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTxFormType('INCOME');
                    setTxFormCategory(INCOME_CATEGORIES[0] || 'Vendas de Produtos');
                  }}
                  className={`flex-1 rounded-md py-1 text-xs font-semibold transition-all ${
                    txFormType === 'INCOME'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Receita (Entrada)
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Descrição do Lançamento *
                </label>
                <input
                  type="text"
                  required
                  value={txFormDescription}
                  onChange={(e) => setTxFormDescription(e.target.value)}
                  placeholder={
                    txFormType === 'EXPENSE'
                      ? 'Ex: Aluguel do mês, Fornecedor de Embalagens...'
                      : 'Ex: Prestação de serviço, Consultoria, Rendimento...'
                  }
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={txFormAmount || ''}
                    onChange={(e) => setTxFormAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-mono font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={txFormCategory}
                    onChange={(e) => setTxFormCategory(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {(txFormType === 'EXPENSE' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Data do Registro
                  </label>
                  <input
                    type="date"
                    value={txFormDate}
                    onChange={(e) => setTxFormDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Meio de Pagamento
                  </label>
                  <select
                    value={txFormPaymentMethod}
                    onChange={(e) => setTxFormPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm.id} value={pm.code}>
                        {pm.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status do Lançamento
                  </label>
                  <select
                    value={txFormStatus}
                    onChange={(e) => setTxFormStatus(e.target.value as TransactionStatus)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="PAID">Liquidado / Pago (Efetivado)</option>
                    <option value="PENDING">Pendente / Agendado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vencimento (Opcional)
                  </label>
                  <input
                    type="date"
                    value={txFormDueDate}
                    onChange={(e) => setTxFormDueDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Observações adicionais (opcional)
                </label>
                <input
                  type="text"
                  value={txFormNotes}
                  onChange={(e) => setTxFormNotes(e.target.value)}
                  placeholder="Número de nota fiscal, fornecedor, detalhes..."
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setIsTxModalOpen(false)}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`rounded-lg px-4 py-1.5 text-xs font-semibold text-white shadow-xs active:scale-98 transition-all ${
                    txFormType === 'EXPENSE'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
