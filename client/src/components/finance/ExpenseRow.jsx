import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { formatNumber, formatDateCE } from '../../utils/formatters';
import StatusBadge from '../common/StatusBadge';
import AttachmentPreview from '../common/AttachmentPreview';
import { STATUS_DATA } from '../../constants/expenseStatus';

const ExpenseRow = ({ idx, expense, onEdit, onDelete, onViewAttachments, showStatus = true }) => {
    // Helper to check for legacy status (for StatusBadge options)
    const isLegacyStatus = ['ไม่อนุมัติ', 'Rejected', 'จ่ายแล้ว', 'Paid'].includes(expense.status);
    const displayStatus = isLegacyStatus ? expense.status : expense.internal_status;
    const additionalStatusOptions = [{ value: 'ไม่อนุมัติ', label: 'ไม่อนุมัติ', color: 'red' }];

    return (
        <tr
            className={`hover:bg-blue-50/30 transition-colors ${idx % 2 === 1 ? 'bg-gray-50/30' : ''}`}
        >
            {/* รหัส (Project Code) */}
            <td className="px-4 py-3">
                <span className="text-sm font-medium text-gray-900">
                    {expense.project_code || '-'}
                </span>
            </td>

            {/* ... (Other columns omitted for brevity in replacement, ensure to keep them) ... */}
            {/* Actually, I should use StartLine/EndLine carefully to just wrap the status column or change the signature */}
            {/* Let's redo the replacement to target the signature and the column separately or just replace the whole component if it's cleaner, but it's large. */}
            {/* Replacing lines 8-8 to add prop, and lines 79-85 to condition it */}


            {/* ประเภท */}
            <td className="px-4 py-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${expense.expense_type === 'สำรองจ่าย' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-green-50 text-green-600 border border-green-200'}`}>
                    {expense.expense_type || 'วางบิล'}
                </span>
            </td>

            {/* รายละเอียด */}
            <td className="px-4 py-3">
                <div className="font-medium text-sm text-gray-900">{expense.account_title || '-'}</div>
                <div className="text-xs text-gray-500">{expense.description || '-'}</div>
            </td>

            {/* ผู้รับเงิน */}
            <td className="px-4 py-3">
                {expense.payback_to ? (
                    <div>
                        <div className="text-sm text-gray-900 font-medium">{expense.payback_to}</div>
                        {expense.contact && expense.contact !== expense.payback_to && (
                            <div className="text-xs text-gray-500">({expense.contact})</div>
                        )}
                    </div>
                ) : (
                    <div>
                        <div className="text-sm text-gray-700">{expense.contact || '-'}</div>
                        {expense.bill_header && expense.bill_header !== expense.contact && (
                            <div className="text-xs text-gray-400">{expense.bill_header}</div>
                        )}
                    </div>
                )}
            </td>

            {/* กำหนดจ่าย (due_date) */}
            <td className="px-4 py-3 text-sm text-gray-500">
                {formatDateCE(expense.due_date)}
            </td>

            {/* จำนวนเงิน */}
            <td className="px-4 py-3 text-right">
                <span className="text-sm font-semibold text-red-600">
                    ฿{formatNumber(expense.net_amount)}
                </span>
            </td>

            {/* ไฟล์แนบ */}
            <td className="px-4 py-3 text-center">
                <AttachmentPreview
                    attachments={expense.attachments || []}
                    onOpenModal={() => onViewAttachments(expense.attachments)}
                    size="sm"
                />
            </td>

            {/* สถานะ (internal_status) - Read Only */}
            {/* สถานะ (internal_status) - Read Only */}
            {showStatus && (
                <td className="px-4 py-3">
                    <StatusBadge
                        status={displayStatus}
                        options={[...additionalStatusOptions, ...STATUS_DATA]}
                        readOnly={true}
                    />
                </td>
            )}

            {/* จัดการ */}
            <td className="px-4 py-3">
                <div className="flex items-center justify-center gap-1">
                    <button
                        onClick={() => onEdit(expense)}
                        className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                        title="แก้ไข"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(expense)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="ลบ"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
};

export default ExpenseRow;
