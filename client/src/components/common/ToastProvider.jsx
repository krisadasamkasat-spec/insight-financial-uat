import React, { useState, useCallback } from 'react';
import { CheckCircle, X, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { ToastContext } from '../../contexts/ToastContext';

// Re-export useToast for backward compatibility
// eslint-disable-next-line react-refresh/only-export-components
export { useToast } from '../../contexts/ToastContext';

const Toast = ({ toast, onDismiss }) => {
    const icons = {
        success: <CheckCircle className="w-5 h-5 text-green-500" />,
        error: <AlertCircle className="w-5 h-5 text-red-500" />,
        warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />
    };

    const backgrounds = {
        success: 'bg-green-50 border-green-200',
        error: 'bg-red-50 border-red-200',
        warning: 'bg-yellow-50 border-yellow-200',
        info: 'bg-blue-50 border-blue-200'
    };

    return (
        <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${backgrounds[toast.type]} animate-slide-in`}
            role="alert"
        >
            {icons[toast.type]}
            <p className="flex-1 text-sm text-gray-800">{toast.message}</p>
            <button
                onClick={() => onDismiss(toast.id)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);

        if (duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        }

        return id;
    }, []);

    const dismissToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const toast = {
        success: (message, duration) => addToast(message, 'success', duration),
        error: (message, duration) => addToast(message, 'error', duration),
        warning: (message, duration) => addToast(message, 'warning', duration),
        info: (message, duration) => addToast(message, 'info', duration),
        dismiss: dismissToast
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
                {toasts.map(t => (
                    <Toast key={t.id} toast={t} onDismiss={dismissToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export default ToastProvider;
