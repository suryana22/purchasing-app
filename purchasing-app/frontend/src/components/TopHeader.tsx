'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, User, Bell, Settings, XCircle, AlertCircle, Check, CheckCheck, Menu } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Notification {
    id: number;
    message: string;
    resource_type: string;
    resource_id: number;
    target_permission?: string;
    is_read: boolean;
    createdAt: string;
}

export default function TopHeader({ onMenuClick }: { onMenuClick?: () => void }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout, hasPermission } = useAuth();

    const handleLogout = () => {
        logout();
    };

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);
    const { authenticatedFetch: fetch } = useAuth(); // rename for convenience

    const fetchNotifications = async () => {
        // Don't fetch if user is not logged in
        if (!user) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_PURCHASING_API || 'http://localhost:4002'}/api/notifications`);
            if (res.ok) {
                const data: Notification[] = await res.json();
                // Filter relevant notifications
                const relevant = data.filter(n => {
                    if (!n.target_permission) return true; // Public notif
                    return hasPermission(n.target_permission);
                });
                setNotifications(relevant);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    // Helper to get page title from pathname
    const getPageTitle = (path: string) => {
        const segments = path.split('/').filter(Boolean);
        if (segments.length <= 1) return 'Dashboard';
        const lastSegment = segments[segments.length - 1];
        return lastSegment
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const handleNotificationClick = async (n: Notification) => {
        // Mark as read in backend
        if (!n.is_read) {
            try {
                await fetch(`${process.env.NEXT_PUBLIC_PURCHASING_API || 'http://localhost:4002'}/api/notifications/${n.id}/read`, {
                    method: 'PUT'
                });
                fetchNotifications();
            } catch (e) {
                console.error(e);
            }
        }

        // If it's an order, trigger event to open it
        if (n.resource_type === 'Order') {
            setIsNotifOpen(false);

            if (pathname.includes('/dashboard/purchasing/orders')) {
                window.dispatchEvent(new CustomEvent('open-order-review', {
                    detail: { orderId: n.resource_id }
                }));
            } else {
                // Navigate with query param
                router.push(`/dashboard/purchasing/orders?review=${n.resource_id}`);
            }
        }
    };

    const handleMarkAllRead = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_PURCHASING_API || 'http://localhost:4002'}/api/notifications/read-all`, {
                method: 'PUT'
            });
            if (res.ok) fetchNotifications();
        } catch (e) {
            console.error(e);
        }
    };

    const handleToggleRead = async (e: React.MouseEvent, n: Notification) => {
        e.stopPropagation(); // Don't trigger navigation
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_PURCHASING_API || 'http://localhost:4002'}/api/notifications/${n.id}/read`, {
                method: 'PUT'
            });
            if (res.ok) fetchNotifications();
        } catch (e) {
            console.error(e);
        }
    };


    // Helper to get initials
    const getInitials = () => {
        if (!user) return '??';
        if (user.first_name) {
            return (user.first_name[0] + (user.last_name ? user.last_name[0] : '')).toUpperCase();
        }
        return user.username.slice(0, 2).toUpperCase();
    };


    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 md:px-8 sticky top-0 z-30 shadow-sm">
            <div className="flex items-center gap-1 md:gap-4 flex-1 min-w-0">
                <button
                    onClick={onMenuClick}
                    className="p-2 mr-2 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
                    aria-label="Toggle Menu"
                >
                    <Menu className="w-5 h-5" />
                </button>

                <div className="flex flex-col min-w-0">
                    <h2 className="text-xs md:text-sm font-black text-slate-800 tracking-tight uppercase truncate">
                        {getPageTitle(pathname)}
                    </h2>

                    {/* Small active menu info / breadcrumbs */}
                    <nav className="flex items-center text-[9px] md:text-[10px] text-slate-400 gap-1 truncate">
                        <span className="hidden xs:inline">Dashboard</span>
                        {pathname.split('/').filter(Boolean).slice(1).map((seg, i) => (
                            <div key={seg} className="flex items-center gap-1 min-w-0">
                                <span className="text-slate-300">/</span>
                                <span className="truncate max-w-[60px] md:max-w-none">
                                    {seg.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                </span>
                            </div>
                        ))}
                    </nav>
                </div>
            </div>

            <div className="flex items-center gap-1 md:gap-6 ml-2">
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => setIsNotifOpen(!isNotifOpen)}
                        className="p-2 text-slate-400 hover:text-blue-600 transition-colors relative"
                    >
                        <Bell className="w-4 h-4 md:w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white animate-pulse"></span>
                        )}
                    </button>

                    {isNotifOpen && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                            <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Notifikasi</h3>
                                    {unreadCount > 0 && (
                                        <span className="text-[9px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-black">
                                            {unreadCount} Baru
                                        </span>
                                    )}
                                </div>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={handleMarkAllRead}
                                        className="text-[9px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center gap-1 transition-colors"
                                    >
                                        <CheckCheck className="w-3 h-3" /> Mark all read
                                    </button>
                                )}
                            </div>
                            <div className="max-h-[300px] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-6 text-center text-slate-400 text-[10px] font-bold uppercase tracking-tight">
                                        Tidak ada notifikasi baru
                                    </div>
                                ) : (
                                    notifications.map(n => (
                                        <div
                                            key={n.id}
                                            onClick={() => handleNotificationClick(n)}
                                            className={`p-3 md:p-4 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors cursor-pointer relative group
                                                ${!n.is_read ? 'bg-blue-50/30' : ''}
                                            `}
                                        >
                                            {!n.is_read && (
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                                            )}
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-[11px] mb-1 leading-tight ${!n.is_read ? 'font-black text-slate-900' : 'font-bold text-slate-600'}`}>
                                                        {n.message}
                                                    </p>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                                                        {new Date(n.createdAt).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={(e) => handleToggleRead(e, n)}
                                                    className={`p-1 rounded-lg transition-all opacity-0 group-hover:opacity-100 
                                                        ${n.is_read ? 'text-slate-300 hover:text-blue-500 hover:bg-blue-50' : 'text-blue-500 hover:bg-blue-100'}
                                                    `}
                                                    title={n.is_read ? "Mark as unread" : "Mark as read"}
                                                >
                                                    <Check className={`w-3 h-3 ${n.is_read ? '' : 'stroke-[3px]'}`} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 md:gap-4 md:pl-4 md:border-l border-slate-100">
                    <div className="text-right hidden lg:block min-w-0">
                        <p className="text-[11px] font-black text-slate-800 leading-none truncate">
                            {user ? `${user.first_name || 'User'} ${user.last_name || ''}` : 'Loading...'}
                        </p>
                        <p className="text-[9px] text-blue-600 mt-0.5 font-bold uppercase tracking-wider">
                            @{user?.username || 'user'}
                        </p>
                    </div>

                    {/* User Initials Circle */}
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-md ring-2 ring-white text-[10px] md:text-xs font-black">
                        {getInitials()}
                    </div>

                    {!!(user?.role === 'administrator' ||
                        hasPermission('users.view') ||
                        hasPermission('roles.view') ||
                        hasPermission('companies.view')) && (
                            <Link
                                href="/dashboard/settings"
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-all"
                                title="Konfigurasi Sistem"
                            >
                                <Settings className="w-4 h-4" />
                            </Link>
                        )}

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 text-[9px] md:text-[10px] font-black text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 border border-transparent hover:border-red-100 uppercase"
                        title="Sign Out"
                    >
                        <LogOut className="w-3 h-3 md:w-3.5 h-3.5" />
                        <span className="hidden lg:inline">Log Out</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
