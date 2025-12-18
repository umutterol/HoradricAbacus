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
      <div className="results-empty">
        <div className="empty-content">
          <img src="/logo.png" alt="Horadric Abacus" className="empty-logo" />
          <p className="empty-welcome">{t('tut_welcome')}</p>
          <div className="empty-divider" />
          <h3 className="empty-title">{t('tut_how_to')}</h3>
          <ol className="empty-steps">
            <li>{t('tut_step1')}</li>
            <li>{t('tut_step2')}</li>
            <li>{t('tut_step3')}</li>
            <li>{t('tut_step4')}</li>
          </ol>
        </div>
        <style>{`
          .results-empty {
            position: relative;
            background: linear-gradient(180deg, var(--color-bg-elevated) 0%, var(--color-bg-secondary) 100%);
            border: 1px solid var(--color-border);
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 300px;
          }

          .results-empty::before {
            content: '';
            position: absolute;
            inset: 0;
            background: url('/texture-demonic.png') center/400px repeat;
            opacity: 0.02;
            pointer-events: none;
          }

          .empty-content {
            position: relative;
            z-index: 1;
            text-align: center;
            padding: 2rem 2.5rem;
            max-width: 400px;
          }

          .empty-logo {
            height: 64px;
            width: auto;
            margin-bottom: 1rem;
            filter:
              drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8))
              drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4));
          }

          .empty-welcome {
            color: var(--color-text-secondary);
            font-size: 1rem;
            line-height: 1.6;
            margin: 0 0 1.25rem;
          }

          .empty-divider {
            width: 60px;
            height: 1px;
            background: linear-gradient(90deg, transparent, var(--color-bronze), transparent);
            margin: 0 auto 1.25rem;
          }

          .empty-title {
            font-size: 1.125rem;
            margin-bottom: 1rem;
            color: var(--color-gold);
          }

          .empty-steps {
            text-align: left;
            margin: 0;
            padding-left: 1.5rem;
            color: var(--color-text-secondary);
            font-size: 1rem;
            line-height: 1.8;
            list-style: decimal;
          }

          .empty-steps li {
            margin-bottom: 0.5rem;
          }

          .empty-steps li::marker {
            color: var(--color-bronze);
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

  const activeBossResults = result.bossResults.filter(r => r.summons > 0);

  return (
    <div className="results-panel">
      {/* Header */}
      <div className="results-header">
        <h2 className="results-title">{t('sec_results')}</h2>
        <div className="total-badge">
          <Skull size={16} />
          <span className="total-value">{result.totalSummons}</span>
        </div>
      </div>

      {/* Boss Summary Grid */}
      <div className="boss-summary">
        {activeBossResults.map((r, idx) => {
          const boss = BOSS_LIST.find(b => b.id === r.bossId)!;
          return (
            <div
              key={r.bossId}
              className="boss-card"
              style={{
                '--boss-color': MATERIAL_COLORS[boss.materialKey],
                animationDelay: `${idx * 50}ms`
              } as React.CSSProperties}
            >
              <div className="boss-color-bar" />
              <div className="boss-info">
                <span className="boss-name">{t(boss.nameKey)}</span>
                <div className="boss-stats">
                  <span className="boss-count">{r.summons}</span>
                  {r.stygianUsed > 0 && (
                    <span className="stygian-used">+{r.stygianUsed}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trades Section */}
      <div className="trades-section">
        <h3 className="trades-title">{t('sec_trades')}</h3>

        {result.trades.length === 0 ? (
          <p className="no-trades">{t('txt_no_trades')}</p>
        ) : (
          <div className="trades-list">
            {result.trades.map((trade, idx) => {
              const stygianBossInfo = trade.material === 'stygian'
                ? Object.entries(result.stygianUsagePerPlayer[trade.toPlayer])
                    .filter(([, amount]) => amount > 0)
                    .map(([bossId]) => {
                      const boss = BOSS_LIST.find(b => b.id === bossId)!;
                      return t(boss.nameKey);
                    })
                : null;

              return (
                <div
                  key={idx}
                  className="trade-row"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <span className="trade-player from">{getPlayerLabel(trade.fromPlayer)}</span>
                  <ArrowRight size={12} className="trade-arrow" />
                  <span className="trade-player to">{getPlayerLabel(trade.toPlayer)}</span>
                  <span
                    className="trade-item"
                    style={{ color: getMaterialColor(trade.material) }}
                  >
                    <span className="trade-amount">{trade.amount}x</span>
                    <span className="trade-name">
                      {t(trade.material === 'stygian' ? 'mat_stygian' : trade.material)}
                    </span>
                  </span>
                  {stygianBossInfo && stygianBossInfo.length > 0 && (
                    <span className="stygian-target">
                      {stygianBossInfo.join(', ')}
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
          background: linear-gradient(180deg, var(--color-bg-elevated) 0%, var(--color-bg-secondary) 100%);
          border: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
          animation: slideUp 0.4s ease-out;
        }

        .results-panel::before {
          content: '';
          position: absolute;
          inset: 0;
          background: url('/texture-demonic.png') center/400px repeat;
          opacity: 0.02;
          pointer-events: none;
        }

        .results-panel > * {
          position: relative;
          z-index: 1;
        }

        /* Header */
        .results-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.875rem 1rem;
          border-bottom: 1px solid var(--color-border-subtle);
        }

        .results-title {
          font-size: 1rem;
          font-weight: 500;
          letter-spacing: 0.05em;
        }

        .total-badge {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.25rem 0.625rem;
          background: linear-gradient(180deg, var(--color-blood-light) 0%, var(--color-blood) 100%);
          border: 1px solid var(--color-blood-light);
        }

        .total-badge svg {
          color: var(--color-text-primary);
          opacity: 0.8;
        }

        .total-value {
          font-family: var(--font-display);
          font-size: 1rem;
          font-weight: 600;
          color: var(--color-text-primary);
        }

        /* Boss Summary */
        .boss-summary {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 0.5rem;
          padding: 0.875rem 1rem;
          border-bottom: 1px solid var(--color-border-subtle);
        }

        .boss-card {
          position: relative;
          background: var(--color-bg-void);
          border: 1px solid var(--color-border);
          padding: 0.5rem 0.625rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          animation: slideUp 0.3s ease-out both;
          transition: border-color 0.2s, background 0.2s;
        }

        .boss-card:hover {
          border-color: var(--color-bronze);
          background: rgba(255, 255, 255, 0.02);
        }

        .boss-color-bar {
          width: 3px;
          height: 100%;
          position: absolute;
          left: 0;
          top: 0;
          background: var(--boss-color);
          opacity: 0.8;
        }

        .boss-info {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
          padding-left: 0.25rem;
        }

        .boss-name {
          font-size: 0.8125rem;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .boss-stats {
          display: flex;
          align-items: baseline;
          gap: 0.25rem;
        }

        .boss-count {
          font-family: var(--font-display);
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--color-gold);
        }

        .stygian-used {
          font-size: 0.625rem;
          color: var(--color-stygian);
          font-weight: 500;
        }

        /* Trades Section */
        .trades-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          padding: 0.875rem 1rem;
        }

        .trades-title {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.625rem;
        }

        .no-trades {
          color: var(--color-text-muted);
          font-size: 0.9375rem;
          font-style: italic;
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

        .trade-row {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 0.625rem;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid var(--color-border-subtle);
          font-size: 0.875rem;
          animation: slideUp 0.3s ease-out both;
          transition: background 0.15s;
        }

        .trade-row:hover {
          background: rgba(0, 0, 0, 0.35);
        }

        .trade-player {
          padding: 0.1875rem 0.5rem;
          font-family: var(--font-display);
          font-size: 0.8125rem;
          font-weight: 500;
          max-width: 72px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .trade-player.from {
          background: var(--color-bronze-dark);
          color: var(--color-text-primary);
        }

        .trade-player.to {
          background: var(--color-gold-dark);
          color: var(--color-text-primary);
        }

        .trade-arrow {
          color: var(--color-text-muted);
          flex-shrink: 0;
        }

        .trade-item {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          margin-left: auto;
          font-weight: 500;
        }

        .trade-amount {
          font-family: var(--font-mono);
          font-size: 0.8125rem;
        }

        .trade-name {
          font-size: 0.8125rem;
        }

        .stygian-target {
          color: var(--color-stygian);
          font-size: 0.75rem;
          opacity: 0.8;
        }

        /* Scrollbar */
        .trades-list::-webkit-scrollbar {
          width: 4px;
        }

        .trades-list::-webkit-scrollbar-track {
          background: transparent;
        }

        .trades-list::-webkit-scrollbar-thumb {
          background: var(--color-border);
          border-radius: 2px;
        }

        @media (max-width: 480px) {
          .boss-summary {
            grid-template-columns: repeat(2, 1fr);
          }

          .trade-name {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
