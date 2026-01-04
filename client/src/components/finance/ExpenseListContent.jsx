import React, { useState, useMemo } from 'react';
import AddExpenseModal from './AddExpenseModal';
import EditExpenseModal from './EditExpenseModal';
import { projectAPI } from '../../services/api';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { formatNumber, formatDateCE } from '../../utils/formatters';
import StatusBadge from '../common/StatusBadge';
import AttachmentPreview from '../common/AttachmentPreview';
import ViewAttachmentsModal from '../common/ViewAttachmentsModal';
import MinimalDropdown from '../common/MinimalDropdown';
import ConfirmDeleteModal from '../common/ConfirmDeleteModal';

const ExpenseListContent = ({ expenses, onRefresh, isLoading }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [viewingAttachments, setViewingAttachments] = useState(null);

    const statusData = [
        { value: 'ส่งเบิกแล้ว รอเอกสารตัวจริง', label: 'รอเอกสาร', color: 'yellow' },
        { value: 'บัญชีตรวจ และ ได้รับเอกสารตัวจริง', label: 'บัญชีตรวจแล้ว', color: 'blue' },
        { value: 'VP อนุมัติแล้ว ส่งเบิกได้', label: 'VP อนุมัติแล้ว', color: 'purple' },
        { value: 'ส่งเข้า PEAK', label: 'ส่งเข้า PEAK', color: 'indigo' },
        { value: 'โอนแล้ว รอส่งหลักฐาน', label: 'รอส่งหลักฐาน', color: 'cyan' },
        { value: 'ส่งหลักฐานแล้ว เอกสารครบ', label: 'ส่งหลักฐานแล้ว', color: 'green' },
        { value: 'reject ยกเลิก / รอแก้ไข', label: 'ยกเลิก / รอแก้ไข', color: 'red' }
    ];

    const statusOptions = ['ทั้งหมด', ...statusData.map(s => s.value)];

    // Filter Logic
    const filteredExpenses = useMemo(() => {
        return expenses.filter(e => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch =
                (e.description && e.description.toLowerCase().includes(searchLower)) ||
                (e.account_code && e.account_code.toLowerCase().includes(searchLower)) ||
                (e.contact && e.contact.toLowerCase().includes(searchLower)) ||
                (e.bill_header && e.bill_header.toLowerCase().includes(searchLower)) ||
                (e.project_code && e.project_code.toLowerCase().includes(searchLower));

            const matchStatus = statusFilter === 'all' || e.internal_status === statusFilter;

            return matchesSearch && matchStatus;
        });
    }, [expenses, searchTerm, statusFilter]);

    // Calculate total
    const totalAmount = useMemo(() => {
        return filteredExpenses.reduce((sum, e) => sum + (parseFloat(e.net_amount) || 0), 0);
    }, [filteredExpenses]);

    const handleAddSubmit = async (newExpense, attachments = []) => {
        try {
            // 1. Create expense first
            const res = await projectAPI.createExpense(newExpense);
            const expenseId = res.data?.id;

            // 2. Upload attachments if any
            if (expenseId && attachments && attachments.length > 0) {
                const uploadPromises = attachments.map(file => {
                    const formData = new FormData();
                    formData.append('files', file);
                    return projectAPI.uploadExpenseAttachment(expenseId, formData);
                });
                await Promise.all(uploadPromises);
            }

            onRefresh();
        } catch (err) {
            console.error("Failed to create expense", err);
        }
    };

    const handleEditSubmit = async (updatedExpense) => {
        try {
            await projectAPI.updateExpense(editingExpense.id, updatedExpense);
            onRefresh();
            setEditingExpense(null);
        } catch (err) {
            console.error("Failed to update expense", err);
        }
    };

    const handleUpdateExpenseStatus = async (id, newStatus) => {
        try {
            await projectAPI.updateExpenseStatus(id, { internal_status: newStatus });
            onRefresh();
        } catch (err) {
            console.error("Failed to update status", err);
        }
    };

    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        expenseId: null,
        expenseName: ''
    });

    const handleDeleteClick = (expense) => {
        setDeleteModal({
            isOpen: true,
            expenseId: expense.id,
            expenseName: expense.description || expense.bill_header || 'รายการค่าใช้จ่าย'
        });
    };

    const handleConfirmDelete = async () => {
        if (!deleteModal.expenseId) return;

        try {
            await projectAPI.deleteExpense(deleteModal.expenseId);
            onRefresh();
            setDeleteModal({ isOpen: false, expenseId: null, expenseName: '' });
        } catch (err) {
            console.error("Failed to delete expense", err);
        }
    };

    return (
        <>
            {/* Filter Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        {/* Search */}
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="ค้นหารายจ่าย..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center">
                            <MinimalDropdown
                                label="สถานะ"
                                value={statusFilter}
                                options={statusOptions.filter(o => o !== 'ทั้งหมด')}
                                onChange={setStatusFilter}
                                allLabel="ทั้งหมด"
                            />
                        </div>

                        {/* Count */}
                        <span className="text-sm text-gray-500 whitespace-nowrap">
                            {filteredExpenses.length} / {expenses.length} รายการ
                        </span>
                    </div>

                    {/* Add Button */}
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm hover:shadow-md whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" />
                        เพิ่มรายจ่าย
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-100">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">รหัสโปรเจค</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ประเภท</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">รายละเอียด</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ผู้รับเงิน</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">กำหนดจ่าย</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">จำนวนเงิน</th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ไฟล์แนบ</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">สถานะ</th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-12 text-gray-400">
                                        กำลังโหลด...
                                    </td>
                                </tr>
                            ) : filteredExpenses.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-12 text-gray-400">
                                        ไม่พบรายการ
                                    </td>
                                </tr>
                            ) : (
                                filteredExpenses.map((expense, idx) => (
                                    <tr
                                        key={expense.id}
                                        className={`hover:bg-blue-50/30 transition-colors ${idx % 2 === 1 ? 'bg-gray-50/30' : ''}`}
                                    >
                                        {/* รหัส (Project Code) */}
                                        <td className="px-4 py-3">
                                            <span className="text-sm font-medium text-gray-900">
                                                {expense.project_code || '-'}
                                            </span>
                                        </td>

                                        {/* ประเภท */}
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${expense.expense_type === 'เบิกที่สำรองจ่าย' ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'bg-blue-50 text-blue-600 border border-blue-200'}`}>
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
                                                onOpenModal={() => setViewingAttachments(expense.attachments)}
                                                size="sm"
                                            />
                                        </td>

                                        {/* สถานะ (internal_status) - Read Only */}
                                        <td className="px-4 py-3">
                                            <StatusBadge
                                                status={['ไม่อนุมัติ', 'Rejected', 'จ่ายแล้ว', 'Paid'].includes(expense.status) ? expense.status : expense.internal_status}
                                                options={[{ value: 'ไม่อนุมัติ', label: 'ไม่อนุมัติ', color: 'red' }, ...statusData]}
                                                readOnly={true}
                                            />
                                        </td>

                                        {/* จัดการ */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => setEditingExpense(expense)}
                                                    className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                                                    title="แก้ไข"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(expense)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                    title="ลบ"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>

                        {/* Total Footer */}
                        {!isLoading && filteredExpenses.length > 0 && (
                            <tfoot>
                                <tr className="bg-gray-50/80 border-t border-gray-200">
                                    <td colSpan={5} className="px-4 py-3 text-right">
                                        <span className="text-sm font-medium text-gray-600">รวมทั้งสิ้น</span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span className="text-base font-bold text-orange-600">
                                            ฿{formatNumber(totalAmount)}
                                        </span>
                                    </td>
                                    <td colSpan={3}></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            {/* Modals */}
            <AddExpenseModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleAddSubmit}
            />

            {editingExpense && (
                <EditExpenseModal
                    isOpen={!!editingExpense}
                    onClose={() => setEditingExpense(null)}
                    expense={editingExpense}
                    onSubmit={handleEditSubmit}
                />
            )}

            <ViewAttachmentsModal
                isOpen={!!viewingAttachments}
                onClose={() => setViewingAttachments(null)}
                attachments={viewingAttachments || []}
            />

            <ConfirmDeleteModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                onConfirm={handleConfirmDelete}
                title="ยืนยันการลบรายจ่าย"
                itemName={deleteModal.expenseName}
                warningMessage="การดำเนินการนี้ไม่สามารถย้อนกลับได้"
            />
        </>
    );
};

export default ExpenseListContent;
