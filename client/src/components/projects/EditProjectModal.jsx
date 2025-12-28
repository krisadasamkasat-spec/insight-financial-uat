import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import FormDropdown from '../common/FormDropdown';
import DatePicker from '../common/DatePicker';
import { projectAPI } from '../../services/api';
import { useSettings } from '../../contexts/SettingsContext';

const EditProjectModal = ({ isOpen, onClose, onSubmit, project }) => {
    const { getProjectStatusOptions } = useSettings();
    const [formData, setFormData] = useState({
        projectCode: '',
        projectName: '',
        productCode: '',
        company: '',
        participantCount: '',
        projectType: 'In-House',
        status: 'Pending',
        startDate: '',
        endDate: '',
        location: '',
        description: '',
        budget: ''
    });

    const [errors, setErrors] = useState({});
    const [products, setProducts] = useState([]);

    // Load available products for dropdown
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await projectAPI.getAllProducts();
                setProducts(response.data);
            } catch (error) {
                console.error('Error fetching products:', error);
            }
        };

        if (isOpen) {
            fetchProducts();
        }
    }, [isOpen]);

    // Load project data when modal opens
    useEffect(() => {
        if (project && isOpen) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFormData({
                projectCode: project.projectCode || '',
                projectName: project.projectName || '',
                productCode: project.productCode || '',
                company: project.company || '',
                participantCount: project.participantCount ? String(project.participantCount) : '',
                projectType: project.projectType || 'In-House',
                status: project.status || 'Pending',
                startDate: project.startDate || '',
                endDate: project.endDate || '',
                location: project.location || '',
                description: project.description || '',
                budget: project.budget ? String(project.budget) : ''
            });
        }
    }, [project, isOpen]);

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

        // Date validation
        if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
            newErrors.endDate = 'วันสิ้นสุดต้องหลังวันเริ่มต้น';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            const updatedProject = {
                ...project,
                ...formData,
                participantCount: formData.participantCount ? parseInt(formData.participantCount) : null,
                budget: formData.budget ? parseFloat(formData.budget) : null
            };
            onSubmit(updatedProject);
            onClose();
        }
    };

    const handleClose = () => {
        setErrors({});
        onClose();
    };

    const inputClass = (fieldName) => `w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors[fieldName] ? 'border-red-300 bg-red-50' : 'border-gray-200'}`;

    const projectTypeOptions = [
        { value: 'In-House', label: 'In-House' },
        { value: 'Public', label: 'Public' },
        { value: 'Event', label: 'Event' },
        { value: 'Consult', label: 'Consult' },
        { value: 'Gift', label: 'Gift' },
        { value: 'Other', label: 'Other' }
    ];

    // Build product dropdown options
    const productOptions = products.map(p => ({
        value: p.code,
        label: p.name
    }));

    const isInHouse = formData.projectType === 'In-House';
    const isPublic = formData.projectType === 'Public';
    const isConsult = formData.projectType === 'Consult';
    const isEventOrGift = formData.projectType === 'Event' || formData.projectType === 'Gift';

    if (!project) return null;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="แก้ไขโปรเจค" size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Row 1: Project Type & Code */}
                <div className="grid grid-cols-2 gap-4">
                    <FormDropdown
                        label="ประเภทโปรเจค *"
                        value={formData.projectType}
                        options={projectTypeOptions}
                        onChange={(val) => handleFieldChange('projectType', val)}
                        colorTheme="blue"
                    />
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
                        />
                    </div>
                </div>

                {/* Dates (In-House, Public & Consult) */}
                {(isInHouse || isPublic || isConsult) && (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <DatePicker
                                label="วันเริ่มต้น *"
                                value={formData.startDate}
                                onChange={(val) => handleFieldChange('startDate', val)}
                                hasError={!!errors.startDate}
                                colorTheme="blue"
                                disablePast={false}
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
                                disablePast={false}
                            />
                            {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
                        </div>
                    </div>
                )}

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
                        onClick={handleClose}
                        className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="submit"
                        className="px-5 py-2.5 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                            <polyline points="7 3 7 8 15 8"></polyline>
                        </svg>
                        บันทึก
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default EditProjectModal;
