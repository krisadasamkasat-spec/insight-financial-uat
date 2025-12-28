import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

const MinimalDropdown = ({ label, value, options, onChange, allLabel = "ทั้งหมด" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const buttonRef = useRef(null);
    // Generate unique ID for this instance
    const [dropdownId] = useState(() => 'minimal-dropdown-portal-' + Math.random().toString(36).substr(2, 9));

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (buttonRef.current && !buttonRef.current.contains(event.target)) {
                const portal = document.getElementById(dropdownId);
                if (portal && portal.contains(event.target)) return;
                setIsOpen(false);
            }
        };

        const handleScroll = (event) => {
            // Check if scrolling inside the dropdown itself
            const portal = document.getElementById(dropdownId);
            if (portal && portal.contains(event.target)) return;

            // Close if scrolling outside (parent scroll)
            setIsOpen(false);
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', handleScroll, true);
            window.addEventListener('resize', () => setIsOpen(false));
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', () => setIsOpen(false));
        };
    }, [isOpen, dropdownId]);

    // Calculate position when opening
    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX
            });
        }
    }, [isOpen]);

    const displayValue = value === 'all' ? allLabel : value;

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">{label}:</span>
            <div className="relative">
                <button
                    ref={buttonRef}
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-all ${isOpen
                        ? 'text-gray-900 border-gray-400 bg-gray-50'
                        : 'text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                >
                    <span className="font-medium">{displayValue}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && createPortal(
                    <div
                        id={dropdownId}
                        className="fixed bg-white rounded-md shadow-lg border border-gray-200 py-1 z-[9999] overflow-hidden min-w-[130px]"
                        style={{
                            top: position.top - window.scrollY,
                            left: position.left
                        }}
                    >
                        <button
                            onClick={() => { onChange('all'); setIsOpen(false); }}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${value === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            {allLabel}
                        </button>
                        {options.map(option => (
                            <button
                                key={option}
                                onClick={() => { onChange(option); setIsOpen(false); }}
                                className={`w-full text-left px-4 py-2 text-sm transition-colors ${value === option
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>,
                    document.body
                )}
            </div>
        </div>
    );
};

export default MinimalDropdown;
