import React from 'react';
import Modal from '../common/Modal';

/**
 * Confirmation modal for expense approval
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onConfirm - Confirm handler
 * @param {Array} props.expenses - Selected expenses to approve
 * @param {number} props.totalAmount - Total amount of selected expenses
 * @param {number} props.remainingBalance - Balance after approval
 */
const ApproveConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    expenses = [],
    totalAmount = 0,
    remainingBalance = 0
}) => {
    const formatNumber = (num) => {
        return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="ยืนยันการอนุมัติเบิกจ่าย" size="lg">
            <div className="space-y-4">
                {/* Warning Message */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                    <div className="text-amber-500 text-xl">⚠️</div>
                    <div>
                        <h4 className="font-medium text-amber-800">คุณกำลังจะอนุมัติการเบิกจ่าย</h4>
                        <p className="text-sm text-amber-700 mt-1">กรุณาตรวจสอบรายการด้านล่างก่อนยืนยัน</p>
                    </div>
                </div>

                {/* Expense List */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-700">รายการที่เลือก ({expenses.length} รายการ)</h4>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">รายละเอียด</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">วันที่จ่าย</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">จำนวนเงิน</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {expenses.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2">
                                            <div className="font-medium text-gray-900">{expense.title}</div>
                                            <div className="text-xs text-gray-500">{expense.recipient}</div>
                                        </td>
                                        <td className="px-4 py-2 text-gray-600">{formatDate(expense.paymentDate)}</td>
                                        <td className="px-4 py-2 text-right font-medium text-gray-900">฿{formatNumber(expense.netAmount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">ยอดเบิกจ่ายรวม</span>
                        <span className="text-xl font-bold text-red-500">-฿{formatNumber(totalAmount)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                        <span className="text-gray-600">ยอดคงเหลือหลังอนุมัติ</span>
                        <span className={`text-xl font-bold ${remainingBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            ฿{formatNumber(remainingBalance)}
                        </span>
                    </div>
                    {remainingBalance < 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                            ⚠️ ยอดคงเหลือติดลบ กรุณาตรวจสอบก่อนดำเนินการ
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2"
                    >
                        <span>✓</span>
                        ยืนยันอนุมัติ
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ApproveConfirmModal;
