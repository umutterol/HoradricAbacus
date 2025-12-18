import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { TranslateFunction } from '../hooks/useLanguage';

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  t: TranslateFunction;
}

export function ConfirmDialog({ isOpen, onConfirm, onCancel, t }: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    confirmButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll(
          'button:not([disabled])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="dialog-overlay"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
    >
      <div
        ref={dialogRef}
        className="dialog-box"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-icon">
          <AlertTriangle size={28} strokeWidth={1.5} />
        </div>
        <h2 id="dialog-title" className="dialog-title">
          {t('dlg_reset_title')}
        </h2>
        <p id="dialog-description" className="dialog-message">
          {t('dlg_reset_message')}
        </p>
        <div className="dialog-actions">
          <button
            ref={confirmButtonRef}
            className="dialog-btn dialog-btn--danger"
            onClick={onConfirm}
          >
            {t('dlg_confirm')}
          </button>
          <button
            className="dialog-btn dialog-btn--cancel"
            onClick={onCancel}
          >
            {t('dlg_cancel')}
          </button>
        </div>
      </div>

      <style>{`
        .dialog-overlay {
          position: fixed;
          inset: 0;
          background: rgba(8, 7, 10, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: dialogFadeIn 0.2s ease-out;
          padding: 1rem;
          backdrop-filter: blur(4px);
        }

        @keyframes dialogFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes dialogSlideIn {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(-8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .dialog-box {
          position: relative;
          background: linear-gradient(180deg, var(--color-bg-elevated) 0%, var(--color-bg-secondary) 100%);
          border: 1px solid var(--color-border);
          padding: 1.5rem;
          max-width: 360px;
          width: 100%;
          text-align: center;
          animation: dialogSlideIn 0.25s ease-out;
          box-shadow: var(--shadow-lg), 0 0 40px rgba(0, 0, 0, 0.5);
        }

        .dialog-box::before {
          content: '';
          position: absolute;
          inset: 0;
          background: url('/texture-demonic.png') center/300px repeat;
          opacity: 0.03;
          pointer-events: none;
        }

        .dialog-box::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--color-bronze), transparent);
        }

        .dialog-icon {
          display: flex;
          justify-content: center;
          margin-bottom: 1rem;
          color: var(--color-gold);
          position: relative;
        }

        .dialog-title {
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 0.75rem;
          position: relative;
        }

        .dialog-message {
          color: var(--color-text-secondary);
          margin: 0 0 1.5rem;
          font-size: 0.875rem;
          line-height: 1.6;
          position: relative;
        }

        .dialog-actions {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
          position: relative;
        }

        .dialog-btn {
          padding: 0.5rem 1rem;
          font-family: var(--font-display);
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border: 1px solid;
          cursor: pointer;
          transition: all 0.15s;
          min-width: 100px;
        }

        .dialog-btn--danger {
          background: linear-gradient(180deg, var(--color-blood-light) 0%, var(--color-blood) 100%);
          border-color: var(--color-blood-light);
          color: var(--color-text-primary);
        }

        .dialog-btn--danger:hover {
          background: linear-gradient(180deg, #9b2c2c 0%, var(--color-blood-light) 100%);
        }

        .dialog-btn--cancel {
          background: var(--color-bg-void);
          border-color: var(--color-border);
          color: var(--color-text-secondary);
        }

        .dialog-btn--cancel:hover {
          border-color: var(--color-bronze);
          color: var(--color-text-primary);
        }

        @media (max-width: 400px) {
          .dialog-actions {
            flex-direction: column;
          }

          .dialog-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
