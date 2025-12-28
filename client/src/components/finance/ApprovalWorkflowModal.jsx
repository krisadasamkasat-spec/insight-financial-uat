import React, { useState } from 'react';
import Modal from '../common/Modal';
import FormDropdown from '../common/FormDropdown';

const approvalOptions = [
    { value: 'pending', label: 'รออนุมัติ' },
    { value: 'approved', label: 'อนุมัติแล้ว' },
    { value: 'rejected', label: 'ปฏิเสธ' }
];

const ApprovalWorkflowModal = ({ isOpen, onClose, onSubmit, expense }) => {
    const [status, setStatus] = useState('pending');
    const [notes, setNotes] = useState('');

    React.useEffect(() => {
        if (expense) {
            setStatus(expense.approvalStatus || 'pending');
            setNotes(expense.approvalNotes || '');
        }
    }, [expense]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            ...expense,
            approvalStatus: status,
            approvalNotes: notes,
            approvedBy: status === 'approved' ? 'Admin' : null,
            approvalDate: status !== 'pending' ? new Date().toISOString().split('T')[0] : null
        });
        onClose();
    };

    if (!expense) return null;

    const getStatusColor = (s) => {
        switch (s) {
            case 'approved': return 'bg-green-100 text-green-700';
            case 'rejected': return 'bg-red-100 text-red-700';
            default: return 'bg-yellow-100 text-yellow-700';
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="อนุมัติค่าใช้จ่าย">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="font-medium text-gray-900">{expense.title}</p>
                            <p className="text-sm text-gray-500">{expense.recipient}</p>
                        </div>
                        <span className="text-lg font-bold text-gray-900">฿{(expense.netAmount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs font-mono rounded">{expense.expenseCode}</span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(expense.approvalStatus || 'pending')}`}>
                            {expense.approvalStatus === 'approved' ? 'อนุมัติแล้ว' : expense.approvalStatus === 'rejected' ? 'ปฏิเสธ' : 'รออนุมัติ'}
                        </span>
                    </div>
                </div>

                <FormDropdown
                    label="สถานะการอนุมัติ"
                    value={status}
                    options={approvalOptions}
                    onChange={setStatus}
                />

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        rows={3}
                        placeholder="เหตุผลในการอนุมัติหรือปฏิเสธ..."
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="submit"
                        className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${status === 'approved' ? 'bg-green-600 hover:bg-green-700' :
                            status === 'rejected' ? 'bg-red-600 hover:bg-red-700' :
                                'bg-blue-600 hover:bg-blue-700'
                            }`}
                    >
                        {status === 'approved' ? 'อนุมัติ' : status === 'rejected' ? 'ปฏิเสธ' : 'บันทึก'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ApprovalWorkflowModal;
