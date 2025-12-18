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
      <CheckCircle size={18} strokeWidth={1.5} className="toast-icon" />
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
          padding: 0.625rem 1rem;
          background: linear-gradient(180deg, rgba(20, 83, 45, 0.95) 0%, rgba(22, 101, 52, 0.95) 100%);
          border: 1px solid rgba(34, 197, 94, 0.4);
          color: var(--color-text-primary);
          font-size: 0.8125rem;
          font-weight: 500;
          box-shadow: var(--shadow-lg), 0 0 20px rgba(22, 101, 52, 0.3);
          z-index: 1001;
          animation: toastEnter 0.3s ease-out;
        }

        .toast--exiting {
          animation: toastExit 0.3s ease-in forwards;
        }

        @keyframes toastEnter {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        @keyframes toastExit {
          from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
          to {
            opacity: 0;
            transform: translateX(-50%) translateY(16px);
          }
        }

        .toast-icon {
          flex-shrink: 0;
          color: rgba(74, 222, 128, 0.9);
        }

        .toast-message {
          white-space: nowrap;
        }

        @media (max-width: 480px) {
          .toast {
            bottom: 1rem;
            left: 1rem;
            right: 1rem;
            transform: none;
            justify-content: center;
          }

          @keyframes toastEnter {
            from {
              opacity: 0;
              transform: translateY(16px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes toastExit {
            from {
              opacity: 1;
              transform: translateY(0);
            }
            to {
              opacity: 0;
              transform: translateY(16px);
            }
          }
        }
      `}</style>
    </div>
  );
}
