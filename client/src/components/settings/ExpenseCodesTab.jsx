import React, { useState, useEffect } from 'react';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';
import { projectAPI } from '../../services/api';
import Modal from '../common/Modal';
import MinimalDropdown from '../common/MinimalDropdown';
import FormDropdown from '../common/FormDropdown';

const ExpenseCodesTab = () => {
    const [expenseCodes, setExpenseCodes] = useState([]);

    // Fetch on mount
    useEffect(() => {
        const fetchCodes = async () => {
            try {
                const res = await projectAPI.getExpenseCodes();
                setExpenseCodes(res.data);
            } catch (err) {
                console.error("Failed to load expense codes", err);
            }
        };
        fetchCodes();
    }, []);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCode, setEditingCode] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const categoryLabels = {
        training: 'ต้นทุนการอบรม',
        sales: 'ค่าใช้จ่ายขาย',
        marketing: 'การตลาด',
        admin: 'ค่าใช้จ่ายบริหาร',
    };

    const categoryOptions = ['ต้นทุนการอบรม', 'ค่าใช้จ่ายขาย', 'การตลาด', 'ค่าใช้จ่ายบริหาร'];

    // Options for FormDropdown in modal
    const categoryFormOptions = [
        { value: 'training', label: 'ต้นทุนการอบรม' },
        { value: 'sales', label: 'ค่าใช้จ่ายขาย' },
        { value: 'marketing', label: 'การตลาด' },
        { value: 'admin', label: 'ค่าใช้จ่ายบริหาร' },
    ];

    const categoryColors = {
        training: 'bg-blue-100 text-blue-700',
        sales: 'bg-green-100 text-green-700',
        marketing: 'bg-purple-100 text-purple-700',
        admin: 'bg-orange-100 text-orange-700',
    };

    // Map display label to category key
    const labelToCategory = {
        'ต้นทุนการอบรม': 'training',
        'ค่าใช้จ่ายขาย': 'sales',
        'การตลาด': 'marketing',
        'ค่าใช้จ่ายบริหาร': 'admin',
    };

    // Handle filter change from MinimalDropdown
    const handleCategoryFilterChange = (value) => {
        if (value === 'all') {
            setCategoryFilter('all');
        } else {
            setCategoryFilter(labelToCategory[value] || 'all');
        }
    };

    // Get current filter display value
    const getFilterDisplayValue = () => {
        if (categoryFilter === 'all') return 'all';
        return categoryLabels[categoryFilter] || 'all';
    };

    // Filter expense codes
    const filteredCodes = expenseCodes.filter(code => {
        const matchesSearch = code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            code.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || code.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const handleAdd = () => {
        setEditingCode({ code: '', title: '', category: 'training', isNew: true });
        setIsModalOpen(true);
    };

    const handleEdit = (code) => {
        setEditingCode({ ...code, isNew: false });
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (editingCode.isNew) {
            setExpenseCodes(prev => [...prev, { code: editingCode.code, title: editingCode.title, category: editingCode.category }]);
        } else {
            setExpenseCodes(prev => prev.map(c => c.code === editingCode.code ? editingCode : c));
        }
        setIsModalOpen(false);
        setEditingCode(null);
    };

    const handleDelete = (code) => {
        setExpenseCodes(prev => prev.filter(c => c.code !== code));
        setDeleteConfirm(null);
    };

    return (
        <div className="space-y-4">
            {/* Search and Filter */}
            <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex gap-3 items-center">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="ค้นหารหัสหรือชื่อ..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                        />
                    </div>
                    <MinimalDropdown
                        label="หมวด"
                        value={getFilterDisplayValue()}
                        options={categoryOptions}
                        onChange={handleCategoryFilterChange}
                        allLabel="ทั้งหมด"
                    />
                </div>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    เพิ่มรหัส
                </button>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-28">รหัส</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ชื่อค่าใช้จ่าย</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-40">หมวดหมู่</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredCodes.map((item) => (
                            <tr key={item.code} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-mono text-gray-800">{item.code}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{item.title}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 text-xs rounded-full ${categoryColors[item.category]}`}>
                                        {categoryLabels[item.category]}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-center gap-1">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="แก้ไข"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirm(item.code)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="ลบ"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredCodes.length === 0 && (
                    <div className="py-8 text-center text-gray-500">
                        ไม่พบข้อมูล
                    </div>
                )}
            </div>

            <p className="text-xs text-gray-500">
                แสดง {filteredCodes.length} จาก {expenseCodes.length} รายการ
            </p>

            {/* Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingCode?.isNew ? 'เพิ่มรหัสค่าใช้จ่าย' : 'แก้ไขรหัสค่าใช้จ่าย'}
            >
                {editingCode && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">รหัส</label>
                            <input
                                type="text"
                                value={editingCode.code}
                                onChange={(e) => setEditingCode(prev => ({ ...prev, code: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="เช่น 510130"
                                disabled={!editingCode.isNew}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อค่าใช้จ่าย</label>
                            <input
                                type="text"
                                value={editingCode.title}
                                onChange={(e) => setEditingCode(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="ชื่อค่าใช้จ่าย"
                            />
                        </div>
                        <FormDropdown
                            label="หมวดหมู่"
                            value={editingCode.category}
                            options={categoryFormOptions}
                            onChange={(value) => setEditingCode(prev => ({ ...prev, category: value }))}
                        />
                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                                disabled={!editingCode.code || !editingCode.title}
                            >
                                บันทึก
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="ยืนยันการลบ"
            >
                <p className="text-gray-600 mb-6">คุณต้องการลบรหัส "{deleteConfirm}" หรือไม่?</p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={() => handleDelete(deleteConfirm)}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                        ลบ
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default ExpenseCodesTab;
