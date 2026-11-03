import React, { useEffect } from 'react';
import { Alert, X } from './Icons';
import './Toast.css';

interface ToastProps {
    message: string | null;
    onClose: () => void;
}

// A dismissible error message at the bottom of the screen; hides itself after a while.
const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
    useEffect(() => {
        if (!message) return;
        const timer = window.setTimeout(onClose, 7000);
        return () => window.clearTimeout(timer);
    }, [message, onClose]);

    if (!message) return null;
    return (
        <div className="toast" role="alert">
            <Alert className="toast-icon" />
            <span>{message}</span>
            <button type="button" className="toast-close" onClick={onClose} aria-label="Dismiss"><X /></button>
        </div>
    );
};

export default Toast;
