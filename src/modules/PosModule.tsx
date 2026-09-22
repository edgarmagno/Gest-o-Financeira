import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Barcode,
  Check,
  CheckCircle,
  CreditCard,
  DollarSign,
  Minus,
  Percent,
  Plus,
  QrCode,
  Receipt,
  RotateCcw,
  Search,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  UserCheck,
  UserPlus,
  X,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Customer, PaymentMethod, Product, SaleItem } from '../types';
import { DEFAULT_PAYMENT_METHODS } from '../data/initialData';
import { formatCurrency, formatDocument, formatPhone } from '../utils/formatters';

export const PosModule: React.FC = () => {
  const { products, customers, addCustomer, createSale, setReceiptSale, currentUser, company } = useApp();

  const [cart, setCart] = useState<SaleItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [barcodeInput, setBarcodeInput] = useState('');

  // Customer selection
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [isNewCustomerModal, setIsNewCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustDoc, setNewCustDoc] = useState('');

  // Discount & Payment
  const [discountType, setDiscountType] = useState<'FIXED' | 'PERCENT'>('FIXED');
  const [discountInput, setDiscountInput] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [installments, setInstallments] = useState<number>(1);
  const [cashGivenInput, setCashGivenInput] = useState<string>('');
  const [saleNotes, setSaleNotes] = useState('');

  // Helper to parse decimal values with comma or dot (e.g. "4,90" -> 4.90)
  const parseDecimalValue = (val: string): number => {
    if (!val) return 0;
    const clean = val.replace(/\s/g, '').replace(',', '.');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : Math.max(0, parsed);
  };

  const discountValue = parseDecimalValue(discountInput);
  const cashGiven = parseDecimalValue(cashGivenInput);

  // Barcode input ref
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const categories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);

  // Available in-stock products
  const availableProducts = products.filter(
    (p) => p.status === 'active' && p.stock > 0
  );

  const filteredCatalog = availableProducts.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.includes(searchTerm);
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Add product to cart
  const addToCart = (product: Product, quantity = 1) => {
    const existing = cart.find((item) => item.productId === product.id);

    if (existing) {
      if (existing.quantity + quantity > product.stock) {
        alert(`Estoque insuficiente! Apenas ${product.stock} ${product.unit} disponíveis.`);
        return;
      }
      setCart((prev) =>
        prev.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
                subtotal: (item.quantity + quantity) * item.unitPrice,
              }
            : item
        )
      );
    } else {
      if (quantity > product.stock) {
        alert(`Estoque insuficiente! Apenas ${product.stock} ${product.unit} disponíveis.`);
        return;
      }
      const newItem: SaleItem = {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        unit: product.unit,
        quantity,
        unitPrice: product.salePrice,
        costPrice: product.costPrice,
        discount: 0,
        subtotal: quantity * product.salePrice,
      };
      setCart((prev) => [newItem, ...prev]);
    }
  };

  const updateCartItemQty = (productId: string, delta: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > prod.stock) {
              alert(`Estoque insuficiente! Apenas ${prod.stock} ${prod.unit} disponíveis.`);
              return item;
            }
            return {
              ...item,
              quantity: newQty,
              subtotal: newQty * item.unitPrice,
            };
          }
          return item;
        })
        .filter(Boolean) as SaleItem[]
    );
  };

  const removeCartItem = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountInput('');
    setCashGivenInput('');
    setSaleNotes('');
  };

  // Barcode trigger
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const matched = products.find(
      (p) =>
        p.barcode === barcodeInput.trim() ||
        p.sku.toLowerCase() === barcodeInput.trim().toLowerCase()
    );

    if (matched) {
      addToCart(matched, 1);
      setBarcodeInput('');
    } else {
      alert(`Produto com código/SKU "${barcodeInput}" não encontrado.`);
    }
  };

  // Calculations
  const cartSubtotal = cart.reduce((acc, it) => acc + it.subtotal, 0);
  const calculatedDiscount =
    discountType === 'PERCENT'
      ? (cartSubtotal * Math.min(100, Math.max(0, discountValue))) / 100
      : Math.min(cartSubtotal, Math.max(0, discountValue));
  const cartTotal = Math.max(0, cartSubtotal - calculatedDiscount);
  const changeAmount = paymentMethod === 'DINHEIRO' && cashGiven > cartTotal ? cashGiven - cartTotal : 0;

  // Selected customer info
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Quick Customer Creation
  const handleCreateCustomerFast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    try {
      const created = await addCustomer({
        name: newCustName.trim(),
        phone: newCustPhone,
        document: newCustDoc,
        email: '',
        address: '',
        city: 'São Paulo',
        state: 'SP',
      });

      if (created && created.id) {
        setSelectedCustomerId(created.id);
      }
      setIsNewCustomerModal(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustDoc('');
    } catch (err) {
      console.error('Error creating customer:', err);
    }
  };

  // Finalize Sale
  const handleFinishSale = async () => {
    if (cart.length === 0) {
      alert('O carrinho está vazio.');
      return;
    }

    if (paymentMethod === 'DINHEIRO' && cashGiven < cartTotal && cashGiven > 0) {
      alert(`Valor em dinheiro informado (${formatCurrency(cashGiven)}) é menor que o total da venda (${formatCurrency(cartTotal)}).`);
      return;
    }

    try {
      const createdSale = await createSale({
        customerId: selectedCustomer?.id || undefined,
        customerName: selectedCustomer ? selectedCustomer.name : 'Consumidor Final (Balcão)',
        customerDocument: selectedCustomer?.document || undefined,
        items: cart,
        subtotal: cartSubtotal,
        discount: calculatedDiscount,
        total: cartTotal,
        paymentMethod,
        installments: paymentMethod === 'CREDITO' ? installments : undefined,
        amountPaid: paymentMethod === 'DINHEIRO' && cashGiven > 0 ? cashGiven : cartTotal,
        change: changeAmount,
        sellerId: currentUser.id,
        sellerName: currentUser.name,
        notes: saleNotes || undefined,
      });

      // Open receipt modal
      if (createdSale) {
        setReceiptSale(createdSale);
      }

      // Reset cart
      clearCart();
      setSelectedCustomerId('');
      setSaleNotes('');
    } catch (err) {
      console.error('Error finishing sale:', err);
      alert('Ocorreu um erro ao registrar a venda. Por favor, tente novamente.');
    }
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      {/* Left side: Product Catalog & Barcode Scanner (7 cols) */}
      <div className="space-y-4 lg:col-span-7">
        {/* Top Barcode Input Box */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
          <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Barcode className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Passe o leitor de código de barras ou digite SKU / EAN..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 active:scale-98 transition-all shadow-xs"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Inserir</span>
            </button>
          </form>
        </div>

        {/* Catalog Search & Filter */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisar produtos por nome ou código..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="ALL">Todas as Categorias</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 max-h-[460px] overflow-y-auto p-0.5">
            {filteredCatalog.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product, 1)}
                className="group relative flex flex-col justify-between rounded-lg border border-slate-200/80 bg-white p-2.5 text-left transition-all hover:border-slate-400 hover:shadow-xs active:scale-98"
              >
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="h-20 w-full rounded-md object-cover border border-slate-100 mb-2"
                  />
                ) : (
                  <div className="flex h-20 w-full items-center justify-center rounded-md bg-slate-50 text-slate-400 mb-2">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                )}

                <div>
                  <span className="inline-block text-[9px] font-medium text-slate-400 uppercase tracking-wider">
                    {product.category}
                  </span>
                  <p className="font-semibold text-xs text-slate-900 line-clamp-2 leading-snug">
                    {product.name}
                  </p>
                </div>

                <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-1.5">
                  <span className="font-bold text-xs text-slate-900 font-mono">
                    {formatCurrency(product.salePrice)}
                  </span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-600">
                    Est: {product.stock}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right side: Interactive Shopping Cart & Checkout (5 cols) */}
      <div className="space-y-4 lg:col-span-5">
        <div className="flex flex-col rounded-xl border border-slate-200/80 bg-white p-4.5 shadow-xs">
          {/* Cart Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-900 text-white">
                <ShoppingCart className="h-3.5 w-3.5" />
              </div>
              <h2 className="font-semibold text-xs text-slate-900">Frente de Caixa</h2>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
                {cart.reduce((a, b) => a + b.quantity, 0)} itens
              </span>
            </div>

            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[11px] font-medium text-slate-400 hover:text-rose-600 transition-colors"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Customer Selection Row */}
          <div className="my-3 flex items-center gap-2">
            <div className="flex-1">
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="">👤 Consumidor Final (Balcão)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone || c.document || 'Sem doc'})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setIsNewCustomerModal(true)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              title="Cadastrar Cliente Rápido"
            >
              <UserPlus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="min-h-[140px] max-h-[200px] overflow-y-auto divide-y divide-slate-100 pr-1">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400 text-xs">
                <ShoppingBag className="h-6 w-6 mb-1.5 opacity-30 text-slate-400" />
                <p className="text-[11px]">Nenhum produto no carrinho.</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Selecione os itens no catálogo ou leitor de código.
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.productId} className="py-2 flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs text-slate-900 truncate leading-tight">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {formatCurrency(item.unitPrice)} un
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white p-0.5 shadow-2xs">
                    <button
                      onClick={() => updateCartItemQty(item.productId, -1)}
                      className="rounded p-0.5 text-slate-600 hover:bg-slate-100"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-5 text-center font-bold text-xs font-mono text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartItemQty(item.productId, 1)}
                      className="rounded p-0.5 text-slate-600 hover:bg-slate-100"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Subtotal */}
                  <div className="w-20 text-right font-mono font-semibold text-xs text-slate-900">
                    {formatCurrency(item.subtotal)}
                  </div>

                  <button
                    onClick={() => removeCartItem(item.productId)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Discount Field */}
          <div className="mt-3 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-[11px] font-medium text-slate-600">Desconto Comercial</span>
              <div className="flex items-center rounded-md bg-slate-100 p-0.5 text-[10px]">
                <button
                  onClick={() => setDiscountType('FIXED')}
                  className={`px-2 py-0.5 font-medium rounded ${
                    discountType === 'FIXED' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  R$
                </button>
                <button
                  onClick={() => setDiscountType('PERCENT')}
                  className={`px-2 py-0.5 font-medium rounded ${
                    discountType === 'PERCENT' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  %
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                placeholder={discountType === 'FIXED' ? 'Ex: 4,90 ou 10,50' : 'Ex: 5 ou 10,5'}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              {discountValue > 0 && (
                <span className="absolute right-2.5 top-1.5 text-[11px] font-bold text-emerald-600 font-mono">
                  - {formatCurrency(calculatedDiscount)}
                </span>
              )}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="mt-3 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-medium text-slate-600">
                Forma de Pagamento
              </label>
              {(() => {
                const currentPm = (company.paymentMethods || DEFAULT_PAYMENT_METHODS).find(
                  (m) => m.code === paymentMethod
                );
                if (currentPm?.feePercent && currentPm.feePercent > 0) {
                  return (
                    <span className="text-[10px] text-amber-600 font-medium">
                      Taxa: {currentPm.feePercent}%
                    </span>
                  );
                }
                return null;
              })()}
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {((company.paymentMethods || DEFAULT_PAYMENT_METHODS).filter((pm) => pm.active).length > 0
                ? (company.paymentMethods || DEFAULT_PAYMENT_METHODS).filter((pm) => pm.active)
                : DEFAULT_PAYMENT_METHODS
              ).map((pm) => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => {
                    setPaymentMethod(pm.code as PaymentMethod);
                    if ((pm.maxInstallments || 1) === 1) {
                      setInstallments(1);
                    }
                  }}
                  className={`rounded-lg border p-1.5 text-center text-xs font-semibold transition-all ${
                    paymentMethod === pm.code
                      ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                  title={pm.description || pm.name}
                >
                  <span className="truncate block">{pm.name}</span>
                </button>
              ))}
            </div>

            {/* Dynamic Installments if method supports maxInstallments > 1 */}
            {(() => {
              const currentPm = (company.paymentMethods || DEFAULT_PAYMENT_METHODS).find(
                (m) => m.code === paymentMethod
              );
              const maxInst = currentPm?.maxInstallments || (paymentMethod === 'CREDITO' ? 12 : 1);
              if (maxInst > 1) {
                const options = [1, 2, 3, 4, 5, 6, 10, 12, 18, 24].filter((n) => n <= maxInst);
                return (
                  <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-50 p-2 border border-slate-200 text-xs">
                    <span className="text-slate-600 text-[11px]">Parcelas:</span>
                    <select
                      value={installments}
                      onChange={(e) => setInstallments(parseInt(e.target.value) || 1)}
                      className="rounded-md border border-slate-200 bg-white px-2 py-1 font-semibold text-slate-900 text-xs"
                    >
                      {options.map((n) => (
                        <option key={n} value={n}>
                          {n === 1
                            ? `1x de ${formatCurrency(cartTotal)} (À Vista)`
                            : `${n}x de ${formatCurrency(cartTotal / n)}`}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }
              return null;
            })()}

            {/* Cash / Change Calculator */}
            {(() => {
              const currentPm = (company.paymentMethods || DEFAULT_PAYMENT_METHODS).find(
                (m) => m.code === paymentMethod
              );
              const allowsChange = currentPm?.allowChange || paymentMethod === 'DINHEIRO';
              if (allowsChange) {
                return (
                  <div className="mt-2 space-y-1.5 rounded-lg bg-slate-50 p-2.5 border border-slate-200 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 text-[11px]">Valor Recebido (R$):</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={cashGivenInput}
                        onChange={(e) => setCashGivenInput(e.target.value)}
                        placeholder="Ex: 50,00"
                        className="w-28 rounded-md border border-slate-200 bg-white px-2 py-1 font-mono font-bold text-slate-900 text-right text-xs"
                      />
                    </div>
                    {cashGiven > cartTotal && (
                      <div className="flex items-center justify-between font-semibold text-emerald-700 pt-1 border-t border-slate-200 text-xs">
                        <span>TROCO DO CLIENTE:</span>
                        <span className="font-mono">{formatCurrency(changeAmount)}</span>
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            })()}
          </div>

          {/* Totals Summary */}
          <div className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-xs">
            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>Subtotal:</span>
              <span className="font-mono font-medium">{formatCurrency(cartSubtotal)}</span>
            </div>
            {calculatedDiscount > 0 && (
              <div className="flex justify-between text-emerald-700 text-[11px] font-medium">
                <span>Desconto:</span>
                <span className="font-mono">- {formatCurrency(calculatedDiscount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-900 uppercase">TOTAL A PAGAR:</span>
              <span className="text-lg font-bold font-mono text-slate-900">
                {formatCurrency(cartTotal)}
              </span>
            </div>
          </div>

          {/* Finalize Button */}
          <button
            id="btn-finish-sale"
            disabled={cart.length === 0}
            onClick={handleFinishSale}
            className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-3 text-xs font-semibold transition-all shadow-xs ${
              cart.length > 0
                ? 'bg-slate-900 text-white hover:bg-slate-800 active:scale-98'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
          >
            <CheckCircle className="h-4 w-4" />
            <span>FINALIZAR VENDA ({formatCurrency(cartTotal)})</span>
          </button>
        </div>
      </div>

      {/* Quick Customer Modal */}
      {isNewCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl border border-slate-200/80">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-xs">Cadastro Rápido de Cliente</h3>
              <button
                onClick={() => setIsNewCustomerModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomerFast} className="mt-3 space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">WhatsApp / Telefone</label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">CPF ou CNPJ</label>
                <input
                  type="text"
                  value={newCustDoc}
                  onChange={(e) => setNewCustDoc(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewCustomerModal(false)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 shadow-xs"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
