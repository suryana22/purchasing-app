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
        ],
    },
];


export default function Sidebar() {
    const pathname = usePathname();
    const { hasPermission, isLoading } = useAuth();
    const [openMenus, setOpenMenus] = useState<string[]>([]);

    const isLoaded = !isLoading;

    // Filter menu items
    const filteredMenuItems = menuItems.filter(item => {
        // Parent menu is visible if it has no permission required OR user has that permission
        // OR if any of its children are visible
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
        } else {
            setOpenMenus([]);
        }
    }, [pathname, isLoaded]);

    if (!isLoaded) return null;

    const toggleMenu = (name: string) => {
        setOpenMenus(prev =>
            prev.includes(name)
                ? prev.filter(item => item !== name)
                : [...prev, name]
        );
    };

    return (
        <div className="flex flex-col h-screen w-64 bg-slate-900 text-white shadow-lg">
            <div className="p-6 border-b border-slate-800">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
                    Purchasing App
                </h1>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                {filteredMenuItems.map((item) => (
                    <div key={item.name}>
                        {item.children ? (
                            <div>
                                <button
                                    onClick={() => toggleMenu(item.name)}
                                    className={`flex items-center w-full p-3 rounded-lg transition-colors duration-200 
                    ${openMenus.includes(item.name) ? 'bg-slate-800' : 'hover:bg-slate-800/50'}`}
                                >
                                    <item.icon className="w-5 h-5 mr-3 text-blue-400" />
                                    <span className="flex-1 text-left font-medium">{item.name}</span>
                                    {openMenus.includes(item.name) ? (
                                        <ChevronDown className="w-4 h-4 text-slate-400" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4 text-slate-400" />
                                    )}
                                </button>

                                {openMenus.includes(item.name) && (
                                    <div className="ml-9 mt-1 space-y-1 border-l-2 border-slate-800 pl-2">
                                        {item.children.map((child) => (
                                            <Link
                                                key={child.path}
                                                href={child.path}
                                                className={`block p-2 text-sm rounded-md transition-all duration-200
                          ${pathname === child.path
                                                        ? 'text-white bg-blue-600 shadow-md transform translate-x-1'
                                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                                            >
                                                {child.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link
                                href={item.path}
                                className={`flex items-center p-3 rounded-lg transition-colors duration-200
                  ${pathname === item.path
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                            >
                                <item.icon className="w-5 h-5 mr-3" />
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        )}
                    </div>
                ))}
            </nav>

        </div>
    );
}
