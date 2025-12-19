import { useState, useEffect, useRef } from 'react';
import { X, Copy, Check, Users, Link } from 'lucide-react';
import type { TranslateFunction } from '../hooks/useLanguage';
import { DiabloButton } from './DiabloButton';

interface CreateSessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (playerName: string) => Promise<string | null>;
  onShowToast: (message: string) => void;
  t: TranslateFunction;
}

export function CreateSessionDialog({
  isOpen,
  onClose,
  onCreate,
  onShowToast,
  t,
}: CreateSessionDialogProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setPlayerName('');
      setTimeout(() => nameInputRef.current?.focus(), 100);
    } else {
      setSessionCode(null);
      setError(null);
      setCopiedCode(false);
      setCopiedLink(false);
    }
  }, [isOpen]);

  const handleCreate = async () => {
    setIsCreating(true);
    setError(null);
    const code = await onCreate(playerName.trim());
    if (code) {
      setSessionCode(code);
    } else {
      setError(t('err_create_session'));
    }
    setIsCreating(false);
  };

  const copyCode = async () => {
    if (!sessionCode) return;
    try {
      await navigator.clipboard.writeText(sessionCode);
      setCopiedCode(true);
      onShowToast(t('toast_code_copied'));
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = sessionCode;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedCode(true);
      onShowToast(t('toast_code_copied'));
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const copyLink = async () => {
    if (!sessionCode) return;
    const url = `${window.location.origin}${window.location.pathname}?session=${sessionCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      onShowToast(t('toast_link_copied'));
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedLink(true);
      onShowToast(t('toast_link_copied'));
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <button className="dialog-close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        <h2 className="dialog-title">
          <Users size={20} />
          {t('dlg_create_session_title')}
        </h2>

        {sessionCode ? (
          <div className="session-created">
            <p className="success-text">{t('txt_session_created')}</p>
            <div className="code-display">
              <span className="code-value">{sessionCode}</span>
              <button className="copy-code-btn" onClick={copyCode} title={t('btn_copy_code')}>
                {copiedCode ? <Check size={16} /> : <Copy size={16} />}
              </button>
              <button className="copy-code-btn" onClick={copyLink} title={t('btn_copy_link')}>
                {copiedLink ? <Check size={16} /> : <Link size={16} />}
              </button>
            </div>
            <p className="hint-text">{t('txt_share_code')}</p>
            <DiabloButton variant="primary" onClick={onClose}>
              {t('btn_start_session')}
            </DiabloButton>
          </div>
        ) : (
          <div className="create-form">
            <p className="info-text">{t('txt_create_session_info')}</p>
            <input
              ref={nameInputRef}
              type="text"
              className="name-input"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder={t('placeholder_player_name')}
              maxLength={8}
              autoComplete="off"
            />
            {error && <p className="error-text">{error}</p>}
            <DiabloButton
              variant="primary"
              onClick={handleCreate}
              loading={isCreating}
            >
              {t('btn_create_session')}
            </DiabloButton>
          </div>
        )}

        <style>{`
          .dialog-overlay {
            position: fixed;
            inset: 0;
            background: rgba(8, 7, 10, 0.92);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            animation: dialogFadeIn 0.2s ease-out;
            padding: 1rem;
            backdrop-filter: blur(4px);
          }

          @keyframes dialogFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .dialog {
            position: relative;
            background: linear-gradient(180deg, var(--color-bg-elevated) 0%, var(--color-bg-secondary) 100%);
            border: 1px solid var(--color-border);
            padding: 1.5rem;
            max-width: 400px;
            width: 100%;
            animation: dialogSlideIn 0.25s ease-out;
            box-shadow: var(--shadow-lg), 0 0 40px rgba(0, 0, 0, 0.5);
          }

          @keyframes dialogSlideIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .dialog::before {
            content: '';
            position: absolute;
            inset: 0;
            background: url('/texture-demonic.png') center/300px repeat;
            opacity: 0.03;
            pointer-events: none;
          }

          .dialog::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, var(--color-bronze), transparent);
            pointer-events: none;
          }

          .dialog-close {
            position: absolute;
            top: 0.75rem;
            right: 0.75rem;
            background: transparent;
            border: none;
            color: var(--color-text-secondary);
            cursor: pointer;
            padding: 0.25rem;
            transition: color 0.15s;
            z-index: 10;
          }

          .dialog-close:hover {
            color: var(--color-gold);
          }

          .dialog-title {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 1rem;
            font-weight: 600;
            margin: 0 0 1.25rem;
            color: var(--color-gold);
            position: relative;
          }

          .create-form,
          .session-created {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            text-align: center;
          }

          .info-text {
            color: var(--color-text-secondary);
            font-size: 0.875rem;
            line-height: 1.5;
            margin: 0;
          }

          .success-text {
            color: #86efac;
            font-size: 0.875rem;
            margin: 0;
          }

          .code-display {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 1rem;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid var(--color-gold-dark);
          }

          .code-value {
            font-family: var(--font-display);
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--color-gold);
            letter-spacing: 0.15em;
          }

          .copy-code-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            background: transparent;
            border: 1px solid var(--color-border);
            color: var(--color-text-secondary);
            cursor: pointer;
            transition: all 0.15s;
          }

          .copy-code-btn:hover {
            border-color: var(--color-bronze);
            color: var(--color-gold);
          }

          .hint-text {
            color: var(--color-text-muted);
            font-size: 0.8125rem;
            margin: 0;
          }

          .error-text {
            color: #fca5a5;
            font-size: 0.875rem;
            margin: 0;
          }

          .name-input {
            width: 100%;
            padding: 0.75rem 1rem;
            background: var(--color-bg-void);
            border: 1px solid var(--color-border);
            color: var(--color-text-primary);
            font-size: 0.9375rem;
            text-align: center;
          }

          .name-input::placeholder {
            color: var(--color-text-muted);
          }

          .name-input:focus {
            outline: none;
            border-color: var(--color-gold);
          }
        `}</style>
      </div>
    </div>
  );
}

interface JoinSessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (code: string, playerName: string) => Promise<'success' | 'not_found' | 'full' | 'error'>;
  t: TranslateFunction;
}

export function JoinSessionDialog({
  isOpen,
  onClose,
  onJoin,
  t,
}: JoinSessionDialogProps) {
  const [code, setCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Reset and focus when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCode('');
      setPlayerName('');
      setError(null);
      setTimeout(() => codeInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleJoin = async () => {
    if (!code.trim()) return;
    setIsJoining(true);
    setError(null);
    const result = await onJoin(code.trim(), playerName.trim());
    if (result === 'success') {
      onClose();
    } else if (result === 'full') {
      setError(t('toast_session_full'));
    } else if (result === 'not_found') {
      setError(t('err_session_not_found'));
    } else {
      setError(t('err_join_session'));
    }
    setIsJoining(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && code.trim()) {
      handleJoin();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <button className="dialog-close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        <h2 className="dialog-title">
          <Users size={20} />
          {t('dlg_join_session_title')}
        </h2>

        <div className="join-form">
          <input
            ref={codeInputRef}
            type="text"
            className="code-input"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            onKeyDown={handleKeyDown}
            placeholder={t('placeholder_session_code')}
            maxLength={6}
            autoComplete="off"
            spellCheck="false"
          />
          <input
            type="text"
            className="name-input"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('placeholder_player_name')}
            maxLength={8}
            autoComplete="off"
          />
          {error && <p className="error-text">{error}</p>}
          <DiabloButton
            variant="primary"
            onClick={handleJoin}
            disabled={code.trim().length < 6}
            loading={isJoining}
          >
            {t('btn_join')}
          </DiabloButton>
        </div>

        <style>{`
          .join-form {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
          }

          .code-input {
            width: 100%;
            padding: 0.75rem 1rem;
            background: var(--color-bg-void);
            border: 1px solid var(--color-border);
            color: var(--color-text-primary);
            font-family: var(--font-display);
            font-size: 1.25rem;
            text-align: center;
            letter-spacing: 0.2em;
            text-transform: uppercase;
          }

          .code-input::placeholder {
            color: var(--color-text-muted);
            letter-spacing: 0.05em;
            font-size: 0.875rem;
          }

          .code-input:focus {
            outline: none;
            border-color: var(--color-gold);
          }

          .name-input {
            width: 100%;
            padding: 0.75rem 1rem;
            background: var(--color-bg-void);
            border: 1px solid var(--color-border);
            color: var(--color-text-primary);
            font-size: 0.9375rem;
            text-align: center;
          }

          .name-input::placeholder {
            color: var(--color-text-muted);
          }

          .name-input:focus {
            outline: none;
            border-color: var(--color-gold);
          }
        `}</style>
      </div>
    </div>
  );
}
