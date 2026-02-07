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
    Building2,
    Building,
    FileText
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

interface Department {
    id: number;
    name: string;
    description: string;
    company_id: number;
}

export default function DepartmentsPage() {
    const { authenticatedFetch, hasPermission } = useAuth();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({ name: '', description: '', company_id: '' as string | number });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [companies, setCompanies] = useState<{ id: number, company_name: string }[]>([]);

    const canCreate = hasPermission('departments.create');
    const canEdit = hasPermission('departments.edit');
    const canDelete = hasPermission('departments.delete');

    const fetchDepartments = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_MASTER_DATA_API || 'http://localhost:4001'}/api/departments`);
            if (res.ok) {
                const data = await res.json();
                setDepartments(data);
            }
        } catch (error) {
            console.error('Failed to fetch departments:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCompanySettings = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_MASTER_DATA_API || 'http://localhost:4001'}/api/companies`);
            if (res.ok) {
                const data = await res.json();
                setCompanies(data);
            }
        } catch (error) {
            console.error('Failed to fetch company settings:', error);
        }
    };

    useEffect(() => {
        fetchDepartments();
        fetchCompanySettings();
    }, []);

    const handleCreate = () => {
        setEditingId(null);
        setFormData({ name: '', description: '', company_id: '' });
        setIsModalOpen(true);
    };

    const handleEdit = (dept: any) => {
        setEditingId(dept.id);
        setFormData({
            name: dept.name,
            description: dept.description,
            company_id: dept.company_id || ''
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
            const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_MASTER_DATA_API || 'http://localhost:4001'}/api/departments/${deletingId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setIsDeleteModalOpen(false);
                fetchDepartments();
            } else {
                alert('Failed to delete department');
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
            ? `${process.env.NEXT_PUBLIC_MASTER_DATA_API || 'http://localhost:4001'}/api/departments/${editingId}`
            : `${process.env.NEXT_PUBLIC_MASTER_DATA_API || 'http://localhost:4001'}/api/departments`;

        const method = editingId ? 'PUT' : 'POST';

        const payload = {
            ...formData,
            company_id: formData.company_id ? Number(formData.company_id) : null
        };

        try {
            const res = await authenticatedFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setFormData({ name: '', description: '', company_id: '' });
                setIsModalOpen(false);
                setEditingId(null);
                fetchDepartments();
            } else {
                alert(`Failed to ${editingId ? 'update' : 'create'} department`);
            }
        } catch (error) {
            console.error(error);
            alert('Error connecting to server');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredDepartments = departments.filter(d =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        companies.find(c => c.id === d.company_id)?.company_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-blue-600" />
                        Departemen
                    </h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Kelola unit kerja dan penempatan anggaran perusahaan.</p>
                </div>
                {canCreate && (
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg hover:bg-slate-900 transition-all active:scale-95 w-fit"
                    >
                        <Plus className="w-4 h-4" /> Tambah Departemen
                    </button>
                )}
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari departemen atau unit site..."
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
                    ) : filteredDepartments.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">
                            Tidak ada data
                        </div>
                    ) : (
                        filteredDepartments.map((dept) => (
                            <div key={dept.id} className="p-4 bg-white space-y-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-black border border-blue-100 text-xs">
                                            {dept.name[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-black text-slate-900 text-xs uppercase tracking-tight">{dept.name}</div>
                                            <div className="text-[9px] text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                                                <Building className="w-2.5 h-2.5" />
                                                {companies.find(c => c.id === dept.company_id)?.company_name || 'Tanpa Site'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        {canEdit && (
                                            <button onClick={() => handleEdit(dept)} className="p-2 text-slate-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                                        )}
                                        {canDelete && (
                                            <button onClick={() => handleDeleteClick(dept.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                        )}
                                    </div>
                                </div>
                                {dept.description && (
                                    <div className="bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                                        <p className="text-[9px] text-slate-500 leading-relaxed italic line-clamp-2">{dept.description}</p>
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
                                <th className="px-6 py-4">Nama Departemen</th>
                                <th className="px-6 py-4">Site / Perusahaan</th>
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
                                            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Menarik data departemen...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredDepartments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-black uppercase text-[10px] tracking-widest">
                                        Tidak ada departemen ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filteredDepartments.map((dept, index) => (
                                    <tr key={dept.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-3 font-bold text-slate-400 text-[10px]">{index + 1}</td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-black border border-blue-100 shadow-sm text-xs">
                                                    {dept.name[0].toUpperCase()}
                                                </div>
                                                <div className="font-black text-slate-900 text-xs uppercase tracking-tight">{dept.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-700 uppercase">
                                                <Building className="w-3.5 h-3.5 text-blue-500" />
                                                {companies.find(c => c.id === dept.company_id)?.company_name || 'Tanpa Site'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-1.5 text-slate-500">
                                                <FileText className="w-3 h-3 text-slate-300" />
                                                <p className="text-[10px] italic font-medium max-w-xs truncate">{dept.description || '-'}</p>
                                            </div>
                                        </td>
                                        {(canEdit || canDelete) && (
                                            <td className="px-6 py-3 text-right">
                                                <div className="flex justify-end gap-1">
                                                    {canEdit && (
                                                        <button
                                                            onClick={() => handleEdit(dept)}
                                                            className="p-1.5 rounded-lg transition-all text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                                            title="Edit"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button
                                                            onClick={() => handleDeleteClick(dept.id)}
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
                title={editingId ? "Ubah Departemen" : "Tambah Departemen Baru"}
            >
                <form onSubmit={handleSubmit} className="p-4 space-y-4 italic">
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                            Nama Departemen <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-xs font-black text-slate-900 uppercase"
                            placeholder="Contoh: IT SUPPORT"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                            Unit Site / Perusahaan <span className="text-red-500">*</span>
                        </label>
                        <select
                            required
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-xs font-black text-slate-900 uppercase"
                            value={formData.company_id}
                            onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                        >
                            <option value="">-- PILIH SITE --</option>
                            {companies.map(company => (
                                <option key={company.id} value={company.id}>
                                    {company.company_name.toUpperCase()}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                            Deskripsi / Keterangan
                        </label>
                        <textarea
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-xs font-bold text-slate-700"
                            placeholder="Gambarkan fungsi departemen ini..."
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
                            {editingId ? 'Simpan Perubahan' : 'Tambah Departemen'}
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
                            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">Data yang dihapus mungkin akan berdampak pada laporan anggaran departemen terkait.</p>
                        </div>
                    </div>
                    <p className="text-slate-600 font-medium text-center">
                        Apakah Anda yakin ingin menghapus departemen ini?
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
