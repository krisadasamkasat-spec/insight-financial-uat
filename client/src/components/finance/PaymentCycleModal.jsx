import React from 'react';
import CalendarHub from './CalendarHub';

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const PaymentCycleModal = ({
    isOpen,
    onClose,
    onConfirm,
    selectedDate,
    onDateSelect,
    currentPaymentDate,
    expenseInfo = {}
}) => {
    if (!isOpen) return null;

    const { projectCode, expenseCode, title } = expenseInfo;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header with Gradient */}
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
                            onClick={onClose}
                            className="p-2 hover:bg-white/70 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Body - Calendar */}
                <div className="p-5 pt-4">
                    {/* Expense Info as Label */}
                    <div className="text-sm font-semibold text-amber-600 mb-4 pb-3 border-b border-gray-100">
                        {projectCode} | {expenseCode} {title}
                    </div>

                    {/* Calendar component */}
                    <CalendarHub
                        selectedDate={selectedDate}
                        onDateSelect={onDateSelect}
                        disablePast={false}
                        initialMonth={currentPaymentDate ? new Date(currentPaymentDate) : null}
                        size="md"
                        colorTheme="amber"
                        highlightDate={currentPaymentDate ? new Date(currentPaymentDate) : null}
                    />

                    {/* Selected Date Display */}
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
                        onClick={onConfirm}
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
    );
};

export default PaymentCycleModal;
