import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

/**
 * Unified Dropdown Component
 * Single source of truth for all dropdown styling
 * 
 * @param {Object} props
 * @param {string} props.label - Label text
 * @param {string} props.value - Current selected value
 * @param {Array} props.options - Array of {value, label} or strings
 * @param {Function} props.onChange - Callback with selected value
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.hasError - Show error state
 * @param {boolean} props.disabled - Disable the dropdown
 * 
 * Size Props (flexible sizing):
 * @param {string} props.width - Button width: 'auto', 'full', or CSS value like '200px'
 * @param {string} props.minWidth - Minimum width for button (default: '80px')
 * @param {string} props.maxWidth - Maximum width for button (optional)
 * @param {string} props.listWidth - Dropdown list width: 'auto', 'match', or CSS value (default: 'match')
 * @param {string} props.listMinWidth - Minimum width for list (default: '150px')
 * @param {string} props.listMaxWidth - Maximum width for list (optional)
 * 
 * @param {boolean} props.showAllOption - Show "All" option at top
 * @param {string} props.allLabel - Label for all option (default: 'ทั้งหมด')
 * @param {boolean} props.inline - Show label inline with button (like filters)
 */
const Dropdown = ({
    label,
    value,
    options = [],
    onChange,
    placeholder = 'เลือก...',
    hasError = false,
    disabled = false,
    // Size props
    width = 'auto',
    minWidth = '80px',
    maxWidth,
    listWidth = 'auto',
    listMinWidth = '150px',
    listMaxWidth = '350px',
    // Features
    showAllOption = false,
    allLabel = 'ทั้งหมด',
    inline = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
    const buttonRef = useRef(null);
    const listRef = useRef(null);
    const [dropdownId] = useState(() => 'dropdown-' + Math.random().toString(36).substr(2, 9));

    // Normalize options to {value, label}
    const normalizedOptions = options.map(opt =>
        typeof opt === 'string' ? { value: opt, label: opt } : opt
    );

    // Find current option
    const currentOption = value === 'all'
        ? { value: 'all', label: allLabel }
        : normalizedOptions.find(opt => opt.value === value);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (buttonRef.current?.contains(e.target)) return;
            if (listRef.current?.contains(e.target)) return;
            setIsOpen(false);
        };

        const handleEscape = (e) => {
            if (e.key === 'Escape') setIsOpen(false);
        };

        const handleScroll = (e) => {
            // Don't close if scrolling inside the dropdown list
            if (listRef.current?.contains(e.target)) return;
            setIsOpen(false);
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
            window.addEventListener('scroll', handleScroll, true);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [isOpen]);

    // Calculate position for portal
    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const itemHeight = 40;
            const totalItems = normalizedOptions.length + (showAllOption ? 1 : 0);
            const dropdownHeight = Math.min(totalItems * itemHeight + 16, 280);
            const spaceBelow = window.innerHeight - rect.bottom;

            setPosition({
                top: spaceBelow >= dropdownHeight ? rect.bottom + 8 : rect.top - dropdownHeight - 8,
                left: rect.left,
                width: rect.width,
                buttonWidth: rect.width // Store button width for list matching
            });
        }
    }, [isOpen, normalizedOptions.length, showAllOption]);

    // Handle selection
    const handleSelect = (optValue) => {
        onChange(optValue);
        setIsOpen(false);
    };

    // Calculate button style
    const getButtonStyle = () => {
        const style = {};
        if (width !== 'auto' && width !== 'full') {
            style.width = width;
        }
        if (minWidth) style.minWidth = minWidth;
        if (maxWidth) style.maxWidth = maxWidth;
        return style;
    };

    // Calculate list style
    const getListStyle = () => {
        const style = {
            top: position.top,
            left: position.left
        };

        if (listWidth === 'match') {
            style.width = position.buttonWidth;
        } else if (listWidth !== 'auto') {
            style.width = listWidth;
        }

        if (listMinWidth) style.minWidth = listMinWidth;
        if (listMaxWidth) style.maxWidth = listMaxWidth;

        return style;
    };

    // Dropdown list content
    const renderList = () => (
        <div
            ref={listRef}
            id={dropdownId}
            className="fixed bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-[9999] max-h-[280px] overflow-y-auto"
            style={getListStyle()}
        >
            {showAllOption && (
                <button
                    type="button"
                    onClick={() => handleSelect('all')}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${value === 'all'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                        }`}
                >
                    {allLabel}
                </button>
            )}
            {normalizedOptions.map((option, index) => (
                <button
                    key={option.value ?? index}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${value === option.value
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                        }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );

    const displayText = currentOption?.label || placeholder;
    const hasValue = !!currentOption;

    // Inline layout (label: [button])
    if (inline) {
        return (
            <div className="flex items-center gap-2">
                {label && <span className="text-sm text-gray-500 whitespace-nowrap">{label}:</span>}
                <div className="relative">
                    <button
                        ref={buttonRef}
                        type="button"
                        onClick={() => !disabled && setIsOpen(!isOpen)}
                        disabled={disabled}
                        style={getButtonStyle()}
                        className={`flex items-center justify-between gap-2 px-3 py-2 text-sm rounded-lg border transition-all ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' :
                            hasError ? 'border-red-400 bg-red-50' :
                                isOpen ? 'border-blue-400 bg-blue-50/50 ring-2 ring-blue-100' :
                                    'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                            }`}
                    >
                        <span className={`font-medium truncate ${hasValue ? 'text-gray-900' : 'text-gray-400'}`}>
                            {displayText}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && createPortal(renderList(), document.body)}
                </div>
            </div>
        );
    }

    // Standard layout (label above button)
    return (
        <div className={width === 'full' ? 'w-full' : ''}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {label}
                </label>
            )}
            <div className="relative">
                <button
                    ref={buttonRef}
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                    style={getButtonStyle()}
                    className={`flex items-center justify-between gap-2 px-3 py-2.5 text-sm rounded-xl border transition-all ${width === 'full' ? 'w-full' : ''
                        } ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-100 border-gray-200' :
                            hasError ? 'border-red-400 bg-red-50' :
                                isOpen ? 'border-blue-400 bg-blue-50/30 ring-2 ring-blue-100' :
                                    'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                >
                    <span className={`truncate ${hasValue ? 'text-gray-900' : 'text-gray-400'}`}>
                        {displayText}
                    </span>
                    {!disabled && (
                        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    )}
                </button>
                {isOpen && createPortal(renderList(), document.body)}
            </div>
        </div>
    );
};

export default Dropdown;
