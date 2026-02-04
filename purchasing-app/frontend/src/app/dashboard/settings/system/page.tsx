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
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [settings, setSettings] = useState({
        manpro_url: '',
        manpro_username: '',
        manpro_password: ''
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await authenticatedFetch(`${API_BASE}/api/settings`);
            if (response.ok) {
                const data = await response.json();
                const newSettings = { ...settings };
                data.forEach((item: any) => {
                    if (item.key in newSettings) {
                        (newSettings as any)[item.key] = item.value;
                    }
                });
                setSettings(newSettings);
            }
        } catch (error) {
            console.error('Fetch settings error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            const settingsArray = Object.entries(settings).map(([key, value]) => ({ key, value }));
            const response = await authenticatedFetch(`${API_BASE}/api/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings: settingsArray })
            });

            if (response.ok) {
                showMessage('Konfigurasi Manpro berhasil disimpan', 'success');
            } else {
                showMessage('Gagal menyimpan konfigurasi', 'error');
            }
        } catch (error) {
            console.error('Save settings error:', error);
            showMessage('Terjadi kesalahan koneksi', 'error');
        } finally {
            setSaving(false);
        }
    };

    const showMessage = (text: string, type: 'success' | 'error') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleDownloadBackup = async () => {
        try {
            setDownloading(true);
            const response = await authenticatedFetch(`${API_BASE}/api/database/backup`);

            if (response.ok) {
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
                    <p className="text-slate-500 font-medium">Manajemen pemeliharaan sistem dan keamanan database.</p>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in duration-300 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    <span className="font-bold">{message.text}</span>
                </div>
            )}


            <div className="grid grid-cols-1 gap-8">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-blue-50/50">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                                <Server className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Integrasi Manpro</h2>
                                <p className="text-sm text-slate-500 font-medium">Kredensial untuk robot tracking otomatis.</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSaveSettings} className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">URL Aplikasi Manpro</label>
                                <input
                                    type="url"
                                    placeholder="https://manpro.id"
                                    value={settings.manpro_url}
                                    onChange={(e) => setSettings({ ...settings, manpro_url: e.target.value })}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Username Manpro</label>
                                <input
                                    type="text"
                                    value={settings.manpro_username}
                                    onChange={(e) => setSettings({ ...settings, manpro_username: e.target.value })}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Password Manpro</label>
                                <input
                                    type="password"
                                    value={settings.manpro_password}
                                    onChange={(e) => setSettings({ ...settings, manpro_password: e.target.value })}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-3 px-10 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {saving ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                SIMPAN PERUBAHAN
                            </button>
                        </div>
                    </form>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                                <Database className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Cadangan Data (Backup)</h2>
                                <p className="text-sm text-slate-500 font-medium">Download salinan database dalam format .sql untuk pemulihan data.</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 flex flex-col items-center justify-center text-center space-y-6">
                        <div className="max-w-md space-y-2">
                            <p className="text-slate-600 font-medium">
                                Klik tombol di bawah untuk mengekspor seluruh data sistem saat ini. File ini sangat penting disimpan secara rutin.
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

                <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] -mr-32 -mt-32"></div>
                    <div className="relative z-10 flex items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                                <ShieldCheck className="w-7 h-7 text-blue-400" />
                            </div>
                            <div>
                                <h4 className="text-xl font-bold tracking-tight">Audit Trail Pengguna</h4>
                                <p className="text-slate-400 text-sm mt-1">Seluruh tindakan pengubahan data penting direkam demi keamanan sistem.</p>
                            </div>
                        </div>
                        <Link
                            href="/dashboard/settings/logs"
                            className="px-6 py-3 bg-white text-slate-900 hover:bg-blue-50 transition-all rounded-xl text-sm font-black uppercase tracking-tighter shadow-lg"
                        >
                            Lihat Log Aktivitas
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
