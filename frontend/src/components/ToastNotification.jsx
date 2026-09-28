import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export const ToastNotification = ({ toast, onClose }) => {
  if (!toast) return null;

  const { type = 'info', title, message } = toast;

  const icons = {
    success: <CheckCircle2 size={20} className="toast-icon-svg text-success" />,
    warning: <AlertTriangle size={20} className="toast-icon-svg text-warning" />,
    error: <XCircle size={20} className="toast-icon-svg text-error" />,
    info: <Info size={20} className="toast-icon-svg text-info" />,
  };

  return (
    <div className={`toast-card toast-${type}`} role="alert">
      <div className="toast-header-row">
        <div className="toast-title-group">
          {icons[type] || icons.info}
          {title && <span className="toast-title">{title}</span>}
        </div>
        <button
          type="button"
          className="toast-close"
          onClick={onClose}
          aria-label="Close notification"
        >
          <X size={16} />
        </button>
      </div>
      <p className="toast-body">{message}</p>
    </div>
  );
};

export default ToastNotification;
