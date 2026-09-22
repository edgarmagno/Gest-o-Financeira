import React, { useRef, useState, useEffect } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlertTriangle,
  ArrowRight,
  Building2,
  Check,
  CheckCircle,
  Clock,
  Cloud,
  Contrast,
  CreditCard,
  Database,
  DollarSign,
  Download,
  Edit2,
  ExternalLink,
  Eye,
  FileImage,
  FileJson,
  FileText,
  Image as ImageIcon,
  Landmark,
  Layers,
  Layout,
  Maximize2,
  Monitor,
  Moon,
  Package,
  Paintbrush,
  Palette,
  Percent,
  Plus,
  Printer,
  Receipt,
  RefreshCw,
  Save,
  Scale,
  ShieldCheck,
  ShoppingBag,
  Sliders,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Square,
  Store,
  Sun,
  Tag,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Type,
  Upload,
  UserCheck,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  AccentColor,
  AppearanceSettings,
  BaseTheme,
  BorderRadiusStyle,
  CompanySettings,
  CustomPaymentMethod,
  CustomUnit,
  FontScale,
  LayoutDensity,
  Quote,
  Sale,
  SidebarStyle,
  UserRole,
} from '../types';
import {
  DEFAULT_APPEARANCE,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_PAYMENT_METHODS,
  DEFAULT_PRODUCT_CATEGORIES,
  DEFAULT_SALES_CHANNELS,
  DEFAULT_UNITS,
} from '../data/initialData';
import { downloadFile, formatCurrency } from '../utils/formatters';

type SettingsTab =
  | 'company'
  | 'payment_methods'
  | 'catalog_settings'
  | 'finance_settings'
  | 'pos_channels'
  | 'team'
  | 'appearance'
  | 'backup';

