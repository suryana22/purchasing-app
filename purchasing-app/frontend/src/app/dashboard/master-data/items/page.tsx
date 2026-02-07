'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import {
    Plus,
    Loader2,
    Pencil,
    Trash2,
    AlertCircle,
    Search,
    Tag,
    Building2,
    FileText,
    Calculator,
    Package,
    Save
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

interface Partner {
    id: number;
    name: string;
}

interface ItemType {
    id: number;
    name: string;
    prefix: string;
}

interface Item {
    code: string;
    name: string;
    description: string;
    partner_id: number;
    item_type_id?: number;
    partner?: Partner;
    item_type?: ItemType;
    price: number;
    vat_percentage: number;
    vat_amount: number;
    total_price: number;
}

export default function ItemsPage() {
    const { authenticatedFetch, hasPermission } = useAuth();
    const [items, setItems] = useState<Item[]>([]);
    const [partners, setPartners] = useState<Partner[]>([]);
    const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const canCreate = hasPermission('items.create');
    const canEdit = hasPermission('items.edit');
    const canDelete = hasPermission('items.delete');

    const initialFormState = {
        code: '',
        name: '',
        partner_id: '',
        item_type_id: '' as string | number,
        price: 0,
        vat_percentage: 11,
        vat_amount: 0,
        total_price: 0,
        description: ''
    };
    const [formData, setFormData] = useState(initialFormState);

    const [editingCode, setEditingCode] = useState<string | null>(null);
    const [deletingCode, setDeletingCode] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchItems = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_MASTER_DATA_API || 'http://localhost:4001'}/api/items`);
            if (res.ok) {
                const data = await res.json();
                setItems(data);
            }
        } catch (error) {
            console.error('Failed to fetch items:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPartners = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_MASTER_DATA_API || 'http://localhost:4001'}/api/partners`);
            if (res.ok) {
                const data = await res.json();
                setPartners(data);
            }
        } catch (error) {
            console.error('Failed to fetch partners:', error);
        }
    };

    const fetchItemTypes = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_MASTER_DATA_API || 'http://localhost:4001'}/api/item-types`);
            if (res.ok) setItemTypes(await res.json());
        } catch (error) {
            console.error('Failed to fetch item types:', error);
        }
    };

    useEffect(() => {
        fetchItems();
        fetchPartners();
        fetchItemTypes();
    }, []);

    useEffect(() => {
        const price = Number(formData.price) || 0;
        const vat = Number(formData.vat_percentage) || 0;
        const vatAmount = price * (vat / 100);
        const total = price + vatAmount;

        setFormData(prev => {
            if (prev.vat_amount === vatAmount && prev.total_price === total) return prev;
            return { ...prev, vat_amount: vatAmount, total_price: total };
        });
    }, [formData.price, formData.vat_percentage]);

    useEffect(() => {
        if (!formData.item_type_id || editingCode) return;

        const type = itemTypes.find(t => t.id.toString() === formData.item_type_id.toString());
        if (type && type.prefix) {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');

            const generatedCode = `${type.prefix}-${year}${month}${day}${hours}${minutes}${seconds}`;
            setFormData(prev => ({ ...prev, code: generatedCode }));
        }
    }, [formData.item_type_id, editingCode]);

    const handleCreate = () => {
        setEditingCode(null);
        setFormData(initialFormState);
        setIsModalOpen(true);
    };

    const handleEdit = (item: Item) => {
        setEditingCode(item.code);
        setFormData({
            code: item.code,
            name: item.name,
            partner_id: item.partner_id?.toString() || '',
            item_type_id: item.item_type_id?.toString() || '',
            price: item.price,
            vat_percentage: item.vat_percentage,
            vat_amount: item.vat_amount,
            total_price: item.total_price,
            description: item.description || ''
        });
        setIsModalOpen(true);
    };

    const handleDeleteClick = (code: string) => {
        setDeletingCode(code);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!deletingCode) return;
        setSubmitting(true);
        try {
            const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_MASTER_DATA_API || 'http://localhost:4001'}/api/items/${deletingCode}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setIsDeleteModalOpen(false);
                fetchItems();
            } else {
                alert('Failed to delete item');
            }
        } catch (error) {
            console.error(error);
            alert('Error connecting to server');
        } finally {
            setSubmitting(false);
            setDeletingCode(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const url = editingCode
            ? `${process.env.NEXT_PUBLIC_MASTER_DATA_API || 'http://localhost:4001'}/api/items/${editingCode}`
            : `${process.env.NEXT_PUBLIC_MASTER_DATA_API || 'http://localhost:4001'}/api/items`;

        const method = editingCode ? 'PUT' : 'POST';

        try {
            const res = await authenticatedFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setFormData(initialFormState);
                setIsModalOpen(false);
                setEditingCode(null);
                fetchItems();
            } else {
                const errData = await res.json();
                alert(errData.error || `Failed to ${editingCode ? 'update' : 'create'} item`);
            }
        } catch (error) {
            console.error(error);
            alert('Error connecting to server');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredItems = items.filter(i =>
        i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.partner?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3">
                        <Package className="w-8 h-8 text-blue-600" />
                        Katalog Barang
                    </h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Daftar master barang beserta referensi harga dan pajak.</p>
                </div>
                {canCreate && (
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg hover:bg-slate-900 transition-all active:scale-95 w-fit"
                    >
                        <Plus className="w-4 h-4" /> Tambah Barang
                    </button>
                )}
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari nama, kode, atau vendor..."
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold text-slate-900 shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Mobile View */}
                <div className="md:hidden divide-y divide-slate-100 italic">
                    {loading ? (
                        <div className="p-12 text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Memuat katalog...</span>
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">
                            Tidak ada data
                        </div>
                    ) : (
                        filteredItems.map((item) => (
                            <div key={item.code} className="p-4 bg-white space-y-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 font-black border border-emerald-100 text-xs">
                                            <Tag className="w-3.5 h-3.5" />
                                        </div>
                                        <div>
                                            <div className="font-black text-slate-900 text-xs uppercase tracking-tight">{item.name}</div>
                                            <div className="text-[9px] text-slate-400 font-mono font-black uppercase">{item.code}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        {canEdit && (
                                            <button onClick={() => handleEdit(item)} className="p-2 text-slate-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                                        )}
                                        {canDelete && (
                                            <button onClick={() => handleDeleteClick(item.code)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-slate-50/50 p-2 rounded-lg border border-slate-100 italic">
                                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Vendor</p>
                                        <p className="text-[9px] text-slate-700 font-bold truncate uppercase">{item.partner?.name || '-'}</p>
                                    </div>
                                    <div className="bg-blue-50/30 p-2 rounded-lg border border-blue-100/50 italic text-right">
                                        <p className="text-[7px] font-black text-blue-400 uppercase tracking-widest mb-0.5 font-mono">Total</p>
                                        <p className="text-[10px] text-blue-700 font-black font-mono">Rp {item.total_price?.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto italic">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-[9px] uppercase font-black tracking-widest">
                            <tr>
                                <th className="px-6 py-4 w-12 text-center">No</th>
                                <th className="px-6 py-4">Kode & Nama</th>
                                <th className="px-6 py-4">Jenis</th>
                                <th className="px-6 py-4">Penyedia (Partner)</th>
                                <th className="px-6 py-4 text-right">Harga Dasar</th>
                                <th className="px-6 py-4 text-center">PPN</th>
                                <th className="px-6 py-4 text-right">Total (Inc. Pajak)</th>
                                {(canEdit || canDelete) && <th className="px-6 py-4 text-right w-24">Aksi</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center">
                                        <div className="flex justify-center flex-col items-center gap-2">
                                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Menyinkronkan katalog...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-black uppercase text-[10px] tracking-widest">
                                        Tidak ada barang ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item, index) => (
                                    <tr key={item.code} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-3 text-slate-400 font-bold text-[10px] text-center">{index + 1}</td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 font-black border border-emerald-100 shadow-sm flex-shrink-0">
                                                    <Tag className="w-3.5 h-3.5" />
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-900 text-xs uppercase tracking-tight leading-none mb-1">{item.name}</div>
                                                    <div className="text-[9px] font-mono text-slate-400 font-black border border-slate-100 px-1 rounded bg-slate-50 w-fit uppercase">{item.code}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 border border-amber-100 rounded-lg w-fit text-amber-700 font-black text-[9px] uppercase tracking-tighter">
                                                {item.item_type?.name || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-700 uppercase tracking-tight">
                                                <Building2 className="w-3 h-3 text-blue-400" />
                                                {item.partner?.name || `ID #${item.partner_id}`}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-right font-black text-slate-600 text-[10px] font-mono">
                                            Rp {item.price?.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-[8px] font-black px-1 bg-amber-50 text-amber-700 border border-amber-100 rounded tracking-tighter">{item.vat_percentage}%</span>
                                                <span className="text-[8px] text-slate-400 font-bold italic font-mono">Rp {item.vat_amount?.toLocaleString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <div className="text-[11px] font-black text-blue-700 tracking-tighter font-mono">
                                                Rp {item.total_price?.toLocaleString()}
                                            </div>
                                        </td>
                                        {(canEdit || canDelete) && (
                                            <td className="px-6 py-3 text-right">
                                                <div className="flex justify-end gap-1">
                                                    {canEdit && (
                                                        <button
                                                            onClick={() => handleEdit(item)}
                                                            className="p-1.5 rounded-lg transition-all text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                                            title="Ubah"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button
                                                            onClick={() => handleDeleteClick(item.code)}
                                                            className="p-1.5 rounded-lg transition-all text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                            title="Hapus"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingCode ? "Ubah Detail Barang" : "Tambah Barang Baru"}
            >
                <form onSubmit={handleSubmit} className="p-4 space-y-4 italic">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                Jenis Persediaan <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-xs font-black text-slate-900 uppercase"
                                value={formData.item_type_id}
                                onChange={(e) => setFormData({ ...formData, item_type_id: e.target.value })}
                            >
                                <option value="">PILIH JENIS</option>
                                {itemTypes.map(t => (
                                    <option key={t.id} value={t.id}>{t.name.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                Kode Barang
                            </label>
                            <input
                                type="text"
                                required
                                disabled={!!editingCode}
                                className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-xs font-black text-slate-900 uppercase ${editingCode ? 'opacity-50' : ''}`}
                                placeholder="AUTO"
                                value={formData.code}
                                readOnly
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                Vendor Pemasok <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-xs font-black text-slate-900 uppercase"
                                value={formData.partner_id}
                                onChange={(e) => setFormData({ ...formData, partner_id: e.target.value })}
                            >
                                <option value="">PILIH REKANAN</option>
                                {partners.map(p => (
                                    <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                Nama Barang <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-xs font-black text-slate-900 uppercase"
                                placeholder="Contoh: LAPTOP LENOVO"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                Harga Dasar <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-[10px]">RP</span>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-xs font-black text-slate-900 font-mono"
                                    value={formData.price || ''}
                                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                PPN (%) <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-xs font-black text-slate-900 font-mono"
                                    value={formData.vat_percentage}
                                    onChange={(e) => setFormData({ ...formData, vat_percentage: parseFloat(e.target.value) || 0 })}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-[10px]">%</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-blue-600 rounded-2xl border border-blue-700 shadow-lg shadow-blue-100 flex items-center justify-between text-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500 rounded-xl">
                                <Calculator className="w-5 h-5 text-blue-100" />
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-blue-200 uppercase tracking-widest leading-none mb-1">Total (Inc. Pajak)</p>
                                <p className="text-lg font-black tracking-tighter leading-none font-mono">
                                    Rp {formData.total_price.toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[8px] font-black text-blue-200 uppercase tracking-widest leading-none mb-1">Pajak</p>
                            <p className="text-xs font-black font-mono">Rp {formData.vat_amount.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                            Deskripsi Singkat
                        </label>
                        <textarea
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-xs font-bold text-slate-700"
                            placeholder="Keterangan barang..."
                            rows={2}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 px-4 py-3 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase text-[10px] tracking-widest"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-[2] px-4 py-3 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest"
                        >
                            {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                            {editingCode ? 'Simpan' : 'Tambah'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Konfirmasi Hapus"
            >
                <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 flex-shrink-0">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-amber-900">Konfirmasi Penghapusan</h4>
                            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">Barang yang dihapus akan tetap terekam di sistem log audit namun tidak dapat digunakan kembali untuk pesanan barang baru.</p>
                        </div>
                    </div>
                    <p className="text-slate-600 font-medium text-center">
                        Apakah Anda yakin ingin menghapus barang ini dari katalog?
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all uppercase text-xs tracking-widest"
                        >
                            Batal
                        </button>
                        <button
                            onClick={confirmDelete}
                            disabled={submitting}
                            className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
                        >
                            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            Hapus Sekarang
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
