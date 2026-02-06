import React, { useState, useEffect, useMemo } from 'react';
import {
    format,
    parseISO,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    startOfWeek,
    endOfWeek,
    getYear,
    isToday,
    isWithinInterval
} from 'date-fns';
import { th } from 'date-fns/locale';
import { projectAPI } from '../../services/api';
import { formatNumber } from '../../utils/formatters';
import {
    Loader2,
    ChevronLeft,
    ChevronRight,
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    Calendar as CalendarIcon,
    Search,
    XCircle,
    CheckCircle2
} from 'lucide-react';

const CashflowCalendar = () => {
    // State
    const [viewDate, setViewDate] = useState(new Date());
    const [selection, setSelection] = useState({ type: 'day', date: new Date(), range: null }); // type: 'day' | 'week' | 'month'
    const [loading, setLoading] = useState(true);
    const [apiData, setApiData] = useState(null);

    const year = getYear(viewDate);

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await projectAPI.getYearlyCashflow(year);
                setApiData(res.data);
            } catch (err) {
                console.error("Failed to fetch cashflow data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [year]);

    // Process Data
    const { dailyMap, transactions } = useMemo(() => {
        if (!apiData) return { dailyMap: {}, transactions: [] };

        const map = {};
        const transactions = [...apiData.transactions].sort((a, b) =>
            (a.due_date || '').localeCompare(b.due_date || '')
        );

        transactions.forEach(tx => {
            if (!tx.due_date) return;
            // Fix: Parse ISO and format to local date string to handle timezone correctly (e.g. UTC 17:00 -> Local 00:00 next day)
            const dateKey = format(parseISO(tx.due_date), 'yyyy-MM-dd');

            if (!map[dateKey]) map[dateKey] = { income: 0, expense: 0, transactions: [] };

            const amount = parseFloat(tx.amount) || 0;
            if (tx.type === 'income') map[dateKey].income += amount;
            else map[dateKey].expense += amount;

            map[dateKey].transactions.push(tx);
        });

        return { dailyMap: map, transactions };
    }, [apiData]);

    // Month Stats & Weekly Logic
    const { monthStats, weeks } = useMemo(() => {
        if (!apiData) return { monthStats: { income: 0, expense: 0, balance: 0 }, weeks: [] };

        const monthStart = startOfMonth(viewDate);
        const monthEnd = endOfMonth(viewDate);
        const start = startOfWeek(monthStart, { weekStartsOn: 0 });
        const end = endOfWeek(monthEnd, { weekStartsOn: 0 });

        const days = eachDayOfInterval({ start, end });

        // Group days into weeks
        const weeksArray = [];
        let currentWeek = [];

        days.forEach((day, idx) => {
            currentWeek.push(day);
            if ((idx + 1) % 7 === 0) {
                weeksArray.push(currentWeek);
                currentWeek = [];
            }
        });

        // Calculate Month Stats
        const monthTxs = transactions.filter(tx => {
            const d = parseISO(tx.due_date);
            return d >= monthStart && d <= monthEnd;
        });

        const income = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
        const expense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);

        // Calculate Ending Balance (All time up to end of month)
        let balance = parseFloat(apiData.initial_balance) || 0;
        const allTxsUpToEnd = transactions.filter(tx => parseISO(tx.due_date) <= monthEnd);
        balance += allTxsUpToEnd.reduce((acc, tx) => acc + (tx.type === 'income' ? parseFloat(tx.amount) : -parseFloat(tx.amount)), 0);

        return {
            monthStats: { income, expense, balance },
            weeks: weeksArray
        };
    }, [apiData, viewDate, transactions]);

    // Handlers
    const handlePrevMonth = () => setViewDate(subMonths(viewDate, 1));
    const handleNextMonth = () => setViewDate(addMonths(viewDate, 1));
    const handleToday = () => {
        const now = new Date();
        setViewDate(now);
        setSelection({ type: 'day', date: now, range: null });
    };

    const handleSelectDay = (day) => {
        setSelection({ type: 'day', date: day, range: null });
    };

    const handleSelectWeek = (weekDays) => {
        const start = weekDays[0];
        const end = weekDays[6];
        setSelection({ type: 'week', date: null, range: { start, end } });
    };

    const handleViewMonth = () => {
        setSelection({ type: 'month', date: null, range: null });
    };


    // Right Panel Logic
    const getRightPanelData = () => {
        if (selection.type === 'week' && selection.range) {
            // Weekly Data
            const { start, end } = selection.range;
            const weeklyTxs = transactions.filter(tx => {
                const d = parseISO(tx.due_date);
                return d >= start && d <= end;
            });
            const income = weeklyTxs.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
            const expense = weeklyTxs.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);

            // Weekly Ending Balance (All time up to end of week)
            let balance = parseFloat(apiData?.initial_balance || 0);
            const allTxsUpToWeekEnd = transactions.filter(tx => parseISO(tx.due_date) <= end);
            balance += allTxsUpToWeekEnd.reduce((acc, tx) => acc + (tx.type === 'income' ? parseFloat(tx.amount) : -parseFloat(tx.amount)), 0);

            return {
                title: 'Selected Week',
                subtitle: `${format(start, 'd MMM yyyy', { locale: th })} - ${format(end, 'd MMM yyyy', { locale: th })}`,
                income,
                expense,
                balance,
                transactions: weeklyTxs
            };
        } else if (selection.type === 'day' && selection.date) {
            // Daily Data
            const dateKey = format(selection.date, 'yyyy-MM-dd');
            const data = dailyMap[dateKey] || { income: 0, expense: 0, transactions: [] };
            // Use month ending balance for Context or calculate daily ending balance? 
            // Daily ending balance is better but calculation intensive if not optimized.
            // Let's use Month Stats Balance as context for "Current Balance" generally, 
            // or re-calculate efficiently. 
            // For simplicity, let's show the Day's specific Net and the Month's Ending Balance.
            return {
                title: 'Selected Day',
                subtitle: format(selection.date, 'd MMMM yyyy', { locale: th }),
                income: data.income,
                expense: data.expense,
                balance: monthStats.balance, // Contextual
                transactions: data.transactions
            };
        } else {
            // Default Month
            return {
                title: 'Month Overview',
                subtitle: format(viewDate, 'MMMM yyyy', { locale: th }),
                income: monthStats.income,
                expense: monthStats.expense,
                balance: monthStats.balance,
                transactions: [] // Maybe top transactions? Or empty.
            };
        }
    };

    const panelData = getRightPanelData();

    // Helper to calculate weekly summary for the grid
    const getWeeklySummary = (weekDays) => {
        const start = weekDays[0];
        const end = weekDays[6];
        // Calculate total in/out for this week specifically
        const weeklyTxs = transactions.filter(tx => {
            const d = parseISO(tx.due_date);
            return d >= start && d <= end;
        });
        const income = weeklyTxs.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
        const expense = weeklyTxs.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);

        // Calculate Running Balance at END of this week
        let balance = parseFloat(apiData?.initial_balance || 0);
        const allTxsUpToWeekEnd = transactions.filter(tx => parseISO(tx.due_date) <= end);
        balance += allTxsUpToWeekEnd.reduce((acc, tx) => acc + (tx.type === 'income' ? parseFloat(tx.amount) : -parseFloat(tx.amount)), 0);

        return { income, expense, balance };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-gray-100 h-[500px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

            {/* Main Header */}
            <div className="border-b border-gray-100 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white">
                <div>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-blue-600" />
                        Cashflow Projection ({year})
                    </h2>
                    <p className="text-sm text-gray-500">บริหารจัดการสภาพคล่องรายวันและรายสัปดาห์</p>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={handleViewMonth} className="hidden sm:block text-sm font-medium text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors">
                        <CalendarIcon className="w-4 h-4" /> ดูรายเดือน
                    </button>
                    <div className="w-px h-6 bg-gray-200 hidden sm:block"></div>
                    <button onClick={handleToday} className="text-sm font-medium text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-md transition-colors">
                        วันนี้
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row h-auto lg:h-[700px]">

                {/* Left: Calendar Grid */}
                <div className="w-full lg:w-[65%] bg-white flex flex-col border-b lg:border-b-0 lg:border-r border-gray-100">

                    {/* Month Nav */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-50">
                        <div className="flex items-center gap-2 text-gray-800 font-bold text-lg">
                            <CalendarIcon className="w-5 h-5 text-blue-500" />
                            {format(viewDate, 'MMMM yyyy', { locale: th })}
                        </div>
                        <div className="flex gap-1">
                            <button onClick={handlePrevMonth} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-500"><ChevronLeft className="w-5 h-5" /></button>
                            <button onClick={handleNextMonth} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-500"><ChevronRight className="w-5 h-5" /></button>
                        </div>
                    </div>

                    {/* Headers (8 Cols) */}
                    <div className="grid grid-cols-[repeat(7,1fr)_120px] border-b border-gray-100">
                        {['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'].map(day => (
                            <div key={day} className="py-3 text-center text-xs font-semibold text-gray-400">
                                {day}
                            </div>
                        ))}
                        <div className="py-3 text-center text-xs font-bold text-gray-500 bg-gray-50 border-l border-gray-100">
                            สรุปรายสัปดาห์
                        </div>
                    </div>

                    {/* Calendar Rows */}
                    <div className="flex-1 flex flex-col bg-gray-50/30 overflow-y-auto">
                        {weeks.map((weekDays, weekIdx) => {
                            const summary = getWeeklySummary(weekDays);
                            const isWeekSelected = selection.type === 'week' && selection.range
                                && isSameDay(selection.range.start, weekDays[0]);

                            return (
                                <div key={weekIdx} className="grid grid-cols-[repeat(7,1fr)_120px] min-h-[100px]">
                                    {/* Days */}
                                    {weekDays.map((day) => {
                                        const dateKey = format(day, 'yyyy-MM-dd');
                                        const dayData = dailyMap[dateKey];
                                        const isCurrentMonth = isSameMonth(day, viewDate);
                                        const isSelected = selection.type === 'day' && selection.date && isSameDay(day, selection.date);
                                        const isTodayDate = isToday(day);

                                        return (
                                            <div
                                                key={day.toString()}
                                                onClick={() => handleSelectDay(day)}
                                                className={`
                                                    border-b border-r border-gray-100 p-2 cursor-pointer transition-all hover:bg-white relative
                                                    ${!isCurrentMonth ? 'bg-gray-50/50 text-gray-300' : 'bg-white text-gray-700'}
                                                    ${isSelected ? 'ring-2 ring-inset ring-blue-500 z-10' : ''}
                                                `}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className={`
                                                        text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full
                                                        ${isTodayDate ? 'bg-blue-600 text-white' : ''}
                                                    `}>
                                                        {format(day, 'd')}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col gap-0.5 mt-1">
                                                    {dayData?.income > 0 && (
                                                        <div className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                                                            +{formatNumber(dayData.income / 1000)}k
                                                        </div>
                                                    )}
                                                    {dayData?.expense > 0 && (
                                                        <div className="flex items-center gap-1 text-[10px] text-red-600 font-medium">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                                            -{formatNumber(dayData.expense / 1000)}k
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Weekly Summary Column */}
                                    <div
                                        onClick={() => handleSelectWeek(weekDays)}
                                        className={`
                                            border-b border-gray-100 bg-gray-50 flex flex-col justify-center px-2 py-2 cursor-pointer
                                            hover:bg-blue-50/50 transition-colors border-l
                                            ${isWeekSelected ? 'bg-blue-50 ring-2 ring-inset ring-blue-500 z-10' : ''}
                                        `}
                                    >
                                        <div className="text-right mb-2">
                                            <p className="text-[10px] uppercase text-gray-400 font-bold mb-0.5">รายรับรวม</p>
                                            <p className={`text-xs font-bold ${summary.income > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                                +{formatNumber(summary.income)}
                                            </p>
                                        </div>
                                        <div className="text-right mb-2">
                                            <p className="text-[10px] uppercase text-gray-400 font-bold mb-0.5">รายจ่ายรวม</p>
                                            <p className={`text-xs font-bold ${summary.expense > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                                -{formatNumber(summary.expense)}
                                            </p>
                                        </div>
                                        <div className="text-right border-t border-gray-200 pt-1 mt-auto">
                                            <p className="text-[10px] uppercase text-gray-400 font-bold mb-0.5">คงเหลือสุทธิ</p>
                                            <p className="text-xs font-bold text-blue-600">
                                                ฿{formatNumber(summary.balance / 1000)}k
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right: Details Panel */}
                <div className="w-full lg:w-[35%] bg-gray-50/30 flex flex-col h-[500px] lg:h-auto border-l border-gray-100">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                {panelData.title}
                                {selection.type === 'week' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                            </h3>
                            {selection.type !== 'month' && (
                                <button onClick={handleViewMonth} className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 border border-gray-200 px-2 py-1 rounded-full bg-white">
                                    <XCircle className="w-3 h-3" /> ดูรายเดือน
                                </button>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 mb-6">{panelData.subtitle}</p>

                        {/* Stats Cards */}
                        <div className="bg-blue-50 rounded-xl p-5 border border-blue-100 mb-4">
                            <div className="flex items-center gap-2 mb-2 text-blue-700">
                                <Wallet className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wide">คงเหลือสุทธิ</span>
                            </div>
                            <p className="text-3xl font-bold text-blue-800">฿{formatNumber(panelData.balance)}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                <p className="text-[10px] uppercase text-green-600 font-bold mb-1">รายรับทั้งหมด</p>
                                <p className="text-lg font-bold text-green-700">+{formatNumber(panelData.income)}</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                <p className="text-[10px] uppercase text-red-600 font-bold mb-1">รายจ่ายทั้งหมด</p>
                                <p className="text-lg font-bold text-red-600">-{formatNumber(panelData.expense)}</p>
                            </div>
                        </div>

                        {/* Transactions Header */}
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-bold text-gray-800">รายการธุรกรรม (Transactions)</h4>
                            <span className="text-xs text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded shadow-sm">
                                {panelData.transactions?.length || 0} รายการ
                            </span>
                        </div>
                    </div>

                    {/* Scrollable Transactions */}
                    <div className="flex-1 overflow-y-auto px-6 pb-6 mt-[-1rem]">
                        {(!panelData.transactions || panelData.transactions.length === 0) ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                                <div className="bg-white p-3 rounded-full mb-3 shadow-sm">
                                    <Search className="w-6 h-6 text-gray-300" />
                                </div>
                                <p className="text-gray-500 font-medium text-sm">ไม่มีรายการ</p>
                                <p className="text-gray-400 text-xs">สำหรับช่วงเวลานี้</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {panelData.transactions.map((tx, idx) => (
                                    <div key={`${tx.id}-${idx}`} className="bg-white p-4 rounded-xl border border-gray-100 hover:shadow-md transition-all group">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-start gap-3">
                                                <div className={`
                                                    w-10 h-10 rounded-full flex items-center justify-center shrink-0 
                                                    ${tx.type === 'income' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}
                                                 `}>
                                                    {tx.type === 'income' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900 line-clamp-1">
                                                        {tx.description || tx.project_code || 'No Description'}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <CalendarIcon className="w-3 h-3 text-gray-300" />
                                                        <span className="text-xs text-gray-400">
                                                            {format(parseISO(tx.due_date), 'd MMM yyyy', { locale: th })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={`text-sm font-bold whitespace-nowrap ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'
                                                }`}>
                                                {tx.type === 'income' ? '+' : '-'}฿{formatNumber(tx.amount)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CashflowCalendar;
