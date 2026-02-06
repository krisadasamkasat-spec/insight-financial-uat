import React, { useMemo } from 'react';
import { STATUS_DATA } from '../../constants/expenseStatus';
import { formatNumber } from '../../utils/formatters';
import ExpenseRow from './ExpenseRow';

const StatusGroupedTable = ({ expenses, onEdit, onDelete, onViewAttachments, isLoading }) => {

    // Group logic
    const groupedData = useMemo(() => {
        if (!expenses) return [];
        return STATUS_DATA.map(status => {
            const items = expenses.filter(e => e.internal_status === status.value);
            const total = items.reduce((sum, e) => sum + (parseFloat(e.net_amount) || 0), 0);
            return {
                ...status,
                items,
                total,
                count: items.length
            };
        });
    }, [expenses]);

    if (isLoading) {
        return <div className="text-center py-12 text-gray-500">กำลังโหลด...</div>;
    }

    if (expenses.length === 0) {
        return <div className="text-center py-12 text-gray-500">ไม่พบรายการในช่วงเวลาที่เลือก</div>;
    }

    return (
        <div className="flex flex-col gap-8">
            {groupedData.map((group) => {
                // If no items in this status, skip rendering
                if (group.count === 0) return null;

                return (
                    <div key={group.value} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Group Header */}
                        <div className={`px-5 py-3 bg-${group.color}-50 border-b border-${group.color}-100 flex justify-between items-center`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full bg-${group.color}-500 shadow-sm`} />
                                <h3 className={`font-bold text-${group.color}-700 text-lg`}>
                                    {group.label}
                                </h3>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold bg-${group.color}-100 text-${group.color}-600`}>
                                    {group.count} รายการ
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">ยอดรวม</span>
                                <span className="text-lg font-bold text-gray-900">
                                    ฿{formatNumber(group.total)}
                                </span>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100">
                                        <th className="text-left px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider w-[120px]">รหัสโปรเจค</th>
                                        <th className="text-left px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider w-[100px]">ประเภท</th>
                                        <th className="text-left px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">รายละเอียด</th>
                                        <th className="text-left px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">ผู้รับเงิน</th>
                                        <th className="text-left px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">กำหนดจ่าย</th>
                                        <th className="text-right px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">จำนวนเงิน</th>
                                        <th className="text-center px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider w-[80px]">ไฟล์แนบ</th>

                                        <th className="text-center px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider w-[80px]">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {group.items.map((expense, idx) => (
                                        <ExpenseRow
                                            key={expense.id}
                                            idx={idx}
                                            expense={expense}
                                            onEdit={onEdit}
                                            onDelete={onDelete}
                                            onViewAttachments={onViewAttachments}
                                            showStatus={false}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default StatusGroupedTable;
