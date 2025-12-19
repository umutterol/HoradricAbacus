import { useState } from 'react';
import { Users, Copy, Check, LogOut, Crown, Circle, Link } from 'lucide-react';
import type { SessionState, SessionActions } from '../hooks/useSession';
import type { TranslateFunction } from '../hooks/useLanguage';
import { DiabloButton } from './DiabloButton';

interface SessionBarProps {
  sessionState: SessionState;
  sessionActions: SessionActions;
  t: TranslateFunction;
  onShowCreateSession: () => void;
  onShowJoinSession: () => void;
}

export function SessionBar({
  sessionState,
  sessionActions,
  t,
  onShowCreateSession,
  onShowJoinSession,
}: SessionBarProps) {
  const { session, players, mySlot, isConnected, isSupabaseAvailable } = sessionState;
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const copyToClipboard = async (text: string, type: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const copySessionCode = () => {
    if (!session) return;
    copyToClipboard(session.code, 'code');
  };

  const copySessionLink = () => {
    if (!session) return;
    const url = `${window.location.origin}${window.location.pathname}?session=${session.code}`;
    copyToClipboard(url, 'link');
  };

  const connectedCount = players.filter((p) => p.is_connected).length;
  const readyCount = players.filter((p) => p.is_connected && p.is_ready).length;

  // Not in a session - show create/join buttons
  if (!session) {
    if (!isSupabaseAvailable) {
      return null; // Hide session bar if Supabase not configured
    }

    return (
      <div className="session-bar session-bar--inactive">
        <div className="session-actions">
          <DiabloButton variant="secondary" size="sm" onClick={onShowCreateSession}>
            <Users size={14} />
            {t('btn_create_session')}
          </DiabloButton>
          <DiabloButton variant="secondary" size="sm" onClick={onShowJoinSession}>
            {t('btn_join_session')}
          </DiabloButton>
        </div>

        <style>{`
          .session-bar {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0.75rem 1rem;
            background: linear-gradient(180deg, rgba(20, 19, 24, 0.95) 0%, rgba(13, 12, 15, 0.9) 100%);
            border-bottom: 1px solid var(--color-border);
          }

          .session-bar--inactive .session-actions {
            display: flex;
            gap: 0.5rem;
          }
        `}</style>
      </div>
    );
  }

  // In a session - show session info
  const myPlayer = players.find((p) => p.slot === mySlot);
  const isReady = myPlayer?.is_ready ?? false;

  return (
    <div className="session-bar session-bar--active">
      <div className="session-info">
        <div className="session-code-container">
          <span className="session-label">{t('lbl_session')}:</span>
          <span className="session-code-value">{session.code}</span>
          <button
            className="copy-btn"
            onClick={copySessionCode}
            aria-label={t('btn_copy_code')}
            title={t('btn_copy_code')}
          >
            {copiedCode ? <Check size={14} /> : <Copy size={14} />}
          </button>
          <button
            className="copy-btn"
            onClick={copySessionLink}
            aria-label={t('btn_copy_link')}
            title={t('btn_copy_link')}
          >
            {copiedLink ? <Check size={14} /> : <Link size={14} />}
          </button>
        </div>

        <div className="session-players">
          {players.map((player) => (
            <div
              key={player.slot}
              className={`player-indicator ${player.is_connected ? 'connected' : ''} ${player.is_ready ? 'ready' : ''} ${player.slot === mySlot ? 'me' : ''}`}
              title={
                player.slot === mySlot
                  ? `${t('txt_you')}${player.player_name ? ` (${player.player_name})` : ''}`
                  : player.player_name || `${t('lbl_player')} ${player.slot + 1}`
              }
            >
              {player.slot === session.host_slot && (
                <Crown size={10} className="host-icon" />
              )}
              <Circle
                size={8}
                fill={
                  !player.is_connected
                    ? '#4b5563'
                    : player.is_ready
                      ? '#22c55e'
                      : '#eab308'
                }
                stroke="none"
              />
            </div>
          ))}
          <span className="player-count">{connectedCount}/4</span>
          {readyCount > 0 && (
            <span className="ready-count">
              ({readyCount} {t('txt_ready')})
            </span>
          )}
        </div>

        {!isConnected && (
          <span className="connection-status">{t('txt_reconnecting')}</span>
        )}
      </div>

      <div className="session-actions">
        <DiabloButton
          variant={isReady ? 'primary' : 'secondary'}
          size="sm"
          onClick={sessionActions.toggleMyReady}
        >
          {isReady ? t('btn_unready') : t('btn_ready')}
        </DiabloButton>
        <DiabloButton variant="secondary" size="sm" onClick={sessionActions.leaveSession}>
          <LogOut size={14} />
          {t('btn_leave')}
        </DiabloButton>
      </div>

      <style>{`
        .session-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background: linear-gradient(180deg, rgba(20, 19, 24, 0.95) 0%, rgba(13, 12, 15, 0.9) 100%);
          border-bottom: 1px solid var(--color-border);
          gap: 1rem;
        }

        .session-bar--active {
          background: linear-gradient(180deg, rgba(22, 101, 52, 0.15) 0%, rgba(13, 12, 15, 0.9) 100%);
          border-bottom-color: rgba(34, 197, 94, 0.3);
        }

        .session-info {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .session-code-container {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .session-label {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .session-code-value {
          font-family: var(--font-display);
          font-size: 1rem;
          font-weight: 600;
          color: var(--color-gold);
          letter-spacing: 0.1em;
        }

        .copy-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: transparent;
          border: 1px solid var(--color-border);
          color: var(--color-text-secondary);
          cursor: pointer;
          transition: all 0.15s;
        }

        .copy-btn:hover {
          border-color: var(--color-bronze);
          color: var(--color-gold);
        }

        .session-players {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .player-indicator {
          display: flex;
          align-items: center;
          gap: 2px;
          padding: 0.25rem 0.375rem;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid var(--color-border-subtle);
          transition: all 0.15s;
        }

        .player-indicator.me {
          border-color: var(--color-gold-dark);
          background: rgba(201, 162, 39, 0.1);
        }

        .player-indicator.connected {
          border-color: var(--color-border);
        }

        .player-indicator.ready {
          border-color: rgba(34, 197, 94, 0.5);
          background: rgba(34, 197, 94, 0.1);
        }

        .host-icon {
          color: var(--color-gold);
        }

        .player-count {
          font-size: 0.75rem;
          color: var(--color-text-secondary);
          margin-left: 0.25rem;
        }

        .ready-count {
          font-size: 0.75rem;
          color: #86efac;
        }

        .connection-status {
          font-size: 0.75rem;
          color: #fbbf24;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .session-actions {
          display: flex;
          gap: 0.5rem;
        }

        @media (max-width: 640px) {
          .session-bar {
            flex-direction: column;
            gap: 0.75rem;
          }

          .session-info {
            width: 100%;
            justify-content: center;
          }

          .session-actions {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
