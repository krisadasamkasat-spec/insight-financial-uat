import React from 'react';
import { AlertCircle, ArrowRight, Wallet, CheckCircle2, X } from 'lucide-react';
import { formatNumber } from '../../utils/formatters';

const StatusChangeConfirmModal = ({ isOpen, onClose, onConfirm, data, currentBalance }) => {
    if (!isOpen || !data) return null;

    const { type, amount, oldStatus, newStatus, itemTitle } = data; // type: 'income' | 'expense'

    // Determine if this change adds or removes money
    let impact = 'none'; // 'add', 'deduct', 'none'

    // Parse values as numbers to prevent string concatenation
    const numericBalance = parseFloat(currentBalance) || 0;
    const numericAmount = parseFloat(amount) || 0;

    if (type === 'expense') {
        if ((newStatus === 'Paid' || newStatus === 'จ่ายแล้ว') && (oldStatus !== 'Paid' && oldStatus !== 'จ่ายแล้ว')) {
            impact = 'deduct';
        }
    } else if (type === 'income') {
        if ((newStatus === 'Received' || newStatus === 'ได้รับแล้ว') && (oldStatus !== 'Received' && oldStatus !== 'ได้รับแล้ว')) {
            impact = 'add';
        }
    }

    // Calculate Estimated Balance (using parsed numbers)
    let estimatedBalance = numericBalance;
    if (impact === 'add') estimatedBalance = numericBalance + numericAmount;
    if (impact === 'deduct') estimatedBalance = numericBalance - numericAmount;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                {/* Header */}
                <div className={`p-6 border-b ${impact === 'deduct' ? 'bg-red-50 border-red-100' : impact === 'add' ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${impact === 'deduct' ? 'bg-red-100 text-red-600' :
                                impact === 'add' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                                }`}>
                                <Wallet className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">ยืนยันการเปลี่ยนสถานะ</h3>
                                <p className="text-sm text-gray-500">มีผลต่อยอดเงินในบัญชี</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Status Change Arrow */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="text-center flex-1">
                            <span className="text-xs text-gray-400 uppercase font-semibold">สถานะเดิม</span>
                            <div className="mt-1 font-medium text-gray-700">{oldStatus}</div>
                        </div>
                        <ArrowRight className="text-gray-300 w-5 h-5 mx-2" />
                        <div className="text-center flex-1">
                            <span className="text-xs text-gray-400 uppercase font-semibold">สถานะใหม่</span>
                            <div className={`mt-1 font-bold ${impact === 'deduct' ? 'text-red-600' : impact === 'add' ? 'text-green-600' : 'text-blue-600'
                                }`}>
                                {newStatus}
                            </div>
                        </div>
                    </div>

                    {/* Financial Impact */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">ยอดเงินคงเหลือปัจจุบัน</span>
                            <span className="font-mono font-medium text-gray-900">฿{formatNumber(currentBalance)}</span>
                        </div>

                        <div className="flex justify-between items-center py-3 border-t border-b border-gray-100 bg-gray-50/50 -mx-6 px-6">
                            <div className="flex items-center gap-2">
                                {impact === 'deduct' ? (
                                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                ) : impact === 'add' ? (
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                ) : (
                                    <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                )}
                                <span className="text-gray-700 font-medium">
                                    {impact === 'deduct' ? 'หักยอดเงิน' : impact === 'add' ? 'เพิ่มยอดเงิน' : 'จำนวนเงิน'}
                                </span>
                            </div>
                            <span className={`font-mono font-bold text-lg ${impact === 'deduct' ? 'text-red-600' : impact === 'add' ? 'text-green-600' : 'text-gray-900'
                                }`}>
                                {impact === 'deduct' ? '-' : impact === 'add' ? '+' : ''}฿{formatNumber(amount)}
                            </span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-gray-800 font-semibold">ยอดเงินคงเหลือสุทธิ</span>
                            <span className={`font-mono font-bold text-xl ${(estimatedBalance < currentBalance) ? 'text-gray-900' : 'text-emerald-700'
                                }`}>
                                ฿{formatNumber(estimatedBalance)}
                            </span>
                        </div>
                    </div>

                    {/* Item Detail */}
                    <div className="text-xs text-gray-400 text-center pt-2">
                        รายละเอียด: {itemTitle}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 pt-2 bg-gray-50/50">
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            ยกเลิก
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`flex-1 px-4 py-3 text-white font-semibold rounded-xl shadow-lg transition-all transform active:scale-95 ${impact === 'deduct'
                                ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-red-500/30'
                                : impact === 'add'
                                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-green-500/30'
                                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-blue-500/30'
                                }`}
                        >
                            ยืนยันการเปลี่ยน
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatusChangeConfirmModal;
