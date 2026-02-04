'use client';

import { useState, useEffect } from 'react';
import {
    ShieldCheck,
    Database,
    Server,
    AlertTriangle,
    CheckCircle2,
    RefreshCcw,
    Save,
    ChevronLeft
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

const API_BASE = process.env.NEXT_PUBLIC_MASTER_DATA_API || '';

export default function SystemSettings() {
    const { authenticatedFetch } = useAuth();
    const [environment, setEnvironment] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        fetchConfig();
    }, []);

    const showMessage = (text: string, type: 'success' | 'error') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 3000);
    };

    const fetchConfig = async () => {
        try {
            setLoading(true);
            const response = await authenticatedFetch(`${API_BASE}/api/database/config`);
            if (response.ok) {
                const data = await response.json();
                setEnvironment(data.ENVIRONMENT || 'production');
            }
        } catch (error) {
            console.error('Failed to fetch config:', error);
            showMessage('Gagal mengambil konfigurasi sistem', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (selectedEnv: string) => {
        try {
            setSaving(true);
            const response = await authenticatedFetch(`${API_BASE}/api/database/config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ENVIRONMENT: selectedEnv })
            });

            if (response.ok) {
                setEnvironment(selectedEnv);
                showMessage(`Berhasil dialihkan ke mode ${selectedEnv.toUpperCase()}`, 'success');
                // Refresh to ensure all services pick up the change
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                showMessage('Gagal memperbarui konfigurasi', 'error');
            }
        } catch (error) {
            console.error('Save error:', error);
            showMessage('Terjadi kesalahan saat menyimpan', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDownloadBackup = async () => {
        try {
            setDownloading(true);
            const response = await authenticatedFetch(`${API_BASE}/api/database/backup`);

            if (response.ok) {
                // Handle binary download
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `backup-${new Date().toISOString().split('T')[0]}.sql`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                showMessage('Backup database berhasil diunduh', 'success');
            } else {
                showMessage('Gagal mengunduh backup database', 'error');
            }
        } catch (error) {
            console.error('Download error:', error);
            showMessage('Terjadi kesalahan koneksi', 'error');
        } finally {
            setDownloading(false);
        }
    };


    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <RefreshCcw className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-500 mb-2">
                        <Link href="/dashboard/settings" className="hover:text-blue-600 transition-colors flex items-center gap-1 text-sm font-medium">
                            <ChevronLeft className="w-4 h-4" /> Kembali ke Pusat Konfigurasi
                        </Link>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <ShieldCheck className="w-10 h-10 text-blue-600" />
                        Sistem & Keamanan
                    </h1>
                    <p className="text-slate-500 font-medium">Pengaturan parameter inti sistem dan konektivitas database.</p>
                </div>
            </div>

            {/* Message Notification */}
            {message && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in duration-300 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    <span className="font-bold">{message.text}</span>
                </div>
            )}


            <div className="grid grid-cols-1 gap-8">
                {/* Database Environment Card */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                                <Database className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Lingkungan Database</h2>
                                <p className="text-sm text-slate-500 font-medium">Pilih database yang akan digunakan oleh aplikasi.</p>
                            </div>
                        </div>
                        <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border-2 ${environment === 'production'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            : 'bg-amber-50 text-amber-600 border-amber-100'
                            }`}>
                            Current: {environment}
                        </div>
                    </div>

                    <div className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Production Option */}
                            <button
                                onClick={() => handleSave('production')}
                                disabled={saving}
                                className={`relative flex flex-col items-start p-6 rounded-2xl border-2 transition-all duration-300 text-left group
                                    ${environment === 'production'
                                        ? 'border-emerald-500 bg-emerald-50/30 ring-4 ring-emerald-500/10'
                                        : 'border-slate-100 hover:border-blue-200 hover:bg-slate-50'}
                                `}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors
                                    ${environment === 'production' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600'}
                                `}>
                                    <Server className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-slate-900 text-lg mb-1">Production Database</h3>
                                <p className="text-sm text-slate-500 font-medium mb-4">
                                    Database operasional utama (purchasing_db_prod). Gunakan ini untuk penggunaan sehari-hari.
                                </p>
                                {environment === 'production' && (
                                    <div className="mt-auto flex items-center gap-2 text-emerald-600 text-sm font-black uppercase tracking-tighter">
                                        <CheckCircle2 className="w-4 h-4" /> Active Now
                                    </div>
                                )}
                            </button>

                            {/* Development Option */}
                            <button
                                onClick={() => handleSave('development')}
                                disabled={saving}
                                className={`relative flex flex-col items-start p-6 rounded-2xl border-2 transition-all duration-300 text-left group
                                    ${environment === 'development'
                                        ? 'border-amber-500 bg-amber-50/30 ring-4 ring-amber-500/10'
                                        : 'border-slate-100 hover:border-blue-200 hover:bg-slate-50'}
                                `}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors
                                    ${environment === 'development' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600'}
                                `}>
                                    <RefreshCcw className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-slate-900 text-lg mb-1">Development Database</h3>
                                <p className="text-sm text-slate-500 font-medium mb-4">
                                    Database percobaan (purchasing_dev). Cocok untuk testing fitur baru tanpa mengganggu data asli.
                                </p>
                                {environment === 'development' && (
                                    <div className="mt-auto flex items-center gap-2 text-amber-600 text-sm font-black uppercase tracking-tighter">
                                        <CheckCircle2 className="w-4 h-4" /> Active Now
                                    </div>
                                )}
                            </button>
                        </div>

                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex gap-4">
                            <AlertTriangle className="w-6 h-6 text-blue-600 shrink-0" />
                            <div className="space-y-2">
                                <h4 className="font-bold text-blue-900 leading-tight">Catatan Penting:</h4>
                                <ul className="text-sm text-blue-800/80 space-y-1 font-medium list-disc list-inside">
                                    <li>Pergantian database akan menyebabkan service restart selama beberapa detik.</li>
                                    <li>Data di database Production dan Development terpisah sepenuhnya.</li>
                                    <li>Pastikan semua proses penting sudah tersimpan sebelum melakukan perpindahan.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Database Backup Card */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                                <Save className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Cadangan Data (Backup)</h2>
                                <p className="text-sm text-slate-500 font-medium">Download salinan database dalam format .sql.</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 flex flex-col items-center justify-center text-center space-y-6">
                        <div className="max-w-md space-y-2">
                            <p className="text-slate-600 font-medium">
                                Klik tombol di bawah untuk mengekspor seluruh data sistem saat ini. File ini dapat digunakan untuk migrasi atau pemulihan data (restore) di kemudian hari.
                            </p>
                        </div>

                        <button
                            onClick={handleDownloadBackup}
                            disabled={downloading}
                            className="flex items-center gap-3 px-8 py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {downloading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            DOWNLOAD BACKUP SEKARANG (.SQL)
                        </button>
                    </div>
                </div>

                {/* System Logs Hint Card (Small) */}
                <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] -mr-32 -mt-32"></div>
                    <div className="relative z-10 flex items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                                <ShieldCheck className="w-7 h-7 text-blue-400" />
                            </div>
                            <div>
                                <h4 className="text-xl font-bold tracking-tight">Audit Trail Database</h4>
                                <p className="text-slate-400 text-sm mt-1">Setiap pergantian lingkungan database dicatat dalam audit log sistem.</p>
                            </div>
                        </div>
                        <Link
                            href="/dashboard/settings/logs"
                            className="px-6 py-3 bg-white text-slate-900 hover:bg-blue-50 transition-all rounded-xl text-sm font-black uppercase tracking-tighter shadow-lg"
                        >
                            Lihat Log
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
