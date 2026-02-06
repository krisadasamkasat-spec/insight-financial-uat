import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MapPin, Calendar as CalendarIcon, ArrowRight } from 'lucide-react';
import { projectAPI } from '../services/api';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const MONTHS_TH = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

const WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

// Project Type Colors (match database project_types.name)
const PROJECT_TYPE_COLORS = {
    'Consult': { bg: 'bg-sky-100', text: 'text-sky-700', dot: '#38BDF8', border: 'border-sky-200' },
    'In-House': { bg: 'bg-purple-100', text: 'text-purple-700', dot: '#A78BFA', border: 'border-purple-200' },
    'Public': { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: '#34D399', border: 'border-emerald-200' },
};

const getProjectTypeColor = (type) => {
    return PROJECT_TYPE_COLORS[type] || { bg: 'bg-gray-100', text: 'text-gray-600', dot: '#9CA3AF', border: 'border-gray-200' };
};

const Calendar = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [selectedDate, setSelectedDate] = useState(today);
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch events
    useEffect(() => {
        const fetchEvents = async () => {
            setIsLoading(true);
            try {
                const res = await projectAPI.getCalendarEvents();
                setEvents(res.data || []);
            } catch (err) {
                console.error('Failed to fetch calendar events:', err);
                setEvents([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchEvents();
    }, []);

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

    // Group events by date (expand multi-day events)
    const eventsByDate = useMemo(() => {
        const map = {};
        events.forEach(event => {
            // Parse UTC date string to Local Date
            let startStr, endStr;

            try {
                if (event.start_date) {
                    startStr = format(parseISO(event.start_date), 'yyyy-MM-dd');
                } else {
                    return; // Skip if no start date
                }

                if (event.end_date) {
                    endStr = format(parseISO(event.end_date), 'yyyy-MM-dd');
                } else {
                    endStr = startStr;
                }
            } catch (e) {
                console.error("Date parsing error", event);
                return;
            }

            // If same day, just add once
            if (startStr === endStr) {
                if (!map[startStr]) map[startStr] = [];
                // Avoid duplicates
                if (!map[startStr].find(e => e.id === event.id)) {
                    map[startStr].push(event);
                }
            } else {
                // Multi-day event: iterate through each day
                const start = parseISO(event.start_date);
                const end = parseISO(event.end_date || event.start_date);
                const current = new Date(start);

                // Iterate using date objects to handle month crossings correctly
                while (current <= end) {
                    const key = format(current, 'yyyy-MM-dd');
                    if (!map[key]) map[key] = [];
                    // Avoid duplicates
                    if (!map[key].find(e => e.id === event.id)) {
                        map[key].push(event);
                    }
                    current.setDate(current.getDate() + 1);
                }
            }
        });
        return map;
    }, [events]);

    // Helper to format date as local YYYY-MM-DD (avoids timezone shift)
    const toLocalDateKey = (d) => {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    // Get events for selected date
    const selectedDateEvents = useMemo(() => {
        const key = toLocalDateKey(selectedDate);
        return eventsByDate[key] || [];
    }, [selectedDate, eventsByDate]);

    const isSameDay = (d1, d2) => {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    };

    const isSameMonth = (d1, d2) => {
        return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
    };

    const getEventsForDay = (day) => {
        const key = toLocalDateKey(day);
        return eventsByDate[key] || [];
    };

    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    const goToToday = () => {
        setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
        setSelectedDate(today);
    };

    // Get unique project types for events on a day (for dots)
    const getEventDots = (day) => {
        const dayEvents = getEventsForDay(day);
        const types = [...new Set(dayEvents.map(e => e.project_type))];
        return types.slice(0, 3); // Max 3 dots
    };

    return (
        <div className="max-w-[1400px] mx-auto p-4 md:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                        <CalendarIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">ปฏิทินโปรเจค</h1>
                        <p className="text-sm text-gray-500">ดูวันดำเนินการของโปรเจคทั้งหมด</p>
                    </div>
                </div>
                <button
                    onClick={goToToday}
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                    วันนี้
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    {/* Month Navigation */}
                    <div className="flex justify-between items-center mb-6">
                        <button
                            onClick={prevMonth}
                            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-gray-800">
                                {MONTHS_TH[currentMonth.getMonth()]} {currentMonth.getFullYear() + 543}
                            </h2>
                            <p className="text-xs text-gray-400">
                                {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                            </p>
                        </div>
                        <button
                            onClick={nextMonth}
                            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 mb-2">
                        {WEEKDAYS.map((day, idx) => (
                            <div
                                key={day}
                                className={`text-center text-sm font-medium py-2 ${idx === 0 ? 'text-red-400' : idx === 6 ? 'text-blue-400' : 'text-gray-400'}`}
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, index) => {
                            const isCurrentMonth = isSameMonth(day, currentMonth);
                            const isToday = isSameDay(day, today);
                            const isSelected = isSameDay(day, selectedDate);
                            const dayEvents = getEventsForDay(day);
                            const hasEvents = dayEvents.length > 0;
                            const dots = getEventDots(day);

                            return (
                                <button
                                    key={index}
                                    onClick={() => setSelectedDate(day)}
                                    className={`
                                        relative h-16 rounded-xl transition-all flex flex-col items-center justify-start pt-2
                                        ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
                                        ${isToday && !isSelected ? 'ring-2 ring-blue-300 bg-blue-50/50' : ''}
                                        ${isSelected ? 'bg-blue-500 text-white shadow-lg' : 'hover:bg-gray-50'}
                                        ${hasEvents && !isSelected ? 'bg-gray-50' : ''}
                                    `}
                                >
                                    <span className={`text-sm font-medium ${isToday && !isSelected ? 'text-blue-600 font-bold' : ''}`}>
                                        {day.getDate()}
                                    </span>

                                    {/* Event Dots */}
                                    {hasEvents && (
                                        <div className="flex gap-0.5 mt-1">
                                            {dots.map((type, i) => {
                                                const colors = getProjectTypeColor(type);
                                                return (
                                                    <span
                                                        key={i}
                                                        className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/80' : ''}`}
                                                        style={{ backgroundColor: isSelected ? undefined : colors.dot }}
                                                    />
                                                );
                                            })}
                                            {dayEvents.length > 3 && (
                                                <span className={`text-[8px] ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                                                    +{dayEvents.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Selected Date Events */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">
                                {selectedDate.getDate()} {MONTHS_TH[selectedDate.getMonth()]}
                            </h3>
                            <p className="text-xs text-gray-400">
                                {format(selectedDate, 'EEEE', { locale: th })}
                            </p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${selectedDateEvents.length > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                            {selectedDateEvents.length} โปรเจค
                        </span>
                    </div>

                    {isLoading ? (
                        <div className="py-8 text-center text-gray-400">
                            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                            กำลังโหลด...
                        </div>
                    ) : selectedDateEvents.length === 0 ? (
                        <div className="py-12 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                <CalendarIcon className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="text-gray-400 text-sm">ไม่มีโปรเจคในวันนี้</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                            {selectedDateEvents.map((event, idx) => {
                                const colors = getProjectTypeColor(event.project_type);
                                return (
                                    <Link
                                        key={`${event.id}-${idx}`}
                                        to={`/projects/${event.project_code}`}
                                        className="block p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span
                                                        className="w-2 h-2 rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: colors.dot }}
                                                    />
                                                    <span className="text-xs font-mono text-gray-400">{event.project_code}</span>
                                                </div>
                                                <h4 className="font-semibold text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                                                    {event.display_name}
                                                </h4>
                                                {event.location && (
                                                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                                                        <MapPin className="w-3 h-3" />
                                                        <span className="truncate">{event.location}</span>
                                                    </div>
                                                )}
                                                {event.date_description && (
                                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{event.date_description}</p>
                                                )}
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0 ml-2" />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Calendar;
