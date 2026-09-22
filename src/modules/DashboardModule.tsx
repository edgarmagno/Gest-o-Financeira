import React from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  DollarSign,
  Eye,
  Package,
  Plus,
  Receipt,
  ShoppingBag,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/formatters';

export const DashboardModule: React.FC = () => {
  const {
    sales,
    products,
    customers,
    transactions,
    lowStockProducts,
    setActiveModule,
    setReceiptSale,
    setIsQuickActionOpen,
  } = useApp();

  // Metrics calculations
  const completedSales = sales.filter((s) => s.status === 'COMPLETED');
  const totalRevenue = completedSales.reduce((acc, s) => acc + s.total, 0);
  const totalCost = completedSales.reduce((acc, s) => acc + s.costTotal, 0);
  const completedSalesCount = completedSales.length;
  const averageTicket = completedSalesCount > 0 ? totalRevenue / completedSalesCount : 0;

  // Operational Expenses from Finance Transactions
  const totalExpenses = transactions
    .filter((t) => t.type === 'EXPENSE' && t.status === 'PAID')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalOtherIncomes = transactions
    .filter((t) => t.type === 'INCOME' && t.status === 'PAID' && !t.relatedSaleId)
    .reduce((acc, t) => acc + t.amount, 0);

  // Real Net Profit = (Sales Revenue + Other Income) - Product Costs - Expenses
  const realNetProfit = totalRevenue + totalOtherIncomes - totalCost - totalExpenses;

  // Personal/Company Finance Balance
  const allPaidIncomes = transactions
    .filter((t) => t.type === 'INCOME' && t.status === 'PAID')
    .reduce((acc, t) => acc + t.amount, 0);
  const financialBalance = allPaidIncomes - totalExpenses;

  // Chart 1: Revenue over time (grouped by day)
  const salesByDateMap: { [key: string]: number } = {};
  completedSales.forEach((s) => {
    const dateKey = s.createdAt.slice(5, 10); // MM-DD
    salesByDateMap[dateKey] = (salesByDateMap[dateKey] || 0) + s.total;
  });

  const revenueChartData = Object.keys(salesByDateMap)
    .sort()
    .map((date) => ({
      data: date.split('-').reverse().join('/'),
      faturamento: salesByDateMap[date],
    }));

  const revenueDisplayData =
    revenueChartData.length > 0
      ? revenueChartData
      : [{ data: 'Hoje', faturamento: 0 }];

  // Chart 2: Payment Methods breakdown
  const paymentMethodMap: { [key: string]: number } = {};
  completedSales.forEach((s) => {
    paymentMethodMap[s.paymentMethod] = (paymentMethodMap[s.paymentMethod] || 0) + s.total;
  });

  const paymentChartData = Object.keys(paymentMethodMap).map((method) => ({
    name: method,
    value: paymentMethodMap[method],
  }));

  const PIE_COLORS = ['#0f172a', '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'];

  // Top 5 Most Sold Products
  const productSalesMap: { [prodId: string]: { name: string; qty: number; revenue: number; margin: number } } = {};
  completedSales.forEach((s) => {
    (s.items || []).forEach((it) => {
      if (!productSalesMap[it.productId]) {
        const prodObj = products.find((p) => p.id === it.productId);
        const margin = prodObj && prodObj.salePrice > 0 ? ((prodObj.salePrice - prodObj.costPrice) / prodObj.salePrice) * 100 : 0;
        productSalesMap[it.productId] = {
          name: it.name,
          qty: 0,
          revenue: 0,
          margin: Number(margin.toFixed(1)),
        };
      }
      productSalesMap[it.productId].qty += it.quantity;
      productSalesMap[it.productId].revenue += it.subtotal;
    });
  });

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // Latest 5 validated sales (excluding cancelled/invalidated)
  const recentSales = completedSales
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Visão Geral
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhe o faturamento real, vendas e saúde financeira sincronizados em nuvem.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-dash-new-sale"
            onClick={() => setActiveModule('pos')}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 active:scale-98 transition-all"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Frente de Caixa (PDV)</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Card 1: Total Revenue */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500">Faturamento Total</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-700">
              <DollarSign className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-bold text-slate-900 font-mono tracking-tight">
              {formatCurrency(totalRevenue)}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
              <span>{completedSalesCount} vendas concluídas</span>
            </div>
          </div>
        </div>

        {/* Card 2: Net Profit */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500">Lucro Líquido Real</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-700">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className={`text-xl font-bold font-mono tracking-tight ${realNetProfit >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
              {formatCurrency(realNetProfit)}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              Margem líquida:{' '}
              <span className="font-semibold text-slate-800">
                {totalRevenue > 0 ? ((realNetProfit / totalRevenue) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Completed Sales & Ticket */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500">Vendas Realizadas</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-700">
              <Receipt className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-bold text-slate-900 font-mono tracking-tight">
              {completedSalesCount} <span className="text-xs font-normal text-slate-400">pedidos</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              Ticket Médio:{' '}
              <span className="font-semibold text-slate-800">{formatCurrency(averageTicket)}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Low Stock Alert */}
        <div
          onClick={() => setActiveModule('products')}
          className="cursor-pointer rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs hover:border-slate-300 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500">Alertas de Estoque</span>
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-md ${
                lowStockProducts.length > 0 ? 'bg-amber-50 text-amber-700 border border-amber-200/60' : 'bg-slate-100 text-slate-500'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-bold text-slate-900 font-mono tracking-tight">
              {lowStockProducts.length}{' '}
              <span className="text-xs font-normal text-slate-400">itens</span>
            </div>
            <div className="mt-1 text-[11px] font-medium text-amber-700 flex items-center justify-between">
              <span>{lowStockProducts.length > 0 ? 'Abaixo do mínimo' : 'Estoque regular'}</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Card 5: Finance Net Balance */}
        <div
          onClick={() => setActiveModule('sales')}
          className="cursor-pointer rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs hover:border-slate-300 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500">Saldo Líquido em Caixa</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-700">
              <Wallet className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div
              className={`text-xl font-bold font-mono tracking-tight ${
                financialBalance >= 0 ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {formatCurrency(financialBalance)}
            </div>
            <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Despesas pagas: {formatCurrency(totalExpenses)}</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Charts Row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Chart 1: Revenue Evolution Area Chart */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-xs text-slate-900">Evolução do Faturamento</h3>
              <p className="text-[11px] text-slate-500">Histórico de vendas registradas no sistema</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600">
              <Calendar className="h-3 w-3 text-slate-400" />
              <span>Período Atual</span>
            </div>
          </div>

          <div className="h-64 w-full">
            {revenueChartData.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-slate-400 text-xs">
                <Receipt className="h-8 w-8 mb-2 stroke-1 text-slate-300" />
                <p>Nenhuma venda concluída para gerar o gráfico.</p>
                <button
                  onClick={() => setActiveModule('pos')}
                  className="mt-2 text-xs font-semibold text-slate-900 underline"
                >
                  Registrar primeira venda no PDV
                </button>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueDisplayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f172a" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0f172a" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="data" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `R$${val}`}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val)), 'Faturamento']}
                    labelFormatter={(lbl) => `Data: ${lbl}`}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="faturamento"
                    stroke="#0f172a"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Payment Methods Donut */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col">
          <div className="mb-2">
            <h3 className="font-semibold text-xs text-slate-900">Formas de Pagamento</h3>
            <p className="text-[11px] text-slate-500">Distribuição no caixa</p>
          </div>

          <div className="h-52 w-full flex-1 flex items-center justify-center">
            {paymentChartData.length === 0 ? (
              <div className="text-center text-slate-400 text-xs py-8">
                <CreditCard className="h-7 w-7 mx-auto mb-1 stroke-1 text-slate-300" />
                <span>Nenhum pagamento registrado</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    {paymentChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val)), 'Total']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {paymentChartData.length > 0 && (
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
              {paymentChartData.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                  />
                  <span className="truncate text-slate-600 text-[11px]">{item.name}</span>
                  <span className="ml-auto font-semibold text-slate-900 font-mono text-[11px]">
                    {formatCurrency(item.value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Quick Tables: Recent Sales & Top Products */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Table 1: Recent Sales */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <h3 className="font-semibold text-xs text-slate-900">Últimas Vendas</h3>
              <p className="text-[11px] text-slate-500">Pedidos concluídos recentemente</p>
            </div>
            <button
              onClick={() => setActiveModule('sales')}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 hover:underline"
            >
              Ver todas
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="pb-2">Código</th>
                  <th className="pb-2">Cliente</th>
                  <th className="pb-2">Pagamento</th>
                  <th className="pb-2 text-right">Valor</th>
                  <th className="pb-2 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentSales.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                      Nenhuma venda registrada ainda.
                    </td>
                  </tr>
                ) : (
                  recentSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 font-medium text-slate-900">{sale.code}</td>
                      <td className="py-2.5 text-slate-600 max-w-[120px] truncate">{sale.customerName}</td>
                      <td className="py-2.5">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-700 text-[10px]">
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-semibold text-slate-900 font-mono">
                        {formatCurrency(sale.total)}
                      </td>
                      <td className="py-2.5 text-center">
                        <button
                          onClick={() => setReceiptSale(sale)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                          title="Visualizar Comprovante"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Top Products */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <h3 className="font-semibold text-xs text-slate-900">Produtos Mais Vendidos</h3>
              <p className="text-[11px] text-slate-500">Ranking por volume e margem</p>
            </div>
            <button
              onClick={() => setActiveModule('products')}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 hover:underline"
            >
              Ver estoque
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="pb-2">Produto</th>
                  <th className="pb-2 text-center">Qtd</th>
                  <th className="pb-2 text-center">Margem</th>
                  <th className="pb-2 text-right">Faturamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topProducts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400 text-xs">
                      Nenhuma venda registrada ainda.
                    </td>
                  </tr>
                ) : (
                  topProducts.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 font-medium text-slate-900 max-w-[160px] truncate">
                        {p.name}
                      </td>
                      <td className="py-2.5 text-center font-medium text-slate-600">
                        {p.qty} un
                      </td>
                      <td className="py-2.5 text-center">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-700 text-[10px]">
                          {p.margin}%
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-semibold text-slate-900 font-mono">
                        {formatCurrency(p.revenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
