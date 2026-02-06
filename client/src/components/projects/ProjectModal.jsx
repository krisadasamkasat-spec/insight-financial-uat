import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Dropdown from '../common/Dropdown';
import DatePicker from '../common/DatePicker';

import { projectAPI } from '../../services/api';
import { Plus, Save, Briefcase, Users, Globe, Gift, Calendar, Folder, Building2, Landmark, Layers, TrendingUp, GraduationCap } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

/**
 * Unified Project Modal - handles both Add and Edit modes
 * @param {Object} props
 * @param {'add'|'edit'} props.mode - Modal mode
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Close callback
 * @param {Function} props.onSubmit - Submit callback
 * @param {Object} props.project - Project data (edit mode)
 */

const getTypeIcon = (type, sizeClass = "w-8 h-8") => {
    switch (type) {
        case 'In-House': return <Users className={`${sizeClass} text-blue-500`} />;
        case 'Consult': return <Briefcase className={`${sizeClass} text-purple-500`} />;
        case 'Public': return <Globe className={`${sizeClass} text-green-500`} />;
        case 'Central': return <Landmark className={`${sizeClass} text-gray-500`} />;
        case 'MORE': return <Layers className={`${sizeClass} text-yellow-500`} />;
        case 'Salevity': return <TrendingUp className={`${sizeClass} text-red-500`} />;
        case 'TMT': return <GraduationCap className={`${sizeClass} text-indigo-500`} />;
        default: return <Folder className={`${sizeClass} text-gray-500`} />;
    }
};

