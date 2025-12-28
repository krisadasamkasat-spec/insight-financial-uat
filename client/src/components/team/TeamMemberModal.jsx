import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import FormDropdown from '../common/FormDropdown';
import { projectAPI } from '../../services/api';
import { Plus, Save } from 'lucide-react';

const ROLE_LABELS = {
    'pm': 'Project Manager',
    'trainer': 'Trainer',
    'assistant': 'Assistant',
    'coordinator': 'Coordinator',
    'consultant': 'Consultant',
    'graphic': 'Graphic Designer',
    'editor': 'Video Editor',
    'staff': 'Staff'
};

/**
 * Unified Team Member Modal - handles both Add and Edit modes
 * @param {Object} props
 * @param {'add'|'edit'} props.mode - Modal mode
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Close callback
 * @param {Function} props.onSubmit - Submit callback
 * @param {string} props.projectCode - Project code (add mode)
 * @param {Array} props.existingMemberIds - Already assigned member IDs (add mode)
 * @param {Object} props.assignment - Assignment data with member info (edit mode)
 */
const TeamMemberModal = ({
    mode = 'add',
    isOpen,
    onClose,
    onSubmit,
    projectCode,
    existingMemberIds = [],
    assignment
}) => {
    const isEditMode = mode === 'edit';

    const initialFormState = {
        memberId: '',
        role: '',
        rate: '',
        status: 'confirmed'
    };

    const [formData, setFormData] = useState(initialFormState);
    const [errors, setErrors] = useState({});
    const [members, setMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch members on mount or when modal opens
    useEffect(() => {
        if (isOpen && !isEditMode) {
            fetchMembers();
        }
    }, [isOpen, isEditMode]);

    const fetchMembers = async () => {
        setIsLoading(true);
        try {
            const response = await projectAPI.getAllMembers();
            setMembers(response.data);
        } catch (error) {
            console.error('Error fetching members:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Role options from ROLE_LABELS
    const roleOptions = Object.entries(ROLE_LABELS).map(([value, label]) => ({
        value,
        label
    }));

    // Status options
    const statusOptions = [
        { value: 'confirmed', label: 'ยืนยันแล้ว' },
        { value: 'pending', label: 'รอยืนยัน' }
    ];

    // Filter out already assigned members (add mode)
    const availableMembers = members.filter(
        m => !existingMemberIds.includes(m.id)
    );

    // Load assignment data when modal opens (edit mode)
    useEffect(() => {
        if (isEditMode && assignment && isOpen) {
            setFormData({
                memberId: '', // Not editable in edit mode
                role: assignment.role || 'trainer',
                rate: assignment.rate?.toString() || '0',
                status: assignment.status || 'pending'
            });
        }
    }, [assignment, isOpen, isEditMode]);

    const validateForm = () => {
        const newErrors = {};

        if (!isEditMode) {
            if (!formData.memberId) newErrors.memberId = 'กรุณาเลือกสมาชิก';
        }
        if (!formData.role) newErrors.role = 'กรุณาเลือกตำแหน่ง';
        if (!formData.rate || Number(formData.rate) <= 0) newErrors.rate = 'กรุณากรอกค่าตอบแทน';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        if (isEditMode) {
            // Edit mode: update existing assignment
            const updatedAssignment = {
                ...assignment,
                role: formData.role,
                rate: Number(formData.rate),
                status: formData.status,
                roleLabel: ROLE_LABELS[formData.role] || formData.role
            };
            onSubmit(updatedAssignment);
        } else {
            // Add mode: create new team member assignment
            const selectedMember = members.find(m => m.id.toString() === formData.memberId);
            const newTeamMember = {
                projectCode,
                memberId: Number(formData.memberId),
                role: formData.role,
                rate: Number(formData.rate),
                status: formData.status,
                member: selectedMember // Pass full member object for immediate UI update if needed
            };
            onSubmit(newTeamMember);
        }
        handleClose();
    };

    const handleClose = () => {
        setFormData(initialFormState);
        setErrors({});
        onClose();
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    // Don't render if in edit mode without assignment data
    if (isEditMode && !assignment) return null;

    const modalTitle = isEditMode ? 'แก้ไขข้อมูลทีมงาน' : 'เพิ่มสมาชิกในทีม';

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={modalTitle} size="md">
            <form onSubmit={handleSubmit} className="space-y-4">
                {isEditMode ? (
                    // Show member info in edit mode
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                                {assignment.member?.nickname?.charAt(0) || '?'}
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">{assignment.member?.nickname || '-'}</p>
                                <p className="text-sm text-gray-500">{assignment.member?.name || '-'}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    // Member Selection (add mode)
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            เลือกสมาชิก <span className="text-red-500">*</span>
                        </label>
                        {isLoading ? (
                            <p className="text-sm text-gray-500 py-2">กำลังโหลดรายชื่อ...</p>
                        ) : availableMembers.length > 0 ? (
                            <FormDropdown
                                value={formData.memberId}
                                onChange={(value) => handleChange('memberId', value)}
                                options={availableMembers.map(m => ({
                                    value: m.id.toString(),
                                    label: `${m.nickname} (${m.name})`
                                }))}
                                placeholder="เลือกสมาชิก"
                                hasError={!!errors.memberId}
                            />
                        ) : (
                            <p className="text-sm text-gray-500 py-2">
                                ไม่มีสมาชิกที่พร้อมเพิ่ม (ทุกคนถูกเพิ่มแล้ว)
                            </p>
                        )}
                        {errors.memberId && <p className="text-red-500 text-xs mt-1">{errors.memberId}</p>}
                    </div>
                )}

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
                        hasError={!!errors.role}
                    />
                    {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
                </div>

                {/* Rate */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        ค่าตอบแทน (บาท) <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        value={formData.rate}
                        onChange={(e) => handleChange('rate', e.target.value)}
                        placeholder="0"
                        min="0"
                        step="1000"
                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.rate ? 'border-red-300' : 'border-gray-300'}`}
                    />
                    {errors.rate && <p className="text-red-500 text-xs mt-1">{errors.rate}</p>}
                </div>

                {/* Status */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        สถานะ
                    </label>
                    <FormDropdown
                        value={formData.status}
                        onChange={(value) => handleChange('status', value)}
                        options={statusOptions}
                    />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="submit"
                        disabled={!isEditMode && availableMembers.length === 0}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isEditMode ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {isEditMode ? 'บันทึก' : 'เพิ่มสมาชิก'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default TeamMemberModal;
