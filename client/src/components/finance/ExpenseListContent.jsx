import React, { useState, useMemo, useEffect } from 'react';
import ExpenseModal from './ExpenseModal';
import { projectAPI } from '../../services/api';
import { Plus, Search, Pencil, Trash2, LayoutList, Layers } from 'lucide-react'; // Added Icons
import { formatNumber, formatDateCE } from '../../utils/formatters';
import StatusBadge from '../common/StatusBadge';
import AttachmentPreview from '../common/AttachmentPreview';
import FileRepository from '../common/FileRepository';
import Dropdown from '../common/Dropdown';
import ConfirmDeleteModal from '../common/ConfirmDeleteModal';
import ExpenseRow from './ExpenseRow';
import StatusGroupedTable from './StatusGroupedTable'; // Added
import { STATUS_DATA } from '../../constants/expenseStatus';

const ExpenseListContent = ({ expenses, onRefresh, isLoading, projectCode }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [viewingAttachments, setViewingAttachments] = useState(null);
    const [viewMode, setViewMode] = useState('flat'); // 'flat' | 'grouped'
    const [payRoundFilter, setPayRoundFilter] = useState('all'); // Default 'all'

    const statusOptions = ['ทั้งหมด', ...STATUS_DATA.map(s => s.value)];

    // Derive Pay Rounds from Expenses
    const payRoundOptions = useMemo(() => {
        const rounds = new Set();
        expenses.forEach(e => {
            const date = e.payment_date || e.due_date;
            if (date) rounds.add(date);
        });

        // Sort DESC
        const sorted = Array.from(rounds).sort((a, b) => new Date(b) - new Date(a));

        return [
            { value: 'all', label: 'ทั้งหมด' },
            ...sorted.map(d => ({ value: d, label: formatDateCE(d) }))
        ];
    }, [expenses]);

    // Removed auto-set useEffect

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

            let matchPayRound = true;
            if (viewMode === 'grouped' && payRoundFilter !== 'all') {
                const d = e.payment_date || e.due_date;
                matchPayRound = d === payRoundFilter;
            }

            return matchesSearch && matchStatus && matchPayRound;
        });
    }, [expenses, searchTerm, statusFilter, payRoundFilter, viewMode]);

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
        <div className="space-y-6">
            {/* Header Controls */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                {/* View Toggle & Pay Round (Left Side) - Hidden in flat view as per request "No Pay Round in list page" */}
                {viewMode === 'grouped' ? (
                    <div className="flex items-center gap-3 bg-white p-1 rounded-xl border border-gray-200 shadow-sm h-[46px]">
                        <Dropdown
                            inline
                            label="รอบจ่าย"
                            value={payRoundFilter}
                            options={payRoundOptions}
                            onChange={setPayRoundFilter}
                            minWidth="140px"
                        />
                    </div>
                ) : <div></div>}

                {/* Right Side Controls (Search, Status, View Toggle, Add) */}
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    {/* Search */}
                    <div className="relative flex-1 lg:flex-none h-[46px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="ค้นหา..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 h-full w-full lg:w-64 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                        />
                    </div>

                    {/* Status Filter (Only show in Flat Mode) */}
                    {viewMode === 'flat' && (
                        <div className="flex items-center gap-2 bg-white px-3 border border-gray-200 rounded-lg shadow-sm h-[46px]">
                            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">สถานะ:</span>
                            <Dropdown
                                inline
                                showAllOption
                                label="สถานะ"
                                value={statusFilter}
                                options={statusOptions.filter(o => o !== 'ทั้งหมด')}
                                onChange={setStatusFilter}
                                allLabel="ทั้งหมด"
                                minWidth="100px"
                                listMinWidth="200px"
                            />
                        </div>
                    )}

                    {/* View Toggle */}
                    <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 h-[46px] items-center">
                        <button
                            onClick={() => {
                                setViewMode('flat');
                                setPayRoundFilter('all'); // Reset filter when switching to flat
                            }}
                            className={`p-2 rounded-md transition-all h-full flex items-center justify-center ${viewMode === 'flat' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            title="รายการแบบตาราง"
                        >
                            <LayoutList size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('grouped')}
                            className={`p-2 rounded-md transition-all h-full flex items-center justify-center ${viewMode === 'grouped' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            title="แยกตามสถานะ"
                        >
                            <Layers size={20} />
                        </button>
                    </div>

                    {/* Count */}
                    <span className="text-sm text-gray-500 whitespace-nowrap hidden xl:inline">
                        {filteredExpenses.length} รายการ
                    </span>

                    {/* Add Button */}
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-4 h-[46px] rounded-lg font-medium transition-all shadow-sm hover:shadow-md whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" />
                        เพิ่มรายจ่าย
                    </button>
                </div>
            </div>

            {/* Content Renders */}
            {viewMode === 'flat' ? (
                /* Flat Table */
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
                                        <ExpenseRow
                                            key={expense.id}
                                            idx={idx}
                                            expense={expense}
                                            onEdit={setEditingExpense}
                                            onDelete={handleDeleteClick}
                                            onViewAttachments={setViewingAttachments}
                                        />
                                    ))
                                )}
                            </tbody>

                            {/* Total Footer */}
                            {!isLoading && filteredExpenses.length > 0 && (
                                <tfoot className="bg-gray-50 border-t border-gray-200">
                                    <tr>
                                        <td colSpan={5} className="px-4 py-3 text-right font-bold text-gray-900">รวมทั้งหมด</td>
                                        <td className="px-4 py-3 text-right font-bold text-red-600">฿{formatNumber(totalAmount)}</td>
                                        <td colSpan={3}></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>

            ) : (
                /* Grouped View */
                <StatusGroupedTable
                    expenses={filteredExpenses}
                    onEdit={setEditingExpense}
                    onDelete={handleDeleteClick}
                    onViewAttachments={setViewingAttachments}
                    isLoading={isLoading}
                />
            )}

            {/* Modals */}
            <ExpenseModal
                mode="add"
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleAddSubmit}
                projectCode={projectCode}
            />

            {editingExpense && (
                <ExpenseModal
                    mode="edit"
                    isOpen={!!editingExpense}
                    onClose={() => setEditingExpense(null)}
                    expense={editingExpense}
                    onSubmit={handleEditSubmit}
                />
            )}

            <FileRepository
                isOpen={!!viewingAttachments}
                onClose={() => setViewingAttachments(null)}
                documents={viewingAttachments || []}
            />

            <ConfirmDeleteModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                onConfirm={handleConfirmDelete}
                title="ยืนยันการลบรายจ่าย"
                itemName={deleteModal.expenseName}
                warningMessage="การดำเนินการนี้ไม่สามารถย้อนกลับได้"
            />
        </div>
    );
};

export default ExpenseListContent;
