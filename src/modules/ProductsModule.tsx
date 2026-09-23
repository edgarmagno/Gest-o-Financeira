import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart2,
  Box,
  Check,
  Download,
  Edit2,
  Filter,
  History,
  Layers,
  Package,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Print3DSpecs, Product, UnitType } from '../types';
import { DEFAULT_PRODUCT_CATEGORIES, DEFAULT_UNITS } from '../data/initialData';
import {
  calculateMarginPercent,
  calculateMarkupPercent,
  downloadFile,
  formatCurrency,
  formatDate,
} from '../utils/formatters';
import { Print3DCalculatorModal } from '../components/Print3DCalculatorModal';

export const ProductsModule: React.FC = () => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    stockMovements,
    currentUser,
    company,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [activeTab, setActiveTab] = useState<'catalog' | 'movements'>('catalog');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<Product | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState('Entrada de Fornecedor');
  const [adjustType, setAdjustType] = useState<'IN' | 'OUT' | 'ADJUSTMENT'>('IN');

  // 3D Calculator modal in Products
  const [isPrint3DModalOpen, setIsPrint3DModalOpen] = useState(false);
  const [product3DInitialValues, setProduct3DInitialValues] = useState<any>(null);

  // Product Form state
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: 'Eletrônicos',
    costPrice: 0,
    salePrice: 0,
    stock: 0,
    minStock: 5,
    unit: 'UN' as UnitType,
    status: 'active' as 'active' | 'inactive',
    notes: '',
    imageUrl: '',
    productType: 'STANDARD' as 'STANDARD' | '3D_PRINT',
    specs3D: undefined as Print3DSpecs | undefined,
  });

  // Extract unique categories (merging company configured categories + any existing in products)
  const configuredCategories = company.productCategories || DEFAULT_PRODUCT_CATEGORIES;
  const categories = Array.from(
    new Set([...configuredCategories, ...products.map((p) => p.category)])
  ).filter(Boolean);

  // Extract units
  const availableUnits = company.unitsOfMeasurement || DEFAULT_UNITS;

  // Filtered products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.includes(searchTerm) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;

    let matchesStock = true;
    if (stockFilter === 'IN_STOCK') matchesStock = p.stock > p.minStock;
    if (stockFilter === 'LOW_STOCK') matchesStock = p.stock > 0 && p.stock <= p.minStock;
    if (stockFilter === 'OUT_OF_STOCK') matchesStock = p.stock === 0;

    return matchesSearch && matchesCategory && matchesStock;
  });

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: `SKU-${Date.now().toString().slice(-6)}`,
      barcode: `789${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      category: categories[0] || 'Eletrônicos',
      costPrice: 0,
      salePrice: 0,
      stock: 10,
      minStock: 5,
      unit: 'UN',
      status: 'active',
      notes: '',
      imageUrl: '',
      productType: 'STANDARD',
      specs3D: undefined,
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku,
      barcode: p.barcode,
      category: p.category,
      costPrice: p.costPrice,
      salePrice: p.salePrice,
      stock: p.stock,
      minStock: p.minStock,
      unit: p.unit,
      status: p.status,
      notes: p.notes || '',
      imageUrl: p.imageUrl || '',
      productType: p.productType || (p.category === 'Peças 3D & Impressão 3D' ? '3D_PRINT' : 'STANDARD'),
      specs3D: p.specs3D,
    });
    setIsFormOpen(true);
  };

  const handleOpen3DCalculatorFromForm = () => {
    setProduct3DInitialValues({
      name: formData.name || 'Peça 3D Personalizada',
      filamentType: formData.specs3D?.filamentType || 'PLA',
      filamentGrams: formData.specs3D?.filamentGrams || 70,
      printHours: formData.specs3D?.printHours || 4,
      printMinutes: formData.specs3D?.printMinutes || 30,
      notes: formData.notes || '',
    });
    setIsPrint3DModalOpen(true);
  };

  const handleConfirm3DFromModal = (data: {
    name: string;
    quantity: number;
    unitPrice: number;
    costPrice: number;
    specs: Print3DSpecs;
    notes?: string;
  }) => {
    if (isFormOpen) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || data.name,
        costPrice: data.costPrice,
        salePrice: data.unitPrice,
        productType: '3D_PRINT',
        category: 'Peças 3D & Impressão 3D',
        specs3D: data.specs,
        notes: prev.notes ? `${prev.notes} | ${data.notes || ''}` : (data.notes || ''),
      }));
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: formData.name,
        sku: formData.sku,
        barcode: formData.barcode,
        category: formData.category,
        costPrice: Number(formData.costPrice),
        salePrice: Number(formData.salePrice),
        stock: Number(formData.stock),
        minStock: Number(formData.minStock),
        unit: formData.unit,
        status: formData.status,
        notes: formData.notes,
        imageUrl: formData.imageUrl,
        productType: formData.productType,
        specs3D: formData.specs3D,
      });
    } else {
      addProduct({
        name: formData.name,
        sku: formData.sku,
        barcode: formData.barcode,
        category: formData.category,
        costPrice: Number(formData.costPrice),
        salePrice: Number(formData.salePrice),
        stock: Number(formData.stock),
        minStock: Number(formData.minStock),
        unit: formData.unit,
        status: formData.status,
        notes: formData.notes,
        imageUrl: formData.imageUrl,
        productType: formData.productType,
        specs3D: formData.specs3D,
      });
    }
    setIsFormOpen(false);
  };

  const handleOpenAdjust = (p: Product) => {
    setAdjustTarget(p);
    setAdjustDelta(1);
    setAdjustType('IN');
    setAdjustReason('Entrada de Fornecedor');
    setIsAdjustOpen(true);
  };

  const handleConfirmAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTarget) return;

    const delta = adjustType === 'OUT' ? -Math.abs(adjustDelta) : Math.abs(adjustDelta);
    adjustStock(adjustTarget.id, delta, adjustReason, adjustType);
    setIsAdjustOpen(false);
  };

  const handleExportCSV = () => {
    const headers = 'ID,Nome,SKU,CodigoBarras,Categoria,PrecoCusto,PrecoVenda,Margem,Estoque,EstoqueMinimo,Unidade,Status\n';
    const rows = products
      .map(
        (p) =>
          `"${p.id}","${p.name}","${p.sku}","${p.barcode}","${p.category}",${p.costPrice},${p.salePrice},${calculateMarginPercent(
            p.costPrice,
            p.salePrice
          )}%,${p.stock},${p.minStock},"${p.unit}","${p.status}"`
      )
      .join('\n');

    downloadFile(headers + rows, `catalogo_produtos_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
  };

  const currentMargin = calculateMarginPercent(formData.costPrice, formData.salePrice);
  const currentMarkup = calculateMarkupPercent(formData.costPrice, formData.salePrice);

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Controle de Estoque & Catálogo
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie produtos, preços, margens de lucro e movimentações de estoque.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setProduct3DInitialValues(null);
              setIsPrint3DModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 shadow-xs transition-colors cursor-pointer"
            title="Calcular e Simular Custos e Preços de Peças 3D"
          >
            <Box className="h-3.5 w-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Calculadora 3D</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
            title="Exportar Lista CSV"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          <button
            id="btn-add-product"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 active:scale-98 transition-all"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Novo Produto</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2 border-b-2 px-3.5 py-2 text-xs font-semibold transition-all ${
            activeTab === 'catalog'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Package className="h-3.5 w-3.5" />
          <span>Catálogo de Produtos ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('movements')}
          className={`flex items-center gap-2 border-b-2 px-3.5 py-2 text-xs font-semibold transition-all ${
            activeTab === 'movements'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <History className="h-3.5 w-3.5" />
          <span>Histórico de Movimentações ({stockMovements.length})</span>
        </button>
      </div>

      {activeTab === 'catalog' ? (
        <>
          {/* Filters Bar */}
          <div className="flex flex-col gap-2.5 rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs lg:flex-row lg:items-center lg:justify-between">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, SKU, código de barras (EAN) ou categoria..."
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>

            {/* Category Select */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="ALL">Todas as Categorias</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* Stock Filter Chips */}
              <div className="flex items-center rounded-lg bg-slate-100 p-0.5 text-xs">
                <button
                  onClick={() => setStockFilter('ALL')}
                  className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    stockFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setStockFilter('IN_STOCK')}
                  className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    stockFilter === 'IN_STOCK' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Normal
                </button>
                <button
                  onClick={() => setStockFilter('LOW_STOCK')}
                  className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    stockFilter === 'LOW_STOCK'
                      ? 'bg-amber-100 text-amber-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Baixo
                </button>
                <button
                  onClick={() => setStockFilter('OUT_OF_STOCK')}
                  className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    stockFilter === 'OUT_OF_STOCK'
                      ? 'bg-rose-100 text-rose-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Esgotado
                </button>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-2.5">Produto / Identificação</th>
                    <th className="px-4 py-2.5">Categoria</th>
                    <th className="px-4 py-2.5 text-right">Preço Custo</th>
                    <th className="px-4 py-2.5 text-right">Preço Venda</th>
                    <th className="px-4 py-2.5 text-center">Margem (%)</th>
                    <th className="px-4 py-2.5 text-center">Estoque Atual</th>
                    <th className="px-4 py-2.5 text-center">Status</th>
                    <th className="px-4 py-2.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Nenhum produto encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const margin = calculateMarginPercent(p.costPrice, p.salePrice);
                      const isLow = p.stock > 0 && p.stock <= p.minStock;
                      const isOut = p.stock === 0;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Product Info */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              {p.imageUrl ? (
                                <img
                                  src={p.imageUrl}
                                  alt={p.name}
                                  referrerPolicy="no-referrer"
                                  className="h-9 w-9 shrink-0 rounded-md object-cover border border-slate-200"
                                />
                              ) : (
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500 font-semibold">
                                  {p.name.charAt(0)}
                                </div>
                              )}
                              <div className="max-w-[220px]">
                                <p className="font-semibold text-slate-900 leading-tight truncate">{p.name}</p>
                                <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                                  <span>SKU: {p.sku}</span>
                                  <span>•</span>
                                  <span>EAN: {p.barcode}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="px-4 py-3">
                            {p.productType === '3D_PRINT' || p.category === 'Peças 3D & Impressão 3D' ? (
                              <span className="inline-flex items-center gap-1 rounded bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                                <Box className="h-3 w-3" />
                                Peça 3D
                              </span>
                            ) : (
                              <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                                {p.category}
                              </span>
                            )}
                          </td>

                          {/* Cost */}
                          <td className="px-4 py-3 text-right font-mono text-slate-500 text-[11px]">
                            {p.productType === '3D_PRINT' ? (
                              <span className="text-slate-400 italic">Por Filamento</span>
                            ) : (
                              formatCurrency(p.costPrice)
                            )}
                          </td>

                          {/* Sale Price */}
                          <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900">
                            {p.productType === '3D_PRINT' ? (
                              <span className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 border border-indigo-200">
                                <Sparkles className="h-3 w-3 text-indigo-600" />
                                Preço Variado
                              </span>
                            ) : (
                              formatCurrency(p.salePrice)
                            )}
                          </td>

                          {/* Margin */}
                          <td className="px-4 py-3 text-center">
                            {p.productType === '3D_PRINT' ? (
                              <span className="rounded-full px-2 py-0.5 font-bold text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                                Margem Dinâmica
                              </span>
                            ) : (
                              <span
                                className={`rounded-full px-2 py-0.5 font-semibold text-[10px] ${
                                  margin >= 40
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : margin >= 20
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {margin}%
                              </span>
                            )}
                          </td>

                          {/* Stock */}
                          <td className="px-4 py-3 text-center">
                            <div className="flex flex-col items-center">
                              {p.productType === '3D_PRINT' ? (
                                <span className="font-semibold text-xs text-indigo-700 bg-indigo-50/50 px-1.5 py-0.5 rounded">
                                  Sob Encomenda
                                </span>
                              ) : (
                                <>
                                  <span
                                    className={`font-semibold font-mono text-xs ${
                                      isOut
                                        ? 'text-rose-600'
                                        : isLow
                                        ? 'text-amber-600'
                                        : 'text-slate-800'
                                    }`}
                                  >
                                    {p.stock} {p.unit}
                                  </span>
                                  <span className="text-[9px] text-slate-400">Mín: {p.minStock}</span>
                                </>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                p.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-500 border border-slate-200'
                              }`}
                            >
                              {p.status === 'active' ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenAdjust(p)}
                                className="rounded-md border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                                title="Ajustar Estoque (+ / -)"
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                              </button>

                              <button
                                onClick={() => handleOpenEdit(p)}
                                className="rounded-md border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                                title="Editar Produto"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>

                              {currentUser.role !== 'VENDEDOR' && (
                                <button
                                  onClick={() => {
                                    if (confirm(`Deseja realmente excluir "${p.name}"?`)) {
                                      deleteProduct(p.id);
                                    }
                                  }}
                                  className="rounded-md border border-slate-200 bg-white p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                  title="Excluir Produto"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
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
        </>
      ) : (
        /* Stock Movements Audit Log */
        <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900 text-xs">Histórico de Entradas, Saídas e Ajustes</h3>
            <p className="text-[11px] text-slate-500">Rastreabilidade de todas as alterações de saldo no estoque</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-medium text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-2.5">Data / Hora</th>
                  <th className="px-4 py-2.5">Produto</th>
                  <th className="px-4 py-2.5 text-center">Tipo</th>
                  <th className="px-4 py-2.5 text-center">Quantidade</th>
                  <th className="px-4 py-2.5 text-center">Saldo Anterior / Novo</th>
                  <th className="px-4 py-2.5">Motivo / Origem</th>
                  <th className="px-4 py-2.5">Operador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockMovements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400">
                      Nenhuma movimentação registrada.
                    </td>
                  </tr>
                ) : (
                  stockMovements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-2.5 text-slate-500 font-mono text-[11px]">{formatDate(m.date, true)}</td>
                      <td className="px-4 py-2.5 font-medium text-slate-900">{m.productName}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                            m.type === 'IN'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : m.type === 'OUT'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}
                        >
                          {m.type === 'IN' ? 'ENTRADA' : m.type === 'OUT' ? 'SAÍDA' : 'AJUSTE'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center font-semibold font-mono text-xs">
                        {m.type === 'OUT' ? `-${m.quantity}` : `+${m.quantity}`}
                      </td>
                      <td className="px-4 py-2.5 text-center text-slate-500 font-mono text-xs">
                        {m.previousStock} → <span className="font-semibold text-slate-800">{m.newStock}</span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">{m.reason}</td>
                      <td className="px-4 py-2.5 text-slate-500">{m.userName}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Create/Edit Product */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative my-8 w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingProduct ? 'Editar Dados do Produto' : 'Cadastrar Novo Produto'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="mt-3 space-y-3">
              {/* Product Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tipo de Produto / Item
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, productType: 'STANDARD' })}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      formData.productType === 'STANDARD'
                        ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Package className="h-4 w-4" />
                    <span>Produto Padrão</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        productType: '3D_PRINT',
                        category: 'Peças 3D & Impressão 3D',
                        unit: 'UN',
                      })
                    }
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      formData.productType === '3D_PRINT'
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                        : 'border-indigo-200 bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100'
                    }`}
                  >
                    <Box className="h-4 w-4" />
                    <span>Peça 3D (Cálculo Dinâmico)</span>
                  </button>
                </div>
              </div>

              {/* 3D Product Dynamic Pricing Explanatory Banner */}
              {formData.productType === '3D_PRINT' && (
                <div className="rounded-xl bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 border border-indigo-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                      <Sparkles className="h-4 w-4 text-indigo-600" />
                      <span>Precificação Dinâmica Sob Demanda</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Peças 3D possuem custo e preço calculados por filamento (g), tempo de máquina e margem em cada venda/orçamento. Você pode simular valores de referência abaixo.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpen3DCalculatorFromForm}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 text-xs font-bold shadow-xs cursor-pointer shrink-0"
                  >
                    <Box className="h-3.5 w-3.5" />
                    <span>Simulador / Calculadora 3D</span>
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Fone de Ouvido Bluetooth TWS"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Código SKU / Ref
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Código de Barras (EAN-13)
                  </label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria</label>
                  <input
                    type="text"
                    list="product-categories-list"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Ex: Eletrônicos, Vestuário"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <datalist id="product-categories-list">
                    {categories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unidade de Medida</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as UnitType })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    {availableUnits.map((u) => (
                      <option key={u.id} value={u.code}>
                        {u.code} - {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pricing & Real-time Margin Box */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Preço de Custo (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Preço de Venda (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                {/* Real-time calculated indicators */}
                <div className="sm:col-span-2 rounded-lg bg-slate-50 p-2.5 flex items-center justify-around text-xs border border-slate-200/80">
                  <div>
                    <span className="text-slate-500">Lucro Bruto:</span>
                    <span className="ml-1 font-semibold font-mono text-slate-900">
                      {formatCurrency(formData.salePrice - formData.costPrice)}
                    </span>
                  </div>
                  <div className="h-3.5 w-px bg-slate-200"></div>
                  <div>
                    <span className="text-slate-500">Margem:</span>
                    <span className="ml-1 font-bold text-emerald-600">{currentMargin}%</span>
                  </div>
                  <div className="h-3.5 w-px bg-slate-200"></div>
                  <div>
                    <span className="text-slate-500">Markup:</span>
                    <span className="ml-1 font-bold text-slate-900">{currentMarkup}%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estoque Atual
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estoque Mínimo (Alerta)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    URL da Imagem do Produto (Opcional)
                  </label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Observações & Detalhes
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Informações técnicas, garantia ou lote do fornecedor"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 active:scale-98 transition-all"
                >
                  {editingProduct ? 'Salvar Alterações' : 'Cadastrar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quick Stock Adjustment */}
      {isAdjustOpen && adjustTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-xl bg-white p-5 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Ajuste de Estoque (+ / -)</h3>
              <button
                onClick={() => setIsAdjustOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmAdjust} className="mt-3 space-y-3">
              <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200/80">
                <p className="font-semibold text-xs text-slate-900">{adjustTarget.name}</p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Estoque Atual:{' '}
                  <span className="font-semibold text-slate-800">
                    {adjustTarget.stock} {adjustTarget.unit}
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Movimento</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('IN')}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border p-2 text-xs font-semibold transition-all ${
                      adjustType === 'IN'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowUp className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Entrada (+)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustType('OUT')}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border p-2 text-xs font-semibold transition-all ${
                      adjustType === 'OUT'
                        ? 'border-rose-600 bg-rose-50 text-rose-800 ring-1 ring-rose-500'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowDown className="h-3.5 w-3.5 text-rose-600" />
                    <span>Saída (-)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantidade a Ajustar ({adjustTarget.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(parseInt(e.target.value) || 1)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Motivo do Ajuste</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="Entrada de Fornecedor">Entrada de Fornecedor / Compra</option>
                  <option value="Ajuste de Contagem de Inventário">Ajuste de Inventário / Balanço</option>
                  <option value="Perda / Avaria / Vencimento">Perda / Avaria / Danificado</option>
                  <option value="Devolução de Cliente">Devolução de Cliente</option>
                  <option value="Uso e Consumo Interno">Uso e Consumo Interno</option>
                </select>
              </div>

              <div className="rounded-lg bg-slate-50 p-2 text-center text-xs border border-slate-200/80">
                Novo saldo previsto:{' '}
                <span className="font-bold text-slate-900 font-mono">
                  {adjustType === 'IN'
                    ? adjustTarget.stock + adjustDelta
                    : Math.max(0, adjustTarget.stock - adjustDelta)}{' '}
                  {adjustTarget.unit}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAdjustOpen(false)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 active:scale-98 transition-all"
                >
                  Confirmar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Calculadora / Simulador de Peça 3D */}
      <Print3DCalculatorModal
        isOpen={isPrint3DModalOpen}
        onClose={() => {
          setIsPrint3DModalOpen(false);
          setProduct3DInitialValues(null);
        }}
        onConfirm={handleConfirm3DFromModal}
        initialValues={product3DInitialValues}
        title="Calculadora & Simulador de Peça 3D"
        confirmButtonLabel={isFormOpen ? "Aplicar ao Cadastro do Produto" : "Fechar Simulador"}
      />
    </div>
  );
};
