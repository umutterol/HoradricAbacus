import { Globe } from 'lucide-react';
import type { Language } from '../constants';

interface HeaderProps {
    language: Language;
    onToggleLanguage: () => void;
}

export function Header({ language, onToggleLanguage }: HeaderProps) {
    return (
        <header className="header">
            <div className="header-content">
                <div className="header-title">
                    <img src="/logo.png" alt="Horadric Abacus" className="header-logo" />
                </div>
                <button
                    className="lang-toggle"
                    onClick={onToggleLanguage}
                    aria-label="Toggle language"
                >
                    <Globe size={20} />
                    <span>{language.toUpperCase()}</span>
                </button>
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
        
        .lang-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: transparent;
          border: 1px solid var(--color-border);
          color: var(--color-text-secondary);
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
          font-family: var(--font-body);
          font-weight: 500;
        }
        
        .lang-toggle:hover {
          border-color: var(--color-gold);
          color: var(--color-gold);
        }
        
        @media (max-width: 640px) {
          .header-logo {
            height: 40px;
          }
        }
      `}</style>
        </header>
    );
}
