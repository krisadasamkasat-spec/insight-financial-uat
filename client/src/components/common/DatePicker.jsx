import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar } from 'lucide-react';
import CalendarHub from '../finance/CalendarHub';
import { formatDateCE } from '../../utils/formatters';

/**
 * Date Picker component using CalendarHub with Portal for overflow safety
 */
const DatePicker = ({
    label,
    value,
    onChange,
    hasError = false,
    disablePast = true,
    minDate = null,
    colorTheme = 'blue'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
    const buttonRef = useRef(null);
    const calendarRef = useRef(null);

    // Format date for display
    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return '';
        // Use common formatter for Thai Date with CE Year (e.g., 1 ก.พ. 2026)
        return formatDateCE(dateStr);
    };

    // Calculate position
    const updatePosition = () => {
        if (buttonRef.current && isOpen) {
            const rect = buttonRef.current.getBoundingClientRect();
            // Check potential overflow at bottom
            const viewportHeight = window.innerHeight;
            const spaceBelow = viewportHeight - rect.bottom;
            const spaceAbove = rect.top;
            const calendarHeight = 350; // Approx height

            let top = rect.bottom + window.scrollY + 4;
            // If not enough space below and more space above, flip up
            if (spaceBelow < calendarHeight && spaceAbove > calendarHeight) {
                top = rect.top + window.scrollY - calendarHeight - 4;
            }

            setPosition({
                top: top,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    useLayoutEffect(() => {
        if (isOpen) {
            updatePosition();
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
        }
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen]);

    // Close picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if click is inside button
            if (buttonRef.current && buttonRef.current.contains(event.target)) {
                return;
            }
            // Check if click is inside calendar (portal)
            if (calendarRef.current && calendarRef.current.contains(event.target)) {
                return;
            }
            setIsOpen(false);
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleDateSelect = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        onChange(`${year}-${month}-${day}`);
        setIsOpen(false);
    };

    // Parse date string as local date to avoid timezone shift
    const parseLocalDate = (dateStr) => {
        if (!dateStr) return null;
        // Handle YYYY-MM-DD format
        const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
            return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
        }
        return new Date(dateStr);
    };

    const selectedDate = parseLocalDate(value);
    const minDateObj = parseLocalDate(minDate);

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
                        {value ? formatDisplayDate(value) : 'เลือกวันที่...'}
                    </span>
                    <Calendar className="w-4 h-4 text-gray-400" />
                </button>

                {isOpen && createPortal(
                    <div
                        ref={calendarRef}
                        style={{
                            position: 'absolute',
                            top: position.top,
                            left: position.left,
                            // minWidth: position.width, // Optional: match button width
                            zIndex: 9999
                        }}
                        className="bg-white rounded-xl shadow-xl border border-gray-200 p-3 min-w-[280px]"
                    >
                        <CalendarHub
                            selectedDate={selectedDate}
                            onDateSelect={handleDateSelect}
                            disablePast={disablePast}
                            minDate={minDateObj}
                            size="sm"
                            colorTheme={colorTheme}
                            initialMonth={selectedDate || minDateObj}
                            showTodayIndicator={true}
                        />
                    </div>,
                    document.body
                )}
            </div>
        </div>
    );
};

export default DatePicker;
