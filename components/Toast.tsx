import React, { useEffect } from 'react';
import { ToastMessage, ToastType } from '../contexts/NotificationContext';
import { CheckCircle, AlertCircle, Info, XCircle, X } from 'lucide-react';

interface ToastProps {
  toast: ToastMessage;
  onRemove: (id: number) => void;
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="h-6 w-6 text-green-400" />,
  error: <XCircle className="h-6 w-6 text-red-400" />,
  info: <Info className="h-6 w-6 text-blue-400" />,
  warning: <AlertCircle className="h-6 w-6 text-yellow-400" />,
};

const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 5000); // Auto-dismiss after 5 seconds

    return () => {
      clearTimeout(timer);
    };
  }, [toast.id, onRemove]);

  return (
    <div className="max-w-sm w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 dark:ring-white/10 overflow-hidden animate-fade-in-up">
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">{icons[toast.type]}</div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{toast.message}</p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              type="button"
              onClick={() => onRemove(toast.id)}
              className="bg-white dark:bg-gray-800 rounded-md inline-flex text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-offset-gray-800"
            >
              <span className="sr-only">Close</span>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toast;
