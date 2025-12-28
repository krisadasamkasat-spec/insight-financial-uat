import React, { useState } from 'react';
import { Pencil, Trash2, Plus, Check } from 'lucide-react';
import Modal from '../common/Modal';
import { useSettings } from '../../contexts/SettingsContext';

// Color swatches for picking colors
const COLOR_SWATCHES = [
    { value: 'slate', label: 'Slate', bg: 'bg-slate-500', ring: 'ring-slate-400' },
    { value: 'gray', label: 'Gray', bg: 'bg-gray-500', ring: 'ring-gray-400' },
    { value: 'red', label: 'Red', bg: 'bg-red-500', ring: 'ring-red-400' },
    { value: 'rose', label: 'Rose', bg: 'bg-rose-500', ring: 'ring-rose-400' },
    { value: 'pink', label: 'Pink', bg: 'bg-pink-500', ring: 'ring-pink-400' },
    { value: 'orange', label: 'Orange', bg: 'bg-orange-500', ring: 'ring-orange-400' },
    { value: 'amber', label: 'Amber', bg: 'bg-amber-500', ring: 'ring-amber-400' },
    { value: 'yellow', label: 'Yellow', bg: 'bg-yellow-500', ring: 'ring-yellow-400' },
    { value: 'lime', label: 'Lime', bg: 'bg-lime-500', ring: 'ring-lime-400' },
    { value: 'green', label: 'Green', bg: 'bg-green-500', ring: 'ring-green-400' },
    { value: 'emerald', label: 'Emerald', bg: 'bg-emerald-500', ring: 'ring-emerald-400' },
    { value: 'teal', label: 'Teal', bg: 'bg-teal-500', ring: 'ring-teal-400' },
    { value: 'cyan', label: 'Cyan', bg: 'bg-cyan-500', ring: 'ring-cyan-400' },
    { value: 'sky', label: 'Sky', bg: 'bg-sky-500', ring: 'ring-sky-400' },
    { value: 'blue', label: 'Blue', bg: 'bg-blue-500', ring: 'ring-blue-400' },
    { value: 'indigo', label: 'Indigo', bg: 'bg-indigo-500', ring: 'ring-indigo-400' },
    { value: 'violet', label: 'Violet', bg: 'bg-violet-500', ring: 'ring-violet-400' },
    { value: 'purple', label: 'Purple', bg: 'bg-purple-500', ring: 'ring-purple-400' },
    { value: 'fuchsia', label: 'Fuchsia', bg: 'bg-fuchsia-500', ring: 'ring-fuchsia-400' },
];

const ProjectTypesTab = () => {
    const { projectTypes, setProjectTypes } = useSettings();

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Get color bg class
    const getColorBg = (colorValue) => {
        const swatch = COLOR_SWATCHES.find(s => s.value === colorValue);
        return swatch ? swatch.bg : 'bg-gray-500';
    };

    // Handlers
    const handleAdd = () => {
        setEditingType({ key: '', label: '', color: 'gray', isNew: true });
        setIsModalOpen(true);
    };

    const handleEdit = (type) => {
        setEditingType({ ...type, isNew: false });
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (editingType.isNew) {
            setProjectTypes(prev => [...prev, {
                key: editingType.key.toUpperCase(),
                label: editingType.label,
                color: editingType.color
            }]);
        } else {
            setProjectTypes(prev => prev.map(t =>
                t.key === editingType.key ? editingType : t
            ));
        }
        setIsModalOpen(false);
        setEditingType(null);
    };

    const handleDelete = (key) => {
        setProjectTypes(prev => prev.filter(t => t.key !== key));
        setDeleteConfirm(null);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">ประเภทโปรเจค</h3>
                    <p className="text-sm text-gray-500 mt-1">จัดการประเภทโปรเจคที่ใช้ในระบบ เช่น In-House, Public, Event</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    เพิ่มประเภท
                </button>
            </div>

            {/* Table */}
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
                        {projectTypes.map((type) => (
                            <tr key={type.key} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-mono text-gray-700">{type.key}</td>
                                <td className="px-4 py-3 text-gray-800">{type.label}</td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-5 h-5 rounded-full ${getColorBg(type.color)}`} />
                                        <span className="text-gray-500 text-xs capitalize">{type.color}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold bg-${type.color}-100 text-${type.color}-700 border border-${type.color}-200`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${getColorBg(type.color)}`}></div>
                                        {type.key}00001
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-center gap-1">
                                        <button
                                            onClick={() => handleEdit(type)}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                            title="แก้ไข"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirm(type.key)}
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

            {/* Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingType?.isNew ? 'เพิ่มประเภทโปรเจค' : 'แก้ไขประเภทโปรเจค'}
            >
                {editingType && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">รหัส (Prefix)</label>
                            <input
                                type="text"
                                value={editingType.key}
                                onChange={(e) => setEditingType(prev => ({ ...prev, key: e.target.value.toUpperCase() }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="เช่น INHOUSE, PUBLIC"
                                disabled={!editingType.isNew}
                            />
                            <p className="text-xs text-gray-400 mt-1">ใช้เป็น Prefix ของรหัสโปรเจค เช่น INHOUSE00001</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ</label>
                            <input
                                type="text"
                                value={editingType.label}
                                onChange={(e) => setEditingType(prev => ({ ...prev, label: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="ชื่อประเภท เช่น In-House"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">สี</label>
                            <div className="flex flex-wrap gap-2">
                                {COLOR_SWATCHES.map(swatch => (
                                    <button
                                        key={swatch.value}
                                        type="button"
                                        onClick={() => setEditingType(prev => ({ ...prev, color: swatch.value }))}
                                        className={`w-8 h-8 rounded-lg ${swatch.bg} transition-all hover:scale-110 flex items-center justify-center ${editingType.color === swatch.value ? 'ring-2 ring-offset-2 ' + swatch.ring : ''
                                            }`}
                                        title={swatch.label}
                                    >
                                        {editingType.color === swatch.value && (
                                            <Check className="w-4 h-4 text-white" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
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
                                disabled={!editingType.key || !editingType.label}
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
                <p className="text-gray-600 mb-6">คุณต้องการลบประเภท "{deleteConfirm}" หรือไม่?</p>
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

export default ProjectTypesTab;
