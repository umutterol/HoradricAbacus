import { Skull, ArrowRight } from 'lucide-react';
import { BOSS_LIST, MATERIAL_COLORS } from '../constants';
import type { MaterialKey } from '../constants';
import type { TranslateFunction } from '../hooks/useLanguage';
import type { OptimizationResult } from '../lib/optimizer';

interface ResultsPanelProps {
  result: OptimizationResult | null;
  playerNames: string[];
  t: TranslateFunction;
}

export function ResultsPanel({ result, playerNames, t }: ResultsPanelProps) {
  if (!result) {
    return (
      <div className="results-tutorial">
        <div className="tutorial-welcome">
          <img src="/logo.png" alt="Horadric Abacus" className="tutorial-logo" />
          <p className="welcome-text">{t('tut_welcome')}</p>
        </div>
        <h3 className="tutorial-title">{t('tut_how_to')}</h3>
        <ol className="tutorial-steps">
          <li>{t('tut_step1')}</li>
          <li>{t('tut_step2')}</li>
          <li>{t('tut_step3')}</li>
          <li>{t('tut_step4')}</li>
        </ol>
        <style>{`
          .results-tutorial {
            position: relative;
            background: var(--color-bg-secondary);
            border: 1px solid var(--color-border);
            padding: 1.5rem;
            overflow: hidden;
            flex: 1;
          }

          .results-tutorial::before {
            content: '';
            position: absolute;
            inset: 0;
            background: url('/texture-demonic.png') center/contain no-repeat;
            opacity: 0.05;
            pointer-events: none;
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
            margin: 0;
            padding-left: 1.25rem;
            list-style-type: decimal;
            color: var(--color-text-secondary);
            font-size: 0.9375rem;
            line-height: 1.6;
          }

          .tutorial-steps li {
            margin-bottom: 0.5rem;
          }
        `}</style>
      </div>
    );
  }

  const getMaterialColor = (mat: MaterialKey | 'stygian'): string => {
    if (mat === 'stygian') return MATERIAL_COLORS.stygian;
    return MATERIAL_COLORS[mat];
  };

  const getPlayerLabel = (index: number) => {
    return playerNames[index] || `P${index + 1}`;
  };

  return (
    <div className="results-panel">
      <h2 className="results-title">{t('sec_results')}</h2>

      {/* Summary Section - Compact Horizontal */}
      <div className="results-summary">
        <div className="total-summons">
          <Skull size={20} />
          <div className="total-details">
            <span className="total-label">{t('txt_total_kills')}</span>
            <span className="party-size-label">({result.partySize} Players)</span>
          </div>
          <span className="total-value">{result.totalSummons}</span>
        </div>

        <div className="boss-row">
          {result.bossResults
            .filter(r => r.summons > 0)
            .map(r => {
              const boss = BOSS_LIST.find(b => b.id === r.bossId)!;
              return (
                <div key={r.bossId} className="boss-chip">
                  <span
                    className="boss-dot"
                    style={{ backgroundColor: MATERIAL_COLORS[boss.materialKey] }}
                  />
                  <span className="boss-name">{t(boss.nameKey)}</span>
                  <span className="boss-count">×{r.summons}</span>
                  {r.stygianUsed > 0 && (
                    <span className="stygian-badge">+{r.stygianUsed}⬡</span>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Trades Section - Scrollable */}
      <div className="trades-section">
        <h3 className="trades-title">{t('sec_trades')}</h3>

        {result.trades.length === 0 ? (
          <p className="no-trades">{t('txt_no_trades')}</p>
        ) : (
          <div className="trades-list">
            {result.trades.map((trade, idx) => {
              // For stygian trades, find which boss it's used for
              const stygianBossInfo = trade.material === 'stygian'
                ? Object.entries(result.stygianUsagePerPlayer[trade.toPlayer])
                    .filter(([, amount]) => amount > 0)
                    .map(([bossId]) => {
                      const boss = BOSS_LIST.find(b => b.id === bossId)!;
                      return t(boss.nameKey);
                    })
                : null;

              return (
                <div key={idx} className="trade-item">
                  <span className="player-badge">{getPlayerLabel(trade.fromPlayer)}</span>
                  <ArrowRight size={14} className="trade-arrow" />
                  <span className="player-badge">{getPlayerLabel(trade.toPlayer)}</span>
                  <span
                    className="trade-amount"
                    style={{ color: getMaterialColor(trade.material) }}
                  >
                    {trade.amount}× {t(trade.material === 'stygian' ? 'mat_stygian' : trade.material)}
                  </span>
                  {stygianBossInfo && stygianBossInfo.length > 0 && (
                    <span className="stygian-for-boss">
                      → {stygianBossInfo.join(', ')}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .results-panel {
          position: relative;
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border);
          overflow: hidden;
          animation: resultsFadeIn 0.4s ease-out;
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
        }

        @keyframes resultsFadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .results-panel::before {
          content: '';
          position: absolute;
          inset: 0;
          background: url('/texture-demonic.png') center/contain no-repeat;
          opacity: 0.05;
          pointer-events: none;
          z-index: 0;
        }

        .results-panel > * {
          position: relative;
          z-index: 1;
        }
        
        .results-title {
          font-size: 1rem;
          padding: 0.75rem 1rem;
          margin: 0;
          border-bottom: 1px solid var(--color-border);
        }
        
        .results-summary {
          padding: 1rem;
          border-bottom: 1px solid var(--color-border);
        }
        
        .total-summons {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }
        
        .total-details {
          display: flex;
          flex-direction: column;
        }
        
        .total-summons svg {
          color: var(--color-red);
        }
        
        .total-label {
          color: var(--color-text-secondary);
          font-size: 0.875rem;
        }
        
        .party-size-label {
           color: var(--color-text-secondary);
           font-size: 0.75rem;
           opacity: 0.7;
        }
        
        .total-value {
          font-size: 1.25rem;
          font-family: var(--font-heading);
          color: var(--color-gold);
          font-weight: 700;
          margin-left: auto;
        }
        
        .boss-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        .boss-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.25rem 0.5rem;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid var(--color-border);
          font-size: 0.75rem;
        }
        
        .boss-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        
        .boss-name {
          color: var(--color-text-secondary);
        }
        
        .boss-count {
          font-weight: 600;
          color: var(--color-gold);
        }
        
        .stygian-badge {
          color: var(--color-stygian);
          font-size: 0.625rem;
        }
        
        .trades-section {
          padding: 0.75rem 1rem;
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
        }
        
        .trades-title {
          font-size: 0.875rem;
          color: var(--color-gold);
          margin: 0 0 0.5rem;
        }
        
        .no-trades {
          color: var(--color-text-secondary);
          font-style: italic;
          font-size: 0.875rem;
          margin: 0;
        }
        
        .trades-list {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
          flex: 1;
          overflow-y: auto;
          min-height: 0;
        }
        
        .trade-item {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.5rem;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(138, 106, 75, 0.3);
          font-size: 0.8125rem;
        }

        .player-badge {
          background: var(--color-border);
          color: var(--color-text-primary);
          padding: 0.125rem 0.375rem;
          font-weight: 600;
          font-size: 0.75rem;
          /* Handle long names seamlessly */
          max-width: 100px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .trade-arrow {
          color: var(--color-text-secondary);
          flex-shrink: 0;
        }
        
        .trade-amount {
          font-weight: 500;
          margin-left: 0.25rem;
        }

        .stygian-for-boss {
          color: var(--color-stygian);
          font-size: 0.75rem;
          font-style: italic;
          margin-left: 0.25rem;
        }

        /* Scrollbar styling for trades list */
        .trades-list::-webkit-scrollbar {
          width: 6px;
        }

        .trades-list::-webkit-scrollbar-track {
          background: transparent;
        }

        .trades-list::-webkit-scrollbar-thumb {
          background: var(--color-border);
        }
      `}</style>
    </div>
  );
}
