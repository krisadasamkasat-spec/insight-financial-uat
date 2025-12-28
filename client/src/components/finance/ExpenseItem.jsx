import React, { useState } from 'react';
import CalendarHub from './CalendarHub';
import FileRepository from '../common/FileRepository';

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const ExpenseItem = ({ data, isSelected, onToggle, onPaymentCycleChange, isSelectionEnabled = true }) => {
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showDocuments, setShowDocuments] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);

    const {
        id,
        projectCode,
        expenseCode,
        title,
        status,
        statusColor,
        recipient,
        paymentDate,
        netAmount
    } = data;

    const formatNumber = (num) => {
        return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatDateKey = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const handleOpenPaymentModal = (e) => {
        e.stopPropagation();
        setShowPaymentModal(true);
        setSelectedDate(null);
    };

    const handleConfirmPaymentChange = () => {
        if (selectedDate && onPaymentCycleChange) {
            onPaymentCycleChange(id, formatDateKey(selectedDate));
        }
        setShowPaymentModal(false);
        setSelectedDate(null);
    };

    return (
        <>
            <div
                className={`px-4 py-3 flex items-center justify-between transition-colors hover:bg-gray-50 ${isSelected ? 'bg-blue-50/30' : ''
                    }`}
            >
                <div className="flex items-center gap-3 flex-1">
                    {/* Checkbox */}
                    {isSelectionEnabled && (
                        <input
                            type="checkbox"
                            checked={isSelected || false}
                            onChange={onToggle}
                            className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-blue-500"
                        />
                    )}

                    {/* Expense Code Badge */}
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-mono rounded">
                        {expenseCode}
                    </span>

                    {/* Title & Description */}
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm text-gray-800 truncate">{title}</span>
                        <span className="text-xs text-gray-400 truncate">{recipient}</span>
                    </div>
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-4">
                    {/* Status Badge */}
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor === 'green'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-blue-100 text-blue-700'
                        }`}>
                        {status}
                    </span>

                    {/* Amount */}
                    <div className="text-right min-w-[100px]">
                        <span className="text-sm font-semibold text-gray-800">฿{formatNumber(netAmount)}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                        {/* Documents Icon */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowDocuments(true);
                            }}
                            className="p-1.5 hover:bg-blue-50 rounded-full transition-colors text-gray-400 hover:text-blue-500"
                            title="รายการเอกสารแนบ"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                            </svg>
                        </button>

                        {/* Payment Cycle Change Icon */}
                        <button
                            onClick={handleOpenPaymentModal}
                            className="p-1.5 hover:bg-amber-50 rounded-full transition-colors text-gray-400 hover:text-amber-500"
                            title="เปลี่ยนแปลงรอบเบิกจ่าย"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Payment Cycle Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setShowPaymentModal(false)}
                    />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 p-5 border-b border-amber-100/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                            <line x1="16" y1="2" x2="16" y2="6"></line>
                                            <line x1="8" y1="2" x2="8" y2="6"></line>
                                            <line x1="3" y1="10" x2="21" y2="10"></line>
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800">เปลี่ยนแปลงรอบเบิกจ่าย</h3>
                                </div>
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    className="p-2 hover:bg-white/70 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-5 pt-4">
                            <div className="text-sm font-semibold text-amber-600 mb-4 pb-3 border-b border-gray-100">
                                {projectCode} | {expenseCode} {title}
                            </div>

                            <CalendarHub
                                selectedDate={selectedDate}
                                onDateSelect={setSelectedDate}
                                disablePast={true}
                                initialMonth={paymentDate ? new Date(paymentDate) : null}
                                size="md"
                                colorTheme="amber"
                            />

                            {selectedDate && (
                                <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200/50 text-center">
                                    <span className="text-base font-bold text-amber-700">
                                        วันที่เลือก {selectedDate.getDate()} {MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-5 pt-2">
                            <button
                                onClick={handleConfirmPaymentChange}
                                disabled={!selectedDate}
                                className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all ${selectedDate
                                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/30'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                ยืนยัน
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Attached Documents Modal */}
            <FileRepository
                isOpen={showDocuments}
                onClose={() => setShowDocuments(false)}
                documents={data.attachments || []}
                projectCode={projectCode}
            />
        </>
    );
};

export default ExpenseItem;
