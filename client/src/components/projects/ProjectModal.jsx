import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import FormDropdown from '../common/FormDropdown';
import DatePicker from '../common/DatePicker';

import { projectAPI } from '../../services/api';
import { Plus, Save, Briefcase, Users, Globe, Gift, Calendar, Folder } from 'lucide-react';
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

const getTypeIcon = (type) => {
    switch (type) {
        case 'In-House': return <Users className="w-8 h-8 text-blue-500" />;
        case 'Consult': return <Briefcase className="w-8 h-8 text-purple-500" />;
        case 'Public': return <Globe className="w-8 h-8 text-green-500" />;
        case 'Event': return <Calendar className="w-8 h-8 text-orange-500" />;
        case 'Gift': return <Gift className="w-8 h-8 text-pink-500" />;
        default: return <Folder className="w-8 h-8 text-gray-500" />;
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
    const { getProjectStatusOptions } = useSettings();

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
    const [products, setProducts] = useState([]);
    const [projects, setProjects] = useState([]);
    const [projectTypes, setProjectTypes] = useState([]);

    // Fetch master data (products and existing projects for code gen)
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productRes, projectRes, typesRes] = await Promise.all([
                    projectAPI.getAllProducts(),
                    projectAPI.getAllProjects(),
                    projectAPI.getProjectTypes()
                ]);
                setProducts(productRes.data || []);
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
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setErrors({});
            if (isEditMode && project) {
                // Edit Mode: Go straight to form
                setStep(2);
                setFormData({
                    projectCode: project.projectCode || '',
                    projectName: project.projectName || '',
                    productCode: project.productCode || '',
                    company: project.company || '',
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
            const prefix = formData.projectType === 'In-House' ? 'INHOUSE' :
                formData.projectType === 'Public' ? 'PUBLIC' :
                    formData.projectType === 'Event' ? 'EVENT' :
                        formData.projectType === 'Gift' ? 'GIFT' :
                            formData.projectType === 'Consult' ? 'CONSULT' : 'OTHER';

            // Filter real projects
            const existingCodes = projects
                .filter(p => p.project_code && p.project_code.startsWith(prefix))
                .map(p => {
                    const numPart = p.project_code.replace(prefix, '');
                    return parseInt(numPart) || 0;
                });

            const nextNumber = existingCodes.length > 0 ? Math.max(...existingCodes) + 1 : 1;
            const newCode = `${prefix}${String(nextNumber).padStart(5, '0')} `;

            // eslint-disable-next-line react-hooks/set-state-in-effect
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
        const type = formData.projectType;

        // Common validation
        if (!formData.projectName.trim()) newErrors.projectName = 'กรุณากรอกชื่อโปรเจค';

        // In-House specific
        if (type === 'In-House') {
            if (!formData.productCode) newErrors.productCode = 'กรุณาเลือกหลักสูตร';
            if (!formData.company.trim()) newErrors.company = 'กรุณากรอกชื่อลูกค้า/บริษัท';
            if (!formData.participantCount || parseInt(formData.participantCount) <= 0) {
                newErrors.participantCount = 'กรุณากรอกจำนวนผู้เข้าร่วม';
            }
            if (!formData.startDate) newErrors.startDate = 'กรุณาเลือกวันเริ่มต้น';
            if (!formData.endDate) newErrors.endDate = 'กรุณาเลือกวันสิ้นสุด';
            if (!formData.location.trim()) newErrors.location = 'กรุณากรอกสถานที่';
        }

        // Public specific
        if (type === 'Public') {
            if (!formData.productCode) newErrors.productCode = 'กรุณาเลือกหลักสูตร';
            if (!formData.startDate) newErrors.startDate = 'กรุณาเลือกวันเริ่มต้น';
            if (!formData.endDate) newErrors.endDate = 'กรุณาเลือกวันสิ้นสุด';
            if (!formData.location.trim()) newErrors.location = 'กรุณากรอกสถานที่';
        }

        // Consult specific
        if (type === 'Consult') {
            if (!formData.company.trim()) newErrors.company = 'กรุณากรอกชื่อลูกค้า/บริษัท';
            if (!formData.startDate) newErrors.startDate = 'กรุณาเลือกวันเริ่มต้น';
            if (!formData.endDate) newErrors.endDate = 'กรุณาเลือกวันสิ้นสุด';
        }

        const isEventOrGift = type === 'Event' || type === 'Gift';
        if (isEventOrGift || type === 'Other') {
            if (!formData.startDate) newErrors.startDate = 'กรุณาเลือกวันเริ่มต้น';
            if (!formData.endDate) newErrors.endDate = 'กรุณาเลือกวันสิ้นสุด';
        }

        // Date validation
        if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
            newErrors.endDate = 'วันสิ้นสุดต้องหลังวันเริ่มต้น';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validate()) {
            try {
                // Map to snake_case for Server
                const payload = {
                    project_code: formData.projectCode,
                    project_name: formData.projectName,
                    product_code: formData.productCode || null,
                    customer_name: formData.company || null,
                    project_type: formData.projectType,
                    status: formData.status,
                    start_date: formData.startDate || null,
                    end_date: formData.endDate || null,
                    location: formData.location || null,
                    description: formData.description || null,
                    budget: formData.budget ? parseFloat(formData.budget) : null,
                    participant_count: formData.participantCount ? parseInt(formData.participantCount) : null,
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
        { value: 'Consult', label: 'Consult' },
        { value: 'In-House', label: 'In-House' },
        { value: 'Public', label: 'Public' },
        { value: 'Event', label: 'Event' },
        { value: 'Gift', label: 'Gift' },
        { value: 'Other', label: 'Other' }
    ];

    const productOptions = products.map(p => ({
        value: p.code,
        label: p.name
    }));

    const isInHouse = formData.projectType === 'In-House';
    const isPublic = formData.projectType === 'Public';
    const isConsult = formData.projectType === 'Consult';
    const isEventOrGift = formData.projectType === 'Event' || formData.projectType === 'Gift';

    // Step 1: Type Selection View
    const renderTypeSelection = () => (
        <div className="p-1">
            <h3 className="text-lg font-medium text-gray-800 mb-4 text-center">เลือกประเภทโปรเจค</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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

    // Step 2: Form View
    const renderForm = () => (
        <form onSubmit={handleSubmit} className="space-y-4">
            {!isEditMode && (
                <div className="flex items-center gap-2 mb-2">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                        {projectTypeOptions.find(t => t.value === formData.projectType)?.label} Project
                    </h3>
                </div>
            )}

            {/* Row 1: Project Type & Code */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทโปรเจค</label>
                    <input
                        type="text"
                        value={formData.projectType}
                        readOnly
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
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

            {/* Row 2: Product Selection (In-House & Public only) */}
            {(isInHouse || isPublic) && (
                <div>
                    <FormDropdown
                        label="หลักสูตร/Product *"
                        value={formData.productCode}
                        options={productOptions}
                        onChange={(val) => handleFieldChange('productCode', val)}
                        hasError={!!errors.productCode}
                        colorTheme="blue"
                        placeholder="เลือกหลักสูตร"
                    />
                    {errors.productCode && <p className="text-red-500 text-xs mt-1">{errors.productCode}</p>}
                </div>
            )}

            {/* Row 3: Project Name */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อโปรเจค *</label>
                <input
                    type="text"
                    name="projectName"
                    value={formData.projectName}
                    onChange={handleChange}
                    placeholder={isEventOrGift ? "ชื่องาน Event/Gift" : ""}
                    className={inputClass('projectName')}
                />
                {errors.projectName && <p className="text-red-500 text-xs mt-1">{errors.projectName}</p>}
            </div>

            {/* Customer Info (In-House & Consult) */}
            {(isInHouse || isConsult) && (
                <div className={isInHouse ? "grid grid-cols-2 gap-4" : ""}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ลูกค้า/บริษัท *</label>
                        <input
                            type="text"
                            name="company"
                            value={formData.company}
                            onChange={handleChange}
                            placeholder="กรอกชื่อบริษัท"
                            className={inputClass('company')}
                        />
                        {errors.company && <p className="text-red-500 text-xs mt-1">{errors.company}</p>}
                    </div>
                    {isInHouse && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนผู้เข้าร่วม (คน) *</label>
                            <input
                                type="number"
                                name="participantCount"
                                value={formData.participantCount}
                                onChange={handleChange}
                                placeholder="กรอกจำนวนผู้เข้าร่วม"
                                className={inputClass('participantCount')}
                            />
                            {errors.participantCount && <p className="text-red-500 text-xs mt-1">{errors.participantCount}</p>}
                        </div>
                    )}
                </div>
            )}

            {/* Status (all types) */}
            <div className="grid grid-cols-2 gap-4">
                <FormDropdown
                    label="สถานะ *"
                    value={formData.status}
                    options={getProjectStatusOptions()}
                    onChange={(val) => handleFieldChange('status', val)}
                    colorTheme="blue"
                />
                {/* Budget (optional for all) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">งบประมาณ (บาท)</label>
                    <input
                        type="number"
                        name="budget"
                        value={formData.budget}
                        onChange={handleChange}
                        className={inputClass('budget')}
                        step="0.01"
                    />
                </div>
            </div>

            {/* Dates (All Types) */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <DatePicker
                        label="วันเริ่มต้น *"
                        value={formData.startDate}
                        onChange={(val) => handleFieldChange('startDate', val)}
                        hasError={!!errors.startDate}
                        colorTheme="blue"
                        disablePast={true}
                    />
                    {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
                </div>
                <div>
                    <DatePicker
                        label="วันสิ้นสุด *"
                        value={formData.endDate}
                        onChange={(val) => handleFieldChange('endDate', val)}
                        hasError={!!errors.endDate}
                        colorTheme="blue"
                        minDate={formData.startDate || null}
                        disablePast={true}
                    />
                    {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
                </div>
            </div>

            {/* Location (In-House & Public) */}
            {(isInHouse || isPublic) && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">สถานที่ *</label>
                    <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="กรอกสถานที่"
                        className={inputClass('location')}
                    />
                    {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
                </div>
            )}

            {/* Description (optional for all) */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={2}
                    className={inputClass('description')}
                    placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
                />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                    ยกเลิก
                </button>
                <button
                    type="submit"
                    className="px-5 py-2.5 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                    {isEditMode ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    บันทึก
                </button>
            </div>
        </form>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? 'แก้ไขโปรเจค' : (step === 1 ? 'สร้างโปรเจคใหม่' : 'กรอกข้อมูลโปรเจค')}
            size="lg"
        >
            {step === 1 ? renderTypeSelection() : renderForm()}
        </Modal>
    );
};

export default ProjectModal;
