import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

import { useSettings } from '../../contexts/SettingsContext';

/**
 * Clickable status badge with dropdown for inline status updates
 * @param {Object} props
 * @param {string} props.status - Current status value
 * @param {Array} props.options - Array of {value, label, color} objects
 * @param {Function} props.onChange - Callback when status is changed
 * @param {boolean} props.readOnly - If true, badge is not clickable
 */
const StatusBadge = ({
    status,
    options = [],
    onChange,
    readOnly = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const buttonRef = useRef(null);
    const [dropdownId] = useState(() => 'status-badge-portal-' + Math.random().toString(36).substr(2, 9));

    // Use custom hook for click outside detection
    // Note: useClickOutside might contest with Portal if not ref aware?
    // Actually, useClickOutside usually binds to document.
    // But here we can use our manual logic similar to FormDropdown for consistency.

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (buttonRef.current && !buttonRef.current.contains(event.target)) {
                const portal = document.getElementById(dropdownId);
                if (portal && portal.contains(event.target)) return;
                setIsOpen(false);
            }
        };

        const handleScroll = (event) => {
            const portal = document.getElementById(dropdownId);
            if (portal && portal.contains(event.target)) return;
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

    // Calculate position
    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX
            });
        }
    }, [isOpen]);

    const { getTailwindColorClasses } = useSettings();

    // Find current option
    const currentOption = options.find(opt => opt.value === status) || {
        value: status,
        label: status,
        color: 'gray'
    };

    // Retrieve full Tailwind classes for the option's color
    const uiColors = getTailwindColorClasses(currentOption.color);
    // Construct the combined class string manually or use the properties from uiColors
    // uiColors returns { bg, text, dot, border }
    // The component uses: bg-XXX text-XXX border-XXX
    const badgeClasses = `${uiColors.bg} ${uiColors.text} ${uiColors.border}`;

    const handleSelect = (value) => {
        if (onChange) {
            onChange(value);
        }
        setIsOpen(false);
    };

    if (readOnly) {
        return (
            <span
                className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full border truncate max-w-[180px] align-middle ${badgeClasses}`}
                title={currentOption.value}
            >
                {currentOption.label}
            </span>
        );
    }

    return (
        <div className="relative inline-block align-middle">
            <button
                ref={buttonRef}
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`inline-flex items-center justify-between gap-1 px-2.5 py-1 text-xs font-medium rounded-full border cursor-pointer transition-all hover:ring-2 hover:ring-offset-1 hover:ring-gray-200 max-w-[180px] ${badgeClasses}`}
                title={currentOption.value}
            >
                <span className="truncate">{currentOption.label}</span>
                <ChevronDown className={`w-3 h-3 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && createPortal(
                <div
                    id={dropdownId}
                    className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[9999] min-w-[120px]"
                    style={{
                        top: position.top - window.scrollY,
                        left: position.left
                    }}
                >
                    {options.map((option) => {
                        const optColors = getTailwindColorClasses(option.color);
                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleSelect(option.value)}
                                className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center gap-2 ${status === option.value
                                    ? 'bg-gray-100 font-medium'
                                    : 'hover:bg-gray-50'
                                    }`}
                            >
                                <span className={`w-2 h-2 rounded-full ${optColors.dot}`}></span>
                                {option.label}
                            </button>
                        );
                    })}
                </div>,
                document.body
            )}
        </div>
    );
};

export default StatusBadge;
