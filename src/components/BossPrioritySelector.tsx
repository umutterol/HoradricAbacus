import { JOKER_PRIORITY_OPTIONS } from '../constants';
import type { JokerPriority } from '../constants';
import type { TranslateFunction } from '../hooks/useLanguage';

interface BossPrioritySelectorProps {
  priority: JokerPriority;
  onPriorityChange: (priority: JokerPriority) => void;
  t: TranslateFunction;
}

export function BossPrioritySelector({ priority, onPriorityChange, t }: BossPrioritySelectorProps) {
  return (
    <div className="priority-selector" role="group" aria-labelledby="priority-label">
      <label id="priority-label" className="priority-label">{t('lbl_priority')}</label>
      <div className="priority-options" role="radiogroup" aria-label={t('lbl_priority')}>
        {JOKER_PRIORITY_OPTIONS.map(option => (
          <button
            key={option.value}
            type="button"
            className={`priority-btn ${priority === option.value ? 'active' : ''}`}
            onClick={() => onPriorityChange(option.value)}
            role="radio"
            aria-checked={priority === option.value}
            aria-label={`${t(option.labelKey)} priority`}
          >
            {t(option.labelKey)}
          </button>
        ))}
      </div>

      <style>{`
        .priority-selector {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.625rem;
          border-top: 1px solid var(--color-border-subtle);
          position: relative;
          z-index: 1;
        }

        .priority-label {
          color: var(--color-text-secondary);
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          text-align: center;
        }

        .priority-options {
          display: flex;
          gap: 0.375rem;
          justify-content: center;
        }

        .priority-btn {
          padding: 0.5rem 0.75rem;
          background: var(--color-bg-void);
          border: 1px solid var(--color-border);
          color: var(--color-text-muted);
          font-family: var(--font-display);
          font-size: 0.8125rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          cursor: pointer;
          transition: all 0.15s;
        }

        .priority-btn:hover {
          border-color: var(--color-bronze);
          color: var(--color-text-secondary);
        }

        .priority-btn.active {
          background: linear-gradient(180deg, rgba(124, 58, 237, 0.2) 0%, rgba(124, 58, 237, 0.1) 100%);
          border-color: var(--color-stygian);
          color: var(--color-stygian);
          box-shadow: 0 0 8px rgba(124, 58, 237, 0.2);
        }

        .priority-btn:focus-visible {
          outline: 2px solid var(--color-stygian);
          outline-offset: 1px;
        }

        @media (max-width: 480px) {
          .priority-options {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
}
