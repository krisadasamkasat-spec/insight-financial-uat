import React, { useState, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useClickOutside } from '../../hooks/useClickOutside';

/**
 * Unified Dropdown Component
 * Supports multiple variants for different use cases
 * 
 * @param {Object} props
 * @param {string} props.variant - 'minimal' (for filters) | 'form' (for form inputs)
 * @param {string} props.label - Label text (displayed inline for minimal, above for form)
 * @param {string} props.value - Current selected value
 * @param {Array} props.options - Array of {value, label} objects or simple strings
 * @param {Function} props.onChange - Callback with selected value
 * @param {string} props.placeholder - Placeholder text when no value selected
 * @param {boolean} props.hasError - Show error state (form variant only)
 * @param {string} props.colorTheme - 'blue' | 'green' | 'red' (default: 'blue')
 * @param {string} props.allLabel - Label for 'all' option (minimal variant only)
 * @param {boolean} props.showAllOption - Whether to show 'all' option (minimal variant only)
 */
const Dropdown = ({
    variant = 'form',
    label,
    value,
    options = [],
    onChange,
    placeholder = 'เลือก...',
    hasError = false,
    colorTheme = 'blue',
    allLabel = 'ทั้งหมด',
    showAllOption = true
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Use custom hook for click outside detection
    useClickOutside(dropdownRef, () => setIsOpen(false), isOpen);

    // Normalize options to {value, label} format
    const normalizedOptions = options.map(opt =>
        typeof opt === 'string' ? { value: opt, label: opt } : opt
    );

    // Find current display label
    const currentOption = normalizedOptions.find(opt => opt.value === value);

    // Theme colors for selected item
    const themeColors = {
        blue: 'bg-blue-600',
        green: 'bg-green-600',
        red: 'bg-red-600',
    };

    // ========== MINIMAL VARIANT ==========
    if (variant === 'minimal') {
        const displayValue = value === 'all' ? allLabel : (currentOption?.label || value);

        return (
            <div className="flex items-center gap-2">
                {label && <span className="text-sm text-gray-400">{label}:</span>}
                <div className="relative" ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-all ${isOpen
                            ? 'text-gray-900 border-gray-400 bg-gray-50'
                            : 'text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                    >
                        <span className="font-medium">{displayValue}</span>
                        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isOpen && (
                        <div className="absolute top-full left-0 mt-1 min-w-[130px] bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50 overflow-hidden">
                            {showAllOption && (
                                <button
                                    type="button"
                                    onClick={() => { onChange('all'); setIsOpen(false); }}
                                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${value === 'all'
                                        ? `${themeColors[colorTheme]} text-white`
                                        : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    {allLabel}
                                </button>
                            )}
                            {normalizedOptions.map((option, index) => (
                                <button
                                    key={option.value || index}
                                    type="button"
                                    onClick={() => { onChange(option.value); setIsOpen(false); }}
                                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${value === option.value
                                        ? `${themeColors[colorTheme]} text-white`
                                        : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ========== FORM VARIANT (default) ==========
    const displayLabel = currentOption ? currentOption.label : (value || placeholder);

    return (
        <div className="w-full" ref={dropdownRef}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg border transition-all text-left ${hasError
                        ? 'border-red-300 bg-red-50'
                        : isOpen
                            ? 'border-gray-400 bg-gray-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                >
                    <span className={currentOption ? 'text-gray-900' : 'text-gray-400'}>
                        {displayLabel}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 max-h-60 overflow-y-auto">
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
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dropdown;
