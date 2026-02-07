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
            const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_MASTER_DATA_API || 'http://localhost:4001'}/api/item-types`);
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
            const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_MASTER_DATA_API || 'http://localhost:4001'}/api/item-types/${deletingId}`, {
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
            ? `${process.env.NEXT_PUBLIC_MASTER_DATA_API || 'http://localhost:4001'}/api/item-types/${editingId}`
            : `${process.env.NEXT_PUBLIC_MASTER_DATA_API || 'http://localhost:4001'}/api/item-types`;

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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3">
                        <Tag className="w-8 h-8 text-blue-600" />
                        Jenis Persediaan
                    </h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Kelola kategori persediaan barang dan prefix kode barang.</p>
                </div>
                {canCreate && (
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg hover:bg-slate-900 transition-all active:scale-95 w-fit"
                    >
                        <Plus className="w-4 h-4" /> Tambah Jenis
                    </button>
                )}
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari jenis persediaan atau prefix..."
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
                            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Memuat data...</span>
                        </div>
                    ) : filteredItemTypes.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">
                            Tidak ada data
                        </div>
                    ) : (
                        filteredItemTypes.map((type) => (
                            <div key={type.id} className="p-4 bg-white space-y-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-black border border-blue-100 text-xs uppercase">
                                            {type.name[0]}
                                        </div>
                                        <div>
                                            <div className="font-black text-slate-900 text-xs uppercase tracking-tight">{type.name}</div>
                                            <div className="text-[9px] text-slate-400 font-black flex items-center gap-1 mt-0.5 uppercase">
                                                <Key className="w-2.5 h-2.5" />
                                                Prefix: {type.prefix}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        {canEdit && (
                                            <button onClick={() => handleEdit(type)} className="p-2 text-slate-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                                        )}
                                        {canDelete && (
                                            <button onClick={() => handleDeleteClick(type.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                        )}
                                    </div>
                                </div>
                                {type.description && (
                                    <div className="bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                                        <p className="text-[9px] text-slate-500 leading-relaxed italic line-clamp-2">{type.description}</p>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto italic">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-[9px] uppercase font-black tracking-widest">
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
                                            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Menarik data...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredItemTypes.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-black uppercase text-[10px] tracking-widest">
                                        Tidak ada data ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filteredItemTypes.map((type, index) => (
                                    <tr key={type.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-3 font-bold text-slate-400 text-[10px]">{index + 1}</td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-black border border-blue-100 shadow-sm uppercase text-xs">
                                                    {type.name[0]}
                                                </div>
                                                <div className="font-black text-slate-900 text-xs uppercase tracking-tight">{type.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 border border-amber-100 rounded-lg w-fit text-amber-700 font-black text-[9px] uppercase tracking-tighter">
                                                <Key className="w-3 h-3" />
                                                {type.prefix}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-1.5 text-slate-500">
                                                <FileText className="w-3 h-3 text-slate-300" />
                                                <p className="text-[10px] italic font-medium max-w-xs truncate">{type.description || '-'}</p>
                                            </div>
                                        </td>
                                        {(canEdit || canDelete) && (
                                            <td className="px-6 py-3 text-right">
                                                <div className="flex justify-end gap-1">
                                                    {canEdit && (
                                                        <button
                                                            onClick={() => handleEdit(type)}
                                                            className="p-1.5 rounded-lg transition-all text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                                            title="Edit"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button
                                                            onClick={() => handleDeleteClick(type.id)}
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
                title={editingId ? "Ubah Jenis Persediaan" : "Tambah Jenis Persediaan"}
            >
                <form onSubmit={handleSubmit} className="p-4 space-y-4 italic">
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                            Nama Persediaan <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-xs font-black text-slate-900 uppercase"
                            placeholder="Contoh: TEKNOLOGI INFORMASI"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                            Prefix Kode <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            maxLength={10}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-xs font-black text-slate-900 uppercase"
                            placeholder="Contoh: TI"
                            value={formData.prefix}
                            onChange={(e) => setFormData({ ...formData, prefix: e.target.value.toUpperCase().trim() })}
                        />
                        <p className="text-[9px] text-slate-400 mt-1 italic pl-1">Digunakan sebagai awalan kode barang (Contoh: TI-2026...)</p>
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                            Keterangan
                        </label>
                        <textarea
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-xs font-bold text-slate-700"
                            placeholder="Keterangan tambahan..."
                            rows={3}
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
                            {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
                            {editingId ? 'Simpan' : 'Tambah'}
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
