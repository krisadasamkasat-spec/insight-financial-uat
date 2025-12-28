import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Color theme configurations
const COLOR_THEMES = {
    blue: {
        selected: 'bg-blue-500 text-white hover:bg-blue-600',
        hover: 'hover:bg-blue-50',
        rangeStart: 'bg-gray-800 text-white',
        rangeEnd: 'bg-blue-500 text-white',
        range: 'bg-blue-50 text-blue-700',
    },
    amber: {
        selected: 'bg-amber-500 text-white hover:bg-amber-600',
        hover: 'hover:bg-amber-50',
        rangeStart: 'bg-gray-800 text-white',
        rangeEnd: 'bg-amber-500 text-white',
        range: 'bg-amber-50 text-amber-700',
    },
    emerald: {
        selected: 'bg-emerald-500 text-white hover:bg-emerald-600',
        hover: 'hover:bg-emerald-50',
        rangeStart: 'bg-gray-800 text-white',
        rangeEnd: 'bg-emerald-500 text-white',
        range: 'bg-emerald-50 text-emerald-700',
    },
    red: {
        selected: 'bg-red-500 text-white hover:bg-red-600',
        hover: 'hover:bg-red-50',
        rangeStart: 'bg-gray-800 text-white',
        rangeEnd: 'bg-red-500 text-white',
        range: 'bg-red-50 text-red-700',
    },
    purple: {
        selected: 'bg-purple-500 text-white hover:bg-purple-600',
        hover: 'hover:bg-purple-50',
        rangeStart: 'bg-gray-800 text-white',
        rangeEnd: 'bg-purple-500 text-white',
        range: 'bg-purple-50 text-purple-700',
    },
};

/**
 * Reusable CalendarHub Component
 * 
 * @param {Object} props
 * @param {Date} props.selectedDate - Currently selected date
 * @param {Function} props.onDateSelect - Callback when a date is selected (receives Date object)
 * @param {Date} props.startDate - Optional start date for range selection
 * @param {Date} props.endDate - Optional end date for range selection
 * @param {boolean} props.disablePast - If true, disables dates before today (default: true)
 * @param {Date} props.minDate - Optional minimum selectable date (overrides disablePast)
 * @param {boolean} props.showRangeHighlight - If true, highlights range between startDate and endDate
 * @param {Object} props.customDayContent - Optional function to render custom content on specific days
 * @param {string} props.size - 'sm' | 'md' | 'lg' (default: 'md')
 * @param {Date} props.initialMonth - Initial month to display (default: current month)
 * @param {string} props.colorTheme - 'blue' | 'amber' | 'emerald' | 'red' | 'purple' (default: 'blue')
 */
