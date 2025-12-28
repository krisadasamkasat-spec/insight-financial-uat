import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';


/**
 * Form-optimized dropdown component based on MinimalDropdown
 * @param {Object} props
 * @param {string} props.label - Optional label text
 * @param {string} props.value - Current selected value
 * @param {Array} props.options - Array of {value, label} objects or simple strings
 * @param {Function} props.onChange - Callback with selected value
 * @param {boolean} props.hasError - Show error state
 * @param {string} props.colorTheme - 'blue' | 'green' | 'red' (default: 'blue')
 */
const FormDropdown = ({
    label,
    value,
    options = [],
    onChange,
    hasError = false,
    colorTheme = 'blue'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
    const buttonRef = useRef(null);
    // Generate unique ID for this instance
    const [dropdownId] = useState(() => 'dropdown-portal-' + Math.random().toString(36).substr(2, 9));

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
            window.addEventListener('scroll', handleScroll, true); // Capture phase to detect parent scrolls
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
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    }, [isOpen]);

    // Normalize options to {value, label} format
    const normalizedOptions = options.map(opt =>
        typeof opt === 'string' ? { value: opt, label: opt } : opt
    );

    // Find current display label
    const currentOption = normalizedOptions.find(opt => opt.value === value);
    const displayLabel = currentOption ? currentOption.label : value || 'เลือก...';

    // Theme colors for selected item
    const themeColors = {
        blue: 'bg-blue-600',
        green: 'bg-green-600',
        red: 'bg-red-600',
    };

    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}
            <div className="relative">
                <button
                    ref={buttonRef}
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg border transition-all text-left ${hasError
                        ? 'border-red-300 bg-red-50'
                        : isOpen
                            ? 'border-gray-400 bg-gray-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                >
                    <span className={value ? 'text-gray-900' : 'text-gray-400'}>
                        {displayLabel}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && createPortal(
                    <div
                        id={dropdownId}
                        className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[9999] max-h-60 overflow-y-auto"
                        style={{
                            top: position.top - window.scrollY, // Use fixed positioning relative to viewport
                            left: position.left, // Left is usually fine if within viewport
                            width: position.width,
                            // Basic viewport check could be added here but keeping simple for now
                        }}
                    >
                        {normalizedOptions.map((option, index) => (
                            <button
                                key={option.value || index}
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2 text-sm transition-colors ${value === option.value
                                    ? `${themeColors[colorTheme]} text-white`
                                    : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>,
                    document.body
                )}
            </div>
        </div>
    );
};

export default FormDropdown;
