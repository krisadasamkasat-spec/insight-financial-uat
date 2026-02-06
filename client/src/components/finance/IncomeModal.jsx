import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Dropdown from '../common/Dropdown';
import DatePicker from '../common/DatePicker';
import { Upload, File, X, Save, Trash2 } from 'lucide-react';
import { projectAPI } from '../../services/api';

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
    income,
    projects // [NEW] List of projects for selection (optional)
}) => {
    const isEditMode = mode === 'edit';
    const projectCode = isEditMode ? (income?.project_code || income?.projectCode) : propProjectCode;

    const initialFormState = {
        description: '',
        due_date: '',
        amount: '',
        status: 'pending',
        financial_account_id: ''
    };

    const [formData, setFormData] = useState(initialFormState);
    const [attachments, setAttachments] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [errors, setErrors] = useState({});
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Fetch accounts
    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const res = await projectAPI.getAllAccounts();
                // Map to dropdown options: { value: id, label: name (balance) }
                const options = res.data.map(acc => ({
                    value: acc.id,
                    label: `${acc.financial_account_name} (${Number(acc.balance).toLocaleString()})`
                }));
                setAccounts(options);
            } catch (err) {
                console.error("Failed to load accounts", err);
            }
        };
        fetchAccounts();
    }, []);

    // Initialize form with income data when modal opens (edit mode)
    useEffect(() => {
        if (isOpen) {
            if (isEditMode && income) {
                setFormData({
                    description: income.description || '',
                    due_date: income.due_date?.split('T')[0] || '',
                    amount: income.amount?.toString() || '',
                    status: income.status || 'pending',
                    financial_account_id: income.financial_account_id || ''
                });
                setAttachments(income.attachments || []);
            } else {
                setFormData(initialFormState);
                setAttachments([]);
            }
            setErrors({});
            setShowDeleteConfirm(false);
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
            type: file.type,
            file: file // Store actual file object for upload
        }));
        setAttachments(prev => [...prev, ...newAttachments]);
    };

    const removeAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.description.trim()) newErrors.description = 'กรุณาระบุรายละเอียด';
        if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'กรุณากรอกจำนวนเงิน';
        if (!formData.due_date) newErrors.due_date = 'กรุณาระบุวันที่';

        // If status is received, account is required
        if (formData.status === 'received') {
            if (!formData.financial_account_id) newErrors.financial_account_id = 'กรุณาเลือกบัญชีรับเงิน';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;

        const payload = {
            // eslint-disable-next-line react-hooks/purity
            ...(isEditMode ? income : { id: Date.now() }), // Keep existing ID for edit
            project_code: projectCode,
            description: formData.description,
            due_date: formData.due_date,
            amount: parseFloat(formData.amount),
            status: formData.status,
            financial_account_id: formData.financial_account_id,
            attachments: attachments
        };

        onSubmit(payload);
    };

    const handleDelete = () => {
        if (onDelete && income?._id) {
            onDelete(income._id);
        } else if (onDelete && income?.id) {
            onDelete(income.id);
        }
        handleClose();
    };

    const handleClose = () => {
        onClose();
        setTimeout(() => {
            setFormData(initialFormState);
            setAttachments([]);
            setErrors({});
            setShowDeleteConfirm(false);
        }, 150);
    };

    const inputClass = (fieldName) => `w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${errors[fieldName] ? 'border-red-300 bg-red-50' : 'border-gray-200'}`;

    const statusOptions = [
        { value: 'pending', label: 'ยังไม่ได้รับเงิน (Pending)' },
        { value: 'received', label: 'ได้รับเงินแล้ว (Received)' }
    ];

    const formatFileSize = (bytes) => {
        if (!bytes) return '';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    // Don't render if in edit mode without income data
    if (isEditMode && !income && isOpen) return null;

    const modalTitle = isEditMode ? 'แก้ไขรายรับ (Income)' : 'เพิ่มรายรับ (Income)';
    const fileInputId = isEditMode ? 'edit-income-attachments' : 'add-income-attachments';

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={modalTitle} size="md">
            {showDeleteConfirm ? (
                <div className="text-center py-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trash2 className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">ยืนยันการลบ?</h3>
                    <p className="text-gray-500 mb-6">คุณต้องการลบรายการรายรับนี้หรือไม่? <br />หากลบที่สถานะ "ได้รับแล้ว" ยอดเงินจะถูกหักออกจากบัญชี</p>
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
                    {/* Project Code (Selection or Read-only) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">โปรเจค <span className="text-red-500">*</span></label>
                        {projectCode ? (
                            <input
                                type="text"
                                value={projectCode}
                                readOnly
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 font-mono"
                            />
                        ) : (
                            <Dropdown
                                width="full"
                                value={formData.project_code}
                                options={projects ? projects.map(p => ({ value: p.project_code, label: `${p.project_code} - ${p.project_name}` })) : []}
                                onChange={(val) => handleFieldChange('project_code', val)}
                                placeholder="เลือกโปรเจค..."
                                error={!!errors.project_code}
                                searchable={true}
                            />
                        )}
                        {!projectCode && errors.project_code && <p className="text-red-500 text-xs mt-1">{errors.project_code}</p>}
                    </div>

                    {/* Amount & Date (Conditional Label) */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนเงิน (บาท) <span className="text-red-500">*</span></label>
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                placeholder="0.00"
                                className={inputClass('amount')}
                            />
                            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                        </div>

                        {/* Show Due Date here only if Pending (or if user wants to see it always? User said "If received, have only Date Received. Due Date not needed"). 
                           So we hide this block if status is 'received' AND we move the date input to the bottom block? 
                           Or simpler: Toggle the LABEL and functionality of this single date picker based on status?
                           User said: "If received... Due Date is not needed... uses table due_date same".
                           So it's the SAME field, just different Label/Context.
                        */}
                        <div>
                            <DatePicker
                                label={formData.status === 'received'
                                    ? <>วันที่ได้รับเงิน <span className="text-red-500">*</span></>
                                    : <>วันที่คาดว่าจะรับ (Due Date) <span className="text-red-500">*</span></>
                                }
                                value={formData.due_date}
                                onChange={(val) => handleFieldChange('due_date', val)}
                                colorTheme="emerald"
                                hasError={!!errors.due_date}
                                dropUp={false}
                            />
                            {errors.due_date && <p className="text-red-500 text-xs mt-1">{errors.due_date}</p>}
                        </div>
                    </div>

                    <div className="border-t border-gray-100 my-2 pt-2">
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">สถานะการชำระเงิน</label>
                        {/* Status */}
                        <div className="mb-3">
                            <Dropdown width="full"
                                label={<>สถานะ <span className="text-red-500">*</span></>}
                                value={formData.status}
                                options={statusOptions}
                                onChange={(val) => handleFieldChange('status', val)}
                                colorTheme={formData.status === 'received' ? 'green' : 'gray'}
                            />
                        </div>

                        {/* Account (Show if Received) */}
                        {formData.status === 'received' && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="mb-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">เข้าบัญชี <span className="text-red-500">*</span></label>
                                    <Dropdown
                                        width="full"
                                        value={formData.financial_account_id}
                                        options={accounts}
                                        onChange={(val) => handleFieldChange('financial_account_id', val)}
                                        placeholder="เลือกบัญชี..."
                                        error={!!errors.financial_account_id}
                                    />
                                </div>
                                {errors.financial_account_id && <p className="text-red-500 text-xs mt-1">{errors.financial_account_id}</p>}
                            </div>
                        )}
                    </div>

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
                                            <span className="text-gray-700">{file.name || (typeof file === 'string' ? file : 'File')}</span>
                                            {/* Size only if file object */}
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

                    {/* Invoice Number & Description */}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
                        <input
                            type="text"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className={inputClass('description')}
                        />
                        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
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
                                className="px-6 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm shadow-green-200 flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
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
