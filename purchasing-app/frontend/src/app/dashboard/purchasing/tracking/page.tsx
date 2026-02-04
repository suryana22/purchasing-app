'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Search, Package, Building, User, Calendar, AlertCircle, RefreshCcw } from 'lucide-react';
import Modal from '@/components/Modal';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/components/AuthProvider';

interface Department {
    id: number;
    name: string;
}

interface Partner {
    id: number;
    name: string;
}

interface Order {
    id: number;
    order_number: string;
    department_id: number;
    partner_id: number;
    createdAt?: string;
    date?: string;
    grand_total: number;
    status: string;
    manpro_url?: string;
}

export default function TrackingPage() {
    const { authenticatedFetch } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [departments, setDepartments] = useState<Department[]>([]);
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    // Tracking State
    const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
    const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
    const [trackingImageUrl, setTrackingImageUrl] = useState<string | null>(null);
    const [loadingTracking, setLoadingTracking] = useState(false);
    const [manproCreds, setManproCreds] = useState({ username: '', password: '' });

    const { toasts, removeToast, error, success } = useToast();

    const getApiUrl = (endpoint: string, type: 'master' | 'purchasing' | 'tracking' = 'purchasing') => {
        let base = '';
        let port = '4002'; // default purchasing

        if (type === 'master') {
            base = process.env.NEXT_PUBLIC_MASTER_DATA_API || '';
            port = '4001';
        } else if (type === 'tracking') {
            base = process.env.NEXT_PUBLIC_TRACKING_API || '';
            port = '4003';
        } else {
            base = process.env.NEXT_PUBLIC_PURCHASING_API || '';
            port = '4002';
        }

        if (typeof window !== 'undefined') {
            if (!base || base.includes('10.200.111.180')) {
                const host = window.location.hostname;
                base = `http://${host}:${port}`;
            }
        }

        if (!base) base = `http://localhost:${port}`;

        const normalizedBase = base.replace(/\/api\/?$/, '').replace(/\/$/, '');
        return `${normalizedBase}/api${endpoint}`;
    };

    const fetchData = async () => {
        try {
            const [deptRes, partsRes, ordersRes, settingsRes] = await Promise.all([
                authenticatedFetch(getApiUrl('/departments', 'master')),
                authenticatedFetch(getApiUrl('/partners', 'master')),
                authenticatedFetch(getApiUrl('/orders', 'purchasing')),
                authenticatedFetch(getApiUrl('/settings', 'master'))
            ]);

            if (deptRes.ok && partsRes.ok && ordersRes.ok) {
                const depts = await deptRes.json();
                const parts = await partsRes.json();
                const ordersData = await ordersRes.json();

                if (settingsRes.ok) {
                    const settingsData = await settingsRes.json();
                    const creds = { username: '', password: '' };
                    settingsData.forEach((s: any) => {
                        if (s.key === 'manpro_username') creds.username = s.value;
                        if (s.key === 'manpro_password') creds.password = s.value;
                    });
                    setManproCreds(creds);
                }

                setDepartments(depts);
                setPartners(parts);
                // Only show orders that have a Manpro URL (and are Approved/Pending)
                setOrders(ordersData.filter((o: Order) =>
                    (o.status === 'APPROVED' || o.status === 'PENDING') && o.manpro_url
                ));
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleTrackOrder = async (order: Order) => {
        setTrackingOrder(order);
        setIsTrackingModalOpen(true);
    };

    const filteredOrders = orders.filter(order =>
        order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        departments.find(d => d.id === order.department_id)?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        partners.find(p => p.id === order.partner_id)?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3">
                        <Search className="w-8 h-8 text-blue-600" />
                        Lacak Pesanan (Manpro)
                    </h1>
                    <p className="text-slate-500 font-bold uppercase text-xs tracking-widest mt-1">Monitoring status pengiriman barang secara real-time</p>
                </div>
            </div>

            {/* List Order Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari nomor order atau departemen..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100 italic">
                            Hanya menampilkan order yang disetujui / diproses
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Informasi Order</th>
                                <th className="px-6 py-4">Department</th>
                                <th className="px-6 py-4">Rekanan</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 italic">
                            {loadingData ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto opacity-20" />
                                    </td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <Package className="w-10 h-10 opacity-20" />
                                            <p className="text-sm font-medium">Tidak ada data pelacakan yang tersedia</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-black text-slate-900 uppercase tracking-tight leading-none mb-1">
                                                {order.order_number}
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(order.createdAt || order.date || new Date()).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase">
                                                <Building className="w-3.5 h-3.5 text-blue-400" />
                                                {departments.find(d => d.id === order.department_id)?.name || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase">
                                                <User className="w-3.5 h-3.5 text-emerald-400" />
                                                {partners.find(p => p.id === order.partner_id)?.name || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex px-2 py-1 text-[10px] font-black uppercase rounded-lg border 
                                                ${order.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}
                                            `}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleTrackOrder(order)}
                                                className="px-6 py-2 bg-blue-600 text-white font-black uppercase text-[10px] rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2 ml-auto w-fit"
                                            >
                                                <Search className="w-3.5 h-3.5" />
                                                Lacak Sekarang
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Tracking Modal */}
            <Modal
                isOpen={isTrackingModalOpen}
                onClose={() => setIsTrackingModalOpen(false)}
                title={`Status Tracking: ${trackingOrder?.order_number}`}
                size="lg"
            >
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 shadow-inner">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-white rounded-xl shadow-sm text-blue-600">
                                <RefreshCcw className="w-6 h-6 animate-pulse" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-black text-slate-800 text-lg">Arahkan ke Manpro System</h3>
                                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                    Anda akan diarahkan ke sistem Manpro untuk melihat status pengiriman secara detail.
                                    Jika sesi Anda habis, gunakan kredensial di bawah ini untuk login kembali.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border-2 border-slate-100 hover:border-blue-200 transition-all group">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 block">Username</label>
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-800 font-mono text-sm">{manproCreds.username || '-'}</span>
                                <button
                                    onClick={() => { navigator.clipboard.writeText(manproCreds.username); success('Username disalin'); }}
                                    className="text-blue-500 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Salin Username"
                                >
                                    <RefreshCcw className="w-4 h-4 rotate-90" />
                                </button>
                            </div>
                        </div>
                        <div className="p-4 rounded-xl border-2 border-slate-100 hover:border-blue-200 transition-all group">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 block">Password</label>
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-800 font-mono text-sm">{'•'.repeat(manproCreds.password.length) || '-'}</span>
                                <button
                                    onClick={() => { navigator.clipboard.writeText(manproCreds.password); success('Password disalin'); }}
                                    className="text-blue-500 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Salin Password"
                                >
                                    <RefreshCcw className="w-4 h-4 rotate-90" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                        {trackingOrder?.manpro_url && (
                            <a
                                href={trackingOrder.manpro_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-8 py-4 bg-blue-600 text-white font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-3"
                                onClick={() => setIsTrackingModalOpen(false)}
                            >
                                <Search className="w-5 h-5" />
                                Buka Link Tracking
                            </a>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Toast Notifications */}
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </div>
    );
}

