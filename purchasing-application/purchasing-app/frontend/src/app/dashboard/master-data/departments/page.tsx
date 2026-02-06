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
            const res = await authenticatedFetch('http://localhost:4001/api/departments');
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
            const res = await authenticatedFetch('http://localhost:4001/api/companies');
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
            const res = await authenticatedFetch(`http://localhost:4001/api/departments/${deletingId}`, {
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
            ? `http://localhost:4001/api/departments/${editingId}`
            : 'http://localhost:4001/api/departments';

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
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Departemen</h1>
                    <p className="text-slate-500 text-sm mt-1">Kelola unit kerja dan penempatan anggaran perusahaan.</p>
                </div>
                {canCreate && (
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5" /> Tambah Departemen
                    </button>
                )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-50 flex items-center gap-4 bg-slate-50/30">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari departemen atau unit site..."
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
                                            <span className="text-slate-400 font-medium tracking-tight">Menarik data departemen...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredDepartments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                                        Tidak ada departemen ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filteredDepartments.map((dept, index) => (
                                    <tr key={dept.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4 font-bold text-slate-400 text-xs">{index + 1}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 font-bold border border-purple-100 shadow-sm">
                                                    {dept.name[0].toUpperCase()}
                                                </div>
                                                <div className="font-bold text-slate-900 uppercase tracking-tight">{dept.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg w-fit">
                                                <Building className="w-3.5 h-3.5 text-blue-500" />
                                                <span className="text-xs font-black text-slate-700 uppercase tracking-tighter">
                                                    {companies.find(c => c.id === dept.company_id)?.company_name || 'Tanpa Site'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <FileText className="w-3.5 h-3.5 text-slate-300" />
                                                <p className="text-xs italic">{dept.description || 'Tidak ada uraian'}</p>
                                            </div>
                                        </td>
                                        {(canEdit || canDelete) && (
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {canEdit && (
                                                        <button
                                                            onClick={() => handleEdit(dept)}
                                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button
                                                            onClick={() => handleDeleteClick(dept.id)}
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
                title={editingId ? "Ubah Departemen" : "Tambah Departemen Baru"}
            >
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-900 mb-2">
                            Nama Departemen <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 font-bold"
                            placeholder="e.g. IT SUPPORT"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-900 mb-2">
                            Pilih Unit Site / Perusahaan <span className="text-red-500">*</span>
                        </label>
                        <select
                            required
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 font-bold"
                            value={formData.company_id}
                            onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                        >
                            <option value="">-- Pilih Site --</option>
                            {companies.map(company => (
                                <option key={company.id} value={company.id}>
                                    {company.company_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-900 mb-2">
                            Deskripsi / Keterangan
                        </label>
                        <textarea
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 font-bold"
                            placeholder="Gambarkan fungsi departemen ini..."
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
