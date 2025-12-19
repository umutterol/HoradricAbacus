import { Camera, Circle, User } from 'lucide-react';
import { BOSS_LIST, MATERIAL_ICONS, MATERIAL_COLORS } from '../constants';
import type { MaterialKey } from '../constants';
import type { TranslateFunction } from '../hooks/useLanguage';
import type { PlayerInventory } from '../lib/optimizer';
import type { SessionPlayer } from '../lib/database.types';
import { getSlotState, type SlotState } from '../lib/database.types';

interface MaterialGridProps {
  inventories: PlayerInventory[];
  onInventoryChange: (playerIndex: number, material: MaterialKey | 'stygian', value: number) => void;
  playerActive: boolean[];
  emptyPlayers: boolean[];
  onPlayerToggle: (playerIndex: number) => void;
  playerNames: string[];
  onNameChange: (playerIndex: number, name: string) => void;
  onScreenshotUpload: (playerIndex: number) => void;
  isCollaborative: boolean;
  mySlot: number | null;
  players: SessionPlayer[];
  canEditSlot?: (slot: number) => boolean;
  t: TranslateFunction;
}

export function MaterialGrid({
  inventories,
  onInventoryChange,
  playerActive,
  onPlayerToggle,
  playerNames,
  onNameChange,
  onScreenshotUpload,
  isCollaborative,
  mySlot,
  players,
  canEditSlot,
  t
}: MaterialGridProps) {
  // In collaborative mode, can edit own slot or disconnected slots (for manual entry)
  const canEdit = (playerIndex: number) => {
    if (!isCollaborative) return true;
    if (canEditSlot) return canEditSlot(playerIndex);
    // Fallback: own slot is always editable
    return playerIndex === mySlot;
  };

  // Get player status for collaborative mode indicators
  const getPlayerStatus = (playerIndex: number) => {
    if (!isCollaborative) return null;
    return players.find(p => p.slot === playerIndex) || null;
  };

  // Get slot state for visual indicators
  const getSlotVisualState = (playerIndex: number): SlotState => {
    const player = getPlayerStatus(playerIndex);
    if (!player) return 'empty';
    return getSlotState(player);
  };
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
        {[0, 1, 2, 3].map(playerIndex => {
          const playerStatus = getPlayerStatus(playerIndex);
          const isMySlot = isCollaborative && playerIndex === mySlot;
          const isEditable = canEdit(playerIndex);
          const slotState = getSlotVisualState(playerIndex);
          const isReady = playerStatus?.is_ready ?? false;

          // Determine status indicator color based on slot state
          const getStatusColor = () => {
            if (slotState === 'connected') {
              return isReady ? '#22c55e' : '#eab308'; // Green if ready, yellow if not
            }
            if (slotState === 'manual') {
              return '#c9a227'; // Bronze/gold for manual entry
            }
            return '#4b5563'; // Gray for empty
          };

          return (
            <div
              key={playerIndex}
              className={`player-header ${playerActive[playerIndex] ? 'active' : 'inactive'} ${isMySlot ? 'my-slot' : ''} ${!isEditable ? 'readonly' : ''} slot-${slotState}`}
            >
              {/* Collaborative mode status indicator */}
              {isCollaborative && (
                <div className="player-status">
                  {slotState === 'manual' ? (
                    <User size={10} color={getStatusColor()} strokeWidth={2.5} />
                  ) : (
                    <Circle
                      size={8}
                      fill={getStatusColor()}
                      stroke="none"
                    />
                  )}
                  {isMySlot && <span className="you-label">{t('txt_you')}</span>}
                  {slotState === 'manual' && !isMySlot && (
                    <span className="manual-label">{t('txt_manual_entry')}</span>
                  )}
                </div>
              )}
              <input
                type="text"
                className="player-name"
                value={playerNames[playerIndex]}
                placeholder={`P${playerIndex + 1}`}
                onChange={(e) => onNameChange(playerIndex, e.target.value)}
                maxLength={8}
                disabled={!isEditable}
                aria-label={formatAriaLabel('aria_player_name', playerIndex + 1)}
              />
              <div className="player-controls">
                <button
                  type="button"
                  className="player-toggle-btn"
                  onClick={() => onPlayerToggle(playerIndex)}
                  aria-pressed={playerActive[playerIndex]}
                  aria-label={formatAriaLabel('aria_player_toggle', playerIndex + 1)}
                  disabled={!isEditable}
                />
                {/* Screenshot import button - hidden until feature is ready */}
                {false && isEditable && (
                  <button
                    type="button"
                    className="player-screenshot-btn"
                    onClick={() => onScreenshotUpload(playerIndex)}
                    aria-label={t('btn_screenshot')}
                    title={t('btn_screenshot')}
                  >
                    <Camera size={12} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
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
                {inventories.map((inv, playerIndex) => {
                  const isEditable = canEdit(playerIndex);
                  const isDisabled = !playerActive[playerIndex] || !isEditable;
                  return (
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
                      className={`material-input ${!playerActive[playerIndex] ? 'inactive' : ''} ${!isEditable ? 'readonly' : ''}`}
                      disabled={isDisabled}
                      aria-label={formatAriaLabel('aria_material_input', t(material.labelKey), playerIndex + 1)}
                    />
                  );
                })}
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

        .player-header.my-slot {
          border-radius: 4px;
          background: rgba(201, 162, 39, 0.08);
          padding: 0.25rem;
          margin: -0.25rem;
        }

        .player-header.readonly:not(.my-slot) {
          opacity: 0.7;
        }

        /* Player Status (Collaborative Mode) */
        .player-status {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          height: 16px;
        }

        .you-label {
          font-size: 0.625rem;
          font-weight: 600;
          color: var(--color-gold);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .manual-label {
          font-size: 0.5625rem;
          font-weight: 500;
          color: var(--color-bronze);
          text-transform: uppercase;
          letter-spacing: 0.03em;
          opacity: 0.9;
        }

        /* Slot state styling */
        .player-header.slot-manual {
          background: rgba(201, 162, 39, 0.06);
          border-radius: 4px;
          padding: 0.25rem;
          margin: -0.25rem;
        }

        .player-header.slot-manual .player-name {
          color: var(--color-bronze);
        }

        .player-header.slot-empty:not(.my-slot) {
          opacity: 0.5;
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

        .player-name:disabled {
          cursor: default;
          color: var(--color-text-secondary);
        }

        .player-name:disabled:hover {
          border-color: transparent;
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

        .player-toggle-btn:disabled {
          cursor: default;
          opacity: 0.6;
        }

        .player-toggle-btn:disabled:hover {
          border-color: var(--color-border);
          background: var(--color-bg-void);
        }

        .player-header.active .player-toggle-btn:disabled:hover {
          background: linear-gradient(180deg, var(--color-gold) 0%, var(--color-gold-dark) 100%);
          border-color: var(--color-gold);
        }

        /* Player Controls */
        .player-controls {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }

        /* Screenshot Button */
        .player-screenshot-btn {
          width: 24px;
          height: 18px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(124, 58, 237, 0.15);
          border: 1px solid rgba(124, 58, 237, 0.4);
          color: #a78bfa;
          cursor: pointer;
          transition: all 0.15s;
        }

        .player-screenshot-btn:hover {
          background: rgba(124, 58, 237, 0.25);
          border-color: rgba(167, 139, 250, 0.6);
          color: #c4b5fd;
        }

        .player-screenshot-btn:active {
          transform: scale(0.95);
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

        .material-input.readonly:not(.inactive) {
          cursor: default;
          color: var(--color-text-secondary);
          background: rgba(0, 0, 0, 0.2);
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
