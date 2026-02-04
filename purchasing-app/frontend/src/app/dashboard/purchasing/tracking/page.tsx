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

    const { toasts, removeToast, error } = useToast();

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
            const [deptRes, partsRes, ordersRes] = await Promise.all([
                authenticatedFetch(getApiUrl('/departments', 'master')),
                authenticatedFetch(getApiUrl('/partners', 'master')),
                authenticatedFetch(getApiUrl('/orders', 'purchasing'))
            ]);

            if (deptRes.ok && partsRes.ok && ordersRes.ok) {
                const depts = await deptRes.json();
                const parts = await partsRes.json();
                const ordersData = await ordersRes.json();

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
        setLoadingTracking(true);
        setTrackingImageUrl(null);

        try {
            const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_TRACKING_API || 'http://localhost:4003'}/api/track/${order.order_number}`);
            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                setTrackingImageUrl(url);
            } else {
                throw new Error('Gagal mengambil tracking. Pastikan kredensial Manpro di server sudah benar.');
            }
        } catch (err: any) {
            error(err.message || 'Terjadi kesalahan saat melacak pesanan');
            setIsTrackingModalOpen(false);
        } finally {
            setLoadingTracking(false);
        }
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
                                            <a
                                                href={order.manpro_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-6 py-2 bg-blue-600 text-white font-black uppercase text-[10px] rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2 ml-auto w-fit"
                                            >
                                                <Search className="w-3.5 h-3.5" />
                                                Lacak Sekarang
                                            </a>
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
                size="xl"
            >
                <div className="space-y-4">
                    <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl relative min-h-[500px] flex items-center justify-center border-4 border-slate-800">
                        {loadingTracking ? (
                            <div className="flex flex-col items-center gap-4 text-white">
                                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                                <div className="space-y-1 text-center">
                                    <p className="font-black uppercase tracking-widest text-sm">Menghubungi Manpro...</p>
                                    <p className="text-xs text-slate-400 font-medium font-mono">ESTABLISHING SECURE CONNECTION</p>
                                </div>
                            </div>
                        ) : trackingImageUrl ? (
                            <img
                                src={trackingImageUrl}
                                alt="Manpro Tracking Screenshot"
                                className="w-full h-auto object-contain animate-in fade-in zoom-in duration-500"
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-3 text-slate-500">
                                <AlertCircle className="w-12 h-12" />
                                <p className="font-bold">Gagal memuat status tracking</p>
                            </div>
                        )}

                        {loadingTracking && (
                            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
                        )}
                    </div>

                    <div className="flex justify-between items-center bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                                <RefreshCcw className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Sistem Integrasi Luar</p>
                                <p className="text-sm font-bold text-slate-700 leading-tight">Data diambil secara real-time dari sistem pihak ketiga (Manpro).</p>
                            </div>
                        </div>
                        <button
                            onClick={() => trackingOrder && handleTrackOrder(trackingOrder)}
                            className="px-6 py-3 bg-white text-blue-600 border-2 border-blue-200 rounded-xl text-xs font-black uppercase tracking-tight hover:bg-blue-600 hover:text-white transition-all shadow-md group"
                        >
                            <RefreshCcw className="w-3.5 h-3.5 inline mr-2 group-hover:animate-spin" /> Segarkan Data
                        </button>
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

