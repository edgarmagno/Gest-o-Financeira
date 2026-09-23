import { Print3DSpecs } from '../types';

export interface Print3DMaterialPreset {
  name: string;
  costPerKg: number;
  description: string;
}

export const PRINT_3D_MATERIAL_PRESETS: Record<string, Print3DMaterialPreset> = {
  PLA: {
    name: 'PLA (Padrão)',
    costPerKg: 110,
    description: 'Fácil impressão, acabamento detalhado, ideal para colecionáveis e decorações',
  },
  'PLA Silk': {
    name: 'PLA Silk / Metalizado',
    costPerKg: 145,
    description: 'Brilho acetinado de alta qualidade para peças decorativas e troféus',
  },
  PETG: {
    name: 'PETG (Resistente)',
    costPerKg: 125,
    description: 'Resistência térmica e mecânica superior, suporta impacto e umidade',
  },
  ABS: {
    name: 'ABS (Técnico)',
    costPerKg: 115,
    description: 'Alta resistência mecânica, acabamento com vapor de acetona',
  },
  TPU: {
    name: 'TPU (Flexível)',
    costPerKg: 160,
    description: 'Emborrachado flexível para capas, batentes e amortecedores',
  },
  RESINA: {
    name: 'Resina UV (Alta Precisão)',
    costPerKg: 185,
    description: 'Altíssima definição e riqueza de detalhes para miniaturas e joias',
  },
};

export const MARGIN_PRESETS = [
  { percent: 50, label: 'Econômica (50%)', markup: '100%', tag: 'Básica' },
  { percent: 65, label: 'Recomendada (65%)', markup: '185%', tag: 'Alta Margem' },
  { percent: 75, label: 'Premium (75%)', markup: '300%', tag: 'Alta Rentabilidade' },
  { percent: 85, label: 'Exclusiva (85%)', markup: '566%', tag: 'Peças Complexas' },
];

export interface Print3DCalculationInput {
  modelName: string;
  filamentType: string;
  filamentGrams: number;
  filamentCostPerKg: number;
  printHours: number;
  printMinutes: number;
  machineHourlyCost: number; // Energia + desgaste/depreciação da impressora
  finishingCost: number; // Mão de obra para suporte, lixamento, preparação
  failMarginPercent: number; // Risco de falha / perda (ex: 10%)
  profitMarginPercent: number; // Margem de lucro desejada (ex: 65%)
  customPriceOverride?: number; // Preço manual se o usuário quiser alterar
  notes?: string;
}

export interface Print3DCalculationResult {
  filamentCost: number;
  machineCost: number;
  finishingCost: number;
  totalPrintHours: number;
  directCost: number;
  failCost: number;
  totalCost: number;
  suggestedPrice: number;
  finalUnitPrice: number;
  profitAmount: number;
  markupPercent: number;
  effectiveMarginPercent: number;
  specs: Print3DSpecs;
}

/**
 * Realiza o cálculo preciso de custos e precificação dinâmica para Peças 3D
 */
export function calculatePrint3DPrice(input: Print3DCalculationInput): Print3DCalculationResult {
  const grams = Math.max(0, input.filamentGrams || 0);
  const costKg = Math.max(0, input.filamentCostPerKg || 0);
  const hours = Math.max(0, input.printHours || 0);
  const minutes = Math.max(0, input.printMinutes || 0);
  const hourlyRate = Math.max(0, input.machineHourlyCost || 0);
  const prep = Math.max(0, input.finishingCost || 0);
  const failRate = Math.max(0, input.failMarginPercent ?? 10);
  const marginPct = Math.max(5, Math.min(95, input.profitMarginPercent ?? 65));

  // 1. Custo de Filamento
  const filamentCost = (grams / 1000) * costKg;

  // 2. Tempo total de Máquina (em horas decimais)
  const totalPrintHours = hours + (minutes / 60);

  // 3. Custo de Máquina (Energia + Desgaste + Depreciação)
  const machineCost = totalPrintHours * hourlyRate;

  // 4. Custo Direto (Matéria prima + Máquina + Mão de obra/Acabamento)
  const directCost = filamentCost + machineCost + prep;

  // 5. Margem de Risco de Falha de Impressão (ex: 10% sobre custos diretos)
  const failCost = directCost * (failRate / 100);

  // 6. Custo Total de Fabricação Unitário
  const totalCost = directCost + failCost;

  // 7. Preço Sugerido com Margem de Lucro (% sobre o preço de venda)
  // Preço = Custo / (1 - Margem%)
  let suggestedPrice = 0;
  if (totalCost > 0) {
    suggestedPrice = totalCost / (1 - (marginPct / 100));
    // Arredonda para 2 casas
    suggestedPrice = Math.round(suggestedPrice * 100) / 100;
  }

  // 8. Preço Final (pode ser sobrescrito pelo usuário se desejar um valor exato ou arredondado)
  const finalUnitPrice =
    input.customPriceOverride !== undefined && input.customPriceOverride > 0
      ? input.customPriceOverride
      : suggestedPrice;

  // 9. Lucro e Margens Reais Efetivas
  const profitAmount = Math.max(0, finalUnitPrice - totalCost);
  const markupPercent = totalCost > 0 ? ((finalUnitPrice - totalCost) / totalCost) * 100 : 0;
  const effectiveMarginPercent = finalUnitPrice > 0 ? ((finalUnitPrice - totalCost) / finalUnitPrice) * 100 : 0;

  const specs: Print3DSpecs = {
    modelName: input.modelName || 'Peça Impressa em 3D',
    filamentType: input.filamentType || 'PLA',
    filamentGrams: grams,
    filamentCostPerKg: costKg,
    printHours: hours,
    printMinutes: minutes,
    machineHourlyCost: hourlyRate,
    finishingCost: prep,
    failMarginPercent: failRate,
    profitMarginPercent: marginPct,
    calculatedCost: Math.round(totalCost * 100) / 100,
    suggestedPrice,
    finalUnitPrice: Math.round(finalUnitPrice * 100) / 100,
    notes: input.notes,
  };

  return {
    filamentCost: Math.round(filamentCost * 100) / 100,
    machineCost: Math.round(machineCost * 100) / 100,
    finishingCost: Math.round(prep * 100) / 100,
    totalPrintHours: Math.round(totalPrintHours * 100) / 100,
    directCost: Math.round(directCost * 100) / 100,
    failCost: Math.round(failCost * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    suggestedPrice,
    finalUnitPrice: Math.round(finalUnitPrice * 100) / 100,
    profitAmount: Math.round(profitAmount * 100) / 100,
    markupPercent: Math.round(markupPercent),
    effectiveMarginPercent: Math.round(effectiveMarginPercent),
    specs,
  };
}
