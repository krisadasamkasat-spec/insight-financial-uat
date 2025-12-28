import React, { useState } from 'react';
import { Pencil, Trash2, Plus, Check } from 'lucide-react';
import Modal from '../common/Modal';
import { useSettings } from '../../contexts/SettingsContext';

// Color swatches for picking colors - Full Tailwind palette
const COLOR_SWATCHES = [
    // Grays
    { value: 'slate', label: 'Slate', bg: 'bg-slate-500', ring: 'ring-slate-400' },
    { value: 'gray', label: 'Gray', bg: 'bg-gray-500', ring: 'ring-gray-400' },
    { value: 'zinc', label: 'Zinc', bg: 'bg-zinc-500', ring: 'ring-zinc-400' },
    { value: 'neutral', label: 'Neutral', bg: 'bg-neutral-500', ring: 'ring-neutral-400' },
    { value: 'stone', label: 'Stone', bg: 'bg-stone-500', ring: 'ring-stone-400' },
    // Reds
    { value: 'red', label: 'Red', bg: 'bg-red-500', ring: 'ring-red-400' },
    { value: 'rose', label: 'Rose', bg: 'bg-rose-500', ring: 'ring-rose-400' },
    { value: 'pink', label: 'Pink', bg: 'bg-pink-500', ring: 'ring-pink-400' },
    // Oranges
    { value: 'orange', label: 'Orange', bg: 'bg-orange-500', ring: 'ring-orange-400' },
    { value: 'amber', label: 'Amber', bg: 'bg-amber-500', ring: 'ring-amber-400' },
    { value: 'yellow', label: 'Yellow', bg: 'bg-yellow-500', ring: 'ring-yellow-400' },
    // Greens
    { value: 'lime', label: 'Lime', bg: 'bg-lime-500', ring: 'ring-lime-400' },
    { value: 'green', label: 'Green', bg: 'bg-green-500', ring: 'ring-green-400' },
    { value: 'emerald', label: 'Emerald', bg: 'bg-emerald-500', ring: 'ring-emerald-400' },
    { value: 'teal', label: 'Teal', bg: 'bg-teal-500', ring: 'ring-teal-400' },
    // Blues
    { value: 'cyan', label: 'Cyan', bg: 'bg-cyan-500', ring: 'ring-cyan-400' },
    { value: 'sky', label: 'Sky', bg: 'bg-sky-500', ring: 'ring-sky-400' },
    { value: 'blue', label: 'Blue', bg: 'bg-blue-500', ring: 'ring-blue-400' },
    { value: 'indigo', label: 'Indigo', bg: 'bg-indigo-500', ring: 'ring-indigo-400' },
    // Purples
    { value: 'violet', label: 'Violet', bg: 'bg-violet-500', ring: 'ring-violet-400' },
    { value: 'purple', label: 'Purple', bg: 'bg-purple-500', ring: 'ring-purple-400' },
    { value: 'fuchsia', label: 'Fuchsia', bg: 'bg-fuchsia-500', ring: 'ring-fuchsia-400' },
];

