import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import FormDropdown from '../common/FormDropdown';
import DatePicker from '../common/DatePicker';

const AddIncomeModal = ({ isOpen, onClose, onSubmit, projectCode }) => {
    const [formData, setFormData] = useState({
        description: '',
        invoiceNo: '',
        date: '',
        amount: '',
        status: 'pending'
    });

    const [attachments, setAttachments] = useState([]);
    const [errors, setErrors] = useState({});

    // Primary Account & Statuses State
    const [primaryAccount, setPrimaryAccount] = useState(null);
    const [statusOptions, setStatusOptions] = useState([]);

    // Fetch initial data on mount
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [accountsRes, statusesRes] = await Promise.all([
                    import('../../services/api').then(m => m.projectAPI.getAllAccounts()),
                    import('../../services/api').then(m => m.projectAPI.getFinancialStatuses('income'))
                ]);

                // Set Primary Account
                const primary = accountsRes.data.find(acc => acc.is_primary);
                setPrimaryAccount(primary);

                // Set Status Options
                const options = statusesRes.data.map(s => ({
                    value: s.value,
                    label: s.label
                }));
                setStatusOptions(options);

            } catch (err) {
                console.error('Failed to fetch initial data:', err);
            }
        };
        fetchInitialData();
    }, []);

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
            const newIncome = {
                id: Date.now(),
                projectCode: projectCode,
                description: formData.description,
                invoiceNo: formData.invoiceNo,
                date: formData.date,
                amount: parseFloat(formData.amount),
                status: formData.status,
                attachments: attachments,
                account_id: (formData.status === 'received' && primaryAccount) ? primaryAccount.id : null
            };
            onSubmit(newIncome);
            handleClose();
        }
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
        onClose();
    };

    const inputClass = (fieldName) => `w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${errors[fieldName] ? 'border-red-300 bg-red-50' : 'border-gray-200'}`;



    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="เพิ่มรายรับ" size="md">
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

                {/* Account Info (Auto-Linked) */}
                {formData.status === 'Received' && primaryAccount && (
                    <div className="bg-green-50 px-4 py-3 rounded-lg border border-green-100 flex items-center justify-between">
                        <span className="text-sm text-green-700 font-medium">Received via:</span>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-sm text-green-900 font-bold">{primaryAccount.name} ({primaryAccount.bank_code?.toUpperCase()})</span>
                        </div>
                    </div>
                )}

                {/* File Attachments */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">เอกสารแนบ</label>
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors">
                        <input
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            className="hidden"
                            id="income-attachments"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                        />
                        <label htmlFor="income-attachments" className="flex flex-col items-center cursor-pointer">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                            </svg>
                            <span className="text-sm text-gray-500 mt-1">คลิกเพื่อเลือกไฟล์</span>
                            <span className="text-xs text-gray-400">PDF, รูปภาพ, Word, Excel</span>
                        </label>
                    </div>
                    {attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                            {attachments.map((file, idx) => (
                                <div key={idx} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                            <polyline points="14 2 14 8 20 8" />
                                        </svg>
                                        <span className="text-sm text-gray-700">{file.name}</span>
                                        <span className="text-xs text-gray-400">({formatFileSize(file.size)})</span>
                                    </div>
                                    <button type="button" onClick={() => removeAttachment(idx)} className="text-gray-400 hover:text-red-500">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
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
                        className="px-5 py-2.5 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        บันทึก
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddIncomeModal;
