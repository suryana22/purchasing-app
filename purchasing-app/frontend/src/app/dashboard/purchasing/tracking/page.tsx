'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Search, Package, Building, User, Calendar, AlertCircle, RefreshCcw, CheckCircle2, ArrowRight, ExternalLink, XCircle } from 'lucide-react';
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
    manpro_current_position?: string;
    manpro_is_closed?: boolean;
    manpro_manual_status?: string;
    manpro_post_approval_url?: string;
    manpro_post_is_closed?: boolean;
}

export default function TrackingPage() {
    const { authenticatedFetch, hasPermission, user } = useAuth();
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
    const [postApprovalUrl, setPostApprovalUrl] = useState('');
    const [manproCreds, setManproCreds] = useState({ username: '', password: '' });

    // Update Status State
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedPosition, setSelectedPosition] = useState('');
    const [isClosed, setIsClosed] = useState(false);
    const [newUrl, setNewUrl] = useState('');
    const [updating, setUpdating] = useState(false);

    // Auth for admin check

    const { toasts, removeToast, error, success } = useToast();

    const getApiUrl = (endpoint: string, type: 'master' | 'purchasing' | 'tracking' = 'purchasing') => {
        // Use relative paths to trigger Next.js rewrites/proxy
        // This solves the IP vs Domain access issue
        let prefix = '/api/purchasing';
        if (type === 'master') prefix = '/api/master-data';
        if (type === 'tracking') prefix = '/api/tracking';

        const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        return `${prefix}${normalizedEndpoint}`;
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
                // Only show orders that have a Manpro URL
                setOrders(ordersData.filter((o: Order) => !!o.manpro_url));
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
        setPostApprovalUrl(order.manpro_post_approval_url || '');
        setIsTrackingModalOpen(true);
    };

    const handleAutoTrack = async (order: Order | null) => {
        if (!order) return;
        setLoadingTracking(true);
        try {
            const url = getApiUrl(`/orders/${order.id}/track`);
            const response = await authenticatedFetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    manpro_url: order.manpro_url,
                    username: manproCreds.username,
                    password: manproCreds.password
                })
            });

            if (response.ok) {
                const data = await response.json();
                success('Status tracking berhasil diperbarui otomatis');
                // Update local state and list
                const updatedOrder = { ...order, ...data };
                setTrackingOrder(updatedOrder);
                setOrders(prev => prev.map(o => o.id === order.id ? updatedOrder : o));
            } else {
                const errData = await response.json();
                error(errData.error || 'Gagal melacak otomatis');
            }
        } catch (err) {
            console.error(err);
            error('Terjadi kesalahan koneksi saat tracking otomatis');
        } finally {
            setLoadingTracking(false);
        }
    };

    const handleUpdatePostApprovalUrl = async () => {
        if (!trackingOrder) return;
        try {
            const url = getApiUrl(`/orders/${trackingOrder.id}`, 'purchasing');
            const response = await authenticatedFetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    manpro_post_approval_url: postApprovalUrl
                })
            });

            if (response.ok) {
                const data = await response.json();
                success('Link proses lanjutan berhasil diperbarui');
                const updatedOrder = { ...trackingOrder, ...data };
                setTrackingOrder(updatedOrder);
                setOrders(prev => prev.map(o => o.id === trackingOrder.id ? updatedOrder : o));
            } else {
                error('Gagal memperbarui link');
            }
        } catch (err) {
            console.error(err);
            error('Terjadi kesalahan koneksi');
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
                            Hanya menampilkan order yang memiliki link manpro
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
                    {/* Status Display */}
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                                <Package className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800 text-lg uppercase">Status Dokumen</h3>
                                <p className="text-xs font-bold text-slate-500">Posisi dokumen berdasarkan pantauan Manpro</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Posisi Saat Ini</span>
                                <span className="font-black text-slate-800">{trackingOrder?.manpro_current_position || '-'}</span>
                            </div>

                            {/* Step 1: Director Approval */}
                            {trackingOrder?.manpro_manual_status === 'CANCELLED' ? (
                                <div className="p-4 rounded-xl border-l-4 bg-red-50 border-red-500 text-red-700">
                                    <h4 className="font-black uppercase tracking-tight mb-1 flex items-center gap-2">
                                        <XCircle className="w-4 h-4" /> Dokumen Dibatalkan (Canceled)
                                    </h4>
                                    <p className="text-xs font-medium opacity-80 whitespace-pre-wrap">
                                        {trackingOrder.manpro_current_position ? trackingOrder.manpro_current_position.replace('Canceled by Manpro: ', '') : 'Dokumen telah dibatalkan di Manpro.'}
                                    </p>
                                </div>
                            ) : (
                                <div className={`p-4 rounded-xl border-l-4 ${trackingOrder?.manpro_manual_status === 'APPROVED_DIRECTOR'
                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                                    : 'bg-amber-50 border-amber-500 text-amber-700'
                                    }`}>
                                    <h4 className="font-black uppercase tracking-tight mb-1 flex items-center gap-2">
                                        {trackingOrder?.manpro_manual_status === 'APPROVED_DIRECTOR'
                                            ? <><CheckCircle2 className="w-4 h-4" /> Disetujui Direktur Utama</>
                                            : <><Loader2 className="w-4 h-4 animate-spin" /> Menunggu Persetujuan Direktur Utama</>
                                        }
                                    </h4>
                                    <p className="text-xs font-medium opacity-80">
                                        {trackingOrder?.manpro_manual_status === 'APPROVED_DIRECTOR'
                                            ? 'Dokumen telah disetujui (Closed) dan tuntas diproses oleh Direktur.'
                                            : 'Dokumen sedang dalam proses review/tanda tangan di Manpro.'
                                        }
                                    </p>
                                </div>
                            )}

                            {/* Step 2: PO Rumga Process (Conditional) - Hide if Canceled */}
                            {trackingOrder?.manpro_manual_status === 'APPROVED_DIRECTOR' && (
                                <div className={`p-4 rounded-xl border-l-4 ${trackingOrder?.manpro_post_is_closed
                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                                    : 'bg-amber-50 border-amber-500 text-amber-700'
                                    }`}>
                                    <h4 className="font-black uppercase tracking-tight mb-1 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            {trackingOrder?.manpro_post_is_closed
                                                ? <><CheckCircle2 className="w-4 h-4" /> Proses PO Rumga (Selesai)</>
                                                : <><Loader2 className="w-4 h-4 animate-spin" /> Proses PO Rumga (In Progress/Link Ready)</>
                                            }
                                        </div>
                                        {trackingOrder?.manpro_post_approval_url && (
                                            <a
                                                href={trackingOrder.manpro_post_approval_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="bg-emerald-600 text-white p-1.5 rounded-lg hover:bg-emerald-700 transition-colors"
                                                title="Buka Link Manpro"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                        )}
                                    </h4>

                                    <div className="mt-3 space-y-3">
                                        {/* Removed redundant read-only URL display */}

                                        {/* Admin Input for new URL - Restricted to Approvers/Admins */}
                                        {hasPermission('orders.approve') && (
                                            <div className="pt-2 border-t border-blue-100/30">
                                                <label className="text-[10px] font-black uppercase mb-1 block opacity-70">
                                                    {trackingOrder?.manpro_post_approval_url ? 'Update Link Proses PO Rumga' : 'Input Link Proses PO Rumga'}
                                                </label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={postApprovalUrl}
                                                        onChange={(e) => setPostApprovalUrl(e.target.value)}
                                                        placeholder="Tempel link Manpro baru di sini..."
                                                        className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                    <button
                                                        onClick={handleUpdatePostApprovalUrl}
                                                        className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase rounded-lg hover:bg-blue-700 transition-all"
                                                    >
                                                        Simpan
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Admin Update Button - Restricted to Approvers/Admins */}
                        {hasPermission('orders.approve') && (
                            <div className="mt-4 pt-4 border-t border-slate-200">
                                <button
                                    onClick={() => handleAutoTrack(trackingOrder)}
                                    disabled={loadingTracking}
                                    className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                                >
                                    {loadingTracking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                                    {loadingTracking ? 'Sedang Melacak...' : 'Update Status Tracking (Automated)'}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                        <button
                            onClick={() => setIsTrackingModalOpen(false)}
                            className="px-6 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                        >
                            Tutup
                        </button>
                        {/* Buka Link Tracking button removed as per request */}
                    </div>
                </div>
            </Modal>

            {/* Toast Notifications */}
            {
                toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => removeToast(toast.id)}
                    />
                ))
            }
        </div>
    );
}

