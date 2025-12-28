import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import FormDropdown from '../common/FormDropdown';
import DatePicker from '../common/DatePicker';
import { Upload, File, X, Plus, Save, Trash2 } from 'lucide-react';

/**
 * Unified Income Modal - handles both Add and Edit modes
 * @param {Object} props
 * @param {'add'|'edit'} props.mode - Modal mode
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Close callback
 * @param {Function} props.onSubmit - Submit callback
 * @param {Function} props.onDelete - Delete callback (edit mode only)
 * @param {string} props.projectCode - Project code (add mode)
 * @param {Object} props.income - Income data (edit mode)
 */
const IncomeModal = ({
    mode = 'add',
    isOpen,
    onClose,
    onSubmit,
    onDelete,
    projectCode: propProjectCode,
    income
}) => {
    const isEditMode = mode === 'edit';
    const projectCode = isEditMode ? income?.projectCode : propProjectCode;

    const initialFormState = {
        description: '',
        invoiceNo: '',
        date: '',
        amount: '',
        status: 'pending'
    };

    const [formData, setFormData] = useState(initialFormState);
    const [attachments, setAttachments] = useState([]);
    const [errors, setErrors] = useState({});
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Initialize form with income data when modal opens (edit mode)
    useEffect(() => {
        if (isEditMode && income && isOpen) {
            setFormData({
                description: income.description || '',
                invoiceNo: income.invoiceNo || '',
                date: income.date || '',
                amount: income.amount?.toString() || '',
                status: income.status || 'pending'
            });
            setAttachments(income.attachments || []);
        }
    }, [income, isOpen, isEditMode]);

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

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const newAttachments = files.map(file => ({
            name: file.name,
            size: file.size,
            type: file.type
        }));
        setAttachments(prev => [...prev, ...newAttachments]);
    };

    const removeAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.invoiceNo.trim()) newErrors.invoiceNo = 'กรุณากรอกเลขที่ใบแจ้งหนี้';
        if (!formData.date) newErrors.date = 'กรุณาเลือกวันที่';
        if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'กรุณากรอกจำนวนเงิน';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            const incomeData = {
                // eslint-disable-next-line react-hooks/purity
                ...(isEditMode ? income : { id: Date.now() }),
                projectCode: projectCode,
                description: formData.description,
                invoiceNo: formData.invoiceNo,
                date: formData.date,
                amount: parseFloat(formData.amount),
                status: formData.status,
                attachments: attachments
            };
            onSubmit(incomeData);
            handleClose();
        }
    };

    const handleDelete = () => {
        if (onDelete && income) {
            onDelete(income.id);
        }
        handleClose();
    };

    const handleClose = () => {
        setFormData(initialFormState);
        setAttachments([]);
        setErrors({});
        setShowDeleteConfirm(false);
        onClose();
    };

    const inputClass = (fieldName) => `w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${errors[fieldName] ? 'border-red-300 bg-red-50' : 'border-gray-200'}`;

    const statusOptions = [
        { value: 'pending', label: 'รอรับ' },
        { value: 'received', label: 'ได้รับแล้ว' }
    ];

    const formatFileSize = (bytes) => {
        if (!bytes) return '';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    // Don't render if in edit mode without income data
    if (isEditMode && !income) return null;

    const modalTitle = isEditMode ? 'แก้ไขรายรับ' : 'เพิ่มรายรับ';
    const fileInputId = isEditMode ? 'edit-income-attachments' : 'add-income-attachments';

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={modalTitle} size="md">
            {showDeleteConfirm ? (
                <div className="text-center py-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trash2 className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">ยืนยันการลบ?</h3>
                    <p className="text-gray-500 mb-6">คุณต้องการลบรายรับนี้หรือไม่?</p>
                    <div className="flex justify-center gap-3">
                        <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            ยกเลิก
                        </button>
                        <button
                            onClick={handleDelete}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                        >
                            ลบรายการ
                        </button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Project Code (read-only) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">รหัสโปรเจค</label>
                        <input
                            type="text"
                            value={projectCode}
                            readOnly
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 font-mono"
                        />
                    </div>

                    {/* Invoice Number */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">เลขที่ใบแจ้งหนี้ *</label>
                        <input
                            type="text"
                            name="invoiceNo"
                            value={formData.invoiceNo}
                            onChange={handleChange}
                            className={inputClass('invoiceNo')}
                        />
                        {errors.invoiceNo && <p className="text-red-500 text-xs mt-1">{errors.invoiceNo}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
                        <input
                            type="text"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className={inputClass('description')}
                        />
                    </div>

                    {/* Date & Amount */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <DatePicker
                                label="วันที่รับ *"
                                value={formData.date}
                                onChange={(val) => handleFieldChange('date', val)}
                                hasError={!!errors.date}
                                colorTheme="emerald"
                                dropUp
                            />
                            {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนเงิน (บาท) *</label>
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                className={inputClass('amount')}
                            />
                            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                        </div>
                    </div>

                    {/* Status */}
                    <FormDropdown
                        label="สถานะ *"
                        value={formData.status}
                        options={statusOptions}
                        onChange={(val) => handleFieldChange('status', val)}
                        colorTheme="green"
                    />

                    {/* File Attachments */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">เอกสารแนบ</label>
                        <div className="border-2 border-dashed border-gray-200 rounded-lg p-3 hover:border-green-300 transition-colors">
                            <input
                                type="file"
                                multiple
                                onChange={handleFileChange}
                                className="hidden"
                                id={fileInputId}
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                            />
                            <label htmlFor={fileInputId} className="flex items-center justify-center gap-2 cursor-pointer">
                                <Upload className="w-5 h-5 text-gray-400" />
                                <span className="text-sm text-gray-500">{isEditMode ? 'เพิ่มไฟล์แนบ' : 'คลิกเพื่อเลือกไฟล์'}</span>
                            </label>
                        </div>
                        {attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                                {attachments.map((file, idx) => (
                                    <div key={idx} className="flex items-center justify-between px-3 py-1.5 bg-gray-50 rounded text-xs">
                                        <div className="flex items-center gap-2">
                                            <File className="w-3.5 h-3.5 text-gray-500" />
                                            <span className="text-gray-700">{typeof file === 'string' ? file : file.name}</span>
                                            {file.size && <span className="text-gray-400">({formatFileSize(file.size)})</span>}
                                        </div>
                                        <button type="button" onClick={() => removeAttachment(idx)} className="text-gray-400 hover:text-red-500">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className={`flex pt-4 border-t border-gray-100 ${isEditMode ? 'justify-between' : 'justify-end'}`}>
                        {isEditMode && (
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(true)}
                                className="px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                ลบ
                            </button>
                        )}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2.5 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                            >
                                {isEditMode ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                บันทึก
                            </button>
                        </div>
                    </div>
                </form>
            )}
        </Modal>
    );
};

export default IncomeModal;
