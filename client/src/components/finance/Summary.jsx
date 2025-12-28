import React, { useState } from 'react';
import FinancialCalendar from './FinancialCalendar';

const Summary = ({ totalSelectedAmount, selectedCount, onApprove, incomes = [], accountBalance = 0, isPaidTab = false }) => {
    // const accountBalance = 500000.00; // Removed hardcoded value
    const [projectedIncome, setProjectedIncome] = useState(0);
    const [hasFutureDateSelected, setHasFutureDateSelected] = useState(false);

    const remainingAfterApproval = accountBalance - totalSelectedAmount + (hasFutureDateSelected ? projectedIncome : 0);

    const formatNumber = (num) => {
        return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const handleIncomeUpdate = (income, isFutureDate) => {
        setProjectedIncome(income);
        setHasFutureDateSelected(isFutureDate);
    };

    return (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 font-sans">
            {/* ยอดคงเหลือในบัญชี - สีดำ */}
            <div className="mb-4 pb-3 border-b border-gray-100">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-500">ยอดคงเหลือในบัญชี</span>
                    <span className="text-xs text-gray-400">{new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                    ฿ {formatNumber(accountBalance)}
                </div>
            </div>

            {/* ยอดเบิกจ่ายที่เลือก - สีแดง */}
            <div className="mb-4 pb-3 border-b border-gray-100">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-500">ยอดเบิกจ่ายที่เลือก</span>
                    <span className="text-xs text-gray-400">{selectedCount} รายการ</span>
                </div>
                <div className="text-2xl font-bold text-red-500">
                    -฿ {formatNumber(totalSelectedAmount)}
                </div>
            </div>

            {/* รายรับตามคาดการณ์ - สีเขียว (แสดงเมื่อเลือกวันในอนาคตที่ไม่ใช่วันปัจจุบัน) */}
            {hasFutureDateSelected && (
                <div className="mb-4 pb-3 border-b border-gray-100">
                    <div className="text-sm text-gray-500 mb-1">รายรับตามคาดการณ์</div>
                    <div className="text-2xl font-bold text-emerald-500">
                        +฿ {formatNumber(projectedIncome)}
                    </div>
                </div>
            )}

            {/* ยอดคงเหลือหลังอนุมัติ - สีฟ้า */}
            <div className="mb-4 pb-3 border-b border-gray-100">
                <div className="text-sm text-gray-500 mb-1">ยอดคงเหลือหลังอนุมัติ</div>
                <div className="text-2xl font-bold text-blue-500">
                    ฿ {formatNumber(remainingAfterApproval)}
                </div>
            </div>

            {/* Action Button */}
            {!isPaidTab && (
                <div className="mb-4">
                    <button
                        onClick={onApprove}
                        disabled={selectedCount === 0}
                        className={`w-full py-3 px-4 rounded-full text-sm font-medium cursor-pointer flex items-center justify-center gap-2 transition-colors duration-200 ${selectedCount === 0
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'text-white bg-emerald-500 hover:bg-emerald-600'
                            }`}
                    >
                        <span>✓</span> อนุมัติการเบิกจ่าย
                    </button>
                </div>
            )}

            <FinancialCalendar
                initialBalance={accountBalance - totalSelectedAmount}
                onIncomeUpdate={handleIncomeUpdate}
                incomes={incomes}
            />
        </div>
    );
};

export default Summary;

