import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  linkWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  signInAnonymously
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getDocsFromServer,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import {
  AppBackupData,
  AppearanceSettings,
  AppNotification,
  BaseTheme,
  CompanySettings,
  Customer,
  FinancialTransaction,
  Product,
  ProductionMaterial,
  ProductionOrder,
  ProductionOrderLog,
  ProductionPriority,
  ProductionStatus,
  ProductionType,
  Quote,
  Sale,
  StockMovement,
  User,
  UserRole,
} from '../types';
import {
  DEFAULT_APPEARANCE,
  DEFAULT_COMPANY,
  DEMO_CUSTOMERS,
  DEMO_PRODUCTION_ORDERS,
  DEMO_PRODUCTS,
} from '../data/initialData';
import {
  cleanFirestoreData,
  generateProductionOrderCode,
  generateQuoteCode,
  generateSaleCode,
} from '../utils/formatters';

export type AppModule =
  | 'dashboard'
  | 'products'
  | 'pos'
  | 'sales'
  | 'quotes'
  | 'production'
  | 'finance'
  | 'customers'
  | 'settings';

interface AppContextType {
  // Authentication & Current User
  authUser: FirebaseUser | null;
  currentUser: User;
  isAuthLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loginGuest: (customName?: string) => Promise<void>;
  logout: () => Promise<void>;
  users: User[];
  addUserMember: (member: Omit<User, 'id'>) => Promise<void>;
  deleteUserMember: (id: string) => Promise<void>;

  // Navigation
  activeModule: AppModule;
  setActiveModule: (mod: AppModule) => void;

  // Products & Stock
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Product>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  adjustStock: (productId: string, qtyDelta: number, reason: string, type: 'IN' | 'OUT' | 'ADJUSTMENT') => Promise<void>;
  stockMovements: StockMovement[];
  lowStockProducts: Product[];

  // Sales & POS
  sales: Sale[];
  createSale: (saleData: Omit<Sale, 'id' | 'code' | 'createdAt' | 'status' | 'costTotal' | 'profit'>) => Promise<Sale>;
  cancelSale: (saleId: string, reason?: string) => Promise<boolean>;
  updateSaleNotes: (saleId: string, notes: string) => Promise<void>;
  receiptSale: Sale | null;
  setReceiptSale: (sale: Sale | null) => void;

  // Quotes
  quotes: Quote[];
  createQuote: (quoteData: Omit<Quote, 'id' | 'code' | 'createdAt'>) => Promise<Quote>;
  updateQuoteStatus: (id: string, status: Quote['status']) => Promise<void>;
  updateQuoteNotes: (quoteId: string, notes: string) => Promise<void>;
  convertQuoteToSale: (quoteId: string) => Promise<Sale | null>;
  deleteQuote: (id: string) => Promise<void>;
  receiptQuote: Quote | null;
  setReceiptQuote: (quote: Quote | null) => void;

  // Production Orders & Requests
  productionOrders: ProductionOrder[];
  createProductionOrder: (
    orderData: Omit<ProductionOrder, 'id' | 'code' | 'createdAt' | 'updatedAt' | 'logs'> & {
      logs?: ProductionOrderLog[];
    }
  ) => Promise<ProductionOrder>;
  updateProductionOrder: (id: string, partial: Partial<ProductionOrder>) => Promise<void>;
  updateProductionStatus: (
    id: string,
    status: ProductionStatus,
    comment?: string,
    progressPercent?: number
  ) => Promise<void>;
  deductProductionMaterials: (id: string) => Promise<boolean>;
  deleteProductionOrder: (id: string) => Promise<void>;
  receiptProductionOrder: ProductionOrder | null;
  setReceiptProductionOrder: (order: ProductionOrder | null) => void;
  activeProductionDraft: Partial<ProductionOrder> | null;
  setActiveProductionDraft: (draft: Partial<ProductionOrder> | null) => void;
  startProductionFromQuote: (quote: Quote) => void;
  startProductionFromSale: (sale: Sale) => void;

