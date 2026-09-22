import React, { useRef, useState } from 'react';
import {
  Check,
  CheckCircle,
  Copy,
  FileDown,
  FileText,
  Printer,
  Receipt,
  ShoppingBag,
  Sparkles,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/formatters';

export const ReceiptModal: React.FC = () => {
  const { receiptSale, setReceiptSale, receiptQuote, setReceiptQuote, company } = useApp();
  const isSale = !!receiptSale;
  const [printFormat, setPrintFormat] = useState<'thermal' | 'a4'>(() => (isSale ? 'thermal' : 'a4'));
  const [copied, setCopied] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const activeDoc = receiptSale || receiptQuote;

  if (!activeDoc) return null;

  const handleClose = () => {
    setReceiptSale(null);
    setReceiptQuote(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Determine logo to use and display settings
  const receiptLogo = company.receiptLogoUrl || company.logoUrl;
  const quoteLogo = company.quoteLogoUrl || company.logoUrl;
  const activeLogo = isSale ? receiptLogo : quoteLogo;
  const shouldShowLogo = isSale
    ? company.showLogoOnReceipt !== false && !!receiptLogo
    : company.showLogoOnQuote !== false && !!quoteLogo;

  const logoPosition = company.logoPosition || 'center';
  const logoAlignmentClass =
    logoPosition === 'left'
      ? 'items-start text-left justify-start'
      : logoPosition === 'right'
      ? 'items-end text-right justify-end'
      : 'items-center text-center justify-center';

  const logoImgAlignmentClass =
    logoPosition === 'left' ? 'mr-auto' : logoPosition === 'right' ? 'ml-auto' : 'mx-auto';

  // Sizing classes
  const receiptLogoSize = company.receiptLogoSize || 'md';
  const quoteLogoSize = company.quoteLogoSize || 'md';

  const getLogoHeightClass = () => {
    if (isSale) {
      if (receiptLogoSize === 'sm') return 'h-9 max-w-[120px]';
      if (receiptLogoSize === 'lg') return 'h-16 max-w-[200px]';
      return 'h-12 max-w-[160px]';
    } else {
      if (quoteLogoSize === 'sm') return 'h-11 max-w-[140px]';
      if (quoteLogoSize === 'lg') return 'h-20 max-w-[240px]';
      return 'h-14 max-w-[190px]';
    }
  };

  const copyReceiptText = () => {
    if (!activeDoc) return;
    const items = activeDoc.items || [];
    const itemsText = items
      .map((it) => `${it.quantity}x ${it.name} - ${formatCurrency(it.unitPrice)} = ${formatCurrency(it.subtotal)}`)
      .join('\n');

    const text = `
=== ${company.tradeName} ===
${company.corporateName} - CNPJ: ${company.cnpj}
Tel: ${company.phone} | ${company.address}
----------------------------------------
DOCUMENTO: ${isSale ? 'COMPROVANTE DE VENDA' : 'ORÇAMENTO COMERCIAL'}
CÓDIGO: ${activeDoc.code}
DATA: ${formatDate(activeDoc.createdAt, true)}
CLIENTE: ${activeDoc.customerName}
----------------------------------------
ITENS:
${itemsText}
----------------------------------------
SUBTOTAL: ${formatCurrency(activeDoc.subtotal)}
DESCONTO: ${formatCurrency(activeDoc.discount)}
TOTAL FINAL: ${formatCurrency(activeDoc.total)}
${isSale ? `FORMA DE PAGAMENTO: ${(activeDoc as any).paymentMethod}` : `VALIDADE: ${(activeDoc as any).validityDays} dias`}
----------------------------------------
${company.receiptFooterMessage}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto print:p-0 print:bg-white backdrop-blur-xs">
      {/* Wrapper */}
      <div
        className={`relative my-8 w-full rounded-2xl bg-white shadow-2xl border border-slate-200/80 print:border-none print:shadow-none print:my-0 ${
          printFormat === 'a4' ? 'max-w-3xl' : 'max-w-md'
        }`}
      >
        {/* Top Control Bar (Hidden on Print) */}
        <div className="flex items-center justify-between border-b border-slate-100 p-4 print:hidden bg-slate-50/70 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
              {isSale ? <Receipt className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xs">
                {isSale ? 'Comprovante / Cupom de Venda' : 'Proposta Comercial / Orçamento Formal'}
              </h3>
              <p className="text-[10px] text-slate-500 font-mono">{activeDoc.code}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-xs">
              <button
                type="button"
                onClick={() => setPrintFormat('thermal')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                  printFormat === 'thermal'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cupom Térmico (80mm)
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('a4')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                  printFormat === 'a4'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Documento A4
              </button>
            </div>
            <button
              onClick={handleClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Area: Thermal Format */}
        {printFormat === 'thermal' ? (
          <div
            ref={receiptRef}
            className="p-6 text-slate-800 font-mono text-xs leading-tight select-text max-w-[360px] mx-auto print:max-w-none print:w-full"
          >
            {/* Header with Logo */}
            <div className={`border-b border-dashed border-slate-300 pb-4 ${logoAlignmentClass}`}>
              {shouldShowLogo && activeLogo && (
                <div className="mb-2.5 flex justify-center">
                  <img
                    src={activeLogo}
                    alt={company.tradeName || 'Logotipo'}
                    className={`object-contain ${getLogoHeightClass()} ${logoImgAlignmentClass}`}
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              <h2 className="font-bold text-sm tracking-wider text-slate-900 uppercase">
                {company.tradeName || 'EMPRESA'}
              </h2>
              {company.corporateName && (
                <p className="text-[11px] text-slate-600 mt-0.5">{company.corporateName}</p>
              )}
              {company.cnpj && <p className="text-[11px] text-slate-600">CNPJ: {company.cnpj}</p>}
              {company.address && <p className="text-[11px] text-slate-600">{company.address}</p>}
              {(company.city || company.phone) && (
                <p className="text-[11px] text-slate-600">
                  {company.city} {company.state ? `- ${company.state}` : ''} {company.phone ? `| Tel: ${company.phone}` : ''}
                </p>
              )}
            </div>

            {/* Doc details */}
            <div className="py-3 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between font-bold">
                <span>{isSale ? 'CUPOM NÃO FISCAL' : 'ORÇAMENTO COMERCIAL'}</span>
                <span>{activeDoc.code}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Emissão:</span>
                <span>{formatDate(activeDoc.createdAt, true)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Cliente:</span>
                <span className="font-semibold text-slate-800">{activeDoc.customerName}</span>
              </div>
              {isSale && (receiptSale as any).sellerName && (
                <div className="flex justify-between text-slate-600">
                  <span>Atendente:</span>
                  <span>{(receiptSale as any).sellerName}</span>
                </div>
              )}
              {!isSale && (receiptQuote as any).validityDays && (
                <div className="flex justify-between text-slate-600">
                  <span>Validade da Proposta:</span>
                  <span>{(receiptQuote as any).validityDays} dias</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="py-3 border-b border-dashed border-slate-300">
              <div className="flex justify-between font-bold text-[11px] mb-2 pb-1 border-b border-slate-200">
                <span className="w-1/2">Item / Descrição</span>
                <span className="w-1/4 text-center">Qtd x Unit</span>
                <span className="w-1/4 text-right">Total</span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                {(activeDoc.items || []).map((it, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div className="w-1/2 pr-1">
                      <p className="font-medium text-slate-900 leading-tight">{it.name}</p>
                      {it.sku && <p className="text-[9px] text-slate-400">{it.sku}</p>}
                    </div>
                    <div className="w-1/4 text-center text-slate-600">
                      {it.quantity} {it.unit} x {formatCurrency(it.unitPrice)}
                    </div>
                    <div className="w-1/4 text-right font-semibold text-slate-900">
                      {formatCurrency(it.subtotal)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals & Payment */}
            <div className="py-3 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>{formatCurrency(activeDoc.subtotal)}</span>
              </div>
              {activeDoc.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Desconto Aplicado:</span>
                  <span>- {formatCurrency(activeDoc.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-sm text-slate-900 pt-1 border-t border-slate-200">
                <span>TOTAL FINAL:</span>
                <span>{formatCurrency(activeDoc.total)}</span>
              </div>

              {isSale && (
                <div className="pt-2 mt-2 border-t border-slate-100 space-y-0.5 text-slate-600">
                  <div className="flex justify-between">
                    <span>Forma de Pagamento:</span>
                    <span className="font-bold text-slate-800">{(receiptSale as any).paymentMethod}</span>
                  </div>
                  {(receiptSale as any).installments && (receiptSale as any).installments > 1 && (
                    <div className="flex justify-between">
                      <span>Parcelamento:</span>
                      <span>
                        {(receiptSale as any).installments}x de{' '}
                        {formatCurrency(activeDoc.total / (receiptSale as any).installments)}
                      </span>
                    </div>
                  )}
                  {(receiptSale as any).amountPaid && (receiptSale as any).amountPaid > activeDoc.total && (
                    <>
                      <div className="flex justify-between">
                        <span>Valor Recebido:</span>
                        <span>{formatCurrency((receiptSale as any).amountPaid)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-emerald-700">
                        <span>Troco:</span>
                        <span>{formatCurrency((receiptSale as any).change || 0)}</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Footer Note */}
            <div className="pt-4 text-center text-[10px] text-slate-500 space-y-1">
              <p className="italic">{company.receiptFooterMessage}</p>
              <p className="text-[9px] text-slate-400">Sistema: Gestão Financeira & Comercial PRO</p>
              <div className="mt-3 flex justify-center">
                <div className="h-7 w-40 bg-[repeating-linear-gradient(90deg,#1e293b,#1e293b_2px,#fff_2px,#fff_4px)]"></div>
              </div>
              <p className="text-[8px] text-slate-400 mt-1 font-mono">{activeDoc.code}</p>
            </div>
          </div>
        ) : (
          /* Printable Area: A4 Formal Document */
          <div
            ref={receiptRef}
            className="p-8 text-slate-800 font-sans text-xs leading-normal select-text max-w-2xl mx-auto print:max-w-none print:w-full print:p-0"
          >
            {/* A4 Header Section with Logo and Company Info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-slate-900 pb-5 gap-4">
              <div className="flex items-center gap-4">
                {shouldShowLogo && activeLogo ? (
                  <img
                    src={activeLogo}
                    alt={company.tradeName || 'Logotipo da Empresa'}
                    className={`object-contain rounded-lg border border-slate-100 p-1 bg-white shadow-2xs ${getLogoHeightClass()}`}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg">
                    {(company.tradeName || 'GP').slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h1 className="font-extrabold text-base tracking-tight text-slate-900 uppercase">
                    {company.tradeName}
                  </h1>
                  {company.corporateName && (
                    <p className="text-xs text-slate-600 font-medium">{company.corporateName}</p>
                  )}
                  {company.cnpj && <p className="text-[11px] text-slate-500">CNPJ: {company.cnpj}</p>}
                </div>
              </div>

              <div className="text-left sm:text-right text-[11px] text-slate-500 space-y-0.5">
                {company.phone && <p className="font-medium text-slate-700">Tel: {company.phone}</p>}
                {company.email && <p>{company.email}</p>}
                {company.address && <p>{company.address}</p>}
                {company.city && (
                  <p>
                    {company.city} - {company.state} {company.zipCode ? `| CEP: ${company.zipCode}` : ''}
                  </p>
                )}
              </div>
            </div>

            {/* Document Title Banner */}
            <div className="my-5 flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Tipo de Documento
                </span>
                <span className="font-extrabold text-sm text-slate-900">
                  {isSale ? 'COMPROVANTE DE VENDA / RECIBO' : 'PROPOSTA COMERCIAL / ORÇAMENTO'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Identificador
                </span>
                <span className="font-mono font-bold text-sm text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-100">
                  {activeDoc.code}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Data de Emissão
                </span>
                <span className="font-medium text-xs text-slate-800">
                  {formatDate(activeDoc.createdAt, true)}
                </span>
              </div>
              {!isSale && (receiptQuote as any).validityDays && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Validade da Proposta
                  </span>
                  <span className="font-semibold text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {(receiptQuote as any).validityDays} dias
                  </span>
                </div>
              )}
            </div>

            {/* Customer Box */}
            <div className="mb-5 rounded-xl border border-slate-200 p-3.5 bg-white">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2 border-b border-slate-100 pb-1">
                Dados do Cliente
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px]">Nome / Razão Social: </span>
                  <span className="font-bold text-slate-900">{activeDoc.customerName}</span>
                </div>
                {(activeDoc as any).customerPhone && (
                  <div>
                    <span className="text-slate-400 text-[11px]">Telefone: </span>
                    <span className="font-medium text-slate-800">{(activeDoc as any).customerPhone}</span>
                  </div>
                )}
                {(activeDoc as any).customerDoc && (
                  <div>
                    <span className="text-slate-400 text-[11px]">CPF / CNPJ: </span>
                    <span className="font-medium text-slate-800">{(activeDoc as any).customerDoc}</span>
                  </div>
                )}
                {(activeDoc as any).customerEmail && (
                  <div>
                    <span className="text-slate-400 text-[11px]">E-mail: </span>
                    <span className="font-medium text-slate-800">{(activeDoc as any).customerEmail}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Table of Items */}
            <div className="mb-5 overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Item / Descrição</th>
                    <th className="py-2.5 px-3 text-center">Un.</th>
                    <th className="py-2.5 px-3 text-center">Qtd.</th>
                    <th className="py-2.5 px-3 text-right">Preço Unit.</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(activeDoc.items || []).map((it, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="py-2 px-3">
                        <p className="font-semibold text-slate-900">{it.name}</p>
                        {it.sku && <p className="text-[10px] text-slate-400 font-mono">{it.sku}</p>}
                      </td>
                      <td className="py-2 px-3 text-center text-slate-600">{it.unit}</td>
                      <td className="py-2 px-3 text-center font-bold text-slate-800">{it.quantity}</td>
                      <td className="py-2 px-3 text-right text-slate-700 font-mono">
                        {formatCurrency(it.unitPrice)}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900 font-mono">
                        {formatCurrency(it.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals & Notes Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50 text-xs">
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-600 mb-1.5">
                  Observações & Condições
                </h4>
                <p className="text-slate-600 leading-relaxed italic">
                  {(activeDoc as any).notes || company.receiptFooterMessage}
                </p>
                {isSale && (receiptSale as any).paymentMethod && (
                  <p className="mt-2 text-slate-700">
                    <span className="font-semibold">Pagamento:</span> {(receiptSale as any).paymentMethod}
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 p-3 bg-white space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Bruto:</span>
                  <span className="font-mono">{formatCurrency(activeDoc.subtotal)}</span>
                </div>
                {activeDoc.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Desconto Concedido:</span>
                    <span className="font-mono">- {formatCurrency(activeDoc.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-base text-slate-900 pt-2 border-t border-slate-200">
                  <span>TOTAL GERAL:</span>
                  <span className="font-mono text-indigo-700">{formatCurrency(activeDoc.total)}</span>
                </div>
              </div>
            </div>

            {/* Formal Signature Lines for Proposals */}
            {!isSale && (
              <div className="mt-12 grid grid-cols-2 gap-8 pt-4">
                <div className="text-center">
                  <div className="border-t border-slate-400 pt-1.5 mx-4">
                    <p className="font-semibold text-xs text-slate-900">{company.tradeName}</p>
                    <p className="text-[10px] text-slate-500">Responsável Comercial</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="border-t border-slate-400 pt-1.5 mx-4">
                    <p className="font-semibold text-xs text-slate-900">{activeDoc.customerName}</p>
                    <p className="text-[10px] text-slate-500">De Acordo / Aceite da Proposta</p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 text-center text-[10px] text-slate-400 border-t border-slate-100 pt-3">
              <p>{company.tradeName} • Documento emitido via Gestão Financeira & Comercial PRO</p>
            </div>
          </div>
        )}

        {/* Action Buttons (Hidden on Print) */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 p-4 rounded-b-2xl print:hidden">
          <button
            onClick={copyReceiptText}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
            <span>{copied ? 'Copiado!' : 'Copiar Dados'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 shadow-xs"
            >
              Fechar
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 active:scale-98 transition-all"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Imprimir / Salvar PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
