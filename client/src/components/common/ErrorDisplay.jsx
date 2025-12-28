import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorDisplay = ({
    title = 'เกิดข้อผิดพลาด',
    message = 'ไม่สามารถดำเนินการได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง',
    onRetry,
    className = ''
}) => {
    return (
        <div className={`bg-red-50 border border-red-200 rounded-xl p-6 text-center ${className}`}>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">{message}</p>

            {onRetry && (
                <button
                    onClick={onRetry}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
                >
                    <RefreshCw className="w-4 h-4" />
                    ลองใหม่
                </button>
            )}
        </div>
    );
};

export default ErrorDisplay;
