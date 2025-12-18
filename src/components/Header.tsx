import { HelpCircle } from 'lucide-react';
import type { Language } from '../constants';

interface HeaderProps {
    language: Language;
    onToggleLanguage: () => void;
    onShowHelp: () => void;
}

export function Header({ language, onToggleLanguage, onShowHelp }: HeaderProps) {
    const nextLanguage = language === 'en' ? 'Turkish' : 'English';
    const currentFlag = language === 'en' ? '🇬🇧' : '🇹🇷';

    return (
        <header className="header" role="banner">
            <div className="header-content">
                <div className="header-title">
                    <img src="/logo.png" alt="Horadric Abacus - Diablo 4 Rota Optimizer" className="header-logo" />
                </div>
                <div className="header-actions">
                    <button
                        className="header-btn help-btn"
                        onClick={onShowHelp}
                        aria-label="Show help and tutorial"
                    >
                        <HelpCircle size={20} aria-hidden="true" />
                    </button>
                    <button
                        className="header-btn lang-toggle"
                        onClick={onToggleLanguage}
                        aria-label={`Switch language to ${nextLanguage}. Current: ${language.toUpperCase()}`}
                    >
                        <span className="flag-icon" aria-hidden="true">{currentFlag}</span>
                    </button>
                </div>
            </div>

            <style>{`
        .header {
          padding: 1.5rem;
          border-bottom: 1px solid var(--color-border);
          background: linear-gradient(180deg, rgba(28, 25, 23, 0.8) 0%, transparent 100%);
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-logo {
          height: 56px;
          width: auto;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8)) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.6));
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .header-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid var(--color-border);
          color: var(--color-text-secondary);
          cursor: pointer;
          transition: all 0.2s;
          font-family: var(--font-body);
          font-weight: 500;
        }

        .header-btn:hover {
          border-color: var(--color-gold);
          color: var(--color-gold);
        }

        .help-btn {
          width: 44px;
          height: 44px;
          padding: 0;
        }

        .lang-toggle {
          width: 44px;
          height: 44px;
          padding: 0;
        }

        .flag-icon {
          font-size: 1.5rem;
          line-height: 1;
        }

        @media (max-width: 640px) {
          .header-logo {
            height: 40px;
          }

          .help-btn,
          .lang-toggle {
            width: 40px;
            height: 40px;
          }

          .flag-icon {
            font-size: 1.25rem;
          }
        }
      `}</style>
        </header>
    );
}
