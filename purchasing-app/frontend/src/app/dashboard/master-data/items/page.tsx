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
    Package
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
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Katalog Barang</h1>
                    <p className="text-slate-500 text-sm mt-1">Daftar master barang beserta referensi harga dan pajak.</p>
                </div>
                {canCreate && (
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5" /> Tambah Barang
                    </button>
                )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-50 flex items-center gap-4 bg-slate-50/30">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari nama, kode, atau vendor..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-900 outline-none transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-widest">
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
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <div className="flex justify-center flex-col items-center gap-2">
                                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                            <span className="text-slate-400 font-medium tracking-tight">Menyinkronkan katalog...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium italic">
                                        Tidak ada barang ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item, index) => (
                                    <tr key={item.code} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4 text-slate-400 font-bold text-xs text-center">{index + 1}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 font-bold border border-emerald-100 shadow-sm flex-shrink-0">
                                                    <Tag className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 uppercase tracking-tight leading-none mb-1">{item.name}</div>
                                                    <div className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded w-fit font-black border border-slate-200 uppercase tracking-widest">{item.code}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-100 rounded-lg w-fit text-amber-700 font-bold text-[10px] uppercase">
                                                {item.item_type?.name || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-tight">
                                                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                                                {item.partner?.name || `ID #${item.partner_id}`}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-600 text-sm">
                                            Rp {item.price?.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-[10px] font-black p-1 bg-amber-50 text-amber-700 border border-amber-100 rounded w-fit leading-none mb-0.5">{item.vat_percentage}%</span>
                                                <span className="text-[9px] text-slate-400 font-medium italic">Rp {item.vat_amount?.toLocaleString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="text-sm font-black text-blue-700 tracking-tighter">
                                                Rp {item.total_price?.toLocaleString()}
                                            </div>
                                        </td>
                                        {(canEdit || canDelete) && (
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {canEdit && (
                                                        <button
                                                            onClick={() => handleEdit(item)}
                                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                            title="Ubah"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button
                                                            onClick={() => handleDeleteClick(item.code)}
                                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                            title="Hapus"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
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
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-900 mb-2">
                                Jenis Persediaan <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 font-bold"
                                value={formData.item_type_id}
                                onChange={(e) => setFormData({ ...formData, item_type_id: e.target.value })}
                            >
                                <option value="">Pilih Jenis</option>
                                {itemTypes.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-900 mb-2">
                                Kode Barang (Otomatis)
                            </label>
                            <input
                                type="text"
                                required
                                disabled={!!editingCode}
                                className={`w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 font-bold uppercase ${editingCode ? 'bg-slate-50 text-slate-400' : ''}`}
                                placeholder="Pilih Jenis untuk Auto-Generate"
                                value={formData.code}
                                readOnly
                            />
                            <p className="text-[10px] text-slate-400 mt-1 italic tracking-tight">Dibuat otomatis dari prefix kategori + waktu.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-900 mb-2">
                                Vendor Pemasok <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 font-bold"
                                value={formData.partner_id}
                                onChange={(e) => setFormData({ ...formData, partner_id: e.target.value })}
                            >
                                <option value="">Pilih Rekanan</option>
                                {partners.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-900 mb-2">
                                Nama Barang <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 font-bold"
                                placeholder="e.g. Laptop Lenovo ThinkPad"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-900 mb-2">
                                Harga Dasar (Sblm PPN) <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rp</span>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 font-bold"
                                    value={formData.price || ''}
                                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-900 mb-2">
                                Persentase PPN (%) <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 font-bold"
                                    value={formData.vat_percentage}
                                    onChange={(e) => setFormData({ ...formData, vat_percentage: parseFloat(e.target.value) || 0 })}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">%</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-6 shadow-inner">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white rounded-xl border border-slate-200">
                                <Calculator className="w-6 h-6 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Setelah Pajak</p>
                                <p className="text-xl font-black text-blue-700 tracking-tighter leading-none">
                                    Rp {formData.total_price.toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Detail PPN</p>
                            <p className="text-sm font-bold text-slate-600">Rp {formData.vat_amount.toLocaleString()}</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-900 mb-2">
                            Deskripsi Singkat
                        </label>
                        <textarea
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 font-bold"
                            placeholder="Opsional: Keterangan barang..."
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all uppercase text-xs tracking-widest"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-[2] px-4 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
                        >
                            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            {editingCode ? 'Simpan Perubahan' : 'Tambah Barang'}
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
