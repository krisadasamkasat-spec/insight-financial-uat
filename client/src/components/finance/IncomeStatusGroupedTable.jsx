import React, { useMemo } from 'react';
import { formatNumber, formatDateCE } from '../../utils/formatters';
import StatusBadge from '../common/StatusBadge';
import { Pencil, Trash2 } from 'lucide-react';

const IncomeStatusGroupedTable = ({ incomes, projects, onEdit, onDelete, onUpdateStatus, isLoading }) => {

    // Status definitions
    const STATUS_DEFS = [
        { value: 'pending', label: 'รอรับ (Pending)', color: 'yellow' },
        { value: 'received', label: 'ได้รับแล้ว (Received)', color: 'emerald' }
    ];

    // Group logic
    const groupedData = useMemo(() => {
        if (!incomes) return [];
        return STATUS_DEFS.map(status => {
            // Filter by lowercase
            const items = incomes.filter(e => (e.status || '').toLowerCase() === status.value);
            const total = items.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
            return {
                ...status,
                items,
                total,
                count: items.length
            };
        });
    }, [incomes]);

    if (isLoading) {
        return <div className="text-center py-12 text-gray-500">กำลังโหลด...</div>;
    }

    if (incomes.length === 0) {
        return <div className="text-center py-12 text-gray-500">ไม่พบรายการในช่วงเวลาที่เลือก</div>;
    }

    return (
        <div className="flex flex-col gap-8">
            {groupedData.map((group) => {
                // If no items in this status, skip rendering (optional, usually good to show 0 if it's a dashboard, but table views usually hide)
                // Expense logic hides it: `if (group.count === 0) return null;`
                // But user says "Divide status... like expenses".
                // I will show it if count > 0, or maybe always? Expense only shows active groups typically.
                // Let's hide if 0 for cleaner UI.
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
                                        <th className="text-left px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">ชื่อโปรเจค</th>
                                        <th className="text-right px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">จำนวนเงิน</th>
                                        <th className="text-left px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">วันคาดการณ์</th>
                                        <th className="text-left px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">สถานะ</th>
                                        {(onEdit || onDelete) && <th className="text-center px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider w-[80px]">จัดการ</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {group.items.map((income, idx) => {
                                        const project = projects?.find(p => p.project_code === income.project_code || p.project_code === income.projectCode);
                                        const projectName = project ? project.project_name : '-';
                                        const projectCode = income.project_code || income.projectCode || '-';

                                        return (
                                            <tr key={income.id || idx} className="hover:bg-blue-50/30 transition-colors group">
                                                {/* Project Code */}
                                                <td className="px-4 py-3">
                                                    <span className="text-sm font-medium text-gray-900">{projectCode}</span>
                                                </td>
                                                {/* Project Name */}
                                                <td className="px-4 py-3">
                                                    <span className="text-sm text-gray-600 truncate max-w-[200px] block" title={projectName}>
                                                        {projectName}
                                                    </span>
                                                </td>
                                                {/* Amount */}
                                                <td className="px-4 py-3 text-right">
                                                    <span className="font-mono font-medium text-gray-900">฿{formatNumber(income.amount)}</span>
                                                </td>
                                                {/* Due Date */}
                                                <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                                                    {formatDateCE(income.due_date)}
                                                </td>
                                                {/* Status - Badge/Dropdown */}
                                                <td className="px-4 py-3">
                                                    <StatusBadge
                                                        status={income.status}
                                                        options={STATUS_DEFS}
                                                        onChange={(val) => onUpdateStatus && onUpdateStatus(income.id, val)}
                                                    />
                                                </td>
                                                {/* Actions */}
                                                {(onEdit || onDelete) && (
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {onEdit && (
                                                                <button
                                                                    onClick={() => onEdit(income)}
                                                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                    title="แก้ไข"
                                                                >
                                                                    <Pencil className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            {onDelete && (
                                                                <button
                                                                    onClick={() => onDelete(income)}
                                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                    title="ลบ"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default IncomeStatusGroupedTable;
