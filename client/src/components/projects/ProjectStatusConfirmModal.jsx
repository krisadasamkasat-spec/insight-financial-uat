import React from 'react';
import { AlertCircle, ArrowRight, FolderKanban, X } from 'lucide-react';

const ProjectStatusConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    projectName,
    currentStatus,
    newStatus
}) => {
    if (!isOpen) return null;

    // Determine color theme based on new status
    const getStatusTheme = (status) => {
        switch (status) {
            case 'Active':
                return {
                    bg: 'bg-blue-50',
                    border: 'border-blue-100',
                    icon: 'bg-blue-100 text-blue-600',
                    btn: 'from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-blue-500/30',
                    text: 'text-blue-600'
                };
            case 'Completed':
                return {
                    bg: 'bg-green-50',
                    border: 'border-green-100',
                    icon: 'bg-green-100 text-green-600',
                    btn: 'from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-green-500/30',
                    text: 'text-green-600'
                };
            case 'Cancelled':
                return {
                    bg: 'bg-red-50',
                    border: 'border-red-100',
                    icon: 'bg-red-100 text-red-600',
                    btn: 'from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-red-500/30',
                    text: 'text-red-600'
                };
            default:
                return {
                    bg: 'bg-gray-50',
                    border: 'border-gray-100',
                    icon: 'bg-gray-100 text-gray-500',
                    btn: 'from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 shadow-gray-500/30',
                    text: 'text-gray-600'
                };
        }
    };

    const theme = getStatusTheme(newStatus);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                {/* Header */}
                <div className={`p-6 border-b ${theme.bg} ${theme.border}`}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${theme.icon}`}>
                                <FolderKanban className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">ยืนยันการเปลี่ยนสถานะ</h3>
                                <p className="text-sm text-gray-500 truncate max-w-[200px]" title={projectName}>
                                    โปรเจค: {projectName}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Status Change Arrow */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="text-center flex-1">
                            <span className="text-xs text-gray-400 uppercase font-semibold">สถานะเดิม</span>
                            <div className="mt-1 font-medium text-gray-700">{currentStatus}</div>
                        </div>
                        <ArrowRight className="text-gray-300 w-5 h-5 mx-2" />
                        <div className="text-center flex-1">
                            <span className="text-xs text-gray-400 uppercase font-semibold">สถานะใหม่</span>
                            <div className={`mt-1 font-bold ${theme.text}`}>
                                {newStatus}
                            </div>
                        </div>
                    </div>

                    {/* Warning Message */}
                    <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-700">
                            การเปลี่ยนสถานะโปรเจคอาจส่งผลต่อการแสดงผลในรายงานและหน้าอื่นๆ กรุณาตรวจสอบให้แน่ใจก่อนดำเนินการ
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 pt-2 bg-gray-50/50">
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            ยกเลิก
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`flex-1 px-4 py-3 text-white font-semibold rounded-xl shadow-lg transition-all transform active:scale-95 bg-gradient-to-r ${theme.btn}`}
                        >
                            ยืนยันการเปลี่ยน
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectStatusConfirmModal;
