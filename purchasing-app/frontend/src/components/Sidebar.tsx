'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import {
    LayoutDashboard,
    Database,
    ShoppingCart,
    ChevronDown,
    ChevronRight,
    LogOut,
    Settings
} from 'lucide-react';

interface MenuItem {
    name: string;
    icon: any;
    path: string;
    permission?: string;
    children?: { name: string; path: string; permission?: string }[];
}

const menuItems: MenuItem[] = [
    {
        name: 'Dashboard',
        icon: LayoutDashboard,
        path: '/dashboard',
    },
    {
        name: 'Master Data',
        icon: Database,
        path: '/dashboard/master-data',
        permission: 'departments.view', // Simplify: if can view depts, can see master data
        children: [
            { name: 'Departemen', path: '/dashboard/master-data/departments', permission: 'departments.view' },
            { name: 'Jenis Persediaan', path: '/dashboard/master-data/item-types', permission: 'item_types.view' },
            { name: 'Barang', path: '/dashboard/master-data/items', permission: 'items.view' },
            { name: 'Rekanan', path: '/dashboard/master-data/partners', permission: 'partners.view' },
        ],
    },
    {
        name: 'Purchasing',
        icon: ShoppingCart,
        path: '/dashboard/purchasing',
        permission: 'orders.view',
        children: [
            { name: 'Pemesanan Barang', path: '/dashboard/purchasing/orders', permission: 'orders.view' },
            { name: 'Lacak Pesanan', path: '/dashboard/purchasing/tracking', permission: 'orders.view' },
        ],
    },
];


export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const pathname = usePathname();
    const { hasPermission, isLoading } = useAuth();
    const [openMenus, setOpenMenus] = useState<string[]>([]);

    const isLoaded = !isLoading;

    // Filter menu items
    const filteredMenuItems = menuItems.filter(item => {
        const hasParentPerm = !item.permission || hasPermission(item.permission);
        const hasVisibleChild = item.children?.some(child => !child.permission || hasPermission(child.permission));
        return hasParentPerm || hasVisibleChild;
    }).map(item => ({
        ...item,
        children: item.children?.filter(child => !child.permission || hasPermission(child.permission))
    }));

    // Auto-collapse logic
    useEffect(() => {
        const activeMenu = filteredMenuItems.find(item =>
            item.children?.some(child => pathname === child.path)
        );

        if (activeMenu) {
            setOpenMenus([activeMenu.name]);
        }

        // On mobile, close sidebar after navigation
        if (window.innerWidth < 1024) {
            onClose();
        }
    }, [pathname, isLoaded]); // Removed onClose from dependency to avoid loop if parent component recreation

    const toggleMenu = (name: string) => {
        setOpenMenus(prev =>
            prev.includes(name)
                ? prev.filter(item => item !== name)
                : [...prev, name]
        );
    };

    return (
        <aside className={`fixed lg:fixed inset-y-0 left-0 z-40 w-72 bg-slate-900 text-white shadow-2xl transition-transform duration-300 ease-in-out transform 
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            flex flex-col h-screen overflow-hidden`}>

            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent tracking-tighter uppercase italic">
                        PO SYSTEM
                    </h1>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Management Console</p>
                </div>
                <button
                    onClick={onClose}
                    className="lg:hidden p-2 rounded-lg hover:bg-slate-800 transition-colors"
                >
                    <ChevronRight className="w-5 h-5 text-slate-400 rotate-180" />
                </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2 custom-scrollbar">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-4 mb-4">Main Navigation</div>

                {!isLoaded && (
                    <div className="px-4 space-y-4 animate-pulse">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-10 bg-slate-800 rounded-xl"></div>
                        ))}
                    </div>
                )}

                {isLoaded && filteredMenuItems.map((item) => (
                    <div key={item.name} className="space-y-1">
                        {item.children ? (
                            <div>
                                <button
                                    onClick={() => toggleMenu(item.name)}
                                    className={`flex items-center w-full p-3 rounded-xl transition-all duration-300 group
                                        ${openMenus.includes(item.name)
                                            ? 'bg-blue-600/10 text-blue-400'
                                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                                >
                                    <div className={`p-2 rounded-lg mr-3 transition-colors ${openMenus.includes(item.name) ? 'bg-blue-600/20 text-blue-400' : 'bg-slate-800 text-slate-500 group-hover:text-white'}`}>
                                        <item.icon className="w-4 h-4" />
                                    </div>
                                    <span className="flex-1 text-left text-sm font-black uppercase tracking-tight">{item.name}</span>
                                    {openMenus.includes(item.name) ? (
                                        <ChevronDown className="w-4 h-4 opacity-50" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4 opacity-30" />
                                    )}
                                </button>

                                {openMenus.includes(item.name) && (
                                    <div className="ml-6 mt-2 space-y-1 p-1 bg-slate-950/30 rounded-xl border border-slate-800/50">
                                        {item.children.map((child) => (
                                            <Link
                                                key={child.path}
                                                href={child.path}
                                                className={`flex items-center gap-3 p-2.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300
                                                    ${pathname === child.path
                                                        ? 'text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-900/40 translate-x-1'
                                                        : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800'}`}
                                            >
                                                <div className={`w-1.5 h-1.5 rounded-full ${pathname === child.path ? 'bg-white' : 'bg-slate-700'}`} />
                                                {child.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link
                                href={item.path}
                                className={`flex items-center p-3 rounded-xl transition-all duration-300 group
                                    ${pathname === item.path
                                        ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                            >
                                <div className={`p-2 rounded-lg mr-3 ${pathname === item.path ? 'bg-white/20' : 'bg-slate-800 text-slate-500 group-hover:text-white'}`}>
                                    <item.icon className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-black uppercase tracking-tight">{item.name}</span>
                            </Link>
                        )}
                    </div>
                ))}
            </nav>

            {/* Bottom Section */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/20">
                <div className="bg-slate-800/50 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
                        <Settings className="w-5 h-5 animate-spin-slow" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-300 uppercase leading-none">V2.0 STABLE</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter mt-1">Enterprise Ready</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
