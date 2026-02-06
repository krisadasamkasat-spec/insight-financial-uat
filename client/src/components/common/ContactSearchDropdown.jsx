import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, User, Building2, Phone, X } from 'lucide-react';
import api from '../../services/api';

/**
 * Contact Search Dropdown Component
 * Searchable dropdown for selecting contacts with auto-complete
 * 
 * @param {string} label - Label text
 * @param {Object} value - Selected contact object
 * @param {Function} onChange - Callback with selected contact
 * @param {Function} onClear - Callback when selection is cleared
 * @param {string} placeholder - Placeholder text
 * @param {boolean} disabled - Disable the dropdown
 * @param {string} width - Component width
 */
const ContactSearchDropdown = ({
    label,
    value,
    onChange,
    onClear,
    placeholder = 'ค้นหาคู่ค้า...',
    disabled = false,
    width = 'full'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const listRef = useRef(null);

    // Debounced search
    const searchContacts = useCallback(async (term) => {
        if (!term || term.length < 1) {
            setContacts([]);
            return;
        }

        setLoading(true);
        try {
            const response = await api.get(`/contacts?search=${encodeURIComponent(term)}`);
            setContacts(response.data || []);
        } catch (error) {
            console.error('Error searching contacts:', error);
            setContacts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isOpen && searchTerm) {
                searchContacts(searchTerm);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, isOpen, searchContacts]);

    // Load initial contacts when opened
    useEffect(() => {
        if (isOpen && !searchTerm) {
            searchContacts(''); // Load all or recent
            // Could also load all contacts here
            const loadInitial = async () => {
                setLoading(true);
                try {
                    const response = await api.get('/contacts');
                    setContacts(response.data?.slice(0, 10) || []);
                } catch (error) {
                    console.error('Error loading contacts:', error);
                }
                setLoading(false);
            };
            loadInitial();
        }
    }, [isOpen]);

    // Position calculation for portal
    useEffect(() => {
        if (isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const dropdownHeight = 300;

            setPosition({
                top: spaceBelow >= dropdownHeight ? rect.bottom + 4 : rect.top - dropdownHeight - 4,
                left: rect.left,
                width: rect.width
            });
        }
    }, [isOpen]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current?.contains(e.target)) return;
            if (listRef.current?.contains(e.target)) return;
            setIsOpen(false);
            setSearchTerm('');
        };

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    const handleSelect = (contact) => {
        onChange(contact);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onClear?.();
        setSearchTerm('');
    };

    const handleOpen = () => {
        if (!disabled) {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    // Render dropdown list
    const renderList = () => (
        <div
            ref={listRef}
            className="fixed bg-white rounded-xl shadow-xl border border-gray-200 z-[9999] overflow-hidden"
            style={{
                top: position.top,
                left: position.left,
                width: position.width,
                maxHeight: '300px'
            }}
        >
            {/* Search Input */}
            <div className="p-2 border-b border-gray-100">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="พิมพ์ชื่อ หรือ เลขประจำตัวผู้เสียภาษี..."
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        autoFocus
                    />
                </div>
            </div>

            {/* Results */}
            <div className="max-h-[220px] overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-6 text-gray-400">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                        <span className="ml-2 text-sm">กำลังค้นหา...</span>
                    </div>
                ) : contacts.length === 0 ? (
                    <div className="py-6 text-center text-gray-400 text-sm">
                        {searchTerm ? 'ไม่พบข้อมูล' : 'พิมพ์เพื่อค้นหา'}
                    </div>
                ) : (
                    contacts.map((contact) => (
                        <button
                            key={contact.id}
                            type="button"
                            onClick={() => handleSelect(contact)}
                            className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0"
                        >
                            <div className="flex items-start gap-3">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${contact.entity_type === 'juristic'
                                    ? 'bg-purple-100 text-purple-600'
                                    : 'bg-blue-100 text-blue-600'
                                    }`}>
                                    {contact.entity_type === 'juristic'
                                        ? <Building2 size={18} />
                                        : <User size={18} />
                                    }
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 truncate">
                                        {contact.name_th}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                        {contact.tax_id && (
                                            <span>ID: {contact.tax_id}</span>
                                        )}
                                        {contact.phone && (
                                            <span className="flex items-center gap-1">
                                                <Phone size={10} />
                                                {contact.phone}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );

    return (
        <div className={width === 'full' ? 'w-full' : ''}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {label}
                </label>
            )}
            <div ref={containerRef} className="relative">
                <div
                    onClick={handleOpen}
                    role="button"
                    tabIndex={disabled ? -1 : 0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleOpen(); }}
                    className={`flex items-center justify-between gap-2 px-3 py-2.5 text-sm rounded-xl border transition-all w-full cursor-pointer ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-100 border-gray-200' :
                        isOpen ? 'border-blue-400 bg-blue-50/30 ring-2 ring-blue-100' :
                            'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                >
                    {value ? (
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${value.entity_type === 'juristic'
                                ? 'bg-purple-100 text-purple-600'
                                : 'bg-blue-100 text-blue-600'
                                }`}>
                                {value.entity_type === 'juristic'
                                    ? <Building2 size={12} />
                                    : <User size={12} />
                                }
                            </div>
                            <span className="text-gray-900 truncate">{value.name_th}</span>
                        </div>
                    ) : (
                        <span className="text-gray-400 flex items-center gap-2">
                            <Search size={14} />
                            {placeholder}
                        </span>
                    )}
                    <div className="flex items-center gap-1 flex-shrink-0">
                        {value && !disabled && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                            >
                                <X size={14} className="text-gray-400" />
                            </button>
                        )}
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                </div>
                {isOpen && createPortal(renderList(), document.body)}
            </div>
        </div>
    );
};

export default ContactSearchDropdown;
