'use client';

import { useState, useEffect } from 'react';
import {
    Plus,
    Loader2,
    Pencil,
    Trash2,
    ArrowLeft,
    Building2,
    Phone,
    Mail,
    MapPin,
    Search,
    AlertCircle,
    Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';
import Modal from '@/components/Modal';
import { useAuth } from '@/components/AuthProvider';

interface Company {
    id: number;
    company_name: string;
    company_address: string;
    company_logo: string;
    company_phone: string;
    company_email: string;
    direktur_utama?: string;
    company_code?: string;
}

export default function CompaniesPage() {
    const { authenticatedFetch, hasPermission } = useAuth();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const canCreate = hasPermission('companies.create');
    const canEdit = hasPermission('companies.edit');
    const canDelete = hasPermission('companies.delete');

    const [formData, setFormData] = useState({
        company_name: '',
        company_address: '',
        company_logo: '',
        company_phone: '',
        company_email: '',
        direktur_utama: '',
        company_code: ''
    });

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_MASTER_DATA_API || 'http://localhost:4001'}/api/companies`);
            if (response.ok) {
                const data = await response.json();
                setCompanies(data);
            }
        } catch (err) {
            console.error('Error fetching companies:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, company_logo: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const url = editingId
                ? `${process.env.NEXT_PUBLIC_MASTER_DATA_API || 'http://localhost:4001'}/api/companies/${editingId}`
                : `${process.env.NEXT_PUBLIC_MASTER_DATA_API || 'http://localhost:4001'}/api/companies`;

            const method = editingId ? 'PUT' : 'POST';

            const response = await authenticatedFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setIsModalOpen(false);
                fetchCompanies();
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Gagal menyimpan data');
            }
        } catch (err) {
            alert('Terjadi kesalahan koneksi');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (company: Company) => {
        setEditingId(company.id);
        setFormData({
            company_name: company.company_name,
            company_address: company.company_address || '',
            company_logo: company.company_logo || '',
            company_phone: company.company_phone || '',
            company_email: company.company_email || '',
            direktur_utama: company.direktur_utama || '',
            company_code: company.company_code || ''
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
            const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_MASTER_DATA_API || 'http://localhost:4001'}/api/companies/${deletingId}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                setIsDeleteModalOpen(false);
                fetchCompanies();
            }
        } catch (err) {
            console.error('Gagal menghapus perusahaan');
        } finally {
            setSubmitting(false);
            setDeletingId(null);
        }
    };

    const filteredCompanies = companies.filter(c =>
        c.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.company_address?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-4">
                <Link
                    href="/dashboard/settings"
                    className="flex items-center text-slate-500 hover:text-blue-600 transition-colors text-sm font-bold w-fit uppercase tracking-tighter"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Konfigurasi
                </Link>
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Profil Perusahaan & Site</h1>
                        <p className="text-slate-500 text-sm mt-1">Kelola identitas pusat dan cabang untuk output dokumen.</p>
                    </div>
                    {canCreate && (
                        <button
                            onClick={() => {
                                setEditingId(null);
                                setFormData({ company_name: '', company_address: '', company_logo: '', company_phone: '', company_email: '', direktur_utama: '', company_code: '' });
                                setIsModalOpen(true);
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
                        >
                            <Plus className="w-5 h-5" /> Tambah Site Baru
                        </button>
                    )}
                </div>
            </div>

            {/* Content Container */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-50 flex items-center gap-4 bg-slate-50/30">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari site atau alamat..."
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
                                <th className="px-6 py-4 w-20">Logo</th>
                                <th className="px-6 py-4">Identitas Site</th>
                                <th className="px-6 py-4">Kontak & Admin</th>
                                <th className="px-6 py-4">Lokasi Fisik</th>
                                {(canEdit || canDelete) && <th className="px-6 py-4 text-right">Aksi</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex justify-center flex-col items-center gap-2">
                                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                            <span className="text-slate-400 font-medium italic">Sinkronisasi data site...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredCompanies.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                                        Belum ada site yang terdaftar.
                                    </td>
                                </tr>
                            ) : (
                                filteredCompanies.map((company) => (
                                    <tr key={company.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="relative group/logo">
                                                {company.company_logo ? (
                                                    <img src={company.company_logo} alt="Logo" className="w-12 h-12 object-contain rounded-xl bg-white p-1 border border-slate-200 shadow-sm transition-transform group-hover/logo:scale-110" />
                                                ) : (
                                                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 border border-slate-200 group-hover/logo:bg-blue-50 group-hover/logo:text-blue-400 transition-colors">
                                                        <Building2 className="w-6 h-6" />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{company.company_name}</div>
                                            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded w-fit border border-slate-200">SITE-{company.id.toString().padStart(3, '0')}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-[10px] space-y-1 font-black uppercase tracking-tight">
                                                {company.company_phone && <div className="flex items-center gap-1.5 text-slate-600"><Phone className="w-3 h-3 text-blue-400" /> {company.company_phone}</div>}
                                                {company.company_email && <div className="flex items-center gap-1.5 text-slate-600"><Mail className="w-3 h-3 text-blue-400" /> {company.company_email}</div>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-start gap-1.5 max-w-[250px]">
                                                <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                                                <p className="text-xs text-slate-500 font-medium italic leading-relaxed line-clamp-2">{company.company_address || '-'}</p>
                                            </div>
                                        </td>
                                        {(canEdit || canDelete) && (
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {canEdit && (
                                                        <button
                                                            onClick={() => handleEdit(company)}
                                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button
                                                            onClick={() => handleDeleteClick(company.id)}
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

            {/* Modal Form */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? 'Ubah Profil Site' : 'Tambah Site Baru'}
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex flex-col items-center gap-4 py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 group/upload relative overflow-hidden">
                        <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover/upload:opacity-100 transition-opacity" />
                        <div className="relative z-10">
                            <div className="w-24 h-24 bg-white rounded-2xl border-2 border-slate-100 flex items-center justify-center overflow-hidden shadow-xl transition-transform group-hover/upload:scale-105">
                                {formData.company_logo ? (
                                    <img src={formData.company_logo} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                                ) : (
                                    <ImageIcon className="w-10 h-10 text-slate-200" />
                                )}
                            </div>
                            <label className="absolute -bottom-2 -right-2 p-2 bg-blue-600 text-white rounded-xl shadow-lg cursor-pointer hover:bg-blue-700 hover:scale-110 active:scale-95 transition-all">
                                <Plus className="w-4 h-4" />
                                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                            </label>
                        </div>
                        <div className="text-center z-10">
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Logo Perusahaan</span>
                            <p className="text-[9px] text-slate-400 mt-1 italic">Format JPG, PNG max 2MB</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-900 mb-2">Nama Site / Perusahaan <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 font-bold"
                                placeholder="e.g. PT Medikaloka Manaemen (Site A)"
                                value={formData.company_name}
                                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-900 mb-2">Telepon Kantor</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 font-bold"
                                    placeholder="021-xxxxxx"
                                    value={formData.company_phone}
                                    onChange={(e) => setFormData({ ...formData, company_phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-900 mb-2">Email Official</label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 font-bold"
                                    placeholder="admin@site.com"
                                    value={formData.company_email}
                                    onChange={(e) => setFormData({ ...formData, company_email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-900 mb-2">Alamat Lengkap Operasional</label>
                            <textarea
                                rows={2}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 font-bold"
                                placeholder="Masukkan alamat lengkap site..."
                                value={formData.company_address}
                                onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-900 mb-2">Kode Perusahaan (Prefix)</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 font-bold"
                                    placeholder="e.g. MH"
                                    value={formData.company_code}
                                    onChange={(e) => setFormData({ ...formData, company_code: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-900 mb-2">Nama Direktur Utama</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 font-bold"
                                    placeholder="e.g. Dr. H. Hasmoro"
                                    value={formData.direktur_utama}
                                    onChange={(e) => setFormData({ ...formData, direktur_utama: e.target.value })}
                                />
                            </div>
                        </div>
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
                            className="flex-[2] px-4 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
                        >
                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-5 h-5" />)}
                            {editingId ? 'Simpan Perubahan' : 'Tambah Site'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Konfirmasi Hapus Site"
            >
                <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-red-50 rounded-2xl border border-red-100">
                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600 flex-shrink-0">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-red-900">Penghapusan Destruktif!</h4>
                            <p className="text-xs text-red-700 mt-0.5 leading-relaxed">Menghapus site akan memutus hubungan dengan departemen dan log inventaris di site tersebut. Lanjutkan?</p>
                        </div>
                    </div>
                    <p className="text-slate-600 font-medium text-center italic">
                        Apakah Anda yakin ingin menghapus data site ini secara permanen?
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
