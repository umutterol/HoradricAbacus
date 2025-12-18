import { HelpCircle, Bug } from 'lucide-react';
import type { Language } from '../constants';

interface HeaderProps {
    language: Language;
    onToggleLanguage: () => void;
    onShowHelp: () => void;
}

const BUG_REPORT_URL = 'https://github.com/umutterol/HoradricAbacus/issues/new?template=bug_report.md&title=[Bug]%20&labels=bug';

export function Header({ language, onToggleLanguage, onShowHelp }: HeaderProps) {
    const nextLanguage = language === 'en' ? 'Turkish' : 'English';
    const currentFlag = language === 'en' ? '🇬🇧' : '🇹🇷';

    return (
        <header className="header" role="banner">
            <div className="header-content">
                <div className="header-brand">
                    <img
                        src="/logo.png"
                        alt="Horadric Abacus - Diablo 4 Rota Optimizer"
                        className="header-logo"
                    />
                </div>
                <div className="header-actions">
                    <a
                        href={BUG_REPORT_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bug-report-btn"
                        aria-label="Report a bug on GitHub"
                    >
                        <Bug size={14} strokeWidth={2} aria-hidden="true" />
                        <span>Report Bug</span>
                    </a>
                    <button
                        className="icon-btn"
                        onClick={onShowHelp}
                        aria-label="Show help and tutorial"
                    >
                        <HelpCircle size={18} strokeWidth={1.5} aria-hidden="true" />
                    </button>
                    <button
                        className="icon-btn lang-btn"
                        onClick={onToggleLanguage}
                        aria-label={`Switch language to ${nextLanguage}. Current: ${language.toUpperCase()}`}
                    >
                        <span className="flag-icon" aria-hidden="true">{currentFlag}</span>
                    </button>
                </div>
            </div>

            <style>{`
                .header {
                    position: relative;
                    padding: 1.25rem 1.5rem;
                    background: linear-gradient(180deg,
                        rgba(20, 19, 24, 0.95) 0%,
                        rgba(13, 12, 15, 0.8) 100%
                    );
                    border-bottom: 1px solid var(--color-border);
                    backdrop-filter: blur(8px);
                }

                .header::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 200px;
                    height: 1px;
                    background: linear-gradient(90deg, transparent, var(--color-gold-dark), transparent);
                }

                .header-content {
                    max-width: 1200px;
                    margin: 0 auto;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .header-brand {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .header-logo {
                    height: 48px;
                    width: auto;
                    filter:
                        drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8))
                        drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4));
                    transition: filter 0.3s, transform 0.3s;
                }

                .header-logo:hover {
                    filter:
                        drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8))
                        drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4))
                        drop-shadow(0 0 12px var(--color-gold-glow));
                    transform: scale(1.02);
                }

                .header-actions {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .bug-report-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.375rem;
                    padding: 0.4375rem 0.75rem;
                    background: linear-gradient(180deg, rgba(185, 28, 28, 0.2) 0%, rgba(107, 28, 28, 0.3) 100%);
                    border: 1px solid rgba(185, 28, 28, 0.5);
                    color: #fca5a5;
                    font-family: var(--font-display);
                    font-size: 0.6875rem;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    text-decoration: none;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .bug-report-btn:hover {
                    background: linear-gradient(180deg, rgba(185, 28, 28, 0.35) 0%, rgba(107, 28, 28, 0.45) 100%);
                    border-color: rgba(248, 113, 113, 0.6);
                    color: #fecaca;
                    transform: translateY(-1px);
                }

                .bug-report-btn:active {
                    transform: translateY(0);
                }

                .icon-btn {
                    width: 40px;
                    height: 40px;
                    padding: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: transparent;
                    border: 1px solid var(--color-border);
                    color: var(--color-text-secondary);
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .icon-btn:hover {
                    border-color: var(--color-bronze);
                    color: var(--color-gold);
                    background: rgba(201, 162, 39, 0.05);
                }

                .icon-btn:active {
                    transform: scale(0.96);
                }

                .lang-btn {
                    font-size: 1.125rem;
                }

                .flag-icon {
                    line-height: 1;
                }

                @media (max-width: 640px) {
                    .header {
                        padding: 1rem;
                    }

                    .header-logo {
                        height: 36px;
                    }

                    .bug-report-btn span {
                        display: none;
                    }

                    .bug-report-btn {
                        padding: 0.5rem;
                    }

                    .icon-btn {
                        width: 36px;
                        height: 36px;
                    }

                    .icon-btn svg {
                        width: 16px;
                        height: 16px;
                    }

                    .lang-btn {
                        font-size: 1rem;
                    }
                }
            `}</style>
        </header>
    );
}
