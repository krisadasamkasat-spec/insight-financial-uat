import React, { useState, useEffect } from 'react';
import { Search, Plus, Pencil, Trash2, User, Building2, Upload, File, X, FileText } from 'lucide-react';
import { projectAPI, API_BASE } from '../../services/api';
import Modal from '../common/Modal';
import FormDropdown from '../common/FormDropdown';
import { useToast } from '../../components/common/ToastProvider';

const TeamMembersTab = () => {
    const toast = useToast();
    const [teamMembers, setTeamMembers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [memberDocuments, setMemberDocuments] = useState([]);
    const [uploadingDoc, setUploadingDoc] = useState(false);
    const [pendingFiles, setPendingFiles] = useState([]); // Files waiting to be uploaded on save

    const bankFormOptions = [
        { value: 'กสิกรไทย', label: 'กสิกรไทย' },
        { value: 'กรุงเทพ', label: 'กรุงเทพ' },
        { value: 'ไทยพาณิชย์', label: 'ไทยพาณิชย์' },
        { value: 'กรุงไทย', label: 'กรุงไทย' },
        { value: 'กรุงศรี', label: 'กรุงศรี' },
        { value: 'ทหารไทยธนชาต', label: 'ทหารไทยธนชาต' },
    ];

    const memberTypeOptions = [
        { value: 'full-time', label: 'พนักงานประจำ' },
        { value: 'part-time', label: 'พนักงานชั่วคราว' },
        { value: 'freelance', label: 'ฟรีแลนซ์' },
        { value: 'vendor', label: 'ผู้ขาย/บริษัท' },
    ];

    // Fetch members on mount
    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        setIsLoading(true);
        try {
            const response = await projectAPI.getAllMembers();
            // Map DB snake_case to frontend camelCase
            const mappedMembers = response.data.map(m => ({
                id: m.id,
                name: m.name,
                nickname: m.nickname,
                email: m.email || '',
                phone: m.phone || '',
                bankAccount: m.bank_account || '',
                bankAccountName: m.bank_account_name || '',
                bankName: m.bank_name || 'กสิกรไทย',
                taxId: m.tax_id || '',
                isCompany: m.is_company || false,
                type: m.type || 'full-time',
                isActive: m.is_active !== false
            }));
            setTeamMembers(mappedMembers);
        } catch (error) {
            console.error('Error fetching members:', error);
            toast.error('โหลดข้อมูลสมาชิกไม่สำเร็จ');
        } finally {
            setIsLoading(false);
        }
    };

    // Filter team members by search
    const filteredMembers = teamMembers.filter(member => {
        return (member.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (member.nickname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (member.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    });

    const handleAdd = () => {
        setEditingMember({
            name: '',
            nickname: '',
            email: '',
            phone: '',
            bankAccount: '',
            bankAccountName: '',
            bankName: 'กสิกรไทย',
            taxId: '',
            isCompany: false,
            type: 'full-time',
            isNew: true
        });
        setMemberDocuments([]);
        setIsModalOpen(true);
    };

    const handleEdit = async (member) => {
        setEditingMember({ ...member, isNew: false });
        setMemberDocuments([]);
        setIsModalOpen(true);
        // Fetch existing documents
        try {
            const res = await projectAPI.getMemberDocuments(member.id);
            setMemberDocuments(res.data);
        } catch (err) {
            console.error('Error fetching member documents:', err);
        }
    };

    const handleUploadDocument = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.jpg,.jpeg,.png';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            // Store file in pending state instead of uploading immediately
            setPendingFiles(prev => [...prev, file]);
            toast.success(`เพิ่มไฟล์ "${file.name}" (รอบันทึก)`);
        };
        input.click();
    };

    const handleRemovePendingFile = (index) => {
        setPendingFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleDeleteDocument = async (docId) => {
        try {
            await projectAPI.deleteMemberDocument(docId);
            setMemberDocuments(prev => prev.filter(d => d.id !== docId));
            toast.success('ลบเอกสารสำเร็จ');
        } catch (err) {
            console.error('Delete error:', err);
            toast.error('ลบเอกสารไม่สำเร็จ');
        }
    };

    const handleSave = async () => {
        try {
            // Map frontend camelCase to DB snake_case
            const payload = {
                name: editingMember.name,
                nickname: editingMember.nickname,
                email: editingMember.email,
                phone: editingMember.phone,
                bank_account: editingMember.bankAccount,
                bank_account_name: editingMember.bankAccountName,
                bank_name: editingMember.bankName,
                tax_id: editingMember.taxId,
                is_company: editingMember.isCompany,
                type: editingMember.type || 'full-time'
            };

            let memberId = editingMember.id;

            if (editingMember.isNew) {
                const res = await projectAPI.createMember(payload);
                memberId = res.data.id;
                toast.success('เพิ่มสมาชิกสำเร็จ');
            } else {
                await projectAPI.updateMember(editingMember.id, payload);
                toast.success('อัปเดตข้อมูลสำเร็จ');
            }

            // Upload pending files if any
            if (pendingFiles.length > 0 && memberId) {
                setUploadingDoc(true);
                for (const file of pendingFiles) {
                    try {
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('doc_type', 'document');
                        await projectAPI.uploadMemberDocument(memberId, formData);
                    } catch (err) {
                        console.error('Upload error for file:', file.name, err);
                    }
                }
                setUploadingDoc(false);
            }

            fetchMembers(); // Reload list
            setIsModalOpen(false);
            setEditingMember(null);
            setPendingFiles([]);
        } catch (error) {
            console.error('Error saving member:', error);
            toast.error('บันทึกข้อมูลไม่สำเร็จ');
        }
    };

    const handleDelete = async (id) => {
        try {
            await projectAPI.deleteMember(id);
            toast.success('ลบสมาชิกสำเร็จ');
            fetchMembers(); // Reload list
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Error deleting member:', error);
            toast.error('ลบสมาชิกไม่สำเร็จ');
        }
    };

    return (
        <div className="space-y-4">
            {/* Search and Add */}
            <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อ หรืออีเมล..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                    />
                </div>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    เพิ่มสมาชิก
                </button>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ชื่อ</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-28">ชื่อเล่น</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">อีเมล</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-28">เบอร์โทร</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                                    กำลังโหลดข้อมูล...
                                </td>
                            </tr>
                        ) : filteredMembers.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                                    ไม่พบข้อมูล
                                </td>
                            </tr>
                        ) : (
                            filteredMembers.map((member) => (
                                <tr key={member.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${member.isCompany ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>
                                                {member.isCompany ? (
                                                    <Building2 className="w-4 h-4" />
                                                ) : (
                                                    <User className="w-4 h-4" />
                                                )}
                                            </div>
                                            <span className="text-sm font-medium text-gray-800">{member.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{member.nickname}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{member.email}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{member.phone}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => handleEdit(member)}
                                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="แก้ไข"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(member.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="ลบ"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <p className="text-xs text-gray-500">
                แสดง {filteredMembers.length} จาก {teamMembers.length} คน
            </p>

            {/* Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingMember?.isNew ? 'เพิ่มสมาชิก' : 'แก้ไขข้อมูลสมาชิก'}
            >
                {editingMember && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล</label>
                                <input
                                    type="text"
                                    value={editingMember.name}
                                    onChange={(e) => setEditingMember(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อเล่น</label>
                                <input
                                    type="text"
                                    value={editingMember.nickname}
                                    onChange={(e) => setEditingMember(prev => ({ ...prev, nickname: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
                                <input
                                    type="email"
                                    value={editingMember.email}
                                    onChange={(e) => setEditingMember(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทร</label>
                                <input
                                    type="tel"
                                    value={editingMember.phone}
                                    onChange={(e) => setEditingMember(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <hr className="my-4" />
                        <h4 className="text-sm font-semibold text-gray-700">ข้อมูลการเงิน</h4>

                        <div className="grid grid-cols-2 gap-4">
                            <FormDropdown
                                label="ธนาคาร"
                                value={editingMember.bankName}
                                options={bankFormOptions}
                                onChange={(value) => setEditingMember(prev => ({ ...prev, bankName: value }))}
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">เลขบัญชี</label>
                                <input
                                    type="text"
                                    value={editingMember.bankAccount}
                                    onChange={(e) => setEditingMember(prev => ({ ...prev, bankAccount: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="xxx-x-xxxxx-x"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อบัญชี</label>
                            <input
                                type="text"
                                value={editingMember.bankAccountName}
                                onChange={(e) => setEditingMember(prev => ({ ...prev, bankAccountName: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="ชื่อเจ้าของบัญชี"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">เลขประจำตัวผู้เสียภาษี</label>
                                <input
                                    type="text"
                                    value={editingMember.taxId}
                                    onChange={(e) => setEditingMember(prev => ({ ...prev, taxId: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="1-xxxx-xxxxx-xx-x"
                                />
                            </div>
                            <FormDropdown
                                label="ประเภทบุคคล"
                                value={editingMember.type}
                                options={memberTypeOptions}
                                onChange={(value) => setEditingMember(prev => ({ ...prev, type: value }))}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isCompany"
                                checked={editingMember.isCompany}
                                onChange={(e) => setEditingMember(prev => ({ ...prev, isCompany: e.target.checked }))}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="isCompany" className="text-sm text-gray-700">นิติบุคคล (บริษัท)</label>
                        </div>

                        {/* Documents Section */}
                        <>
                            <hr className="my-4" />
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> เอกสารแนบ
                                    {uploadingDoc && <span className="text-xs text-blue-500 animate-pulse">กำลังอัพโหลด...</span>}
                                </h4>
                                <button
                                    type="button"
                                    onClick={() => handleUploadDocument()}
                                    disabled={uploadingDoc}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg border border-blue-200 disabled:opacity-50 transition-colors"
                                >
                                    <Upload className="w-3.5 h-3.5" /> เพิ่มไฟล์
                                </button>
                            </div>

                            {/* Pending Files (not yet uploaded) */}
                            {pendingFiles.length > 0 && (
                                <div className="space-y-2 mb-2">
                                    {pendingFiles.map((file, index) => (
                                        <div key={index} className="flex items-center justify-between p-2.5 bg-yellow-50 rounded-lg border border-yellow-200">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <File className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                                                <span className="text-sm text-gray-700 truncate">{file.name}</span>
                                                <span className="text-xs text-yellow-600 bg-yellow-100 px-1.5 py-0.5 rounded">รอบันทึก</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemovePendingFile(index)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                                                title="ลบ"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Existing uploaded files (only for existing members) */}
                            {!editingMember.isNew && memberDocuments.length > 0 && (
                                <div className="space-y-2">
                                    {memberDocuments.map(doc => (
                                        <div key={doc.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100 group hover:border-blue-200">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <File className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                <a
                                                    href={`${API_BASE}${doc.file_path}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-blue-600 hover:underline truncate"
                                                    title={doc.file_name}
                                                >
                                                    {doc.file_name}
                                                </a>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteDocument(doc.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="ลบ"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {pendingFiles.length === 0 && memberDocuments.length === 0 && (
                                <p className="text-xs text-gray-400 text-center py-3">ยังไม่มีเอกสาร</p>
                            )}
                        </>
                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                                disabled={!editingMember.name || !editingMember.nickname}
                            >
                                บันทึก
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="ยืนยันการลบ"
            >
                <p className="text-gray-600 mb-6">คุณต้องการลบสมาชิกนี้หรือไม่?</p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={async () => await handleDelete(deleteConfirm)}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                        ลบ
                    </button>
                </div>
            </Modal >
        </div >
    );
};

export default TeamMembersTab;
