import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
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
          <X size={18} strokeWidth={1.5} />
        </button>

        <div className="tutorial-content">
          <div className="tutorial-header">
            <img src="/logo.png" alt="Horadric Abacus" className="tutorial-logo" />
            <p className="tutorial-desc">{t('tut_welcome')}</p>
          </div>

          <div className="tutorial-body">
            <h3 className="tutorial-title" id="tutorial-title">{t('tut_how_to')}</h3>
            <ol className="tutorial-steps">
              <li>{t('tut_step1')}</li>
              <li>{t('tut_step2')}</li>
              <li>{t('tut_step3')}</li>
              <li>{t('tut_step4')}</li>
            </ol>
          </div>

          <div className="tutorial-footer">
            <button className="tutorial-btn" onClick={onClose}>
              {t('dlg_got_it')}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .tutorial-overlay {
          position: fixed;
          inset: 0;
          background: rgba(8, 7, 10, 0.92);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: tutorialFadeIn 0.2s ease-out;
          padding: 1rem;
          backdrop-filter: blur(4px);
        }

        @keyframes tutorialFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes tutorialSlideIn {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(-8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .tutorial-popup {
          position: relative;
          background: linear-gradient(180deg, var(--color-bg-elevated) 0%, var(--color-bg-secondary) 100%);
          border: 1px solid var(--color-border);
          max-width: 420px;
          width: 100%;
          animation: tutorialSlideIn 0.25s ease-out;
          box-shadow: var(--shadow-lg), 0 0 60px rgba(0, 0, 0, 0.5);
        }

        .tutorial-popup::before {
          content: '';
          position: absolute;
          inset: 0;
          background: url('/texture-demonic.png') center/300px repeat;
          opacity: 0.03;
          pointer-events: none;
        }

        .tutorial-popup::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--color-bronze), transparent);
        }

        .tutorial-close {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          background: transparent;
          border: 1px solid var(--color-border-subtle);
          color: var(--color-text-muted);
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
          z-index: 1;
        }

        .tutorial-close:hover {
          border-color: var(--color-bronze);
          color: var(--color-text-primary);
        }

        .tutorial-content {
          position: relative;
        }

        .tutorial-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem 1.5rem 1.25rem;
          border-bottom: 1px solid var(--color-border-subtle);
        }

        .tutorial-logo {
          height: 56px;
          width: auto;
          filter:
            drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8))
            drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4));
        }

        .tutorial-desc {
          color: var(--color-text-secondary);
          text-align: center;
          margin: 0;
          font-size: 0.8125rem;
          line-height: 1.6;
          max-width: 320px;
        }

        .tutorial-body {
          padding: 1.25rem 1.5rem;
        }

        .tutorial-title {
          color: var(--color-gold);
          font-size: 0.875rem;
          font-weight: 600;
          margin: 0 0 0.75rem;
          letter-spacing: 0.03em;
        }

        .tutorial-steps {
          margin: 0;
          padding-left: 1.25rem;
          list-style-type: decimal;
          color: var(--color-text-secondary);
          font-size: 0.8125rem;
          line-height: 1.7;
        }

        .tutorial-steps li {
          margin-bottom: 0.375rem;
        }

        .tutorial-steps li::marker {
          color: var(--color-bronze);
        }

        .tutorial-footer {
          display: flex;
          justify-content: center;
          padding: 0 1.5rem 1.5rem;
        }

        .tutorial-btn {
          padding: 0.5rem 1.5rem;
          background: linear-gradient(180deg, var(--color-gold-dark) 0%, var(--color-bronze-dark) 100%);
          border: 1px solid var(--color-gold-dark);
          color: var(--color-text-primary);
          font-family: var(--font-display);
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all 0.15s;
        }

        .tutorial-btn:hover {
          background: linear-gradient(180deg, var(--color-gold) 0%, var(--color-gold-dark) 100%);
        }

        @media (max-width: 480px) {
          .tutorial-popup {
            margin: 0.5rem;
          }

          .tutorial-header {
            padding: 1.25rem 1.25rem 1rem;
          }

          .tutorial-body {
            padding: 1rem 1.25rem;
          }

          .tutorial-footer {
            padding: 0 1.25rem 1.25rem;
          }
        }
      `}</style>
    </div>
  );
}
