'use client';

import { useState, useEffect } from 'react';
import {
    Activity,
    Loader2,
    ArrowLeft,
    Search,
    Filter,
    Clock,
    User,
    Shield,
    Database
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

interface ActivityLog {
    id: number;
    user_id: number;
    username: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    module: string;
    target_id: string;
    details: string;
    ip_address: string;
    createdAt: string;
}

export default function LogsPage() {
    const { authenticatedFetch } = useAuth();
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_MASTER_DATA_API || 'http://localhost:4001'}/api/logs`);
            if (response.ok) {
                const data = await response.json();
                setLogs(data);
            }
        } catch (err) {
            console.error('Error fetching logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'CREATE': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'UPDATE': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'DELETE': return 'bg-red-50 text-red-700 border-red-100';
            default: return 'bg-slate-50 text-slate-700 border-slate-100';
        }
    };

    const filteredLogs = logs.filter(log =>
        log.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.module.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.target_id?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).format(date);
    };

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
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                            <Activity className="w-8 h-8 text-blue-600" />
                            Log Aktivitas Pengguna
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">Audit trail seluruh tindakan pembuatan, pengubahan, dan penghapusan data.</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-50 flex items-center justify-between gap-4 bg-slate-50/30">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari berdasarkan User, Modul, atau ID..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-900 outline-none transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                        <Filter className="w-4 h-4" /> Filter Log
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-[0.2em]">
                            <tr>
                                <th className="px-6 py-4">Waktu & Tanggal</th>
                                <th className="px-6 py-4">Pengguna</th>
                                <th className="px-6 py-4">Tindakan</th>
                                <th className="px-6 py-4">Modul / Objek</th>
                                <th className="px-6 py-4">Detail Perubahan</th>
                                <th className="px-6 py-4">Alamat IP</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex justify-center flex-col items-center gap-2">
                                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                            <span className="text-slate-400 font-medium tracking-tight">Menarik data audit...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                                        Tidak ada catatan aktivitas ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
                                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                {formatDate(log.createdAt)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200 text-xs">
                                                    {log.username[0].toUpperCase()}
                                                </div>
                                                <span className="font-black text-slate-900 text-xs uppercase tracking-tighter">@{log.username}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase border tracking-widest ${getActionColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-800 uppercase tracking-tight">{log.module}</span>
                                                <span className="text-[10px] text-slate-400 font-medium">ID: {log.target_id || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 overflow-hidden">
                                                <p className="text-[10px] font-mono text-slate-600 truncate italic">
                                                    {log.details || 'Tidak ada detail data tambahan'}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-[10px] font-mono text-slate-400 bg-white border border-slate-100 px-2 py-0.5 rounded-full w-fit">
                                                {log.ip_address || 'Localhost'}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
