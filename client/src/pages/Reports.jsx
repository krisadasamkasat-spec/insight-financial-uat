import React, { useState, useMemo, useEffect } from 'react';
import { projectAPI } from '../services/api';
import MinimalDropdown from '../components/common/MinimalDropdown';
import { formatNumber, formatCompact } from '../utils/formatters';

const Reports = () => {
    // Get current year based on today's date
    const currentYear = new Date().getFullYear();
    const [allYears, setAllYears] = useState([currentYear]);
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [showScrollTop, setShowScrollTop] = useState(false);

    // Data State
    const [monthlyData, setMonthlyData] = useState([]);
    const [expensesByCategory, setExpensesByCategory] = useState([]);


    // Fetch Years
    useEffect(() => {
        const fetchYears = async () => {
            try {
                const res = await projectAPI.getReportYears();
                if (res.data && res.data.length > 0) {
                    setAllYears(res.data);
                    if (!res.data.includes(selectedYear)) {
                        setSelectedYear(res.data[0]);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch years", err);
            }
        };
        fetchYears();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch Report Data
    useEffect(() => {
        const fetchReport = async () => {
            try {
                const res = await projectAPI.getReportSummary(selectedYear);
                setMonthlyData(res.data.monthlyData);
                setExpensesByCategory(res.data.expensesByCategory);
            } catch (err) {
                console.error("Failed to fetch report", err);
            }
        };
        fetchReport();
    }, [selectedYear]);

    // Scroll to top button logic
    useEffect(() => {
        const handleScroll = () => {
            const mainContent = document.querySelector('main');
            if (mainContent) {
                setShowScrollTop(mainContent.scrollTop > 400);
            }
        };

        const mainContent = document.querySelector('main');
        if (mainContent) {
            mainContent.addEventListener('scroll', handleScroll);
            return () => mainContent.removeEventListener('scroll', handleScroll);
        }
    }, []);

    const scrollToTop = () => {
        const mainContent = document.querySelector('main');
        if (mainContent) {
            mainContent.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Calculate totals for selected year
    const yearTotals = useMemo(() => {
        const totalIncome = monthlyData.reduce((sum, m) => sum + m.income, 0);
        const totalExpense = monthlyData.reduce((sum, m) => sum + m.expense, 0);
        const totalIncomeCount = monthlyData.reduce((sum, m) => sum + m.incomeCount, 0);
        const totalExpenseCount = monthlyData.reduce((sum, m) => sum + m.expenseCount, 0);

        return {
            totalIncome,
            totalExpense,
            profit: totalIncome - totalExpense,
            profitMargin: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100).toFixed(1) : 0,
            totalTransactions: totalIncomeCount + totalExpenseCount
        };
    }, [monthlyData]);

    // Handle year change from MinimalDropdown
    const handleYearChange = (year) => {
        if (year !== 'all') {
            setSelectedYear(parseInt(year));
        }
    };

    return (
        <div className="p-8 max-w-[1400px] mx-auto relative">
            {/* Header Section */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">รายงาน</h1>
                <p className="text-gray-500 mt-1">สรุปรายรับรายจ่ายรายเดือน</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Total Income */}
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">รายรับ</span>
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                                <polyline points="17 6 23 6 23 12" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-xl font-bold text-gray-900">฿{formatCompact(yearTotals.totalIncome)}</p>
                    <p className="text-xs text-green-600 font-medium mt-1">+{monthlyData.filter(m => m.incomeCount > 0).length} เดือนที่มีรายรับ</p>
                </div>

                {/* Total Expense */}
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">รายจ่าย</span>
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                                <polyline points="17 18 23 18 23 12" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-xl font-bold text-gray-900">฿{formatCompact(yearTotals.totalExpense)}</p>
                    <p className="text-xs text-red-600 font-medium mt-1">{yearTotals.totalTransactions - monthlyData.reduce((s, m) => s + m.incomeCount, 0)} รายการ</p>
                </div>

                {/* Profit */}
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">กำไร/ขาดทุน</span>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${yearTotals.profit >= 0 ? 'bg-purple-100' : 'bg-red-100'}`}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={yearTotals.profit >= 0 ? '#a855f7' : '#ef4444'} strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 6v12M8 10l4-4 4 4" />
                            </svg>
                        </div>
                    </div>
                    <p className={`text-xl font-bold ${yearTotals.profit >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                        ฿{formatCompact(yearTotals.profit)}
                    </p>
                    <p className={`text-xs font-medium mt-1 ${yearTotals.profit >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                        Margin: {yearTotals.profitMargin}%
                    </p>
                </div>

                {/* Transactions */}
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">ธุรกรรม</span>
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-xl font-bold text-gray-900">{yearTotals.totalTransactions}</p>
                    <p className="text-xs text-blue-600 font-medium mt-1">รายการทั้งหมด</p>
                </div>
            </div>

            {/* Monthly Income/Expense Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
                {/* Header with Controls */}
                <div className="p-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-3">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900">รายรับรายจ่ายรายเดือน</h2>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Year Filter */}
                        <MinimalDropdown
                            label="ปี"
                            value={selectedYear.toString()}
                            options={allYears.map(y => y.toString())}
                            onChange={handleYearChange}
                            allLabel={allYears[0]?.toString() || new Date().getFullYear().toString()}
                        />

                        {/* Export Button */}
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors text-sm shadow-sm">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Export
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase">เดือน (ปี {selectedYear})</th>
                                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-600 uppercase">รายรับ</th>
                                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-600 uppercase">รายจ่าย</th>
                                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-600 uppercase">กำไร</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {monthlyData.map((month) => (
                                <tr key={month.monthKey} className={`hover:bg-gray-50 ${month.hasData ? '' : 'bg-gray-50/50'}`}>
                                    <td className="px-5 py-3">
                                        <span className={`font-medium ${month.hasData ? 'text-gray-900' : 'text-gray-400'}`}>
                                            {month.monthName}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        {month.income > 0 ? (
                                            <span className="font-semibold text-green-600">฿{formatNumber(month.income)}</span>
                                        ) : (
                                            <span className="text-gray-300">-</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        {month.expense > 0 ? (
                                            <span className="font-semibold text-red-600">฿{formatNumber(month.expense)}</span>
                                        ) : (
                                            <span className="text-gray-300">-</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        {month.hasData ? (
                                            <span className={`font-semibold ${month.profit >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                                                ฿{formatNumber(month.profit)}
                                            </span>
                                        ) : (
                                            <span className="text-gray-300">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-100 border-t-2 border-gray-200">
                            <tr>
                                <td className="px-5 py-3 font-bold text-gray-900">รวมทั้งปี {selectedYear}</td>
                                <td className="px-5 py-3 text-right font-bold text-green-600">฿{formatNumber(yearTotals.totalIncome)}</td>
                                <td className="px-5 py-3 text-right font-bold text-red-600">฿{formatNumber(yearTotals.totalExpense)}</td>
                                <td className={`px-5 py-3 text-right font-bold ${yearTotals.profit >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                                    ฿{formatNumber(yearTotals.profit)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Expense by Category */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                    <h2 className="text-base font-semibold text-gray-900">รายจ่ายแยกตามหมวดหมู่</h2>
                    <p className="text-xs text-gray-500 mt-0.5">ปี {selectedYear}</p>
                </div>
                {expensesByCategory.length > 0 ? (
                    <div className="p-5 space-y-3">
                        {expensesByCategory.map((category, index) => {
                            const percentage = yearTotals.totalExpense > 0
                                ? (category.totalAmount / yearTotals.totalExpense * 100)
                                : 0;
                            const colors = ['bg-orange-500', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-teal-500', 'bg-yellow-500', 'bg-indigo-500'];
                            const color = colors[index % colors.length];

                            return (
                                <div key={category.expenseCode} className="flex items-center gap-4">
                                    <div className="w-16 text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded text-center">
                                        {category.expenseCode}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-medium text-gray-800 truncate max-w-[300px]" title={category.title}>
                                                {category.title}
                                            </span>
                                            <span className="text-sm font-semibold text-gray-900 ml-2">
                                                ฿{formatNumber(category.totalAmount)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${color} rounded-full transition-all duration-500`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-gray-500 w-14 text-right">
                                                {percentage.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-400 w-16 text-right">
                                        {category.count} รายการ
                                    </div>
                                </div>
                            );
                        })}

                        {/* Total Footer */}
                        <div className="flex items-center gap-4 pt-3 border-t border-gray-200 mt-3">
                            <div className="flex-1 flex justify-between items-center">
                                <span className="text-sm font-bold text-gray-900">รายจ่ายทั้งหมด</span>
                                <span className="text-sm font-bold text-red-600">฿{formatNumber(yearTotals.totalExpense)}</span>
                            </div>
                            <div className="text-xs font-bold text-gray-600 w-16 text-right">
                                {expensesByCategory.reduce((sum, c) => sum + c.count, 0)} รายการ
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
                                <line x1="9" y1="9" x2="9.01" y2="9" />
                                <line x1="15" y1="9" x2="15.01" y2="9" />
                            </svg>
                        </div>
                        <p className="text-gray-500">ไม่มีข้อมูลรายจ่ายในปี {selectedYear}</p>
                    </div>
                )}
            </div>

            {/* Scroll to Top Button */}
            {
                showScrollTop && (
                    <button
                        onClick={scrollToTop}
                        className="fixed bottom-8 right-8 w-12 h-12 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-all duration-300 flex items-center justify-center z-50 hover:scale-110"
                        title="กลับขึ้นด้านบน"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="18 15 12 9 6 15" />
                        </svg>
                    </button>
                )
            }
        </div >
    );
};

export default Reports;
