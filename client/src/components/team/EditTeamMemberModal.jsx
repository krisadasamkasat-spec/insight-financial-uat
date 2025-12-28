import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import FormDropdown from '../common/FormDropdown';
const ROLE_LABELS = {
    'Trainer': 'Trainer',
    'Co-Trainer': 'Co-Trainer',
    'MC (Master of Ceremony)': 'MC (Master of Ceremony)',
    'Training Assistant (TA)': 'Training Assistant (TA)',
    'Training Coordinator': 'Training Coordinator',
    'Training Management Team (TMT)': 'Training Management Team (TMT)'
};

const roleOptions = Object.entries(ROLE_LABELS).map(([value, label]) => ({
    value,
    label
}));

const EditTeamMemberModal = ({ isOpen, onClose, onSubmit, assignment }) => {
    const [formData, setFormData] = useState({
        role: 'Trainer'
    });

    useEffect(() => {
        if (assignment) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFormData({
                role: assignment.role || 'Trainer'
            });
        }
    }, [assignment]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            ...assignment,
            role: formData.role,
            roleLabel: ROLE_LABELS[formData.role] || formData.role
        });
        onClose();
    };

    if (!assignment) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="แก้ไขข้อมูลทีมงาน">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-medium">
                            {assignment.member?.nickname?.charAt(0) || '?'}
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">{assignment.member?.nickname || '-'}</p>
                            <p className="text-sm text-gray-500">{assignment.member?.name || '-'}</p>
                        </div>
                    </div>
                </div>

                <FormDropdown
                    label="ตำแหน่ง"
                    value={formData.role}
                    options={roleOptions}
                    onChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                />

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
                        บันทึก
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default EditTeamMemberModal;
