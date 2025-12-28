import React, { useState, useRef, useEffect } from 'react';
import Modal from '../common/Modal';
import FormDropdown from '../common/FormDropdown';
import DatePicker from '../common/DatePicker';
// import { expenseCodes } from '../data/expenseCodes'; // Removed
import { projectAPI } from '../../services/api'; // Import projectAPI
import { ChevronDown, Upload, File, X, Plus, Calculator } from 'lucide-react';

const AddExpenseModal = ({ isOpen, onClose, onSubmit, projectCode }) => {
    // Get today's date in YYYY-MM-DD format
    const [today] = useState(() => new Date().toISOString().split('T')[0]);

    // Expense Code State
    const [expenseCodes, setExpenseCodes] = useState([]);

    const [formData, setFormData] = useState({
        expenseCode: '',
        description: '',
        recipient: '',
        paymentDate: '',
        taxBase: '',
        hasVat: false,
        hasWht: false,
        whtRate: 3,
        status: 'วางบิล'
    });

    const [attachments, setAttachments] = useState([]);
    const [errors, setErrors] = useState({});
    const [isWhtDropdownOpen, setIsWhtDropdownOpen] = useState(false);
    const whtDropdownRef = useRef(null);

    // WHT Rate options
    const whtRateOptions = [1, 2, 3, 5];

    // Primary Account State
    const [primaryAccount, setPrimaryAccount] = useState(null);

    // Fetch primary account on mount
    useEffect(() => {
        const fetchPrimaryAccount = async () => {
            try {
                // We could optimise this by having a specific endpoint or just filtering client-side
                const accounts = await projectAPI.getAllAccounts();
                const primary = accounts.data.find(acc => acc.is_primary);
                setPrimaryAccount(primary);
            } catch (err) {
                console.error('Failed to fetch primary account:', err);
            }
        };
        fetchPrimaryAccount();
    }, []);

    // Fetch Expense Codes on mount
    useEffect(() => {
        const fetchExpenseCodes = async () => {
            try {
                const res = await projectAPI.getExpenseCodes();
                setExpenseCodes(res.data);
            } catch (err) {
                console.error('Failed to fetch expense codes:', err);
            }
        };
        fetchExpenseCodes();
    }, []);

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

    // Get title from expense code
    const getExpenseTitle = (code) => {
        const codeInfo = expenseCodes.find(c => c.code === code);
        return codeInfo ? codeInfo.title : '';
    };

    // Calculate amounts
    const calculateAmounts = () => {
        const taxBase = parseFloat(formData.taxBase) || 0;
        const vatAmount = formData.hasVat ? taxBase * 0.07 : 0;
        const whtAmount = formData.hasWht ? taxBase * (formData.whtRate / 100) : 0;
        const totalBeforeWht = taxBase + vatAmount;
        const netPayment = totalBeforeWht - whtAmount;

        return {
            taxBase,
            vatAmount,
            whtAmount,
            totalBeforeWht,
            netPayment
        };
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
        // Auto-fill description when expense code changes
        if (name === 'expenseCode') {
            const title = getExpenseTitle(value);
            setFormData(prev => ({ ...prev, [name]: value, description: title }));
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
        if (!formData.expenseCode) newErrors.expenseCode = 'กรุณาเลือกรหัสค่าใช้จ่าย';
        if (!formData.recipient.trim()) newErrors.recipient = 'กรุณากรอกผู้รับเงิน';
        if (!formData.paymentDate) newErrors.paymentDate = 'กรุณาเลือกวันที่จ่าย';
        if (!formData.taxBase || parseFloat(formData.taxBase) <= 0) newErrors.taxBase = 'กรุณากรอกจำนวนเงิน';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            const { taxBase, vatAmount, whtAmount, netPayment } = calculateAmounts();

            const newExpense = {
                // eslint-disable-next-line react-hooks/purity
                id: Date.now(),
                projectCode: projectCode,
                expenseCode: formData.expenseCode,
                title: getExpenseTitle(formData.expenseCode),
                description: formData.description,
                status: formData.status,
                statusColor: formData.status === 'วางบิล' ? 'green' :
                    formData.status === 'จ่ายแล้ว' ? 'green' : 'blue',
                company: 'บริษัทคอมมอนกราวด์ ประเทศไทย จำกัด',
                recipient: formData.recipient,
                issueDate: today,
                paymentDate: formData.paymentDate,
                taxBase: taxBase,
                netAmount: netPayment,
                priceAmount: taxBase,
                vat: formData.hasVat ? 7 : 0,
                vatAmount: vatAmount,
                hasWht: formData.hasWht,
                whtRate: formData.hasWht ? formData.whtRate : 0,
                wht: whtAmount,
                currency: 'THB',
                attachments: attachments,
                account_id: (formData.status === 'จ่ายแล้ว' && primaryAccount) ? primaryAccount.id : null
            };
            onSubmit(newExpense);
            handleClose();
        }
    };

    const handleClose = () => {
        setFormData({
            expenseCode: '',
            description: '',
            recipient: '',
            paymentDate: '',
            taxBase: '',
            hasVat: false,
            hasWht: false,
            whtRate: 3,
            status: 'วางบิล'
        });
        setAttachments([]);
        setErrors({});
        onClose();
    };

    const inputClass = (fieldName) => `w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all ${errors[fieldName] ? 'border-red-300 bg-red-50' : 'border-gray-200'}`;

    // Prepare expense code options
    const expenseCodeOptions = expenseCodes.map(code => ({
        value: code.code,
        label: `${code.code} - ${code.title.substring(0, 25)}${code.title.length > 25 ? '...' : ''}`
    }));

    const [statusOptions, setStatusOptions] = useState([]);

    // Fetch Statuses on mount
    useEffect(() => {
        const fetchStatuses = async () => {
            try {
                const res = await projectAPI.getFinancialStatuses('expense');
                const options = res.data.map(s => ({
                    value: s.value,
                    label: s.label
                }));
                setStatusOptions(options);
            } catch (err) {
                console.error('Failed to fetch expense statuses:', err);
                // Fallback
                setStatusOptions([
                    { value: 'วางบิล', label: 'วางบิล' },
                    { value: 'สำรองจ่าย', label: 'สำรองจ่าย' },
                    { value: 'จ่ายแล้ว', label: 'จ่ายแล้ว' }
                ]);
            }
        };
        fetchStatuses();
    }, []);

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const formatNumber = (num) => {
        return num.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="เพิ่มรายจ่าย" size="lg">
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

                {/* Expense Code - Single dropdown that serves as description */}
                <div>
                    <FormDropdown
                        label="รหัสค่าใช้จ่าย *"
                        value={formData.expenseCode}
                        options={expenseCodeOptions}
                        onChange={(val) => handleFieldChange('expenseCode', val)}
                        hasError={!!errors.expenseCode}
                        colorTheme="red"
                    />
                    {errors.expenseCode && <p className="text-red-500 text-xs mt-1">{errors.expenseCode}</p>}
                </div>

                {/* Description - Auto-filled from expense code */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
                    <input
                        type="text"
                        value={formData.description}
                        readOnly
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500"
                    />
                </div>

                {/* Recipient */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ผู้รับเงิน *</label>
                    <input
                        type="text"
                        name="recipient"
                        value={formData.recipient}
                        onChange={handleChange}
                        className={inputClass('recipient')}
                    />
                    {errors.recipient && <p className="text-red-500 text-xs mt-1">{errors.recipient}</p>}
                </div>

                {/* Payment Date */}
                <div>
                    <DatePicker
                        label="วันที่จ่าย *"
                        value={formData.paymentDate}
                        onChange={(val) => handleFieldChange('paymentDate', val)}
                        hasError={!!errors.paymentDate}
                        colorTheme="red"
                        dropUp
                    />
                    {errors.paymentDate && <p className="text-red-500 text-xs mt-1">{errors.paymentDate}</p>}
                </div>

                {/* Tax Base and Status */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ราคาก่อน VAT (Tax Base) *</label>
                        <input
                            type="number"
                            name="taxBase"
                            value={formData.taxBase}
                            onChange={handleChange}
                            placeholder="0.00"
                            className={inputClass('taxBase')}
                        />
                        {errors.taxBase && <p className="text-red-500 text-xs mt-1">{errors.taxBase}</p>}
                    </div>
                    <FormDropdown
                        label="สถานะ *"
                        value={formData.status}
                        options={statusOptions}
                        onChange={(val) => handleFieldChange('status', val)}
                        colorTheme="red"
                    />
                </div>

                {/* Account Info (Auto-Linked) */}
                {formData.status === 'จ่ายแล้ว' && primaryAccount && (
                    <div className="bg-blue-50 px-4 py-3 rounded-lg border border-blue-100 flex items-center justify-between">
                        <span className="text-sm text-blue-700 font-medium">Payment via:</span>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span className="text-sm text-blue-900 font-bold">{primaryAccount.name} ({primaryAccount.bank_code?.toUpperCase()})</span>
                        </div>
                    </div>
                )}

                {/* Tax Options Section */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                        <Calculator className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">ตัวเลือกภาษี</span>
                    </div>

                    <div className="space-y-3">
                        {/* VAT 7% Checkbox */}
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    name="hasVat"
                                    checked={formData.hasVat}
                                    onChange={handleChange}
                                    className="sr-only peer"
                                />
                                <div className="w-5 h-5 border-2 border-gray-300 rounded transition-all peer-checked:border-red-500 peer-checked:bg-red-500 group-hover:border-gray-400">
                                    {formData.hasVat && (
                                        <svg className="w-full h-full text-white p-0.5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </div>
                            </div>
                            <span className="text-sm text-gray-700">VAT 7%</span>
                            {formData.hasVat && formData.taxBase && (
                                <span className="text-sm text-gray-500 ml-auto">
                                    +{formatNumber(amounts.vatAmount)} บาท
                                </span>
                            )}
                        </label>

                        {/* WHT Checkbox with MinimalDropdown */}
                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        name="hasWht"
                                        checked={formData.hasWht}
                                        onChange={handleChange}
                                        className="sr-only peer"
                                    />
                                    <div className="w-5 h-5 border-2 border-gray-300 rounded transition-all peer-checked:border-red-500 peer-checked:bg-red-500 group-hover:border-gray-400">
                                        {formData.hasWht && (
                                            <svg className="w-full h-full text-white p-0.5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                </div>
                                <span className="text-sm text-gray-700">หัก ณ ที่จ่าย</span>
                            </label>

                            {/* WHT Rate MinimalDropdown */}
                            {formData.hasWht && (
                                <div className="relative" ref={whtDropdownRef}>
                                    <button
                                        type="button"
                                        onClick={() => setIsWhtDropdownOpen(!isWhtDropdownOpen)}
                                        className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-all ${isWhtDropdownOpen
                                            ? 'text-gray-900 border-gray-400 bg-white'
                                            : 'text-gray-600 border-gray-300 hover:border-gray-400 bg-white'
                                            }`}
                                    >
                                        <span className="font-medium">{formData.whtRate}%</span>
                                        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isWhtDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isWhtDropdownOpen && (
                                        <div className="absolute top-full left-0 mt-1 min-w-[80px] bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50 overflow-hidden">
                                            {whtRateOptions.map(rate => (
                                                <button
                                                    key={rate}
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData(prev => ({ ...prev, whtRate: rate }));
                                                        setIsWhtDropdownOpen(false);
                                                    }}
                                                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${formData.whtRate === rate
                                                        ? 'bg-red-500 text-white'
                                                        : 'text-gray-700 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    {rate}%
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {formData.hasWht && formData.taxBase && (
                                <span className="text-sm text-gray-500 ml-auto">
                                    -{formatNumber(amounts.whtAmount)} บาท
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tax Calculation Summary */}
                {formData.taxBase && parseFloat(formData.taxBase) > 0 && (
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center">
                                <Calculator className="w-3.5 h-3.5 text-slate-600" />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">สรุปการคำนวณ</span>
                        </div>

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-gray-600">
                                <span>ราคาก่อน VAT (Tax Base)</span>
                                <span>{formatNumber(amounts.taxBase)} บาท</span>
                            </div>

                            {formData.hasVat && (
                                <div className="flex justify-between text-gray-600">
                                    <span>VAT 7%</span>
                                    <span className="text-emerald-600">+{formatNumber(amounts.vatAmount)} บาท</span>
                                </div>
                            )}

                            {(formData.hasVat || formData.hasWht) && (
                                <div className="flex justify-between text-gray-600">
                                    <span>รวมก่อนหัก ณ ที่จ่าย</span>
                                    <span>{formatNumber(amounts.totalBeforeWht)} บาท</span>
                                </div>
                            )}

                            {formData.hasWht && (
                                <div className="flex justify-between text-gray-600">
                                    <span>หัก ณ ที่จ่าย ({formData.whtRate}%)</span>
                                    <span className="text-red-500">-{formatNumber(amounts.whtAmount)} บาท</span>
                                </div>
                            )}

                            <div className="pt-2 mt-2 border-t border-slate-200">
                                <div className="flex justify-between font-semibold">
                                    <span className="text-slate-700">ยอดจ่ายสุทธิ (Net Payment)</span>
                                    <span className="text-lg text-slate-900">{formatNumber(amounts.netPayment)} บาท</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* File Attachments */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">เอกสารแนบ</label>
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 hover:border-red-300 transition-colors">
                        <input
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            className="hidden"
                            id="expense-attachments"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                        />
                        <label htmlFor="expense-attachments" className="flex flex-col items-center cursor-pointer">
                            <Upload className="w-6 h-6 text-gray-400" />
                            <span className="text-sm text-gray-500 mt-1">คลิกเพื่อเลือกไฟล์</span>
                            <span className="text-xs text-gray-400">PDF, รูปภาพ, Word, Excel</span>
                        </label>
                    </div>
                    {attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                            {attachments.map((file, idx) => (
                                <div key={idx} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <File className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm text-gray-700">{file.name}</span>
                                        <span className="text-xs text-gray-400">({formatFileSize(file.size)})</span>
                                    </div>
                                    <button type="button" onClick={() => removeAttachment(idx)} className="text-gray-400 hover:text-red-500">
                                        <X className="w-4 h-4" />
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
                        className="px-5 py-2.5 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        บันทึก
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddExpenseModal;
