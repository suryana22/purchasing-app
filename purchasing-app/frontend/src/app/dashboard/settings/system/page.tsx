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
    ChevronLeft,
    ArrowRight,
    Search,
    Lock
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

const API_BASE = process.env.NEXT_PUBLIC_MASTER_DATA_API || '';

type TabType = 'main' | 'manpro' | 'database';

export default function SystemSettings() {
    const { authenticatedFetch } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('main');
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
                setTimeout(() => setActiveTab('main'), 1500);
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
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-500 mb-2">
                        {activeTab === 'main' ? (
                            <Link href="/dashboard/settings" className="hover:text-blue-600 transition-colors flex items-center gap-1 text-sm font-black uppercase tracking-tight">
                                <ChevronLeft className="w-4 h-4" /> Pengaturan Utama
                            </Link>
                        ) : (
                            <button 
                                onClick={() => setActiveTab('main')}
                                className="hover:text-blue-600 transition-colors flex items-center gap-1 text-sm font-black uppercase tracking-tight"
                            >
                                <ChevronLeft className="w-4 h-4" /> Kembali ke Menu Sistem
                            </button>
                        )}
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-4 uppercase">
                        <ShieldCheck className="w-12 h-12 text-blue-600" />
                        {activeTab === 'main' && 'Sistem & Keamanan'}
                        {activeTab === 'manpro' && 'Integrasi Manpro'}
                        {activeTab === 'database' && 'Manajemen Database'}
                    </h1>
                    <p className="text-slate-500 font-bold uppercase text-xs tracking-widest italic opacity-70">
                        {activeTab === 'main' && 'Pusat kendali infrastruktur dan keamanan data aplikasi'}
                        {activeTab === 'manpro' && 'Pengaturan kredensial robot tracking otomatis'}
                        {activeTab === 'database' && 'Pemeliharaan data dan cadangan sistem'}
                    </p>
                </div>
            </div>

            {/* Message Notification */}
            {message && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in duration-300 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-lg shadow-emerald-100/50' : 'bg-red-50 text-red-700 border border-red-100 shadow-lg shadow-red-100/50'}`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
                    <span className="font-black uppercase text-xs tracking-wider">{message.text}</span>
                </div>
            )}

            {activeTab === 'main' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in duration-500">
                    {/* Manpro Card */}
                    <button
                        onClick={() => setActiveTab('manpro')}
                        className="group relative overflow-hidden bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-2 hover:border-blue-400 transition-all duration-500 text-left"
                    >
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-600 rounded-full opacity-0 group-hover:opacity-5 transition-all duration-700 scale-50 group-hover:scale-150" />
                        
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-inner">
                            <Server className="w-8 h-8" />
                        </div>
                        
                        <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-700 transition-colors uppercase tracking-tight">Integrasi Manpro</h3>
                        <p className="text-slate-500 mt-2 text-sm font-bold uppercase tracking-wide opacity-70 italic line-clamp-2 leading-relaxed">Kelola URL, User, dan Password untuk robot pelacakan otomatis.</p>
                        
                        <div className="mt-6 flex items-center text-blue-600 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all">
                            Konfigurasi <ArrowRight className="w-3.5 h-3.5 ml-2" />
                        </div>
                    </button>

                    {/* Database Card */}
                    <button
                        onClick={() => setActiveTab('database')}
                        className="group relative overflow-hidden bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-2xl hover:shadow-emerald-900/10 hover:-translate-y-2 hover:border-emerald-400 transition-all duration-500 text-left"
                    >
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-600 rounded-full opacity-0 group-hover:opacity-5 transition-all duration-700 scale-50 group-hover:scale-150" />
                        
                        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500 shadow-inner">
                            <Database className="w-8 h-8" />
                        </div>
                        
                        <h3 className="text-xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors uppercase tracking-tight">Database & Backup</h3>
                        <p className="text-slate-500 mt-2 text-sm font-bold uppercase tracking-wide opacity-70 italic line-clamp-2 leading-relaxed">Ekspor data sistem (.sql) dan pemeliharaan struktur tabel.</p>
                        
                        <div className="mt-6 flex items-center text-emerald-600 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all">
                            Buka Alat <ArrowRight className="w-3.5 h-3.5 ml-2" />
                        </div>
                    </button>

                    {/* Logs Card */}
                    <Link
                        href="/dashboard/settings/logs"
                        className="group relative overflow-hidden bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-slate-900/50 hover:-translate-y-2 hover:border-slate-600 transition-all duration-500 text-left"
                    >
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-400 rounded-full opacity-5 transition-all duration-700 scale-150" />
                        
                        <div className="w-16 h-16 bg-white/10 text-white rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-all duration-500 border border-white/10 backdrop-blur-sm">
                            <Lock className="w-8 h-8" />
                        </div>
                        
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">Audit Trail</h3>
                        <p className="text-slate-400 mt-2 text-sm font-bold uppercase tracking-wide opacity-70 italic line-clamp-2 leading-relaxed">Catatan riwayat aktivitas pengguna untuk audit keamanan.</p>
                        
                        <div className="mt-6 flex items-center text-blue-400 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all">
                            Lihat Log <ArrowRight className="w-3.5 h-3.5 ml-2" />
                        </div>
                    </Link>
                </div>
            )}

            {activeTab === 'manpro' && (
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden animate-in slide-in-from-right-8 duration-500">
                    <div className="p-10 border-b border-slate-100 bg-blue-50/50">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-200">
                                <Server className="w-10 h-10 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-1">Konfigurasi Integrasi</h2>
                                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest italic leading-none">Pastikan kredensial benar agar robot tracking bisa login otomatis.</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSaveSettings} className="p-10 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 italic">
                            <div className="md:col-span-2 space-y-3">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <ArrowRight className="w-3 h-3 text-blue-500" /> URL Aplikasi Manpro
                                </label>
                                <input
                                    type="url"
                                    placeholder="https://manpro.id"
                                    value={settings.manpro_url}
                                    onChange={(e) => setSettings({ ...settings, manpro_url: e.target.value })}
                                    className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] focus:ring-8 focus:ring-blue-100 focus:border-blue-500 focus:bg-white outline-none transition-all font-black text-slate-800 placeholder:opacity-30 tracking-tight"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <ArrowRight className="w-3 h-3 text-blue-500" /> Username Manpro
                                </label>
                                <input
                                    type="text"
                                    value={settings.manpro_username}
                                    placeholder="Username anda"
                                    onChange={(e) => setSettings({ ...settings, manpro_username: e.target.value })}
                                    className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] focus:ring-8 focus:ring-blue-100 focus:border-blue-500 focus:bg-white outline-none transition-all font-black text-slate-800 placeholder:opacity-30 tracking-tight"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <ArrowRight className="w-3 h-3 text-blue-500" /> Password Manpro
                                </label>
                                <input
                                    type="password"
                                    value={settings.manpro_password}
                                    placeholder="••••••••"
                                    onChange={(e) => setSettings({ ...settings, manpro_password: e.target.value })}
                                    className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] focus:ring-8 focus:ring-blue-100 focus:border-blue-500 focus:bg-white outline-none transition-all font-black text-slate-800 placeholder:opacity-30 tracking-tight"
                                />
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-6 border-t border-slate-100">
                             <div className="px-5 py-3 bg-amber-50 text-amber-700 rounded-2xl flex items-center gap-3 border border-amber-100">
                                <AlertTriangle className="w-4 h-4" />
                                <p className="text-[10px] font-bold uppercase leading-tight italic max-w-[250px]">Kredensial dienkripsi dan hanya dapat diakses oleh layanan robot.</p>
                            </div>
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-4 px-12 py-5 bg-blue-600 text-white font-black rounded-2xl shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 uppercase text-xs tracking-widest"
                            >
                                {saving ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                Simpan Konfigurasi
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {activeTab === 'database' && (
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden animate-in slide-in-from-right-8 duration-500 italic">
                    <div className="p-10 border-b border-slate-100 bg-emerald-50/50">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-200">
                                <Database className="w-10 h-10 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-1">Cadangan Data (Backup)</h2>
                                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest italic leading-none text-left">Pencadangan rutin adalah pertahanan terbaik terhadap kehilangan data.</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-12 flex flex-col items-center justify-center text-center space-y-10">
                        <div className="max-w-xl space-y-4">
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto border-4 border-white shadow-inner">
                                <Save className="w-10 h-10 text-emerald-600" />
                            </div>
                            <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">Ekspor Database Lengkap</h4>
                            <p className="text-slate-500 font-bold uppercase tracking-wide text-xs leading-relaxed opacity-70">
                                Menghasilkan file SQL yang berisi seluruh tabel, data master, transaksi, dan akun pengguna. Gunakan file ini untuk memulihkan sistem jika terjadi kegagalan server.
                            </p>
                        </div>

                        <div className="w-full max-w-lg p-6 bg-slate-50 rounded-3xl border border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-4 text-left">
                                <div className="p-3 bg-white rounded-xl shadow-sm">
                                    <FileText className="w-5 h-5 text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Format Standar</p>
                                    <p className="text-xs font-black text-slate-700">PostgreSQL Dump (.sql)</p>
                                </div>
                            </div>
                            <button
                                onClick={handleDownloadBackup}
                                disabled={downloading}
                                className="flex items-center gap-4 px-8 py-4 bg-emerald-600 text-white font-black rounded-[1.25rem] shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 uppercase text-[10px] tracking-widest"
                            >
                                {downloading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Download Sekarang
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Proses ini aman dan tidak mengganggu performa aplikasi berjalan
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const FileText = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
);
