import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, User, Building2, FileText, Phone, CreditCard, Filter } from 'lucide-react';
import api from '../../services/api';
import ContactModal from './ContactModal';

const ContactsTab = () => {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [entityFilter, setEntityFilter] = useState('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingContact, setEditingContact] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Fetch contacts
    const fetchContacts = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (entityFilter !== 'all') params.append('entityType', entityFilter);

            const response = await api.get(`/contacts?${params.toString()}`);
            setContacts(response.data);
        } catch (error) {
            console.error('Error fetching contacts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, [search, entityFilter]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchContacts();
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    // Open modal for add
    const handleAdd = () => {
        setEditingContact(null);
        setModalOpen(true);
    };

    // Open modal for edit
    const handleEdit = (contact) => {
        setEditingContact(contact);
        setModalOpen(true);
    };

    // Delete contact
    const handleDelete = async (id) => {
        try {
            await api.delete(`/contacts/${id}`);
            setDeleteConfirm(null);
            fetchContacts();
        } catch (error) {
            console.error('Error deleting contact:', error);
        }
    };

    // Close modal and refresh
    const handleModalClose = (shouldRefresh = false) => {
        setModalOpen(false);
        setEditingContact(null);
        if (shouldRefresh) {
            fetchContacts();
        }
    };

    return (
        <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="ค้นหาด้วย ชื่อ, Tax ID, เบอร์โทร..."
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>

                    {/* Entity Type Filter */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <select
                            value={entityFilter}
                            onChange={(e) => setEntityFilter(e.target.value)}
                            className="pl-9 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white cursor-pointer"
                        >
                            <option value="all">ทั้งหมด</option>
                            <option value="individual">บุคคลธรรมดา</option>
                            <option value="juristic">นิติบุคคล</option>
                        </select>
                    </div>
                </div>

                {/* Count & Add Button */}
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">
                        {contacts.length} รายการ
                    </span>
                    <button
                        onClick={handleAdd}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                    >
                        <Plus size={18} />
                        เพิ่มคู่ค้า
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="py-12 text-center text-gray-500">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                        กำลังโหลด...
                    </div>
                ) : contacts.length === 0 ? (
                    <div className="py-12 text-center text-gray-500">
                        <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>ไม่พบข้อมูลคู่ค้า</p>
                        <button
                            onClick={handleAdd}
                            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                        >
                            + เพิ่มคู่ค้าใหม่
                        </button>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ชื่อ</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ประเภท</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tax ID</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">โทรศัพท์</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">บัญชีธนาคาร</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">เอกสาร</th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contacts.map((contact, index) => (
                                <tr
                                    key={contact.id}
                                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                                >
                                    {/* Name */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${contact.entity_type === 'juristic'
                                                    ? 'bg-purple-100 text-purple-600'
                                                    : 'bg-blue-100 text-blue-600'
                                                }`}>
                                                {contact.entity_type === 'juristic' ? <Building2 size={18} /> : <User size={18} />}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">{contact.name_th}</p>
                                                {contact.nick_name && (
                                                    <p className="text-xs text-gray-400">{contact.nick_name}</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Type */}
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${contact.entity_type === 'juristic'
                                                ? 'bg-purple-100 text-purple-700'
                                                : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {contact.entity_type === 'juristic' ? 'นิติบุคคล' : 'บุคคล'}
                                        </span>
                                    </td>

                                    {/* Tax ID */}
                                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                                        {contact.tax_id || '-'}
                                    </td>

                                    {/* Phone */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                            <Phone size={14} className="text-gray-400" />
                                            {contact.phone}
                                        </div>
                                    </td>

                                    {/* Bank */}
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {contact.bank_name ? (
                                            <div className="flex items-center gap-1.5">
                                                <CreditCard size={14} className="text-gray-400" />
                                                <span>{contact.bank_name}</span>
                                                {contact.bank_account_number && (
                                                    <span className="text-gray-400 font-mono text-xs">
                                                        ({contact.bank_account_number.slice(-4)})
                                                    </span>
                                                )}
                                            </div>
                                        ) : '-'}
                                    </td>

                                    {/* Documents */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1.5 text-sm">
                                            <FileText size={14} className="text-gray-400" />
                                            <span className="text-gray-600">{contact.document_count || 0} ไฟล์</span>
                                        </div>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => handleEdit(contact)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="แก้ไข"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(contact.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="ลบ"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">ยืนยันการลบ</h3>
                        <p className="text-gray-600 text-sm mb-6">คุณต้องการลบข้อมูลคู่ค้านี้ใช่หรือไม่?</p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                ลบ
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Contact Modal */}
            <ContactModal
                isOpen={modalOpen}
                onClose={handleModalClose}
                contact={editingContact}
            />
        </div>
    );
};

export default ContactsTab;
