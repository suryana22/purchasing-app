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
    MapPin,
    User,
    Phone,
    Mail,
    Building2
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

interface Partner {
    id: number;
    name: string;
    address: string;
    contact_person: string;
    email: string;
    phone: string;
}

export default function PartnersPage() {
    const { authenticatedFetch, hasPermission } = useAuth();
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        contact_person: '',
        email: '',
        phone: ''
    });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const canCreate = hasPermission('partners.create');
    const canEdit = hasPermission('partners.edit');
    const canDelete = hasPermission('partners.delete');

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
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPartners();
    }, []);

    const handleCreate = () => {
        setEditingId(null);
        setFormData({ name: '', address: '', contact_person: '', email: '', phone: '' });
        setIsModalOpen(true);
    };

    const handleEdit = (partner: Partner) => {
        setEditingId(partner.id);
        setFormData({
            name: partner.name,
            address: partner.address || '',
            contact_person: partner.contact_person || '',
            email: partner.email || '',
            phone: partner.phone || ''
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
            const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_MASTER_DATA_API || 'http://localhost:4001'}/api/partners/${deletingId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setIsDeleteModalOpen(false);
                fetchPartners();
            } else {
                alert('Failed to delete partner');
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
            ? `${process.env.NEXT_PUBLIC_MASTER_DATA_API || 'http://localhost:4001'}/api/partners/${editingId}`
            : `${process.env.NEXT_PUBLIC_MASTER_DATA_API || 'http://localhost:4001'}/api/partners`;

        const method = editingId ? 'PUT' : 'POST';

        const payload = {
            ...formData,
            email: formData.email || null,
            phone: formData.phone || null,
            address: formData.address || null,
            contact_person: formData.contact_person || null,
        };

        try {
            const res = await authenticatedFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setFormData({ name: '', address: '', contact_person: '', email: '', phone: '' });
                setIsModalOpen(false);
                setEditingId(null);
                fetchPartners();
            } else {
                const errData = await res.json();
                alert(errData.error || `Failed to ${editingId ? 'update' : 'create'} partner`);
            }
        } catch (error) {
            console.error(error);
            alert('Error connecting to server');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredPartners = partners.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.contact_person?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.address?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-blue-600" />
                        Rekanan (Partners)
                    </h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Kelola daftar vendor dan mitra pengadaan barang.</p>
                </div>
                {canCreate && (
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg hover:bg-slate-900 transition-all active:scale-95 w-fit"
                    >
                        <Plus className="w-4 h-4" /> Tambah Rekanan
                    </button>
                )}
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari rekanan, kontak, atau alamat..."
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
                    ) : filteredPartners.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">
                            Tidak ada data
                        </div>
                    ) : (
                        filteredPartners.map((partner) => (
                            <div key={partner.id} className="p-4 bg-white space-y-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-black border border-blue-100 text-xs uppercase">
                                            {partner.name[0]}
                                        </div>
                                        <div>
                                            <div className="font-black text-slate-900 text-xs uppercase tracking-tight">{partner.name}</div>
                                            <div className="text-[9px] text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                                                <User className="w-2.5 h-2.5" />
                                                {partner.contact_person || '-'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        {canEdit && (
                                            <button onClick={() => handleEdit(partner)} className="p-2 text-slate-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                                        )}
                                        {canDelete && (
                                            <button onClick={() => handleDeleteClick(partner.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <MapPin className="w-2.5 h-2.5 text-slate-400" />
                                        <p className="text-[9px] text-slate-500 font-bold uppercase truncate">{partner.address || '-'}</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="flex items-center gap-1.5 text-[8px] font-black text-slate-400">
                                            <Mail className="w-2.5 h-2.5 text-blue-400" />
                                            {partner.email || '-'}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[8px] font-black text-slate-400">
                                            <Phone className="w-2.5 h-2.5 text-blue-400" />
                                            {partner.phone || '-'}
                                        </div>
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
                                <th className="px-6 py-4">Nama Rekanan</th>
                                <th className="px-6 py-4">Alamat</th>
                                <th className="px-6 py-4">Kontak Person</th>
                                <th className="px-6 py-4">Detail Kontak</th>
                                {(canEdit || canDelete) && <th className="px-6 py-4 text-right w-24">Aksi</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex justify-center flex-col items-center gap-2">
                                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Memuat data...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredPartners.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-black uppercase text-[10px] tracking-widest">
                                        Tidak ada rekanan ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filteredPartners.map((partner, index) => (
                                    <tr key={partner.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-3 text-slate-400 font-bold text-[10px] text-center">{index + 1}</td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-black border border-blue-100 shadow-sm text-xs uppercase">
                                                    {partner.name[0]}
                                                </div>
                                                <div className="font-black text-slate-900 text-xs uppercase tracking-tight leading-none">{partner.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 max-w-[200px]">
                                            <div className="flex items-start gap-1.5">
                                                <MapPin className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                                                <p className="text-[10px] text-slate-500 font-medium line-clamp-1 leading-relaxed uppercase">{partner.address || '-'}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-1.5 text-[10px] font-black font-black text-slate-700 uppercase">
                                                <User className="w-3 h-3 text-blue-400" />
                                                {partner.contact_person || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="text-[9px] space-y-0.5 font-black uppercase tracking-tight">
                                                <div className="flex items-center gap-1.5 text-slate-600"><Mail className="w-2.5 h-2.5 text-blue-400" /> {partner.email || '-'}</div>
                                                <div className="flex items-center gap-1.5 text-slate-600"><Phone className="w-2.5 h-2.5 text-blue-400" /> {partner.phone || '-'}</div>
                                            </div>
                                        </td>
                                        {(canEdit || canDelete) && (
                                            <td className="px-6 py-3 text-right">
                                                <div className="flex justify-end gap-1">
                                                    {canEdit && (
                                                        <button
                                                            onClick={() => handleEdit(partner)}
                                                            className="p-1.5 rounded-lg transition-all text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                                            title="Ubah"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button
                                                            onClick={() => handleDeleteClick(partner.id)}
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

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? "Ubah Data Rekanan" : "Tambah Rekanan Baru"}
            >
                <form onSubmit={handleSubmit} className="p-4 space-y-4 italic">
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                            Nama Rekanan <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-xs font-black text-slate-900 uppercase"
                            placeholder="Contoh: PT. MITRA SEJATI"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                            Alamat Lengkap
                        </label>
                        <textarea
                            rows={2}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-xs font-black text-slate-900 uppercase"
                            placeholder="Alamat rekanan..."
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                Kontak Person
                            </label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-xs font-black text-slate-900 uppercase"
                                placeholder="PIC"
                                value={formData.contact_person}
                                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                Telepon
                            </label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-xs font-black text-slate-900 uppercase"
                                placeholder="08..."
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                            Email
                        </label>
                        <input
                            type="email"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-xs font-bold text-slate-700"
                            placeholder="email@rekanan.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                            <h4 className="text-sm font-bold text-amber-900">Perhatian!</h4>
                            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">Tindakan ini akan menghapus data rekanan secara sistem. Data yang dihapus dapat dipulihkan oleh administrator melalui database.</p>
                        </div>
                    </div>
                    <p className="text-slate-600 font-medium text-center">
                        Apakah Anda yakin ingin menghapus rekanan ini?
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