const CalendarHub = ({
    selectedDate = null,
    onDateSelect,
    startDate = null,
    endDate = null,
    disablePast = true,
    minDate = null,
    showRangeHighlight = false,
    customDayContent = null,
    size = 'md',
    initialMonth = null,
    colorTheme = 'blue',
}) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [currentMonth, setCurrentMonth] = useState(() => {
        if (initialMonth) return new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1);
        return new Date(today.getFullYear(), today.getMonth(), 1);
    });

    // Get color theme
    const theme = COLOR_THEMES[colorTheme] || COLOR_THEMES.blue;

    // Size configurations
    const sizeConfig = {
        sm: { cell: 'h-8', text: 'text-[10px]', header: 'text-xs', weekday: 'text-[9px]', gap: 'gap-0.5' },
        md: { cell: 'h-10', text: 'text-sm', header: 'text-sm', weekday: 'text-xs', gap: 'gap-1' },
        lg: { cell: 'h-12', text: 'text-base', header: 'text-base', weekday: 'text-sm', gap: 'gap-1.5' },
    };
    const config = sizeConfig[size] || sizeConfig.md;

    // Generate calendar days
    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const startDayOfWeek = firstDayOfMonth.getDay();
        const startDateCalendar = new Date(firstDayOfMonth);
        startDateCalendar.setDate(firstDayOfMonth.getDate() - startDayOfWeek);

        const days = [];
        const _d = new Date(startDateCalendar);
        for (let i = 0; i < 42; i++) {
            days.push(new Date(_d));
            _d.setDate(_d.getDate() + 1);
        }
        return days;
    }, [currentMonth]);

    // Helper functions
    const isSameDay = (d1, d2) => {
        if (!d1 || !d2) return false;
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    };

    const isSameMonth = (d1, d2) => {
        return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
    };

    const isDateInRange = (target, start, end) => {
        if (!start) return false;
        const t = new Date(target).setHours(0, 0, 0, 0);
        const s = new Date(start).setHours(0, 0, 0, 0);
        const e = end ? new Date(end).setHours(0, 0, 0, 0) : s;
        return t >= Math.min(s, e) && t <= Math.max(s, e);
    };

    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

    const handleDateClick = (day) => {
        const dayTime = new Date(day).setHours(0, 0, 0, 0);

        // Check minDate first (has higher priority)
        if (minDate) {
            const minTime = new Date(minDate).setHours(0, 0, 0, 0);
            if (dayTime < minTime) return;
        } else if (disablePast) {
            // Only check disablePast if minDate is not set
            const todayTime = today.getTime();
            if (dayTime < todayTime) return;
        }

        if (onDateSelect) {
            onDateSelect(day);
        }
    };

    return (
        <div className="w-full font-sans">
            {/* Calendar Navigation */}
            <div className="flex justify-between items-center mb-3">
                <button
                    type="button"
                    onClick={prevMonth}
                    className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                >
                    <ChevronLeft className="w-[18px] h-[18px]" />
                </button>
                <span className={`font-semibold text-gray-800 ${config.header}`}>
                    {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
                <button
                    type="button"
                    onClick={nextMonth}
                    className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                >
                    <ChevronRight className="w-[18px] h-[18px]" />
                </button>
            </div>

            {/* Calendar Grid */}
            <div className="select-none">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 mb-1">
                    {WEEKDAYS.map(day => (
                        <div key={day} className={`text-center font-medium text-gray-400 py-2 ${config.weekday}`}>
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className={`grid grid-cols-7 ${config.gap}`}>
                    {calendarDays.map((day, index) => {
                        const dayTime = new Date(day).setHours(0, 0, 0, 0);
                        const todayTime = today.getTime();
                        const minTime = minDate ? new Date(minDate).setHours(0, 0, 0, 0) : null;
                        const isPast = minTime ? dayTime < minTime : (disablePast && dayTime < todayTime);
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        const isSelected = isSameDay(day, selectedDate);
                        const isToday = isSameDay(day, today);
                        const isInRange = showRangeHighlight && startDate && isDateInRange(day, startDate, endDate || startDate);
                        const isRangeStart = showRangeHighlight && isSameDay(day, startDate);
                        const isRangeEnd = showRangeHighlight && endDate && isSameDay(day, endDate);

                        // Determine styles using theme colors
                        let bgClass = '';
                        let textClass = 'text-gray-700';

                        if (!isCurrentMonth) {
                            textClass = 'text-gray-300';
                        } else if (isPast) {
                            textClass = 'text-gray-300';
                        }

                        if (isSelected) {
                            bgClass = theme.selected;
                            textClass = '';
                        } else if (isRangeStart) {
                            bgClass = theme.rangeStart;
                            textClass = '';
                        } else if (isRangeEnd) {
                            bgClass = theme.rangeEnd;
                            textClass = '';
                        } else if (isInRange) {
                            bgClass = theme.range;
                            textClass = '';
                        } else if (isToday) {
                            bgClass = 'bg-gray-100';
                            textClass = 'text-gray-900';
                        }

                        const customContent = customDayContent ? customDayContent(day) : null;

                        return (
                            <button
                                key={index}
                                onClick={() => !isPast && handleDateClick(day)}
                                disabled={isPast}
                                className={`
                                    ${config.cell} ${config.text}
                                    rounded-lg font-medium transition-all relative
                                    flex flex-col items-center justify-center
                                    ${isPast ? 'cursor-not-allowed' : `${theme.hover} cursor-pointer`}
                                    ${bgClass} ${textClass}
                                `}
                            >
                                <span>{day.getDate()}</span>
                                {customContent}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CalendarHub;
