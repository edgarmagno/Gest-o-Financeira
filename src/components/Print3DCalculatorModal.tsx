import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Box,
  Check,
  Clock,
  DollarSign,
  Info,
  Layers,
  Percent,
  Plus,
  Scale,
  Sparkles,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import {
  calculatePrint3DPrice,
  MARGIN_PRESETS,
  PRINT_3D_MATERIAL_PRESETS,
  Print3DCalculationResult,
} from '../utils/pricing3D';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { Print3DSpecs } from '../types';

interface Print3DCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    name: string;
    quantity: number;
    unitPrice: number;
    costPrice: number;
    specs: Print3DSpecs;
    notes?: string;
  }) => void;
  initialValues?: Partial<{
    name: string;
    filamentType: string;
    filamentGrams: number;
    printHours: number;
    printMinutes: number;
    quantity: number;
    notes: string;
  }>;
  title?: string;
  confirmButtonLabel?: string;
}

export const Print3DCalculatorModal: React.FC<Print3DCalculatorModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialValues,
  title = 'Calculadora de Peça 3D (Precificação Dinâmica)',
  confirmButtonLabel = 'Adicionar Item',
}) => {
  if (!isOpen) return null;

  // Form states
  const [modelName, setModelName] = useState(initialValues?.name || '');
  const [filamentType, setFilamentType] = useState(initialValues?.filamentType || 'PLA');
  const [filamentGrams, setFilamentGrams] = useState<number>(initialValues?.filamentGrams || 65);
  const [filamentCostPerKg, setFilamentCostPerKg] = useState<number>(
    PRINT_3D_MATERIAL_PRESETS[initialValues?.filamentType || 'PLA']?.costPerKg || 110
  );
  const [printHours, setPrintHours] = useState<number>(initialValues?.printHours || 4);
  const [printMinutes, setPrintMinutes] = useState<number>(initialValues?.printMinutes || 15);
  const [machineHourlyCost, setMachineHourlyCost] = useState<number>(3.5);
  const [finishingCost, setFinishingCost] = useState<number>(5.0);
  const [failMarginPercent, setFailMarginPercent] = useState<number>(10);
  const [profitMarginPercent, setProfitMarginPercent] = useState<number>(65); // Margem recomendada padrão 65%
  const [quantity, setQuantity] = useState<number>(initialValues?.quantity || 1);
  const [customPriceInput, setCustomPriceInput] = useState<string>('');
  const [notes, setNotes] = useState(initialValues?.notes || '');
  const [isManualPriceActive, setIsManualPriceActive] = useState(false);

  // When material type changes, automatically set recommended filament cost/kg
  const handleMaterialChange = (mat: string) => {
    setFilamentType(mat);
    if (PRINT_3D_MATERIAL_PRESETS[mat]) {
      setFilamentCostPerKg(PRINT_3D_MATERIAL_PRESETS[mat].costPerKg);
    }
  };

  // Parse custom price
  const parseDecimal = (val: string): number | undefined => {
    if (!val) return undefined;
    const clean = val.replace(/\s/g, '').replace(',', '.');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? undefined : parsed;
  };

  const customOverride = isManualPriceActive ? parseDecimal(customPriceInput) : undefined;

  // Real-time calculation
  const calcResult: Print3DCalculationResult = calculatePrint3DPrice({
    modelName: modelName.trim() || 'Peça 3D Sob Medida',
    filamentType,
    filamentGrams,
    filamentCostPerKg,
    printHours,
    printMinutes,
    machineHourlyCost,
    finishingCost,
    failMarginPercent,
    profitMarginPercent,
    customPriceOverride: customOverride,
    notes,
  });

  const handleApplyPresetMargin = (presetPct: number) => {
    setProfitMarginPercent(presetPct);
    setIsManualPriceActive(false);
    setCustomPriceInput('');
  };

  const handleCustomPriceChange = (val: string) => {
    setCustomPriceInput(val);
    setIsManualPriceActive(true);
  };

  const handleResetToCalculated = () => {
    setIsManualPriceActive(false);
    setCustomPriceInput('');
  };

  const handleConfirm = () => {
    const finalName = modelName.trim() || `Peça 3D (${filamentGrams}g ${filamentType})`;
    onConfirm({
      name: finalName,
      quantity: Math.max(1, quantity),
      unitPrice: calcResult.finalUnitPrice,
      costPrice: calcResult.totalCost,
      specs: {
        ...calcResult.specs,
        modelName: finalName,
        notes: notes.trim(),
      },
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-400/30">
              <Box className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight text-white">{title}</h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-500/30">
                  <Sparkles className="h-2.5 w-2.5" />
                  Preço Sob Medida
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Precificação por peso de filamento, horas de máquina e margem ajustável
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* 1. Nome da Peça e Material */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Nome / Descrição da Peça 3D <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="Ex: Action Figure 15cm, Suporte Gamer, Engrenagem"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Quantidade
              </label>
              <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5">
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-xs font-bold text-slate-900 dark:text-white bg-transparent focus:outline-hidden text-center"
                />
                <span className="text-[11px] font-semibold text-slate-400 ml-1">un</span>
              </div>
            </div>
          </div>

          {/* Seleção de Filamento */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Material / Tipo de Filamento
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Carretel: {formatCurrency(filamentCostPerKg)}/kg
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {Object.keys(PRINT_3D_MATERIAL_PRESETS).map((mat) => {
                const isSelected = filamentType === mat;
                return (
                  <button
                    key={mat}
                    type="button"
                    onClick={() => handleMaterialChange(mat)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{mat}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                      R$ {PRINT_3D_MATERIAL_PRESETS[mat].costPerKg}/kg
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Parâmetros de Peso e Tempo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            {/* Peso do Filamento */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <Scale className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Peso do Filamento (g)</span>
                </label>
                <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                  Custo: {formatCurrency(calcResult.filamentCost)}
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={filamentGrams}
                  onChange={(e) => setFilamentGrams(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="Ex: 65"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">gramas</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Peso indicado no software fatiador (Cura, PrusaSlicer, Bambu Studio)
              </p>
            </div>

            {/* Tempo de Impressão */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <Clock className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Tempo de Impressão</span>
                </label>
                <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                  Máq.: {formatCurrency(calcResult.machineCost)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={printHours}
                    onChange={(e) => setPrintHours(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 px-3 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                  />
                  <span className="absolute right-2.5 top-2.5 text-xs text-slate-400 font-semibold">horas</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={printMinutes}
                    onChange={(e) => setPrintMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 px-3 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                  />
                  <span className="absolute right-2.5 top-2.5 text-xs text-slate-400 font-semibold">min</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Tempo total de máquina: {printHours}h {printMinutes}m ({calcResult.totalPrintHours}h)
              </p>
            </div>
          </div>

          {/* 3. Custos Operacionais & Detalhamento */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hora Máq. + Energia (R$/h)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-[11px] font-bold text-slate-400">R$</span>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={machineHourlyCost}
                  onChange={(e) => setMachineHourlyCost(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-1.5 pl-8 pr-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <span className="text-[10px] text-slate-400">Depreciação + Luz (~200W)</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Acabamento / Suporte (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-[11px] font-bold text-slate-400">R$</span>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={finishingCost}
                  onChange={(e) => setFinishingCost(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-1.5 pl-8 pr-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <span className="text-[10px] text-slate-400">Remoção de suporte / lixa</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Margem de Falha (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="50"
                  value={failMarginPercent}
                  onChange={(e) => setFailMarginPercent(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-1.5 px-3 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">%</span>
              </div>
              <span className="text-[10px] text-slate-400">Cobre perdas/impressões com erro</span>
            </div>
          </div>

          {/* 4. Seleção da Margem de Lucro */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Percent className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Margem de Lucro Desejada (Ganho Acima do Custo)</span>
              </label>
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                {profitMarginPercent}% (Markup: {calcResult.markupPercent}%)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {MARGIN_PRESETS.map((preset) => {
                const isActive = profitMarginPercent === preset.percent && !isManualPriceActive;
                return (
                  <button
                    key={preset.percent}
                    type="button"
                    onClick={() => handleApplyPresetMargin(preset.percent)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isActive
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-200 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{preset.percent}%</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                          preset.percent >= 65
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {preset.tag}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      Markup {preset.markup}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Slider de ajuste fino */}
            <input
              type="range"
              min="20"
              max="90"
              step="1"
              value={profitMarginPercent}
              onChange={(e) => {
                setProfitMarginPercent(parseInt(e.target.value));
                setIsManualPriceActive(false);
                setCustomPriceInput('');
              }}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          {/* 5. Painel Resumo Financeiro & Preço de Venda */}
          <div className="rounded-2xl border-2 border-indigo-200 dark:border-indigo-800/80 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/70 dark:from-indigo-950/40 dark:via-slate-850 dark:to-purple-950/30 p-4 sm:p-5 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-indigo-100 dark:border-indigo-900/60">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Custo Total de Fabricação:
                </span>
                <p className="text-base font-black text-rose-600 dark:text-rose-400">
                  {formatCurrency(calcResult.totalCost)}
                </p>
                <div className="text-[10px] text-slate-500 mt-0.5 space-y-0.5">
                  <p>Filamento: {formatCurrency(calcResult.filamentCost)}</p>
                  <p>Máquina & Luz: {formatCurrency(calcResult.machineCost)}</p>
                  <p>Acabamento/Perda: {formatCurrency(calcResult.finishingCost + calcResult.failCost)}</p>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Lucro Líquido Unitário:
                </span>
                <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
                  +{formatCurrency(calcResult.profitAmount)}
                </p>
                <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
                  Markup: {calcResult.markupPercent}% sobre o custo
                </p>
                <p className="text-[10px] text-slate-500">
                  Margem Líquida: {calcResult.effectiveMarginPercent}%
                </p>
              </div>

              <div className="sm:border-l sm:border-indigo-100 dark:sm:border-indigo-900/60 sm:pl-4">
                <span className="text-[11px] font-bold text-indigo-950 dark:text-indigo-200">
                  Preço Sugerido com Margem:
                </span>
                <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                  {formatCurrency(calcResult.suggestedPrice)}
                </p>
                <p className="text-[10px] text-slate-500">
                  {quantity > 1 ? `Total (${quantity} un): ${formatCurrency(calcResult.suggestedPrice * quantity)}` : 'Preço por unidade'}
                </p>
              </div>
            </div>

            {/* Ajuste Livre do Preço Final */}
            <div className="pt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Preço Unitário Aplicado na Proposta/Venda (R$)
                </label>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Você pode usar o preço sugerido ou digitar um valor redondo para o cliente
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-36">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">R$</span>
                  <input
                    type="text"
                    value={isManualPriceActive ? customPriceInput : calcResult.suggestedPrice.toFixed(2)}
                    onChange={(e) => handleCustomPriceChange(e.target.value)}
                    placeholder={calcResult.suggestedPrice.toFixed(2)}
                    className="w-full rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 py-2 pl-9 pr-3 text-sm font-black text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600 text-right"
                  />
                </div>
                {isManualPriceActive && (
                  <button
                    type="button"
                    onClick={handleResetToCalculated}
                    className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline px-1 py-1"
                    title="Restaurar preço sugerido pelo cálculo"
                  >
                    Restaurar
                  </button>
                )}
              </div>
            </div>

            {quantity > 1 && (
              <div className="mt-3 pt-3 border-t border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                <span>Subtotal ({quantity} unidades):</span>
                <span className="text-base text-indigo-600 dark:text-indigo-400 font-black">
                  {formatCurrency(calcResult.finalUnitPrice * quantity)}
                </span>
              </div>
            )}
          </div>

          {/* Observações / Especificações extras */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observações da Peça (cor, resolução de camada, pós-acabamento, link do STL)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Cor preta fosca, camada 0.16mm, suporte de árvore, pintura manual"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Total do Item:{' '}
            <span className="font-black text-slate-900 dark:text-white">
              {formatCurrency(calcResult.finalUnitPrice * quantity)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2 text-xs font-bold text-white shadow-sm transition-all cursor-pointer"
            >
              <Check className="h-4 w-4" />
              <span>{confirmButtonLabel}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