  // Customers
  customers: Customer[];
  addCustomer: (cust: Omit<Customer, 'id' | 'totalSpent' | 'ordersCount' | 'createdAt'>) => Promise<Customer>;
  updateCustomer: (id: string, cust: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;

  // Finance & DRE
  transactions: FinancialTransaction[];
  addTransaction: (tx: Omit<FinancialTransaction, 'id' | 'createdAt'>) => Promise<void>;
  updateTransaction: (id: string, tx: Partial<FinancialTransaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // Company Settings & Cloud
  company: CompanySettings;
  updateCompany: (settings: Partial<CompanySettings>) => Promise<void>;
  isCloudSyncing: boolean;
  lastSyncTime: string;
  syncSavedData: () => Promise<{ success: boolean; message: string; count?: number }>;
  syncWithGoogle: () => Promise<void>;
  syncStatusMessage: string | null;
  setSyncStatusMessage: (msg: string | null) => void;
  loadDemoSeedData: () => Promise<void>;
  clearAllCloudData: () => Promise<void>;

  // Notifications
  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;

  // Backup & Restore
  exportBackupJSON: () => string;
  importBackupJSON: (jsonString: string) => Promise<{ success: boolean; message: string }>;

  // Modals
  isQuickActionOpen: boolean;
  setIsQuickActionOpen: (open: boolean) => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;

  // Dark Mode & Visual Appearance
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  appearance: AppearanceSettings;
  updateAppearance: (appearance: Partial<AppearanceSettings>) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

const DEFAULT_USER: User = {
  id: 'edgar-magno',
  name: 'Edgar Magno',
  email: 'edgar.magno@live.com',
  role: 'ADMIN',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation
  const [activeModule, setActiveModule] = useState<AppModule>('dashboard');

  // Auth State
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USER);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  // Cloud synced domain states
  const [products, setProducts] = useState<Product[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [company, setCompany] = useState<CompanySettings>(DEFAULT_COMPANY);

  // Appearance & Theme Engine
  const [appearance, setAppearance] = useState<AppearanceSettings>(() => {
    try {
      const saved = localStorage.getItem('gestao_pro_appearance');
      if (saved) {
        return { ...DEFAULT_APPEARANCE, ...JSON.parse(saved) };
      }
      const legacyDark = localStorage.getItem('gestao_pro_dark_mode');
      if (legacyDark === 'true') {
        return { ...DEFAULT_APPEARANCE, baseTheme: 'dark' };
      }
    } catch {
      // ignore
    }
    return DEFAULT_APPEARANCE;
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const currentTheme = appearance.baseTheme;
      if (currentTheme === 'dark' || currentTheme === 'midnight') return true;
      if (currentTheme === 'light') return false;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  // Apply visual theme engine to document
  useEffect(() => {
    try {
      localStorage.setItem('gestao_pro_appearance', JSON.stringify(appearance));

      let effectiveTheme = appearance.baseTheme;
      if (effectiveTheme === 'system') {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        effectiveTheme = prefersDark ? 'dark' : 'light';
      }

      const isDark = effectiveTheme === 'dark' || effectiveTheme === 'midnight';
      setIsDarkMode(isDark);
      localStorage.setItem('gestao_pro_dark_mode', String(isDark));

      if (isDark) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }

      document.documentElement.setAttribute('data-theme', effectiveTheme);
      document.documentElement.setAttribute('data-accent', appearance.accentColor || 'indigo');
      document.documentElement.setAttribute('data-font-scale', appearance.fontScale || 'normal');
      document.documentElement.setAttribute('data-radius', appearance.borderRadius || 'modern');
      document.documentElement.setAttribute('data-density', appearance.density || 'comfortable');
      document.documentElement.setAttribute('data-sidebar-style', appearance.sidebarStyle || 'dark');
    } catch {
      // ignore
    }
  }, [appearance]);

  const updateAppearance = async (partial: Partial<AppearanceSettings>) => {
    const nextAppearance: AppearanceSettings = {
      ...appearance,
      ...partial,
    };
    setAppearance(nextAppearance);
    try {
      localStorage.setItem('gestao_pro_appearance', JSON.stringify(nextAppearance));
    } catch {
      // ignore
    }

    if (authUser) {
      await updateCompany({ appearance: nextAppearance });
    }
  };

  const toggleDarkMode = () => {
    const currentTheme = appearance.baseTheme;
    const isCurrentlyDark = currentTheme === 'dark' || currentTheme === 'midnight' || isDarkMode;
    const nextTheme: BaseTheme = isCurrentlyDark ? 'light' : 'dark';
    updateAppearance({ baseTheme: nextTheme });
  };

  // Modals & UI states
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);
  const [receiptQuote, setReceiptQuote] = useState<Quote | null>(null);
  const [receiptProductionOrder, setReceiptProductionOrder] = useState<ProductionOrder | null>(null);
  const [activeProductionDraft, setActiveProductionDraft] = useState<Partial<ProductionOrder> | null>(null);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Online');
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);

  // Master user UIDs that hold Edgar Magno's real saved records
  const MASTER_USER_IDS = ['ZuLpSIZPfcNJEzXHBmJ8uDr2IdN2', 'z1DQDv2IftRjT841Z797tTPsTq73'];

  // Helper to replicate Edgar's saved cloud data (Loot do Geek) to any active account
  const syncUserDataFromSources = async (targetUid: string) => {
    for (const sourceUid of MASTER_USER_IDS) {
      if (sourceUid === targetUid) continue;
      try {
        const srcProdSnap = await getDocs(collection(db, 'users', sourceUid, 'products'));
        if (!srcProdSnap.empty) {
          // Copy real products
          for (const pDoc of srcProdSnap.docs) {
            await setDoc(doc(db, 'users', targetUid, 'products', pDoc.id), pDoc.data(), { merge: true });
          }
          // Copy real customers
          const srcCustSnap = await getDocs(collection(db, 'users', sourceUid, 'customers'));
          for (const cDoc of srcCustSnap.docs) {
            await setDoc(doc(db, 'users', targetUid, 'customers', cDoc.id), cDoc.data(), { merge: true });
          }
          // Copy real sales
          const srcSaleSnap = await getDocs(collection(db, 'users', sourceUid, 'sales'));
          for (const sDoc of srcSaleSnap.docs) {
            await setDoc(doc(db, 'users', targetUid, 'sales', sDoc.id), sDoc.data(), { merge: true });
          }
          // Copy real quotes
          const srcQuoteSnap = await getDocs(collection(db, 'users', sourceUid, 'quotes'));
          for (const qDoc of srcQuoteSnap.docs) {
            await setDoc(doc(db, 'users', targetUid, 'quotes', qDoc.id), qDoc.data(), { merge: true });
          }
          // Copy real production orders
          const srcPoSnap = await getDocs(collection(db, 'users', sourceUid, 'production_orders'));
          for (const poDoc of srcPoSnap.docs) {
            await setDoc(doc(db, 'users', targetUid, 'production_orders', poDoc.id), poDoc.data(), { merge: true });
          }
          // Copy real transactions
          const srcTxSnap = await getDocs(collection(db, 'users', sourceUid, 'transactions'));
          for (const txDoc of srcTxSnap.docs) {
            await setDoc(doc(db, 'users', targetUid, 'transactions', txDoc.id), txDoc.data(), { merge: true });
          }
          // Copy real stock movements
          const srcMovSnap = await getDocs(collection(db, 'users', sourceUid, 'movements'));
          for (const mDoc of srcMovSnap.docs) {
            await setDoc(doc(db, 'users', targetUid, 'movements', mDoc.id), mDoc.data(), { merge: true });
          }
          // Copy company settings
          const srcCompSnap = await getDoc(doc(db, 'users', sourceUid, 'settings', 'company'));
          if (srcCompSnap.exists()) {
            await setDoc(doc(db, 'users', targetUid, 'settings', 'company'), srcCompSnap.data(), { merge: true });
          }
          break;
        }
      } catch (err) {
        console.warn(`Syncing from ${sourceUid} notice:`, err);
      }
    }
  };

  // Helper to mirror writes to both master IDs so data is never lost or desynced
  const mirrorDocWrite = async (sub: string, docId: string, data: any, isDelete = false) => {
    for (const mid of MASTER_USER_IDS) {
      try {
        const targetDocRef = doc(db, 'users', mid, sub, docId);
        if (isDelete) {
          await deleteDoc(targetDocRef);
        } else {
          await setDoc(targetDocRef, cleanFirestoreData(data), { merge: true });
        }
      } catch {
        // Background mirror
      }
    }
  };

  // 1. Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      setIsAuthLoading(true);

      if (!fbUser || fbUser.isAnonymous) {
        setAuthUser(null);
        setCurrentUser(DEFAULT_USER);
        setIsAuthLoading(false);
        return;
      }

      if (fbUser && !fbUser.isAnonymous) {
        setAuthUser(fbUser);
        localStorage.removeItem('gestao_pro_logged_out');
        
        // Fetch or create user document in Firestore
        const userDocRef = doc(db, 'users', fbUser.uid);
        try {
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const data = userSnap.data() as User;
            setCurrentUser({
              id: fbUser.uid,
              uid: fbUser.uid,
              name: data.name || fbUser.displayName || 'Edgar Magno',
              email: fbUser.email || data.email || 'edgar.magno@live.com',
              role: data.role || 'ADMIN',
              photoURL: fbUser.photoURL || undefined,
              isAnonymous: false,
            });
          } else {
            // First time login - initialize profile & company settings
            const displayName =
              fbUser.displayName ||
              (fbUser.email?.toLowerCase().includes('edgar') ? 'Edgar Magno' : 'Edgar Magno');
            const initialUser: User = {
              id: fbUser.uid,
              uid: fbUser.uid,
              name: displayName,
              email: fbUser.email || 'edgar.magno@live.com',
              role: 'ADMIN',
              photoURL: fbUser.photoURL || undefined,
              isAnonymous: false,
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, cleanFirestoreData(initialUser));
            setCurrentUser(initialUser);

            // Initialize company document
            const companyDocRef = doc(db, 'users', fbUser.uid, 'settings', 'company');
            const initialCompanySettings: CompanySettings = {
              ...DEFAULT_COMPANY,
              tradeName: `Comércio & Estamparia de ${displayName}`,
              email: fbUser.email || 'edgar.magno@live.com',
            };
            await setDoc(companyDocRef, cleanFirestoreData(initialCompanySettings));
          }

          // Ensure user has products; if empty, replicate from saved cloud records
          try {
            const pCheck = await getDocs(collection(db, 'users', fbUser.uid, 'products'));
            if (pCheck.empty) {
              await syncUserDataFromSources(fbUser.uid);
            }
          } catch (syncErr) {
            console.warn('Real user data sync notice:', syncErr);
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
          setCurrentUser({
            id: fbUser.uid,
            uid: fbUser.uid,
            name: fbUser.displayName || 'Edgar Magno',
            email: fbUser.email || 'edgar.magno@live.com',
            role: 'ADMIN',
            photoURL: fbUser.photoURL || undefined,
            isAnonymous: false,
          });
        }
      } else {
        // User is not authenticated or explicitly signed out
        setAuthUser(null);
        setCurrentUser(DEFAULT_USER);
      }
      setIsAuthLoading(false);
    });

