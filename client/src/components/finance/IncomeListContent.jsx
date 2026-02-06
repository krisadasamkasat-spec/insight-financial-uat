import React, { useState, useMemo } from 'react';
import { Search, Filter, Download, Plus, MoreVertical, FileText, ExternalLink, Trash2, Pencil } from 'lucide-react';
import { formatNumber, formatDateCE } from '../../utils/formatters';
import AttachmentPreview from '../common/AttachmentPreview';
import Dropdown from '../common/Dropdown';
import StatusBadge from '../common/StatusBadge';

const IncomeListContent = ({ incomes, projects, onRefresh, isLoading, onEdit, onDelete, onUpdateStatus }) => {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all'); // 'all', 'thisMonth', 'lastMonth'

    const filteredIncomes = useMemo(() => {
        if (!incomes) return [];
        return incomes.filter(income => {
            const matchesSearch = search === '' ||
                (income.description || '').toLowerCase().includes(search.toLowerCase()) ||
                (income.projectCode || '').toLowerCase().includes(search.toLowerCase());

            // Normalize status for filtering
            const rawStatus = income.status?.toLowerCase() || '';
            const filter = statusFilter.toLowerCase();
            const matchesStatus = statusFilter === 'all' || rawStatus === filter;

            return matchesSearch && matchesStatus;
        });
    }, [incomes, search, statusFilter]);

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading incomes...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Filter Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 w-full md:w-auto flex-1">
                        {/* Search */}
                        <div className="relative flex-1 md:max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="ค้นหารายรับ, รหัสโปรเจค..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="w-40">
                            <Dropdown
                                width="full"
                                label="สถานะ"
                                value={statusFilter}
                                options={[
                                    { value: 'pending', label: 'รอรับ' },
                                    { value: 'received', label: 'ได้รับแล้ว' }
                                ]}
                                onChange={setStatusFilter}
                                showAllOption
                                allLabel="ทั้งหมด"
                            />
                        </div>
                    </div>

                    <div className="text-sm text-gray-500">
                        Total: {filteredIncomes.length} items
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-100">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">รหัสโปรเจค</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ชื่อโปรเจค</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">จำนวนเงิน</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">วันคาดการณ์</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">สถานะ</th>
                                {(onEdit || onDelete) && <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">จัดการ</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredIncomes.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-16 text-gray-400">
                                        ไม่พบรายการรายรับ
                                    </td>
                                </tr>
                            ) : (
                                filteredIncomes.map((income, idx) => {
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
                                                    options={[
                                                        { value: 'pending', label: 'รอรับ', color: 'yellow' },
                                                        { value: 'received', label: 'ได้รับแล้ว', color: 'emerald' }
                                                    ]}
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
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Pagination (Optional) */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 text-xs text-gray-500 flex justify-between items-center">
                    <span>แสดง {filteredIncomes.length} รายการ</span>
                </div>
            </div>
        </div>
    );
};

export default IncomeListContent;
