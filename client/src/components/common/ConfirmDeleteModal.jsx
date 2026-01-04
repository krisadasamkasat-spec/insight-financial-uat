import React from 'react';
import { Trash2 } from 'lucide-react';
import Modal from './Modal';

/**
 * Confirmation modal for deleting items
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onConfirm - Confirm handler
 * @param {string} props.title - Modal title
 * @param {string} props.itemName - Name of item being deleted
 * @param {string} props.itemCode - Code/ID of item being deleted
 * @param {string} props.warningMessage - Additional warning message
 */
const ConfirmDeleteModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'ยืนยันการลบ',
    itemName = '',
    itemCode = '',
    warningMessage = ''
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
            <div className="space-y-4">
                {/* Warning Icon */}
                <div className="flex justify-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                        <Trash2 className="w-8 h-8 text-red-500" />
                    </div>
                </div>

                {/* Message */}
                <div className="text-center">
                    <p className="text-gray-700 mb-2">คุณต้องการลบรายการนี้หรือไม่?</p>
                    {itemName && (
                        <p className="font-semibold text-gray-900">{itemName}</p>
                    )}
                    {itemCode && (
                        <p className="text-sm text-gray-500 font-mono">{itemCode}</p>
                    )}
                </div>

                {/* Warning */}
                {warningMessage && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 text-center">
                        ⚠️ การดำเนินการนี้ไม่สามารถย้อนกลับได้
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-center gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors min-w-[100px]"
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="px-4 py-2.5 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors min-w-[100px] flex items-center justify-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        ลบ
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmDeleteModal;
