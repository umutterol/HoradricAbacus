import { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onHide: () => void;
  duration?: number;
}

export function Toast({ message, isVisible, onHide, duration = 3000 }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setIsExiting(false);
      return;
    }

    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, duration - 300);

    const hideTimer = setTimeout(() => {
      onHide();
    }, duration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(hideTimer);
    };
  }, [isVisible, duration, onHide]);

  if (!isVisible) return null;

  return (
    <div
      className={`toast ${isExiting ? 'toast--exiting' : ''}`}
      role="status"
      aria-live="polite"
    >
      <CheckCircle size={20} className="toast-icon" />
      <span className="toast-message">{message}</span>

      <style>{`
        .toast {
          position: fixed;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background: linear-gradient(135deg, rgba(22, 163, 74, 0.95) 0%, rgba(21, 128, 61, 0.95) 100%);
          border: 1px solid rgba(74, 222, 128, 0.5);
          color: white;
          font-weight: 500;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 20px rgba(22, 163, 74, 0.3);
          z-index: 1001;
          animation: toastSlideIn 0.3s ease-out;
        }

        .toast--exiting {
          animation: toastSlideOut 0.3s ease-in forwards;
        }

        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        @keyframes toastSlideOut {
          from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
          to {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
        }

        .toast-icon {
          flex-shrink: 0;
          color: rgba(255, 255, 255, 0.9);
        }

        .toast-message {
          font-size: 0.9375rem;
        }

        @media (max-width: 480px) {
          .toast {
            bottom: 1rem;
            left: 1rem;
            right: 1rem;
            transform: none;
            justify-content: center;
          }

          @keyframes toastSlideIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes toastSlideOut {
            from {
              opacity: 1;
              transform: translateY(0);
            }
            to {
              opacity: 0;
              transform: translateY(20px);
            }
          }
        }
      `}</style>
    </div>
  );
}
