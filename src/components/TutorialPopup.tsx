import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { DiabloButton } from './DiabloButton';
import type { TranslateFunction } from '../hooks/useLanguage';

interface TutorialPopupProps {
  isOpen: boolean;
  onClose: () => void;
  t: TranslateFunction;
}

export function TutorialPopup({ isOpen, onClose, t }: TutorialPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="tutorial-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
    >
      <div
        ref={popupRef}
        className="tutorial-popup"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          className="tutorial-close"
          onClick={onClose}
          aria-label="Close tutorial"
        >
          <X size={20} />
        </button>

        <div className="tutorial-content">
          <div className="tutorial-welcome">
            <img src="/logo.png" alt="Horadric Abacus" className="tutorial-logo" />
            <p className="welcome-text">{t('tut_welcome')}</p>
          </div>

          <h3 className="tutorial-title" id="tutorial-title">{t('tut_how_to')}</h3>
          <ol className="tutorial-steps">
            <li>{t('tut_step1')}</li>
            <li>{t('tut_step2')}</li>
            <li>{t('tut_step3')}</li>
            <li>{t('tut_step4')}</li>
          </ol>

          <div className="tutorial-actions">
            <DiabloButton variant="primary" size="md" onClick={onClose}>
              {t('dlg_got_it')}
            </DiabloButton>
          </div>
        </div>
      </div>

      <style>{`
        .tutorial-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
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

        .tutorial-popup {
          position: relative;
          background: var(--color-bg-secondary);
          border: 2px solid var(--color-border);
          max-width: 480px;
          width: 100%;
          animation: slideIn 0.2s ease-out;
          overflow: hidden;
        }

        .tutorial-popup::before {
          content: '';
          position: absolute;
          inset: 0;
          background: url('/texture-demonic.png') center/contain no-repeat;
          opacity: 0.05;
          pointer-events: none;
        }

        .tutorial-close {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          background: transparent;
          border: 1px solid var(--color-border);
          color: var(--color-text-secondary);
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          z-index: 1;
        }

        .tutorial-close:hover {
          border-color: var(--color-red);
          color: var(--color-red);
        }

        .tutorial-content {
          position: relative;
          padding: 1.5rem;
        }

        .tutorial-welcome {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--color-border);
        }

        .tutorial-logo {
          height: 80px;
          width: auto;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8)) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.6));
        }

        .welcome-text {
          color: var(--color-text-secondary);
          text-align: center;
          margin: 0;
          font-size: 0.9375rem;
          line-height: 1.5;
        }

        .tutorial-title {
          color: var(--color-gold);
          font-family: var(--font-heading);
          font-size: 1.125rem;
          margin: 0 0 1rem;
        }

        .tutorial-steps {
          margin: 0 0 1.5rem;
          padding-left: 1.25rem;
          list-style-type: decimal;
          color: var(--color-text-secondary);
          font-size: 0.9375rem;
          line-height: 1.6;
        }

        .tutorial-steps li {
          margin-bottom: 0.5rem;
        }

        .tutorial-actions {
          display: flex;
          justify-content: center;
        }

        @media (max-width: 480px) {
          .tutorial-popup {
            margin: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
}
