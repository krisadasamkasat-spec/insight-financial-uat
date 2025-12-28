import React from 'react';
import { Download, FileText } from 'lucide-react';
import Modal from './Modal';


const ViewAttachmentsModal = ({ isOpen, onClose, attachments = [], title = "เอกสารแนบ" }) => {
    // Get file icon based on file type
    const getFileIcon = (fileName) => {
        const ext = fileName?.split('.').pop()?.toLowerCase();

        const iconMap = {
            pdf: { bg: 'bg-red-100', color: 'text-red-600', icon: '📄' },
            doc: { bg: 'bg-blue-100', color: 'text-blue-600', icon: '📝' },
            docx: { bg: 'bg-blue-100', color: 'text-blue-600', icon: '📝' },
            xls: { bg: 'bg-green-100', color: 'text-green-600', icon: '📊' },
            xlsx: { bg: 'bg-green-100', color: 'text-green-600', icon: '📊' },
            jpg: { bg: 'bg-purple-100', color: 'text-purple-600', icon: '🖼️' },
            jpeg: { bg: 'bg-purple-100', color: 'text-purple-600', icon: '🖼️' },
            png: { bg: 'bg-purple-100', color: 'text-purple-600', icon: '🖼️' },
            gif: { bg: 'bg-purple-100', color: 'text-purple-600', icon: '🖼️' }
        };

        return iconMap[ext] || { bg: 'bg-gray-100', color: 'text-gray-600', icon: '📁' };
    };

    // Get file size display
    const formatFileSize = (bytes) => {
        if (!bytes) return '-';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    // Get file type display
    const getFileType = (fileName) => {
        const ext = fileName?.split('.').pop()?.toUpperCase();
        const typeMap = {
            PDF: 'PDF Document',
            DOC: 'Word Document',
            DOCX: 'Word Document',
            XLS: 'Excel Spreadsheet',
            XLSX: 'Excel Spreadsheet',
            JPG: 'Image',
            JPEG: 'Image',
            PNG: 'Image',
            GIF: 'Image'
        };
        return typeMap[ext] || 'File';
    };

    const handleDownload = (attachment) => {
        // In a real app, this would trigger a download
        // For now, just show an alert
        alert(`จะดาวน์โหลดไฟล์: ${attachment.name || attachment}`);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
            <div className="space-y-4">
                {attachments.length > 0 ? (
                    <>
                        {/* File Count */}
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                            <span className="text-sm text-gray-500">
                                ทั้งหมด <span className="font-semibold text-gray-900">{attachments.length}</span> ไฟล์
                            </span>
                        </div>

                        {/* File List */}
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                            {attachments.map((attachment, index) => {
                                const fileName = typeof attachment === 'string' ? attachment : attachment.name;
                                const fileSize = typeof attachment === 'object' ? attachment.size : null;
                                const { bg, icon } = getFileIcon(fileName);

                                return (
                                    <div
                                        key={index}
                                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                                    >
                                        {/* Icon */}
                                        <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center`}>
                                            <span className="text-lg">{icon}</span>
                                        </div>

                                        {/* File Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {fileName}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {getFileType(fileName)}
                                                {fileSize && ` • ${formatFileSize(fileSize)}`}
                                            </p>
                                        </div>

                                        {/* Download Button */}
                                        <button
                                            onClick={() => handleDownload(attachment)}
                                            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="ดาวน์โหลด"
                                        >
                                            <Download className="w-[18px] h-[18px]" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">ไม่มีเอกสารแนบ</h3>
                        <p className="text-gray-500 text-sm">ยังไม่มีไฟล์แนบสำหรับรายการนี้</p>
                    </div>
                )}

                {/* Close Button */}
                <div className="flex justify-end pt-4 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        ปิด
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ViewAttachmentsModal;
