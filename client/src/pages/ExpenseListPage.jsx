import React, { useState, useEffect, useMemo } from 'react';
import AddExpenseModal from '../components/finance/AddExpenseModal';
import EditExpenseModal from '../components/finance/EditExpenseModal';
import { projectAPI, API_BASE } from '../services/api';
import { Plus, Search, Pencil, Trash2, ChevronDown } from 'lucide-react';
import { formatNumber, formatDateCE } from '../utils/formatters';
import StatusBadge from '../components/common/StatusBadge';
import AttachmentPreview from '../components/common/AttachmentPreview';
import ViewAttachmentsModal from '../components/common/ViewAttachmentsModal';
import { useSettings } from '../contexts/SettingsContext';

const ExpenseListPage = () => {
    const { getProjectStatusOptions } = useSettings();
    const [expenses, setExpenses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ทั้งหมด');
    const [viewingAttachments, setViewingAttachments] = useState(null);

    const statusData = [
        { value: 'ส่งเบิกแล้ว รอเอกสารตัวจริง', label: 'รอเอกสาร', color: 'yellow' },
        { value: 'บัญชีตรวจ และ ได้รับเอกสารตัวจริง', label: 'บัญชีตรวจ', color: 'blue' },
        { value: 'VP อนุมัติแล้ว ส่งเบิกได้', label: 'VP อนุมัติ', color: 'purple' },
        { value: 'ส่งเข้า PEAK', label: 'ส่ง PEAK', color: 'indigo' },
        { value: 'โอนแล้ว รอส่งหลักฐาน', label: 'รอหลักฐาน', color: 'cyan' },
        { value: 'ส่งหลักฐานแล้ว เอกสารครบ', label: 'เสร็จสิ้น', color: 'green' },
        { value: 'reject ยกเลิก / รอแก้ไข', label: 'ยกเลิก', color: 'red' }
    ];

    // Status Filter Options
    // Status Filter Options
    const statusOptions = ['ทั้งหมด', ...statusData.map(s => s.value)];

    // Fetch Data
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await projectAPI.getAllExpenses();
            // Sort by created_at descending (newest first)
            const sorted = res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setExpenses(sorted);
        } catch (err) {
            console.error("Failed to load expenses", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Filter Logic - using new field names
    const filteredExpenses = useMemo(() => {
        return expenses.filter(e => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch =
                (e.description && e.description.toLowerCase().includes(searchLower)) ||
                (e.account_code && e.account_code.toLowerCase().includes(searchLower)) ||
                (e.contact && e.contact.toLowerCase().includes(searchLower)) ||
                (e.bill_header && e.bill_header.toLowerCase().includes(searchLower)) ||
                (e.project_code && e.project_code.toLowerCase().includes(searchLower));

            const matchStatus = statusFilter === 'ทั้งหมด' || e.internal_status === statusFilter;

            return matchesSearch && matchStatus;
        });
    }, [expenses, searchTerm, statusFilter]);

    // Calculate total
    const totalAmount = useMemo(() => {
        return filteredExpenses.reduce((sum, e) => sum + (parseFloat(e.net_amount) || 0), 0);
    }, [filteredExpenses]);

    const handleAddSubmit = async (newExpense) => {
        try {
            await projectAPI.createExpense(newExpense);
            fetchData();
        } catch (err) {
            console.error("Failed to create expense", err);
        }
    };

    const handleEditSubmit = async (updatedExpense) => {
        try {
            await projectAPI.updateExpense(editingExpense.id, updatedExpense);
            fetchData();
            setEditingExpense(null);
        } catch (err) {
            console.error("Failed to update expense", err);
        }
    };
    const handleUpdateExpenseStatus = async (id, newStatus) => {
        try {
            await projectAPI.updateExpenseStatus(id, { status: newStatus });
            setExpenses(prev => prev.map(e => e.id === id ? { ...e, internal_status: newStatus } : e));
        } catch (err) {
            console.error("Failed to update status", err);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('ต้องการลบรายการนี้หรือไม่?')) return;
        try {
            await projectAPI.deleteExpense(id);
            fetchData();
        } catch (err) {
            console.error("Failed to delete expense", err);
        }
    };

    return (
        <div className="p-6 max-w-[1400px] mx-auto min-h-screen bg-gray-50/30">
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
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">สถานะ:</span>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                            >
                                {statusOptions.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
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
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">รหัสโครงการ</th>
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
                                    <td colSpan={8} className="text-center py-12 text-gray-400">
                                        กำลังโหลด...
                                    </td>
                                </tr>
                            ) : filteredExpenses.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-12 text-gray-400">
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
                                            <span className="text-sm font-medium text-blue-600">
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
                                            {/* Logic: PaybackTo is primary (who gets money). Contact is secondary (shop/person dealing with). */}
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
                                            <span className="text-sm font-semibold text-blue-700">
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

                                        {/* สถานะ (internal_status) */}
                                        <td className="px-4 py-3">
                                            <StatusBadge
                                                status={expense.internal_status}
                                                options={statusData}
                                                onChange={(s) => handleUpdateExpenseStatus(expense.id, s)}
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
                                                    onClick={() => handleDelete(expense.id)}
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
                                    <td colSpan={6} className="px-4 py-3 text-right">
                                        <span className="text-sm font-medium text-gray-600">รวมทั้งสิ้น</span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span className="text-base font-bold text-orange-600">
                                            ฿{formatNumber(totalAmount)}
                                        </span>
                                    </td>
                                    <td></td>
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
        </div>
    );
};

export default ExpenseListPage;
