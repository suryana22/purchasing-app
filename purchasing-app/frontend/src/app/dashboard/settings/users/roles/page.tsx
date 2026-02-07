'use client';

import { useState, useEffect } from 'react';
import {
    Plus,
    Loader2,
    Trash2,
    ArrowLeft,
    Shield,
    CheckCircle2,
    Save,
    LayoutGrid,
    CheckSquare,
    Square
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import Toast from '@/components/Toast';

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

    // Toast State
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

    // Selection State
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const canCreate = hasPermission('roles.create');
    const canEdit = hasPermission('roles.edit');
    const canDelete = hasPermission('roles.delete');

    // Form State
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

                // Select first role by default if available and not creating
                if (rolesData.length > 0 && !selectedRole && !isCreating) {
                    handleSelectRole(rolesData[0]);
                }
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectRole = (role: Role) => {
        setIsCreating(false);
        setSelectedRole(role);
        setFormData({
            name: role.name,
            description: role.description || '',
            permissionIds: role.Permissions?.map(p => p.id) || []
        });
    };

    const handleCreateNew = () => {
        setIsCreating(true);
        setSelectedRole(null);
        setFormData({
            name: '',
            description: '',
            permissionIds: []
        });
    };

    const togglePermission = (id: number) => {
        if (!isCreating && !canEdit) return; // Permission check

        setFormData(prev => ({
            ...prev,
            permissionIds: prev.permissionIds.includes(id)
                ? prev.permissionIds.filter(pid => pid !== id)
                : [...prev.permissionIds, id]
        }));
    };

    const toggleGroup = (groupPermIds: number[]) => {
        if (!isCreating && !canEdit) return;

        const allSelected = groupPermIds.every(id => formData.permissionIds.includes(id));

        setFormData(prev => {
            if (allSelected) {
                // Deselect all
                return {
                    ...prev,
                    permissionIds: prev.permissionIds.filter(id => !groupPermIds.includes(id))
                };
            } else {
                // Select all (merge unique)
                return {
                    ...prev,
                    permissionIds: Array.from(new Set([...prev.permissionIds, ...groupPermIds]))
                };
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const url = isCreating
                ? `${process.env.NEXT_PUBLIC_MASTER_DATA_API || 'http://localhost:4001'}/api/roles`
                : `${process.env.NEXT_PUBLIC_MASTER_DATA_API || 'http://localhost:4001'}/api/roles/${selectedRole?.id}`;

            const method = isCreating ? 'POST' : 'PUT';

            const response = await authenticatedFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const savedRole = await response.json();
                setIsCreating(false);
                fetchData().then(() => {
                    // Re-select the saved role (we need to find it in the new list to get updated permissions structure if backend returns it, otherwise fetch refreshes roles)
                    // Simple refresh is enough as useEffect usually handles selection, but here we want to stay on the edited role
                    // We'll rely on fetchData refreshing the list, and then we might need to manually set selectedRole to the new/updated one
                    // For simplicity, let fetchData handle list update.
                });
                // alert(isCreating ? 'Role berhasil dibuat' : 'Perubahan berhasil disimpan');
                setToast({
                    message: isCreating ? 'Role berhasil dibuat' : 'Perubahan berhasil disimpan',
                    type: 'success'
                });
            } else {
                const errorData = await response.json();
                // alert(errorData.error || 'Gagal menyimpan role');
                setToast({
                    message: errorData.error || 'Gagal menyimpan role',
                    type: 'error'
                });
            }
        } catch (err) {
            // alert('Terjadi kesalahan koneksi');
            setToast({
                message: 'Terjadi kesalahan koneksi',
                type: 'error'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Yakin ingin menghapus role ini? User yang menggunakan role ini mungkin kehilangan akses.')) return;

        try {
            const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_MASTER_DATA_API || 'http://localhost:4001'}/api/roles/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                // Determine next selection
                const remaining = roles.filter(r => r.id !== id);
                setRoles(remaining);
                if (selectedRole?.id === id) {
                    if (remaining.length > 0) handleSelectRole(remaining[0]);
                    else handleCreateNew();
                }
            }
        } catch (err) {
            console.error('Gagal menghapus role');
        }
    };

    // Group Permissions by Prefix (e.g. 'users.view' -> 'users')
    const groupedPermissions = permissions.reduce((acc, perm) => {
        // Skip database module permissions as requested (only accessible by system admin via backend/direct access if needed, not managed here)
        if (perm.name.startsWith('database.')) return acc;

        const prefix = perm.name.includes('.') ? perm.name.split('.')[0] : 'other';
        if (!acc[prefix]) acc[prefix] = [];
        acc[prefix].push(perm);
        return acc;
    }, {} as Record<string, Permission[]>);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-140px)] flex flex-col">
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
            {/* Header */}
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 shrink-0">
                <Link
                    href="/dashboard/settings/users"
                    className="flex items-center text-slate-500 hover:text-blue-600 transition-colors text-sm font-medium w-fit"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Manajemen Pengguna
                </Link>
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Role & Hak Akses</h1>
                        <p className="text-slate-500 text-sm mt-1">Kelola struktur jabatan dan izin akses sistem secara terpusat.</p>
                    </div>
                </div>
            </div>

            {/* Master-Detail Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">

                {/* Left Panel: Role List */}
                <div className="lg:col-span-3 flex flex-col gap-4 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">Daftar Role</h2>
                        <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{roles.length}</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {loading ? (
                            <div className="flex justify-center p-8"><Loader2 className="w-5 h-5 animate-spin text-slate-300" /></div>
                        ) : (
                            roles.map(role => (
                                <button
                                    key={role.id}
                                    onClick={() => handleSelectRole(role)}
                                    className={`w-full text-left p-3 rounded-xl transition-all border flex items-center justify-between group
                                        ${selectedRole?.id === role.id && !isCreating
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                                            : 'bg-white text-slate-600 border-transparent hover:bg-slate-50 hover:border-slate-200'}`}
                                >
                                    <div className="min-w-0">
                                        <div className={`text-xs font-black uppercase tracking-wide truncate ${selectedRole?.id === role.id && !isCreating ? 'text-white' : 'text-slate-800'}`}>
                                            {role.name}
                                        </div>
                                        <div className={`text-[10px] truncate mt-0.5 ${selectedRole?.id === role.id && !isCreating ? 'text-blue-100' : 'text-slate-400'}`}>
                                            {role.description || 'Tidak ada deskripsi'}
                                        </div>
                                    </div>
                                    {selectedRole?.id === role.id && !isCreating && (
                                        <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>

                    {canCreate && (
                        <div className="p-4 border-t border-slate-100 bg-slate-50">
                            <button
                                onClick={handleCreateNew}
                                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all
                                    ${isCreating
                                        ? 'bg-blue-100 text-blue-700 border border-blue-200 shadow-inner'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 shadow-sm'}`}
                            >
                                <Plus className="w-4 h-4" /> Role Baru
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Panel: Role Editor */}
                <div className="lg:col-span-9 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
                    {/* Toolbar / Header */}
                    <div className="p-6 border-b border-slate-100 flex justify-between items-start gap-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${isCreating ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                <Shield className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">
                                    {isCreating ? 'Buat Role Baru' : `Edit Role: ${selectedRole?.name}`}
                                </h2>
                                <p className="text-xs text-slate-500 font-medium">
                                    {isCreating
                                        ? 'Tentukan nama, deskripsi, dan izin akses untuk role baru.'
                                        : 'Sesuaikan hak akses dan informasi role ini.'}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {canDelete && !isCreating && selectedRole && selectedRole.name !== 'administrator' && (
                                <button
                                    onClick={() => handleDelete(selectedRole.id)}
                                    className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" /> Hapus
                                </button>
                            )}
                            {(isCreating || canEdit) && (
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-lg shadow-blue-200 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Simpan Perubahan
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Scrollable Form Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-700 uppercase tracking-wide">Nama Role</label>
                                <input
                                    type="text"
                                    required
                                    disabled={!isCreating && (!canEdit || (selectedRole?.name === 'administrator'))}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-400 upper"
                                    placeholder="CONTOH: STAFF GUDANG"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-700 uppercase tracking-wide">Deskripsi</label>
                                <input
                                    type="text"
                                    disabled={!isCreating && !canEdit}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-600 placeholder:text-slate-400"
                                    placeholder="Deskripsi singkat tanggung jawab role ini..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Permissions Matrix */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <LayoutGrid className="w-4 h-4 text-slate-400" />
                                    Matriks Hak Akses
                                </h3>
                                <div className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-bold">
                                    {formData.permissionIds.length} Izin Dipilih
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {Object.keys(groupedPermissions).map(prefix => {
                                    const groupPerms = groupedPermissions[prefix];
                                    const allSelected = groupPerms.every(p => formData.permissionIds.includes(p.id));
                                    const someSelected = groupPerms.some(p => formData.permissionIds.includes(p.id));

                                    return (
                                        <div key={prefix} className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                                            {/* Group Header */}
                                            <div
                                                className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-200/50 transition-colors"
                                                onClick={() => toggleGroup(groupPerms.map(p => p.id))}
                                            >
                                                <div className="font-black text-xs text-slate-700 uppercase tracking-wider">
                                                    Module: {prefix}
                                                </div>
                                                <div className={allSelected ? 'text-blue-600' : (someSelected ? 'text-blue-400' : 'text-slate-300')}>
                                                    {allSelected ? <CheckSquare className="w-4 h-4" /> : (someSelected ? <div className="w-4 h-4 bg-current rounded-sm opacity-50" /> : <Square className="w-4 h-4" />)}
                                                </div>
                                            </div>

                                            {/* Permissions List */}
                                            <div className="p-2 space-y-1">
                                                {groupPerms.map(perm => {
                                                    const isChecked = formData.permissionIds.includes(perm.id);
                                                    return (
                                                        <div
                                                            key={perm.id}
                                                            onClick={() => togglePermission(perm.id)}
                                                            className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-all border border-transparent
                                                                ${isChecked
                                                                    ? 'bg-white shadow-sm border-blue-100'
                                                                    : 'hover:bg-slate-200/50 opacity-60 hover:opacity-100'}`}
                                                        >
                                                            <div className={`mt-0.5 rounded border flex items-center justify-center w-4 h-4 shrink-0 transition-colors
                                                                ${isChecked ? 'bg-blue-500 border-blue-500' : 'bg-white border-slate-300'}`}>
                                                                {isChecked && <CheckCircle2 className="w-3 h-3 text-white" />}
                                                            </div>
                                                            <div>
                                                                <div className={`text-[10px] font-bold uppercase tracking-wide ${isChecked ? 'text-blue-700' : 'text-slate-600'}`}>
                                                                    {perm.name.split('.').slice(1).join('.')}
                                                                </div>
                                                                <div className="text-[9px] text-slate-400 leading-tight mt-0.5">
                                                                    {perm.description}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
