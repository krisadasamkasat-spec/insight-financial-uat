import React, { useState } from 'react';
import Modal from '../common/Modal';
import FormDropdown from '../common/FormDropdown';
import { projectAPI } from '../../services/api';

const AddTeamMemberModal = ({ isOpen, onClose, onSubmit, projectCode, existingMemberIds = [] }) => {
    const [formData, setFormData] = useState({
        memberId: '',
        role: ''
    });
    const [errors, setErrors] = useState({});

    const [availableMembers, setAvailableMembers] = useState([]);
    const [availableRoles, setAvailableRoles] = useState([]);

    // Fetch members and roles on open
    React.useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                try {
                    const [membersRes, rolesRes] = await Promise.all([
                        projectAPI.getAllMembers(),
                        projectAPI.getRoles()
                    ]);

                    // Members logic
                    const allMembers = membersRes.data;
                    const filtered = allMembers.filter(m => !existingMemberIds.includes(m.id));
                    setAvailableMembers(filtered);

                    // Roles logic
                    setAvailableRoles(rolesRes.data);
                } catch (err) {
                    console.error("Failed to load data", err);
                }
            };
            fetchData();
        }
    }, [isOpen, existingMemberIds]);

    // Role options from API
    const roleOptions = availableRoles.map(r => ({
        value: r.name,
        label: r.label
    }));

    const validateForm = () => {
        const newErrors = {};
        if (!formData.memberId) newErrors.memberId = 'กรุณาเลือกสมาชิก';
        if (!formData.role) newErrors.role = 'กรุณาเลือกตำแหน่ง';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const newTeamMember = {
            projectCode,
            memberId: Number(formData.memberId),
            role: formData.role,
            rate: 0, // Default rate, will be set in expenses
            status: 'confirmed' // Default status
        };

        onSubmit(newTeamMember);
        handleClose();
    };

    const handleClose = () => {
        setFormData({
            memberId: '',
            role: ''
        });
        setErrors({});
        onClose();
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="เพิ่มสมาชิกในทีม" size="md">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Member Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        เลือกสมาชิก <span className="text-red-500">*</span>
                    </label>
                    {availableMembers.length > 0 ? (
                        <FormDropdown
                            value={formData.memberId}
                            onChange={(value) => handleChange('memberId', value)}
                            options={availableMembers.map(m => ({
                                value: m.id.toString(),
                                label: `${m.nickname} (${m.name})`
                            }))}
                            placeholder="เลือกสมาชิก"
                            error={errors.memberId}
                        />
                    ) : (
                        <p className="text-sm text-gray-500 py-2">
                            ไม่มีสมาชิกที่พร้อมเพิ่ม (ทุกคนถูกเพิ่มแล้ว)
                        </p>
                    )}
                </div>

                {/* Role Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        ตำแหน่ง <span className="text-red-500">*</span>
                    </label>
                    <FormDropdown
                        value={formData.role}
                        onChange={(value) => handleChange('role', value)}
                        options={roleOptions}
                        placeholder="เลือกตำแหน่ง"
                        error={errors.role}
                    />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="submit"
                        disabled={availableMembers.length === 0}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        เพิ่มสมาชิก
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddTeamMemberModal;
