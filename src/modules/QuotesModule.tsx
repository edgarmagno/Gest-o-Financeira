import React, { useState } from 'react';
import {
  ArrowRight,
  Box,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  Edit2,
  Eye,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Hammer,
  Minus,
  Package,
  Plus,
  Printer,
  Search,
  Share2,
  Sparkles,
  Trash2,
  UserCheck,
  X,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Print3DSpecs, Quote, QuoteStatus, SaleItem } from '../types';
import { downloadFile, formatCurrency, formatDate } from '../utils/formatters';
import { Print3DCalculatorModal } from '../components/Print3DCalculatorModal';

export const QuotesModule: React.FC = () => {
  const {
    quotes,
    createQuote,
    updateQuoteStatus,
    convertQuoteToSale,
    deleteQuote,
    setReceiptQuote,
    startProductionFromQuote,
    products,
    customers,
    currentUser,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Form modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerDoc, setCustomerDoc] = useState('');
  const [validityDays, setValidityDays] = useState(10);
  const [notes, setNotes] = useState('');

  // Items in quote
  const [quoteItems, setQuoteItems] = useState<SaleItem[]>([]);
  const [selectedProdToAdd, setSelectedProdToAdd] = useState('');
  const [discountInput, setDiscountInput] = useState<string>('');

  // 3D Print Calculator modal state
  const [isPrint3DModalOpen, setIsPrint3DModalOpen] = useState(false);
  const [print3DInitialValues, setPrint3DInitialValues] = useState<any>(null);

  const parseDecimalValue = (val: string): number => {
    if (!val) return 0;
    const clean = val.replace(/\s/g, '').replace(',', '.');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : Math.max(0, parsed);
  };

  const discountValue = parseDecimalValue(discountInput);

  const filteredQuotes = quotes.filter((q) => {
    const matchesSearch =
      q.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenCreate = () => {
    setSelectedCustomerId('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setCustomerDoc('');
    setValidityDays(10);
    setNotes('');
    setQuoteItems([]);
    setDiscountInput('');
    setPrint3DInitialValues(null);
    setIsFormOpen(true);
  };

  const handleSelectCustomer = (custId: string) => {
    setSelectedCustomerId(custId);
    const found = customers.find((c) => c.id === custId);
    if (found) {
      setCustomerName(found.name);
      setCustomerPhone(found.phone);
      setCustomerEmail(found.email);
      setCustomerDoc(found.document);
    }
  };

  const handleAddItem = () => {
    const prod = products.find((p) => p.id === selectedProdToAdd);
    if (!prod) return;

    // Se o produto selecionado for Peça 3D, abre a calculadora com preço dinâmico
    if (prod.productType === '3D_PRINT' || prod.category === 'Peças 3D & Impressão 3D') {
      setPrint3DInitialValues({
        name: prod.name,
        notes: prod.notes || '',
      });
      setIsPrint3DModalOpen(true);
      setSelectedProdToAdd('');
      return;
    }

    const existing = quoteItems.find((it) => it.productId === prod.id);
    if (existing) {
      setQuoteItems((prev) =>
        prev.map((it) =>
          it.productId === prod.id
            ? {
                ...it,
                quantity: it.quantity + 1,
                subtotal: (it.quantity + 1) * it.unitPrice,
              }
            : it
        )
      );
    } else {
      const newItem: SaleItem = {
        productId: prod.id,
        name: prod.name,
        sku: prod.sku,
        unit: prod.unit,
        quantity: 1,
        unitPrice: prod.salePrice,
        costPrice: prod.costPrice,
        discount: 0,
        subtotal: prod.salePrice,
      };
      setQuoteItems((prev) => [newItem, ...prev]);
    }
    setSelectedProdToAdd('');
  };

  const handleConfirm3DItem = (data: {
    name: string;
    quantity: number;
    unitPrice: number;
    costPrice: number;
    specs: Print3DSpecs;
    notes?: string;
  }) => {
    const newItemId = `3d-quote-${Date.now()}`;
    const newItem: SaleItem = {
      productId: newItemId,
      name: data.name,
      sku: `3D-${(data.specs.filamentType || 'PLA').toUpperCase()}`,
      unit: 'UN',
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      costPrice: data.costPrice,
      discount: 0,
      subtotal: data.quantity * data.unitPrice,
      is3DPrint: true,
      specs3D: data.specs,
    };
    setQuoteItems((prev) => [newItem, ...prev]);
  };

  const updateItemQty = (prodId: string, delta: number) => {
    setQuoteItems((prev) =>
      prev
        .map((it) => {
          if (it.productId === prodId) {
            const nextQty = it.quantity + delta;
            if (nextQty <= 0) return null;
            return {
              ...it,
              quantity: nextQty,
              subtotal: nextQty * it.unitPrice,
            };
          }
          return it;
        })
        .filter(Boolean) as SaleItem[]
    );
  };

  const removeItem = (prodId: string) => {
    setQuoteItems((prev) => prev.filter((it) => it.productId !== prodId));
  };

  const quoteSubtotal = quoteItems.reduce((acc, it) => acc + it.subtotal, 0);
  const quoteTotal = Math.max(0, quoteSubtotal - discountValue);

  const handleSaveQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || quoteItems.length === 0) {
      alert('Preencha os dados do cliente e adicione ao menos um item ao orçamento.');
      return;
    }

    try {
      await createQuote({
        customerId: selectedCustomerId || undefined,
        customerName: customerName.trim(),
        customerPhone: customerPhone || undefined,
        customerEmail: customerEmail || undefined,
        customerDocument: customerDoc || undefined,
        items: quoteItems,
        subtotal: quoteSubtotal,
        discount: discountValue,
        total: quoteTotal,
        validityDays,
        status: 'ENVIADO',
        notes: notes || undefined,
      });

      setIsFormOpen(false);
    } catch (err) {
      console.error('Error creating quote:', err);
      alert('Erro ao salvar o orçamento.');
    }
  };

  const handleConvertSale = async (quote: Quote) => {
    if (confirm(`Deseja converter o orçamento ${quote.code} em venda definitiva agora? Isto dará baixa no estoque.`)) {
      try {
        const sale = await convertQuoteToSale(quote.id);
        if (sale) {
          alert(`Orçamento convertido com sucesso na Venda ${sale.code}!`);
        }
      } catch (err) {
        console.error('Error converting quote:', err);
        alert('Erro ao converter orçamento em venda.');
      }
    }
  };

  const getStatusBadge = (status: QuoteStatus) => {
    switch (status) {
      case 'RASCUNHO':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'ENVIADO':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'APROVADO':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CONVERTIDO':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'REJEITADO':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Orçamentos & Propostas Comerciais
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Crie cotações formais para clientes, envie propostas e converta em vendas em 1 clique.
          </p>
        </div>

        <button
          id="btn-new-quote"
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 active:scale-98 transition-all"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>Criar Orçamento</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-2.5 rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código do orçamento ou nome do cliente..."
            className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="ALL">Todos os Status</option>
            <option value="ENVIADO">Enviados</option>
            <option value="APROVADO">Aprovados</option>
            <option value="CONVERTIDO">Convertidos em Venda</option>
            <option value="RASCUNHO">Rascunhos</option>
            <option value="REJEITADO">Rejeitados</option>
          </select>
        </div>
      </div>

      {/* Quotes Cards Grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filteredQuotes.length === 0 ? (
          <div className="col-span-full rounded-xl border border-slate-200/80 bg-white p-12 text-center text-slate-400 text-xs shadow-xs">
            <FileText className="mx-auto h-7 w-7 mb-2 opacity-40 text-slate-400" />
            Nenhum orçamento encontrado. Clique em "Criar Orçamento" para começar.
          </div>
        ) : (
          filteredQuotes.map((quote) => (
            <div
              key={quote.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs hover:border-slate-300 transition-colors"
            >
              <div>
                {/* Card Top */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div>
                    <span className="font-mono font-semibold text-xs text-slate-900">{quote.code}</span>
                    <p className="text-[10px] text-slate-400">{formatDate(quote.createdAt, true)}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${getStatusBadge(
                      quote.status
                    )}`}
                  >
                    {quote.status}
                  </span>
                </div>

                {/* Customer & Info */}
                <div className="mt-2.5 space-y-0.5 text-xs">
                  <p className="font-semibold text-slate-900 text-sm truncate">{quote.customerName}</p>
                  {quote.customerPhone && (
                    <p className="text-slate-500 text-[11px]">{quote.customerPhone}</p>
                  )}
                  <p className="text-slate-400 text-[10px]">
                    Validade:{' '}
                    <span className="font-medium text-slate-700">{quote.validityDays} dias</span>
                  </p>
                </div>

                {/* Items preview */}
                <div className="mt-2.5 rounded-lg bg-slate-50 p-2 border border-slate-200/70 text-xs space-y-1">
                  <span className="text-[10px] font-medium text-slate-400 uppercase">
                    Itens da Proposta ({quote.items.length}):
                  </span>
                  {quote.items.slice(0, 2).map((item, idx) => (
                    <div key={idx} className="flex justify-between text-[11px] text-slate-600">
                      <span className="truncate max-w-[170px] flex items-center gap-1">
                        {item.is3DPrint && (
                          <span className="bg-indigo-100 text-indigo-700 text-[9px] font-bold px-1 rounded">3D</span>
                        )}
                        <span>{item.quantity}x {item.name}</span>
                      </span>
                      <span className="font-mono font-medium text-slate-800">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>
                  ))}
                  {quote.items.length > 2 && (
                    <p className="text-[10px] text-slate-400 italic">
                      + {quote.items.length - 2} outros itens...
                    </p>
                  )}
                </div>

                {/* Total */}
                <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-xs font-medium text-slate-500">Valor Total:</span>
                  <span className="text-sm font-bold font-mono text-slate-900">
                    {formatCurrency(quote.total)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setReceiptQuote(quote)}
                    className="rounded-md border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-50 transition-colors"
                    title="Imprimir Proposta / Cupom"
                  >
                    <Printer className="h-3.5 w-3.5" />
                  </button>

                  <select
                    value={quote.status}
                    onChange={(e) => updateQuoteStatus(quote.id, e.target.value as QuoteStatus)}
                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-700 focus:outline-none"
                  >
                    <option value="RASCUNHO">Rascunho</option>
                    <option value="ENVIADO">Enviado</option>
                    <option value="APROVADO">Aprovado</option>
                    <option value="REJEITADO">Rejeitado</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => startProductionFromQuote(quote)}
                    className="flex items-center gap-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 px-2 py-1 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-colors"
                    title="Gerar Ordem de Produção / Fabricação sob Medida"
                  >
                    <Hammer className="h-3 w-3" />
                    <span>Produzir</span>
                  </button>

                  {quote.status !== 'CONVERTIDO' ? (
                    <button
                      onClick={() => handleConvertSale(quote)}
                      className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 active:scale-98 transition-all shadow-2xs"
                    >
                      <Zap className="h-3 w-3" />
                      <span>Converter em Venda</span>
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-purple-700">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Venda Realizada
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Quote Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative my-8 w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Nova Proposta Comercial / Orçamento</h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuote} className="mt-3 space-y-3">
              {/* Customer Row */}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Selecionar Cliente Cadastrado
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => handleSelectCustomer(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="">-- Escolher ou digitar avulso --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome do Cliente / Empresa *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ex: Consultoria ABC LTDA"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp / Telefone</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Validade da Proposta (Dias)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={validityDays}
                    onChange={(e) => setValidityDays(parseInt(e.target.value) || 7)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="border-t border-slate-100 pt-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Itens da Proposta (Catálogo ou Peças 3D)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setPrint3DInitialValues(null);
                      setIsPrint3DModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg border border-indigo-200 transition-colors"
                  >
                    <Box className="h-3.5 w-3.5" />
                    <span>+ Peça 3D (Cálculo Dinâmico)</span>
                  </button>
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedProdToAdd}
                    onChange={(e) => setSelectedProdToAdd(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="">Selecione um produto para adicionar...</option>
                    {products
                      .filter((p) => p.status === 'active')
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.productType === '3D_PRINT' ? '🧩 [3D] ' : ''}
                          {p.name} - {p.productType === '3D_PRINT' ? 'Preço Dinâmico Sob Medida' : formatCurrency(p.salePrice)}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    disabled={!selectedProdToAdd}
                    className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
                  >
                    + Item
                  </button>
                </div>

                {/* Items Table in Modal */}
                <div className="mt-2.5 rounded-lg border border-slate-200 overflow-hidden text-xs">
                  <div className="bg-slate-50 px-3 py-1.5 font-medium text-slate-600 flex justify-between border-b border-slate-100">
                    <span>Item</span>
                    <span>Qtd</span>
                    <span>Subtotal</span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-36 overflow-y-auto">
                    {quoteItems.length === 0 ? (
                      <div className="p-4 text-center text-slate-400 text-xs">
                        Nenhum item adicionado ainda.
                      </div>
                    ) : (
                      quoteItems.map((it) => (
                        <div key={it.productId} className="p-2 flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate font-medium text-slate-900">{it.name}</span>
                              {it.is3DPrint && (
                                <span className="rounded bg-indigo-50 border border-indigo-200 px-1 py-0.2 text-[9px] font-bold text-indigo-700">
                                  3D
                                </span>
                              )}
                            </div>
                            {it.specs3D && (
                              <span className="text-[10px] text-slate-400 block truncate">
                                {it.specs3D.filamentGrams}g ({it.specs3D.filamentType}) • {it.specs3D.printHours}h{it.specs3D.printMinutes}m
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => updateItemQty(it.productId, -1)}
                              className="rounded bg-slate-100 p-1 text-slate-600 hover:bg-slate-200"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-6 text-center font-semibold">{it.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateItemQty(it.productId, 1)}
                              className="rounded bg-slate-100 p-1 text-slate-600 hover:bg-slate-200"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <span className="font-mono font-semibold text-slate-900 w-20 text-right">
                            {formatCurrency(it.subtotal)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeItem(it.productId)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Totals & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 border-t border-slate-100 pt-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Condições & Observações
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Pagamento faturado em 30 dias, frete grátis."
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Desconto Comercial (R$):</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={discountInput}
                      onChange={(e) => setDiscountInput(e.target.value)}
                      placeholder="Ex: 4,90"
                      className="w-28 rounded-lg border border-slate-200 bg-white px-2 py-1 text-right font-mono font-semibold text-xs text-slate-900"
                    />
                  </div>
                  <div className="flex justify-between items-center font-bold text-sm border-t border-slate-200 pt-1">
                    <span>Total da Proposta:</span>
                    <span className="font-mono text-slate-900">{formatCurrency(quoteTotal)}</span>
                  </div>
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
                  Salvar Orçamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Calculadora de Peça 3D (Precificação Dinâmica) */}
      <Print3DCalculatorModal
        isOpen={isPrint3DModalOpen}
        onClose={() => {
          setIsPrint3DModalOpen(false);
          setPrint3DInitialValues(null);
        }}
        onConfirm={handleConfirm3DItem}
        initialValues={print3DInitialValues}
        title="Precificação de Peça 3D para Orçamento"
        confirmButtonLabel="Inserir no Orçamento"
      />
    </div>
  );
};
