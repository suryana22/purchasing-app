'use client';

import { useState, useEffect } from 'react';
import {
    Plus,
    Loader2,
    Pencil,
    Trash2,
    ArrowLeft,
    User,
    Shield,
    Search,
    UserPlus,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import Link from 'next/link';
import Modal from '@/components/Modal';
import { useAuth } from '@/components/AuthProvider';

interface Role {
    id: number;
    name: string;
}

interface UserData {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    role_id: number;
    Role?: Role;
}

export default function UsersPage() {
    const { authenticatedFetch, hasPermission } = useAuth();
    const [users, setUsers] = useState<UserData[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const canCreate = hasPermission('users.create');
    const canEdit = hasPermission('users.edit');
    const canDelete = hasPermission('users.delete');

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        first_name: '',
        last_name: '',
        role_id: '' as string | number
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [usersRes, rolesRes] = await Promise.all([
                authenticatedFetch(`${process.env.NEXT_PUBLIC_MASTER_DATA_API || 'http://localhost:4001'}/api/users`),
                authenticatedFetch(`${process.env.NEXT_PUBLIC_MASTER_DATA_API || 'http://localhost:4001'}/api/roles`)
            ]);

            if (usersRes.ok && rolesRes.ok) {
                const usersData = await usersRes.json();
                const rolesData = await rolesRes.json();
                setUsers(usersData);
                setRoles(rolesData);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const url = editingId
                ? `${process.env.NEXT_PUBLIC_MASTER_DATA_API || 'http://localhost:4001'}/api/users/${editingId}`
                : `${process.env.NEXT_PUBLIC_MASTER_DATA_API || 'http://localhost:4001'}/api/users`;

            const method = editingId ? 'PUT' : 'POST';

            // Don't send empty password on edit
            const dataToSubmit = { ...formData };
            if (editingId && !dataToSubmit.password) {
                delete (dataToSubmit as any).password;
            }

            const response = await authenticatedFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSubmit)
            });

            if (response.ok) {
                setIsModalOpen(false);
                fetchData();
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

    const handleEdit = (user: UserData) => {
        setEditingId(user.id);
        setFormData({
            username: user.username,
            password: '',
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            role_id: user.role_id || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Yakin ingin menghapus pengguna ini?')) return;

        try {
            const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_MASTER_DATA_API || 'http://localhost:4001'}/api/users/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                fetchData();
            }
        } catch (err) {
            console.error('Gagal menghapus pengguna');
        }
    };

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-4">
                <Link
                    href="/dashboard/settings"
                    className="flex items-center text-slate-500 hover:text-blue-600 transition-colors text-sm font-medium w-fit"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Pusat Konfigurasi
                </Link>
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manajemen Pengguna</h1>
                        <p className="text-slate-500 text-sm mt-1">Kelola akun pengguna, penetapan role, dan akses sistem.</p>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            href="/dashboard/settings/users/roles"
                            className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all"
                        >
                            <Shield className="w-5 h-5" /> Kelola Role & Izin
                        </Link>
                        {canCreate && (
                            <button
                                onClick={() => {
                                    setEditingId(null);
                                    setFormData({ username: '', password: '', first_name: '', last_name: '', role_id: '' });
                                    setIsModalOpen(true);
                                }}
                                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
                            >
                                <UserPlus className="w-5 h-5" /> Tambah Pengguna
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-50 flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari pengguna berdasarkan nama atau User ID..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-900"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Pengguna</th>
                                <th className="px-6 py-4">User ID</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Status</th>
                                {(canEdit || canDelete) && <th className="px-6 py-4 text-right">Aksi</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex justify-center flex-col items-center gap-2">
                                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                            <span className="text-slate-400 font-medium">Memuat data...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        Tidak ada pengguna ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100 shadow-sm">
                                                    {(user.first_name?.[0] || user.username[0]).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 leading-tight">{user.first_name} {user.last_name || ''}</div>
                                                    <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">@{user.username}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-sm text-slate-800 font-bold bg-slate-50 px-2 py-1 rounded w-fit italic">
                                                {user.username}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase border tracking-widest ${user.role_id ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-slate-100 text-slate-500 border-slate-200'
                                                }`}>
                                                {roles.find(r => r.id === user.role_id)?.name || 'NO ROLE'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs uppercase">
                                                <CheckCircle2 className="w-4 h-4" /> Aktif
                                            </div>
                                        </td>
                                        {(canEdit || canDelete) && (
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {canEdit && (
                                                        <button
                                                            onClick={() => handleEdit(user)}
                                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button
                                                            onClick={() => handleDelete(user.id)}
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

            {/* User Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-900 mb-2">User ID (Username)</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 font-bold"
                            placeholder="e.g. jdoe"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-900 mb-2">Nama Depan</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 font-bold"
                                placeholder="e.g. John"
                                value={formData.first_name}
                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-900 mb-2">Nama Belakang</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 font-bold"
                                placeholder="e.g. Doe"
                                value={formData.last_name}
                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-900 mb-2">
                            {editingId ? 'Password (Kosongkan jika tidak diubah)' : 'Password'}
                        </label>
                        <input
                            type="password"
                            required={!editingId}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 font-bold"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-900 mb-2">Pilih Role</label>
                        <select
                            required
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 font-bold cursor-pointer"
                            value={formData.role_id}
                            onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                        >
                            <option value="">-- Pilih Role --</option>
                            {roles.map(role => (
                                <option key={role.id} value={role.id}>
                                    {role.name.toUpperCase()}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-[2] px-4 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                            {editingId ? 'Simpan Perubahan' : 'Tambah Pengguna'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
