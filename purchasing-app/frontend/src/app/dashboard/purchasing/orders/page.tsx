'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Trash2, Loader2, Edit, Eye, Search, X, Printer, Package, Building, User, Calendar, FileText, AlertCircle, Calculator, CheckCircle, XCircle, ClipboardList, PenTool } from 'lucide-react';
import Modal from '@/components/Modal';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/components/AuthProvider';

interface Department {
    id: number;
    name: string;
    company_id: number;
}

interface Company {
    id: number;
    company_name: string;
    company_logo: string;
    direktur_utama?: string;
    company_code?: string;
}

interface Partner {
    id: number;
    name: string;
    address?: string;
    contact_person?: string;
    phone?: string;
    item_type?: {
        prefix: string;
    };
}

interface MasterItem {
    code: string;
    name: string;
    price: number;
    description: string;
}

interface OrderItem {
    item_name: string;
    description: string;
    procurement_year: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    code: string;
    spec_description?: string;
    item_type_id?: number;
}

interface Order {
    id: number;
    order_number: string;
    department_id: number;
    partner_id: number;
    order_date?: string;
    date?: string;
    createdAt?: string;
    subtotal: number;
    ppn: number;
    grand_total: number;
    status: string;
    notes?: string;
    OrderItems?: OrderItem[];
    Analysis?: any;
}

