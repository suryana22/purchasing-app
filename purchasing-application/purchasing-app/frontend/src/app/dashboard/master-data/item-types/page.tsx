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
    FileText,
    Key
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

interface ItemType {
    id: number;
    name: string;
    prefix: string;
    description: string;
}

export default function ItemTypesPage() {
    const { authenticatedFetch, hasPermission } = useAuth();
    const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({ name: '', prefix: '', description: '' });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const canCreate = hasPermission('item_types.create');
    const canEdit = hasPermission('item_types.edit');
    const canDelete = hasPermission('item_types.delete');

    const fetchItemTypes = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await authenticatedFetch('http://localhost:4001/api/item-types');
            if (res.ok) {
                const data = await res.json();
                setItemTypes(data);
            }
        } catch (error) {
            console.error('Failed to fetch item types:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItemTypes();
    }, []);

    const handleCreate = () => {
        setEditingId(null);
        setFormData({ name: '', prefix: '', description: '' });
        setIsModalOpen(true);
    };

    const handleEdit = (type: any) => {
        setEditingId(type.id);
        setFormData({
            name: type.name,
            prefix: type.prefix,
            description: type.description || ''
        });
        setIsModalOpen(true);
    };

    const handleDeleteClick = (id: number) => {
        setDeletingId(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!deletingId) return;
        setSubmitting(true);
        try {
            const res = await authenticatedFetch(`http://localhost:4001/api/item-types/${deletingId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setIsDeleteModalOpen(false);
                fetchItemTypes();
            } else {
                alert('Failed to delete item type');
            }
        } catch (error) {
            console.error(error);
            alert('Error connecting to server');
        } finally {
            setSubmitting(false);
            setDeletingId(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const url = editingId
            ? `http://localhost:4001/api/item-types/${editingId}`
            : 'http://localhost:4001/api/item-types';

        const method = editingId ? 'PUT' : 'POST';

        try {
            const res = await authenticatedFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchItemTypes();
            } else {
                alert(`Failed to ${editingId ? 'update' : 'create'} item type`);
            }
        } catch (error) {
            console.error(error);
            alert('Error connecting to server');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredItemTypes = itemTypes.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.prefix.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Jenis Persediaan</h1>
                    <p className="text-slate-500 text-sm mt-1">Kelola kategori persediaan barang dan prefix kode barang.</p>
                </div>
                {canCreate && (
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5" /> Tambah Jenis Persediaan
                    </button>
                )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-50 flex items-center gap-4 bg-slate-50/30">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari jenis persediaan atau prefix..."
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
                                <th className="px-6 py-4 w-16">No</th>
                                <th className="px-6 py-4">Nama Persediaan</th>
                                <th className="px-6 py-4">Prefix Kode</th>
                                <th className="px-6 py-4">Keterangan</th>
                                {(canEdit || canDelete) && <th className="px-6 py-4 text-right">Aksi</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex justify-center flex-col items-center gap-2">
                                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                            <span className="text-slate-400 font-medium tracking-tight">Menarik data...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredItemTypes.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                                        Tidak ada data ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filteredItemTypes.map((type, index) => (
                                    <tr key={type.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4 font-bold text-slate-400 text-xs">{index + 1}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold border border-blue-100 shadow-sm uppercase">
                                                    {type.name[0]}
                                                </div>
                                                <div className="font-bold text-slate-900 uppercase tracking-tight">{type.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-100 rounded-lg w-fit text-amber-700 font-black text-xs uppercase">
                                                <Key className="w-3 h-3" />
                                                {type.prefix}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs italic text-slate-500">{type.description || '-'}</p>
                                        </td>
                                        {(canEdit || canDelete) && (
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {canEdit && (
                                                        <button
                                                            onClick={() => handleEdit(type)}
                                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button
                                                            onClick={() => handleDeleteClick(type.id)}
                                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
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
                title={editingId ? "Ubah Jenis Persediaan" : "Tambah Jenis Persediaan"}
            >
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-900 mb-2">
                            Nama Persediaan <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 font-bold"
                            placeholder="e.g. Teknologi Informasi"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-900 mb-2">
                            Prefix Kode <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            maxLength={10}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 font-bold uppercase"
                            placeholder="e.g. TI"
                            value={formData.prefix}
                            onChange={(e) => setFormData({ ...formData, prefix: e.target.value.toUpperCase().trim() })}
                        />
                        <p className="text-[10px] text-slate-400 mt-1 italic">Prefix ini akan digunakan sebagai awalan kode barang (Contoh: TI-2026...)</p>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-900 mb-2">
                            Keterangan
                        </label>
                        <textarea
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 font-bold"
                            placeholder="Keterangan tambahan..."
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
                            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {editingId ? 'Simpan Perubahan' : 'Tambah Jenis'}
                        </button>
                    </div>
                </form>
            </Modal>

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
                            <h4 className="text-sm font-bold text-amber-900">Perhatian!</h4>
                            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">Menghapus jenis persediaan ini tidak akan menghapus barang yang sudah ada, namun relasi kategori mungkin terputus.</p>
                        </div>
                    </div>
                    <p className="text-slate-600 font-medium text-center">
                        Apakah Anda yakin ingin menghapus jenis persediaan ini?
                    </p>
                    <div className="flex gap-3 pt-4">
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
                            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Hapus Sekarang
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
