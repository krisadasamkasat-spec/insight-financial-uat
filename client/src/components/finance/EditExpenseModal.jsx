import React, { useState, useRef, useEffect } from 'react';
import Modal from '../common/Modal';
import FormDropdown from '../common/FormDropdown';
import DatePicker from '../common/DatePicker';
import ConfirmDeleteModal from '../common/ConfirmDeleteModal';
import { projectAPI } from '../../services/api';
import { ChevronDown, Save, Trash2, Calculator, FileText, CreditCard, Building2, User, Plus } from 'lucide-react';
import { useToast } from '../common/ToastProvider';

const EditExpenseModal = ({ isOpen, onClose, onSubmit, onDelete, expense }) => {
    const toast = useToast();
    // Account Codes State
    const [accountCodes, setAccountCodes] = useState([]);

    const [formData, setFormData] = useState({
        categoryType: 'วางบิล',
        accountCode: '',
        billHeader: '',
        contact: '',
        paybackTo: '',
        bankName: '',
        bankAccountNumber: '',
        bankAccountName: '',
        phone: '',
        email: '',
        dueDate: '',
        amount: '',
        discount: '',
        hasVat: false,
        hasWht: false,
        whtRate: 3,
        note: '',
        status: 'ส่งเบิกแล้ว รอเอกสารตัวจริง'
    });

    const [errors, setErrors] = useState({});

    // Attachment States
    const [attachments, setAttachments] = useState([]); // Displays both DB and New files
    const [deletedIds, setDeletedIds] = useState(new Set()); // IDs to delete on save

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        type: null, // 'attachment' | 'expense'
        title: '',
        itemName: '',
        warningMessage: '',
        onConfirm: null
    });

    const [isWhtDropdownOpen, setIsWhtDropdownOpen] = useState(false);
    const whtDropdownRef = useRef(null);

    // WHT Rate options
    const whtRateOptions = [1, 2, 3, 5];

    const bankOptions = [
        { value: '', label: 'เลือกธนาคาร...' },
        { value: 'กสิกรไทย', label: 'กสิกรไทย' },
        { value: 'ไทยพาณิชย์', label: 'ไทยพาณิชย์' },
        { value: 'กรุงเทพ', label: 'กรุงเทพ' },
        { value: 'กรุงไทย', label: 'กรุงไทย' },
        { value: 'ทหารไทยธนชาติ', label: 'ทหารไทยธนชาติ' },
        { value: 'กรุงศรี', label: 'กรุงศรี' },
        { value: 'ออมสิน', label: 'ออมสิน' },
        { value: 'อื่นๆ', label: 'อื่นๆ' }
    ];

    const statusOptions = [
        { value: 'ส่งเบิกแล้ว รอเอกสารตัวจริง', label: 'ส่งเบิกแล้ว รอเอกสารตัวจริง' },
        { value: 'บัญชีตรวจ และ ได้รับเอกสารตัวจริง', label: 'บัญชีตรวจ และ ได้รับเอกสารตัวจริง' },
        { value: 'VP อนุมัติแล้ว ส่งเบิกได้', label: 'VP อนุมัติแล้ว ส่งเบิกได้' },
        { value: 'ส่งเข้า PEAK', label: 'ส่งเข้า PEAK' },
        { value: 'โอนแล้ว รอส่งหลักฐาน', label: 'โอนแล้ว รอส่งหลักฐาน' },
        { value: 'ส่งหลักฐานแล้ว เอกสารครบ', label: 'ส่งหลักฐานแล้ว เอกสารครบ' },
        { value: 'reject ยกเลิก / รอแก้ไข', label: 'reject ยกเลิก / รอแก้ไข' }
    ];

    // Fetch Account Codes
    useEffect(() => {
        const fetchAccountCodes = async () => {
            try {
                const res = await projectAPI.getAccountCodes();
                setAccountCodes(res.data);
            } catch (err) {
                console.error('Failed to fetch account codes:', err);
            }
        };
        fetchAccountCodes();
    }, []);

    // Initialize form with expense data
    useEffect(() => {
        if (expense && isOpen) {
            const hasVat = parseFloat(expense.vat_amount) > 0;
            const hasWht = parseFloat(expense.wht_amount) > 0;

            let whtRate = 3;
            if (hasWht && expense.price && parseFloat(expense.price) > 0) {
                const calculatedRate = (parseFloat(expense.wht_amount) / parseFloat(expense.price)) * 100;
                whtRate = [1, 2, 3, 5].reduce((prev, curr) =>
                    Math.abs(curr - calculatedRate) < Math.abs(prev - calculatedRate) ? curr : prev
                );
            }

            setFormData({
                categoryType: expense.expense_type || 'วางบิล',
                accountCode: expense.account_code || '',
                billHeader: expense.bill_header || '',
                contact: expense.contact || '',
                paybackTo: expense.payback_to || '',
                bankName: expense.bank_name || '',
                bankAccountNumber: expense.bank_account_number || '',
                bankAccountName: expense.bank_account_name || '',
                phone: expense.phone || '',
                email: expense.email || '',
                dueDate: expense.due_date || '',
                amount: expense.price?.toString() || '',
                discount: expense.discount?.toString() || '',
                hasVat: hasVat,
                hasWht: hasWht,
                whtRate: whtRate,
                note: expense.description || '',
                status: expense.internal_status || 'ส่งเบิกแล้ว รอเอกสารตัวจริง'
            });
            // Initialize attachments from prop
            setAttachments(expense.attachments || []);
            setDeletedIds(new Set());
        }
    }, [expense, isOpen]);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Add to attachments list with temporary preview
        const newAttachments = files.map(file => ({
            id: `temp-${Date.now()}-${Math.random()}`, // Temp ID
            file: file, // Keep file for upload
            file_name: file.name,
            file_path: URL.createObjectURL(file), // For preview (blob:)
            isNew: true
        }));

        setAttachments(prev => [...prev, ...newAttachments]);

        // Reset input
        e.target.value = '';
    };

    const handleDeleteClick = (fileId, idx, e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        const file = attachments[idx];

        setConfirmModal({
            isOpen: true,
            type: 'attachment',
            title: 'ยืนยันการลบไฟล์แนบ',
            itemName: file.file_name,
            warningMessage: 'ไฟล์จะถูกลบเมื่อกดบันทึก',
            onConfirm: () => confirmDeleteAttachment(idx)
        });
    };

    const confirmDeleteAttachment = (idx) => {
        const file = attachments[idx];

        // If it's a real file (from DB), mark it for deletion
        if (file.id && !file.isNew && !file.id.toString().startsWith('temp-')) {
            setDeletedIds(prev => new Set(prev).add(file.id));
        }

        // If it's a new file, just remove it from the list (cleanup blob)
        if (file.isNew && file.file_path) {
            URL.revokeObjectURL(file.file_path);
        }

        setAttachments(prev => prev.filter((_, i) => i !== idx));
        setConfirmModal({ ...confirmModal, isOpen: false });
    };

    const handleExpenseDeleteClick = () => {
        setConfirmModal({
            isOpen: true,
            type: 'expense',
            title: 'ยืนยันการลบรายจ่าย',
            itemName: formData.billHeader,
            warningMessage: 'การดำเนินการนี้ไม่สามารถย้อนกลับได้',
            onConfirm: confirmDeleteExpense
        });
    };

    const confirmDeleteExpense = async () => {
        if (onDelete) await onDelete(expense.id);
        handleClose();
    };

    // Close WHT dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (whtDropdownRef.current && !whtDropdownRef.current.contains(event.target)) {
                setIsWhtDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Calculate amounts
    const calculateAmounts = () => {
        const amount = parseFloat(formData.amount) || 0;
        const discount = parseFloat(formData.discount) || 0;
        const subTotal = Math.max(0, amount - discount);
        const vatAmount = formData.hasVat ? subTotal * 0.07 : 0;
        const whtAmount = formData.hasWht ? subTotal * (formData.whtRate / 100) : 0;
        const netPayment = subTotal + vatAmount - whtAmount;
        return { amount, discount, subTotal, vatAmount, whtAmount, netPayment };
    };

    const amounts = calculateAmounts();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
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
        if (!formData.accountCode) newErrors.accountCode = 'กรุณาเลือกรหัสค่าใช้จ่าย';
        if (!formData.billHeader?.trim()) newErrors.billHeader = 'กรุณากรอกหัวบิล';
        if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'กรุณาระบุจำนวนเงิน';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validate()) {
            try {
                // 1. Process Deletions (Parallel)
                if (deletedIds.size > 0) {
                    await Promise.all([...deletedIds].map(id => projectAPI.deleteExpenseAttachment(id)));

                }

                // 2. Process Uploads
                const newFiles = attachments.filter(a => a.isNew).map(a => a.file);
                if (newFiles.length > 0) {
                    const uploadData = new FormData();
                    newFiles.forEach(f => uploadData.append('files', f));
                    await projectAPI.uploadExpenseAttachment(expense.id, uploadData);

                }

                // 3. Update Expense Details
                const reportDate = formData.dueDate || new Date().toISOString().split('T')[0];
                const reportMonth = reportDate.substring(0, 7);

                const updatedExpense = {
                    account_code: formData.accountCode,
                    expense_type: formData.categoryType,
                    description: formData.note,
                    contact: formData.contact || formData.billHeader,
                    bill_header: formData.billHeader,
                    payback_to: formData.paybackTo || formData.contact || formData.billHeader,
                    bank_name: formData.bankName,
                    bank_account_number: formData.bankAccountNumber,
                    bank_account_name: formData.bankAccountName,
                    phone: formData.phone,
                    email: formData.email,
                    price: amounts.amount,
                    discount: amounts.discount,
                    vat_amount: amounts.vatAmount,
                    wht_amount: amounts.whtAmount,
                    net_amount: amounts.netPayment,
                    due_date: formData.dueDate || null,
                    internal_status: formData.status,
                    report_month: reportMonth
                };

                await onSubmit(updatedExpense);
                toast.success('บันทึกข้อมูลเรียบร้อยแล้ว'); // Optional, checking if parent toasts too
                handleClose();
            } catch (err) {
                console.error('Save failed:', err);
                toast.error('เกิดข้อผิดพลาดในการบันทึก: ' + (err.message || 'Unknown error'));
            }
        }
    };

    const handleClose = () => {
        setFormData({
            categoryType: 'วางบิล',
            accountCode: '',
            billHeader: '',
            contact: '',
            paybackTo: '',
            bankName: '',
            bankAccountNumber: '',
            bankAccountName: '',
            phone: '',
            email: '',
            dueDate: '',
            amount: '',
            discount: '',
            hasVat: false,
            hasWht: false,
            whtRate: 3,
            note: '',
            status: 'ส่งเบิกแล้ว รอเอกสารตัวจริง'
        });
        setErrors({});
        // Clean up any blob URLs
        attachments.forEach(a => {
            if (a.isNew && a.file_path) URL.revokeObjectURL(a.file_path);
        });
        setAttachments([]);
        setDeletedIds(new Set());
        setConfirmModal({ ...confirmModal, isOpen: false });
        onClose();
    };

    const inputClass = (fieldName) => `w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors[fieldName] ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`;
    const sectionClass = "bg-gradient-to-br from-white to-gray-50/50 rounded-2xl p-5 border border-gray-100 shadow-sm";
    const sectionHeaderClass = "flex items-center gap-2 mb-4";
    const sectionIconClass = "w-8 h-8 rounded-lg flex items-center justify-center";
    const labelClass = "block text-xs font-medium text-gray-600 mb-1.5";

    const accountCodeOptions = accountCodes.map(code => ({
        value: code.code,
        label: `${code.code} - ${code.title.substring(0, 25)}${code.title.length > 25 ? '...' : ''}`
    }));

    const formatNumber = (num) => num.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    if (!expense) return null;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="แก้ไขรายจ่าย" size="2xl">

            {/* Confirmation Modal */}
            <ConfirmDeleteModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                itemName={confirmModal.itemName}
                warningMessage={confirmModal.warningMessage}
            />

            <form onSubmit={handleSubmit}>
                {/* === ปุ่มเลือกประเภท (Header) === */}
                <div className="flex gap-2 mb-5">
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, categoryType: 'วางบิล' }))}
                        className={`flex items-center justify-center gap-2 py-2.5 px-5 rounded-lg border-2 transition-all text-sm ${formData.categoryType === 'วางบิล' ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-gray-200 hover:border-gray-300 bg-white text-gray-600'}`}
                    >
                        <Building2 className="w-4 h-4" />
                        <span className="font-medium">วางบิล</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, categoryType: 'เบิกที่สำรองจ่าย' }))}
                        className={`flex items-center justify-center gap-2 py-2.5 px-5 rounded-lg border-2 transition-all text-sm ${formData.categoryType === 'เบิกที่สำรองจ่าย' ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' : 'border-gray-200 hover:border-gray-300 bg-white text-gray-600'}`}
                    >
                        <User className="w-4 h-4" />
                        <span className="font-medium">เบิกคืน</span>
                    </button>
                </div>

                {/* === 3-Column Grid Layout === */}
                <div className="grid grid-cols-3 gap-5">

                    {/* ========== COLUMN 1: ข้อมูลรายการ + ผู้รับเงิน ========== */}
                    <div className="space-y-4">
                        {/* === Section 1: ข้อมูลรายการ === */}
                        <div className={sectionClass}>
                            <div className={sectionHeaderClass}>
                                <div className={`${sectionIconClass} bg-blue-100`}>
                                    <FileText className="w-4 h-4 text-blue-600" />
                                </div>
                                <span className="text-sm font-semibold text-gray-700">ข้อมูลรายการ</span>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className={labelClass}>รหัสโปรเจค</label>
                                    <input type="text" value={expense?.project_code || '-'} readOnly className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 font-mono" />
                                </div>
                                <div>
                                    <FormDropdown label="รหัสค่าใช้จ่าย *" value={formData.accountCode} options={accountCodeOptions} onChange={(val) => handleFieldChange('accountCode', val)} hasError={!!errors.accountCode} colorTheme="blue" />
                                    {errors.accountCode && <p className="text-red-500 text-xs mt-1">{errors.accountCode}</p>}
                                </div>
                            </div>
                        </div>

                        {/* === Section 2: ผู้รับเงิน === */}
                        <div className={sectionClass}>
                            <div className={sectionHeaderClass}>
                                <div className={`${sectionIconClass} bg-green-100`}>
                                    <User className="w-4 h-4 text-green-600" />
                                </div>
                                <span className="text-sm font-semibold text-gray-700">ผู้รับเงิน</span>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className={labelClass}>หัวบิล *</label>
                                    <input type="text" name="billHeader" value={formData.billHeader} onChange={handleChange} className={inputClass('billHeader')} />
                                    {errors.billHeader && <p className="text-red-500 text-xs mt-1">{errors.billHeader}</p>}
                                </div>
                                <div>
                                    <label className={labelClass}>ผู้ติดต่อ</label>
                                    <input type="text" name="contact" value={formData.contact} onChange={handleChange} className={inputClass('contact')} />
                                </div>
                                {formData.categoryType === 'เบิกที่สำรองจ่าย' && (
                                    <div>
                                        <label className={labelClass}>จ่ายคืน *</label>
                                        <input type="text" name="paybackTo" value={formData.paybackTo} onChange={handleChange} className={inputClass('paybackTo')} />
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                                    <div>
                                        <label className={labelClass}>เบอร์โทร</label>
                                        <input type="text" name="phone" value={formData.phone} onChange={handleChange} className={inputClass('phone')} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>อีเมล</label>
                                        <input type="text" name="email" value={formData.email} onChange={handleChange} className={inputClass('email')} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ========== COLUMN 2: บัญชีโอน + จำนวนเงิน + ภาษี + วันที่ ========== */}
                    <div className="space-y-4">
                        {/* === Section 3: บัญชีสำหรับโอนเงิน === */}
                        <div className={sectionClass}>
                            <div className={sectionHeaderClass}>
                                <div className={`${sectionIconClass} bg-purple-100`}>
                                    <CreditCard className="w-4 h-4 text-purple-600" />
                                </div>
                                <span className="text-sm font-semibold text-gray-700">บัญชีสำหรับโอนเงิน</span>
                            </div>
                            <div className="space-y-3">
                                <FormDropdown label="ธนาคาร" value={formData.bankName} options={bankOptions} onChange={(val) => handleFieldChange('bankName', val)} colorTheme="gray" />
                                <div>
                                    <label className={labelClass}>เลขบัญชี</label>
                                    <input type="text" name="bankAccountNumber" value={formData.bankAccountNumber} onChange={handleChange} className={inputClass('bankAccountNumber')} />
                                </div>
                                <div>
                                    <label className={labelClass}>ชื่อบัญชี</label>
                                    <input type="text" name="bankAccountName" value={formData.bankAccountName} onChange={handleChange} className={inputClass('bankAccountName')} />
                                </div>
                            </div>
                        </div>

                        {/* === จำนวนเงิน และ ส่วนลด === */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass}>จำนวนเงิน *</label>
                                <input type="number" name="amount" value={formData.amount} onChange={handleChange} className={inputClass('amount')} />
                                {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                            </div>
                            <div>
                                <label className={`${labelClass} text-gray-400`}>ส่วนลด</label>
                                <input type="number" name="discount" value={formData.discount} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-300" />
                            </div>
                        </div>

                        {/* === ตัวเลือกภาษี === */}
                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                                <Calculator className="w-4 h-4 text-gray-500" />
                                <span className="text-xs font-medium text-gray-700">ตัวเลือกภาษี</span>
                            </div>
                            <div className="space-y-2">
                                {/* VAT 7% */}
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className="relative">
                                        <input type="checkbox" name="hasVat" checked={formData.hasVat} onChange={handleChange} className="sr-only peer" />
                                        <div className="w-4 h-4 border-2 border-gray-300 rounded transition-all peer-checked:border-blue-500 peer-checked:bg-blue-500 group-hover:border-gray-400">
                                            {formData.hasVat && (
                                                <svg className="w-full h-full text-white p-0.5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-700">VAT 7%</span>
                                    {formData.hasVat && formData.amount && (
                                        <span className="text-xs text-gray-500 ml-auto">+{formatNumber(amounts.vatAmount)}</span>
                                    )}
                                </label>

                                {/* หัก ณ ที่จ่าย */}
                                <div className="flex items-center gap-2">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className="relative">
                                            <input type="checkbox" name="hasWht" checked={formData.hasWht} onChange={handleChange} className="sr-only peer" />
                                            <div className="w-4 h-4 border-2 border-gray-300 rounded transition-all peer-checked:border-blue-500 peer-checked:bg-blue-500 group-hover:border-gray-400">
                                                {formData.hasWht && (
                                                    <svg className="w-full h-full text-white p-0.5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-xs text-gray-700">หัก ณ ที่จ่าย</span>
                                    </label>
                                    {formData.hasWht && (
                                        <div className="relative" ref={whtDropdownRef}>
                                            <button type="button" onClick={() => setIsWhtDropdownOpen(!isWhtDropdownOpen)} className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-gray-300 bg-white">
                                                <span className="font-medium">{formData.whtRate}%</span>
                                                <ChevronDown className={`w-3 h-3 transition-transform ${isWhtDropdownOpen ? 'rotate-180' : ''}`} />
                                            </button>
                                            {isWhtDropdownOpen && (
                                                <div className="absolute top-full left-0 mt-1 min-w-[60px] bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                                                    {whtRateOptions.map(rate => (
                                                        <button key={rate} type="button" onClick={() => { setFormData(prev => ({ ...prev, whtRate: rate })); setIsWhtDropdownOpen(false); }}
                                                            className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${formData.whtRate === rate ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                                                            {rate}%
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {formData.hasWht && formData.amount && (
                                        <span className="text-xs text-gray-500 ml-auto">-{formatNumber(amounts.whtAmount)}</span>
                                    )}
                                </div>
                            </div>

                            {/* สรุปยอด */}
                            {formData.amount && parseFloat(formData.amount) > 0 && (
                                <div className="mt-3 pt-2 border-t border-gray-200">
                                    <div className="flex justify-between font-semibold">
                                        <span className="text-xs text-gray-700">ยอดจ่ายสุทธิ</span>
                                        <span className="text-sm text-blue-700">{formatNumber(amounts.netPayment)} บาท</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* === วันที่ === */}
                        <div className="grid grid-cols-2 gap-3">
                            <DatePicker label="วันครบกำหนด" value={formData.dueDate} onChange={(val) => handleFieldChange('dueDate', val)} colorTheme="blue" />
                            <FormDropdown label="สถานะ" value={formData.status} options={statusOptions} onChange={(val) => handleFieldChange('status', val)} colorTheme="blue" />
                        </div>
                    </div>

                    {/* ========== COLUMN 3: เอกสารแนบ + โน้ต ========== */}
                    <div className="space-y-4">
                        {/* === เอกสารแนบ === */}
                        <div>
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                                <label className="block text-xs font-medium text-gray-600">เอกสารแนบ</label>
                                <label className="cursor-pointer text-[10px] font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors flex items-center gap-1">
                                    <Plus className="w-3 h-3" />
                                    เพิ่มไฟล์
                                    <input type="file" multiple className="hidden" onChange={handleFileChange} />
                                </label>
                            </div>

                            {attachments.length > 0 ? (
                                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                    {attachments.map((file, idx) => {
                                        const filePath = typeof file === 'string' ? file : file.file_path;
                                        const fileName = file.file_name || (typeof file === 'string' ? file : file.file_path.split('/').pop());
                                        const fileId = file.id;

                                        if (!filePath) return null;

                                        const isPdf = fileName.toLowerCase().endsWith('.pdf');
                                        const isImage = /\.(jpg|jpeg|png|gif)$/i.test(fileName);
                                        const iconBg = isPdf ? 'bg-red-100' : isImage ? 'bg-blue-100' : 'bg-gray-100';
                                        const iconColor = isPdf ? 'text-red-500' : isImage ? 'text-blue-500' : 'text-gray-500';
                                        const fileUrl = file.isNew ? file.file_path : `http://localhost:3000${filePath.startsWith('/') ? '' : '/'}${filePath}`;

                                        return (
                                            <div key={idx} className="flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg group">
                                                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 flex-1 min-w-0">
                                                    <div className={`w-7 h-7 ${iconBg} rounded flex items-center justify-center shrink-0`}>
                                                        <FileText className={`w-3.5 h-3.5 ${iconColor}`} />
                                                    </div>
                                                    <div className="truncate">
                                                        <p className="text-xs font-medium text-gray-700 truncate max-w-[100px]">{fileName}</p>
                                                        {file.isNew ? (
                                                            <p className="text-[10px] text-green-500">รอบันทึก</p>
                                                        ) : (
                                                            <p className="text-[10px] text-blue-500 group-hover:underline">เปิดไฟล์</p>
                                                        )}
                                                    </div>
                                                </a>
                                                <button type="button" onClick={(e) => handleDeleteClick(fileId, idx, e)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors ml-1">
                                                    <Trash2 className="w-3.5 h-3.5 pointer-events-none" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-4 bg-gray-50 border border-dashed border-gray-300 rounded-xl">
                                    <p className="text-xs text-gray-500">ไม่มีเอกสารแนบ</p>
                                </div>
                            )}
                        </div>

                        {/* === โน้ต / หมายเหตุ === */}
                        <div>
                            <label className={labelClass}>โน้ต / หมายเหตุ</label>
                            <textarea name="note" value={formData.note} onChange={handleChange} rows="4" className={`${inputClass('note')} resize-none`} />
                        </div>
                    </div>
                </div>

                {/* === ปุ่ม Action (Footer) === */}
                <div className="flex justify-between mt-5 pt-4 border-t border-gray-200">
                    <button type="button" onClick={handleExpenseDeleteClick} className="px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2">
                        <Trash2 className="w-4 h-4" />
                        ลบ
                    </button>
                    <div className="flex gap-3">
                        <button type="button" onClick={handleClose} className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                            ยกเลิก
                        </button>
                        <button type="submit" className="px-6 py-2.5 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2">
                            <Save className="w-4 h-4" />
                            บันทึก
                        </button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default EditExpenseModal;
