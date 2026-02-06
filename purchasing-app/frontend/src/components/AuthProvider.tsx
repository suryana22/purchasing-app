'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
    id: number;
    username: string; // Changed from email to username
    first_name: string;
    last_name: string;
    role: string;
    permissions: string[];
}

interface AuthContextType {
    user: User | null;
    setUser: (user: User | null) => void;
    isLoading: boolean;
    logout: () => void;
    hasPermission: (permission: string) => boolean;
    authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadUser = () => {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    setUser(JSON.parse(userStr));
                } catch (error) {
                    console.error('Failed to parse user from localStorage', error);
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                }
            }
            setIsLoading(false);
        };

        loadUser();

        window.addEventListener('storage', (event) => {
            if (event.key === 'user') {
                loadUser();
            }
        });

        window.addEventListener('user-updated', loadUser);

        return () => {
            window.removeEventListener('storage', loadUser);
            window.removeEventListener('user-updated', loadUser);
        };
    }, []);

    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

    useEffect(() => {
        if (!user) return;

        let timeoutId: NodeJS.Timeout;

        const checkInactivity = () => {
            const lastActivity = parseInt(localStorage.getItem('lastActivity') || '0');
            const now = Date.now();

            if (now - lastActivity >= INACTIVITY_TIMEOUT) {
                console.log('Inactivity timeout reached. Logging out...');
                logout();
            } else {
                // Schedule next check based on remaining time
                const remainingTime = INACTIVITY_TIMEOUT - (now - lastActivity);
                if (timeoutId) clearTimeout(timeoutId);
                timeoutId = setTimeout(checkInactivity, Math.max(remainingTime, 1000));
            }
        };

        const updateActivity = () => {
            localStorage.setItem('lastActivity', Date.now().toString());
            checkInactivity();
        };

        // Events to track user activity
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

        events.forEach(event => {
            window.addEventListener(event, updateActivity);
        });

        // Listen for activity in other tabs
        const storageListener = (e: StorageEvent) => {
            if (e.key === 'lastActivity') {
                checkInactivity();
            }
        };
        window.addEventListener('storage', storageListener);

        // Initial setup
        if (!localStorage.getItem('lastActivity')) {
            localStorage.setItem('lastActivity', Date.now().toString());
        }
        checkInactivity();

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            events.forEach(event => {
                window.removeEventListener(event, updateActivity);
            });
            window.removeEventListener('storage', storageListener);
        };
    }, [user]);

    const logout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('lastActivity');
        setUser(null);
        window.location.href = '/';
    };

    const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
        const token = localStorage.getItem('token');

        const headers = new Headers(options.headers || {});
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }

        const response = await fetch(url, {
            ...options,
            headers
        });

        if (response.status === 401) {
            logout();
        } else if (response.status === 403) {
            const data = await response.clone().json();
            alert(data.error || 'Access Denied: You do not have permission to perform this action.');
        }

        return response;
    };

    const hasPermission = (permission: string) => {
        if (!user) return false;
        const role = user.role?.toLowerCase();
        if (role === 'administrator' || role === 'it support') return true;
        return user.permissions?.includes(permission) || false;
    };

    return (
        <AuthContext.Provider value={{ user, setUser, isLoading, logout, hasPermission, authenticatedFetch }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