const StatusSettingsTab = () => {
    // Context access
    const { expenseStatusColors, setExpenseStatusColors } = useSettings();

    // Modal states
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [editingStatus, setEditingStatus] = useState(null);
    const [deleteStatusConfirm, setDeleteStatusConfirm] = useState(null);

    // Get color bg class
    const getColorBg = (colorValue) => {
        const swatch = COLOR_SWATCHES.find(s => s.value === colorValue);
        return swatch ? swatch.bg : 'bg-gray-500';
    };

    // Status Color handlers
    const handleAddStatus = () => {
        setEditingStatus({ key: '', label: '', color: 'gray', isNew: true });
        setIsStatusModalOpen(true);
    };

    const handleEditStatus = (status) => {
        setEditingStatus({ ...status, isNew: false });
        setIsStatusModalOpen(true);
    };

    const handleSaveStatus = () => {
        if (editingStatus.isNew) {
            setExpenseStatusColors(prev => [...prev, {
                key: editingStatus.key,
                label: editingStatus.label,
                color: editingStatus.color
            }]);
        } else {
            setExpenseStatusColors(prev => prev.map(s =>
                s.key === editingStatus.key ? editingStatus : s
            ));
        }
        setIsStatusModalOpen(false);
        setEditingStatus(null);
    };

    const handleDeleteStatus = (key) => {
        setExpenseStatusColors(prev => prev.filter(s => s.key !== key));
        setDeleteStatusConfirm(null);
    };

    return (
        <div className="space-y-8">
            {/* Expense Status Colors */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">สถานะค่าใช้จ่าย</h3>
                        <p className="text-sm text-gray-500 mt-1">กำหนดสีสำหรับแต่ละสถานะของค่าใช้จ่าย เช่น วางบิล, สำรองจ่าย, จ่ายแล้ว</p>
                    </div>
                    <button
                        onClick={handleAddStatus}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        เพิ่มสถานะ
                    </button>
                </div>
                <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">รหัส</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ชื่อ</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">สี</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ตัวอย่าง</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase w-24">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {expenseStatusColors.map((status) => (
                                <tr key={status.key} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-mono text-gray-700">{status.key}</td>
                                    <td className="px-4 py-3 text-gray-800">{status.label}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-5 h-5 rounded-full ${getColorBg(status.color)}`} />
                                            <span className="text-gray-500 text-xs capitalize">{status.color}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-${status.color}-100 text-${status.color}-700 border border-${status.color}-200`}>
                                            {status.label}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => handleEditStatus(status)}
                                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                title="แก้ไข"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteStatusConfirm(status.key)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
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
                </div>
            </div>

            {/* Edit Status Modal */}
            <Modal
                isOpen={isStatusModalOpen}
                onClose={() => setIsStatusModalOpen(false)}
                title={editingStatus?.isNew ? 'เพิ่มสถานะ' : 'แก้ไขสถานะ'}
            >
                {editingStatus && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">รหัส/คีย์</label>
                            <input
                                type="text"
                                value={editingStatus.key}
                                onChange={(e) => setEditingStatus(prev => ({ ...prev, key: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="เช่น วางบิล, สำรองจ่าย"
                                disabled={!editingStatus.isNew}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อที่แสดง</label>
                            <input
                                type="text"
                                value={editingStatus.label}
                                onChange={(e) => setEditingStatus(prev => ({ ...prev, label: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="ชื่อสถานะ"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">สี</label>
                            <div className="flex flex-wrap gap-2">
                                {COLOR_SWATCHES.map(swatch => (
                                    <button
                                        key={swatch.value}
                                        type="button"
                                        onClick={() => setEditingStatus(prev => ({ ...prev, color: swatch.value }))}
                                        className={`w-8 h-8 rounded-lg ${swatch.bg} transition-all hover:scale-110 flex items-center justify-center ${editingStatus.color === swatch.value ? 'ring-2 ring-offset-2 ' + swatch.ring : ''
                                            }`}
                                        title={swatch.label}
                                    >
                                        {editingStatus.color === swatch.value && (
                                            <Check className="w-4 h-4 text-white" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                onClick={() => setIsStatusModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSaveStatus}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                                disabled={!editingStatus.key || !editingStatus.label}
                            >
                                บันทึก
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Status Confirmation */}
            <Modal
                isOpen={!!deleteStatusConfirm}
                onClose={() => setDeleteStatusConfirm(null)}
                title="ยืนยันการลบ"
            >
                <p className="text-gray-600 mb-6">คุณต้องการลบสถานะ "{deleteStatusConfirm}" หรือไม่?</p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={() => setDeleteStatusConfirm(null)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={() => handleDeleteStatus(deleteStatusConfirm)}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                        ลบ
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default StatusSettingsTab;
