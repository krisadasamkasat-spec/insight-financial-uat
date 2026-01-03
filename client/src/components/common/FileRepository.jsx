import React from 'react';
import { X, FileText, Image, Eye } from 'lucide-react';

/**
 * FileRepository Modal Component
 * Displays a grid of attached files (images, PDFs, documents)
 */
const FileRepository = ({ isOpen, onClose, documents = [] }) => {
    if (!isOpen) return null;

    // Construct the full URL for a file
    const getFileUrl = (file) => {
        if (file.url) return file.url;
        if (file.file_path) {
            // If file_path is relative, prepend the API base
            if (file.file_path.startsWith('http')) return file.file_path;
            return `http://localhost:3000${file.file_path.startsWith('/') ? '' : '/'}${file.file_path}`;
        }
        return null;
    };

    // Get file name with fallback
    const getFileName = (file) => {
        return file.file_name || file.name || 'Unknown file';
    };

    // Get file type icon based on file extension or type
    const getFileIcon = (file) => {
        const fileName = getFileName(file);
        const ext = file.type?.toLowerCase() || fileName?.split('.').pop()?.toLowerCase() || '';

        // PDF
        if (ext === 'pdf' || ext.includes('pdf')) {
            return (
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-red-500" />
                </div>
            );
        }

        // Word Document
        if (ext === 'doc' || ext === 'docx' || ext.includes('word')) {
            return (
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-500" />
                </div>
            );
        }

        // Excel
        if (ext === 'xls' || ext === 'xlsx' || ext.includes('excel')) {
            return (
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-green-500" />
                </div>
            );
        }

        // Image types - no icon needed, will show preview
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'image'].some(t => ext.includes(t))) {
            return null;
        }

        // Default document icon
        return (
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-gray-500" />
            </div>
        );
    };

    // Check if file is an image
    const isImage = (file) => {
        const fileName = getFileName(file);
        const ext = file.type?.toLowerCase() || fileName?.split('.').pop()?.toLowerCase() || '';
        return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'image'].some(t => ext.includes(t));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/30"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900">รายการเอกสารแนบ</h3>
                            <p className="text-xs text-gray-500">{documents.length} รายการ</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-blue-500 hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 rounded-full"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Documents Grid */}
                <div className="overflow-y-auto max-h-[calc(85vh-80px)] p-5">
                    {documents.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500 text-sm">ไม่มีเอกสารแนบ</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {documents.map((doc, index) => {
                                const fileName = getFileName(doc);
                                const fileUrl = getFileUrl(doc);

                                return (
                                    <a
                                        key={index}
                                        href={fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group relative bg-gray-50 rounded-xl overflow-hidden border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer aspect-square"
                                        title={fileName}
                                    >
                                        {/* File Preview */}
                                        {isImage(doc) && fileUrl ? (
                                            <img
                                                src={fileUrl}
                                                alt={fileName}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-2">
                                                {getFileIcon(doc)}
                                                <span className="text-[10px] text-gray-500 mt-2 text-center line-clamp-2 px-1">
                                                    {fileName}
                                                </span>
                                            </div>
                                        )}

                                        {/* File Type Badge */}
                                        <div className="absolute bottom-2 right-2">
                                            {isImage(doc) ? (
                                                <div className="w-6 h-6 bg-pink-100 rounded flex items-center justify-center">
                                                    <Image className="w-3 h-3 text-pink-500" />
                                                </div>
                                            ) : (
                                                getFileIcon(doc)
                                            )}
                                        </div>

                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <div className="bg-white rounded-full p-2 shadow-lg">
                                                <Eye className="w-4 h-4 text-blue-500" />
                                            </div>
                                        </div>
                                    </a>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FileRepository;
