import { BOSS_LIST, MATERIAL_ICONS } from '../constants';
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
  const materials: { key: MaterialKey | 'stygian'; labelKey: string; icon: string }[] = [
    ...BOSS_LIST.map(boss => ({
      key: boss.materialKey,
      labelKey: boss.materialKey,
      icon: MATERIAL_ICONS[boss.materialKey],
    })),
    {
      key: 'stygian' as const,
      labelKey: 'mat_stygian',
      icon: MATERIAL_ICONS.stygian,
    },
  ];

  // Remove duplicates (some bosses might share materials)
  const uniqueMaterials = materials.filter((m, i, arr) =>
    arr.findIndex(x => x.key === m.key) === i
  );

  // Helper to format aria labels with placeholders
  const formatAriaLabel = (key: string, ...args: (string | number)[]): string => {
    let label = t(key);
    args.forEach((arg, idx) => {
      label = label.replace(`{${idx}}`, String(arg));
    });
    return label;
  };

  return (
    <div className="material-grid-container" role="region" aria-label="Material inputs">
      {/* Player headers with checkboxes and name inputs */}
      <div className="player-headers">
        <div className="icon-spacer" aria-hidden="true"></div>
        {[0, 1, 2, 3].map(playerIndex => (
          <div key={playerIndex} className="player-header-cell">
            <label className="player-toggle">
              <input
                type="checkbox"
                checked={playerActive[playerIndex]}
                onChange={() => onPlayerToggle(playerIndex)}
                className="player-checkbox"
                aria-label={formatAriaLabel('aria_player_toggle', playerIndex + 1)}
              />
              <span className="player-toggle-indicator" aria-hidden="true" />
            </label>
            <input
              type="text"
              className={`player-name-input ${!playerActive[playerIndex] ? 'inactive' : ''}`}
              value={playerNames[playerIndex]}
              placeholder={`P${playerIndex + 1}`}
              onChange={(e) => onNameChange(playerIndex, e.target.value)}
              maxLength={10}
              aria-label={formatAriaLabel('aria_player_name', playerIndex + 1)}
              disabled={!playerActive[playerIndex]}
            />
          </div>
        ))}
      </div>

      {/* Material rows */}
      <div className="material-rows" role="list">
        {uniqueMaterials.map(material => (
          <div
            key={material.key}
            className={`material-row ${material.key === 'stygian' ? 'stygian-row' : ''}`}
            role="listitem"
          >
            <div
              className="material-icon-wrapper"
              data-tooltip={t(material.labelKey)}
              aria-label={t(material.labelKey)}
            >
              <img
                src={material.icon}
                alt={t(material.labelKey)}
                className="material-icon"
                loading="lazy"
              />
            </div>
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
        ))}
      </div>

      <style>{`
        .material-grid-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1rem;
          gap: 0.5rem;
        }

        .player-headers {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }

        .icon-spacer {
          width: 44px;
        }

        .player-header-cell {
          width: 68px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.375rem;
        }

        /* Custom checkbox styling for better touch targets */
        .player-toggle {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 32px;
          cursor: pointer;
        }

        .player-checkbox {
          position: absolute;
          opacity: 0;
          width: 100%;
          height: 100%;
          cursor: pointer;
          margin: 0;
          z-index: 1;
        }

        .player-toggle-indicator {
          width: 20px;
          height: 20px;
          border: 2px solid var(--color-border);
          background: rgba(0, 0, 0, 0.3);
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .player-toggle-indicator::after {
          content: '';
          width: 10px;
          height: 10px;
          background: var(--color-gold);
          opacity: 0;
          transform: scale(0);
          transition: all 0.2s ease;
        }

        .player-checkbox:checked + .player-toggle-indicator {
          border-color: var(--color-gold);
          background: rgba(252, 211, 77, 0.1);
        }

        .player-checkbox:checked + .player-toggle-indicator::after {
          opacity: 1;
          transform: scale(1);
        }

        .player-checkbox:focus-visible + .player-toggle-indicator {
          outline: 2px solid var(--color-red);
          outline-offset: 2px;
        }

        .player-toggle:hover .player-toggle-indicator {
          border-color: var(--color-gold-dark);
        }

        .player-name-input {
          width: 100%;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid var(--color-border);
          color: var(--color-gold);
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: 0.85rem;
          text-align: center;
          padding: 0.375rem 0.25rem;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }

        .player-name-input:hover:not(:disabled) {
          border-color: var(--color-gold-dark);
        }

        .player-name-input:focus {
          outline: none;
          border-color: var(--color-gold);
          background: rgba(0, 0, 0, 0.5);
          box-shadow: 0 0 0 2px rgba(252, 211, 77, 0.2);
        }

        .player-name-input::placeholder {
           color: var(--color-text-secondary);
           opacity: 0.8;
           font-style: italic;
        }

        .player-name-input.inactive {
          color: var(--color-text-secondary);
          opacity: 0.4;
          border-color: rgba(120, 53, 15, 0.5);
        }

        .material-rows {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .material-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.25rem;
          transition: background-color 0.2s;
        }

        .material-row:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }

        .material-icon-wrapper {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: help;
          position: relative;
        }

        /* Custom tooltip */
        .material-icon-wrapper::after {
          content: attr(data-tooltip);
          position: absolute;
          left: 50%;
          bottom: 100%;
          transform: translateX(-50%);
          padding: 0.375rem 0.625rem;
          background: var(--color-bg-primary);
          border: 1px solid var(--color-border);
          font-size: 0.75rem;
          color: var(--color-text-primary);
          white-space: nowrap;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.2s, visibility 0.2s;
          z-index: 100;
          pointer-events: none;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        }

        .material-icon-wrapper:hover::after,
        .material-icon-wrapper:focus::after {
          opacity: 1;
          visibility: visible;
        }

        .material-icon {
          width: 40px;
          height: 40px;
          object-fit: contain;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
          transition: transform 0.2s;
        }

        .material-icon-wrapper:hover .material-icon {
          transform: scale(1.15);
        }

        .material-input {
          width: 68px;
          height: 44px;
          text-align: center;
          padding: 0.375rem 0.25rem;
          font-size: 0.9rem;
          /* Remove spinners - standard way usually needs vendor prefixes */
          -moz-appearance: textfield;
        }

        /* Remove arrows/spinners */
        .material-input::-webkit-outer-spin-button,
        .material-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .material-input.inactive {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .stygian-row {
          background: linear-gradient(90deg, rgba(124, 58, 237, 0.2) 0%, transparent 100%);
          border-left: 3px solid var(--color-stygian);
          padding-left: calc(0.25rem + 3px);
          margin-left: -3px;
        }

        .stygian-row .material-icon {
          filter: drop-shadow(0 0 6px rgba(124, 58, 237, 0.6));
        }

        @media (max-width: 480px) {
          .player-header-cell {
            width: 56px;
          }

          .player-toggle {
            width: 44px;
            height: 44px;
          }

          .player-name-input {
            font-size: 0.8rem;
          }

          .material-input {
            width: 56px;
            height: 44px;
            padding: 0.25rem;
            font-size: 0.8rem;
          }

          .material-icon {
            width: 32px;
            height: 32px;
          }

          .material-icon-wrapper {
            width: 36px;
            height: 36px;
          }

          .icon-spacer {
            width: 36px;
          }
        }
      `}</style>
    </div>
  );
}
