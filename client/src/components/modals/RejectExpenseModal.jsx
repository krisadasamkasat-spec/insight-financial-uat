import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

/**
 * RejectExpenseModal - Modal for rejecting an expense with required reason
 */
const RejectExpenseModal = ({
    isOpen,
    onClose,
    onConfirm,
    expense,
    isLoading = false
}) => {
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    if (!isOpen || !expense) return null;

    const formatNumber = (num) => {
        return (num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const handleSubmit = () => {
        // Validate reason
        if (!reason.trim()) {
            setError('กรุณาระบุเหตุผลในการไม่อนุมัติ');
            return;
        }
        if (reason.trim().length < 10) {
            setError('เหตุผลต้องมีอย่างน้อย 10 ตัวอักษร');
            return;
        }

        setError('');
        onConfirm(expense.id, reason.trim());
    };

    const handleClose = () => {
        setReason('');
        setError('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-50 via-rose-50 to-red-50 p-5 border-b border-red-100/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-gradient-to-br from-red-400 to-rose-500 rounded-xl flex items-center justify-center shadow-md">
                                <X className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">ไม่อนุมัติรายการเบิกจ่าย</h3>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-white/70 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-5">
                    {/* Expense Info */}
                    <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
                        <div className="text-sm text-gray-500 mb-1">รายการ</div>
                        <div className="font-semibold text-gray-800 text-sm mb-2">
                            {expense.projectCode} | {expense.expenseCode || '-'} | {expense.account_title || expense.title || '-'}
                        </div>
                        <div className="text-xs text-gray-500 mb-3 line-clamp-1">
                            {expense.description || '-'}
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">จำนวนเงิน</span>
                            <span className="text-lg font-bold text-red-600">฿{formatNumber(expense.netAmount)}</span>
                        </div>
                    </div>

                    {/* Reason Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            เหตุผลในการไม่อนุมัติ <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => {
                                setReason(e.target.value);
                                if (error) setError('');
                            }}
                            placeholder="กรุณาระบุเหตุผลในการไม่อนุมัติรายการนี้..."
                            className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all resize-none ${error
                                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                    : 'border-gray-200 focus:ring-red-500 focus:border-red-500'
                                }`}
                            rows={4}
                            maxLength={500}
                        />
                        <div className="flex justify-between mt-2">
                            {error ? (
                                <div className="flex items-center gap-1 text-red-500 text-xs">
                                    <AlertCircle className="w-3 h-3" />
                                    {error}
                                </div>
                            ) : (
                                <div />
                            )}
                            <span className="text-xs text-gray-400">{reason.length}/500</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 pt-2 flex gap-3">
                    <button
                        onClick={handleClose}
                        disabled={isLoading}
                        className="flex-1 py-3 px-4 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !reason.trim()}
                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${isLoading || !reason.trim()
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600 shadow-lg shadow-red-500/30'
                            }`}
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                กำลังดำเนินการ...
                            </>
                        ) : (
                            <>
                                <X className="w-4 h-4" />
                                ไม่อนุมัติ
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RejectExpenseModal;
