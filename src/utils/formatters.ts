/**
 * Format numbers as Brazilian Real currency (e.g. R$ 1.250,50)
 */
export function formatCurrency(value: number): string {
  if (isNaN(value) || value === null || value === undefined) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format standard number with Brazilian decimal separator
 */
export function formatNumber(value: number, decimals: number = 2): string {
  if (isNaN(value) || value === null || value === undefined) {
    return '0';
  }
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format date to Brazilian standard (DD/MM/YYYY or DD/MM/YYYY HH:mm)
 */
export function formatDate(dateString?: string, includeTime: boolean = false): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    if (!includeTime) {
      return `${day}/${month}/${year}`;
    }

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return dateString;
  }
}

/**
 * Format CPF (000.000.000-00) or CNPJ (00.000.000/0000-00)
 */
export function formatDocument(val: string): string {
  if (!val) return '';
  const digits = val.replace(/\D/g, '');
  if (digits.length <= 11) {
    // CPF
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .slice(0, 14);
  } else {
    // CNPJ
    return digits
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  }
}

/**
 * Format Brazilian phone number: (00) 00000-0000 or (00) 0000-0000
 */
export function formatPhone(val: string): string {
  if (!val) return '';
  const digits = val.replace(/\D/g, '');
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 14);
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 15);
}

/**
 * Calculate margin percentage: ((Sale - Cost) / Sale) * 100
 */
export function calculateMarginPercent(costPrice: number, salePrice: number): number {
  if (!salePrice || salePrice <= 0) return 0;
  const margin = ((salePrice - costPrice) / salePrice) * 100;
  return Number(margin.toFixed(1));
}

/**
 * Calculate Markup percentage: ((Sale - Cost) / Cost) * 100
 */
export function calculateMarkupPercent(costPrice: number, salePrice: number): number {
  if (!costPrice || costPrice <= 0) return 0;
  const markup = ((salePrice - costPrice) / costPrice) * 100;
  return Number(markup.toFixed(1));
}

/**
 * Generate sequential sale code with current date
 */
export function generateSaleCode(index: number): string {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(index).padStart(4, '0');
  return `VND-${dateStr}-${seq}`;
}

/**
 * Generate sequential quote code
 */
export function generateQuoteCode(index: number): string {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(index).padStart(3, '0');
  return `ORC-${dateStr}-${seq}`;
}

/**
 * Generate sequential personalized production order code (Ex: PED-20260827-001)
 */
export function generateProductionOrderCode(index: number, prefix: string = 'PED'): string {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(index).padStart(3, '0');
  return `${prefix}-${dateStr}-${seq}`;
}

export const generateServiceOrderCode = generateProductionOrderCode;

/**
 * Trigger file download in browser
 */
export function downloadFile(content: string, fileName: string, contentType: string = 'application/json'): void {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Recursively strips all `undefined` values from an object/array so Firestore setDoc/updateDoc never fails.
 */
export function cleanFirestoreData<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) {
    return data.map((item) => cleanFirestoreData(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleanObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleanObj[key] = cleanFirestoreData(value);
      }
    }
    return cleanObj as T;
  }
  return data;
}

