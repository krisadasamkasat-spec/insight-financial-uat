import React, { useState, useMemo, useEffect } from 'react';
import { Check } from 'lucide-react';
import { projectAPI } from "../../services/api"; // Import API
import CalendarHub from './CalendarHub';

const formatDateKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const isDateInRange = (target, start, end) => {
    if (!start) return false;
    const t = new Date(target).setHours(0, 0, 0, 0);
    const s = new Date(start).setHours(0, 0, 0, 0);
    const e = end ? new Date(end).setHours(0, 0, 0, 0) : s;
    return t >= Math.min(s, e) && t <= Math.max(s, e);
};

// Client-side color mapping since DB doesn't store colors yet
const getTypeStyle = (typeValue) => {
    const styles = {
        'Consult': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
        'In-House': { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500' },
        'Public': { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
        'Event': { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
        'Gift': { bg: 'bg-pink-50', text: 'text-pink-700', dot: 'bg-pink-500' },
        'R&D': { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
        'Other': { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500' }
    };
    return styles[typeValue] || { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-400' };
};

function FinancialCalendar({ onIncomeUpdate, incomes = [] }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [endDate, setEndDate] = useState(null);
    const [projectTypes, setProjectTypes] = useState([]);
    const [selectedTypes, setSelectedTypes] = useState([]);

    // Fetch Project Types
    useEffect(() => {
        const fetchTypes = async () => {
            try {
                const res = await projectAPI.getProjectTypes();
                const types = res.data;
                setProjectTypes(types);
                // Default select all
                setSelectedTypes(types.map(t => t.value));
            } catch (err) {
                console.error("Failed to load project types", err);
            }
        };
        fetchTypes();
    }, []);

    // Toggle a type filter
    const toggleTypeFilter = (typeValue) => {
        setSelectedTypes(prev => {
            if (prev.includes(typeValue)) {
                // Don't allow deselecting all - keep at least one
                if (prev.length === 1) return prev;
                return prev.filter(v => v !== typeValue);
            } else {
                return [...prev, typeValue];
            }
        });
    };

    // Get filtered incomes based on selected types
    const filteredIncomes = useMemo(() => {
        if (!incomes) return [];
        return incomes.filter(inc => selectedTypes.includes(inc.type || 'Other'));
    }, [selectedTypes, incomes]);

    // Get incomes grouped by date for efficient lookup (filtered)
    const incomesGrouped = useMemo(() => {
        const grouped = {};
        filteredIncomes.forEach(income => {
            if (!grouped[income.date]) {
                grouped[income.date] = [];
            }
            grouped[income.date].push(income);
        });
        return grouped;
    }, [filteredIncomes]);

    // Check future date
    const isFutureDateSelected = useMemo(() => {
        if (!endDate) return false;
        const endTime = new Date(endDate).setHours(0, 0, 0, 0);
        const todayTime = new Date(today).setHours(0, 0, 0, 0);
        return endTime > todayTime;
    }, [endDate, today]);

    // Calculate projected income
    const projectedIncome = useMemo(() => {
        if (!endDate || !isFutureDateSelected) return 0;
        const todayStart = new Date(today);
        todayStart.setHours(0, 0, 0, 0);

        return filteredIncomes.reduce((sum, item) => {
            const [y, m, d] = item.date.split('-').map(Number);
            const itemDate = new Date(y, m - 1, d);
            if (isDateInRange(itemDate, todayStart, endDate)) {
                return sum + item.amount;
            }
            return sum;
        }, 0);
    }, [endDate, today, isFutureDateSelected, filteredIncomes]);

    // Update parent
    useEffect(() => {
        if (onIncomeUpdate) {
            onIncomeUpdate(projectedIncome, isFutureDateSelected);
        }
    }, [projectedIncome, isFutureDateSelected, onIncomeUpdate]);

    // Custom day content
    const customDayContent = (day) => {
        const dateString = formatDateKey(day);
        const dayIncomes = incomesGrouped[dateString];

        if (!dayIncomes || dayIncomes.length === 0) return null;

        const totalDayIncome = dayIncomes.reduce((sum, inc) => sum + inc.amount, 0);

        const isStart = day.getFullYear() === today.getFullYear() &&
            day.getMonth() === today.getMonth() &&
            day.getDate() === today.getDate();
        const isEnd = endDate && day.getFullYear() === endDate.getFullYear() &&
            day.getMonth() === endDate.getMonth() &&
            day.getDate() === endDate.getDate();

        // Find dominant type
        const typeAmounts = {};
        dayIncomes.forEach(inc => {
            const t = inc.type || 'Other';
            typeAmounts[t] = (typeAmounts[t] || 0) + inc.amount;
        });

        // Find type with max amount
        let dominantType = Object.keys(typeAmounts).reduce((a, b) => typeAmounts[a] > typeAmounts[b] ? a : b);
        const style = getTypeStyle(dominantType);

        return (
            <div className="absolute -bottom-0.5 w-full text-center px-0.5">
                <div className="flex justify-center gap-0.5 mb-0.5">
                    {Object.keys(typeAmounts).map(t => {
                        const s = getTypeStyle(t);
                        return <div key={t} className={`w-1 h-1 rounded-full ${s.dot}`}></div>
                    })}
                </div>
                <div className={`text-[7px] font-bold truncate ${(isStart || isEnd) ? 'text-white' : style.text.replace('700', '500')}`}>
                    +{new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 0 }).format(totalDayIncome)}
                </div>
            </div>
        );
    };

    return (
        <div className="w-full pt-4 border-t border-gray-100 font-sans">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-gray-700">คาดการณ์รายรับ</h3>
            </div>

            {/* Filter Toggles */}
            <div className="flex flex-wrap gap-1.5 mb-4">
                {projectTypes.map(type => {
                    const isSelected = selectedTypes.includes(type.value);
                    const style = getTypeStyle(type.value);

                    return (
                        <button
                            key={type.value}
                            onClick={() => toggleTypeFilter(type.value)}
                            className={`
                                inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium
                                transition-all duration-200 ease-out
                                ${isSelected
                                    ? `${style.bg} ${style.text} shadow-sm hover:shadow-md hover:scale-[1.02]`
                                    : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-500'
                                }
                            `}
                            title={isSelected ? `ซ่อน ${type.label}` : `แสดง ${type.label}`}
                        >
                            <span className={`w-2 h-2 rounded-full transition-colors ${isSelected ? style.dot : 'bg-gray-300'}`}></span>
                            <span>{type.label}</span>
                            {isSelected && (
                                <Check className="w-3 h-3 opacity-60" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Calendar */}
            <CalendarHub
                selectedDate={endDate}
                onDateSelect={setEndDate}
                startDate={today}
                endDate={endDate}
                showRangeHighlight={true}
                customDayContent={customDayContent}
                size="sm"
            />
        </div>
    );
}

export default FinancialCalendar;