'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, Package } from 'lucide-react';

interface MasterItem {
    code: string;
    name: string;
    price: number;
    description: string;
}

interface ItemSelectorProps {
    onSelect: (item: MasterItem) => void;
    authenticatedFetch: (url: string, options?: any) => Promise<Response>;
    placeholder?: string;
    initialValue?: string;
    disabled?: boolean;
}

export default function ItemSelector({ onSelect, authenticatedFetch, placeholder = 'Ketik Nama Barang...', initialValue = '', disabled = false }: ItemSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState(initialValue);
    const [items, setItems] = useState<MasterItem[]>([]);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    // Initial search or idle search (top 10)
    const fetchItems = useCallback(async (searchQuery: string) => {
        setLoading(true);
        try {
            // Simulate SOLR searching via logging is done in backend
            const response = await authenticatedFetch(`/api/master-data/items?search=${encodeURIComponent(searchQuery)}&limit=10`);
            if (response.ok) {
                const data = await response.json();
                console.log(`[FRONTEND] SOLR Search Result: ${data.length} items found.`);
                setItems(data);
            }
        } catch (error) {
            console.error('Error fetching items:', error);
        } finally {
            setLoading(false);
        }
    }, [authenticatedFetch]);

    useEffect(() => {
        if (isOpen && items.length === 0 && !query) {
            fetchItems('');
        }
    }, [isOpen, items.length, query, fetchItems]);

    useEffect(() => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        if (isOpen && query.length >= 3) {
            debounceTimer.current = setTimeout(() => {
                console.log(`[FRONTEND] Triggering SOLR search for: "${query}"`);
                fetchItems(query);
            }, 300);
        } else if (query.length < 3) {
            setItems([]);
        }

        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, [query, isOpen, fetchItems]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

    const updateCoords = useCallback(() => {
        if (wrapperRef.current) {
            const rect = wrapperRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            updateCoords();
            window.addEventListener('scroll', updateCoords, true);
            window.addEventListener('resize', updateCoords);
        }
        return () => {
            window.removeEventListener('scroll', updateCoords, true);
            window.removeEventListener('resize', updateCoords);
        };
    }, [isOpen, updateCoords]);

    const handleSelect = (item: MasterItem) => {
        setQuery(item.name);
        onSelect(item);
        setIsOpen(false);
    };

    const dropdown = (
        <div
            style={{
                position: 'absolute',
                top: coords.top + 8,
                left: typeof window !== 'undefined' && coords.left + 400 > window.innerWidth ? Math.max(0, window.innerWidth - 420) : coords.left,
                width: typeof window !== 'undefined' && window.innerWidth < 640 ? coords.width : Math.max(coords.width, 400),
                maxWidth: 'calc(100vw - 32px)',
                zIndex: 9999
            }}
            className="bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ring-1 ring-black/5"
        >
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Package className="w-3 h-3 text-blue-500" /> Katalog Barang
                </span>
                {loading && <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />}
            </div>
            <ul className="max-h-[300px] overflow-y-auto custom-scrollbar">
                {query.length < 3 ? (
                    <li className="px-4 py-6 text-center text-slate-400 text-[11px] italic">
                        Masukkan minimal 3 huruf untuk mencari...
                    </li>
                ) : items.length === 0 && !loading ? (
                    <li className="px-4 py-8 text-center text-slate-400 text-xs italic">
                        Barang "{query}" tidak ditemukan...
                    </li>
                ) : (
                    items.map((item) => (
                        <li
                            key={item.code}
                            className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors border-b border-slate-50 last:border-none group"
                            onMouseDown={() => handleSelect(item)}
                        >
                            <div className="flex flex-col gap-1">
                                <span className="text-sm md:text-base text-slate-800 font-bold uppercase group-hover:text-blue-600 transition-colors">{item.name}</span>
                                <div className="flex justify-between items-center gap-4">
                                    <span className="text-[10px] md:text-xs font-mono text-slate-400">{item.code}</span>
                                    <span className="text-xs md:text-sm font-black text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">Rp {item.price.toLocaleString()}</span>
                                </div>
                            </div>
                        </li>
                    ))
                )}
            </ul>
        </div>
    );

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </div>
                <input
                    type="text"
                    disabled={disabled}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:bg-slate-50 uppercase tracking-tight font-medium"
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => {
                        if (!disabled) setIsOpen(true);
                    }}
                />
            </div>

            {isOpen && !disabled && query.length >= 3 && typeof document !== 'undefined' &&
                require('react-dom').createPortal(dropdown, document.body)
            }
        </div>
    );
}
