import { BOSS_LIST, MATERIAL_ICONS, MATERIAL_COLORS } from '../constants';
import type { MaterialKey } from '../constants';
import type { TranslateFunction } from '../hooks/useLanguage';
import type { PlayerInventory } from '../lib/optimizer';

interface MaterialGridProps {
  inventories: PlayerInventory[];
  onInventoryChange: (playerIndex: number, material: MaterialKey | 'stygian', value: number) => void;
  playerActive: boolean[];
  emptyPlayers: boolean[];
  onPlayerToggle: (playerIndex: number) => void;
  playerNames: string[];
  onNameChange: (playerIndex: number, name: string) => void;
  t: TranslateFunction;
}

export function MaterialGrid({
  inventories,
  onInventoryChange,
  playerActive,
  onPlayerToggle,
  playerNames,
  onNameChange,
  t
}: MaterialGridProps) {
  const materials: { key: MaterialKey | 'stygian'; labelKey: string; icon: string; color: string }[] = [
    ...BOSS_LIST.map(boss => ({
      key: boss.materialKey,
      labelKey: boss.materialKey,
      icon: MATERIAL_ICONS[boss.materialKey],
      color: MATERIAL_COLORS[boss.materialKey],
    })),
    {
      key: 'stygian' as const,
      labelKey: 'mat_stygian',
      icon: MATERIAL_ICONS.stygian,
      color: MATERIAL_COLORS.stygian,
    },
  ];

  // Remove duplicates (some bosses might share materials)
  const uniqueMaterials = materials.filter((m, i, arr) =>
    arr.findIndex(x => x.key === m.key) === i
  );

  const formatAriaLabel = (key: string, ...args: (string | number)[]): string => {
    let label = t(key);
    args.forEach((arg, idx) => {
      label = label.replace(`{${idx}}`, String(arg));
    });
    return label;
  };

  return (
    <div className="material-grid" role="region" aria-label="Material inputs">
      {/* Player Headers */}
      <div className="grid-header">
        <div className="header-spacer" />
        {[0, 1, 2, 3].map(playerIndex => (
          <div
            key={playerIndex}
            className={`player-header ${playerActive[playerIndex] ? 'active' : 'inactive'}`}
          >
            <input
              type="text"
              className="player-name"
              value={playerNames[playerIndex]}
              placeholder={`P${playerIndex + 1}`}
              onChange={(e) => onNameChange(playerIndex, e.target.value)}
              maxLength={8}
              aria-label={formatAriaLabel('aria_player_name', playerIndex + 1)}
            />
            <button
              type="button"
              className="player-toggle-btn"
              onClick={() => onPlayerToggle(playerIndex)}
              aria-pressed={playerActive[playerIndex]}
              aria-label={formatAriaLabel('aria_player_toggle', playerIndex + 1)}
            />
          </div>
        ))}
      </div>

      {/* Material Rows */}
      <div className="grid-body">
        {uniqueMaterials.map((material, idx) => {
          const isStygian = material.key === 'stygian';
          return (
            <div
              key={material.key}
              className={`material-row ${isStygian ? 'stygian-row' : ''}`}
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              {/* Material Info */}
              <div className="material-info">
                <div
                  className="material-icon-container"
                  style={{ '--material-color': material.color } as React.CSSProperties}
                >
                  <img
                    src={material.icon}
                    alt=""
                    className="material-icon"
                    loading="lazy"
                  />
                </div>
                <span className="material-name">{t(material.labelKey)}</span>
              </div>

              {/* Input Cells */}
              <div className="input-cells">
                {inventories.map((inv, playerIndex) => (
                  <input
                    key={playerIndex}
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min="0"
                    value={inv[material.key] || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      onInventoryChange(playerIndex, material.key, Math.max(0, val));
                    }}
                    placeholder="0"
                    className={`material-input ${!playerActive[playerIndex] ? 'inactive' : ''}`}
                    disabled={!playerActive[playerIndex]}
                    aria-label={formatAriaLabel('aria_material_input', t(material.labelKey), playerIndex + 1)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .material-grid {
          padding: 1rem;
          position: relative;
          z-index: 1;
        }

        /* Header Row */
        .grid-header {
          display: flex;
          align-items: flex-end;
          gap: 0.375rem;
          padding-bottom: 0.75rem;
          margin-bottom: 0.5rem;
          border-bottom: 1px solid var(--color-border-subtle);
        }

        .header-spacer {
          width: 180px;
          flex-shrink: 0;
        }

        /* Player Header */
        .player-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 52px;
          gap: 0.375rem;
          transition: opacity 0.2s;
        }

        .player-header.inactive {
          opacity: 0.4;
        }

        /* Player Name Input */
        .player-name {
          width: 48px;
          height: 28px;
          padding: 0 0.25rem;
          text-align: center;
          font-family: var(--font-display);
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--color-gold);
          background: transparent;
          border: 1px solid transparent;
          letter-spacing: 0.02em;
          box-shadow: none;
        }

        .player-header.inactive .player-name {
          color: var(--color-text-muted);
        }

        .player-name:hover {
          border-color: var(--color-border);
        }

        .player-name:focus {
          border-color: var(--color-gold-dark);
          background: var(--color-bg-void);
          box-shadow: var(--shadow-inset);
        }

        .player-name::placeholder {
          color: var(--color-text-muted);
        }

        /* Toggle Button */
        .player-toggle-btn {
          width: 36px;
          height: 8px;
          padding: 0;
          border: 1px solid var(--color-border);
          background: var(--color-bg-void);
          cursor: pointer;
          transition: all 0.2s;
        }

        .player-toggle-btn:hover {
          border-color: var(--color-bronze);
          background: rgba(109, 90, 58, 0.3);
        }

        .player-header.active .player-toggle-btn {
          background: linear-gradient(180deg, var(--color-gold) 0%, var(--color-gold-dark) 100%);
          border-color: var(--color-gold);
          box-shadow: 0 0 8px var(--color-gold-glow);
        }

        .player-header.active .player-toggle-btn:hover {
          background: linear-gradient(180deg, var(--color-gold-light) 0%, var(--color-gold) 100%);
        }

        /* Grid Body */
        .grid-body {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        /* Material Row */
        .material-row {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.25rem 0;
          animation: slideUp 0.3s ease-out both;
          border-radius: 2px;
          transition: background-color 0.15s;
        }

        .material-row:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        /* Material Info (Icon + Name) */
        .material-info {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          width: 180px;
          flex-shrink: 0;
        }

        .material-icon-container {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: transform 0.2s;
        }

        .material-row:hover .material-icon-container {
          transform: scale(1.1);
        }

        .material-icon-container::after {
          content: '';
          position: absolute;
          inset: -4px;
          background: radial-gradient(circle, var(--material-color) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.2s;
          pointer-events: none;
        }

        .material-row:hover .material-icon-container::after {
          opacity: 0.3;
        }

        .material-icon {
          width: 32px;
          height: 32px;
          object-fit: contain;
          filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.6));
          position: relative;
          z-index: 1;
        }

        .material-name {
          font-size: 0.9375rem;
          color: var(--color-text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: color 0.15s;
        }

        .material-row:hover .material-name {
          color: var(--color-text-primary);
        }

        /* Input Cells Container */
        .input-cells {
          display: flex;
          gap: 0.375rem;
        }

        /* Material Input */
        .material-input {
          width: 52px;
          height: 34px;
          text-align: center;
          font-size: 0.9375rem;
          padding: 0;
        }

        .material-input.inactive {
          opacity: 0.25;
          cursor: not-allowed;
        }

        .material-input:focus {
          position: relative;
          z-index: 2;
        }

        /* Stygian Row Special Styling */
        .stygian-row {
          margin-top: 0.5rem;
          padding-top: 0.75rem;
          border-top: 1px solid var(--color-border-subtle);
          position: relative;
        }

        .stygian-row::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0.75rem;
          bottom: 0;
          width: 3px;
          background: linear-gradient(180deg, var(--color-stygian) 0%, transparent 100%);
          opacity: 0.6;
        }

        .stygian-row .material-icon-container::after {
          background: radial-gradient(circle, var(--color-stygian) 0%, transparent 70%);
        }

        .stygian-row:hover .material-icon-container::after {
          opacity: 0.5;
        }

        .stygian-row .material-icon {
          filter: drop-shadow(0 0 6px var(--color-stygian-glow)) drop-shadow(0 2px 3px rgba(0, 0, 0, 0.6));
        }

        .stygian-row .material-name {
          color: var(--color-stygian);
        }

        /* Responsive */
        @media (max-width: 520px) {
          .header-spacer {
            width: 140px;
          }

          .material-info {
            width: 140px;
          }

          .material-name {
            font-size: 0.75rem;
          }

          .player-header {
            width: 44px;
          }

          .player-name {
            width: 40px;
            font-size: 0.6875rem;
          }

          .player-toggle-btn {
            width: 30px;
          }

          .material-input {
            width: 44px;
            height: 32px;
            font-size: 0.75rem;
          }

          .material-icon-container {
            width: 32px;
            height: 32px;
          }

          .material-icon {
            width: 28px;
            height: 28px;
          }
        }

        @media (max-width: 400px) {
          .material-grid {
            padding: 0.75rem;
          }

          .header-spacer {
            width: 48px;
          }

          .material-info {
            width: 48px;
          }

          .material-name {
            display: none;
          }

          .player-toggle-btn {
            width: 28px;
          }

          .material-icon-container {
            width: 40px;
            height: 40px;
          }

          .material-icon {
            width: 36px;
            height: 36px;
          }
        }
      `}</style>
    </div>
  );
}
