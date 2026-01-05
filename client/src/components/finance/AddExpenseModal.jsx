import React, { useState, useRef, useEffect } from 'react';
import Modal from '../common/Modal';
import FormDropdown from '../common/FormDropdown';
import DatePicker from '../common/DatePicker';
import { projectAPI } from '../../services/api';
import { ChevronDown, Upload, File, X, Plus, Calculator, FileText, CreditCard, Building2, User } from 'lucide-react';

const AddExpenseModal = ({ isOpen, onClose, onSubmit, projectCode }) => {
    // Get today's date
    const [today] = useState(() => new Date().toISOString().split('T')[0]);

    // Account Codes & Projects State
    const [accountCodes, setAccountCodes] = useState([]);
    const [projects, setProjects] = useState([]);

    const [formData, setFormData] = useState({
        projectCode: projectCode || '', // Initialize with prop if available
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
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        amount: '',
        discount: '',
        hasVat: false,
        hasWht: false,
        whtRate: 3,
        note: '',
        status: 'ส่งเบิกแล้ว รอเอกสารตัวจริง'
    });

    const [attachments, setAttachments] = useState([]);
    const [errors, setErrors] = useState({});
    const [isWhtDropdownOpen, setIsWhtDropdownOpen] = useState(false);
    const whtDropdownRef = useRef(null);

    // WHT Rate options
    const whtRateOptions = [1, 2, 3, 5, 10];

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

    // Fetch Account Codes & Projects
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [accRes, projRes] = await Promise.all([
                    projectAPI.getAccountCodes(),
                    projectAPI.getAllProjects()
                ]);
                setAccountCodes(accRes.data);
                setProjects(projRes.data);
            } catch (err) {
                console.error('Failed to fetch data:', err);
            }
        };
        if (isOpen) fetchData();
    }, [isOpen]);

    // Update Project Code if prop changes
    useEffect(() => {
        if (projectCode) {
            setFormData(prev => ({ ...prev, projectCode }));
        }
    }, [projectCode]);

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

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const newAttachments = files.map(file => ({
            file: file, // Store actual file object
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
        if (!formData.projectCode) newErrors.projectCode = 'กรุณาเลือกรหัสโปรเจค';
        if (!formData.accountCode) newErrors.accountCode = 'กรุณาเลือกรหัสค่าใช้จ่าย';
        if (!formData.billHeader?.trim()) newErrors.billHeader = 'กรุณากรอกหัวบิล';
        if (!formData.phone?.trim()) newErrors.phone = 'กรุณากรอกเบอร์โทร';
        if (!formData.bankName) newErrors.bankName = 'กรุณาเลือกธนาคาร';
        if (!formData.bankAccountNumber?.trim()) newErrors.bankAccountNumber = 'กรุณากรอกเลขบัญชี';
        if (!formData.bankAccountName?.trim()) newErrors.bankAccountName = 'กรุณากรอกชื่อบัญชี';
        if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'กรุณาระบุจำนวนเงิน';
        if (!formData.dueDate) newErrors.dueDate = 'กรุณาระบุวันครบกำหนด';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            const reportDate = formData.dueDate || formData.issueDate || new Date().toISOString().split('T')[0];
            const reportMonth = reportDate.substring(0, 7);

            const newExpense = {
                project_code: formData.projectCode,
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
                peak_status: null,
                report_month: reportMonth
            };
            onSubmit(newExpense, attachments.map(a => a.file));
            handleClose();
        }
    };

    const handleClose = () => {
        setFormData({
            projectCode: '',
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
            issueDate: new Date().toISOString().split('T')[0],
            dueDate: '',
            amount: '',
            discount: '',
            hasVat: false,
            hasWht: false,
            whtRate: 3,
            note: '',
            status: 'ส่งเบิกแล้ว รอเอกสารตัวจริง'
        });
        setAttachments([]);
        setErrors({});
        onClose();
    };

    const inputClass = (fieldName) => `w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors[fieldName] ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`;
    const sectionClass = "bg-gradient-to-br from-white to-gray-50/50 rounded-2xl p-5 border border-gray-100 shadow-sm";
    const sectionHeaderClass = "flex items-center gap-2 mb-4";
    const sectionIconClass = "w-8 h-8 rounded-lg flex items-center justify-center";
    const labelClass = "block text-xs font-medium text-gray-600 mb-1.5";

    const accountCodeOptions = accountCodes.map(code => ({
        value: code.code,
        label: `${code.code} - ${code.title.length > 30 ? code.title.substring(0, 30) + '...' : code.title}`
    }));

    const projectOptions = projects.map(p => ({
        value: p.project_code,
        label: p.project_code
    }));

    // Find selected project and account details for display
    const selectedProject = projects.find(p => p.project_code === formData.projectCode);
    const selectedAccount = accountCodes.find(a => a.code === formData.accountCode);

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const formatNumber = (num) => num.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="บันทึกค่าใช้จ่ายใหม่" size="2xl">
            <form onSubmit={handleSubmit}>
                <div className="flex gap-4 mb-6 items-stretch">
                    {/* === Left Box: ประเภท (Type Selector) === */}
                    <div className="w-[120px] shrink-0 p-4 bg-white border border-gray-100 rounded-2xl flex flex-col">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">ประเภท</label>
                        <div className="flex flex-col gap-2 flex-1 justify-center">
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, categoryType: 'วางบิล' }))}
                                className={`w-full py-2 px-3 rounded-xl text-xs font-medium transition-all text-left flex items-center gap-2 ${formData.categoryType === 'วางบิล' ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                <div className={`w-2 h-2 rounded-full ${formData.categoryType === 'วางบิล' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                                วางบิล
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, categoryType: 'สำรองจ่าย' }))}
                                className={`w-full py-2 px-3 rounded-xl text-xs font-medium transition-all text-left flex items-center gap-2 ${formData.categoryType === 'สำรองจ่าย' ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-200' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                <div className={`w-2 h-2 rounded-full ${formData.categoryType === 'สำรองจ่าย' ? 'bg-orange-500' : 'bg-gray-300'}`} />
                                เบิกคืน
                            </button>
                        </div>
                    </div>

                    {/* === Right Box: Item Info === */}
                    <div className={`${sectionClass} flex-1 mb-0 flex flex-col`}>
                        <div className="flex items-center gap-2 mb-3">
                            <div className={`${sectionIconClass} bg-blue-100`}>
                                <FileText className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="text-sm font-semibold text-gray-700">ข้อมูลรายการ</span>
                        </div>

                        <div className="flex gap-6 flex-1 items-center">
                            {/* Project Group */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <label className="text-xs font-medium text-gray-600 whitespace-nowrap w-[70px] shrink-0">รหัสโปรเจค <span className="text-red-500">*</span></label>
                                    <div className="flex-1">
                                        <FormDropdown
                                            value={formData.projectCode}
                                            options={projectOptions}
                                            onChange={(val) => handleFieldChange('projectCode', val)}
                                            hasError={!!errors.projectCode}
                                            colorTheme="blue"
                                            placeholder="เลือก..."
                                            disabled={!!projectCode}
                                        />
                                    </div>
                                </div>
                                {errors.projectCode && <p className="text-red-500 text-xs mt-1 ml-[78px]">{errors.projectCode}</p>}
                                <span className="block text-xs text-gray-400 mt-1 truncate ml-[78px]">
                                    {selectedProject?.project_name || selectedProject?.title || '-'}
                                </span>
                            </div>

                            {/* Account Group */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <label className="text-xs font-medium text-gray-600 whitespace-nowrap w-[85px] shrink-0">รหัสค่าใช้จ่าย <span className="text-red-500">*</span></label>
                                    <div className="flex-1">
                                        <FormDropdown
                                            value={formData.accountCode}
                                            options={accountCodeOptions}
                                            onChange={(val) => handleFieldChange('accountCode', val)}
                                            hasError={!!errors.accountCode}
                                            colorTheme="blue"
                                            placeholder="เลือก..."
                                        />
                                    </div>
                                </div>
                                {errors.accountCode && <p className="text-red-500 text-xs mt-1 ml-[93px]">{errors.accountCode}</p>}
                                <span className="block text-xs text-gray-400 mt-1 truncate ml-[93px]">
                                    {selectedAccount?.title || '-'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* === 3-Column Grid Layout (Remaining Info) === */}
                <div className="grid grid-cols-3 gap-5">

                    {/* ========== COLUMN 1: ผู้รับเงิน ========== */}
                    <div className="space-y-4">
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
                                    <label className={labelClass}>หัวบิล <span className="text-red-500">*</span></label>
                                    <input type="text" name="billHeader" value={formData.billHeader} onChange={handleChange} className={inputClass('billHeader')} />
                                    {errors.billHeader && <p className="text-red-500 text-xs mt-1">{errors.billHeader}</p>}
                                </div>
                                <div>
                                    <label className={labelClass}>ผู้ติดต่อ <span className="text-red-500">*</span></label>
                                    <input type="text" name="contact" value={formData.contact} onChange={handleChange} className={inputClass('contact')} />
                                </div>
                                {formData.categoryType === 'สำรองจ่าย' && (
                                    <div>
                                        <label className={labelClass}>จ่ายคืน <span className="text-red-500">*</span></label>
                                        <input type="text" name="paybackTo" value={formData.paybackTo} onChange={handleChange} className={inputClass('paybackTo')} />
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                                    <div>
                                        <label className={labelClass}>เบอร์โทร <span className="text-red-500">*</span></label>
                                        <input type="text" name="phone" value={formData.phone} onChange={handleChange} className={inputClass('phone')} />
                                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
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
                                <div>
                                    <FormDropdown label={<>ธนาคาร <span className="text-red-500">*</span></>} value={formData.bankName} options={bankOptions} onChange={(val) => handleFieldChange('bankName', val)} colorTheme="gray" hasError={!!errors.bankName} />
                                    {errors.bankName && <p className="text-red-500 text-xs mt-1">{errors.bankName}</p>}
                                </div>
                                <div>
                                    <label className={labelClass}>เลขบัญชี <span className="text-red-500">*</span></label>
                                    <input type="text" name="bankAccountNumber" value={formData.bankAccountNumber} onChange={handleChange} className={inputClass('bankAccountNumber')} />
                                    {errors.bankAccountNumber && <p className="text-red-500 text-xs mt-1">{errors.bankAccountNumber}</p>}
                                </div>
                                <div>
                                    <label className={labelClass}>ชื่อบัญชี <span className="text-red-500">*</span></label>
                                    <input type="text" name="bankAccountName" value={formData.bankAccountName} onChange={handleChange} className={inputClass('bankAccountName')} />
                                    {errors.bankAccountName && <p className="text-red-500 text-xs mt-1">{errors.bankAccountName}</p>}
                                </div>
                            </div>
                        </div>

                        {/* === จำนวนเงิน และ ส่วนลด === */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2">
                                <label className={labelClass}>จำนวนเงิน <span className="text-red-500">*</span></label>
                                <input type="number" name="amount" value={formData.amount} onChange={handleChange} className={inputClass('amount')} />
                                {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                            </div>
                            <div>
                                <label className={`${labelClass} text-gray-400`}>ส่วนลด</label>
                                <input type="number" name="discount" value={formData.discount} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-300" />
                            </div>
                        </div>

                        {/* === ตัวเลือกภาษี (รวม VAT, หัก ณ ที่จ่าย) === */}
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


                    </div>

                    {/* ========== COLUMN 3: เอกสารแนบ + สถานะ + โน้ต ========== */}
                    <div className="space-y-4">
                        {/* === เอกสารแนบ === */}
                        <div>
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                                <label className="block text-xs font-medium text-gray-600">เอกสารแนบ</label>
                                <label className="cursor-pointer text-[10px] font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors flex items-center gap-1">
                                    <Plus className="w-3 h-3" />
                                    เพิ่มไฟล์
                                    <input type="file" multiple className="hidden" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" />
                                </label>
                            </div>

                            {attachments.length > 0 ? (
                                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                    {attachments.map((file, idx) => {
                                        const isPdf = file.name.toLowerCase().endsWith('.pdf');
                                        const isImage = /\.(jpg|jpeg|png|gif)$/i.test(file.name);
                                        const iconBg = isPdf ? 'bg-red-100' : isImage ? 'bg-blue-100' : 'bg-gray-100';
                                        const iconColor = isPdf ? 'text-red-500' : isImage ? 'text-blue-500' : 'text-gray-500';
                                        return (
                                            <div key={idx} className="flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-7 h-7 ${iconBg} rounded flex items-center justify-center`}>
                                                        <File className={`w-3.5 h-3.5 ${iconColor}`} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-700 truncate max-w-[120px]">{file.name}</p>
                                                        <p className="text-[10px] text-gray-400">{formatFileSize(file.size)}</p>
                                                    </div>
                                                </div>
                                                <button type="button" onClick={() => removeAttachment(idx)} className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-4 bg-gray-50 border border-dashed border-gray-300 rounded-xl">
                                    <p className="text-xs text-gray-500">ยังไม่มีไฟล์แนบ</p>
                                </div>
                            )}
                        </div>



                        {/* === โน้ต / หมายเหตุ === */}
                        <div>
                            <label className={labelClass}>โน้ต / หมายเหตุ</label>
                            <textarea name="note" value={formData.note} onChange={handleChange} rows="4" className={`${inputClass('note')} resize-none`} />
                        </div>

                        {/* === วันที่ === */}
                        <div className="grid grid-cols-2 gap-3">
                            <DatePicker label="วันที่ลงข้อมูล" value={formData.issueDate} onChange={(val) => handleFieldChange('issueDate', val)} colorTheme="blue" />
                            <div>
                                <DatePicker label={<>วันครบกำหนด <span className="text-red-500">*</span></>} value={formData.dueDate} onChange={(val) => handleFieldChange('dueDate', val)} colorTheme="blue" hasError={!!errors.dueDate} />
                                {errors.dueDate && <p className="text-red-500 text-xs mt-1">{errors.dueDate}</p>}
                            </div>
                        </div>

                        {/* === สถานะ === */}
                        <div>
                            <FormDropdown label={<>สถานะ <span className="text-red-500">*</span></>} value={formData.status} options={statusOptions} onChange={(val) => handleFieldChange('status', val)} colorTheme="blue" />
                        </div>
                    </div>
                </div>

                {/* === ปุ่ม Action (Footer) === */}
                <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-200">
                    <button type="button" onClick={handleClose} className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                        ยกเลิก
                    </button>
                    <button type="submit" className="px-6 py-2.5 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        บันทึก
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddExpenseModal;
