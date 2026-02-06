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

// Client-side color mapping based on status
const getStatusStyle = (status) => {
    const styles = {
        'pending': { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
        'received': { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    };
    return styles[status] || { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-400' };
};

function FinancialCalendar({ onIncomeUpdate, incomes = [] }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [endDate, setEndDate] = useState(null);

    // Filter logic removed as we want to show all incomes by status now
    // If needed we can add status filter later

    // Get incomes grouped by date for efficient lookup
    const incomesGrouped = useMemo(() => {
        const grouped = {};
        incomes.forEach(income => {
            // Logic: If Received -> use 'date' (Actual). If Pending -> use 'due_date' (Expected).
            let targetDateStr = income.status === 'received' ? income.date : income.due_date;

            // Fallback
            if (!targetDateStr) targetDateStr = income.date || income.created_at;

            // Handle Date Object or String
            if (targetDateStr instanceof Date) {
                targetDateStr = targetDateStr.toISOString();
            }

            const dateKey = targetDateStr ? targetDateStr.split('T')[0] : '';

            if (dateKey) {
                if (!grouped[dateKey]) {
                    grouped[dateKey] = [];
                }
                grouped[dateKey].push(income);
            }
        });
        return grouped;
    }, [incomes]);

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

        return incomes.reduce((sum, item) => {
            if (item.status === 'received') return sum; // Don't count already received money in projection?
            // Or maybe user wants Cash Flow forecast including what came in today?
            // "Projected Income" usually means Pending.
            // Let's count ONLY Pending for "Forecast".

            if (item.status !== 'pending') return sum;

            let targetDateStr = item.due_date;
            if (!targetDateStr) return sum;

            if (targetDateStr instanceof Date) {
                targetDateStr = targetDateStr.toISOString();
            }

            const [y, m, d] = targetDateStr.split('T')[0].split('-').map(Number);
            const itemDate = new Date(y, m - 1, d);

            if (isDateInRange(itemDate, todayStart, endDate)) {
                return sum + item.amount;
            }
            return sum;
        }, 0);
    }, [endDate, today, isFutureDateSelected, incomes]);

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

        // Check dominant status
        const hasPending = dayIncomes.some(i => i.status === 'pending');
        const hasReceived = dayIncomes.some(i => i.status === 'received');

        let statusStyle = 'received';
        if (hasPending) statusStyle = 'pending'; // Pending priority for color (Yellow warning)

        const style = getStatusStyle(statusStyle);

        return (
            <div className="absolute -bottom-0.5 w-full text-center px-0.5">
                <div className="flex justify-center gap-0.5 mb-0.5">
                    <div className={`w-1 h-1 rounded-full ${style.dot}`}></div>
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