import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';

const DuplicateProjectModal = ({ isOpen, onClose, onSubmit, project }) => {
    const [newName, setNewName] = useState('');
    const [copyOptions, setCopyOptions] = useState({
        team: true,
        income: false,
        expenses: false
    });

    useEffect(() => {
        if (project) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setNewName(`${project.projectName} (Copy)`);
            setCopyOptions({ team: true, income: false, expenses: false });
        }
    }, [project]);

    const handleSubmit = (e) => {
        e.preventDefault();

        // Generate new project code
        const prefix = project.projectCode.replace(/\d+$/, '');
        const newCode = `${prefix}${String(Date.now()).slice(-5)}`;

        const newProject = {
            ...project,
            projectCode: newCode,
            projectName: newName,
            status: 'Pending',
            statusColor: 'yellow',
            startDate: new Date().toISOString().split('T')[0],
            endDate: null
        };

        onSubmit(newProject, copyOptions);
        onClose();
    };

    if (!project) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Duplicate โปรเจค">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-500 mb-1">โปรเจคต้นฉบับ</p>
                    <p className="font-medium text-gray-900">{project.projectName}</p>
                    <p className="text-xs text-gray-500 font-mono">{project.projectCode}</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อโปรเจคใหม่</label>
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ข้อมูลที่ต้องการ Copy</label>
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={copyOptions.team}
                                onChange={(e) => setCopyOptions(prev => ({ ...prev, team: e.target.checked }))}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">ทีมงาน</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={copyOptions.income}
                                onChange={(e) => setCopyOptions(prev => ({ ...prev, income: e.target.checked }))}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">รายรับ (เป็น template)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={copyOptions.expenses}
                                onChange={(e) => setCopyOptions(prev => ({ ...prev, expenses: e.target.checked }))}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">รายจ่าย (เป็น template)</span>
                        </label>
                    </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
                    <p>💡 โปรเจคใหม่จะถูกสร้างเป็นสถานะ "Pending"</p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                        Duplicate
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default DuplicateProjectModal;
