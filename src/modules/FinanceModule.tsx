import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  FileSpreadsheet,
  Filter,
  Layers,
  Plus,
  PlusCircle,
  Search,
  Tag,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { FinancialTransaction, PaymentMethod, TransactionStatus, TransactionType } from '../types';
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_PAYMENT_METHODS,
} from '../data/initialData';
import { downloadFile, formatCurrency, formatDate } from '../utils/formatters';

export const FinanceModule: React.FC = () => {
  const {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    sales,
    currentUser,
    company,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');
  const [activeTab, setActiveTab] = useState<'transactions' | 'dre'>('transactions');

  // Form modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formType, setFormType] = useState<TransactionType>('EXPENSE');
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formCategory, setFormCategory] = useState('Despesas da Loja');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formDueDate, setFormDueDate] = useState('');
  const [formPaymentMethod, setFormPaymentMethod] = useState<PaymentMethod>('PIX');
  const [formStatus, setFormStatus] = useState<TransactionStatus>('PAID');
  const [formNotes, setFormNotes] = useState('');

  const EXPENSE_CATEGORIES = company.expenseCategories || DEFAULT_EXPENSE_CATEGORIES;
  const INCOME_CATEGORIES = company.incomeCategories || DEFAULT_INCOME_CATEGORIES;
  const PAYMENT_METHODS = (company.paymentMethods || DEFAULT_PAYMENT_METHODS).filter((pm) => pm.active);

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || t.type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  // KPI Calculations
  const totalPaidIncomes = transactions
    .filter((t) => t.type === 'INCOME' && t.status === 'PAID')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalPaidExpenses = transactions
    .filter((t) => t.type === 'EXPENSE' && t.status === 'PAID')
    .reduce((acc, t) => acc + t.amount, 0);

  const pendingExpenses = transactions
    .filter((t) => t.type === 'EXPENSE' && t.status === 'PENDING')
    .reduce((acc, t) => acc + t.amount, 0);

  const netBalance = totalPaidIncomes - totalPaidExpenses;

  // DRE Calculations
  const grossSalesRevenue = sales
    .filter((s) => s.status === 'COMPLETED')
    .reduce((acc, s) => acc + s.total, 0);

  const grossSalesCostCMV = sales
    .filter((s) => s.status === 'COMPLETED')
    .reduce((acc, s) => acc + s.costTotal, 0);

  const grossSalesMargin = grossSalesRevenue - grossSalesCostCMV;

  const totalOperatingExpenses = transactions
    .filter((t) => t.type === 'EXPENSE' && t.status === 'PAID')
    .reduce((acc, t) => acc + t.amount, 0);

  const otherOperatingIncomes = transactions
    .filter((t) => t.type === 'INCOME' && t.status === 'PAID' && !t.relatedSaleId)
    .reduce((acc, t) => acc + t.amount, 0);

  const dreFinalNetProfit = grossSalesMargin + otherOperatingIncomes - totalOperatingExpenses;

  const handleOpenForm = (type: TransactionType) => {
    setFormType(type);
    setFormDescription('');
    setFormAmount(0);
    setFormCategory(type === 'INCOME' ? 'Vendas de Produtos' : 'Despesas da Loja');
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormDueDate('');
    setFormPaymentMethod('PIX');
    setFormStatus('PAID');
    setFormNotes('');
    setIsFormOpen(true);
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDescription.trim() || formAmount <= 0) {
      alert('Preencha a descrição e um valor válido.');
      return;
    }

    addTransaction({
      type: formType,
      description: formDescription.trim(),
      amount: Number(formAmount),
      category: formCategory,
      date: formDate,
      dueDate: formDueDate || undefined,
      paymentMethod: formPaymentMethod,
      status: formStatus,
      notes: formNotes,
    });

    setIsFormOpen(false);
  };

  const toggleStatus = (t: FinancialTransaction) => {
    const nextStatus = t.status === 'PAID' ? 'PENDING' : 'PAID';
    updateTransaction(t.id, { status: nextStatus });
  };

  const handleExportCSV = () => {
    const headers = 'ID,Tipo,Descricao,Categoria,Valor,Data,FormaPagamento,Status\n';
    const rows = transactions
      .map(
        (t) =>
          `"${t.id}","${t.type}","${t.description}","${t.category}",${t.amount},"${t.date}","${t.paymentMethod}","${t.status}"`
      )
      .join('\n');

    downloadFile(headers + rows, `fluxo_caixa_dre_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Gestão Financeira & DRE Simplificada
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Controle de fluxo de caixa, contas a pagar/receber e apuração de lucro líquido real.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          <button
            id="btn-new-expense"
            onClick={() => handleOpenForm('EXPENSE')}
            className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100/80 active:scale-98 transition-all"
          >
            <ArrowDownCircle className="h-3.5 w-3.5" />
            <span>Nova Despesa</span>
          </button>

          <button
            id="btn-new-income"
            onClick={() => handleOpenForm('INCOME')}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 active:scale-98 transition-all"
          >
            <ArrowUpCircle className="h-3.5 w-3.5" />
            <span>Nova Receita</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-semibold transition-all ${
            activeTab === 'transactions'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Wallet className="h-3.5 w-3.5" />
          <span>Extrato de Lançamentos ({transactions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('dre')}
          className={`flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-semibold transition-all ${
            activeTab === 'dre'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileSpreadsheet className="h-3.5 w-3.5" />
          <span>Demonstrativo DRE do Mês</span>
        </button>
      </div>

      {activeTab === 'transactions' ? (
        <>
          {/* Summary Strip */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
              <span className="text-[11px] font-medium text-slate-500">Total de Receitas Pagas</span>
              <div className="mt-1 text-lg font-bold text-emerald-700 font-mono">
                {formatCurrency(totalPaidIncomes)}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
              <span className="text-[11px] font-medium text-slate-500">Total de Despesas Pagas</span>
              <div className="mt-1 text-lg font-bold text-rose-700 font-mono">
                {formatCurrency(totalPaidExpenses)}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
              <span className="text-[11px] font-medium text-slate-500">Saldo Líquido em Caixa</span>
              <div
                className={`mt-1 text-lg font-bold font-mono ${
                  netBalance >= 0 ? 'text-slate-900' : 'text-rose-700'
                }`}
              >
                {formatCurrency(netBalance)}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
              <span className="text-[11px] font-medium text-slate-500">Contas a Pagar (Pendentes)</span>
              <div className="mt-1 text-lg font-bold text-amber-700 font-mono">
                {formatCurrency(pendingExpenses)}
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col gap-2.5 rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por descrição, categoria ou fornecedor..."
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="ALL">Todas (Receitas & Despesas)</option>
                <option value="INCOME">Apenas Receitas (+)</option>
                <option value="EXPENSE">Apenas Despesas (-)</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="ALL">Todos os Status</option>
                <option value="PAID">Pago / Concluído</option>
                <option value="PENDING">Pendente / A Pagar</option>
              </select>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-2.5">Tipo</th>
                    <th className="px-4 py-2.5">Descrição</th>
                    <th className="px-4 py-2.5">Categoria</th>
                    <th className="px-4 py-2.5">Data Lançamento</th>
                    <th className="px-4 py-2.5">Pagamento</th>
                    <th className="px-4 py-2.5 text-right">Valor</th>
                    <th className="px-4 py-2.5 text-center">Status</th>
                    <th className="px-4 py-2.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Nenhum lançamento financeiro encontrado.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3">
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                              tx.type === 'INCOME'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {tx.type === 'INCOME' ? '+' : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900 max-w-[200px] truncate">
                          {tx.description}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700 text-[11px]">
                            {tx.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">{formatDate(tx.date)}</td>
                        <td className="px-4 py-3 text-slate-600 font-medium">{tx.paymentMethod}</td>
                        <td
                          className={`px-4 py-3 text-right font-mono font-semibold ${
                            tx.type === 'INCOME' ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {tx.type === 'INCOME' ? '+' : '-'} {formatCurrency(tx.amount)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => toggleStatus(tx)}
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-all ${
                              tx.status === 'PAID'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                            }`}
                            title="Clique para alternar Pago / Pendente"
                          >
                            {tx.status === 'PAID' ? 'Pago' : 'Pendente'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!tx.relatedSaleId && (
                            <button
                              onClick={() => {
                                if (confirm(`Deseja excluir "${tx.description}"?`)) {
                                  deleteTransaction(tx.id);
                                }
                              }}
                              className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                              title="Excluir Lançamento"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* DRE Structure View */
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs max-w-3xl mx-auto space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-slate-900">
              Demonstração do Resultado do Exercício (DRE)
            </h3>
            <p className="text-xs text-slate-500">
              Cálculo estruturado de receitas brutas, deduções, margem de contribuição e lucro líquido final.
            </p>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            {/* 1. Receita Bruta */}
            <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
              <span className="font-semibold text-slate-900">(+) RECEITA BRUTA DE VENDAS</span>
              <span className="font-bold text-emerald-700 text-sm">
                {formatCurrency(grossSalesRevenue)}
              </span>
            </div>

            {/* 2. Custo das Mercadorias */}
            <div className="flex justify-between items-center px-3 py-1.5 text-rose-700">
              <span className="pl-3">(-) Custo das Mercadorias Vendidas (CMV)</span>
              <span className="font-semibold">- {formatCurrency(grossSalesCostCMV)}</span>
            </div>

            {/* 3. Margem Bruta */}
            <div className="flex justify-between items-center bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200 text-emerald-950 font-semibold">
              <span>(=) LUCRO BRUTO OPERACIONAL (Margem)</span>
              <span className="text-sm font-bold">{formatCurrency(grossSalesMargin)}</span>
            </div>

            {/* 4. Outras Receitas */}
            {otherOperatingIncomes > 0 && (
              <div className="flex justify-between items-center px-3 py-1 text-emerald-700">
                <span className="pl-3">(+) Outras Receitas Operacionais</span>
                <span className="font-semibold">+ {formatCurrency(otherOperatingIncomes)}</span>
              </div>
            )}

            {/* 5. Despesas Operacionais */}
            <div className="flex justify-between items-center px-3 py-1.5 text-rose-700">
              <span className="pl-3">(-) Despesas Operacionais Pagas (Aluguel, Luz, etc.)</span>
              <span className="font-semibold">- {formatCurrency(totalOperatingExpenses)}</span>
            </div>

            {/* 6. Resultado Final */}
            <div className="flex justify-between items-center bg-slate-900 text-white p-3.5 rounded-lg shadow-xs mt-3">
              <div>
                <span className="text-xs font-bold tracking-wide">(=) RESULTADO / LUCRO LÍQUIDO REAL</span>
                <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                  Margem Líquida:{' '}
                  {grossSalesRevenue > 0
                    ? ((dreFinalNetProfit / grossSalesRevenue) * 100).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
              <span className="text-lg font-bold text-emerald-400">
                {formatCurrency(dreFinalNetProfit)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Modal: New Transaction */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-xl bg-white p-5 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {formType === 'INCOME' ? 'Registrar Nova Receita' : 'Registrar Nova Despesa'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição *</label>
                <input
                  type="text"
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ex: Conta de Luz, Reposição de Mercadoria"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formAmount || ''}
                    onChange={(e) => setFormAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Data</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  {(formType === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Forma de Pagto</label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm.id} value={pm.code}>
                        {pm.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as TransactionStatus)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="PAID">Pago (Concluído)</option>
                    <option value="PENDING">Pendente (A Pagar)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 active:scale-98 transition-all"
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
