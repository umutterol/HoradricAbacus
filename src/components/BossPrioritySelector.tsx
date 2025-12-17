import { JOKER_PRIORITY_OPTIONS } from '../constants';
import type { JokerPriority } from '../constants';
import type { TranslateFunction } from '../hooks/useLanguage';
import { DiabloButton } from './DiabloButton';

interface BossPrioritySelectorProps {
  priority: JokerPriority;
  onPriorityChange: (priority: JokerPriority) => void;
  t: TranslateFunction;
}

export function BossPrioritySelector({ priority, onPriorityChange, t }: BossPrioritySelectorProps) {
  return (
    <div className="priority-selector">
      <label className="priority-label">{t('lbl_priority')}</label>
      <div className="priority-options">
        {JOKER_PRIORITY_OPTIONS.map(option => (
          <DiabloButton
            key={option.value}
            variant={priority === option.value ? 'active' : 'muted'}
            size="sm"
            onClick={() => onPriorityChange(option.value)}
          >
            {t(option.labelKey)}
          </DiabloButton>
        ))}
      </div>

      <style>{`
        .priority-selector {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        .priority-label {
          color: var(--color-text-secondary);
          font-size: 0.875rem;
          text-align: center;
        }

        .priority-options {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}
