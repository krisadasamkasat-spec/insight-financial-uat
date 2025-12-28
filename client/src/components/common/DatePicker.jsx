import React, { useState, useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import CalendarHub from '../finance/CalendarHub';

/**
 * Date Picker component using CalendarHub
 * @param {Object} props
 * @param {string} props.label - Optional label text
 * @param {string} props.value - Current date value (YYYY-MM-DD format)
 * @param {Function} props.onChange - Callback with date string (YYYY-MM-DD)
 * @param {boolean} props.hasError - Show error state
 * @param {boolean} props.disablePast - Disable past dates (default: true)
 * @param {string} props.minDate - Minimum selectable date (YYYY-MM-DD format, optional)
 * @param {string} props.colorTheme - CalendarHub color theme
 * @param {boolean} props.dropUp - Show calendar above input (default: true)
 */
const DatePicker = ({
    label,
    value,
    onChange,
    hasError = false,
    disablePast = true,
    minDate = null,
    colorTheme = 'blue',
    dropUp = true
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const pickerRef = useRef(null);

    // Close picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Format date for display
    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // Convert string to Date object
    const selectedDate = value ? new Date(value) : null;
    const minDateObj = minDate ? new Date(minDate) : null;

    // Handle date selection
    const handleDateSelect = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        onChange(`${year}-${month}-${day}`);
        setIsOpen(false);
    };

    return (
        <div className="w-full" ref={pickerRef}>
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
                    <span className={value ? 'text-gray-900' : 'text-gray-400'}>
                        {value ? formatDisplayDate(value) : 'เลือกวันที่...'}
                    </span>
                    <Calendar className="w-4 h-4 text-gray-400" />
                </button>

                {isOpen && (
                    <div className={`absolute left-0 bg-white rounded-xl shadow-lg border border-gray-200 p-3 z-50 min-w-[280px] ${dropUp ? 'bottom-full mb-1' : 'top-full mt-1'
                        }`}>
                        <CalendarHub
                            selectedDate={selectedDate}
                            onDateSelect={handleDateSelect}
                            disablePast={disablePast}
                            minDate={minDateObj}
                            size="sm"
                            colorTheme={colorTheme}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default DatePicker;
