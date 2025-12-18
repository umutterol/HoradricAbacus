import { useState, useEffect } from 'react';
import { Skull, ArrowRight, CheckCircle, Check } from 'lucide-react';
import { BOSS_LIST, MATERIAL_COLORS, MATERIAL_ICONS } from '../constants';
import type { MaterialKey, BossId } from '../constants';
import type { TranslateFunction } from '../hooks/useLanguage';
import type { OptimizationResult } from '../lib/optimizer';

interface ResultsPanelProps {
  result: OptimizationResult | null;
  playerNames: string[];
  playerActive: boolean[];
  t: TranslateFunction;
}

export function ResultsPanel({ result, playerNames, playerActive, t }: ResultsPanelProps) {
  const [completedTrades, setCompletedTrades] = useState<Set<number>>(new Set());

  // Reset completed trades when result changes
  useEffect(() => {
    setCompletedTrades(new Set());
  }, [result]);

  const toggleTradeComplete = (idx: number) => {
    setCompletedTrades(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };
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
            display: block;
            height: 64px;
            width: auto;
            margin: 0 auto 1rem;
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

  // Calculate required materials per player after trades
  const getPlayerMaterialRequirements = () => {
    const requirements: Record<number, Record<MaterialKey | 'stygian', number>> = {};

    for (let p = 0; p < 4; p++) {
      if (!playerActive[p]) continue;

      requirements[p] = {} as Record<MaterialKey | 'stygian', number>;

      // For each boss the player participates in
      for (const bossResult of activeBossResults) {
        const boss = BOSS_LIST.find(b => b.id === bossResult.bossId)!;
        const playerDuties = result.playerDuties[p]?.[bossResult.bossId as BossId] || 0;

        if (playerDuties > 0) {
          const materialNeeded = playerDuties * boss.cost;
          const stygianForBoss = result.stygianUsagePerPlayer[p]?.[bossResult.bossId as BossId] || 0;
          const specificMaterialNeeded = materialNeeded - stygianForBoss;

          if (specificMaterialNeeded > 0) {
            requirements[p][boss.materialKey] = (requirements[p][boss.materialKey] || 0) + specificMaterialNeeded;
          }
          if (stygianForBoss > 0) {
            requirements[p]['stygian'] = (requirements[p]['stygian'] || 0) + stygianForBoss;
          }
        }
      }
    }

    return requirements;
  };

  const playerRequirements = getPlayerMaterialRequirements();

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

              const isCompleted = completedTrades.has(idx);
              const materialIcon = MATERIAL_ICONS[trade.material];

              return (
                <div
                  key={idx}
                  className={`trade-row ${isCompleted ? 'completed' : ''}`}
                  style={{ animationDelay: `${idx * 30}ms` }}
                  onClick={() => toggleTradeComplete(idx)}
                >
                  <span className="trade-player from">{getPlayerLabel(trade.fromPlayer)}</span>
                  <ArrowRight size={12} className="trade-arrow" />
                  <span className="trade-player to">{getPlayerLabel(trade.toPlayer)}</span>
                  <span
                    className="trade-item"
                    style={{ '--item-color': getMaterialColor(trade.material) } as React.CSSProperties}
                  >
                    <span className="trade-amount">{trade.amount}x</span>
                    <img src={materialIcon} alt="" className="trade-icon" />
                    <span className="trade-name">
                      {t(trade.material === 'stygian' ? 'mat_stygian' : trade.material)}
                    </span>
                  </span>
                  {stygianBossInfo && stygianBossInfo.length > 0 && (
                    <span className="stygian-target">
                      {stygianBossInfo.join(', ')}
                    </span>
                  )}
                  <button
                    type="button"
                    className={`trade-check ${isCompleted ? 'checked' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTradeComplete(idx);
                    }}
                    aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                  >
                    {isCompleted && <Check size={12} />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Verification Section */}
      <div className="verification-section">
        <h3 className="verification-title">
          <CheckCircle size={14} />
          {t('sec_verification')}
        </h3>
        <p className="verification-hint">{t('txt_after_trades')}</p>

        <div className="verification-grid">
          {Object.entries(playerRequirements).map(([playerIdx, materials]) => {
            const idx = parseInt(playerIdx);
            const materialEntries = Object.entries(materials).filter(([, amount]) => amount > 0);

            if (materialEntries.length === 0) return null;

            return (
              <div key={idx} className="player-verification">
                <div className="player-verification-header">
                  {getPlayerLabel(idx)}
                </div>
                <div className="player-materials">
                  {materialEntries.map(([matKey, amount]) => {
                    const materialKey = matKey as MaterialKey | 'stygian';
                    return (
                      <div
                        key={matKey}
                        className="material-requirement"
                        style={{ '--mat-color': getMaterialColor(materialKey) } as React.CSSProperties}
                      >
                        <img
                          src={MATERIAL_ICONS[materialKey]}
                          alt=""
                          className="material-req-icon"
                        />
                        <span className="material-req-amount">{amount}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .results-panel {
          position: relative;
          background: linear-gradient(180deg, var(--color-bg-elevated) 0%, var(--color-bg-secondary) 100%);
          border: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
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
          display: flex;
          flex-wrap: wrap;
          gap: 0.375rem;
          padding: 0.625rem 1rem;
          border-bottom: 1px solid var(--color-border-subtle);
        }

        .boss-card {
          position: relative;
          background: var(--color-bg-void);
          border: 1px solid var(--color-border);
          padding: 0.25rem 0.5rem 0.25rem 0.625rem;
          display: flex;
          align-items: center;
          gap: 0.375rem;
          animation: slideUp 0.3s ease-out both;
          transition: border-color 0.2s, background 0.2s;
        }

        .boss-card:hover {
          border-color: var(--color-bronze);
          background: rgba(255, 255, 255, 0.02);
        }

        .boss-color-bar {
          width: 2px;
          height: 100%;
          position: absolute;
          left: 0;
          top: 0;
          background: var(--boss-color);
          opacity: 0.8;
        }

        .boss-info {
          display: flex;
          align-items: baseline;
          gap: 0.375rem;
        }

        .boss-name {
          font-size: 0.6875rem;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        .boss-stats {
          display: flex;
          align-items: baseline;
          gap: 0.125rem;
        }

        .boss-count {
          font-family: var(--font-display);
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--color-gold);
        }

        .stygian-used {
          font-size: 0.5625rem;
          color: var(--color-stygian);
          font-weight: 500;
        }

        /* Trades Section */
        .trades-section {
          display: flex;
          flex-direction: column;
          min-height: 0;
          padding: 0.75rem 1rem;
          max-height: 280px;
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
          gap: 0.25rem;
          flex: 1;
          overflow-y: auto;
          min-height: 0;
          padding-right: 0.25rem;
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
          transition: all 0.2s;
          cursor: pointer;
        }

        .trade-row:hover {
          background: rgba(0, 0, 0, 0.35);
        }

        .trade-row.completed {
          background: rgba(22, 101, 52, 0.25);
          border-color: rgba(34, 197, 94, 0.4);
        }

        .trade-row.completed:hover {
          background: rgba(22, 101, 52, 0.35);
        }

        .trade-row.completed .trade-player,
        .trade-row.completed .trade-arrow,
        .trade-row.completed .trade-item {
          opacity: 0.7;
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
          color: var(--item-color);
        }

        .trade-amount {
          font-family: var(--font-mono);
          font-size: 0.8125rem;
        }

        .trade-icon {
          width: 18px;
          height: 18px;
          object-fit: contain;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
        }

        .trade-name {
          font-size: 0.8125rem;
        }

        .stygian-target {
          color: var(--color-stygian);
          font-size: 0.75rem;
          opacity: 0.8;
        }

        .trade-check {
          width: 20px;
          height: 20px;
          margin-left: 0.375rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 1px solid var(--color-border);
          color: var(--color-text-muted);
          cursor: pointer;
          transition: all 0.15s;
          flex-shrink: 0;
          padding: 0;
        }

        .trade-check:hover {
          border-color: var(--color-bronze);
          color: var(--color-text-secondary);
        }

        .trade-check.checked {
          background: rgba(34, 197, 94, 0.3);
          border-color: rgba(34, 197, 94, 0.6);
          color: #22c55e;
        }

        .trade-check.checked:hover {
          background: rgba(34, 197, 94, 0.4);
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

        /* Verification Section */
        .verification-section {
          padding: 0.875rem 1rem;
          border-top: 1px solid var(--color-border-subtle);
          background: rgba(0, 0, 0, 0.15);
        }

        .verification-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--color-gold);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.375rem;
        }

        .verification-title svg {
          color: var(--color-gold);
          opacity: 0.8;
        }

        .verification-hint {
          color: var(--color-text-muted);
          font-size: 0.8125rem;
          margin: 0 0 0.75rem;
          font-style: italic;
        }

        .verification-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 0.5rem;
        }

        .player-verification {
          background: var(--color-bg-void);
          border: 1px solid var(--color-border);
          animation: slideUp 0.3s ease-out both;
        }

        .player-verification-header {
          padding: 0.375rem 0.5rem;
          font-family: var(--font-display);
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--color-gold);
          background: rgba(201, 162, 39, 0.1);
          border-bottom: 1px solid var(--color-border-subtle);
          text-align: center;
        }

        .player-materials {
          padding: 0.375rem;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.25rem;
        }

        .material-requirement {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.1875rem 0.375rem;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid var(--color-border-subtle);
          border-left: 2px solid var(--mat-color);
        }

        .material-req-icon {
          width: 16px;
          height: 16px;
          object-fit: contain;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
        }

        .material-req-amount {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-text-primary);
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
