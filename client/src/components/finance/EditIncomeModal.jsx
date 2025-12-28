import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import FormDropdown from '../common/FormDropdown';
import DatePicker from '../common/DatePicker';

const EditIncomeModal = ({ isOpen, onClose, onSubmit, onDelete, income }) => {
    const [formData, setFormData] = useState({
        description: '',
        invoiceNo: '',
        date: '',
        amount: '',
        status: 'pending'
    });

    const [attachments, setAttachments] = useState([]);
    const [errors, setErrors] = useState({});
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Initialize form with income data when modal opens
    useEffect(() => {
        if (income && isOpen) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFormData({
                description: income.description || '',
                invoiceNo: income.invoiceNo || '',
                date: income.date || '',
                amount: income.amount?.toString() || '',
                status: income.status || 'pending'
            });
            setAttachments(income.attachments || []);
        }
    }, [income, isOpen]);

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
            const updatedIncome = {
                ...income,
                description: formData.description,
                invoiceNo: formData.invoiceNo,
                date: formData.date,
                amount: parseFloat(formData.amount),
                status: formData.status,
                attachments: attachments
            };
            onSubmit(updatedIncome);
            handleClose();
        }
    };

    const handleDelete = () => {
        if (onDelete) {
            onDelete(income.id);
        }
        handleClose();
    };

    const handleClose = () => {
        setFormData({
            description: '',
            invoiceNo: '',
            date: '',
            amount: '',
            status: 'pending'
        });
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

    if (!income) return null;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="แก้ไขรายรับ" size="md">
            {showDeleteConfirm ? (
                <div className="text-center py-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
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
                            value={income.projectCode}
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
                                id="edit-income-attachments"
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                            />
                            <label htmlFor="edit-income-attachments" className="flex items-center justify-center gap-2 cursor-pointer">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                                </svg>
                                <span className="text-sm text-gray-500">เพิ่มไฟล์แนบ</span>
                            </label>
                        </div>
                        {attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                                {attachments.map((file, idx) => (
                                    <div key={idx} className="flex items-center justify-between px-3 py-1.5 bg-gray-50 rounded text-xs">
                                        <div className="flex items-center gap-2">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                <polyline points="14 2 14 8 20 8" />
                                            </svg>
                                            <span className="text-gray-700">{typeof file === 'string' ? file : file.name}</span>
                                            {file.size && <span className="text-gray-400">({formatFileSize(file.size)})</span>}
                                        </div>
                                        <button type="button" onClick={() => removeAttachment(idx)} className="text-gray-400 hover:text-red-500">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            </svg>
                            ลบ
                        </button>
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
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                                    <polyline points="17 21 17 13 7 13 7 21" />
                                    <polyline points="7 3 7 8 15 8" />
                                </svg>
                                บันทึก
                            </button>
                        </div>
                    </div>
                </form>
            )}
        </Modal>
    );
};

export default EditIncomeModal;
