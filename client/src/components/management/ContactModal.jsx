import React, { useState, useEffect } from 'react';
import {
    User,
    Building2,
    CreditCard,
    FileText,
    Upload,
    Save,
    X,
    Plus,
    Trash2,
    CheckCircle2,
    MapPin,
    Phone,
    Mail,
    File
} from 'lucide-react';
import api from '../../services/api';
import Dropdown from '../common/Dropdown';

// Bank options for dropdown
const bankOptions = [
    { value: 'กสิกรไทย', label: 'กสิกรไทย (KBANK)' },
    { value: 'ไทยพาณิชย์', label: 'ไทยพาณิชย์ (SCB)' },
    { value: 'กรุงเทพ', label: 'กรุงเทพ (BBL)' },
    { value: 'กรุงไทย', label: 'กรุงไทย (KTB)' },
    { value: 'กรุงศรี', label: 'กรุงศรี (BAY)' },
    { value: 'ทหารไทยธนชาต', label: 'ทหารไทยธนชาต (TTB)' },
    { value: 'ออมสิน', label: 'ออมสิน (GSB)' },
    { value: 'ธกส', label: 'ธ.ก.ส. (BAAC)' }
];

const ContactModal = ({ isOpen, onClose, contact }) => {
    const isEditing = !!contact;

    // State สำหรับจัดการข้อมูลในฟอร์ม
    const [formData, setFormData] = useState({
        entity_type: 'individual',
        tax_id: '',
        branch_code: '00000',
        name_th: '',
        name_en: '',
        nick_name: '',
        phone: '',
        mobile: '',
        email: '',
        address_registration: '',
        address_shipping: '',
        same_address: true,
        bank_name: '',
        bank_account_number: '',
        bank_account_name: '',
        role: '',
        note: ''
    });

    // State สำหรับจัดการไฟล์แนบ
    const [documents, setDocuments] = useState({
        identity_doc: null,
        book_bank: null,
        vat_cert: null,
        others: []
    });

    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    const isJuristic = formData.entity_type === 'juristic';

    // Load contact data when editing
    useEffect(() => {
        const loadContactData = async () => {
            if (contact?.id) {
                try {
                    // Fetch full contact data with documents from API
                    const response = await api.get(`/contacts/${contact.id}`);
                    const fullContact = response.data;

                    setFormData({
                        entity_type: fullContact.entity_type || 'individual',
                        tax_id: fullContact.tax_id || '',
                        branch_code: fullContact.branch_code || '00000',
                        name_th: fullContact.name_th || '',
                        name_en: fullContact.name_en || '',
                        nick_name: fullContact.nick_name || '',
                        phone: fullContact.phone || '',
                        mobile: fullContact.mobile || '',
                        email: fullContact.email || '',
                        address_registration: fullContact.address_registration || '',
                        address_shipping: fullContact.address_shipping || '',
                        same_address: !fullContact.address_shipping || fullContact.address_shipping === fullContact.address_registration,
                        bank_name: fullContact.bank_name || '',
                        bank_account_number: fullContact.bank_account_number || '',
                        bank_account_name: fullContact.bank_account_name || '',
                        role: fullContact.role || '',
                        note: fullContact.note || ''
                    });

                    // Load existing documents from API response
                    if (fullContact.documents && fullContact.documents.length > 0) {
                        const docsState = { identity_doc: null, book_bank: null, vat_cert: null, others: [] };
                        fullContact.documents.forEach(doc => {
                            const docInfo = {
                                id: doc.id,
                                name: doc.file_name,
                                size: doc.file_size ? `${(doc.file_size / 1024 / 1024).toFixed(2)} MB` : 'N/A',
                                uploaded_at: new Date(doc.uploaded_at).toLocaleDateString('th-TH')
                            };

                            if (doc.document_type === 'id_card' || doc.document_type === 'company_cert') {
                                docsState.identity_doc = docInfo;
                            } else if (doc.document_type === 'book_bank') {
                                docsState.book_bank = docInfo;
                            } else if (doc.document_type === 'vat_cert') {
                                docsState.vat_cert = docInfo;
                            } else {
                                docsState.others.push(docInfo);
                            }
                        });
                        setDocuments(docsState);
                    } else {
                        setDocuments({ identity_doc: null, book_bank: null, vat_cert: null, others: [] });
                    }
                } catch (error) {
                    console.error('Error loading contact data:', error);
                }
            }
        };

        if (isOpen && contact?.id) {
            loadContactData();
        } else if (isOpen) {
            // Reset form for new contact
            setFormData({
                entity_type: 'individual',
                tax_id: '',
                branch_code: '00000',
                name_th: '',
                name_en: '',
                nick_name: '',
                phone: '',
                mobile: '',
                email: '',
                address_registration: '',
                address_shipping: '',
                same_address: true,
                bank_name: '',
                bank_account_number: '',
                bank_account_name: '',
                role: '',
                note: ''
            });
            setDocuments({ identity_doc: null, book_bank: null, vat_cert: null, others: [] });
        }
        setErrors({});
    }, [contact, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        // Clear error on change
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    // Validate form
    const validate = () => {
        const newErrors = {};
        if (!formData.name_th) newErrors.name_th = 'กรุณากรอกชื่อ';
        if (!formData.phone) newErrors.phone = 'กรุณากรอกเบอร์โทรศัพท์';
        if (formData.tax_id && !/^\d{13}$/.test(formData.tax_id)) {
            newErrors.tax_id = 'Tax ID ต้องเป็นตัวเลข 13 หลัก';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Save contact
    const handleSave = async () => {
        if (!validate()) return;

        setSaving(true);
        try {
            const payload = {
                ...formData,
                address_shipping: formData.same_address ? formData.address_registration : formData.address_shipping
            };

            let contactId;
            if (isEditing) {
                await api.put(`/contacts/${contact.id}`, payload);
                contactId = contact.id;
            } else {
                const response = await api.post('/contacts', payload);
                contactId = response.data.id;
            }

            // Upload pending files for new contacts
            if (!isEditing && contactId) {
                const uploadPromises = [];

                // Upload identity document
                if (documents.identity_doc?.file) {
                    const formDataUpload = new FormData();
                    formDataUpload.append('file', documents.identity_doc.file);
                    formDataUpload.append('document_type', formData.entity_type === 'juristic' ? 'company_cert' : 'id_card');
                    uploadPromises.push(api.post(`/contacts/${contactId}/documents`, formDataUpload, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    }));
                }

                // Upload bookbank
                if (documents.book_bank?.file) {
                    const formDataUpload = new FormData();
                    formDataUpload.append('file', documents.book_bank.file);
                    formDataUpload.append('document_type', 'book_bank');
                    uploadPromises.push(api.post(`/contacts/${contactId}/documents`, formDataUpload, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    }));
                }

                // Upload VAT cert (juristic only)
                if (documents.vat_cert?.file) {
                    const formDataUpload = new FormData();
                    formDataUpload.append('file', documents.vat_cert.file);
                    formDataUpload.append('document_type', 'vat_cert');
                    uploadPromises.push(api.post(`/contacts/${contactId}/documents`, formDataUpload, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    }));
                }

                // Upload other documents
                for (const doc of documents.others) {
                    if (doc.file) {
                        const formDataUpload = new FormData();
                        formDataUpload.append('file', doc.file);
                        formDataUpload.append('document_type', 'other');
                        uploadPromises.push(api.post(`/contacts/${contactId}/documents`, formDataUpload, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        }));
                    }
                }

                // Wait for all uploads
                if (uploadPromises.length > 0) {
                    await Promise.all(uploadPromises);
                }
            }

            onClose(true); // Close and refresh
        } catch (error) {
            console.error('Error saving contact:', error);
            if (error.response?.data?.error) {
                setErrors({ submit: error.response.data.error });
            }
        } finally {
            setSaving(false);
        }
    };

    // File upload handler
    const handleFileUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        // For edit mode with existing contact, upload immediately
        if (isEditing && contact?.id) {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);
            formDataUpload.append('document_type', type === 'identity_doc' ? (isJuristic ? 'company_cert' : 'id_card') : type);

            try {
                const response = await api.post(`/contacts/${contact.id}/documents`, formDataUpload, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                const newFile = {
                    id: response.data.id,
                    name: file.name,
                    size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                    uploaded_at: new Date().toLocaleDateString('th-TH')
                };

                if (type === 'others') {
                    setDocuments(prev => ({ ...prev, others: [...prev.others, newFile] }));
                } else {
                    setDocuments(prev => ({ ...prev, [type]: newFile }));
                }
            } catch (error) {
                console.error('Error uploading document:', error);
            }
        } else {
            // For new contact, just store file info (will upload after save)
            const newFile = {
                file,
                name: file.name,
                size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                uploaded_at: new Date().toLocaleDateString('th-TH')
            };

            if (type === 'others') {
                setDocuments(prev => ({ ...prev, others: [...prev.others, newFile] }));
            } else {
                setDocuments(prev => ({ ...prev, [type]: newFile }));
            }
        }
    };

    const removeDocument = async (type, index = null) => {
        if (type === 'others' && index !== null) {
            const doc = documents.others[index];
            if (doc.id && isEditing) {
                try {
                    await api.delete(`/contacts/${contact.id}/documents/${doc.id}`);
                } catch (error) {
                    console.error('Error removing document:', error);
                }
            }
            setDocuments(prev => ({
                ...prev,
                others: prev.others.filter((_, i) => i !== index)
            }));
        } else {
            const doc = documents[type];
            if (doc?.id && isEditing) {
                try {
                    await api.delete(`/contacts/${contact.id}/documents/${doc.id}`);
                } catch (error) {
                    console.error('Error removing document:', error);
                }
            }
            setDocuments(prev => ({ ...prev, [type]: null }));
        }
    };

    // Upload Slot Component
    const UploadSlot = ({ title, type, file, required = false, icon }) => (
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 hover:bg-white hover:border-blue-300 transition-all group">
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                    {icon || <FileText size={18} className="text-slate-400" />}
                    <div>
                        <p className="text-sm font-semibold text-slate-700">
                            {title} {required && <span className="text-red-500">*</span>}
                        </p>
                        {!file && <p className="text-xs text-slate-400">ยังไม่มีไฟล์แนบ</p>}
                    </div>
                </div>
                {file && (
                    <span className="bg-green-100 text-green-700 text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 size={10} /> เรียบร้อย
                    </span>
                )}
            </div>

            {file ? (
                <div className="bg-white border border-slate-200 p-3 rounded-md flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <File size={16} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                            <p className="text-xs text-slate-400">{file.size} • {file.uploaded_at}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => removeDocument(type)}
                        className="text-slate-400 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-colors"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ) : (
                <label className="w-full py-2 border border-dashed border-slate-300 rounded-md text-sm text-slate-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 cursor-pointer">
                    <Upload size={16} />
                    อัปโหลดไฟล์
                    <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(e, type)}
                    />
                </label>
            )}
        </div>
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-8">
            <div className="bg-slate-50 rounded-xl shadow-2xl w-full max-w-5xl mx-4 my-auto">

                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-white rounded-t-xl">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">
                            {isEditing ? 'แก้ไขข้อมูล Contact' : 'เพิ่มข้อมูล Contact ใหม่'}
                        </h1>
                        <p className="text-slate-500 text-sm mt-0.5">
                            {isEditing ? 'แก้ไขข้อมูลคู่ค้าหรือทีมงาน' : 'กรอกข้อมูลคู่ค้าหรือทีมงานเพื่อบันทึกลงในฐานข้อมูล'}
                        </p>
                    </div>
                    <button
                        onClick={() => onClose(false)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Error Message */}
                {errors.submit && (
                    <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {errors.submit}
                    </div>
                )}

                {/* Content */}
                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Column: Main Form */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Section 1: ข้อมูลทั่วไป */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                                <User className="text-blue-500" size={20} />
                                <h2 className="font-semibold text-slate-800">ข้อมูลทั่วไป (General Information)</h2>
                            </div>

                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">

                                {/* Entity Type Selection */}
                                <div className="md:col-span-2 mb-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">ประเภทบุคคล</label>
                                    <div className="flex bg-slate-100 p-1 rounded-lg w-fit">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, entity_type: 'individual' })}
                                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${!isJuristic ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            บุคคลธรรมดา
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, entity_type: 'juristic' })}
                                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${isJuristic ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            นิติบุคคล
                                        </button>
                                    </div>
                                </div>

                                {/* Tax ID */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        เลขประจำตัวผู้เสียภาษี
                                    </label>
                                    <input
                                        type="text"
                                        name="tax_id"
                                        value={formData.tax_id}
                                        onChange={handleChange}
                                        maxLength={13}
                                        placeholder="เลข 13 หลัก"
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${errors.tax_id ? 'border-red-500' : 'border-slate-300'}`}
                                    />
                                    {errors.tax_id && <p className="text-red-500 text-xs mt-1">{errors.tax_id}</p>}
                                </div>

                                {/* Branch Code */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">รหัสสาขา</label>
                                    <input
                                        type="text"
                                        name="branch_code"
                                        value={formData.branch_code}
                                        onChange={handleChange}
                                        placeholder="เช่น 00000"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>

                                {/* Name TH */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        {isJuristic ? 'ชื่อบริษัท (ภาษาไทย)' : 'ชื่อ-นามสกุล (ภาษาไทย)'} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name_th"
                                        value={formData.name_th}
                                        onChange={handleChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${errors.name_th ? 'border-red-500' : 'border-slate-300'}`}
                                    />
                                    {errors.name_th && <p className="text-red-500 text-xs mt-1">{errors.name_th}</p>}
                                </div>

                                {/* Name EN */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        {isJuristic ? 'Company Name (English)' : 'Full Name (English)'}
                                    </label>
                                    <input
                                        type="text"
                                        name="name_en"
                                        value={formData.name_en}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>

                                {/* Nickname / Contact Person */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        {isJuristic ? 'ผู้ติดต่อประสานงาน (Contact Person)' : 'ชื่อเล่น'}
                                    </label>
                                    <input
                                        type="text"
                                        name="nick_name"
                                        value={formData.nick_name}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        placeholder={isJuristic ? 'ระบุชื่อผู้ติดต่อ' : ''}
                                    />
                                </div>

                                {/* Role */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">บทบาท/ตำแหน่ง</label>
                                    <input
                                        type="text"
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        placeholder="เช่น Trainer, TA, MC"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: ข้อมูลการติดต่อ & ที่อยู่ */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                                <MapPin className="text-orange-500" size={20} />
                                <h2 className="font-semibold text-slate-800">ข้อมูลการติดต่อ (Address & Contact)</h2>
                            </div>

                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                {/* Phone & Email */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${errors.phone ? 'border-red-500' : 'border-slate-300'}`}
                                        />
                                    </div>
                                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">อีเมล</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Address Registration */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        {isJuristic ? 'ที่อยู่บริษัท (ตาม ภ.พ.20 / หนังสือรับรอง)' : 'ที่อยู่ตามบัตรประชาชน'}
                                    </label>
                                    <textarea
                                        rows={3}
                                        name="address_registration"
                                        value={formData.address_registration}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                                    />
                                </div>

                                {/* Same Address Checkbox */}
                                <div className="md:col-span-2 flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="same_address"
                                        name="same_address"
                                        checked={formData.same_address}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor="same_address" className="text-sm text-slate-600">ที่อยู่สำหรับจัดส่งเอกสาร/วางบิล ใช้ที่อยู่เดียวกับข้างต้น</label>
                                </div>

                                {/* Shipping Address (Conditional) */}
                                {!formData.same_address && (
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">ที่อยู่จัดส่งเอกสาร</label>
                                        <textarea
                                            rows={3}
                                            name="address_shipping"
                                            value={formData.address_shipping}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Financial & Documents */}
                    <div className="space-y-6">

                        {/* Section 3: ข้อมูลทางการเงิน */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                                <CreditCard className="text-green-600" size={20} />
                                <h2 className="font-semibold text-slate-800">ข้อมูลการเงิน</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <Dropdown
                                    label="ธนาคาร"
                                    value={formData.bank_name}
                                    onChange={(val) => setFormData(prev => ({ ...prev, bank_name: val }))}
                                    options={bankOptions}
                                    placeholder="เลือกธนาคาร"
                                    width="full"
                                />
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">เลขที่บัญชี</label>
                                    <input
                                        type="text"
                                        name="bank_account_number"
                                        value={formData.bank_account_number}
                                        onChange={handleChange}
                                        placeholder="XXX-X-XXXXX-X"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อบัญชี</label>
                                    <input
                                        type="text"
                                        name="bank_account_name"
                                        value={formData.bank_account_name}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 4: เอกสารแนบ */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                                <FileText className="text-purple-500" size={20} />
                                <h2 className="font-semibold text-slate-800">เอกสารแนบ</h2>
                            </div>

                            <div className="p-6 space-y-4">
                                {/* Note for Add mode */}
                                {!isEditing && (
                                    <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                        💡 ไฟล์ที่เลือกจะถูกอัปโหลดหลังจากบันทึกข้อมูลเรียบร้อยแล้ว
                                    </div>
                                )}
                                <UploadSlot
                                    title={isJuristic ? "หนังสือรับรองบริษัท" : "สำเนาบัตรประชาชน"}
                                    type="identity_doc"
                                    file={documents.identity_doc}
                                    icon={isJuristic ? <Building2 size={18} className="text-blue-500" /> : <User size={18} className="text-blue-500" />}
                                />

                                {isJuristic && (
                                    <UploadSlot
                                        title="ใบทะเบียนภาษีมูลค่าเพิ่ม (ภ.พ.20)"
                                        type="vat_cert"
                                        file={documents.vat_cert}
                                        icon={<FileText size={18} className="text-orange-500" />}
                                    />
                                )}

                                <UploadSlot
                                    title="หน้าสมุดบัญชีธนาคาร (Bookbank)"
                                    type="book_bank"
                                    file={documents.book_bank}
                                    icon={<CreditCard size={18} className="text-green-500" />}
                                />

                                {/* Others */}
                                <div className="pt-4 border-t border-slate-100">
                                    <div className="flex justify-between items-center mb-3">
                                        <p className="text-sm font-semibold text-slate-700">เอกสารอื่นๆ เพิ่มเติม</p>
                                        <label className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium cursor-pointer">
                                            <Plus size={14} /> เพิ่มไฟล์
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={(e) => handleFileUpload(e, 'others')}
                                            />
                                        </label>
                                    </div>

                                    {documents.others.length === 0 ? (
                                        <div className="text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                            <p className="text-xs text-slate-400">ไม่มีเอกสารเพิ่มเติม</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {documents.others.map((doc, idx) => (
                                                <div key={idx} className="bg-white border border-slate-200 p-2 rounded-md flex justify-between items-center text-sm">
                                                    <div className="flex items-center gap-2 truncate">
                                                        <File size={14} className="text-slate-400" />
                                                        <span className="truncate max-w-[150px]">{doc.name}</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeDocument('others', idx)}
                                                        className="text-slate-400 hover:text-red-500"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-white rounded-b-xl">
                    <button
                        type="button"
                        onClick={() => onClose(false)}
                        className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                    >
                        <Save size={18} />
                        {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ContactModal;
