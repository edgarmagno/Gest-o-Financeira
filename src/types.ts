export type UserRole = 'ADMIN' | 'GERENTE' | 'VENDEDOR';

export interface User {
  id: string;
  uid?: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  photoURL?: string;
  password?: string;
  isAnonymous?: boolean;
  provider?: string;
  createdAt?: string;
}

export type UnitType = 'UN' | 'KG' | 'CX' | 'PCT' | 'PAR' | 'L' | 'M';

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  unit: UnitType;
  status: 'active' | 'inactive';
  notes?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  date: string;
  userName: string;
}

export interface Customer {
  id: string;
  name: string;
  document: string; // CPF or CNPJ
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  notes?: string;
  totalSpent: number;
  ordersCount: number;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  sku: string;
  unit: UnitType;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  discount: number;
  subtotal: number;
}

export type PaymentMethod =
  | 'PIX'
  | 'DINHEIRO'
  | 'CREDITO'
  | 'DEBITO'
  | 'BOLETO'
  | 'FIADO'
  | 'TRANSFERENCIA'
  | 'VALE_ALIMENTACAO'
  | 'CARNE'
  | string;

export interface CustomPaymentMethod {
  id: string;
  code: string;
  name: string;
  active: boolean;
  feePercent?: number; // taxa cobrada pela maquininha/gateway (%)
  dueDays?: number; // prazo de compensação em dias
  maxInstallments?: number; // parcelamento máximo permitido
  allowChange?: boolean; // aceita troco (ex: Dinheiro)
  description?: string;
}

export interface CustomUnit {
  id: string;
  code: string;
  name: string;
  allowsDecimal: boolean;
}

export interface CustomBankAccount {
  id: string;
  name: string;
  bankName?: string;
  accountNumber?: string;
  initialBalance?: number;
  type: 'CAIXA' | 'CONTA_CORRENTE' | 'POUPANCA' | 'CARTEIRA_DIGITAL';
  active: boolean;
}

export interface Sale {
  id: string;
  code: string;
  customerId?: string;
  customerName: string;
  customerDocument?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  costTotal: number;
  profit: number;
  paymentMethod: PaymentMethod;
  installments?: number;
  amountPaid?: number;
  change?: number;
  sellerId: string;
  sellerName: string;
  status: 'COMPLETED' | 'CANCELLED';
  notes?: string;
  createdAt: string;
}

export type QuoteStatus = 'RASCUNHO' | 'ENVIADO' | 'APROVADO' | 'REJEITADO' | 'CONVERTIDO';

export interface Quote {
  id: string;
  code: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerDocument?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  validityDays: number;
  status: QuoteStatus;
  notes?: string;
  convertedSaleId?: string;
  createdAt: string;
}

export type TransactionType = 'INCOME' | 'EXPENSE';
export type TransactionStatus = 'PAID' | 'PENDING';

export interface FinancialTransaction {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  category: string;
  date: string;
  dueDate?: string;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  relatedSaleId?: string;
  notes?: string;
  createdAt: string;
}

export type ProductionStatus =
  | 'PENDENTE'
  | 'EM_PRODUCAO'
  | 'PRONTO'
  | 'ENTREGUE'
  | 'CANCELADO';

export type ProductionPriority = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';

export type ProductionType =
  | 'PERSONALIZACAO'
  | 'SUBLIMACAO'
  | 'BORDADO'
  | 'SILK_SCREEN'
  | 'CORTE_LASER'
  | 'BRINDES'
  | 'PAPELARIA'
  | 'OUTRO';

export interface ProductionItem {
  productId?: string;
  name: string;
  quantity: number;
  unit?: UnitType;
  specs?: string; // Detalhes da personalização (nome, tema, estampa, cor, tamanho)
  unitCost?: number;
  unitPrice?: number;
}

export interface ProductionMaterial {
  productId?: string;
  productName?: string;
  name?: string;
  quantity: number;
  unit: string;
  unitCost?: number;
  deductedFromStock: boolean;
}

export interface ProductionOrderLog {
  id: string;
  stage: string;
  date: string;
  userName: string;
  comment: string;
}