const ProjectModal = ({
    mode = 'add',
    isOpen,
    onClose,
    onSubmit,
    project
}) => {
    const isEditMode = mode === 'edit';

    const initialFormState = {
        projectCode: '',
        projectName: '',
        productCode: '',
        company: '',
        participantCount: '',
        projectType: '',
        status: 'Active',
        startDate: '',
        endDate: '',
        location: '',
        description: '',
        budget: ''
    };

    const [step, setStep] = useState(1); // 1: Type Selection, 2: Form
    const [formData, setFormData] = useState(initialFormState);
    const [errors, setErrors] = useState({});
    const [projects, setProjects] = useState([]);
    const [projectTypes, setProjectTypes] = useState([]);

    // Fetch master data (existing projects for code gen)
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [projectRes, typesRes] = await Promise.all([
                    projectAPI.getAllProjects(),
                    projectAPI.getProjectTypes()
                ]);
                setProjects(projectRes.data || []);
                if (typesRes.data && typesRes.data.length > 0) {
                    setProjectTypes(typesRes.data);
                }
            } catch (err) {
                console.error("Failed to fetch initial data", err);
            }
        };
        fetchData();
    }, []);

    // Load project data when modal opens
    useEffect(() => {
        if (isOpen) {
            setErrors({});
            if (isEditMode && project) {
                // Edit Mode: Go straight to form
                setStep(2);
                setFormData({
                    projectCode: project.projectCode || '',
                    projectName: project.projectName || '',
                    productCode: project.productCode || '',
                    company: project.company || '', // Customer
                    participantCount: project.participantCount ? String(project.participantCount) : '',
                    projectType: project.projectType || 'In-House',
                    status: project.status || 'Active',
                    startDate: project.startDate || '',
                    endDate: project.endDate || '',
                    location: project.location || '',
                    description: project.description || '',
                    budget: project.budget ? String(project.budget) : ''
                });
            } else {
                // Add Mode: Start at Type Selection
                setStep(1);
                setFormData(initialFormState);
            }
        }
    }, [project, isOpen, isEditMode]);

    // Auto-generate project code (Add mode only, when step 2 active)
    useEffect(() => {
        if (!isEditMode && formData.projectType && isOpen && step === 2) {
            // Find selected type from Master Data
            const selectedTypeObj = projectTypes.find(t => (t.value || t.name) === formData.projectType);
            const prefix = selectedTypeObj?.code_prefix || 'OTHER';

            // Filter real projects to find max existing code
            const existingCodes = projects
                .filter(p => p.project_code && p.project_code.startsWith(prefix))
                .map(p => {
                    const numPart = p.project_code.replace(prefix, '');
                    return parseInt(numPart) || 0;
                });

            const nextNumber = existingCodes.length > 0 ? Math.max(...existingCodes) + 1 : 1;
            const newCode = `${prefix}${String(nextNumber).padStart(5, '0')}`;

            setFormData(prev => ({ ...prev, projectCode: newCode }));
        }
    }, [formData.projectType, isOpen, isEditMode, step, projects]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleFieldChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleTypeSelect = (typeValue) => {
        setFormData(prev => ({ ...prev, projectType: typeValue }));
        setStep(2);
    };

    const handleBack = () => {
        setStep(1);
        setFormData(prev => ({ ...prev, projectType: '' }));
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.projectName.trim()) newErrors.projectName = 'กรุณากรอกชื่อโปรเจค';
        if (!formData.startDate) newErrors.startDate = 'กรุณาเลือกวันเริ่มต้น';
        // Note: Project Code is auto-generated/readonly, Project Type is selected in Step 1.

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validate()) {
            try {
                // Map to snake_case for Server (Lightweight payload)
                const payload = {
                    project_code: formData.projectCode,
                    project_name: formData.projectName,
                    product_code: null, // Removed
                    customer_name: formData.company || null, // Optional Customer
                    project_type: formData.projectType,
                    status: formData.status || 'Active',
                    start_date: formData.startDate || null,
                    end_date: null, // Removed
                    location: null, // Removed
                    description: null, // Removed
                    budget: null, // Removed
                    participant_count: null, // Removed
                    created_by: 1 // Default
                };

                if (isEditMode) {
                    await projectAPI.updateProject(project.projectCode, payload);
                } else {
                    await projectAPI.createProject(payload);
                }

                onSubmit({
                    ...formData,
                    projectCode: formData.projectCode
                });
                onClose();
            } catch (err) {
                console.error("API Error during submit:", err);
                const apiError = err.response?.data;
                let msg = "เกิดข้อผิดพลาด: " + (apiError?.details || err.message);
                if (apiError?.pg_detail) msg += "\n\nDetail: " + apiError.pg_detail;
                alert(msg);
            }
        }
    };

    const inputClass = (fieldName) => `w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors[fieldName] ? 'border-red-300 bg-red-50' : 'border-gray-200'}`;

    // Map API types to options
    const projectTypeOptions = projectTypes.length > 0 ? projectTypes.map(t => ({
        value: t.value || t.name,
        label: t.label || t.name
    })) : [
        { value: 'In-House', label: 'In-House' },
        { value: 'Public', label: 'Public' },
        { value: 'Consult', label: 'Consult' },
        { value: 'Central', label: 'ส่วนกลาง' },
        { value: 'MORE', label: 'MORE' },
        { value: 'Salevity', label: 'Salevity' },
        { value: 'TMT', label: 'TMT' }
    ];

    // Step 1: Type Selection View
    const renderTypeSelection = () => (
        <div className="p-1">
            <h3 className="text-lg font-medium text-gray-800 mb-4 text-center">เลือกประเภทโปรเจค</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {projectTypeOptions.map((type) => (
                    <button
                        key={type.value}
                        type="button"
                        onClick={() => handleTypeSelect(type.value)}
                        className="flex flex-col items-center justify-center p-6 border rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                    >
                        <div className="mb-3 transform group-hover:scale-110 transition-transform">
                            {getTypeIcon(type.value)}
                        </div>
                        <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">{type.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );

    // Step 2: Form View (Lightweight)
    const renderForm = () => (
        <form onSubmit={handleSubmit} className="space-y-5">
            {!isEditMode && (
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <span className="text-sm font-medium text-gray-500">
                        {projectTypeOptions.find(t => t.value === formData.projectType)?.label} Project
                    </span>
                </div>
            )}

            {/* Row 1: Project Type & Code */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทโปรเจค</label>
                    <div className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 h-[42px]">
                        {getTypeIcon(formData.projectType, "w-5 h-5")}
                        <span className="text-sm font-medium truncate">{projectTypeOptions.find(t => t.value === formData.projectType)?.label || formData.projectType}</span>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">รหัสโปรเจค</label>
                    <input
                        type="text"
                        value={formData.projectCode}
                        readOnly
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 font-mono"
                    />
                </div>
            </div>

            {/* Row 2: Project Name */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อโปรเจค <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    name="projectName"
                    value={formData.projectName}
                    onChange={handleChange}
                    placeholder="ระบุชื่อโปรเจค"
                    className={inputClass('projectName')}
                    autoFocus
                />
                {errors.projectName && <p className="text-red-500 text-xs mt-1">{errors.projectName}</p>}
            </div>

            {/* Row 3: Customer & Start Date */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ลูกค้า (ถ้ามี)</label>
                    <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        placeholder="ชื่อลูกค้า / บริษัท"
                        className={inputClass('company')}
                    />
                </div>

                <div>
                    <DatePicker
                        label={<>วันเริ่มต้น <span className="text-red-500">*</span></>}
                        value={formData.startDate}
                        onChange={(val) => handleFieldChange('startDate', val)}
                        hasError={!!errors.startDate}
                        colorTheme="blue"
                    />
                    {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-gray-100">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                    ยกเลิก
                </button>
                <button
                    type="submit"
                    className="px-5 py-2.5 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-sm"
                >
                    {isEditMode ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {isEditMode ? 'บันทึกการแก้ไข' : 'สร้างโปรเจค'}
                </button>
            </div>
        </form>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? 'แก้ไขโปรเจค' : (step === 1 ? 'สร้างโปรเจคใหม่' : 'รายละเอียดเบื้องต้น')}
            size={step === 1 ? "lg" : "md"}
        >
            {step === 1 ? renderTypeSelection() : renderForm()}
        </Modal>
    );
};

export default ProjectModal;