export const SettingsModule: React.FC = () => {
  const {
    company,
    updateCompany,
    products,
    users,
    addUserMember,
    deleteUserMember,
    currentUser,
    exportBackupJSON,
    importBackupJSON,
    loadDemoSeedData,
    clearAllCloudData,
    isDarkMode,
    toggleDarkMode,
    appearance,
    updateAppearance,
    setReceiptSale,
    setReceiptQuote,
  } = useApp();

  const [activeTab, setActiveTab] = useState<SettingsTab>('company');

  // Company Form State
  const [companyForm, setCompanyForm] = useState<CompanySettings>({ ...company });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [previewDocType, setPreviewDocType] = useState<'receipt' | 'quote'>('receipt');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const mainLogoInputRef = useRef<HTMLInputElement | null>(null);
  const receiptLogoInputRef = useRef<HTMLInputElement | null>(null);
  const quoteLogoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setCompanyForm({ ...company });
  }, [company]);

  const showSaveNotice = (msg = 'Salvo com sucesso na nuvem!') => {
    setSaveMessage(msg);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSaveAllCompanySettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await updateCompany(companyForm);
    showSaveNotice('Configurações da empresa e logotipos atualizados!');
  };

  // Helper to convert and optimize image file to Base64 data URL via Canvas
  const processImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, SVG, WebP).');
        reject(new Error('Invalid image file'));
        return;
      }

      if (file.type === 'image/svg+xml') {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 450;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/png', 0.9);
            resolve(dataUrl);
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (target: 'main' | 'receipt' | 'quote', file: File) => {
    try {
      setIsUploadingLogo(true);
      const dataUrl = await processImageFile(file);
      if (target === 'main') {
        setCompanyForm((prev) => ({ ...prev, logoUrl: dataUrl }));
      } else if (target === 'receipt') {
        setCompanyForm((prev) => ({ ...prev, receiptLogoUrl: dataUrl }));
      } else if (target === 'quote') {
        setCompanyForm((prev) => ({ ...prev, quoteLogoUrl: dataUrl }));
      }
      showSaveNotice('Logotipo carregado! Clique em Salvar para fixar na nuvem.');
    } catch {
      // Ignored
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleApplyLogoPreset = (target: 'main' | 'receipt' | 'quote', presetSvg: string) => {
    if (target === 'main') {
      setCompanyForm((prev) => ({ ...prev, logoUrl: presetSvg }));
    } else if (target === 'receipt') {
      setCompanyForm((prev) => ({ ...prev, receiptLogoUrl: presetSvg }));
    } else if (target === 'quote') {
      setCompanyForm((prev) => ({ ...prev, quoteLogoUrl: presetSvg }));
    }
    showSaveNotice('Preset de logotipo aplicado com sucesso!');
  };

  const handleRemoveLogo = (target: 'main' | 'receipt' | 'quote') => {
    if (target === 'main') {
      setCompanyForm((prev) => ({ ...prev, logoUrl: '' }));
    } else if (target === 'receipt') {
      setCompanyForm((prev) => ({ ...prev, receiptLogoUrl: '' }));
    } else if (target === 'quote') {
      setCompanyForm((prev) => ({ ...prev, quoteLogoUrl: '' }));
    }
  };

  // Launch live modal demo for receipt
  const handleLaunchTestReceipt = () => {
    const demoSale: Sale = {
      id: 'demo-sale-receipt',
      code: 'VD-DEMO-2026',
      sellerId: 'demo-seller',
      sellerName: 'Vendedor Exemplo',
      customerId: 'demo-cust',
      customerName: 'Cliente Demonstração LTDA',
      customerDocument: '12.345.678/0001-90',
      items: [
        {
          productId: 'p-demo-1',
          name: 'Produto Exemplo de Alta Qualidade',
          sku: 'PROD-001',
          unit: 'UN',
          quantity: 2,
          unitPrice: 125.0,
          costPrice: 60.0,
          discount: 0,
          subtotal: 250.0,
        },
        {
          productId: 'p-demo-2',
          name: 'Serviço de Garantia & Suporte Especializado',
          sku: 'SRV-002',
          unit: 'UN',
          quantity: 1,
          unitPrice: 85.0,
          costPrice: 15.0,
          discount: 0,
          subtotal: 85.0,
        },
      ],
      subtotal: 335.0,
      discount: 15.0,
      total: 320.0,
      costTotal: 135.0,
      profit: 185.0,
      paymentMethod: 'PIX',
      installments: 1,
      amountPaid: 320.0,
      change: 0,
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
    };
    setReceiptSale(demoSale);
  };

  // Launch live modal demo for quote
  const handleLaunchTestQuote = () => {
    const demoQuote: Quote = {
      id: 'demo-quote-doc',
      code: 'ORC-DEMO-2026',
      customerId: 'demo-cust',
      customerName: 'Empresa Parceira Demonstração S/A',
      customerPhone: '(11) 98765-4321',
      customerEmail: 'comercial@parceira-demo.com.br',
      customerDocument: '12.345.678/0001-90',
      items: [
        {
          productId: 'p-demo-1',
          name: 'Kit Automação Comercial Premium',
          sku: 'KIT-AUTO-01',
          unit: 'UN',
          quantity: 2,
          unitPrice: 650.0,
          costPrice: 380.0,
          discount: 50.0,
          subtotal: 1250.0,
        },
        {
          productId: 'p-demo-2',
          name: 'Licença de Software e Treinamento Equipe',
          sku: 'LIC-TRN-02',
          unit: 'UN',
          quantity: 1,
          unitPrice: 450.0,
          costPrice: 50.0,
          discount: 0,
          subtotal: 450.0,
        },
      ],
      subtotal: 1700.0,
      discount: 50.0,
      total: 1650.0,
      validityDays: companyForm.defaultQuoteValidityDays || 10,
      status: 'ENVIADO',
      notes: 'Proposta com desconto especial para pagamento em até 3x sem juros ou 5% de desconto à vista via PIX.',
      createdAt: new Date().toISOString(),
    };
    setReceiptQuote(demoQuote);
  };

  const LOGO_PRESETS = [
    {
      id: 'modern_pro',
      name: 'Modern Store (Vetor Roxo/Azul)',
      url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 64" width="240" height="64"><rect width="240" height="64" rx="8" fill="%230f172a"/><circle cx="36" cy="32" r="18" fill="%234f46e5"/><path d="M28 32 L34 38 L45 26" stroke="white" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><text x="66" y="36" fill="white" font-family="sans-serif" font-weight="900" font-size="16" letter-spacing="1">PRO•STORE</text><text x="66" y="49" fill="%2394a3b8" font-family="sans-serif" font-weight="600" font-size="8.5" letter-spacing="1.5">SOLUÇÕES COMERCIAIS</text></svg>',
    },
    {
      id: 'corporate_shield',
      name: 'Selo Esmeralda (Corporativo)',
      url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 64" width="240" height="64"><rect width="240" height="64" rx="8" fill="%231e293b"/><path d="M24 18 L36 14 L48 18 V32 C48 40 36 46 36 46 C36 46 24 40 24 32 Z" fill="%23059669"/><text x="36" y="34" fill="white" font-family="sans-serif" font-weight="900" font-size="13" text-anchor="middle">GP</text><text x="64" y="36" fill="white" font-family="sans-serif" font-weight="800" font-size="16">GESTÃO PRO</text><text x="64" y="49" fill="%2334d399" font-family="sans-serif" font-weight="600" font-size="8.5" letter-spacing="1.5">COMÉRCIO &amp; SERVIÇOS</text></svg>',
    },
    {
      id: 'thermal_mono',
      name: 'Monocromático (Ideal Cupom Térmico)',
      url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 64" width="240" height="64"><rect width="240" height="64" rx="4" fill="black"/><rect x="6" y="6" width="228" height="52" fill="none" stroke="white" stroke-width="1.5" stroke-dasharray="4 2"/><text x="120" y="36" fill="white" font-family="monospace" font-weight="900" font-size="17" text-anchor="middle" letter-spacing="2">★ MINHA EMPRESA ★</text><text x="120" y="49" fill="white" font-family="monospace" font-weight="600" font-size="8" text-anchor="middle" letter-spacing="1">CUPOM NÃO FISCAL</text></svg>',
    },
  ];

  // --- TAB 2: Payment Methods States ---
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [paymentForm, setPaymentForm] = useState<Omit<CustomPaymentMethod, 'id'>>({
    name: '',
    code: '',
    active: true,
    feePercent: 0,
    dueDays: 0,
    maxInstallments: 1,
    allowChange: false,
    description: '',
  });

  const handleOpenNewPaymentModal = () => {
    setEditingPaymentId(null);
    setPaymentForm({
      name: '',
      code: '',
      active: true,
      feePercent: 0,
      dueDays: 0,
      maxInstallments: 1,
      allowChange: false,
      description: '',
    });
    setIsPaymentModalOpen(true);
  };

  const handleOpenEditPaymentModal = (pm: CustomPaymentMethod) => {
    setEditingPaymentId(pm.id);
    setPaymentForm({
      name: pm.name,
      code: pm.code,
      active: pm.active,
      feePercent: pm.feePercent || 0,
      dueDays: pm.dueDays || 0,
      maxInstallments: pm.maxInstallments || 1,
      allowChange: !!pm.allowChange,
      description: pm.description || '',
    });
    setIsPaymentModalOpen(true);
  };

  const handleSavePaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.name.trim()) return;

    const currentList = companyForm.paymentMethods || DEFAULT_PAYMENT_METHODS;
    let updatedList: CustomPaymentMethod[];

    if (editingPaymentId) {
      updatedList = currentList.map((item) =>
        item.id === editingPaymentId
          ? { ...item, ...paymentForm, code: (paymentForm.code || paymentForm.name).toUpperCase().replace(/\s+/g, '_') }
          : item
      );
    } else {
      const newMethod: CustomPaymentMethod = {
        id: `pm_${Date.now()}`,
        name: paymentForm.name.trim(),
        code: (paymentForm.code || paymentForm.name).toUpperCase().replace(/\s+/g, '_'),
        active: paymentForm.active,
        feePercent: Number(paymentForm.feePercent) || 0,
        dueDays: Number(paymentForm.dueDays) || 0,
        maxInstallments: Number(paymentForm.maxInstallments) || 1,
        allowChange: paymentForm.allowChange,
        description: paymentForm.description?.trim() || '',
      };
      updatedList = [...currentList, newMethod];
    }

    const updatedSettings = { ...companyForm, paymentMethods: updatedList };
    setCompanyForm(updatedSettings);
    await updateCompany(updatedSettings);
    setIsPaymentModalOpen(false);
    showSaveNotice('Forma de pagamento gravada na nuvem!');
  };

  const handleTogglePaymentActive = async (id: string) => {
    const currentList = companyForm.paymentMethods || DEFAULT_PAYMENT_METHODS;
    const updatedList = currentList.map((item) =>
      item.id === id ? { ...item, active: !item.active } : item
    );
    const updatedSettings = { ...companyForm, paymentMethods: updatedList };
    setCompanyForm(updatedSettings);
    await updateCompany(updatedSettings);
  };

  const handleDeletePaymentMethod = async (id: string, name: string) => {
    if (confirm(`Deseja remover a forma de pagamento "${name}"?`)) {
      const currentList = companyForm.paymentMethods || DEFAULT_PAYMENT_METHODS;
      const updatedList = currentList.filter((item) => item.id !== id);
      const updatedSettings = { ...companyForm, paymentMethods: updatedList };
      setCompanyForm(updatedSettings);
      await updateCompany(updatedSettings);
      showSaveNotice('Forma de pagamento removida!');
    }
  };

  const handleResetPaymentMethodsToDefault = async () => {
    if (confirm('Deseja restaurar as formas de pagamento padrão do sistema?')) {
      const updatedSettings = { ...companyForm, paymentMethods: DEFAULT_PAYMENT_METHODS };
      setCompanyForm(updatedSettings);
      await updateCompany(updatedSettings);
      showSaveNotice('Formas de pagamento restauradas para o padrão!');
    }
  };

  // --- TAB 3: Product Categories & Units ---
  const [newProdCategory, setNewProdCategory] = useState('');
  const [editingCategoryIndex, setEditingCategoryIndex] = useState<number | null>(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState('');

  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [unitForm, setUnitForm] = useState({ code: '', name: '', allowsDecimal: false });

  const handleAddProductCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const cat = newProdCategory.trim();
    if (!cat) return;
    const currentCats = companyForm.productCategories || DEFAULT_PRODUCT_CATEGORIES;
    if (currentCats.includes(cat)) {
      alert('Esta categoria já está cadastrada!');
      return;
    }
    const updatedCats = [...currentCats, cat];
    const updatedSettings = { ...companyForm, productCategories: updatedCats };
    setCompanyForm(updatedSettings);
    await updateCompany(updatedSettings);
    setNewProdCategory('');
    showSaveNotice('Categoria adicionada!');
  };

  const handleUpdateProductCategory = async (index: number) => {
    const val = editingCategoryValue.trim();
    if (!val) return;
    const currentCats = [...(companyForm.productCategories || DEFAULT_PRODUCT_CATEGORIES)];
    currentCats[index] = val;
    const updatedSettings = { ...companyForm, productCategories: currentCats };
    setCompanyForm(updatedSettings);
    await updateCompany(updatedSettings);
    setEditingCategoryIndex(null);
    setEditingCategoryValue('');
    showSaveNotice('Categoria atualizada!');
  };

  const handleDeleteProductCategory = async (catToDelete: string) => {
    if (confirm(`Deseja remover a categoria "${catToDelete}"?`)) {
      const currentCats = companyForm.productCategories || DEFAULT_PRODUCT_CATEGORIES;
      const updatedCats = currentCats.filter((c) => c !== catToDelete);
      const updatedSettings = { ...companyForm, productCategories: updatedCats };
      setCompanyForm(updatedSettings);
      await updateCompany(updatedSettings);
      showSaveNotice('Categoria excluída!');
    }
  };

  const handleAddCustomUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitForm.code.trim() || !unitForm.name.trim()) return;

    const currentUnits = companyForm.unitsOfMeasurement || DEFAULT_UNITS;
    const codeUpper = unitForm.code.trim().toUpperCase();

    if (currentUnits.some((u) => u.code === codeUpper)) {
      alert('Já existe uma unidade com esta sigla/código!');
      return;
    }

    const newUnit: CustomUnit = {
      id: `u_${Date.now()}`,
      code: codeUpper,
      name: unitForm.name.trim(),
      allowsDecimal: unitForm.allowsDecimal,
    };

    const updatedUnits = [...currentUnits, newUnit];
    const updatedSettings = { ...companyForm, unitsOfMeasurement: updatedUnits };
    setCompanyForm(updatedSettings);
    await updateCompany(updatedSettings);
    setIsUnitModalOpen(false);
    setUnitForm({ code: '', name: '', allowsDecimal: false });
    showSaveNotice('Unidade de medida cadastrada!');
  };

  const handleDeleteUnit = async (id: string, code: string) => {
    if (confirm(`Deseja remover a unidade "${code}"?`)) {
      const currentUnits = companyForm.unitsOfMeasurement || DEFAULT_UNITS;
      const updatedUnits = currentUnits.filter((u) => u.id !== id);
      const updatedSettings = { ...companyForm, unitsOfMeasurement: updatedUnits };
      setCompanyForm(updatedSettings);
      await updateCompany(updatedSettings);
      showSaveNotice('Unidade removida!');
    }
  };

  // --- TAB 4: Finance (Expense/Income Categories) ---
  const [newExpenseCat, setNewExpenseCat] = useState('');
  const [newIncomeCat, setNewIncomeCat] = useState('');

  const handleAddExpenseCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const cat = newExpenseCat.trim();
    if (!cat) return;
    const current = companyForm.expenseCategories || DEFAULT_EXPENSE_CATEGORIES;
    if (current.includes(cat)) return;
    const updated = [...current, cat];
    const updatedSettings = { ...companyForm, expenseCategories: updated };
    setCompanyForm(updatedSettings);
    await updateCompany(updatedSettings);
    setNewExpenseCat('');
    showSaveNotice('Categoria de despesa adicionada!');
  };

  const handleDeleteExpenseCategory = async (cat: string) => {
    if (confirm(`Remover categoria de despesa "${cat}"?`)) {
      const current = companyForm.expenseCategories || DEFAULT_EXPENSE_CATEGORIES;
      const updated = current.filter((c) => c !== cat);
      const updatedSettings = { ...companyForm, expenseCategories: updated };
      setCompanyForm(updatedSettings);
      await updateCompany(updatedSettings);
    }
  };

  const handleAddIncomeCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const cat = newIncomeCat.trim();
    if (!cat) return;
    const current = companyForm.incomeCategories || DEFAULT_INCOME_CATEGORIES;
    if (current.includes(cat)) return;
    const updated = [...current, cat];
    const updatedSettings = { ...companyForm, incomeCategories: updated };
    setCompanyForm(updatedSettings);
    await updateCompany(updatedSettings);
    setNewIncomeCat('');
    showSaveNotice('Categoria de receita adicionada!');
  };

  const handleDeleteIncomeCategory = async (cat: string) => {
    if (confirm(`Remover categoria de receita "${cat}"?`)) {
      const current = companyForm.incomeCategories || DEFAULT_INCOME_CATEGORIES;
      const updated = current.filter((c) => c !== cat);
      const updatedSettings = { ...companyForm, incomeCategories: updated };
      setCompanyForm(updatedSettings);
      await updateCompany(updatedSettings);
    }
  };

  // --- TAB 5: Sales Channels & POS Parameters ---
  const [newChannel, setNewChannel] = useState('');

  const handleAddSalesChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    const ch = newChannel.trim();
    if (!ch) return;
    const current = companyForm.salesChannels || DEFAULT_SALES_CHANNELS;
    if (current.includes(ch)) return;
    const updated = [...current, ch];
    const updatedSettings = { ...companyForm, salesChannels: updated };
    setCompanyForm(updatedSettings);
    await updateCompany(updatedSettings);
    setNewChannel('');
    showSaveNotice('Canal de venda cadastrado!');
  };

  const handleDeleteSalesChannel = async (channel: string) => {
    if (confirm(`Remover o canal de venda "${channel}"?`)) {
      const current = companyForm.salesChannels || DEFAULT_SALES_CHANNELS;
      const updated = current.filter((c) => c !== channel);
      const updatedSettings = { ...companyForm, salesChannels: updated };
      setCompanyForm(updatedSettings);
      await updateCompany(updatedSettings);
    }
  };

  // --- TAB 6: Team States ---
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('VENDEDOR');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    await addUserMember({
      name: newUserName.trim(),
      email: newUserEmail.trim().toLowerCase(),
      role: newUserRole,
    });

    setIsAddUserOpen(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserRole('VENDEDOR');
    showSaveNotice('Membro da equipe adicionado!');
  };

  // --- TAB 8: Backup & Restore ---
  const handleExportJSON = () => {
    const dataStr = exportBackupJSON();
    const fileName = `gestao_pro_backup_${new Date().toISOString().slice(0, 10)}.json`;
    downloadFile(dataStr, fileName, 'application/json');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = await importBackupJSON(content);
        if (res.success) {
          alert('Backup restaurado com sucesso! Seus dados foram salvos no Firestore.');
        } else {
          alert(`Erro ao importar arquivo: ${res.message}`);
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLoadDemoData = async () => {
    if (
      confirm(
        'Deseja carregar alguns produtos e clientes de demonstração na sua conta? Isso adicionará itens de teste no seu banco em nuvem.'
      )
    ) {
      await loadDemoSeedData();
      alert('Dados de demonstração carregados com sucesso!');
    }
  };

  const handleClearAll = async () => {
    if (
      confirm(
        'ATENÇÃO: Deseja apagar todos os produtos, vendas, clientes e movimentações da sua conta na nuvem? Esta ação não pode ser desfeita.'
      )
    ) {
      await clearAllCloudData();
      alert('Banco de dados em nuvem limpo com sucesso.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Configurações & Cadastros do Sistema
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gerencie todas as opções de cadastro: formas de pagamento, plano de contas, categorias, canais de venda e parâmetros do negócio.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-1.5 animate-fade-in">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>{saveMessage || 'Salvo na Nuvem!'}</span>
            </span>
          )}

          <div className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300">
            <Cloud className="h-4 w-4 text-emerald-600" />
            <span>Sincronizado no Firestore</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-1 text-xs scrollbar-none">
        <button
          onClick={() => setActiveTab('company')}
          className={`flex items-center gap-2 whitespace-nowrap rounded-t-lg border-b-2 px-3.5 py-2.5 font-semibold transition-all ${
            activeTab === 'company'
              ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900'
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          <span>Empresa & Cupons</span>
        </button>

        <button
          onClick={() => setActiveTab('payment_methods')}
          className={`flex items-center gap-2 whitespace-nowrap rounded-t-lg border-b-2 px-3.5 py-2.5 font-semibold transition-all ${
            activeTab === 'payment_methods'
              ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900'
          }`}
        >
          <CreditCard className="h-3.5 w-3.5" />
          <span>Formas de Pagamento ({(companyForm.paymentMethods || DEFAULT_PAYMENT_METHODS).length})</span>
        </button>

        <button
          onClick={() => setActiveTab('catalog_settings')}
          className={`flex items-center gap-2 whitespace-nowrap rounded-t-lg border-b-2 px-3.5 py-2.5 font-semibold transition-all ${
            activeTab === 'catalog_settings'
              ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900'
          }`}
        >
          <Package className="h-3.5 w-3.5" />
          <span>Categorias & Unidades</span>
        </button>

        <button
          onClick={() => setActiveTab('finance_settings')}
          className={`flex items-center gap-2 whitespace-nowrap rounded-t-lg border-b-2 px-3.5 py-2.5 font-semibold transition-all ${
            activeTab === 'finance_settings'
              ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900'
          }`}
        >
          <Wallet className="h-3.5 w-3.5" />
          <span>Categorias de Despesas & Receitas</span>
        </button>

        <button
          onClick={() => setActiveTab('pos_channels')}
          className={`flex items-center gap-2 whitespace-nowrap rounded-t-lg border-b-2 px-3.5 py-2.5 font-semibold transition-all ${
            activeTab === 'pos_channels'
              ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900'
          }`}
        >
          <Store className="h-3.5 w-3.5" />
          <span>Canais & Parâmetros PDV</span>
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`flex items-center gap-2 whitespace-nowrap rounded-t-lg border-b-2 px-3.5 py-2.5 font-semibold transition-all ${
            activeTab === 'team'
              ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Equipe ({users.length + 1})</span>
        </button>

        <button
          onClick={() => setActiveTab('appearance')}
          className={`flex items-center gap-2 whitespace-nowrap rounded-t-lg border-b-2 px-3.5 py-2.5 font-semibold transition-all ${
            activeTab === 'appearance'
              ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900'
          }`}
        >
          <Palette className="h-3.5 w-3.5" />
          <span>Aparência</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-2 whitespace-nowrap rounded-t-lg border-b-2 px-3.5 py-2.5 font-semibold transition-all ${
            activeTab === 'backup'
              ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900'
          }`}
        >
          <Database className="h-3.5 w-3.5" />
          <span>Nuvem & Backup</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: Company Settings & Document Logos */}
      {/* ========================================================================= */}
      {activeTab === 'company' && (
        <div className="space-y-6 max-w-5xl">
          {/* Section A: Logos & Visual Identity for Receipts and Proposals */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    Logotipos & Identidade Visual dos Documentos
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Configure os logotipos que aparecem no Cupom Não Fiscal (PDV) e na Proposta Comercial / Orçamento.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLaunchTestReceipt}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 transition-all"
                  title="Abrir modal com cupom de exemplo"
                >
                  <Receipt className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Testar Cupom</span>
                </button>
                <button
                  type="button"
                  onClick={handleLaunchTestQuote}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 transition-all"
                  title="Abrir modal com proposta de exemplo"
                >
                  <FileText className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Testar Proposta</span>
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-6">
              {/* Main Company Logo */}
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 p-4">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                        1. Logotipo Principal da Empresa
                      </h4>
                      <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-medium px-2 py-0.5 rounded-full">
                        Usado por padrão em todos os impressos
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Faça upload do arquivo da sua marca (PNG, JPG, SVG) ou insira o link direto de uma imagem online.
                    </p>

                    {/* URL Input & Upload Buttons */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={companyForm.logoUrl || ''}
                          onChange={(e) => setCompanyForm({ ...companyForm, logoUrl: e.target.value })}
                          placeholder="https://suaempresa.com/logo.png ou cole uma imagem em base64"
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          ref={mainLogoInputRef}
                          accept="image/png,image/jpeg,image/svg+xml,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload('main', file);
                            e.target.value = '';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => mainLogoInputRef.current?.click()}
                          disabled={isUploadingLogo}
                          className="flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:hover:bg-indigo-700 active:scale-98 transition-all disabled:opacity-50"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          <span>{isUploadingLogo ? 'Processando...' : 'Enviar Arquivo'}</span>
                        </button>

                        {companyForm.logoUrl && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLogo('main')}
                            className="flex items-center gap-1 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 px-2.5 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-all"
                            title="Remover logotipo principal"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Remover</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Presets */}
                    <div className="pt-2">
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mr-2">
                        Presets rápidos de teste:
                      </span>
                      <div className="inline-flex flex-wrap gap-1.5 mt-1">
                        {LOGO_PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => handleApplyLogoPreset('main', preset.url)}
                            className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-0.5 text-[11px] text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
                          >
                            {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Logo Preview Box */}
                  <div className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 min-w-[140px] max-w-[180px] h-[95px]">
                    {companyForm.logoUrl ? (
                      <img
                        src={companyForm.logoUrl}
                        alt="Logotipo Principal"
                        className="max-h-16 max-w-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-center text-slate-400 dark:text-slate-500">
                        <FileImage className="h-7 w-7 mx-auto stroke-1" />
                        <span className="text-[10px] block mt-1">Sem Logotipo</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Specific Settings Grid: Receipt vs Quote */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Column 1: Receipt / Cupom Settings */}
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-850/40 p-4 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                        <Receipt className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          Recibo / Cupom Não Fiscal
                        </h4>
                        <span className="text-[10px] text-slate-500">Impressão Térmica (80mm) ou A4</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setCompanyForm((prev) => ({
                          ...prev,
                          showLogoOnReceipt: prev.showLogoOnReceipt === false ? true : false,
                        }))
                      }
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                        companyForm.showLogoOnReceipt !== false
                          ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {companyForm.showLogoOnReceipt !== false ? (
                        <>
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>Ativo</span>
                        </>
                      ) : (
                        <>
                          <X className="h-3.5 w-3.5" />
                          <span>Oculto</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Receipt Logo Size */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Tamanho do Logo no Cupom
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['sm', 'md', 'lg'] as const).map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setCompanyForm({ ...companyForm, receiptLogoSize: size })}
                          className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
                            (companyForm.receiptLogoSize || 'md') === size
                              ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                          }`}
                        >
                          {size === 'sm' && 'Pequeno (36px)'}
                          {size === 'md' && 'Médio (48px)'}
                          {size === 'lg' && 'Grande (64px)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Specific Receipt Logo Override */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Logotipo Específico para o Cupom (Opcional)
                      </label>
                      {companyForm.receiptLogoUrl && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLogo('receipt')}
                          className="text-[10px] text-rose-500 hover:underline"
                        >
                          Voltar ao principal
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={companyForm.receiptLogoUrl || ''}
                        onChange={(e) => setCompanyForm({ ...companyForm, receiptLogoUrl: e.target.value })}
                        placeholder="Vazio usa o logotipo principal da empresa"
                        className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                      <input
                        type="file"
                        ref={receiptLogoInputRef}
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('receipt', file);
                          e.target.value = '';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => receiptLogoInputRef.current?.click()}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                        title="Upload de logo específico para cupom"
                      >
                        <Upload className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Dica: para impressoras térmicas, use uma versão monocromática (preto e branco) ou alto contraste.
                    </p>
                  </div>
                </div>

                {/* Column 2: Quote / Proposta Settings */}
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-850/40 p-4 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          Proposta Comercial / Orçamento
                        </h4>
                        <span className="text-[10px] text-slate-500">Documento Oficial A4 / PDF</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setCompanyForm((prev) => ({
                          ...prev,
                          showLogoOnQuote: prev.showLogoOnQuote === false ? true : false,
                        }))
                      }
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                        companyForm.showLogoOnQuote !== false
                          ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {companyForm.showLogoOnQuote !== false ? (
                        <>
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>Ativo</span>
                        </>
                      ) : (
                        <>
                          <X className="h-3.5 w-3.5" />
                          <span>Oculto</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Quote Logo Size */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Tamanho do Logo na Proposta
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['sm', 'md', 'lg'] as const).map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setCompanyForm({ ...companyForm, quoteLogoSize: size })}
                          className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
                            (companyForm.quoteLogoSize || 'md') === size
                              ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                          }`}
                        >
                          {size === 'sm' && 'Pequeno (44px)'}
                          {size === 'md' && 'Médio (56px)'}
                          {size === 'lg' && 'Grande (72px)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Specific Quote Logo Override */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Logotipo Específico para a Proposta (Opcional)
                      </label>
                      {companyForm.quoteLogoUrl && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLogo('quote')}
                          className="text-[10px] text-rose-500 hover:underline"
                        >
                          Voltar ao principal
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={companyForm.quoteLogoUrl || ''}
                        onChange={(e) => setCompanyForm({ ...companyForm, quoteLogoUrl: e.target.value })}
                        placeholder="Vazio usa o logotipo principal da empresa"
                        className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                      <input
                        type="file"
                        ref={quoteLogoInputRef}
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('quote', file);
                          e.target.value = '';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => quoteLogoInputRef.current?.click()}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                        title="Upload de logo específico para proposta"
                      >
                        <Upload className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Ideal para propostas em alta definição enviadas em PDF para clientes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Header Alignment */}
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-850/40 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Alinhamento do Cabeçalho & Logotipo
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Escolha como o logo e os dados cadastrais serão organizados no topo dos impressos.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCompanyForm({ ...companyForm, logoPosition: 'left' })}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                        (companyForm.logoPosition || 'center') === 'left'
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      <AlignLeft className="h-3.5 w-3.5" />
                      <span>Esquerda</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCompanyForm({ ...companyForm, logoPosition: 'center' })}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                        (companyForm.logoPosition || 'center') === 'center'
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      <AlignCenter className="h-3.5 w-3.5" />
                      <span>Centralizado</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCompanyForm({ ...companyForm, logoPosition: 'right' })}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                        companyForm.logoPosition === 'right'
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      <AlignRight className="h-3.5 w-3.5" />
                      <span>Direita</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Real-time Interactive Document Header Live Preview */}
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                      Prévia Interativa em Tempo Real
                    </span>
                  </div>

                  <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setPreviewDocType('receipt')}
                      className={`flex items-center gap-1 px-3 py-1 rounded-md font-semibold transition-all ${
                        previewDocType === 'receipt'
                          ? 'bg-slate-900 text-white dark:bg-indigo-600'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <Receipt className="h-3.5 w-3.5" />
                      <span>Cupom Térmico (80mm)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDocType('quote')}
                      className={`flex items-center gap-1 px-3 py-1 rounded-md font-semibold transition-all ${
                        previewDocType === 'quote'
                          ? 'bg-slate-900 text-white dark:bg-indigo-600'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Proposta Comercial (A4)</span>
                    </button>
                  </div>
                </div>

                {/* Simulated Paper Container */}
                <div className="mt-4 flex justify-center">
                  {previewDocType === 'receipt' ? (
                    /* 80mm Receipt Simulator */
                    <div className="w-full max-w-[340px] rounded-lg border border-slate-300 bg-white text-slate-900 p-4 shadow-md font-mono text-[11px] space-y-2.5">
                      <div
                        className={`space-y-1.5 pb-2 border-b border-dashed border-slate-400 ${
                          (companyForm.logoPosition || 'center') === 'center'
                            ? 'text-center'
                            : companyForm.logoPosition === 'right'
                            ? 'text-right'
                            : 'text-left'
                        }`}
                      >
                        {companyForm.showLogoOnReceipt !== false &&
                          (companyForm.receiptLogoUrl || companyForm.logoUrl) && (
                            <div
                              className={`flex mb-2 ${
                                (companyForm.logoPosition || 'center') === 'center'
                                  ? 'justify-center'
                                  : companyForm.logoPosition === 'right'
                                  ? 'justify-end'
                                  : 'justify-start'
                              }`}
                            >
                              <img
                                src={companyForm.receiptLogoUrl || companyForm.logoUrl}
                                alt="Logo Cupom"
                                className={`object-contain ${
                                  companyForm.receiptLogoSize === 'sm'
                                    ? 'max-h-9'
                                    : companyForm.receiptLogoSize === 'lg'
                                    ? 'max-h-16'
                                    : 'max-h-12'
                                }`}
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}

                        <div className="font-bold text-sm leading-tight uppercase">
                          {companyForm.tradeName || 'NOME DA EMPRESA'}
                        </div>
                        {companyForm.corporateName && (
                          <div className="text-[10px] text-slate-600">{companyForm.corporateName}</div>
                        )}
                        {companyForm.cnpj && (
                          <div className="text-[10px] text-slate-700">CNPJ: {companyForm.cnpj}</div>
                        )}
                        {companyForm.phone && (
                          <div className="text-[10px] text-slate-700">TEL: {companyForm.phone}</div>
                        )}
                        <div className="text-[9px] uppercase tracking-wider text-slate-500 font-sans mt-1">
                          *** CUPOM NÃO FISCAL ***
                        </div>
                      </div>

                      <div className="space-y-1 text-[10px] pb-2 border-b border-dashed border-slate-400">
                        <div className="flex justify-between font-bold">
                          <span>ITEM / DESCRIÇÃO</span>
                          <span>TOTAL</span>
                        </div>
                        <div className="flex justify-between">
                          <span>2x Produto Exemplo de Venda</span>
                          <span>R$ 250,00</span>
                        </div>
                        <div className="flex justify-between">
                          <span>1x Serviço Especializado</span>
                          <span>R$ 85,00</span>
                        </div>
                      </div>

                      <div className="space-y-1 font-bold text-xs">
                        <div className="flex justify-between">
                          <span>SUBTOTAL:</span>
                          <span>R$ 335,00</span>
                        </div>
                        <div className="flex justify-between text-indigo-700">
                          <span>TOTAL PAGO (PIX):</span>
                          <span>R$ 320,00</span>
                        </div>
                      </div>

                      {companyForm.receiptFooterMessage && (
                        <div className="pt-2 border-t border-dashed border-slate-400 text-center text-[10px] text-slate-600">
                          {companyForm.receiptFooterMessage}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* A4 Proposal Simulator */
                    <div className="w-full max-w-xl rounded-lg border border-slate-300 bg-white text-slate-900 p-5 shadow-md text-xs space-y-4">
                      <div
                        className={`flex items-start justify-between gap-4 pb-3 border-b border-slate-200 ${
                          companyForm.logoPosition === 'right' ? 'flex-row-reverse' : ''
                        }`}
                      >
                        <div className="space-y-1">
                          {companyForm.showLogoOnQuote !== false &&
                            (companyForm.quoteLogoUrl || companyForm.logoUrl) && (
                              <div className="mb-2">
                                <img
                                  src={companyForm.quoteLogoUrl || companyForm.logoUrl}
                                  alt="Logo Proposta"
                                  className={`object-contain ${
                                    companyForm.quoteLogoSize === 'sm'
                                      ? 'max-h-10'
                                      : companyForm.quoteLogoSize === 'lg'
                                      ? 'max-h-18'
                                      : 'max-h-14'
                                  }`}
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            )}
                          <h4 className="font-bold text-sm text-slate-900 leading-tight">
                            {companyForm.tradeName || 'NOME DA EMPRESA'}
                          </h4>
                          {companyForm.corporateName && (
                            <p className="text-[11px] text-slate-600">{companyForm.corporateName}</p>
                          )}
                          <p className="text-[11px] text-slate-600">
                            {companyForm.cnpj && `CNPJ: ${companyForm.cnpj} • `}
                            {companyForm.phone && `Tel: ${companyForm.phone}`}
                          </p>
                        </div>

                        <div className="text-right space-y-0.5">
                          <span className="inline-block rounded-md bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 text-[10px]">
                            PROPOSTA COMERCIAL
                          </span>
                          <div className="font-mono font-bold text-xs text-slate-800">#ORC-DEMO-2026</div>
                          <div className="text-[10px] text-slate-500">Validade: 10 dias</div>
                        </div>
                      </div>

                      <div className="rounded-lg bg-slate-50 p-2.5 text-[11px] border border-slate-200">
                        <span className="font-bold text-slate-700 block mb-0.5">Cliente:</span>
                        <div>Empresa Parceira Demonstração S/A • CNPJ: 12.345.678/0001-90</div>
                      </div>

                      <div className="flex justify-between items-center pt-2 font-bold text-sm text-emerald-800 border-t border-slate-200">
                        <span>VALOR TOTAL PROPOSTO:</span>
                        <span>R$ 1.650,00</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section B: Company Fiscal & Registration Data */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
            <form onSubmit={handleSaveAllCompanySettings} className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
                      Informações Fiscais, Cadastrais & Contato da Empresa
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Estes dados são sincronizados no Firestore e preenchem os cabeçalhos dos documentos e relatórios.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nome Fantasia *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyForm.tradeName}
                    onChange={(e) => setCompanyForm({ ...companyForm, tradeName: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Razão Social
                  </label>
                  <input
                    type="text"
                    value={companyForm.corporateName}
                    onChange={(e) => setCompanyForm({ ...companyForm, corporateName: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">CNPJ</label>
                  <input
                    type="text"
                    value={companyForm.cnpj}
                    onChange={(e) => setCompanyForm({ ...companyForm, cnpj: e.target.value })}
                    placeholder="00.000.000/0000-00"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Telefone / WhatsApp Comercial
                  </label>
                  <input
                    type="text"
                    value={companyForm.phone}
                    onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    E-mail Comercial
                  </label>
                  <input
                    type="email"
                    value={companyForm.email}
                    onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                    placeholder="contato@empresa.com"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cidade / UF
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={companyForm.city}
                      onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                      placeholder="Cidade"
                      className="col-span-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                    <input
                      type="text"
                      maxLength={2}
                      value={companyForm.state}
                      onChange={(e) => setCompanyForm({ ...companyForm, state: e.target.value.toUpperCase() })}
                      placeholder="UF"
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 uppercase focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Endereço Completo
                  </label>
                  <input
                    type="text"
                    value={companyForm.address}
                    onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                    placeholder="Rua, Número, Bairro"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mensagem de Rodapé dos Cupons e Propostas
                  </label>
                  <input
                    type="text"
                    value={companyForm.receiptFooterMessage}
                    onChange={(e) => setCompanyForm({ ...companyForm, receiptFooterMessage: e.target.value })}
                    placeholder="Ex: Obrigado pela preferência! Chave PIX / Garantia de 90 dias."
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Alíquota Média de Tributos / Impostos (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={companyForm.taxRatePercent || 0}
                    onChange={(e) =>
                      setCompanyForm({ ...companyForm, taxRatePercent: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Moeda Padrão
                  </label>
                  <input
                    type="text"
                    disabled
                    value="BRL (R$ Real Brasileiro)"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 dark:hover:bg-indigo-700 active:scale-98 transition-all"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Salvar Todas as Configurações da Empresa</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: Payment Methods (Formas de Pagamento) */}
      {/* ========================================================================= */}
      {activeTab === 'payment_methods' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Cadastro de Formas & Condições de Pagamento
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Configure os meios de pagamento aceitos no PDV, taxas de maquininhas, prazos de compensação e parcelamentos.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetPaymentMethodsToDefault}
                type="button"
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors"
                title="Restaurar métodos padrão de fábrica"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Restaurar Padrões</span>
              </button>

              <button
                onClick={handleOpenNewPaymentModal}
                type="button"
                className="flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 active:scale-98 transition-all shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Cadastrar Nova Forma</span>
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Nome / Rótulo</th>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Taxa Operação (%)</th>
                  <th className="px-4 py-3">Recebimento</th>
                  <th className="px-4 py-3">Parcelamento</th>
                  <th className="px-4 py-3">Aceita Troco</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(companyForm.paymentMethods || DEFAULT_PAYMENT_METHODS).map((pm) => (
                  <tr
                    key={pm.id}
                    className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                      !pm.active ? 'opacity-60 bg-slate-50/30 dark:bg-slate-800/20' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleTogglePaymentActive(pm.id)}
                        className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                          pm.active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                            : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                        title={pm.active ? 'Clique para desativar no PDV' : 'Clique para ativar no PDV'}
                      >
                        {pm.active ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        <span>{pm.active ? 'Ativo no PDV' : 'Desativado'}</span>
                      </button>
                    </td>

                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                        <span>{pm.name}</span>
                      </div>
                      {pm.description && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-normal">
                          {pm.description}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-3 font-mono text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      {pm.code}
                    </td>

                    <td className="px-4 py-3 font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {pm.feePercent && pm.feePercent > 0 ? (
                        <span className="text-amber-600 dark:text-amber-400 font-bold">{pm.feePercent}%</span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">0% (Isento)</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {pm.dueDays === 0 ? 'Imediato (D+0)' : `Em ${pm.dueDays} dias (D+${pm.dueDays})`}
                    </td>

                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">
                      {(pm.maxInstallments || 1) > 1 ? `Até ${pm.maxInstallments}x` : 'À Vista (1x)'}
                    </td>

                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {pm.allowChange ? (
                        <span className="text-emerald-600 font-bold">Sim (Dinheiro)</span>
                      ) : (
                        <span className="text-slate-400">Não</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditPaymentModal(pm)}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeletePaymentMethod(pm.id, pm.name)}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: Product Categories & Units of Measure */}
      {/* ========================================================================= */}
      {activeTab === 'catalog_settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Card: Categorias de Produtos */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3.5">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Categorias de Produtos do Catálogo</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Utilizadas para filtrar itens no PDV, relatórios de estoque e precificação.
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                  {(companyForm.productCategories || DEFAULT_PRODUCT_CATEGORIES).length} categorias
                </span>
              </div>

              {/* Add form */}
              <form onSubmit={handleAddProductCategory} className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newProdCategory}
                  onChange={(e) => setNewProdCategory(e.target.value)}
                  placeholder="Nova categoria (ex: Ferramentas, Informática)..."
                  className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <button
                  type="submit"
                  className="flex items-center gap-1 rounded-lg bg-slate-900 dark:bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 active:scale-98 transition-all shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Adicionar</span>
                </button>
              </form>

              {/* List */}
              <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                {(companyForm.productCategories || DEFAULT_PRODUCT_CATEGORIES).map((cat, idx) => {
                  const productCount = products.filter((p) => p.category === cat).length;
                  const isEditing = editingCategoryIndex === idx;

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2 text-xs"
                    >
                      {isEditing ? (
                        <div className="flex flex-1 items-center gap-2">
                          <input
                            type="text"
                            value={editingCategoryValue}
                            onChange={(e) => setEditingCategoryValue(e.target.value)}
                            className="flex-1 rounded-md border border-indigo-400 bg-white dark:bg-slate-800 px-2 py-1 text-xs"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateProductCategory(idx)}
                            className="rounded-md bg-emerald-600 p-1 text-white hover:bg-emerald-700"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCategoryIndex(null)}
                            className="rounded-md bg-slate-200 dark:bg-slate-700 p-1 text-slate-700 dark:text-slate-300"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{cat}</span>
                            <span className="rounded bg-slate-200/70 dark:bg-slate-700 px-1.5 py-0.2 text-[10px] text-slate-600 dark:text-slate-400">
                              {productCount} {productCount === 1 ? 'produto' : 'produtos'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCategoryIndex(idx);
                                setEditingCategoryValue(cat);
                              }}
                              className="rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                              title="Renomear Categoria"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProductCategory(cat)}
                              className="rounded p-1 text-slate-400 hover:text-rose-600"
                              title="Excluir Categoria"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card: Unidades de Medida */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3.5">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Scale className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Unidades de Medida (UN, KG, CX, L, M...)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Defina se a unidade aceita frações decimais (ex: quilos, metros) ou inteiros.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsUnitModalOpen(true)}
                  className="flex items-center gap-1 rounded-lg bg-slate-900 dark:bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 active:scale-98 transition-all shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Nova Unidade</span>
                </button>
              </div>

              {/* Units table/grid */}
              <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                {(companyForm.unitsOfMeasurement || DEFAULT_UNITS).map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded">
                        {u.code}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{u.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          u.allowsDecimal
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {u.allowsDecimal ? 'Aceita Decimais (1,50)' : 'Apenas Inteiros (1, 2, 3)'}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleDeleteUnit(u.id, u.code)}
                        className="rounded p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Excluir Unidade"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: Finance (Categorias de Despesas e Receitas) */}
      {/* ========================================================================= */}
      {activeTab === 'finance_settings' && (
        <div className="space-y-5">
          {/* Categorias de Despesas e Receitas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Categorias de Despesa */}
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3.5">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-rose-600" />
                  <span>Categorias de Despesa (Saídas)</span>
                </h4>
                <span className="text-[10px] text-slate-500">
                  {(companyForm.expenseCategories || DEFAULT_EXPENSE_CATEGORIES).length} cadastradas
                </span>
              </div>

              <form onSubmit={handleAddExpenseCategory} className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newExpenseCat}
                  onChange={(e) => setNewExpenseCat(e.target.value)}
                  placeholder="Nova categoria de despesa..."
                  className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 dark:bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </form>

              <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                {(companyForm.expenseCategories || DEFAULT_EXPENSE_CATEGORIES).map((cat, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 text-xs border border-slate-200/60 dark:border-slate-800"
                  >
                    <span className="text-slate-800 dark:text-slate-200 font-medium">{cat}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteExpenseCategory(cat)}
                      className="rounded p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Categorias de Receita */}
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3.5">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Categorias de Receita (Entradas)</span>
                </h4>
                <span className="text-[10px] text-slate-500">
                  {(companyForm.incomeCategories || DEFAULT_INCOME_CATEGORIES).length} cadastradas
                </span>
              </div>

              <form onSubmit={handleAddIncomeCategory} className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newIncomeCat}
                  onChange={(e) => setNewIncomeCat(e.target.value)}
                  placeholder="Nova categoria de receita..."
                  className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 dark:bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </form>

              <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                {(companyForm.incomeCategories || DEFAULT_INCOME_CATEGORIES).map((cat, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 text-xs border border-slate-200/60 dark:border-slate-800"
                  >
                    <span className="text-slate-800 dark:text-slate-200 font-medium">{cat}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteIncomeCategory(cat)}
                      className="rounded p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: Sales Channels & Operational Parameters */}
      {/* ========================================================================= */}
      {activeTab === 'pos_channels' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Card: Canais de Venda / Origens */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3.5">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingBag className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Canais de Venda / Origem dos Pedidos</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Identifique se a venda veio da Loja Física, WhatsApp, Mercado Livre ou Redes Sociais.
                  </p>
                </div>
              </div>

              <form onSubmit={handleAddSalesChannel} className="flex gap-2 mb-3.5">
                <input
                  type="text"
                  value={newChannel}
                  onChange={(e) => setNewChannel(e.target.value)}
                  placeholder="Ex: WhatsApp, Mercado Livre, Loja Virtual..."
                  className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <button
                  type="submit"
                  className="flex items-center gap-1 rounded-lg bg-slate-900 dark:bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 active:scale-98 transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Cadastrar</span>
                </button>
              </form>

              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {(companyForm.salesChannels || DEFAULT_SALES_CHANNELS).map((ch, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-xs border border-slate-200/60 dark:border-slate-800"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{ch}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteSalesChannel(ch)}
                      className="rounded p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card: Parâmetros Operacionais e Regras de Negócio */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between">
            <form onSubmit={handleSaveAllCompanySettings} className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Percent className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Regras Operacionais & Parâmetros do PDV</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Limites de desconto para vendedores, validade de orçamentos e comportamento de impressão.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Limite Máximo de Desconto no Balcão (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={companyForm.maxDiscountPercent || 15}
                    onChange={(e) =>
                      setCompanyForm({
                        ...companyForm,
                        maxDiscountPercent: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-mono font-semibold text-slate-900 dark:text-slate-100"
                  />
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Alerta ou restringe operadores quando o desconto exceder esta porcentagem.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Validade Padrão das Propostas / Orçamentos (Dias)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={companyForm.defaultQuoteValidityDays || 10}
                    onChange={(e) =>
                      setCompanyForm({
                        ...companyForm,
                        defaultQuoteValidityDays: parseInt(e.target.value) || 10,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-mono font-semibold text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Alerta Padrão de Estoque Mínimo (Unidades)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={companyForm.defaultMinStockAlert || 5}
                    onChange={(e) =>
                      setCompanyForm({
                        ...companyForm,
                        defaultMinStockAlert: parseInt(e.target.value) || 5,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-mono font-semibold text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 active:scale-98 transition-all"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Salvar Regras de Operação</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: Team & Users */}
      {/* ========================================================================= */}
      {activeTab === 'team' && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
              Membros da Equipe & Operadores
            </h3>
            <button
              onClick={() => setIsAddUserOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 active:scale-98 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Adicionar Membro</span>
            </button>
          </div>

          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2.5">Nome</th>
                  <th className="px-4 py-2.5">E-mail</th>
                  <th className="px-4 py-2.5">Função</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {/* Current user */}
                <tr className="bg-slate-50/40 dark:bg-slate-800/30">
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-900 dark:bg-indigo-600 font-bold text-white text-[11px]">
                      {currentUser.name.charAt(0)}
                    </div>
                    <span>{currentUser.name}</span>
                    <span className="rounded bg-emerald-100 dark:bg-emerald-950/50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      Sua Conta
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                    {currentUser.email || 'Conta Conectada'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block rounded px-2 py-0.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                      {currentUser.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium text-[11px]">● Conectado</span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-400 text-[11px]">Titular</td>
                </tr>

                {/* Team members */}
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                        {u.name.charAt(0)}
                      </div>
                      <span>{u.name}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono text-[11px]">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-600 dark:text-slate-400 font-medium text-[11px]">Cadastrado</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`Deseja remover o membro ${u.name}?`)) {
                            deleteUserMember(u.id);
                          }
                        }}
                        className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        title="Excluir Membro"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: Appearance */}
      {/* ========================================================================= */}
      {activeTab === 'appearance' && (
        <div className="space-y-6 max-w-4xl">
          {/* Section 1: Base Themes */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                  <Sun className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
                    Modo Visual & Tema Base
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Escolha a iluminação ideal para o seu ambiente de trabalho e tipo de monitor.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4">
              {/* Light Mode */}
              <div
                onClick={() => updateAppearance({ baseTheme: 'light' })}
                className={`cursor-pointer rounded-xl border p-3.5 transition-all relative ${
                  appearance?.baseTheme === 'light'
                    ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                    <Sun className="h-3.5 w-3.5" />
                  </div>
                  {appearance?.baseTheme === 'light' && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">Modo Claro</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  Contraste limpo para o dia e ambientes claros.
                </p>
              </div>

              {/* Dark Slate Mode */}
              <div
                onClick={() => updateAppearance({ baseTheme: 'dark' })}
                className={`cursor-pointer rounded-xl border p-3.5 transition-all relative ${
                  appearance?.baseTheme === 'dark'
                    ? 'border-indigo-600 bg-slate-800/90 text-white ring-2 ring-indigo-500/30 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800">
                    <Moon className="h-3.5 w-3.5" />
                  </div>
                  {appearance?.baseTheme === 'dark' && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-white">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <span className={`font-bold text-xs ${appearance?.baseTheme === 'dark' ? 'text-white' : 'text-slate-900 dark:text-slate-100'} block`}>
                  Noturno Slate
                </span>
                <p className={`text-[11px] mt-1 leading-snug ${appearance?.baseTheme === 'dark' ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                  Tons de ardósia escuro, suave e descansado.
                </p>
              </div>

              {/* Midnight OLED Mode */}
              <div
                onClick={() => updateAppearance({ baseTheme: 'midnight' })}
                className={`cursor-pointer rounded-xl border p-3.5 transition-all relative ${
                  appearance?.baseTheme === 'midnight'
                    ? 'border-indigo-500 bg-black text-white ring-2 ring-indigo-500/40 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-zinc-200 border border-zinc-700">
                    <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                  </div>
                  {appearance?.baseTheme === 'midnight' && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-white">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <span className={`font-bold text-xs ${appearance?.baseTheme === 'midnight' ? 'text-white' : 'text-slate-900 dark:text-slate-100'} block`}>
                  Midnight OLED
                </span>
                <p className={`text-[11px] mt-1 leading-snug ${appearance?.baseTheme === 'midnight' ? 'text-zinc-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  Preto puro (#000000), alto contraste e economia.
                </p>
              </div>

              {/* System Auto */}
              <div
                onClick={() => updateAppearance({ baseTheme: 'system' })}
                className={`cursor-pointer rounded-xl border p-3.5 transition-all relative ${
                  appearance?.baseTheme === 'system'
                    ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <Monitor className="h-3.5 w-3.5" />
                  </div>
                  {appearance?.baseTheme === 'system' && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">Automático</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  Sincroniza com o modo do seu navegador ou SO.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Accent Color Palette */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                  <Palette className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
                    Cor de Destaque & Identidade
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Personalize os botões de ação, indicadores de navegação e destaques visuais do sistema.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {[
                { id: 'indigo', label: 'Índigo Real', hex: '#4f46e5', bgClass: 'bg-indigo-600', desc: 'Padrão corporativo' },
                { id: 'emerald', label: 'Esmeralda Vendas', hex: '#059669', bgClass: 'bg-emerald-600', desc: 'Foco comercial & lucros' },
                { id: 'blue', label: 'Azul Safira', hex: '#2563eb', bgClass: 'bg-blue-600', desc: 'Tecnologia & clareza' },
                { id: 'violet', label: 'Púrpura Criativo', hex: '#7c3aed', bgClass: 'bg-violet-600', desc: 'Moderno & distinto' },
                { id: 'rose', label: 'Rubi Carmim', hex: '#e11d48', bgClass: 'bg-rose-600', desc: 'Vibrante & marcante' },
                { id: 'amber', label: 'Âmbar Solar', hex: '#ea580c', bgClass: 'bg-amber-600', desc: 'Quente & estimulante' },
                { id: 'cyan', label: 'Ciano Oceano', hex: '#0891b2', bgClass: 'bg-cyan-600', desc: 'Fresco & moderno' },
                { id: 'slate', label: 'Grafite Minimal', hex: '#475569', bgClass: 'bg-slate-700', desc: 'Sóbrio & monocromático' },
              ].map((c) => {
                const isSelected = (appearance?.accentColor || 'indigo') === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => updateAppearance({ accentColor: c.id as AccentColor })}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60'
                    }`}
                  >
                    <span className={`flex h-5 w-5 shrink-0 rounded-full ${c.bgClass} shadow-xs flex items-center justify-center text-white`}>
                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    </span>
                    <div className="truncate">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block truncate">
                        {c.label}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                        {c.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Fine-tuned Interface Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sidebar Style */}
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <Layout className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Estilo do Menu Lateral
                </h3>
              </div>
              <div className="space-y-2 mt-3.5">
                {[
                  { id: 'dark', title: 'Escura Corporativa', desc: 'Barra lateral azul escuro permanente com alto contraste' },
                  { id: 'dynamic', title: 'Dinâmica com o Fundo', desc: 'Branca no tema claro, grafite no modo noturno' },
                  { id: 'accent', title: 'Matiz de Destaque', desc: 'Fundo escuro enriquecido com a cor primária selecionada' },
                ].map((s) => {
                  const isSelected = (appearance?.sidebarStyle || 'dark') === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => updateAppearance({ sidebarStyle: s.id as SidebarStyle })}
                      className={`cursor-pointer flex items-center justify-between p-3 rounded-lg border text-xs transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/30 font-semibold text-indigo-900 dark:text-indigo-200'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-slate-100">{s.title}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{s.desc}</div>
                      </div>
                      <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Density & Font Scale */}
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <Sliders className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    Densidade & Tipografia
                  </h3>
                </div>

                {/* Density */}
                <div className="mt-3.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Densidade do Layout
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => updateAppearance({ density: 'comfortable' })}
                      className={`p-2.5 rounded-lg border text-xs text-center font-medium transition-all ${
                        (appearance?.density || 'comfortable') === 'comfortable'
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      🛋️ Confortável (Padrão)
                    </button>
                    <button
                      type="button"
                      onClick={() => updateAppearance({ density: 'compact' })}
                      className={`p-2.5 rounded-lg border text-xs text-center font-medium transition-all ${
                        appearance?.density === 'compact'
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      ⚡ Compacto (Mais dados)
                    </button>
                  </div>
                </div>

                {/* Font Scaling */}
                <div className="mt-4">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Tamanho das Fontes
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'compact', label: 'Compacta (90%)' },
                      { id: 'normal', label: 'Normal (100%)' },
                      { id: 'large', label: 'Ampliada (110%)' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => updateAppearance({ fontScale: f.id as FontScale })}
                        className={`p-2 rounded-lg border text-xs text-center transition-all ${
                          (appearance?.fontScale || 'normal') === f.id
                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Border Radius */}
                <div className="mt-4">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Arredondamento dos Cantos
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'straight', label: 'Reto (2px)' },
                      { id: 'smooth', label: 'Suave (8px)' },
                      { id: 'modern', label: 'Moderno (14px)' },
                    ].map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => updateAppearance({ borderRadius: r.id as BorderRadiusStyle })}
                        className={`p-2 rounded-lg border text-xs text-center transition-all ${
                          (appearance?.borderRadius || 'modern') === r.id
                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Live Interactive Preview Card */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Demonstração Visual em Tempo Real
                </h3>
              </div>
              <button
                type="button"
                onClick={() => updateAppearance(DEFAULT_APPEARANCE)}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium underline"
              >
                Restaurar Padrão do Sistema
              </button>
            </div>

            <div className="mt-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Venda Comercial #VD-9042
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Demonstração de como os botões e componentes reagem à sua paleta.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  Concluída
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-colors"
                >
                  Salvar Alterações
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Imprimir Recibo
                </button>
                <input
                  type="text"
                  readOnly
                  value="Busca rápida de cliente..."
                  className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: Cloud & Backup */}
      {/* ========================================================================= */}
      {activeTab === 'backup' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card: Export */}
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 mb-3">
                  <FileJson className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Exportar Backup Completo</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Gera e baixa um arquivo `.json` com todos os cadastros, formas de pagamento, plano de contas, produtos, vendas e clientes da nuvem.
                </p>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800">
                <button
                  id="btn-export-backup"
                  onClick={handleExportJSON}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 dark:bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 dark:hover:bg-indigo-700 active:scale-98 transition-all shadow-xs"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Baixar Arquivo JSON de Backup</span>
                </button>
              </div>
            </div>

            {/* Card: Import / Restore */}
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 mb-3">
                  <Upload className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Restaurar Backup</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Carregue um arquivo de backup `.json` para sincronizar e restaurar itens diretamente no seu banco de dados Firestore.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                  id="input-restore-json"
                />
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800">
                <label
                  htmlFor="input-restore-json"
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-98 transition-all shadow-xs"
                >
                  <Upload className="h-3.5 w-3.5 text-slate-500" />
                  <span>Selecionar Arquivo .JSON para Restaurar</span>
                </label>
              </div>
            </div>
          </div>

          {/* Tools & Reset */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3">
            <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Ferramentas de Banco de Dados
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleLoadDemoData}
                className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
                <span>Carregar Itens de Exemplo (Opcional)</span>
              </button>

              <button
                type="button"
                onClick={handleClearAll}
                className="flex items-center justify-center gap-2 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/30 p-3 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-100/80 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                <span>Limpar Todo o Banco de Dados em Nuvem</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Cadastrar / Editar Forma de Pagamento */}
      {/* ========================================================================= */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-xl bg-white dark:bg-slate-900 p-5 shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {editingPaymentId ? 'Editar Forma de Pagamento' : 'Cadastrar Nova Forma de Pagamento'}
              </h3>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSavePaymentMethod} className="mt-3.5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome / Rótulo da Forma *
                </label>
                <input
                  type="text"
                  required
                  value={paymentForm.name}
                  onChange={(e) => setPaymentForm({ ...paymentForm, name: e.target.value })}
                  placeholder="Ex: Cartão de Crédito 12x, Vale Refeição, PIX..."
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Código Interno
                  </label>
                  <input
                    type="text"
                    value={paymentForm.code}
                    onChange={(e) => setPaymentForm({ ...paymentForm, code: e.target.value })}
                    placeholder="Ex: VALE_ALIM"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-mono uppercase text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Taxa da Maquininha (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={paymentForm.feePercent}
                    onChange={(e) => setPaymentForm({ ...paymentForm, feePercent: parseFloat(e.target.value) || 0 })}
                    placeholder="0.0"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Prazo de Recebimento (Dias)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="365"
                    value={paymentForm.dueDays}
                    onChange={(e) => setPaymentForm({ ...paymentForm, dueDays: parseInt(e.target.value) || 0 })}
                    placeholder="0 = Imediato"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Parcelamento Máximo
                  </label>
                  <select
                    value={paymentForm.maxInstallments}
                    onChange={(e) => setPaymentForm({ ...paymentForm, maxInstallments: parseInt(e.target.value) || 1 })}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value={1}>1x (À Vista)</option>
                    <option value={2}>Até 2x</option>
                    <option value={3}>Até 3x</option>
                    <option value={6}>Até 6x</option>
                    <option value={10}>Até 10x</option>
                    <option value={12}>Até 12x</option>
                    <option value={18}>Até 18x</option>
                    <option value={24}>Até 24x</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Descrição / Orientações
                </label>
                <input
                  type="text"
                  value={paymentForm.description}
                  onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                  placeholder="Ex: Utilizar maquininha Stone ou PagBank"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentForm.allowChange}
                    onChange={(e) => setPaymentForm({ ...paymentForm, allowChange: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Permite cálculo de troco (como Dinheiro)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentForm.active}
                    onChange={(e) => setPaymentForm({ ...paymentForm, active: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Ativo no PDV</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 dark:bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 active:scale-98 transition-all"
                >
                  Salvar Forma de Pagamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Nova Unidade de Medida */}
      {/* ========================================================================= */}
      {isUnitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-xl bg-white dark:bg-slate-900 p-5 shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Cadastrar Unidade de Medida</h3>
              <button
                onClick={() => setIsUnitModalOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomUnit} className="mt-3.5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Sigla / Código Curto *
                </label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  value={unitForm.code}
                  onChange={(e) => setUnitForm({ ...unitForm, code: e.target.value.toUpperCase() })}
                  placeholder="Ex: TON, BD, ROLO"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-mono uppercase text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome Completo da Unidade *
                </label>
                <input
                  type="text"
                  required
                  value={unitForm.name}
                  onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
                  placeholder="Ex: Tonelada, Balde, Rolo"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={unitForm.allowsDecimal}
                    onChange={(e) => setUnitForm({ ...unitForm, allowsDecimal: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Permite quantidades fracionadas/decimais (ex: 2.5)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setIsUnitModalOpen(false)}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 dark:bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 active:scale-98"
                >
                  Salvar Unidade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Adicionar Membro da Equipe */}
      {/* ========================================================================= */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-xl bg-white dark:bg-slate-900 p-5 shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Adicionar Membro da Equipe</h3>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Ex: Marina Santos"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">E-mail *</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="marina@loja.com"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nível de Acesso</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="VENDEDOR">Vendedor (PDV e Consultas)</option>
                  <option value="GERENTE">Gerente (Estoque, Vendas e Relatórios)</option>
                  <option value="ADMIN">Administrador (Acesso Total)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 dark:bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 active:scale-98 transition-all"
                >
                  Adicionar Membro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