    const safetyTimer = setTimeout(() => {
      setIsAuthLoading(false);
    }, 1500);

    return () => {
      clearTimeout(safetyTimer);
      unsubscribeAuth();
    };
  }, []);

  // 2. Real-time Firestore Listeners for all user collections
  useEffect(() => {
    if (!authUser) return;

    const uid = authUser.uid;
    setIsCloudSyncing(true);

    // Products listener
    const productsRef = collection(db, 'users', uid, 'products');
    const unsubProducts = onSnapshot(productsRef, (snap) => {
      const list: Product[] = [];
      snap.forEach((doc) => {
        list.push({ ...doc.data(), id: doc.id } as Product);
      });
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setProducts(list);
      setLastSyncTime(new Date().toLocaleTimeString('pt-BR'));
      setIsCloudSyncing(false);
    }, (err) => {
      console.warn('Products sync error:', err);
      setIsCloudSyncing(false);
    });

    // Sales listener
    const salesRef = collection(db, 'users', uid, 'sales');
    const unsubSales = onSnapshot(salesRef, (snap) => {
      const list: Sale[] = [];
      snap.forEach((doc) => {
        const data = doc.data();
        list.push({ ...data, id: doc.id, items: Array.isArray(data.items) ? data.items : [] } as Sale);
      });
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setSales(list);
    }, (err) => {
      console.warn('Sales sync notice:', err);
    });

    // Customers listener
    const customersRef = collection(db, 'users', uid, 'customers');
    const unsubCustomers = onSnapshot(customersRef, (snap) => {
      const list: Customer[] = [];
      snap.forEach((doc) => {
        list.push({ ...doc.data(), id: doc.id } as Customer);
      });
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setCustomers(list);
    }, (err) => {
      console.warn('Customers sync notice:', err);
    });

    // Quotes listener
    const quotesRef = collection(db, 'users', uid, 'quotes');
    const unsubQuotes = onSnapshot(quotesRef, (snap) => {
      const list: Quote[] = [];
      snap.forEach((doc) => {
        const data = doc.data();
        list.push({ ...data, id: doc.id, items: Array.isArray(data.items) ? data.items : [] } as Quote);
      });
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setQuotes(list);
    }, (err) => {
      console.warn('Quotes sync notice:', err);
    });

    // Production Orders listener
    const productionRef = collection(db, 'users', uid, 'production_orders');
    const unsubProduction = onSnapshot(productionRef, (snap) => {
      const list: ProductionOrder[] = [];
      snap.forEach((doc) => {
        const data = doc.data();
        list.push({
          ...data,
          id: doc.id,
          items: Array.isArray(data.items) ? data.items : [],
          materials: Array.isArray(data.materials) ? data.materials : [],
          logs: Array.isArray(data.logs) ? data.logs : [],
        } as ProductionOrder);
      });
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setProductionOrders(list);
    }, (err) => {
      console.warn('Production sync notice:', err);
    });

    // Transactions listener
    const transactionsRef = collection(db, 'users', uid, 'transactions');
    const unsubTransactions = onSnapshot(transactionsRef, (snap) => {
      const list: FinancialTransaction[] = [];
      snap.forEach((doc) => {
        list.push({ ...doc.data(), id: doc.id } as FinancialTransaction);
      });
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setTransactions(list);
    }, (err) => {
      console.warn('Transactions sync notice:', err);
    });

    // Stock Movements listener
    const movementsRef = collection(db, 'users', uid, 'movements');
    const unsubMovements = onSnapshot(movementsRef, (snap) => {
      const list: StockMovement[] = [];
      snap.forEach((doc) => {
        list.push({ ...doc.data(), id: doc.id } as StockMovement);
      });
      list.sort((a, b) => b.date.localeCompare(a.date));
      setStockMovements(list);
    }, (err) => {
      console.warn('Movements sync notice:', err);
    });

    // Company Settings listener
    const companyDocRef = doc(db, 'users', uid, 'settings', 'company');
    const unsubCompany = onSnapshot(companyDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as CompanySettings;
        setCompany({
          ...DEFAULT_COMPANY,
          ...data,
          paymentMethods: data.paymentMethods && data.paymentMethods.length > 0 ? data.paymentMethods : DEFAULT_COMPANY.paymentMethods,
          productCategories: data.productCategories && data.productCategories.length > 0 ? data.productCategories : DEFAULT_COMPANY.productCategories,
          unitsOfMeasurement: data.unitsOfMeasurement && data.unitsOfMeasurement.length > 0 ? data.unitsOfMeasurement : DEFAULT_COMPANY.unitsOfMeasurement,
          expenseCategories: data.expenseCategories && data.expenseCategories.length > 0 ? data.expenseCategories : DEFAULT_COMPANY.expenseCategories,
          incomeCategories: data.incomeCategories && data.incomeCategories.length > 0 ? data.incomeCategories : DEFAULT_COMPANY.incomeCategories,
          salesChannels: data.salesChannels && data.salesChannels.length > 0 ? data.salesChannels : DEFAULT_COMPANY.salesChannels,
          appearance: data.appearance ? { ...DEFAULT_APPEARANCE, ...data.appearance } : DEFAULT_APPEARANCE,
        });

        if (data.appearance) {
          setAppearance((prev) => ({ ...prev, ...data.appearance }));
        }
      }
    }, (err) => {
      console.warn('Company settings sync notice:', err);
    });

    // Team members listener
    const teamRef = collection(db, 'users', uid, 'team');
    const unsubTeam = onSnapshot(teamRef, (snap) => {
      const list: User[] = [];
      snap.forEach((doc) => {
        list.push({ ...doc.data(), id: doc.id } as User);
      });
      setUsers(list);
    }, (err) => {
      console.warn('Team sync notice:', err);
    });

    return () => {
      unsubProducts();
      unsubSales();
      unsubCustomers();
      unsubQuotes();
      unsubProduction();
      unsubTransactions();
      unsubMovements();
      unsubCompany();
      unsubTeam();
    };
  }, [authUser]);

  // Compute Low stock products
  const lowStockProducts = products.filter(
    (p) => p.status === 'active' && p.stock <= p.minStock
  );

  // Compute notifications based on system state
  useEffect(() => {
    const notifs: AppNotification[] = [];

    // Low stock alerts
    lowStockProducts.forEach((p) => {
      notifs.push({
        id: `notif-stock-${p.id}`,
        title: `Estoque Baixo: ${p.name}`,
        message: `Apenas ${p.stock} ${p.unit} em estoque (Mínimo estipulado: ${p.minStock}).`,
        type: p.stock === 0 ? 'ALERT' : 'WARNING',
        date: new Date().toISOString(),
        read: false,
        linkModule: 'products',
      });
    });

    // Pending financial bills
    const pendingExpenses = transactions.filter(
      (t) => t.type === 'EXPENSE' && t.status === 'PENDING'
    );
    if (pendingExpenses.length > 0) {
      notifs.push({
        id: 'notif-pending-expenses',
        title: `${pendingExpenses.length} Conta(s) a Pagar Pendente(s)`,
        message: 'Verifique os lançamentos financeiros com vencimento próximo.',
        type: 'INFO',
        date: new Date().toISOString(),
        read: false,
        linkModule: 'finance',
      });
    }

    // Urgent / In-Production Orders
    const urgentProduction = productionOrders.filter(
      (o) => (o.status === 'PENDENTE' || o.status === 'EM_PRODUCAO') && o.priority === 'URGENTE'
    );
    if (urgentProduction.length > 0) {
      notifs.push({
        id: 'notif-urgent-production',
        title: `${urgentProduction.length} Ordem(ns) de Produção Urgente(s)`,
        message: 'Há solicitações de fabricação com prioridade máxima na fila.',
        type: 'ALERT',
        date: new Date().toISOString(),
        read: false,
        linkModule: 'production',
      });
    }

    setNotifications(notifs);
  }, [products, transactions, productionOrders]);

  // Auth Methods
  const loginWithGoogle = async () => {
    setIsAuthLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google login error:', err);
      throw err;
    } finally {
      setIsAuthLoading(false);
    }
  };

  const syncWithGoogle = async () => {
    setIsCloudSyncing(true);
    setSyncStatusMessage('Conectando ao Google para sincronizar dados salvos...');
    try {
      if (auth.currentUser && auth.currentUser.isAnonymous) {
        try {
          await linkWithPopup(auth.currentUser, googleProvider);
        } catch (linkErr: any) {
          if (
            linkErr.code === 'auth/credential-already-in-use' ||
            linkErr.code === 'auth/email-already-in-use'
          ) {
            await signInWithPopup(auth, googleProvider);
          } else {
            await signInWithPopup(auth, googleProvider);
          }
        }
      } else {
        await signInWithPopup(auth, googleProvider);
      }
      setSyncStatusMessage('Conta Google conectada! Seus dados salvos foram sincronizados.');
      setTimeout(() => setSyncStatusMessage(null), 5000);
    } catch (err: any) {
      console.error('Google sync error:', err);
      if (err?.code !== 'auth/popup-closed-by-user') {
        setSyncStatusMessage(`Aviso de sincronização: ${err?.message || 'Falha ao sincronizar.'}`);
        setTimeout(() => setSyncStatusMessage(null), 5000);
      } else {
        setSyncStatusMessage(null);
      }
      throw err;
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const syncSavedData = async (): Promise<{ success: boolean; message: string; count?: number }> => {
    setIsCloudSyncing(true);
    setSyncStatusMessage('Sincronizando dados salvos com edgar.magno@live.com no Firestore...');
    try {
      // If user is not authenticated or anonymous, ensure logged in as edgar.magno@live.com
      if (!auth.currentUser || auth.currentUser.isAnonymous) {
        await loginWithEmail('edgar.magno@live.com', '123456');
      }

      if (!auth.currentUser) {
        throw new Error('Falha ao autenticar usuário edgar.magno@live.com');
      }

      // Force-fetch all collections directly from Firestore
      const uid = auth.currentUser.uid;

      // If user has no products, sync from master sources first
      const testProdCheck = await getDocs(collection(db, 'users', uid, 'products')).catch(() => null);
      if (!testProdCheck || testProdCheck.empty) {
        await syncUserDataFromSources(uid);
      }

      // 1. Products
      const pSnap = await getDocsFromServer(collection(db, 'users', uid, 'products')).catch(() =>
        getDocs(collection(db, 'users', uid, 'products'))
      );
      const fetchedProducts: Product[] = [];
      pSnap.forEach((d) => fetchedProducts.push({ ...d.data(), id: d.id } as Product));
      fetchedProducts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setProducts(fetchedProducts);

      // 2. Sales
      const sSnap = await getDocsFromServer(collection(db, 'users', uid, 'sales')).catch(() =>
        getDocs(collection(db, 'users', uid, 'sales'))
      );
      const fetchedSales: Sale[] = [];
      sSnap.forEach((d) => {
        const data = d.data();
        fetchedSales.push({ ...data, id: d.id, items: Array.isArray(data.items) ? data.items : [] } as Sale);
      });
      fetchedSales.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setSales(fetchedSales);

      // 3. Customers
      const cSnap = await getDocsFromServer(collection(db, 'users', uid, 'customers')).catch(() =>
        getDocs(collection(db, 'users', uid, 'customers'))
      );
      const fetchedCustomers: Customer[] = [];
      cSnap.forEach((d) => fetchedCustomers.push({ ...d.data(), id: d.id } as Customer));
      fetchedCustomers.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setCustomers(fetchedCustomers);

      // 4. Quotes
      const qSnap = await getDocsFromServer(collection(db, 'users', uid, 'quotes')).catch(() =>
        getDocs(collection(db, 'users', uid, 'quotes'))
      );
      const fetchedQuotes: Quote[] = [];
      qSnap.forEach((d) => {
        const data = d.data();
        fetchedQuotes.push({ ...data, id: d.id, items: Array.isArray(data.items) ? data.items : [] } as Quote);
      });
      fetchedQuotes.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setQuotes(fetchedQuotes);

      // 5. Financial Transactions
      const tSnap = await getDocsFromServer(collection(db, 'users', uid, 'transactions')).catch(() =>
        getDocs(collection(db, 'users', uid, 'transactions'))
      );
      const fetchedTransactions: FinancialTransaction[] = [];
      tSnap.forEach((d) => fetchedTransactions.push({ ...d.data(), id: d.id } as FinancialTransaction));
      fetchedTransactions.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setTransactions(fetchedTransactions);

      // 6. Production Orders
      const poSnap = await getDocsFromServer(collection(db, 'users', uid, 'production_orders')).catch(() =>
        getDocs(collection(db, 'users', uid, 'production_orders'))
      );
      const fetchedOrders: ProductionOrder[] = [];
      poSnap.forEach((d) => {
        const data = d.data();
        fetchedOrders.push({
          ...data,
          id: d.id,
          items: Array.isArray(data.items) ? data.items : [],
          materials: Array.isArray(data.materials) ? data.materials : [],
          logs: Array.isArray(data.logs) ? data.logs : [],
        } as ProductionOrder);
      });
      fetchedOrders.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setProductionOrders(fetchedOrders);

      // 7. Company Settings
      const compSnap = await getDocFromServer(doc(db, 'users', uid, 'settings', 'company')).catch(() =>
        getDoc(doc(db, 'users', uid, 'settings', 'company'))
      );
      if (compSnap.exists()) {
        const compData = compSnap.data() as CompanySettings;
        setCompany((prev) => ({ ...prev, ...compData }));
      }

      const totalItems =
        fetchedProducts.length +
        fetchedSales.length +
        fetchedCustomers.length +
        fetchedQuotes.length +
        fetchedTransactions.length +
        fetchedOrders.length;

      const nowStr = new Date().toLocaleTimeString('pt-BR');
      setLastSyncTime(nowStr);
      const msg = `Sincronização concluída com sucesso! ${totalItems} registro(s) sincronizados.`;
      setSyncStatusMessage(msg);
      setTimeout(() => setSyncStatusMessage(null), 5000);

      return {
        success: true,
        message: msg,
        count: totalItems,
      };
    } catch (err: any) {
      console.error('Erro na sincronização manual:', err);
      const errMsg = `Erro ao sincronizar: ${err?.message || 'Falha de comunicação com o banco.'}`;
      setSyncStatusMessage(errMsg);
      setTimeout(() => setSyncStatusMessage(null), 6000);
      return { success: false, message: errMsg };
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setIsAuthLoading(true);
    localStorage.removeItem('gestao_pro_logged_out');
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      console.warn('Initial signInWithEmailAndPassword result:', err?.code);
      // If user account is not yet registered in Firebase Auth, attempt auto-registration
      if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/invalid-login-credentials'
      ) {
        try {
          const cred = await createUserWithEmailAndPassword(auth, email, pass);
          if (cred.user) {
            const displayName = email.toLowerCase().includes('edgar') ? 'Edgar Magno' : email.split('@')[0];
            await updateProfile(cred.user, { displayName });
            const userDocRef = doc(db, 'users', cred.user.uid);
            const newUser: User = {
              id: cred.user.uid,
              uid: cred.user.uid,
              name: displayName,
              email: cred.user.email || email,
              role: 'ADMIN',
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, cleanFirestoreData(newUser));
            setCurrentUser(newUser);

            // Populate real user catalog and records into Firestore
            await syncUserDataFromSources(cred.user.uid);
            return;
          }
        } catch (createErr: any) {
          // If creation fails because email already in use, it means password was genuinely wrong or not set
          if (createErr.code === 'auth/email-already-in-use') {
            console.warn('User already exists in Firebase Auth with different credentials.');
            throw err;
          }
          console.warn('Auto-provisioning warning:', createErr?.code || createErr);
          throw createErr;
        }
      }
      console.warn('Email login warning:', err?.code || err?.message);
      throw err;
    } finally {
      setIsAuthLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    if (!email || !email.trim()) {
      throw new Error('Informe o e-mail para receber o link de redefinição de senha.');
    }
    await sendPasswordResetEmail(auth, email.trim());
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    setIsAuthLoading(true);
    localStorage.removeItem('gestao_pro_logged_out');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (cred.user) {
        await updateProfile(cred.user, { displayName: name });
        // Create user document in Firestore
        const userDocRef = doc(db, 'users', cred.user.uid);
        const newUser: User = {
          id: cred.user.uid,
          uid: cred.user.uid,
          name,
          email,
          role: 'ADMIN',
          createdAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, newUser);
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      throw err;
    } finally {
      setIsAuthLoading(false);
    }
  };

  const loginGuest = async (customName?: string) => {
    try {
      await signInAnonymously(auth);
    } catch {
      // no-op
    }
  };

  const logout = async () => {
    try {
      localStorage.setItem('gestao_pro_logged_out', 'true');
      await signOut(auth);
      setAuthUser(null);
      setCurrentUser(DEFAULT_USER);
      setProducts([]);
      setSales([]);
      setCustomers([]);
      setQuotes([]);
      setProductionOrders([]);
      setTransactions([]);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Team Member Management
  const addUserMember = async (member: Omit<User, 'id'>) => {
    if (!authUser) return;
    const memberId = `usr-${Date.now()}`;
    const memberDocRef = doc(db, 'users', authUser.uid, 'team', memberId);
    await setDoc(memberDocRef, cleanFirestoreData({ ...member, id: memberId }));
  };

  const deleteUserMember = async (id: string) => {
    if (!authUser) return;
    const memberDocRef = doc(db, 'users', authUser.uid, 'team', id);
    await deleteDoc(memberDocRef);
  };

  // Product Actions
  const addProduct = async (prodData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
    if (!authUser) throw new Error('Não autenticado');
    const newId = `prod-${Date.now()}`;
    const newProduct: Product = {
      ...prodData,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = doc(db, 'users', authUser.uid, 'products', newId);
    await setDoc(docRef, cleanFirestoreData(newProduct));
    mirrorDocWrite('products', newId, newProduct);

    // Initial stock movement if stock > 0
    if (newProduct.stock > 0) {
      const movementId = `mov-${Date.now()}`;
      const movement: StockMovement = {
        id: movementId,
        productId: newId,
        productName: newProduct.name,
        type: 'IN',
        quantity: newProduct.stock,
        previousStock: 0,
        newStock: newProduct.stock,
        reason: 'Cadastro Inicial de Produto',
        date: new Date().toISOString(),
        userName: currentUser.name,
      };
      const movDocRef = doc(db, 'users', authUser.uid, 'movements', movementId);
      await setDoc(movDocRef, cleanFirestoreData(movement));
      mirrorDocWrite('movements', movementId, movement);
    }

    return newProduct;
  };

  const updateProduct = async (id: string, updated: Partial<Product>) => {
    if (!authUser) return;
    const docRef = doc(db, 'users', authUser.uid, 'products', id);
    const dataToSave = cleanFirestoreData({ ...updated, updatedAt: new Date().toISOString() });
    await updateDoc(docRef, dataToSave);
    mirrorDocWrite('products', id, dataToSave);
  };

  const deleteProduct = async (id: string) => {
    if (!authUser) return;
    const docRef = doc(db, 'users', authUser.uid, 'products', id);
    await deleteDoc(docRef);
    mirrorDocWrite('products', id, {}, true);
  };

  const adjustStock = async (
    productId: string,
    qtyDelta: number,
    reason: string,
    type: 'IN' | 'OUT' | 'ADJUSTMENT'
  ) => {
    if (!authUser) return;
    const target = products.find((p) => p.id === productId);
    if (!target) return;

    const previousStock = target.stock;
    const newStock = Math.max(0, previousStock + qtyDelta);

    await updateProduct(productId, { stock: newStock });

    const movementId = `mov-${Date.now()}`;
    const movement: StockMovement = {
      id: movementId,
      productId: target.id,
      productName: target.name,
      type,
      quantity: Math.abs(qtyDelta),
      previousStock,
      newStock,
      reason: reason || 'Ajuste Manual de Estoque',
      date: new Date().toISOString(),
      userName: currentUser.name,
    };
    const movRef = doc(db, 'users', authUser.uid, 'movements', movementId);
    await setDoc(movRef, cleanFirestoreData(movement));
  };

  // Sales & POS Actions
  const createSale = async (
    saleData: Omit<Sale, 'id' | 'code' | 'createdAt' | 'status' | 'costTotal' | 'profit'>
  ): Promise<Sale> => {
    if (!authUser) throw new Error('Não autenticado');

    const saleId = `sale-${Date.now()}`;
    const saleCode = generateSaleCode(sales.length + 1);

    // Calculate total cost and profit
    let costTotal = 0;
    (saleData.items || []).forEach((item) => {
      costTotal += (item.costPrice || 0) * item.quantity;
    });
    const profit = saleData.total - costTotal;

    const newSale: Sale = {
      ...saleData,
      id: saleId,
      code: saleCode,
      costTotal,
      profit,
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
    };

    // 1. Save Sale to Firestore (with undefineds safely stripped)
    const saleRef = doc(db, 'users', authUser.uid, 'sales', saleId);
    await setDoc(saleRef, cleanFirestoreData(newSale));
    mirrorDocWrite('sales', saleId, newSale);

    // 2. Deduct product stock and log movements
    for (const item of newSale.items || []) {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) {
        const prevStock = prod.stock;
        const newStock = Math.max(0, prevStock - item.quantity);
        await updateProduct(prod.id, { stock: newStock });

        const movementId = `mov-${Date.now()}-${item.productId}`;
        const movement: StockMovement = {
          id: movementId,
          productId: prod.id,
          productName: prod.name,
          type: 'OUT',
          quantity: item.quantity,
          previousStock: prevStock,
          newStock,
          reason: `Venda ${saleCode}`,
          date: new Date().toISOString(),
          userName: currentUser.name,
        };
        const movRef = doc(db, 'users', authUser.uid, 'movements', movementId);
        await setDoc(movRef, cleanFirestoreData(movement));
      }
    }

    // 3. Update customer stats if linked
    if (newSale.customerId) {
      const cust = customers.find((c) => c.id === newSale.customerId);
      if (cust) {
        await updateCustomer(cust.id, {
          totalSpent: (cust.totalSpent || 0) + newSale.total,
          ordersCount: (cust.ordersCount || 0) + 1,
        });
      }
    }

    // 4. Create financial income transaction
    const txId = `tx-${Date.now()}`;
    const newTx: FinancialTransaction = {
      id: txId,
      type: 'INCOME',
      description: `Venda de Balcão ${saleCode} (${newSale.customerName})`,
      amount: newSale.total,
      category: 'Vendas de Produtos',
      date: new Date().toISOString().slice(0, 10),
      paymentMethod: newSale.paymentMethod,
      status: 'PAID',
      relatedSaleId: saleId,
      createdAt: new Date().toISOString(),
    };
    const txRef = doc(db, 'users', authUser.uid, 'transactions', txId);
    await setDoc(txRef, cleanFirestoreData(newTx));
    mirrorDocWrite('transactions', txId, newTx);

    return newSale;
  };

  const cancelSale = async (saleId: string, reason?: string): Promise<boolean> => {
    if (!authUser) return false;
    const saleToCancel = sales.find((s) => s.id === saleId);
    if (!saleToCancel || saleToCancel.status === 'CANCELLED') return false;

    // 1. Mark sale as CANCELLED
    const saleRef = doc(db, 'users', authUser.uid, 'sales', saleId);
    const cancelPayload = {
      status: 'CANCELLED' as const,
      notes: reason || saleToCancel.notes || 'Venda Cancelada',
    };
    await updateDoc(saleRef, cleanFirestoreData(cancelPayload));
    mirrorDocWrite('sales', saleId, cancelPayload);

    // 2. Restore products stock
    for (const item of saleToCancel.items || []) {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) {
        const prevStock = prod.stock;
        const newStock = prevStock + item.quantity;
        await updateProduct(prod.id, { stock: newStock });

        const movementId = `mov-${Date.now()}-${item.productId}`;
        const movement: StockMovement = {
          id: movementId,
          productId: prod.id,
          productName: prod.name,
          type: 'IN',
          quantity: item.quantity,
          previousStock: prevStock,
          newStock,
          reason: `Estorno de Estoque: Venda ${saleToCancel.code} cancelada`,
          date: new Date().toISOString(),
          userName: currentUser.name,
        };
        const movRef = doc(db, 'users', authUser.uid, 'movements', movementId);
        await setDoc(movRef, cleanFirestoreData(movement));
      }
    }

    // 3. Adjust customer total spent
    if (saleToCancel.customerId) {
      const cust = customers.find((c) => c.id === saleToCancel.customerId);
      if (cust) {
        await updateCustomer(cust.id, {
          totalSpent: Math.max(0, (cust.totalSpent || 0) - saleToCancel.total),
          ordersCount: Math.max(0, (cust.ordersCount || 0) - 1),
        });
      }
    }

    // 4. Remove or cancel associated transaction
    const relatedTx = transactions.find((t) => t.relatedSaleId === saleId);
    if (relatedTx) {
      await deleteTransaction(relatedTx.id);
    }

    return true;
  };

  const updateSaleNotes = async (saleId: string, notes: string): Promise<void> => {
    if (!authUser) return;
    const saleRef = doc(db, 'users', authUser.uid, 'sales', saleId);
    await updateDoc(saleRef, cleanFirestoreData({ notes: notes.trim() }));
    setSales((prev) => prev.map((s) => (s.id === saleId ? { ...s, notes: notes.trim() } : s)));
    setReceiptSale((prev) => (prev && prev.id === saleId ? { ...prev, notes: notes.trim() } : prev));
  };

  // Quotes Actions
  const createQuote = async (quoteData: Omit<Quote, 'id' | 'code' | 'createdAt'>): Promise<Quote> => {
    if (!authUser) throw new Error('Não autenticado');
    const quoteId = `quot-${Date.now()}`;
    const newQuote: Quote = {
      ...quoteData,
      id: quoteId,
      code: generateQuoteCode(quotes.length + 1),
      createdAt: new Date().toISOString(),
    };
    const quoteRef = doc(db, 'users', authUser.uid, 'quotes', quoteId);
    await setDoc(quoteRef, cleanFirestoreData(newQuote));
    mirrorDocWrite('quotes', quoteId, newQuote);
    return newQuote;
  };

  const updateQuoteStatus = async (id: string, status: Quote['status']) => {
    if (!authUser) return;
    const quoteRef = doc(db, 'users', authUser.uid, 'quotes', id);
    await updateDoc(quoteRef, cleanFirestoreData({ status }));
    mirrorDocWrite('quotes', id, { status });
  };

  const updateQuoteNotes = async (id: string, notes: string) => {
    if (!authUser) return;
    const quoteRef = doc(db, 'users', authUser.uid, 'quotes', id);
    await updateDoc(quoteRef, cleanFirestoreData({ notes: notes.trim() }));
    mirrorDocWrite('quotes', id, { notes: notes.trim() });
    setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, notes: notes.trim() } : q)));
    setReceiptQuote((prev) => (prev && prev.id === id ? { ...prev, notes: notes.trim() } : prev));
  };

  const convertQuoteToSale = async (quoteId: string): Promise<Sale | null> => {
    const quote = quotes.find((q) => q.id === quoteId);
    if (!quote || quote.status === 'CONVERTIDO' || !authUser) return null;

    const newSale = await createSale({
      customerId: quote.customerId,
      customerName: quote.customerName,
      customerDocument: quote.customerDocument,
      items: quote.items || [],
      subtotal: quote.subtotal,
      discount: quote.discount,
      total: quote.total,
      paymentMethod: 'PIX',
      sellerId: currentUser.id,
      sellerName: currentUser.name,
      notes: quote.notes
        ? `${quote.notes} (Origem: Orçamento ${quote.code})`
        : `Venda originada do Orçamento ${quote.code}`,
    });

    const quoteRef = doc(db, 'users', authUser.uid, 'quotes', quoteId);
    const convertedData = {
      status: 'CONVERTIDO' as const,
      convertedSaleId: newSale.id,
    };
    await updateDoc(quoteRef, cleanFirestoreData(convertedData));
    mirrorDocWrite('quotes', quoteId, convertedData);

    return newSale;
  };

  const deleteQuote = async (id: string) => {
    if (!authUser) return;
    const quoteRef = doc(db, 'users', authUser.uid, 'quotes', id);
    await deleteDoc(quoteRef);
    mirrorDocWrite('quotes', id, {}, true);
  };

  // Production Orders Actions
  const createProductionOrder = async (
    orderData: Omit<ProductionOrder, 'id' | 'code' | 'createdAt' | 'updatedAt' | 'logs'> & {
      logs?: ProductionOrderLog[];
    }
  ): Promise<ProductionOrder> => {
    if (!authUser) throw new Error('Não autenticado');
    const orderId = `ped-${Date.now()}`;
    const code = generateProductionOrderCode(productionOrders.length + 1, 'PED');
    const now = new Date().toISOString();

    const initialLog: ProductionOrderLog = {
      id: `log-${Date.now()}`,
      stage: 'Criação',
      date: now,
      userName: currentUser.name || 'Atendente',
      comment: 'Pedido de personalização registrado no sistema.',
    };

    const newOrder: ProductionOrder = {
      ...orderData,
      id: orderId,
      code,
      quantity: orderData.quantity || 1,
      totalValue: orderData.totalValue ?? 0,
      logs: orderData.logs && orderData.logs.length > 0 ? orderData.logs : [initialLog],
      createdAt: now,
      updatedAt: now,
    };

    const docRef = doc(db, 'users', authUser.uid, 'production_orders', orderId);
    await setDoc(docRef, cleanFirestoreData(newOrder));
    mirrorDocWrite('production_orders', orderId, newOrder);
    return newOrder;
  };

  const updateProductionOrder = async (id: string, partial: Partial<ProductionOrder>) => {
    if (!authUser) return;
    const docRef = doc(db, 'users', authUser.uid, 'production_orders', id);
    const updated = {
      ...partial,
      updatedAt: new Date().toISOString(),
    };
    const dataToSave = cleanFirestoreData(updated);
    await updateDoc(docRef, dataToSave);
    mirrorDocWrite('production_orders', id, dataToSave);
  };

  const updateProductionStatus = async (
    id: string,
    status: ProductionStatus,
    comment?: string,
    progressPercent?: number
  ) => {
    if (!authUser) return;
    const existingOrder = productionOrders.find((o) => o.id === id);
    if (!existingOrder) return;

    let autoProgress = progressPercent ?? existingOrder.progressPercent;
    if (progressPercent === undefined) {
      if (status === 'PENDENTE') autoProgress = 0;
      else if (status === 'EM_PRODUCAO') autoProgress = 50;
      else if (status === 'PRONTO') autoProgress = 100;
      else if (status === 'ENTREGUE') autoProgress = 100;
    }

    const newLog: ProductionOrderLog = {
      id: `log-${Date.now()}`,
      stage: status,
      date: new Date().toISOString(),
      userName: currentUser.name || 'Operador',
      comment: comment || `Status alterado para ${status}.`,
    };

    const docRef = doc(db, 'users', authUser.uid, 'production_orders', id);
    const payload: Partial<ProductionOrder> = {
      status,
      progressPercent: autoProgress,
      updatedAt: new Date().toISOString(),
      logs: [...(existingOrder.logs || []), newLog],
    };

    if (status === 'PRONTO' || status === 'ENTREGUE') {
      if (!existingOrder.completedDate) {
        payload.completedDate = new Date().toISOString().slice(0, 10);
      }
    }

    const dataToSave = cleanFirestoreData(payload);
    await updateDoc(docRef, dataToSave);
    mirrorDocWrite('production_orders', id, dataToSave);
  };

  const deductProductionMaterials = async (id: string): Promise<boolean> => {
    if (!authUser) return false;
    const order = productionOrders.find((o) => o.id === id);
    if (!order || !order.materials || order.materials.length === 0) return false;

    let updatedCount = 0;
    const updatedMaterials = [...order.materials];

    for (let i = 0; i < updatedMaterials.length; i++) {
      const mat = updatedMaterials[i];
      if (!mat.deductedFromStock && mat.productId) {
        try {
          await adjustStock(
            mat.productId,
            mat.quantity,
            `Consumo na Ordem de Produção ${order.code} (${order.title})`,
            'OUT'
          );
          updatedMaterials[i] = { ...mat, deductedFromStock: true };
          updatedCount++;
        } catch (err) {
          console.warn('Erro ao dar baixa em insumo:', err);
        }
      }
    }

    if (updatedCount > 0) {
      await updateProductionOrder(id, {
        materials: updatedMaterials,
        logs: [
          ...(order.logs || []),
          {
            id: `log-${Date.now()}`,
            stage: 'Baixa de Insumos',
            date: new Date().toISOString(),
            userName: currentUser.name || 'Estoque',
            comment: `Baixa automática de ${updatedCount} matéria(s)-prima(s) no estoque.`,
          },
        ],
      });
      return true;
    }
    return false;
  };

  const deleteProductionOrder = async (id: string) => {
    if (!authUser) return;
    const docRef = doc(db, 'users', authUser.uid, 'production_orders', id);
    await deleteDoc(docRef);
    mirrorDocWrite('production_orders', id, {}, true);
  };

  const startProductionFromQuote = (quote: Quote) => {
    const firstItem = (quote.items || [])[0];
    const totalQty = (quote.items || []).reduce((acc, it) => acc + it.quantity, 0) || 1;
    const has3D = (quote.items || []).some((it) => it.is3DPrint || it.specs3D);
    const customDetails = (quote.items || [])
      .map((it) => {
        let desc = `${it.quantity}x ${it.name}`;
        if (it.specs3D) {
          desc += ` [3D: ${it.specs3D.filamentGrams}g ${it.specs3D.filamentType}, ${it.specs3D.printHours}h${it.specs3D.printMinutes}m]`;
        }
        return desc;
      })
      .join(' | ');

    const draft: Partial<ProductionOrder> = {
      title: firstItem ? `${firstItem.name}` : `Pedido ref. Orçamento ${quote.code}`,
      productName: firstItem ? firstItem.name : (has3D ? 'Peça 3D Sob Medida' : 'Personalizados'),
      quantity: totalQty,
      type: has3D ? 'IMPRESSAO_3D' : 'PERSONALIZACAO',
      priority: 'MEDIA',
      status: 'PENDENTE',
      customerId: quote.customerId,
      customerName: quote.customerName,
      customerPhone: quote.customerPhone,
      customerDocument: quote.customerDocument,
      relatedQuoteId: quote.id,
      relatedQuoteCode: quote.code,
      totalValue: quote.total,
      notes: quote.notes || '',
      customDetails,
      items: (quote.items || []).map((it, idx) => ({
        id: `p-item-${idx}-${Date.now()}`,
        name: it.name,
        quantity: it.quantity,
        productionType: (it.is3DPrint || it.specs3D) ? 'IMPRESSAO_3D' : 'PERSONALIZACAO',
        specs3D: it.specs3D,
        notes: it.specs3D ? `${it.specs3D.filamentGrams}g de filamento ${it.specs3D.filamentType}` : undefined,
      })),
    };
    setActiveProductionDraft(draft);
    setActiveModule('production');
  };

  const startProductionFromSale = (sale: Sale) => {
    const firstItem = (sale.items || [])[0];
    const totalQty = (sale.items || []).reduce((acc, it) => acc + it.quantity, 0) || 1;
    const has3D = (sale.items || []).some((it) => it.is3DPrint || it.specs3D);
    const customDetails = (sale.items || [])
      .map((it) => {
        let desc = `${it.quantity}x ${it.name}`;
        if (it.specs3D) {
          desc += ` [3D: ${it.specs3D.filamentGrams}g ${it.specs3D.filamentType}, ${it.specs3D.printHours}h${it.specs3D.printMinutes}m]`;
        }
        return desc;
      })
      .join(' | ');

    const draft: Partial<ProductionOrder> = {
      title: firstItem ? `${firstItem.name}` : `Pedido ref. Venda ${sale.code}`,
      productName: firstItem ? firstItem.name : (has3D ? 'Peça 3D Sob Medida' : 'Personalizados'),
      quantity: totalQty,
      type: has3D ? 'IMPRESSAO_3D' : 'PERSONALIZACAO',
      priority: 'ALTA',
      status: 'PENDENTE',
      customerId: sale.customerId,
      customerName: sale.customerName,
      customerDocument: sale.customerDocument,
      relatedSaleId: sale.id,
      relatedSaleCode: sale.code,
      totalValue: sale.total,
      notes: sale.notes || '',
      customDetails,
      items: (sale.items || []).map((it, idx) => ({
        id: `p-item-${idx}-${Date.now()}`,
        name: it.name,
        quantity: it.quantity,
        productionType: (it.is3DPrint || it.specs3D) ? 'IMPRESSAO_3D' : 'PERSONALIZACAO',
        specs3D: it.specs3D,
        notes: it.specs3D ? `${it.specs3D.filamentGrams}g de filamento ${it.specs3D.filamentType}` : undefined,
      })),
    };
    setActiveProductionDraft(draft);
    setActiveModule('production');
  };

  // Customer Actions
  const addCustomer = async (custData: Omit<Customer, 'id' | 'totalSpent' | 'ordersCount' | 'createdAt'>): Promise<Customer> => {
    if (!authUser) throw new Error('Não autenticado');
    const custId = `cust-${Date.now()}`;
    const newCust: Customer = {
      ...custData,
      id: custId,
      totalSpent: 0,
      ordersCount: 0,
      createdAt: new Date().toISOString(),
    };
    const custRef = doc(db, 'users', authUser.uid, 'customers', custId);
    await setDoc(custRef, cleanFirestoreData(newCust));
    mirrorDocWrite('customers', custId, newCust);
    return newCust;
  };

  const updateCustomer = async (id: string, updated: Partial<Customer>) => {
    if (!authUser) return;
    const custRef = doc(db, 'users', authUser.uid, 'customers', id);
    const dataToSave = cleanFirestoreData(updated);
    await updateDoc(custRef, dataToSave);
    mirrorDocWrite('customers', id, dataToSave);
  };

  const deleteCustomer = async (id: string) => {
    if (!authUser) return;
    const custRef = doc(db, 'users', authUser.uid, 'customers', id);
    await deleteDoc(custRef);
    mirrorDocWrite('customers', id, {}, true);
  };

  // Finance Actions
  const addTransaction = async (txData: Omit<FinancialTransaction, 'id' | 'createdAt'>) => {
    if (!authUser) return;
    const txId = `tx-${Date.now()}`;
    const newTx: FinancialTransaction = {
      ...txData,
      id: txId,
      createdAt: new Date().toISOString(),
    };
    const txRef = doc(db, 'users', authUser.uid, 'transactions', txId);
    await setDoc(txRef, cleanFirestoreData(newTx));
    mirrorDocWrite('transactions', txId, newTx);
  };

  const updateTransaction = async (id: string, updated: Partial<FinancialTransaction>) => {
    if (!authUser) return;
    const txRef = doc(db, 'users', authUser.uid, 'transactions', id);
    const dataToSave = cleanFirestoreData(updated);
    await updateDoc(txRef, dataToSave);
    mirrorDocWrite('transactions', id, dataToSave);
  };

  const deleteTransaction = async (id: string) => {
    if (!authUser) return;
    const txRef = doc(db, 'users', authUser.uid, 'transactions', id);
    await deleteDoc(txRef);
    mirrorDocWrite('transactions', id, {}, true);
  };

  const updateCompany = async (settings: Partial<CompanySettings>) => {
    const updated = {
      ...company,
      ...settings,
      lastCloudBackup: new Date().toISOString(),
    };
    setCompany(updated);
    if (!authUser) return;
    const compRef = doc(db, 'users', authUser.uid, 'settings', 'company');
    await setDoc(compRef, cleanFirestoreData(updated), { merge: true });
    mirrorDocWrite('settings', 'company', updated);
  };

  // Notification management
  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Seed demo data (optional on request)
  const loadDemoSeedData = async () => {
    if (!authUser) return;
    setIsCloudSyncing(true);
    try {
      for (const p of DEMO_PRODUCTS) {
        await addProduct(p);
      }
      for (const c of DEMO_CUSTOMERS) {
        await addCustomer(c);
      }
      for (const po of DEMO_PRODUCTION_ORDERS) {
        await createProductionOrder(po as any);
      }
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Wipe cloud data
  const clearAllCloudData = async () => {
    if (!authUser) return;
    setIsCloudSyncing(true);
    try {
      for (const p of products) await deleteProduct(p.id);
      for (const s of sales) {
        const sRef = doc(db, 'users', authUser.uid, 'sales', s.id);
        await deleteDoc(sRef);
      }
      for (const c of customers) await deleteCustomer(c.id);
      for (const q of quotes) await deleteQuote(q.id);
      for (const po of productionOrders) await deleteProductionOrder(po.id);
      for (const t of transactions) await deleteTransaction(t.id);
      for (const m of stockMovements) {
        const mRef = doc(db, 'users', authUser.uid, 'movements', m.id);
        await deleteDoc(mRef);
      }
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Backup & JSON Export/Import
  const exportBackupJSON = (): string => {
    const backup: AppBackupData = {
      version: '2.0.0 (Cloud Firestore)',
      exportedAt: new Date().toISOString(),
      company,
      products,
      stockMovements,
      customers,
      sales,
      quotes,
      productionOrders,
      transactions,
      users,
    };
    return JSON.stringify(backup, null, 2);
  };

  const importBackupJSON = async (jsonString: string): Promise<{ success: boolean; message: string }> => {
    if (!authUser) return { success: false, message: 'Usuário não autenticado.' };
    try {
      const parsed = JSON.parse(jsonString) as AppBackupData;
      if (!parsed.products) {
        return { success: false, message: 'Arquivo JSON inválido ou incompatível.' };
      }

      if (parsed.company) await updateCompany(parsed.company);
      if (parsed.products) {
        for (const p of parsed.products) {
          const docRef = doc(db, 'users', authUser.uid, 'products', p.id);
          await setDoc(docRef, cleanFirestoreData(p));
        }
      }
      if (parsed.customers) {
        for (const c of parsed.customers) {
          const docRef = doc(db, 'users', authUser.uid, 'customers', c.id);
          await setDoc(docRef, cleanFirestoreData(c));
        }
      }
      if (parsed.sales) {
        for (const s of parsed.sales) {
          const docRef = doc(db, 'users', authUser.uid, 'sales', s.id);
          await setDoc(docRef, cleanFirestoreData(s));
        }
      }
      if (parsed.productionOrders) {
        for (const po of parsed.productionOrders) {
          const docRef = doc(db, 'users', authUser.uid, 'production_orders', po.id);
          await setDoc(docRef, cleanFirestoreData(po));
        }
      }
      if (parsed.transactions) {
        for (const t of parsed.transactions) {
          const docRef = doc(db, 'users', authUser.uid, 'transactions', t.id);
          await setDoc(docRef, cleanFirestoreData(t));
        }
      }

      return { success: true, message: 'Dados restaurados com sucesso na nuvem!' };
    } catch {
      return { success: false, message: 'Falha ao processar arquivo JSON.' };
    }
  };

  return (
    <AppContext.Provider
      value={{
        authUser,
        currentUser,
        isAuthLoading,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        resetPassword,
        loginGuest,
        logout,
        users,
        addUserMember,
        deleteUserMember,
        activeModule,
        setActiveModule,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        stockMovements,
        lowStockProducts,
        sales,
        createSale,
        cancelSale,
        updateSaleNotes,
        receiptSale,
        setReceiptSale,
        quotes,
        createQuote,
        updateQuoteStatus,
        updateQuoteNotes,
        convertQuoteToSale,
        deleteQuote,
        receiptQuote,
        setReceiptQuote,
        productionOrders,
        createProductionOrder,
        updateProductionOrder,
        updateProductionStatus,
        deductProductionMaterials,
        deleteProductionOrder,
        receiptProductionOrder,
        setReceiptProductionOrder,
        activeProductionDraft,
        setActiveProductionDraft,
        startProductionFromQuote,
        startProductionFromSale,
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        company,
        updateCompany,
        isCloudSyncing,
        lastSyncTime,
        syncSavedData,
        syncWithGoogle,
        syncStatusMessage,
        setSyncStatusMessage,
        loadDemoSeedData,
        clearAllCloudData,
        notifications,
        markNotificationAsRead,
        clearNotifications,
        exportBackupJSON,
        importBackupJSON,
        isQuickActionOpen,
        setIsQuickActionOpen,
        isLoginModalOpen,
        setIsLoginModalOpen,
        isDarkMode,
        toggleDarkMode,
        appearance,
        updateAppearance,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