export default function OrdersPage() {
    const { user, authenticatedFetch, hasPermission } = useAuth();
    const searchParams = useSearchParams();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'view' | 'edit' | 'special'>('create');
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [isItemPickerOpen, setIsItemPickerOpen] = useState(false);
    const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
    const [isSpecialInputOpen, setIsSpecialInputOpen] = useState(false);
    const [tempSpecialItem, setTempSpecialItem] = useState<{ name: string; spec: string; price: number; type_id: string | number }>({ name: '', spec: '', price: 0, type_id: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const [listSearchQuery, setListSearchQuery] = useState('');

    const [items, setItems] = useState<OrderItem[]>([
        { item_name: '', description: '', procurement_year: '', quantity: 1, unit_price: 0, total_price: 0, code: '', spec_description: '', item_type_id: undefined }
    ]);
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedPartner, setSelectedPartner] = useState('');
    const [notes, setNotes] = useState('');

    const [departments, setDepartments] = useState<Department[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [partners, setPartners] = useState<Partner[]>([]);
    const [masterItems, setMasterItems] = useState<MasterItem[]>([]);
    const [itemTypes, setItemTypes] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    // Analysis Modal State
    const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
    const [selectedOrderForAnalysis, setSelectedOrderForAnalysis] = useState<Order | null>(null);
    const [analysisForm, setAnalysisForm] = useState({
        analysis_type: 'Analisa Kerusakan',
        details: [{
            requester_name: '',
            analysis: '',
            description: '',
            is_replacement: false,
            asset_purchase_year: '',
            remaining_book_value: '',
            asset_document: ''
        }],
    });

    const addAnalysisRow = () => {
        setAnalysisForm({
            ...analysisForm,
            details: [...analysisForm.details, {
                requester_name: '',
                analysis: '',
                description: '',
                is_replacement: false,
                asset_purchase_year: '',
                remaining_book_value: '',
                asset_document: ''
            }]
        });
    };

    const removeAnalysisRow = (index: number) => {
        if (analysisForm.details.length === 1) return;
        const newDetails = analysisForm.details.filter((_, i) => i !== index);
        setAnalysisForm({ ...analysisForm, details: newDetails });
    };

    const updateAnalysisRow = (index: number, field: string, value: any) => {
        const newDetails = analysisForm.details.map((row, i) => {
            if (i === index) {
                return { ...row, [field]: value };
            }
            return row;
        });
        setAnalysisForm({ ...analysisForm, details: newDetails });
    };
    const [savingAnalysis, setSavingAnalysis] = useState(false);

    // Print Options State
    const [isPrintOptionsOpen, setIsPrintOptionsOpen] = useState(false);
    const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<Order | null>(null);
    const [printType, setPrintType] = useState<'request' | 'approval' | 'analysis'>('request');
    const [hoveredOrder, setHoveredOrder] = useState<Order | null>(null);
    const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

    // Tracking State
    const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
    const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
    const [trackingImageUrl, setTrackingImageUrl] = useState<string | null>(null);
    const [loadingTracking, setLoadingTracking] = useState(false);

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

    const { toasts, removeToast, success, error } = useToast();

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const [deptRes, partsRes, itemsRes, ordersRes, itemTypesRes] = await Promise.all([
                authenticatedFetch(`${process.env.NEXT_PUBLIC_MASTER_DATA_API || 'http://localhost:4001'}/api/departments`),
                authenticatedFetch(`${process.env.NEXT_PUBLIC_MASTER_DATA_API || 'http://localhost:4001'}/api/partners`),
                authenticatedFetch(`${process.env.NEXT_PUBLIC_MASTER_DATA_API || 'http://localhost:4001'}/api/items`),
                authenticatedFetch(`${process.env.NEXT_PUBLIC_PURCHASING_API || 'http://localhost:4002'}/api/orders`),
                authenticatedFetch(`${process.env.NEXT_PUBLIC_MASTER_DATA_API || 'http://localhost:4001'}/api/item-types`)
            ]);

            if (!deptRes.ok || !partsRes.ok || !itemsRes.ok || !ordersRes.ok || !itemTypesRes.ok) {
                const failed = [];
                if (!deptRes.ok) failed.push('Departments');
                if (!partsRes.ok) failed.push('Partners');
                if (!itemsRes.ok) failed.push('Items');
                if (!ordersRes.ok) failed.push('Orders');
                if (!itemTypesRes.ok) failed.push('Item Types');
                throw new Error('Gagal memuat: ' + failed.join(', '));
            }

            const [depts, parts, mItems, ordersData, types] = await Promise.all([
                deptRes.json(),
                partsRes.json(),
                itemsRes.json(),
                ordersRes.json(),
                itemTypesRes.json()
            ]);

            setDepartments(depts);
            setPartners(parts);
            setMasterItems(mItems);
            setOrders(ordersData);
            setItemTypes(types);

            // Fetch Companies
            const compRes = await authenticatedFetch(`${process.env.NEXT_PUBLIC_MASTER_DATA_API || 'http://localhost:4001'}/api/companies`);
            if (compRes.ok) {
                const compData = await compRes.json();
                setCompanies(compData);
            } else {
                console.warn('Gagal memuat data perusahaan');
            }
        } catch (err: any) {
            console.error('Error fetching data:', err);
            error('Gagal mengambil data: ' + (err.message || 'Terjadi kesalahan pada server'));
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Check for review param from URL (e.g. from notification navigation)
        const reviewId = searchParams.get('review');
        if (reviewId) {
            window.setTimeout(() => {
                const targetOrder = orders.find(o => o.id === parseInt(reviewId));
                if (targetOrder) {
                    handleViewOrder(targetOrder);
                }
            }, 800);
        }

        // Listen for notification clicks (inline events)
        const handleOpenReview = (e: any) => {
            const { orderId } = e.detail;
            const targetOrder = orders.find(o => o.id === orderId);
            if (targetOrder) {
                handleViewOrder(targetOrder);
            }
        };

        window.addEventListener('open-order-review', handleOpenReview);
        return () => window.removeEventListener('open-order-review', handleOpenReview);
    }, [orders.length, searchParams]);
    const addItem = () => {
        setItems([...items, { item_name: '', description: '', procurement_year: '', quantity: 1, unit_price: 0, total_price: 0, code: '', spec_description: '' }]);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        const item = { ...newItems[index], [field]: value };

        // Auto-calculate total price
        if (field === 'quantity' || field === 'unit_price') {
            const qty = field === 'quantity' ? Number(value) : item.quantity;
            const price = field === 'unit_price' ? Number(value) : item.unit_price;
            item.total_price = qty * price;
        }

        newItems[index] = item;
        setItems(newItems);
    };

    const handleOpenItemPicker = (index: number) => {
        setActiveItemIndex(index);
        setSearchQuery('');
        setIsItemPickerOpen(true);
    };

    const handleSelectItem = (masterItem: MasterItem) => {
        if (activeItemIndex !== null) {
            const newItems = [...items];
            const currentItem = newItems[activeItemIndex];

            newItems[activeItemIndex] = {
                ...currentItem,
                item_name: masterItem.name,
                code: masterItem.code,
                unit_price: masterItem.price,
                total_price: currentItem.quantity * masterItem.price
            };

            setItems(newItems);
            setIsItemPickerOpen(false);
            setActiveItemIndex(null);
        }
    };

    const handleOpenSpecialInput = (index: number) => {
        setActiveItemIndex(index);
        const item = items[index];
        setTempSpecialItem({
            name: item.item_name || '',
            spec: item.spec_description || '',
            price: item.unit_price || 0,
            type_id: item.item_type_id || ''
        });
        setIsSpecialInputOpen(true);
    };

    const handleSaveSpecialInput = () => {
        if (activeItemIndex !== null) {
            const newItems = [...items];
            const currentItem = newItems[activeItemIndex];
            const qty = currentItem.quantity;
            const price = tempSpecialItem.price;

            // Generate code if missing or if special mode
            let itemCode = currentItem.code;
            if (!itemCode || modalMode === 'special') {
                const type = itemTypes.find(t => t.id.toString() === tempSpecialItem.type_id.toString());
                const prefix = type?.prefix || 'BRG';
                const now = new Date();
                const suffix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
                itemCode = `${prefix}-${suffix}`;
            }

            newItems[activeItemIndex] = {
                ...currentItem,
                item_name: tempSpecialItem.name,
                spec_description: tempSpecialItem.spec,
                unit_price: price,
                total_price: qty * price,
                code: itemCode,
                item_type_id: Number(tempSpecialItem.type_id)
            };

            setItems(newItems);
            setIsSpecialInputOpen(false);
            setActiveItemIndex(null);
        }
    };

    // Perhitungan sesuai ketentuan
    const calculateSubtotal = () => {
        return items.reduce((sum, item) => sum + item.total_price, 0);
    };

    const calculatePPN = () => {
        const subtotal = calculateSubtotal();
        return subtotal * 0.11; // PPN 11%
    };

    const calculateGrandTotal = () => {
        const subtotal = calculateSubtotal();
        const ppn = calculatePPN();
        return subtotal + ppn;
    };

    const handleOpenModal = () => {
        setModalMode('create');
        setSelectedOrderId(null);
        setItems([{ item_name: '', description: '', procurement_year: '', quantity: 1, unit_price: 0, total_price: 0, code: '', spec_description: '' }]);
        setSelectedDepartment('');
        setSelectedPartner('');
        setNotes('');
        setIsModalOpen(true);
    };

    const handleOpenSpecialModal = () => {
        setModalMode('special');
        setSelectedOrderId(null);
        setItems([{ item_name: '', description: '', procurement_year: '', quantity: 1, unit_price: 0, total_price: 0, code: '', spec_description: '' }]);
        setSelectedDepartment('');
        setSelectedPartner('');
        setNotes('');
        setIsModalOpen(true);
    };

    const handleViewOrder = (order: Order) => {
        setModalMode('view');
        setSelectedOrderId(order.id);
        if (order.OrderItems) {
            setItems(order.OrderItems.map(item => ({
                ...item,
                unit_price: Number(item.unit_price),
                total_price: Number(item.total_price)
            })));
        }
        setSelectedDepartment(order.department_id.toString());
        setSelectedPartner(order.partner_id ? order.partner_id.toString() : '');
        setNotes(order.notes || '');
        setIsModalOpen(true);
    };

    const handleEditOrder = (order: Order) => {
        // Prevent editing non-draft orders, unless administrator
        if (order.status !== 'DRAFT' && user?.role?.toLowerCase() !== 'administrator') {
            alert('Tidak dapat mengubah order yang sudah disetujui!');
            return;
        }

        setModalMode('edit');
        setSelectedOrderId(order.id);
        if (order.OrderItems) {
            setItems(order.OrderItems.map(item => ({
                ...item,
                unit_price: Number(item.unit_price),
                total_price: Number(item.total_price)
            })));
        }
        setSelectedDepartment(order.department_id.toString());
        setSelectedPartner(order.partner_id ? order.partner_id.toString() : '');
        setNotes(order.notes || '');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedOrderId(null);
    };

    const handleDeleteOrder = async (id: number) => {
        if (!confirm('Apakah Anda yakin ingin menghapus pemesanan ini?')) return;
        try {
            const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_PURCHASING_API || 'http://localhost:4002'}/api/orders/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                success('Pemesanan berhasil dihapus');
                fetchData();
            } else {
                error('Gagal menghapus pemesanan');
            }
        } catch (err) {
            error('Terjadi kesalahan koneksi');
        }
    };

    const handleOpenAnalysisModal = (order: Order) => {
        setSelectedOrderForAnalysis(order);
        if (order.Analysis) {
            setAnalysisForm({
                analysis_type: order.Analysis.analysis_type || 'Analisa Kerusakan',
                details: order.Analysis.details && order.Analysis.details.length > 0
                    ? order.Analysis.details
                    : [{
                        requester_name: order.Analysis.requester_name || '',
                        analysis: order.Analysis.analysis || '',
                        description: order.Analysis.description || '',
                        is_replacement: order.Analysis.is_replacement || false,
                        asset_purchase_year: order.Analysis.asset_purchase_year || '',
                        remaining_book_value: order.Analysis.remaining_book_value?.toString() || '',
                        asset_document: order.Analysis.asset_document || ''
                    }],
            });
        } else {
            setAnalysisForm({
                analysis_type: 'Analisa Kerusakan',
                details: [{
                    requester_name: '',
                    analysis: '',
                    description: '',
                    is_replacement: false,
                    asset_purchase_year: '',
                    remaining_book_value: '',
                    asset_document: ''
                }],
            });
        }
        setIsAnalysisModalOpen(true);
    };

    const handleSubmitAnalysis = async () => {
        if (!selectedOrderForAnalysis) return;

        // Validate rows
        const hasValidRow = analysisForm.details.some(row => row.requester_name && row.analysis);
        if (!hasValidRow) {
            error('Harap isi setidaknya satu baris analisa lengkap (Nama & Analisa)');
            return;
        }

        setSavingAnalysis(true);
        try {
            const payload = {
                order_id: selectedOrderForAnalysis.id,
                department_id: selectedOrderForAnalysis.department_id,
                analysis_type: analysisForm.analysis_type,
                details: analysisForm.details,
                // Legacy fields for DB compatibility (using first row)
                analysis: analysisForm.details[0].analysis,
                description: analysisForm.details[0].description,
                requester_name: analysisForm.details[0].requester_name,
                is_replacement: analysisForm.details.some(d => d.is_replacement),
                remaining_book_value: analysisForm.details[0].remaining_book_value ? parseFloat(analysisForm.details[0].remaining_book_value) : null,
                asset_purchase_year: analysisForm.details[0].asset_purchase_year,
                asset_document: analysisForm.details[0].asset_document
            };

            const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_PURCHASING_API || 'http://localhost:4002'}/api/order-analyses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                success('Analisa permintaan berhasil disimpan');
                setIsAnalysisModalOpen(false);
                fetchData();
            } else {
                const data = await response.json();
                error('Gagal menyimpan analisa: ' + (data.error || 'Terjadi kesalahan'));
            }
        } catch (err) {
            error('Terjadi kesalahan koneksi');
        } finally {
            setSavingAnalysis(false);
        }
    };

    const handleOpenPrintOptions = (order: Order) => {
        setSelectedOrderForPrint(order);
        setSelectedOrderId(order.id);
        // Set context for print view even if modal is not 'view' mode
        if (order.OrderItems) {
            setItems(order.OrderItems.map(item => ({
                ...item,
                unit_price: Number(item.unit_price),
                total_price: Number(item.total_price)
            })));
        }
        setSelectedDepartment(order.department_id.toString());
        setSelectedPartner(order.partner_id ? order.partner_id.toString() : '');
        setNotes(order.notes || '');
        setIsPrintOptionsOpen(true);
    };

    const handlePrint = (type: 'request' | 'approval' | 'analysis') => {
        setPrintType(type);
        // Wait for state to update and re-render then print
        setTimeout(() => {
            window.print();
            setIsPrintOptionsOpen(false);
        }, 300);
    };

    const handleUpdateStatus = async (id: number, status: string) => {
        const confirmMsg = status === 'APPROVED' ? 'menyetujui' : status === 'REJECTED' ? 'menolak' : 'menunda';
        if (!confirm(`Apakah Anda yakin ingin ${confirmMsg} pemesanan ini?`)) return;
        try {
            const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_PURCHASING_API || 'http://localhost:4002'}/api/orders/${id}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (response.ok) {
                success(`Pemesanan berhasil ${status === 'APPROVED' ? 'disetujui' : status === 'REJECTED' ? 'ditolak' : 'ditunda (Pending)'}`);
                fetchData();
                setIsModalOpen(false);
            } else {
                const data = await response.json();
                error('Gagal memproses: ' + data.error);
            }
        } catch (err) {
            error('Terjadi kesalahan koneksi');
        }
    };

    const handleSubmitOrder = async () => {
        if (!selectedDepartment) {
            error('Harap pilih departemen');
            return;
        }

        try {
            const orderData = {
                department_id: parseInt(selectedDepartment),
                partner_id: selectedPartner ? parseInt(selectedPartner) : null,
                notes: notes,
                subtotal: calculateSubtotal(),
                ppn: calculatePPN(),
                grand_total: calculateGrandTotal(),
                items: items.map(item => ({
                    item_name: item.item_name,
                    code: item.code,
                    description: item.description,
                    spec_description: item.spec_description,
                    procurement_year: item.procurement_year,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    total_price: item.total_price
                }))
            };

            const url = modalMode === 'edit' && selectedOrderId
                ? `${process.env.NEXT_PUBLIC_PURCHASING_API || 'http://localhost:4002'}/api/orders/${selectedOrderId}`
                : `${process.env.NEXT_PUBLIC_PURCHASING_API || 'http://localhost:4002'}/api/orders`;

            const method = modalMode === 'edit' ? 'PUT' : 'POST';

            // If special mode, save items to special-items table
            if (modalMode === 'special') {
                for (const item of items) {
                    try {
                        await authenticatedFetch(`${process.env.NEXT_PUBLIC_MASTER_DATA_API || 'http://localhost:4001'}/api/special-items`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                name: item.item_name,
                                code: item.code,
                                price: item.unit_price,
                                description: item.spec_description || '-'
                            })
                        });
                    } catch (e) {
                        console.error('Gagal simpan ke master khusus:', e);
                    }
                }
            }

            const response = await authenticatedFetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData)
            });

            if (response.ok) {
                const result = await response.json();
                fetchData(); // Refresh list
                setIsModalOpen(false);
                success(modalMode === 'edit' ? 'Pemesanan berhasil diperbarui!' : 'Pemesanan berhasil disimpan!');
            } else {
                const errorData = await response.json();
                error('Gagal memproses pemesanan: ' + errorData.error);
            }
        } catch (err) {
            console.error('Error processing order:', err);
            error('Terjadi kesalahan saat memproses pemesanan');
        }
    };

    const filteredMasterItems = masterItems.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredOrders = orders.filter(o =>
        o.order_number.toLowerCase().includes(listSearchQuery.toLowerCase()) ||
        departments.find(d => d.id === o.department_id)?.name.toLowerCase().includes(listSearchQuery.toLowerCase()) ||
        partners.find(p => p.id === o.partner_id)?.name.toLowerCase().includes(listSearchQuery.toLowerCase())
    );

    if (loadingData) {
        return (
            <div className="flex flex-col justify-center items-center h-96 text-slate-500 gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                <span className="font-bold uppercase tracking-widest text-xs">Mempersiapkan Data Pengadaan...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pemesanan Barang (PO)</h1>
                    <p className="text-slate-500 text-sm mt-1">Kelola siklus pengadaan barang dari pengajuan hingga realisasi.</p>
                </div>
                <div className="flex gap-2">
                    {hasPermission('orders.special') && (
                        <button
                            onClick={handleOpenSpecialModal}
                            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white font-bold rounded-xl shadow-lg hover:bg-slate-900 transition-all active:scale-95"
                        >
                            <FileText className="w-5 h-5" /> Pesanan Khusus
                        </button>
                    )}
                    {hasPermission('orders.create') && (
                        <button
                            onClick={handleOpenModal}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
                        >
                            <Plus className="w-5 h-5" /> Tambah Pemesanan
                        </button>
                    )}
                </div>
            </div>

            {/* Orders List Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-50 flex items-center gap-4 bg-slate-50/30">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari No. Order, Dept, atau Rekanan..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-900 outline-none transition-all"
                            value={listSearchQuery}
                            onChange={(e) => setListSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Informasi Order</th>
                                <th className="px-6 py-4">Department & Site</th>
                                <th className="px-6 py-4">Rekanan (Partner)</th>
                                <th className="px-6 py-4 text-right">Valuasi (IDR)</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 italic">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <Package className="w-10 h-10 opacity-20" />
                                            <p className="text-sm font-medium">Belum ada data pemesanan ditemukan</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div
                                                className="font-black text-slate-900 uppercase tracking-tight leading-none mb-1 cursor-help hover:text-blue-600 transition-colors inline-block"
                                                onMouseEnter={(e) => {
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    setHoverPosition({ x: rect.right + 10, y: rect.top });
                                                    setHoveredOrder(order);
                                                }}
                                                onMouseLeave={() => setHoveredOrder(null)}
                                            >
                                                {order.order_number}
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(order.createdAt || order.date || order.order_date || new Date()).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
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
                                                {order.partner_id ? partners.find(p => p.id === order.partner_id)?.name || '-' : '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="text-sm font-black text-slate-900 tracking-tighter">Rp {(Number(order.grand_total) || 0).toLocaleString()}</div>
                                            <div className="text-[10px] text-slate-400 font-medium">Exc. PPN: Rp {(Number(order.subtotal) || 0).toLocaleString()}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex px-2 py-1 text-[10px] font-black uppercase rounded-lg border 
                                                ${order.status === 'DRAFT' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                    order.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                        order.status === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-100' :
                                                            order.status === 'PENDING' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-600 border-slate-100'}
                                            `}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1.5 text-[0]">
                                                {/* Tracking Button */}
                                                {(order.status === 'APPROVED' || order.status === 'PENDING') && (
                                                    <button
                                                        onClick={() => handleTrackOrder(order)}
                                                        className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 transition-all border border-blue-100/50"
                                                        title="Lacak Pesanan (Manpro)"
                                                    >
                                                        <Search className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => order.status === 'APPROVED' ? handleOpenPrintOptions(order) : handleViewOrder(order)}
                                                    className={`p-2 rounded-lg transition-all ${order.status === 'APPROVED' ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
                                                    title={order.status === 'APPROVED' ? "Cetak Dokumen" : "Pratinjau"}
                                                >
                                                    {order.status === 'APPROVED' ? <Printer className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                                {order.status === 'APPROVED' && hasPermission('orders.analysis') && (
                                                    <button
                                                        onClick={() => handleOpenAnalysisModal(order)}
                                                        className={`p-2 rounded-lg transition-all ${order.Analysis ? 'text-emerald-600 bg-emerald-50 shadow-sm' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                                                        title={order.Analysis ? "Ubah Analisa Permintaan" : "Tambah Analisa Permintaan"}
                                                    >
                                                        <ClipboardList className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => (order.status === 'DRAFT' || user?.role?.toLowerCase() === 'administrator') && handleEditOrder(order)}
                                                    disabled={order.status !== 'DRAFT' && user?.role?.toLowerCase() !== 'administrator'}
                                                    className={`p-2 rounded-lg transition-all ${order.status === 'DRAFT' || user?.role?.toLowerCase() === 'administrator'
                                                        ? 'text-slate-400 hover:text-orange-600 hover:bg-orange-50 cursor-pointer'
                                                        : 'text-slate-200 cursor-not-allowed opacity-40 pointer-events-none'
                                                        }`}
                                                    title={order.status === 'DRAFT' || user?.role?.toLowerCase() === 'administrator' ? "Ubah" : "Tidak dapat diubah (Sudah Disetujui)"}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => (order.status === 'DRAFT' || user?.role?.toLowerCase() === 'administrator') && handleDeleteOrder(order.id)}
                                                    disabled={order.status !== 'DRAFT' && user?.role?.toLowerCase() !== 'administrator'}
                                                    className={`p-2 rounded-lg transition-all ${order.status === 'DRAFT' || user?.role?.toLowerCase() === 'administrator'
                                                        ? 'text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer'
                                                        : 'text-slate-200 cursor-not-allowed opacity-40 pointer-events-none'
                                                        }`}
                                                    title={order.status === 'DRAFT' || user?.role?.toLowerCase() === 'administrator' ? "Hapus" : "Tidak dapat dihapus (Sudah Disetujui)"}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Order Form Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={
                    modalMode === 'view' ? 'Rincian Pengajuan Barang' :
                        modalMode === 'edit' ? 'Ubah Pengajuan' :
                            modalMode === 'special' ? 'Form Pengajuan Barang Khusus' : 'Form Pengajuan Barang Baru'
                }
                size="xl"
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-slate-900 uppercase tracking-tight">Departemen Pemohon</label>
                            <div className="relative">
                                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <select
                                    value={selectedDepartment}
                                    onChange={(e) => setSelectedDepartment(e.target.value)}
                                    disabled={modalMode === 'view'}
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 font-bold disabled:bg-slate-50 disabled:text-slate-400"
                                >
                                    <option value="">-- Pilih Departemen --</option>
                                    {departments.map((dept) => (
                                        <option key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-slate-900 uppercase tracking-tight">Vendor / Rekanan</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <select
                                    value={selectedPartner}
                                    onChange={(e) => setSelectedPartner(e.target.value)}
                                    disabled={modalMode === 'view'}
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 font-bold disabled:bg-slate-50 disabled:text-slate-400"
                                >
                                    <option value="">-- Pilih Partner --</option>
                                    {partners.map((partner) => (
                                        <option key={partner.id} value={partner.id}>
                                            {partner.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-sm font-bold text-slate-900 uppercase tracking-tight">Notes / Keterangan Tambahan</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            disabled={modalMode === 'view'}
                            placeholder="Alasan pengajuan, urgensi, atau instruksi khusus..."
                            rows={2}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 font-bold disabled:bg-slate-50 disabled:text-slate-400"
                        />
                    </div>

                    <div className="border-t border-slate-100 pt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <Package className="w-5 h-5 text-blue-500" />
                                Daftar Barang Pengajuan
                            </h3>
                            {modalMode !== 'view' && (
                                <button
                                    type="button"
                                    onClick={addItem}
                                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-black uppercase tracking-tighter"
                                >
                                    <Plus className="w-4 h-4 bg-blue-100 rounded-full" /> Tambah Baris {modalMode === 'special' ? 'Khusus' : ''}
                                </button>
                            )}
                        </div>

                        <div className="space-y-3 max-h-[440px] overflow-y-auto pr-2 custom-scrollbar italic">
                            {items.map((item, index) => (
                                <div key={index} className="flex gap-4 items-start bg-slate-50/50 p-4 rounded-2xl border border-slate-100 relative group/item">
                                    <div className="flex-1 min-w-[200px] space-y-1">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Barang</label>
                                        <div
                                            onClick={() => modalMode === 'special' ? handleOpenSpecialInput(index) : (modalMode !== 'view' && handleOpenItemPicker(index))}
                                            className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 bg-white flex justify-between items-center group
                                                ${modalMode !== 'view' ? 'cursor-pointer hover:border-blue-400 hover:shadow-sm' : 'bg-slate-50 cursor-default'}
                                            `}
                                        >
                                            <div className="flex flex-col items-start gap-0.5 overflow-hidden">
                                                <span className={item.item_name ? 'text-slate-900 font-bold uppercase truncate w-full' : 'text-slate-400'}>
                                                    {item.item_name || (modalMode === 'special' ? 'Klik isi detail barang...' : 'Klik pilih barang...')}
                                                </span>
                                                {item.spec_description && (
                                                    <span className="text-[10px] text-slate-500 font-medium truncate w-full italic">
                                                        {item.spec_description}
                                                    </span>
                                                )}
                                            </div>
                                            {modalMode !== 'view' && (
                                                modalMode === 'special' ? <Edit className="w-4 h-4 text-slate-300 group-hover:text-blue-500" /> : <Search className="w-4 h-4 text-slate-300 group-hover:text-blue-500" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-[0.8] min-w-[150px] space-y-1">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Keterangan Unit</label>
                                        <input
                                            type="text"
                                            value={item.description}
                                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                                            disabled={modalMode === 'view'}
                                            placeholder="e.g. Ruangan Radiologi"
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50"
                                        />
                                    </div>
                                    <div className="w-24 space-y-1">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Tahun</label>
                                        <input
                                            type="number"
                                            min="2000"
                                            max="2100"
                                            value={item.procurement_year}
                                            onChange={(e) => updateItem(index, 'procurement_year', e.target.value)}
                                            disabled={modalMode === 'view'}
                                            placeholder="2026"
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 text-center"
                                        />
                                    </div>
                                    <div className="w-16 space-y-1">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Qty</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                            disabled={modalMode === 'view'}
                                            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 text-center"
                                        />
                                    </div>
                                    {modalMode === 'special' && (
                                        <div className="w-32 space-y-1">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Harga Satuan</label>
                                            <div
                                                onClick={() => handleOpenSpecialInput(index)}
                                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-bold text-right cursor-pointer hover:border-blue-500"
                                            >
                                                {item.unit_price.toLocaleString()}
                                            </div>
                                        </div>
                                    )}
                                    <div className="w-32 space-y-1">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Baris</label>
                                        <div className="w-full px-4 py-2.5 bg-blue-50/50 border border-blue-100 rounded-xl text-sm font-black text-blue-700 text-right tracking-tighter">
                                            {item.total_price.toLocaleString()}
                                        </div>
                                    </div>
                                    {modalMode !== 'view' && (
                                        <button
                                            type="button"
                                            onClick={() => removeItem(index)}
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl mt-6 transition-all border border-transparent hover:border-red-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Summary Section */}
                        <div className="mt-8 bg-slate-900 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[80px] -mr-32 -mt-32"></div>
                            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                                <div className="flex gap-6 items-center">
                                    <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                                        <Calculator className="w-8 h-8 text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Rincian Valuasi Akhir</p>
                                        <div className="flex gap-6">
                                            <div>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase">Subtotal</p>
                                                <p className="text-md font-bold text-white">Rp {calculateSubtotal().toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase text-center">PPN (11%)</p>
                                                <p className="text-md font-bold text-blue-300">Rp {calculatePPN().toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-1">Grand Total (Inc. Pajak)</p>
                                    <p className="text-4xl font-black tracking-tighter text-white">
                                        Rp {calculateGrandTotal().toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-6 border-t border-slate-100">
                        <div className="flex gap-2">
                            {modalMode === 'view' && hasPermission('orders.approve') && (selectedOrderId && (orders.find(o => o.id === selectedOrderId)?.status !== 'APPROVED' || user?.role?.toLowerCase() === 'administrator')) && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => handleUpdateStatus(selectedOrderId!, 'REJECTED')}
                                        className="px-6 py-3 bg-red-50 text-red-600 font-black rounded-xl hover:bg-red-100 transition-all uppercase text-xs tracking-widest flex items-center gap-2"
                                    >
                                        <XCircle className="w-4 h-4" /> Reject
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleUpdateStatus(selectedOrderId!, 'PENDING')}
                                        className="px-6 py-3 bg-blue-50 text-blue-600 font-black rounded-xl hover:bg-blue-100 transition-all uppercase text-xs tracking-widest flex items-center gap-2"
                                    >
                                        <AlertCircle className="w-4 h-4" /> Pending
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleUpdateStatus(selectedOrderId!, 'APPROVED')}
                                        className="px-6 py-3 bg-emerald-600 text-white font-black rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all uppercase text-xs tracking-widest flex items-center gap-2"
                                    >
                                        <CheckCircle className="w-4 h-4" /> Approve
                                    </button>
                                </>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="px-6 py-3 bg-slate-100 text-slate-600 font-black rounded-xl hover:bg-slate-200 transition-all uppercase text-xs tracking-widest"
                            >
                                {modalMode === 'view' ? 'Tutup Pratinjau' : 'Batal'}
                            </button>
                            {modalMode === 'view' && (
                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="px-8 py-3 bg-slate-900 text-white font-black rounded-xl shadow-lg hover:bg-black transition-all flex items-center gap-2 uppercase text-xs tracking-widest"
                                >
                                    <Printer className="w-4 h-4" /> Cetak Formulir
                                </button>
                            )}
                            {modalMode !== 'view' && (
                                <button
                                    type="button"
                                    onClick={handleSubmitOrder}
                                    className="px-10 py-3 bg-blue-600 text-white font-black rounded-xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 uppercase text-xs tracking-widest"
                                >
                                    {modalMode === 'edit' ? 'Update Pengajuan' : modalMode === 'special' ? 'Ajukan Pesanan Khusus' : 'Ajukan Pemesanan'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </Modal >

            {/* Item Picker Modal */}
            < Modal
                isOpen={isItemPickerOpen}
                onClose={() => setIsItemPickerOpen(false)
                }
                title="Pilih Katalog Barang"
            >
                <div>
                    <div className="relative mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors group-focus-within:text-blue-500" />
                        <input
                            type="text"
                            placeholder="Cari nama barang atau kode..."
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar border border-slate-100 rounded-2xl italic">
                        {filteredMasterItems.length === 0 ? (
                            <div className="p-12 text-center text-slate-400 italic">
                                Barang tidak ditemukan dalam database master.
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest sticky top-0 z-20">
                                    <tr>
                                        <th className="px-6 py-4">Item Catalog</th>
                                        <th className="px-6 py-4 text-right">Refer. Harga</th>
                                        <th className="px-6 py-4 text-center">Pilih</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 italic">
                                    {filteredMasterItems.map((item) => (
                                        <tr
                                            key={item.code}
                                            className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                                            onClick={() => handleSelectItem(item)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900 uppercase tracking-tight">{item.name}</div>
                                                <div className="text-[10px] font-mono text-slate-400 font-bold">{item.code}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-black text-slate-600 text-sm">
                                                Rp {item.price?.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center">
                                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all scale-0 group-hover:scale-100">
                                                        <Plus className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </Modal >

            {/* Special Item Input Modal */}
            <Modal
                isOpen={isSpecialInputOpen}
                onClose={() => setIsSpecialInputOpen(false)}
                title="Input Detail Barang Khusus"
                size="lg"
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-slate-900 uppercase tracking-tight">Jenis Persediaan</label>
                            <select
                                value={tempSpecialItem.type_id}
                                onChange={(e) => setTempSpecialItem({ ...tempSpecialItem, type_id: e.target.value })}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 font-bold"
                            >
                                <option value="">-- Pilih Jenis --</option>
                                {itemTypes.map(type => (
                                    <option key={type.id} value={type.id}>{type.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-slate-900 uppercase tracking-tight">Nama Barang</label>
                            <input
                                type="text"
                                value={tempSpecialItem.name}
                                onChange={(e) => setTempSpecialItem({ ...tempSpecialItem, name: e.target.value })}
                                placeholder="Contoh: ADAPTOR LAPTOP..."
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 font-bold"
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-sm font-bold text-slate-900 uppercase tracking-tight">Keterangan / Spesifikasi</label>
                        <textarea
                            value={tempSpecialItem.spec}
                            onChange={(e) => setTempSpecialItem({ ...tempSpecialItem, spec: e.target.value })}
                            placeholder="Contoh: Warna Hitam, Output 19V 3.42A..."
                            rows={3}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 font-bold"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-sm font-bold text-slate-900 uppercase tracking-tight">Estimasi Harga Satuan (Rp)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">Rp</span>
                            <input
                                type="number"
                                value={tempSpecialItem.price || ''}
                                onChange={(e) => setTempSpecialItem({ ...tempSpecialItem, price: Number(e.target.value) })}
                                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 font-bold text-right"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setIsSpecialInputOpen(false)}
                            className="px-6 py-2.5 bg-slate-100 text-slate-600 font-black rounded-xl hover:bg-slate-200 transition-all uppercase text-xs tracking-widest"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveSpecialInput}
                            className="px-8 py-2.5 bg-blue-600 text-white font-black rounded-xl shadow-lg hover:bg-blue-700 transition-all uppercase text-xs tracking-widest"
                        >
                            Simpan Barang
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Analysis Modal */}
            <Modal
                isOpen={isAnalysisModalOpen}
                onClose={() => setIsAnalysisModalOpen(false)}
                title="Tambah Analisa Permintaan"
                size="lg"
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-black uppercase text-slate-500">Departemen</label>
                            <div className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 uppercase">
                                {departments.find(d => d.id === selectedOrderForAnalysis?.department_id)?.name || '-'}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-black uppercase text-slate-500">Jenis Analisa</label>
                            <select
                                value={analysisForm.analysis_type}
                                onChange={(e) => setAnalysisForm({ ...analysisForm, analysis_type: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="Analisa Kerusakan">Analisa Kerusakan</option>
                                <option value="Analisa Perbaikan">Analisa Perbaikan</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-black uppercase text-slate-500">Detail Analisa per User</label>
                            <button
                                type="button"
                                onClick={addAnalysisRow}
                                className="text-[10px] font-black uppercase px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all flex items-center gap-1"
                            >
                                <Plus className="w-3 h-3" /> Tambah Baris
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                            {analysisForm.details.map((row, idx) => (
                                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative group animate-in fade-in slide-in-from-top-1">
                                    {analysisForm.details.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeAnalysisRow(idx)}
                                            className="absolute top-2 right-2 p-1.5 bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase text-slate-400">Nama Pemohon / User</label>
                                            <input
                                                type="text"
                                                value={row.requester_name}
                                                onChange={(e) => updateAnalysisRow(idx, 'requester_name', e.target.value)}
                                                placeholder="Nama User Pemohon..."
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-slate-400">Hasil Analisa</label>
                                                <textarea
                                                    value={row.analysis}
                                                    onChange={(e) => updateAnalysisRow(idx, 'analysis', e.target.value)}
                                                    placeholder="Analisa teknis..."
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                                                    rows={2}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-slate-400">Keterangan / Tindak Lanjut</label>
                                                <textarea
                                                    value={row.description}
                                                    onChange={(e) => updateAnalysisRow(idx, 'description', e.target.value)}
                                                    placeholder="Rekomendasi / Tindak lanjut..."
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                                                    rows={2}
                                                />
                                            </div>
                                        </div>

                                        {/* Row-based Replacement Section */}
                                        <div className="pt-2 border-t border-slate-100">
                                            <div className="flex items-center gap-2 mb-3">
                                                <input
                                                    type="checkbox"
                                                    id={`is_replacement_${idx}`}
                                                    checked={row.is_replacement}
                                                    onChange={(e) => updateAnalysisRow(idx, 'is_replacement', e.target.checked)}
                                                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                                />
                                                <label htmlFor={`is_replacement_${idx}`} className="text-[10px] font-black uppercase text-slate-500 cursor-pointer">
                                                    Analisa Pergantian Barang (Aset)
                                                </label>
                                            </div>

                                            {row.is_replacement && (
                                                <div className="grid grid-cols-2 gap-3 p-3 bg-white rounded-xl border border-blue-50 shadow-sm animate-in slide-in-from-top-1">
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-black uppercase text-slate-400">Thn Pengadaan</label>
                                                        <input
                                                            type="text"
                                                            value={row.asset_purchase_year}
                                                            onChange={(e) => updateAnalysisRow(idx, 'asset_purchase_year', e.target.value)}
                                                            placeholder="e.g. 2019"
                                                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold text-slate-900 focus:ring-1 focus:ring-blue-500 outline-none"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-black uppercase text-slate-400">Sisa Nilai Buku (Rp)</label>
                                                        <input
                                                            type="number"
                                                            value={row.remaining_book_value || ''}
                                                            onChange={(e) => updateAnalysisRow(idx, 'remaining_book_value', e.target.value)}
                                                            placeholder="0"
                                                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold text-slate-900 focus:ring-1 focus:ring-blue-500 outline-none"
                                                        />
                                                    </div>
                                                    <div className="col-span-2 space-y-1">
                                                        <label className="text-[9px] font-black uppercase text-slate-400">Bukti Asset (JPG/PNG)</label>
                                                        <div className="flex items-center gap-3">
                                                            <input
                                                                type="file"
                                                                accept="image/jpeg,image/png,image/jpg"
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) {
                                                                        const reader = new FileReader();
                                                                        reader.onloadend = () => {
                                                                            updateAnalysisRow(idx, 'asset_document', reader.result as string);
                                                                        };
                                                                        reader.readAsDataURL(file);
                                                                    }
                                                                }}
                                                                className="text-[9px] text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[9px] file:font-black file:uppercase file:bg-blue-600 file:text-white cursor-pointer"
                                                            />
                                                            {row.asset_document && (
                                                                <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200 group">
                                                                    <img src={row.asset_document} className="w-full h-full object-cover" />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => updateAnalysisRow(idx, 'asset_document', '')}
                                                                        className="absolute inset-0 bg-red-600/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6">
                        <button
                            onClick={() => setIsAnalysisModalOpen(false)}
                            className="px-6 py-3 text-slate-500 font-black uppercase text-xs hover:bg-slate-100 rounded-xl transition-all"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleSubmitAnalysis}
                            disabled={savingAnalysis}
                            className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white font-black uppercase text-xs rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {savingAnalysis ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                            Simpan Analisa
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Print Options Modal */}
            <Modal
                isOpen={isPrintOptionsOpen}
                onClose={() => setIsPrintOptionsOpen(false)}
                title="Pilih Dokumen Cetak"
                size="md"
            >
                <div className="space-y-3">
                    <button
                        onClick={() => handlePrint('request')}
                        className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 group transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Cetak Dokumen Permintaan Barang</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase italic">Formulir L.02</p>
                            </div>
                        </div>
                        <Printer className="w-4 h-4 text-slate-300 group-hover:text-blue-500" />
                    </button>

                    <button
                        onClick={() => handlePrint('approval')}
                        className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 group transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                <CheckCircle className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Cetak Dokumen Persetujuan Pembelian</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase italic">Persetujuan Manajerial</p>
                            </div>
                        </div>
                        <Printer className="w-4 h-4 text-slate-300 group-hover:text-emerald-500" />
                    </button>

                    {hasPermission('orders.analysis') && (
                        <button
                            onClick={() => {
                                if (!selectedOrderForPrint?.Analysis) {
                                    error('Analisa belum diisi untuk pesanan ini');
                                    return;
                                }
                                handlePrint('analysis');
                            }}
                            className={`w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl group transition-all 
                                ${selectedOrderForPrint?.Analysis ? 'hover:border-purple-500 hover:bg-purple-50 cursor-pointer' : 'opacity-50 cursor-not-allowed'}
                            `}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl transition-colors 
                                    ${selectedOrderForPrint?.Analysis ? 'bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white' : 'bg-slate-100 text-slate-400'}
                                `}>
                                    <ClipboardList className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Cetak Hasil Analisa Permintaan</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase italic">Analisa Kerusakan / Perbaikan</p>
                                </div>
                            </div>
                            {selectedOrderForPrint?.Analysis ? (
                                <Printer className="w-4 h-4 text-slate-300 group-hover:text-purple-500" />
                            ) : (
                                <AlertCircle className="w-4 h-4 text-slate-300" />
                            )}
                        </button>
                    )}

                    {hasPermission('orders.analysis') && !selectedOrderForPrint?.Analysis && (
                        <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex gap-3">
                            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                            <p className="text-[10px] font-bold text-amber-700 uppercase leading-tight italic">
                                Catatan: Hasil analisa belum tersedia. Harap isi analisa terlebih dahulu untuk mengaktifkan fitur cetak analisa.
                            </p>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Tracking Modal */}
            <Modal
                isOpen={isTrackingModalOpen}
                onClose={() => setIsTrackingModalOpen(false)}
                title={`Status Tracking: ${trackingOrder?.order_number}`}
                size="xl"
            >
                <div className="space-y-4">
                    <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl relative min-h-[400px] flex items-center justify-center border-4 border-slate-800">
                        {loadingTracking ? (
                            <div className="flex flex-col items-center gap-4 text-white">
                                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                                <div className="space-y-1 text-center">
                                    <p className="font-black uppercase tracking-widest text-sm">Menghubungi Manpro...</p>
                                    <p className="text-xs text-slate-400 font-medium">Ini mungkin memerlukan waktu 10-20 detik</p>
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

                        {/* Overlay scanline effect */}
                        {loadingTracking && (
                            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
                        )}
                    </div>

                    <div className="flex justify-between items-center bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-600 rounded-lg text-white">
                                <Search className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Aplikasi Eksternal</p>
                                <p className="text-xs font-bold text-slate-700">Data diambil secara real-time dari sistem Manpro melalui screenshot otomatis.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => trackingOrder && handleTrackOrder(trackingOrder)}
                            className="px-4 py-2 bg-white text-blue-600 border border-blue-200 rounded-lg text-xs font-black uppercase tracking-tight hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        >
                            <RefreshCcw className="w-3.5 h-3.5 inline mr-1" /> Segarkan
                        </button>
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

            {/* Print Template CSS */}
            <style jsx global>{`
                @media print {
                    body * { visibility: hidden; }
                    #print-area, #print-area * { visibility: visible; }
                    #print-area { 
                        position: absolute; 
                        left: 0; 
                        top: 0; 
                        width: 100%;
                    }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}</style>

            {/* Print Template (Visible only in Print) */}
            <div id="print-area" className="hidden print:block bg-white text-black font-calibri text-[10px]">
                <div className="w-[210mm] mx-auto p-[10mm]">
                    {/* Header - Only for Request template */}
                    {printType === 'request' && (
                        <div className="flex justify-between items-start border-b-[4px] border-black pb-4 mb-6">
                            <div className="flex items-center gap-6">
                                {(() => {
                                    const dept = departments.find(d => d.id.toString() === selectedDepartment);
                                    const company = companies.find(c => c.id === dept?.company_id);
                                    return company?.company_logo ? (
                                        <div className="w-16 h-16 shrink-0 border border-slate-100">
                                            <img src={company.company_logo} alt="Company Logo" className="w-full h-full object-contain" />
                                        </div>
                                    ) : (
                                        <div className="w-16 h-16 bg-black flex items-center justify-center text-white font-bold text-2xl shrink-0 uppercase tracking-tighter">
                                            MS
                                        </div>
                                    );
                                })()}
                                <div className="flex flex-col">
                                    <h2 className="text-[18.5px] font-black leading-[1.1] uppercase">
                                        Departemen<br />
                                        {(() => {
                                            const name = departments.find(d => d.id.toString() === selectedDepartment)?.name || '-';
                                            return name.replace(/departemen/gi, '').trim();
                                        })()}
                                    </h2>
                                </div>
                            </div>
                            <div className="text-right flex flex-col items-end pt-1">
                                <h1 className="text-[18.5px] font-black italic mb-1 tracking-tighter uppercase">
                                    {printType === 'request' ? 'FORMULIR L.02' : 'ANALISA L.01'}
                                </h1>
                                <p className="text-[10px] font-bold border-b border-black mb-1 pb-0.5 uppercase">
                                    {(() => {
                                        const dept = departments.find(d => d.id.toString() === selectedDepartment);
                                        const company = companies.find(c => c.id === dept?.company_id);
                                        return company?.company_name || 'PT MEDIKA LOKA MANAJEMEN';
                                    })()}
                                </p>
                                <div className="text-[10px] flex flex-col items-end uppercase font-bold space-y-0.5">
                                    <p>No / Dept : {(() => {
                                        const fullDept = departments.find(d => d.id.toString() === selectedDepartment)?.name || '';
                                        const cleanDept = fullDept.replace(/departemen/gi, '').trim();
                                        const deptCode = cleanDept.split(' ').map(word => word[0]).join('').toUpperCase() || 'PO';

                                        const orderDate = selectedOrderForPrint ?
                                            new Date(selectedOrderForPrint.createdAt || selectedOrderForPrint.date || new Date()) :
                                            new Date();

                                        const year = orderDate.getFullYear();
                                        const month = orderDate.getMonth() + 1;
                                        const day = orderDate.getDate().toString().padStart(4, '0');

                                        const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
                                        const monthRoman = romanMonths[month - 1];

                                        const prefix = printType === 'request' ? 'PB' : 'AN';
                                        return `${prefix}/${deptCode}/${year}/${monthRoman}/${day}`;
                                    })()}</p>
                                    <p>Tanggal Dokumen : {
                                        selectedOrderForPrint ?
                                            new Date(selectedOrderForPrint.createdAt || new Date()).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) :
                                            new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
                                    }</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Content Based on Print Type */}
                    {printType === 'request' ? (
                        <>
                            <div className="text-center mb-6">
                                <h3 className="inline-block font-black text-[18.5px] border-y-2 border-black py-1.5 px-6 uppercase tracking-wider underline underline-offset-2">
                                    FORMULIR PERMINTAAN / PENGAJUAN PEMBELIAN BARANG
                                </h3>
                            </div>

                            {(() => {
                                const hasLargeNumbers = items.some(item =>
                                    item.unit_price >= 1000000000 ||
                                    item.total_price >= 1000000000
                                );

                                return (
                                    <table className="w-full border-collapse border-[2px] border-black mb-2 text-[10px]">
                                        <thead>
                                            <tr className="bg-slate-50 font-black uppercase text-center border-b-[2px] border-black">
                                                <th className="border-r-[2px] border-black p-1 w-8">NO</th>
                                                <th className="border-r-[2px] border-black p-1 text-center font-bold">NAMA BARANG</th>
                                                <th className="border-r-[2px] border-black p-1 w-16 leading-tight">JML UNIT</th>
                                                <th className="border-r-[2px] border-black p-1 w-20 leading-none">KET.</th>
                                                <th className="border-r-[2px] border-black p-1 w-24 leading-none text-[9px]">UNIT / INSTALASI</th>
                                                <th className="border-r-[2px] border-black p-1 w-16 leading-none text-[8px]">THN LAMA</th>
                                                <th className={`border-r-[2px] border-black p-1 ${hasLargeNumbers ? 'w-32' : 'w-24'}`}>HARGA SATUAN</th>
                                                <th className={`p-1 ${hasLargeNumbers ? 'w-32' : 'w-28'}`}>TOTAL ESTIMASI</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((item, idx) => (
                                                <tr key={idx} className="border-b border-black">
                                                    <td className="border-r-[2px] border-black p-1.5 text-center">{idx + 1}</td>
                                                    <td className="border-r-[2px] border-black p-1.5 font-bold uppercase leading-tight">
                                                        {item.item_name}
                                                        <div className="flex flex-col gap-0.5 mt-0.5">
                                                            {item.spec_description && <span className="text-[8px] font-normal italic block leading-none">{item.spec_description}</span>}
                                                            {item.description && <span className="text-[8px] font-normal text-slate-500 italic block leading-none">{item.description}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="border-r-[2px] border-black p-1.5 text-center uppercase">
                                                        {item.quantity} UNIT
                                                    </td>
                                                    <td className="border-r-[2px] border-black p-1.5 text-center leading-tight italic">
                                                        -
                                                    </td>
                                                    <td className="border-r-[2px] border-black p-1.5 text-center uppercase text-[9px]">{departments.find(d => d.id.toString() === selectedDepartment)?.name || '-'}</td>
                                                    <td className="border-r-[2px] border-black p-1.5 text-center uppercase text-[9px]">{item.procurement_year || '-'}</td>
                                                    <td className={`border-r-[2px] border-black p-1.5 text-right font-mono text-[9px] ${hasLargeNumbers ? 'text-[8px]' : ''}`}>Rp {item.unit_price.toLocaleString('id-ID')}</td>
                                                    <td className={`p-1.5 text-right font-bold font-mono text-[9px] ${hasLargeNumbers ? 'text-[8px]' : ''}`}>Rp {item.total_price.toLocaleString('id-ID')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="font-bold border-t-[2px] border-black bg-slate-50 uppercase">
                                                <td colSpan={hasLargeNumbers ? 6 : 7} className="border-r-[2px] border-black p-1.5 text-right">Sub Total</td>
                                                {hasLargeNumbers && <td className="border-r-[2px] border-black p-1.5 text-right"></td>}
                                                <td className="p-1.5 text-right font-mono">Rp {calculateSubtotal().toLocaleString('id-ID')}</td>
                                            </tr>
                                            <tr className="font-bold border-t border-black bg-slate-50 uppercase">
                                                <td colSpan={hasLargeNumbers ? 6 : 7} className="border-r-[2px] border-black p-1.5 text-right">PPN 11%</td>
                                                {hasLargeNumbers && <td className="border-r-[2px] border-black p-1.5 text-right"></td>}
                                                <td className="p-1.5 text-right font-mono">Rp {calculatePPN().toLocaleString('id-ID')}</td>
                                            </tr>
                                            <tr className="font-black border-t-[2px] border-black bg-slate-50 uppercase">
                                                <td colSpan={hasLargeNumbers ? 6 : 7} className="border-r-[2px] border-black p-1.5 text-right">Grand Total</td>
                                                {hasLargeNumbers && <td className="border-r-[2px] border-black p-1.5 text-right"></td>}
                                                <td className="p-1.5 text-right font-bold font-mono">Rp {calculateGrandTotal().toLocaleString('id-ID')}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                );
                            })()}

                            <div className="border-[2px] border-black p-3 mb-8 text-[10px] flex gap-2 items-start leading-tight">
                                <span className="font-black underline italic shrink-0 uppercase">Notes :</span>
                                <span className="font-bold pt-0.5 whitespace-pre-wrap">{notes || '-'}</span>
                            </div>

                            <table className="w-full text-center text-[9px] uppercase font-bold border-collapse mt-8">
                                <thead>
                                    <tr className="border-[2px] border-black bg-slate-50 uppercase">
                                        <th className="border-r-[2px] border-black p-2 w-[33%] text-[9px] text-left pl-4">ATAS PERMINTAAN :</th>
                                        <th className="border-r-[2px] border-black p-2 w-[33%] text-[9px] text-center">MENGETAHUI :</th>
                                        <th className="p-2 w-[33%] text-[9px] text-center">MENYETUJUI :</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-[2px] border-black border-t-0 h-24">
                                        <td className="border-r-[2px] border-black align-bottom pb-2">( ............................ )</td>
                                        <td className="border-r-[2px] border-black align-bottom pb-2">( ............................ )</td>
                                        <td className="align-bottom pb-2">( ............................ )</td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="mt-4 text-[9px] font-black uppercase leading-tight">
                                <p>CATATAN:</p>
                                <p>UNTUK PENGAJUAN PENGGANTIAN BARANG LAMA, <br /> MAKA TAHUN PENGADAAN BARANG LAMA HARUS DIISI.</p>
                            </div>
                        </>
                    ) : printType === 'approval' ? (
                        /* Redesigned Approval Document */
                        <>
                            <div className="text-center mb-6 space-y-1">
                                <h3 className="font-black text-[20px] uppercase leading-none tracking-tight">FORMULIR PERSETUJUAN DIREKSI GROUP</h3>
                                <h4 className="font-bold text-[14px] uppercase border-b-2 border-black inline-block pb-1">ATAS PERMINTAAN ALAT KESEHATAN / ALAT UMUM INVESTASI</h4>
                            </div>

                            {(() => {
                                const hasLargeNumbers = items.some(item =>
                                    item.unit_price >= 1000000000 ||
                                    (item.total_price * 1.11) >= 1000000000
                                );

                                return (
                                    <table className="w-full border-collapse border-[2px] border-black mb-8 text-[9px]">
                                        <thead>
                                            <tr className="bg-slate-50 font-black uppercase text-center border-b-[2px] border-black">
                                                <th className="border-r-[2px] border-black p-2 w-8">NO</th>
                                                <th className="border-r-[2px] border-black p-2 text-center">Item Barang</th>
                                                <th className="border-r-[2px] border-black p-2 w-10">Qty</th>
                                                <th className={`border-r-[2px] border-black p-2 ${hasLargeNumbers ? 'w-36' : 'w-24'}`}>Harga Satuan</th>
                                                <th className="border-r-[2px] border-black p-2 w-10 leading-none">Disc (%)</th>
                                                <th className="border-r-[2px] border-black p-2 w-10 leading-none">E.Disc (%)</th>
                                                <th className="border-r-[2px] border-black p-2 w-10 leading-none">PPN (%)</th>
                                                <th className={`border-r-[2px] border-black p-2 leading-none ${hasLargeNumbers ? 'w-32' : 'w-24'}`}>PPN (Nilai)</th>
                                                <th className={`${hasLargeNumbers ? 'w-40' : 'w-32'} p-2`}>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((item, idx) => (
                                                <tr key={idx} className="border-b border-black">
                                                    <td className="border-r-[2px] border-black p-2 text-center font-bold tracking-tighter">{idx + 1}</td>
                                                    <td className="border-r-[2px] border-black p-2 font-black uppercase leading-tight tracking-tighter text-[11px]">
                                                        {item.item_name}
                                                        {item.spec_description && (
                                                            <div className="text-[8px] font-normal mt-0.5 text-slate-500 italic block leading-none">
                                                                {item.spec_description}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="border-r-[2px] border-black p-2 text-center font-bold">{item.quantity}</td>
                                                    <td className="border-r-[2px] border-black p-2 text-right font-mono font-bold">
                                                        Rp {item.unit_price.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="border-r-[2px] border-black p-2 text-center">-</td>
                                                    <td className="border-r-[2px] border-black p-2 text-center">-</td>
                                                    <td className="border-r-[2px] border-black p-2 text-center">11</td>
                                                    <td className="border-r-[2px] border-black p-2 text-right font-mono text-[8px]">
                                                        Rp {(item.total_price * 0.11).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="p-2 text-right font-black font-mono text-[11px]">
                                                        Rp {(item.total_price * 1.11).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="font-bold border-t-[2px] border-black uppercase text-[10px]">
                                                <td colSpan={8} className="border-r-[2px] border-black p-2 text-right">Subtotal</td>
                                                <td className="p-2 text-right font-mono">Rp {calculateSubtotal().toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            </tr>
                                            <tr className="font-bold border-t border-black uppercase text-[10px]">
                                                <td colSpan={8} className="border-r-[2px] border-black p-2 text-right">PPN 11%</td>
                                                <td className="p-2 text-right font-mono font-bold">Rp {calculatePPN().toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            </tr>
                                            <tr className="font-black border-t-[2px] border-black bg-slate-50 uppercase text-[12px]">
                                                <td colSpan={8} className="border-r-[2px] border-black p-2 text-right">Grand Total</td>
                                                <td className="p-2 text-right font-black font-mono">Rp {calculateGrandTotal().toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                );
                            })()}

                            <div className="space-y-4 mb-10">
                                <div className="flex gap-4 items-start">
                                    <span className="w-48 font-black uppercase text-[11px] tracking-tight">No Formulir</span>
                                    <span className="font-black uppercase text-[11px] tracking-tight">: {(() => {
                                        const dept = departments.find(d => d.id.toString() === selectedDepartment);
                                        const company = companies.find(c => c.id === dept?.company_id);
                                        const companyNamePart = company?.company_code || company?.company_name.split(' ').map(w => w[0]).join('').toUpperCase() || 'FP';

                                        const orderDate = selectedOrderForPrint ?
                                            new Date(selectedOrderForPrint.createdAt || selectedOrderForPrint.date || new Date()) :
                                            new Date();

                                        const year = orderDate.getFullYear();
                                        const month = orderDate.getMonth() + 1;
                                        const day = orderDate.getDate().toString().padStart(2, '0');
                                        const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
                                        const monthRoman = romanMonths[month - 1];
                                        const seq = selectedOrderForPrint?.id.toString().padStart(4, '0') || '0000';

                                        return `FP/${companyNamePart}/${year}/${monthRoman}/${day}/${seq}`;
                                    })()}</span>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <span className="w-48 font-black uppercase text-[11px] tracking-tight shrink-0">Supplier</span>
                                    <div className="flex-1 flex gap-1 font-bold uppercase text-[11px] tracking-tight leading-tight">
                                        <span className="shrink-0">:</span>
                                        <div className="flex flex-col">
                                            {(() => {
                                                const partner = partners.find(p => p.id.toString() === selectedPartner);
                                                if (!partner) return <span>-</span>;
                                                return (
                                                    <>
                                                        <span className="font-black">{partner.name}</span>
                                                        {partner.address && <span className="font-medium text-[9px] normal-case italic mt-0.5">{partner.address}</span>}
                                                        {(partner.contact_person || partner.phone) && (
                                                            <span className="font-medium text-[9px] normal-case italic">
                                                                {partner.contact_person} {partner.phone && `(${partner.phone})`}
                                                            </span>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <span className="w-48 font-black uppercase text-[11px] tracking-tight">Harga Bayar</span>
                                    <span className="font-black uppercase text-[11px] tracking-tight">: Rp {calculateGrandTotal().toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <span className="w-48 font-black uppercase text-[11px] tracking-tight">RS Hermina yang meminta</span>
                                    <span className="font-black uppercase text-[11px] tracking-tight">
                                        : {(() => {
                                            const dept = departments.find(d => d.id.toString() === selectedDepartment);
                                            const company = companies.find(c => c.id === dept?.company_id);
                                            return company?.company_name || '-';
                                        })()}
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-between items-end mt-12 relative h-48">
                                <div className="flex-1 text-center flex flex-col items-center">
                                    <div className="h-32" />
                                    <p className="font-black underline text-[11px]">Esa Setiawan</p>
                                    <p className="text-[9px] font-bold uppercase tracking-tighter">Manager Operasional & TI RS</p>
                                </div>
                                <div className="flex-1 text-center flex flex-col items-center">
                                    <div className="h-32" />
                                    <p className="font-black underline text-[11px]">Eri Wijaya</p>
                                    <p className="text-[9px] font-bold uppercase tracking-tighter">Kadep Bisnis Digital</p>
                                </div>
                                <div className="flex-1 text-center flex flex-col items-center">
                                    <div className="h-32 flex flex-col items-center justify-start">
                                        <p className="text-[10px] font-bold uppercase italic mt-[-16px] mb-24">
                                            Jakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <p className="font-black underline text-[11px]">
                                        {(() => {
                                            const dept = departments.find(d => d.id.toString() === selectedDepartment);
                                            const company = companies.find(c => c.id === dept?.company_id);
                                            return company?.direktur_utama || 'Direktur Utama';
                                        })()}
                                    </p>
                                    <p className="text-[9px] font-bold uppercase tracking-tighter leading-tight">
                                        Direktur Utama<br />
                                        {(() => {
                                            const dept = departments.find(d => d.id.toString() === selectedDepartment);
                                            const company = companies.find(c => c.id === dept?.company_id);
                                            return company?.company_name || '-';
                                        })()}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-10 border-t border-black pt-4">
                                <div className="flex flex-col gap-1 items-start">
                                    <span className="font-black underline italic text-[10px]">Catatan :</span>
                                    <div className="text-[9px] font-medium leading-tight space-y-0.5">
                                        <p>1. Termasuk Program Pengembangan : </p>
                                        <p>2. Termasuk Cash Program : </p>
                                        <p>3. Nilai Transaksi 20 Juta - 100 Juta sudah dibahas Tim Pembelian</p>
                                        <p>4. Nilai Transaksi &gt; 100 Juta sudah dibahas rapat Tim Pembelian - Dewan Komisaris</p>
                                        {notes && <p className="mt-2 font-bold italic">Catatan Tambahan: {notes}</p>}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Analysis Template Refined */
                        <div className="font-serif text-black leading-relaxed">
                            {/* Title */}
                            <div className="text-center mb-6">
                                <h3 className="font-bold text-[16pt] border-b border-black inline-block pb-1 tracking-wide">
                                    Analisa Teknis Kerusakan
                                </h3>
                            </div>

                            {/* Info Block */}
                            <div className="mb-6 ml-8 text-[12pt]">
                                <table className="w-full">
                                    <tbody>
                                        <tr>
                                            <td className="w-32 align-top">Departemen</td>
                                            <td className="w-4 align-top">:</td>
                                            <td className="align-top">{departments.find(d => d.id === selectedOrderForPrint?.department_id)?.name || '-'}</td>
                                        </tr>
                                        <tr>
                                            <td className="align-top">Perihal</td>
                                            <td className="align-top">:</td>
                                            <td className="align-top">{selectedOrderForPrint?.Analysis?.analysis_type || 'Analisa Kerusakan'}</td>
                                        </tr>
                                        <tr>
                                            <td className="align-top">Tanggal</td>
                                            <td className="align-top">:</td>
                                            <td className="align-top">
                                                {selectedOrderForPrint?.createdAt ?
                                                    new Date(selectedOrderForPrint.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                                                    : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                                                }
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Dedication */}
                            <div className="mb-4 text-[12pt]">
                                <p className="mb-2">Dengan hormat,</p>
                                <p className="text-justify indent-8">
                                    Bersama ini kami sampaikan Hasil Analisa dan Tindak Lanjut untuk selanjutnya dapat diproses sesuai dengan ketentuan.
                                </p>
                            </div>

                            {/* Main Table */}
                            <table className="w-full border-collapse border border-black mb-6 text-[11pt]">
                                <thead>
                                    <tr className="bg-slate-100/50">
                                        <th className="border border-black p-2 w-10 text-center font-bold">No.</th>
                                        <th className="border border-black p-2 w-48 text-center font-bold">Departemen / User</th>
                                        <th className="border border-black p-2 text-center font-bold">Analisa</th>
                                        <th className="border border-black p-2 w-64 text-center font-bold">Keterangan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.isArray(selectedOrderForPrint?.Analysis?.details) && selectedOrderForPrint.Analysis.details.length > 0 ? (
                                        selectedOrderForPrint.Analysis.details.map((row: any, idx: number) => (
                                            <tr key={idx}>
                                                <td className="border border-black p-2 text-center align-top">{idx + 1}.</td>
                                                <td className="border border-black p-2 text-center align-top font-bold whitespace-pre-wrap">
                                                    {row?.requester_name || '-'}
                                                </td>
                                                <td className="border border-black p-2 align-top text-justify whitespace-pre-wrap">
                                                    {row?.analysis || '-'}
                                                </td>
                                                <td className="border border-black p-2 align-top text-justify whitespace-pre-wrap">
                                                    {row?.description || '-'}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td className="border border-black p-2 text-center align-top">1.</td>
                                            <td className="border border-black p-2 text-center align-top font-bold uppercase">
                                                {selectedOrderForPrint?.Analysis?.requester_name || '-'}
                                            </td>
                                            <td className="border border-black p-2 align-top text-justify">
                                                {selectedOrderForPrint?.Analysis?.analysis || '-'}
                                            </td>
                                            <td className="border border-black p-2 align-top text-justify">
                                                {selectedOrderForPrint?.Analysis?.description || '-'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            {/* New Multi-User Asset Value Section */}
                            {(selectedOrderForPrint?.Analysis?.details?.some((d: any) => d.is_replacement) || selectedOrderForPrint?.Analysis?.is_replacement) && (
                                <div className="mb-4 text-[11pt]">
                                    <p className="font-bold underline mb-1">Data nilai buku :</p>

                                    {/* List text values first */}
                                    <div className="space-y-1 mb-4">
                                        {Array.isArray(selectedOrderForPrint?.Analysis?.details) ? (
                                            selectedOrderForPrint.Analysis.details
                                                .filter((d: any) => d.is_replacement)
                                                .map((d: any, idx: number) => (
                                                    <p key={idx}>
                                                        {selectedOrderForPrint.Analysis.details.length > 1 && `${idx + 1}. `}
                                                        User <span className="font-bold uppercase">{d.requester_name}</span> :
                                                        Nilai buku saat ini tercatat
                                                        <span className="font-bold"> Rp {Number(d.remaining_book_value || 0).toLocaleString()}</span>,-
                                                        Tahun pengadaan {d.asset_purchase_year || '-'}
                                                    </p>
                                                ))
                                        ) : (
                                            <p>
                                                Nilai buku saat ini tercatat
                                                <span className="font-bold"> Rp {Number(selectedOrderForPrint?.Analysis?.remaining_book_value || 0).toLocaleString()}</span>,-
                                                Tahun pengadaan {selectedOrderForPrint?.Analysis?.asset_purchase_year || '-'}
                                            </p>
                                        )}
                                    </div>

                                    {/* Stack images vertically below */}
                                    <div className="space-y-6">
                                        {Array.isArray(selectedOrderForPrint?.Analysis?.details) ? (
                                            selectedOrderForPrint.Analysis.details
                                                .filter((d: any) => d.asset_document)
                                                .map((d: any, idx: number) => (
                                                    <div key={idx} className="inline-block">
                                                        <img
                                                            src={d.asset_document}
                                                            className="max-w-[700px] max-h-[500px] object-contain border border-slate-100"
                                                            alt={`Bukti Aset ${d.requester_name}`}
                                                        />
                                                        <p className="text-[9pt] italic mt-1 text-slate-500 font-serif">
                                                            Lembar Bukti Fisik / Nilai Aset - {d.requester_name}
                                                        </p>
                                                    </div>
                                                ))
                                        ) : (
                                            selectedOrderForPrint?.Analysis?.asset_document && (
                                                <div className="inline-block">
                                                    {selectedOrderForPrint.Analysis.asset_document.startsWith('data:image') ? (
                                                        <img
                                                            src={selectedOrderForPrint.Analysis.asset_document}
                                                            className="max-w-[700px] max-h-[500px] object-contain"
                                                            alt="Bukti Aset"
                                                        />
                                                    ) : (
                                                        <div className="flex items-center gap-3 p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 font-bold text-sm">
                                                            <FileText className="w-6 h-6 text-blue-500" />
                                                            <span>DOKUMEN TERLAMPIR (PDF)</span>
                                                        </div>
                                                    )}
                                                    <p className="text-[9pt] italic mt-1 text-slate-500 font-serif">Lembar Bukti Fisik / Nilai Aset</p>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Closing */}
                            <div className="mb-12 text-[12pt]">
                                <p className="text-justify indent-8">
                                    Demikian analisa teknis ini saya buat, atas perhatian dan kerjasamanya saya ucapkan terimakasih.
                                </p>
                            </div>

                            {/* Signature */}
                            <div className="text-[12pt]">
                                <p className="mb-24">Hormat kami,<br />Teknisi PC</p>
                                <p className="font-bold underline uppercase">{user?.first_name || 'Teknisi'} {user?.last_name || ''}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* Hover Preview for Order Items */}
            {
                hoveredOrder && (
                    <div
                        className="fixed z-[9999] bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 w-[400px] pointer-events-none animate-in fade-in slide-in-from-left-2 duration-200"
                        style={{ left: hoverPosition.x, top: hoverPosition.y }}
                    >
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                            <div className="p-1.5 bg-blue-50 rounded-lg">
                                <Package className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Preview Permintaan</p>
                                <p className="text-xs font-black text-slate-900 uppercase">{hoveredOrder.order_number}</p>
                            </div>
                        </div>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                            {hoveredOrder.OrderItems && hoveredOrder.OrderItems.length > 0 ? (
                                hoveredOrder.OrderItems.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-start gap-3 p-2 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex-1">
                                            <p className="text-[11px] font-black text-slate-900 uppercase leading-tight">{item.item_name}</p>
                                            <p className="text-[9px] text-slate-500 italic mt-0.5">{item.description || 'Tanpa keterangan'}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-[10px] font-bold text-blue-600">{item.quantity} UNIT</p>
                                            <p className="text-[9px] font-medium text-slate-400">Rp {item.unit_price.toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-4 text-slate-400 text-xs italic">Tidak ada item dalam order ini</div>
                            )}
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Estimasi</span>
                            <span className="text-sm font-black text-blue-700 tracking-tighter">Rp {(Number(hoveredOrder.subtotal) || 0).toLocaleString()}</span>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
