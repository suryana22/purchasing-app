'use client';

import Link from 'next/link';
import {
    Building2,
    Users,
    ShieldCheck,
    BellRing,
    FileText,
    Database,
    ArrowRight,
    Activity
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

const configModulesRaw = [
    {
        title: 'Identitas Perusahaan',
        description: 'Atur logo, nama, alamat, dan kontak utama perusahaan untuk dokumen.',
        icon: Building2,
        href: '/dashboard/settings/company',
        permission: 'companies.view',
        color: 'blue'
    },
    {
        title: 'Manajemen Pengguna',
        description: 'Kelola akses pengguna, role, dan izin di dalam aplikasi.',
        icon: Users,
        href: '/dashboard/settings/users',
        permission: 'users.view',
        color: 'purple',
        disabled: false
    },
    {
        title: 'Log Aktivitas',
        description: 'Audit trail seluruh perubahan data yang dilakukan oleh pengguna.',
        icon: Activity,
        href: '/dashboard/settings/logs',
        permission: 'users.view', // Can be seen by anyone who can view users/admin
        color: 'emerald',
        disabled: false
    },
    {
        title: 'Sistem & Keamanan',
        description: 'Pengaturan database, backup, log sistem, dan autentikasi.',
        icon: ShieldCheck,
        href: '#',
        color: 'blue',
        disabled: true
    },
    {
        title: 'Notifikasi',
        description: 'Konfigurasi email blast dan notifikasi alert sistem (Segera).',
        icon: BellRing,
        href: '#',
        color: 'amber',
        disabled: true
    }
];

export default function SettingsDashboard() {
    const { hasPermission } = useAuth();

    const configModules = configModulesRaw.filter(mod => {
        if (!mod.permission) return true;
        return hasPermission(mod.permission);
    });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Pusat Konfigurasi</h1>
                <p className="text-slate-500 mt-2 text-lg">Kelola seluruh parameter dan pengaturan sistem dari satu tempat.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {configModules.map((module, idx) => {
                    const Icon = module.icon;
                    return (
                        <Link
                            key={idx}
                            href={module.href}
                            className={`group relative overflow-hidden bg-white p-8 rounded-2xl border border-slate-100 shadow-sm transition-all duration-300 
                                ${module.disabled ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1 hover:border-blue-200'}
                            `}
                        >
                            {/* Gradient Background Decoration */}
                            <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-5 transition-transform duration-500 group-hover:scale-150 
                                ${module.color === 'blue' ? 'bg-blue-600' :
                                    module.color === 'purple' ? 'bg-purple-600' :
                                        module.color === 'emerald' ? 'bg-emerald-600' : 'bg-amber-600'}
                            `} />

                            <div className="relative z-10 space-y-4">
                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 
                                    ${module.color === 'blue' ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' :
                                        module.color === 'purple' ? 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white' :
                                            module.color === 'emerald' ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white' :
                                                'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white'}
                                `}>
                                    <Icon className="w-7 h-7" />
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                                        {module.title}
                                    </h3>
                                    <p className="text-slate-500 mt-2 line-clamp-2 text-sm leading-relaxed font-medium">
                                        {module.description}
                                    </p>
                                </div>

                                {!module.disabled && (
                                    <div className="pt-2 flex items-center text-blue-600 text-sm font-black group-hover:translate-x-2 transition-transform">
                                        Konfigurasi Sekarang <ArrowRight className="w-4 h-4 ml-2" />
                                    </div>
                                )}

                                {module.disabled && (
                                    <div className="pt-2">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-400">
                                            Coming Soon
                                        </span>
                                    </div>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Bottom Info Section */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] -mr-32 -mt-32"></div>
                <div className="relative z-10 flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                        <Database className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                        <h4 className="text-xl font-bold tracking-tight">Informasi Sistem & Audit</h4>
                        <p className="text-slate-400 text-sm mt-1 max-w-xl">Seluruh tindakan yang bersifat perubahan (CUD) akan dicatat ke dalam database audit untuk keperluan kepatuhan dan keamanan.</p>
                    </div>
                </div>
                <div className="relative z-10 flex gap-4">
                    <Link
                        href="/dashboard/settings/logs"
                        className="px-6 py-3 bg-white text-slate-900 hover:bg-blue-50 transition-all rounded-xl text-sm font-black uppercase tracking-tighter flex items-center gap-2 shadow-lg"
                    >
                        <Activity className="w-4 h-4" />
                        Buka Log Audit
                    </Link>
                </div>
            </div>
        </div>
    );
}
