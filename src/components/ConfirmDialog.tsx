import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { DiabloButton } from './DiabloButton';
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

  // Focus trap and escape key handling
  useEffect(() => {
    if (!isOpen) return;

    // Focus the confirm button when dialog opens
    confirmButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
      // Trap focus within dialog
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
    // Prevent body scroll when dialog is open
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
        className="dialog-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-icon">
          <AlertTriangle size={32} />
        </div>
        <h2 id="dialog-title" className="dialog-title">
          {t('dlg_reset_title')}
        </h2>
        <p id="dialog-description" className="dialog-message">
          {t('dlg_reset_message')}
        </p>
        <div className="dialog-actions">
          <DiabloButton
            ref={confirmButtonRef}
            variant="primary"
            size="md"
            onClick={onConfirm}
          >
            {t('dlg_confirm')}
          </DiabloButton>
          <DiabloButton
            variant="secondary"
            size="md"
            onClick={onCancel}
          >
            {t('dlg_cancel')}
          </DiabloButton>
        </div>
      </div>

      <style>{`
        .dialog-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease-out;
          padding: 1rem;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .dialog-content {
          position: relative;
          background: var(--color-bg-secondary);
          border: 2px solid var(--color-border-accent);
          padding: 1.5rem;
          max-width: 400px;
          width: 100%;
          text-align: center;
          animation: slideIn 0.2s ease-out;
          overflow: hidden;
        }

        .dialog-content::before {
          content: '';
          position: absolute;
          inset: 0;
          background: url('/texture-demonic.png') center/contain no-repeat;
          opacity: 0.06;
          pointer-events: none;
        }

        .dialog-icon {
          display: flex;
          justify-content: center;
          margin-bottom: 1rem;
          color: var(--color-gold);
        }

        .dialog-title {
          font-size: 1.25rem;
          margin: 0 0 0.75rem;
          position: relative;
        }

        .dialog-message {
          color: var(--color-text-secondary);
          margin: 0 0 1.5rem;
          font-size: 0.9375rem;
          line-height: 1.5;
          position: relative;
        }

        .dialog-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
          position: relative;
        }

        @media (max-width: 480px) {
          .dialog-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
