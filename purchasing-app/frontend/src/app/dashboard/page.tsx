'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import {
    Activity,
    Server,
    Database,
    Users,
    ShoppingCart,
    Building2,
    Briefcase,
    Globe,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Loader2,
    Search
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

export default function DashboardPage() {
    const { authenticatedFetch, user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        orders: 0,
        departments: 0,
        partners: 0
    });
    const [systemHealth, setSystemHealth] = useState<any>(null);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 30000); // Poll every 30s

        // Start Manpro Session if Admin
        if (user?.role?.toLowerCase() === 'administrator') {
            startManproSession();
        }

        return () => clearInterval(interval);
    }, [user]);

    const startManproSession = async () => {
        try {
            await authenticatedFetch(`${process.env.NEXT_PUBLIC_PURCHASING_API || 'http://localhost:4002'}/api/manpro/session/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}) // Backend will use env creds if empty
            });
            console.log('Manpro Admin Session Init request sent.');
        } catch (e) {
            console.error('Failed to init Manpro session:', e);
        }
    };

    const fetchDashboardData = async () => {
        try {
            // Parallel fetch for efficiency
            const [ordersRes, deptsRes, partnersRes, healthRes] = await Promise.all([
                authenticatedFetch('/api/purchasing/orders/count'),
                authenticatedFetch('/api/master-data/departments/count'),
                authenticatedFetch('/api/master-data/partners/count'),
                authenticatedFetch('/api/master-data/system/status')
            ]);

            const ordersData = await ordersRes.json();
            const deptsData = await deptsRes.json();
            const partnersData = await partnersRes.json();

            setStats({
                orders: ordersData.count || 0,
                departments: deptsData.count || 0,
                partners: partnersData.count || 0
            });

            if (healthRes.ok) {
                const healthData = await healthRes.json();
                setSystemHealth(healthData);
            }

            setLastUpdated(new Date());
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
            setLoading(false);
        }
    };

    // Mock data for charts (since we don't have historical data APIs yet)
    const trafficData = [
        { time: '08:00', users: 12, requests: 450 },
        { time: '09:00', users: 25, requests: 890 },
        { time: '10:00', users: 38, requests: 1200 },
        { time: '11:00', users: 45, requests: 1560 },
        { time: '12:00', users: 30, requests: 980 },
        { time: '13:00', users: 35, requests: 1100 },
        { time: '14:00', users: 42, requests: 1450 },
    ];

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-100px)] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Memuat Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Dashboard Utama</h1>
                    <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-1">
                        Monitoring Sistem & Statistik &bull; Updated: {lastUpdated.toLocaleTimeString()}
                    </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-wide">Live Monitoring</span>
                </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-lg shadow-blue-100/50 border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500" />
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-4 shadow-inner">
                            <ShoppingCart className="w-6 h-6" />
                        </div>
                        <h2 className="text-slate-500 font-black text-[10px] uppercase tracking-widest mb-1">Total Pemesanan</h2>
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-black text-slate-900 tracking-tighter">{stats.orders}</span>
                            <span className="text-xs font-bold text-emerald-500 mb-1.5">+12% minggu ini</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-lg shadow-emerald-100/50 border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500" />
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-4 shadow-inner">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <h2 className="text-slate-500 font-black text-[10px] uppercase tracking-widest mb-1">Departemen Aktif</h2>
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-black text-slate-900 tracking-tighter">{stats.departments}</span>
                            <span className="text-xs font-bold text-slate-400 mb-1.5">Unit Kerja</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-lg shadow-indigo-100/50 border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500" />
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-4 shadow-inner">
                            <Briefcase className="w-6 h-6" />
                        </div>
                        <h2 className="text-slate-500 font-black text-[10px] uppercase tracking-widest mb-1">Mitra Rekanan</h2>
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-black text-slate-900 tracking-tighter">{stats.partners}</span>
                            <span className="text-xs font-bold text-slate-400 mb-1.5">Vendor Terdaftar</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* System Health Monitor */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2">
                                <Activity className="w-4 h-4 text-blue-500" /> Status Server
                            </h3>
                            <div className={`w-2 h-2 rounded-full ${systemHealth?.server ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Purchasing Service */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                                        <ShoppingCart className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-black text-slate-900 uppercase">Purchasing Service</div>
                                        <div className="text-[10px] font-bold text-slate-400">{systemHealth?.purchasing?.latency || '0ms'} latency</div>
                                    </div>
                                </div>
                                <StatusBadge status={systemHealth?.purchasing?.status || 'UNKNOWN'} text={systemHealth?.purchasing?.status || 'UNKNOWN'} />
                            </div>

                            {/* App Server */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                                        <Server className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-black text-slate-900 uppercase">App Server</div>
                                        <div className="text-[10px] font-bold text-slate-400">Uptime: {systemHealth ? Math.floor(systemHealth.server.uptime / 3600) : 0}h</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">RUNNING</div>
                                    <div className="text-[10px] font-bold text-slate-400 mt-1">CPU: {systemHealth?.server.cpu.load}%</div>
                                </div>
                            </div>

                            {/* Database */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                                        <Database className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-black text-slate-900 uppercase">PostgreSQL</div>
                                        <div className="text-[10px] font-bold text-slate-400">Master Data</div>
                                    </div>
                                </div>
                                <StatusBadge status={systemHealth?.database.status || 'UNKNOWN'} text={systemHealth?.database.status || 'UNKNOWN'} />
                            </div>

                            {/* Manpro */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                                        <Globe className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-black text-slate-900 uppercase">Manpro API</div>
                                        <div className="text-[10px] font-bold text-slate-400">{systemHealth?.manpro.latency} latency</div>
                                    </div>
                                </div>
                                <StatusBadge status={systemHealth?.manpro.status || 'UNKNOWN'} text={systemHealth?.manpro.status === 'CONNECTED' ? 'ONLINE' : 'OFFLINE'} />
                            </div>

                            {/* SOLR */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                                        <Search className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-black text-slate-900 uppercase">Apache SOLR</div>
                                        <div className="text-[10px] font-bold text-slate-400">{systemHealth?.solr.latency} latency</div>
                                    </div>
                                </div>
                                <StatusBadge status={systemHealth?.solr.status || 'UNKNOWN'} text={systemHealth?.solr.status || 'UNKNOWN'} />
                            </div>
                        </div>

                        {/* Active Users Footer */}
                        <div className="bg-slate-900 p-6 flex items-center justify-between">
                            <div className="flex items-center gap-3 text-white">
                                <Users className="w-5 h-5 text-blue-400" />
                                <div>
                                    <div className="text-xs font-black uppercase tracking-widest">Active Users</div>
                                    <div className="text-[10px] text-slate-400 font-bold">Last 15 minutes</div>
                                </div>
                            </div>
                            <div className="text-3xl font-black text-white tracking-tighter">
                                {systemHealth?.users.active || 0}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts Area */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-200 h-full">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2">
                                <Activity className="w-4 h-4 text-blue-500" /> Traffic Overview
                            </h3>
                            <div className="flex gap-2">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Requests</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Users</span>
                                </div>
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trafficData}>
                                    <defs>
                                        <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        labelStyle={{ color: '#64748b', fontWeight: 'bold', fontSize: '12px', marginBottom: '4px' }}
                                    />
                                    <Area type="monotone" dataKey="requests" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRequests)" />
                                    <Area type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status, text }: { status: string, text: string }) {
    let classes = "bg-slate-50 text-slate-500 border-slate-100";
    let Icon = AlertCircle;

    if (status === 'CONNECTED' || status === 'HEALTHY' || status === 'ONLINE') {
        classes = "bg-emerald-50 text-emerald-600 border-emerald-100";
        Icon = CheckCircle2;
    } else if (status === 'DISCONNECTED' || status === 'OFFLINE') {
        classes = "bg-red-50 text-red-600 border-red-100";
        Icon = XCircle;
    } else if (status === 'NOT_CONFIGURED') {
        classes = "bg-amber-50 text-amber-600 border-amber-100";
        Icon = AlertCircle;
    }

    return (
        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${classes}`}>
            <Icon className="w-3 h-3" />
            <span className="text-[10px] font-black uppercase tracking-wide">{text}</span>
        </div>
    );
}
