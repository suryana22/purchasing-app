'use client';

import { useState, useEffect } from 'react';
import {
    Plus,
    Loader2,
    Pencil,
    Trash2,
    ArrowLeft,
    Shield,
    Lock,
    Search,
    ChevronRight,
    CheckCircle2,
    ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import Modal from '@/components/Modal';
import { useAuth } from '@/components/AuthProvider';

interface Permission {
    id: number;
    name: string;
    description: string;
}

interface Role {
    id: number;
    name: string;
    description: string;
    Permissions?: Permission[];
}

export default function RolesPage() {
    const { authenticatedFetch, hasPermission } = useAuth();
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const canCreate = hasPermission('roles.create');
    const canEdit = hasPermission('roles.edit');
    const canDelete = hasPermission('roles.delete');

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        permissionIds: [] as number[]
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [rolesRes, permsRes] = await Promise.all([
                authenticatedFetch(`${process.env.NEXT_PUBLIC_MASTER_DATA_API || 'http://localhost:4001'}/api/roles`),
                authenticatedFetch(`${process.env.NEXT_PUBLIC_MASTER_DATA_API || 'http://localhost:4001'}/api/permissions`)
            ]);

            if (rolesRes.ok && permsRes.ok) {
                const rolesData = await rolesRes.json();
                const permsData = await permsRes.json();
                setRoles(rolesData);
                setPermissions(permsData);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const togglePermission = (id: number) => {
        if (!canEdit && editingId) return; // Prevent toggling if can't edit
        if (!canCreate && !editingId) return; // Prevent toggling if can't create

        setFormData(prev => ({
            ...prev,
            permissionIds: prev.permissionIds.includes(id)
                ? prev.permissionIds.filter(pid => pid !== id)
                : [...prev.permissionIds, id]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const url = editingId
                ? `${process.env.NEXT_PUBLIC_MASTER_DATA_API || 'http://localhost:4001'}/api/roles/${editingId}`
                : `${process.env.NEXT_PUBLIC_MASTER_DATA_API || 'http://localhost:4001'}/api/roles`;

            const method = editingId ? 'PUT' : 'POST';

            const response = await authenticatedFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setIsModalOpen(false);
                fetchData();
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Gagal menyimpan role');
            }
        } catch (err) {
            alert('Terjadi kesalahan koneksi');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (role: Role) => {
        setEditingId(role.id);
        const permIds = role.Permissions?.map(p => p.id) || [];
        setFormData({
            name: role.name,
            description: role.description || '',
            permissionIds: permIds
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Yakin ingin menghapus role ini? User yang menggunakan role ini mungkin kehilangan akses.')) return;

        try {
            const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_MASTER_DATA_API || 'http://localhost:4001'}/api/roles/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                fetchData();
            }
        } catch (err) {
            console.error('Gagal menghapus role');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-4">
                <Link
                    href="/dashboard/settings/users"
                    className="flex items-center text-slate-500 hover:text-blue-600 transition-colors text-sm font-medium w-fit"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Manajemen Pengguna
                </Link>
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Role & Hak Akses</h1>
                        <p className="text-slate-500 text-sm mt-1">Definisikan role jabatan dan atur batasan akses fitur aplikasi.</p>
                    </div>
                    {canCreate && (
                        <button
                            onClick={() => {
                                setEditingId(null);
                                setFormData({ name: '', description: '', permissionIds: [] });
                                setIsModalOpen(true);
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
                        >
                            <Plus className="w-5 h-5" /> Buat Role Baru
                        </button>
                    )}
                </div>
            </div>

            {/* Content Sidebar Layout */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Left: Role List */}
                <div className="md:col-span-1 space-y-3">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Daftar Role</h2>
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
                    ) : (
                        roles.map(role => (
                            <div
                                key={role.id}
                                className={`w-full text-left p-4 bg-white rounded-xl border border-slate-100 transition-all group relative ${editingId === role.id ? 'border-blue-500 ring-2 ring-blue-50' : 'hover:border-blue-200'}`}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-slate-800 uppercase text-sm tracking-wide">{role.name}</span>
                                    <div className="flex gap-1">
                                        {canEdit && (
                                            <button
                                                onClick={() => handleEdit(role)}
                                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        {canDelete && role.name !== 'administrator' && (
                                            <button
                                                onClick={() => handleDelete(role.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 italic">{role.description || 'Tidak ada deskripsi'}</p>
                                <div className="mt-2 text-[9px] text-blue-600 font-bold uppercase tracking-tighter">
                                    {role.Permissions?.length || 0} Permissions
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Right: Permission Overview */}
                <div className="md:col-span-3">
                    <div className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <ShieldAlert className="w-6 h-6 text-amber-400" />
                                Master Izin Sistem
                            </h3>
                            <p className="text-slate-400 mt-2 text-sm max-w-xl">
                                Seluruh izin di bawah ini bersifat sistemik. Anda tidak dapat menambah izin secara manual,
                                namun dapat mengelompokkannya ke dalam Role di atas.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                                {permissions.length === 0 ? (
                                    <p className="text-slate-500 italic text-sm">Belum ada izin terdaftar.</p>
                                ) : (
                                    permissions.map(perm => (
                                        <div key={perm.id} className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Lock className="w-3 h-3 text-blue-400" />
                                                <span className="font-bold text-xs uppercase tracking-tighter text-blue-100">{perm.name}</span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 leading-relaxed capitalize">{perm.description || 'Izin akses modul'}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        {/* Background Decoration */}
                        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl"></div>
                    </div>
                </div>
            </div>

            {/* Role Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? 'Edit Role & Izin' : 'Buat Role Baru'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-900 mb-2">Nama Role</label>
                            <input
                                type="text"
                                required
                                disabled={!!(editingId && formData.name === 'administrator')}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 font-black uppercase tracking-widest text-sm"
                                placeholder="e.g. ADMINISTRATOR"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase() })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-900 mb-2">Deskripsi Jabatan</label>
                            <textarea
                                rows={2}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-600 font-medium"
                                placeholder="Tujuan atau hak akses role ini..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-900 mb-3">Tentukan Hak Akses (Permissions)</label>
                        <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {permissions.map(perm => {
                                const isChecked = formData.permissionIds.includes(perm.id);
                                return (
                                    <div
                                        key={perm.id}
                                        onClick={() => togglePermission(perm.id)}
                                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${isChecked
                                            ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                                            : 'bg-white border-slate-100 text-slate-500 grayscale hover:grayscale-0'
                                            } ${!!(!canEdit && editingId) ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        <div className="flex-1">
                                            <div className="text-[10px] font-black uppercase tracking-tighter">{perm.name}</div>
                                            <div className="text-[9px] mt-0.5 opacity-70 line-clamp-1 font-medium italic">{perm.description}</div>
                                        </div>
                                        {isChecked && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
                        >
                            Batal
                        </button>
                        {!!(canCreate || canEdit) && (
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-[2] px-4 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                                {editingId ? 'Simpan Perubahan Role' : 'Buat Role'}
                            </button>
                        )}
                    </div>
                </form>
            </Modal>
        </div>
    );
}
