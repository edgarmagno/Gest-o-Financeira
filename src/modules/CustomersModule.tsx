import React, { useState } from 'react';
import {
  Calendar,
  Download,
  Edit2,
  Eye,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Receipt,
  Search,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Customer, Sale } from '../types';
import {
  downloadFile,
  formatCurrency,
  formatDate,
  formatDocument,
  formatPhone,
} from '../utils/formatters';

export const CustomersModule: React.FC = () => {
  const { customers, addCustomer, updateCustomer, deleteCustomer, sales, setActiveModule, currentUser } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedHistoryCustomer, setSelectedHistoryCustomer] = useState<Customer | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    document: '',
    phone: '',
    email: '',
    address: '',
    city: 'São Paulo',
    state: 'SP',
    notes: '',
  });

  const filteredCustomers = customers.filter((c) => {
    const q = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.document.includes(q) ||
      c.phone.includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  });

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      document: '',
      phone: '',
      email: '',
      address: '',
      city: 'São Paulo',
      state: 'SP',
      notes: '',
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      document: c.document,
      phone: c.phone,
      email: c.email,
      address: c.address,
      city: c.city,
      state: c.state,
      notes: c.notes || '',
    });
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        name: formData.name.trim(),
        document: formData.document,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        notes: formData.notes,
      });
    } else {
      addCustomer({
        name: formData.name.trim(),
        document: formData.document,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        notes: formData.notes,
      });
    }
    setIsFormOpen(false);
  };

  const handleOpenWhatsApp = (phone: string, name: string) => {
    const cleanNumber = phone.replace(/\D/g, '');
    if (!cleanNumber) {
      alert('Telefone do cliente não cadastrado.');
      return;
    }
    const fullNumber = cleanNumber.length <= 11 ? `55${cleanNumber}` : cleanNumber;
    const message = encodeURIComponent(`Olá ${name}, tudo bem? Entramos em contato da Gestão Comercial.`);
    window.open(`https://wa.me/${fullNumber}?text=${message}`, '_blank');
  };

  const getCustomerSales = (custId: string): Sale[] => {
    return sales.filter((s) => s.customerId === custId);
  };

  const handleExportCSV = () => {
    const headers = 'ID,Nome,CPF_CNPJ,Telefone,Email,Cidade,UF,TotalGasto,QtdPedidos,DataCadastro\n';
    const rows = customers
      .map(
        (c) =>
          `"${c.id}","${c.name}","${c.document}","${c.phone}","${c.email}","${c.city}","${c.state}",${c.totalSpent},${c.ordersCount},"${c.createdAt}"`
      )
      .join('\n');

    downloadFile(headers + rows, `clientes_crm_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Gestão de Clientes & CRM
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastre contatos, acompanhe o histórico de compras e inicie conversas no WhatsApp com 1 clique.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          <button
            id="btn-new-customer"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 active:scale-98 transition-all"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Novo Cliente</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome do cliente, CPF, CNPJ, WhatsApp ou e-mail..."
            className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full rounded-xl border border-slate-200/80 bg-white p-10 text-center text-slate-400 text-xs">
            <Users className="mx-auto h-7 w-7 mb-2 opacity-40" />
            Nenhum cliente encontrado. Clique em "Novo Cliente" para adicionar.
          </div>
        ) : (
          filteredCustomers.map((cust) => (
            <div
              key={cust.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 font-bold text-slate-700 text-xs">
                      {cust.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-xs text-slate-900 leading-tight truncate max-w-[170px]">
                        {cust.name}
                      </h3>
                      {cust.document && (
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {formatDocument(cust.document)}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                    {cust.ordersCount} compra(s)
                  </span>
                </div>

                {/* Contact info list */}
                <div className="mt-3.5 space-y-1.5 text-xs text-slate-600">
                  {cust.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-slate-400" />
                      <span className="text-[11px]">{formatPhone(cust.phone)}</span>
                    </div>
                  )}

                  {cust.email && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="h-3 w-3 text-slate-400" />
                      <span className="truncate text-[11px]">{cust.email}</span>
                    </div>
                  )}

                  {cust.address && (
                    <div className="flex items-center gap-2 truncate text-[11px]">
                      <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                      <span className="truncate text-slate-500">
                        {cust.address}, {cust.city}-{cust.state}
                      </span>
                    </div>
                  )}
                </div>

                {/* Total spent box */}
                <div className="mt-3.5 rounded-lg bg-slate-50 p-2 border border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px] font-medium">Total Acumulado:</span>
                  <span className="font-bold font-mono text-emerald-700 text-xs">
                    {formatCurrency(cust.totalSpent)}
                  </span>
                </div>
              </div>

              {/* Actions row */}
              <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-3">
                <button
                  onClick={() => handleOpenWhatsApp(cust.phone, cust.name)}
                  className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 active:scale-98 transition-all"
                  title="Abrir WhatsApp Direto"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>WhatsApp</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSelectedHistoryCustomer(cust)}
                    className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    title="Ver Histórico de Pedidos"
                  >
                    <Receipt className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => handleOpenEdit(cust)}
                    className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    title="Editar Cliente"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>

                  {currentUser.role !== 'VENDEDOR' && (
                    <button
                      onClick={() => {
                        if (confirm(`Deseja excluir o cadastro de "${cust.name}"?`)) {
                          deleteCustomer(cust.id);
                        }
                      }}
                      className="rounded-md border border-slate-200 p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      title="Excluir Cliente"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Create/Edit Customer */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative my-8 w-full max-w-lg rounded-xl bg-white p-5 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingCustomer ? 'Editar Cadastro de Cliente' : 'Novo Cliente'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Completo / Razão Social *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Beatriz Lima"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">CPF ou CNPJ</label>
                  <input
                    type="text"
                    value={formData.document}
                    onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                    placeholder="000.000.000-00"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    WhatsApp / Telefone *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="cliente@email.com"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Endereço Completo</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Rua, Número, Bairro"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Estado (UF)</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Observações Internas</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Preferências, dias de atendimento..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
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
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Purchase History Modal */}
      {selectedHistoryCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-xl bg-white p-5 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Histórico de Compras: {selectedHistoryCustomer.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Total Gasto:{' '}
                  <span className="font-bold font-mono text-emerald-700">
                    {formatCurrency(selectedHistoryCustomer.totalSpent)}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setSelectedHistoryCustomer(null)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 max-h-72 overflow-y-auto divide-y divide-slate-100 pr-1 text-xs">
              {getCustomerSales(selectedHistoryCustomer.id).length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  Nenhuma venda vinculada diretamente a este cliente ainda.
                </div>
              ) : (
                getCustomerSales(selectedHistoryCustomer.id).map((sale) => (
                  <div key={sale.id} className="py-2.5 space-y-1">
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-900 font-mono">{sale.code}</span>
                      <span className="font-mono text-emerald-700">{formatCurrency(sale.total)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>{formatDate(sale.createdAt, true)}</span>
                      <span>{sale.paymentMethod}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-md mt-1 border border-slate-100">
                      {sale.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>
                            {it.quantity}x {it.name}
                          </span>
                          <span className="font-mono">{formatCurrency(it.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 flex justify-end border-t border-slate-100 pt-3">
              <button
                onClick={() => setSelectedHistoryCustomer(null)}
                className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