export interface ProductionOrder {
  id: string;
  code: string; // Ex: PED-20260827-001 ou OP-001
  title: string; // Produto principal ou resumo
  productName?: string; // Produto personalizado
  quantity: number; // Quantidade de itens
  customDetails?: string; // Tema, arte, nome a estampar, cor, etc.
  type?: ProductionType;
  priority: ProductionPriority;
  status: ProductionStatus;
  customerId?: string;
  customerName?: string; // Nome do Cliente
  customerPhone?: string; // WhatsApp
  customerDocument?: string;
  relatedQuoteId?: string;
  relatedQuoteCode?: string;
  relatedSaleId?: string;
  relatedSaleCode?: string;
  responsibleName?: string;
  items?: ProductionItem[];
  materials?: ProductionMaterial[];
  startDate?: string;
  deadlineDate?: string;
  completedDate?: string;
  progressPercent?: number;
  estimatedCost?: number;
  totalValue: number; // Valor Total
  notes?: string;
  logs?: ProductionOrderLog[];
  createdAt: string;
  updatedAt: string;
}

export interface CompanySettings {
  tradeName: string; // Nome Fantasia
  corporateName: string; // Razão Social
  cnpj: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  receiptFooterMessage: string;
  taxRatePercent: number;
  currency: string;
  cloudSyncEnabled: boolean;
  lastCloudBackup?: string;

  // Cadastros e Tabelas Auxiliares do Sistema
  paymentMethods?: CustomPaymentMethod[];
  productCategories?: string[];
  unitsOfMeasurement?: CustomUnit[];
  expenseCategories?: string[];
  incomeCategories?: string[];
  salesChannels?: string[];

  // Parâmetros Operacionais e Regras de Negócio
  maxDiscountPercent?: number; // Limite de desconto % sem autorização
  defaultQuoteValidityDays?: number; // Validade padrão de orçamentos (dias)
  defaultMinStockAlert?: number; // Alerta padrão de estoque mínimo
  printReceiptAutomatically?: boolean;

  // Personalização de Logotipos para Documentos e Cupons
  logoUrl?: string; // Logotipo Principal da Empresa
  receiptLogoUrl?: string; // Logotipo específico para Recibos / Cupons (opcional)
  quoteLogoUrl?: string; // Logotipo específico para Propostas / Orçamentos (opcional)
  showLogoOnReceipt?: boolean; // Exibir logo no recibo / cupom fiscal/não-fiscal
  showLogoOnQuote?: boolean; // Exibir logo na proposta / orçamento
  logoPosition?: 'left' | 'center' | 'right'; // Alinhamento no cabeçalho
  receiptLogoSize?: 'sm' | 'md' | 'lg'; // Tamanho no recibo (pequeno, médio, grande)
  quoteLogoSize?: 'sm' | 'md' | 'lg'; // Tamanho na proposta (pequeno, médio, grande)

  // Personalização Visual e Aparência
  appearance?: AppearanceSettings;
}

export type BaseTheme = 'light' | 'dark' | 'midnight' | 'system';
export type AccentColor = 'indigo' | 'emerald' | 'blue' | 'violet' | 'rose' | 'amber' | 'cyan' | 'slate';
export type SidebarStyle = 'dark' | 'dynamic' | 'accent';
export type LayoutDensity = 'comfortable' | 'compact';
export type FontScale = 'compact' | 'normal' | 'large';
export type BorderRadiusStyle = 'straight' | 'smooth' | 'modern';

export interface AppearanceSettings {
  baseTheme: BaseTheme;
  accentColor: AccentColor;
  sidebarStyle: SidebarStyle;
  density: LayoutDensity;
  fontScale: FontScale;
  borderRadius: BorderRadiusStyle;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'WARNING' | 'INFO' | 'SUCCESS' | 'ALERT';
  date: string;
  read: boolean;
  linkModule?: string;
}

export interface AppBackupData {
  version: string;
  exportedAt: string;
  company: CompanySettings;
  products: Product[];
  stockMovements: StockMovement[];
  customers: Customer[];
  sales: Sale[];
  quotes: Quote[];
  productionOrders?: ProductionOrder[];
  transactions: FinancialTransaction[];
  users: User[];
}
