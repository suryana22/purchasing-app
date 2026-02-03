'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, ChevronsUpDown } from 'lucide-react';

interface ComboboxProps<T> {
    items: T[];
    itemToString: (item: T) => string;
    itemToKey: (item: T) => string | number;
    renderItem?: (item: T, isSelected: boolean) => React.ReactNode;
    onSelect: (item: T) => void;
    selectedItem?: T | null;
    customFilter?: (item: T, query: string) => boolean;
    placeholder?: string;
    className?: string;
}

export default function Combobox<T>({
    items,
    itemToString,
    itemToKey,
    renderItem,
    onSelect,
    selectedItem,
    customFilter,
    placeholder = 'Select...',
    className = ''
}: ComboboxProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Initialize/Update query when selectedItem changes
    useEffect(() => {
        if (selectedItem) {
            setQuery(itemToString(selectedItem));
        } else {
            setQuery('');
        }
    }, [selectedItem, itemToString]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                // On blur without selection, revert to selected item text
                if (selectedItem) {
                    setQuery(itemToString(selectedItem));
                } else {
                    setQuery('');
                }
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [selectedItem, itemToString]);

    const filteredItems = query === ''
        ? items
        : items.filter((item) => {
            if (customFilter) return customFilter(item, query);
            return itemToString(item).toLowerCase().includes(query.toLowerCase());
        });

    const handleSelect = (item: T) => {
        onSelect(item);
        setIsOpen(false);
        setQuery(itemToString(item));
        inputRef.current?.blur();
    };

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                />
                <div
                    className="absolute right-0 top-0 h-full w-10 flex items-center justify-center text-slate-400 cursor-pointer"
                    onClick={() => {
                        if (isOpen) {
                            setIsOpen(false);
                        } else {
                            inputRef.current?.focus();
                            setIsOpen(true);
                        }
                    }}
                >
                    <ChevronsUpDown className="w-4 h-4" />
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-[60] w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredItems.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-slate-500 text-center">
                            No items found.
                        </div>
                    ) : (
                        <ul className="py-1">
                            {filteredItems.map((item) => {
                                const key = itemToKey(item);
                                const isSelected = selectedItem ? itemToKey(selectedItem) === key : false;

                                return (
                                    <li
                                        key={key}
                                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 transition-colors
                                            ${isSelected ? 'bg-blue-50' : ''}
                                        `}
                                        onMouseDown={() => handleSelect(item)}
                                    >
                                        {renderItem ? (
                                            renderItem(item, isSelected)
                                        ) : (
                                            <div className="flex justify-between items-center">
                                                <span className={isSelected ? 'font-medium text-slate-900' : 'text-slate-700'}>
                                                    {itemToString(item)}
                                                </span>
                                                {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
