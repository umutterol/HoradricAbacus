import { useState, useCallback, useMemo, useEffect } from 'react';
import { Sparkles, RotateCcw } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';
import { Header } from './components/Header';
import { MaterialGrid } from './components/MaterialGrid';
import { BossPrioritySelector } from './components/BossPrioritySelector';
import { ResultsPanel } from './components/ResultsPanel';
import { DiabloButton } from './components/DiabloButton';
import { ConfirmDialog } from './components/ConfirmDialog';
import { TutorialPopup } from './components/TutorialPopup';
import { Toast } from './components/Toast';
import { Footer } from './components/Footer';
import { ScreenshotUploader } from './components/ScreenshotUploader';
import { SessionBar } from './components/SessionBar';
import { CreateSessionDialog, JoinSessionDialog } from './components/SessionDialogs';
import { useLanguage } from './hooks/useLanguage';
import { useSession } from './hooks/useSession';
import { optimizeRota, createEmptyInventory, isInventoryEmpty } from './lib/optimizer';
import type { PlayerInventory, OptimizationResult } from './lib/optimizer';
import type { JokerPriority, MaterialKey } from './constants';

const STORAGE_KEY = 'horadric-abacus-state';
const STORAGE_VERSION = 1;

interface StoredState {
  version: number;
  inventories: PlayerInventory[];
  playerNames: string[];
  playerActive: boolean[];
  priority: JokerPriority;
}

function loadFromStorage(): Partial<StoredState> | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.version === STORAGE_VERSION) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to restore state from localStorage:', e);
  }
  return null;
}

function saveToStorage(state: Omit<StoredState, 'version'>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...state,
      version: STORAGE_VERSION,
    }));
  } catch (e) {
    console.warn('Failed to save state to localStorage:', e);
  }
}

function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear localStorage:', e);
  }
}

function App() {
  const { language, toggleLanguage, t } = useLanguage('en');
  const [sessionState, sessionActions] = useSession();

  // Local state (used in solo mode)
  const [inventories, setInventories] = useState<PlayerInventory[]>(() => {
    const stored = loadFromStorage();
    return stored?.inventories ?? [
      createEmptyInventory(),
      createEmptyInventory(),
      createEmptyInventory(),
      createEmptyInventory(),
    ];
  });

  const [playerNames, setPlayerNames] = useState<string[]>(() => {
    const stored = loadFromStorage();
    return stored?.playerNames ?? ['', '', '', ''];
  });

  const [playerActive, setPlayerActive] = useState<boolean[]>(() => {
    const stored = loadFromStorage();
    return stored?.playerActive ?? [true, true, true, true];
  });

  const [priority, setPriority] = useState<JokerPriority>(() => {
    const stored = loadFromStorage();
    return stored?.priority ?? 'duriel';
  });

  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showTutorialPopup, setShowTutorialPopup] = useState(false);
  const [screenshotPlayerIndex, setScreenshotPlayerIndex] = useState<number | null>(null);

  // Session dialog state
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [showJoinSession, setShowJoinSession] = useState(false);

  // Check if we're in collaborative mode
  const isCollaborative = sessionState.session !== null;

  // Handle URL parameter for auto-join
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionCode = params.get('session');

    if (sessionCode && !sessionState.session && sessionState.isSupabaseAvailable) {
      sessionActions.joinSession(sessionCode).then((success) => {
        if (success) {
          // Clear URL parameter after successful join
          window.history.replaceState({}, '', window.location.pathname);
          setToastMessage(t('txt_session_created'));
          setShowToast(true);
        }
      });
    }
  }, [sessionState.session, sessionState.isSupabaseAvailable, sessionActions, t]);

  // Save local state to storage (only in solo mode)
  useEffect(() => {
    if (!isCollaborative) {
      saveToStorage({ inventories, playerNames, playerActive, priority });
    }
  }, [inventories, playerNames, playerActive, priority, isCollaborative]);

  // Derive effective state based on mode
  const effectiveInventories = useMemo(() => {
    if (!isCollaborative) return inventories;
    return sessionState.players
      .sort((a, b) => a.slot - b.slot)
      .map((p) => p.inventory);
  }, [isCollaborative, sessionState.players, inventories]);

  const effectivePlayerNames = useMemo(() => {
    if (!isCollaborative) return playerNames;
    return sessionState.players
      .sort((a, b) => a.slot - b.slot)
      .map((p) => p.player_name);
  }, [isCollaborative, sessionState.players, playerNames]);

  const effectivePlayerActive = useMemo(() => {
    if (!isCollaborative) return playerActive;
    return sessionState.players
      .sort((a, b) => a.slot - b.slot)
      .map((p) => {
        // Active if: is_active flag is true AND (connected OR has manual data)
        const hasData = (p.player_name?.trim() !== '') || Object.values(p.inventory).some(v => v > 0);
        return p.is_active && (p.is_connected || hasData);
      });
  }, [isCollaborative, sessionState.players, playerActive]);

  const effectivePriority = useMemo(() => {
    if (!isCollaborative) return priority;
    return sessionState.session?.priority ?? 'duriel';
  }, [isCollaborative, sessionState.session, priority]);

  // Use session result if available
  const effectiveResult = useMemo(() => {
    if (!isCollaborative) return result;
    return sessionState.session?.result ?? result;
  }, [isCollaborative, sessionState.session, result]);

  const emptyPlayers = useMemo(
    () => effectiveInventories.map((inv) => isInventoryEmpty(inv)),
    [effectiveInventories]
  );

  const hasValidInput = useMemo(() => {
    return effectiveInventories.some(
      (inv, idx) => effectivePlayerActive[idx] && !isInventoryEmpty(inv)
    );
  }, [effectiveInventories, effectivePlayerActive]);

  // In collaborative mode with 2+ connected players, all must be ready to optimize
  const allConnectedReady = useMemo(() => {
    if (!isCollaborative) return true;
    const connectedPlayers = sessionState.players.filter((p) => p.is_connected);
    if (connectedPlayers.length <= 1) return true; // Solo in session doesn't need ready
    return connectedPlayers.every((p) => p.is_ready);
  }, [isCollaborative, sessionState.players]);

  const canOptimize = hasValidInput && allConnectedReady;

  const handleInventoryChange = useCallback(
    (playerIndex: number, material: MaterialKey | 'stygian', value: number) => {
      if (isCollaborative) {
        // In collaborative mode, can edit own slot or any editable slot
        if (playerIndex === sessionState.mySlot) {
          sessionActions.updateMyInventory(material, value);
        } else if (sessionActions.canEditSlot(playerIndex)) {
          sessionActions.updateSlotInventory(playerIndex, material, value);
        }
      } else {
        setInventories((prev) => {
          const next = [...prev];
          next[playerIndex] = { ...next[playerIndex], [material]: value };
          return next;
        });
      }
    },
    [isCollaborative, sessionState.mySlot, sessionActions]
  );

  const handlePlayerNameChange = useCallback(
    (playerIndex: number, name: string) => {
      if (isCollaborative) {
        if (playerIndex === sessionState.mySlot) {
          sessionActions.updateMyName(name);
        } else if (sessionActions.canEditSlot(playerIndex)) {
          sessionActions.updateSlotName(playerIndex, name);
        }
      } else {
        setPlayerNames((prev) => {
          const next = [...prev];
          next[playerIndex] = name;
          return next;
        });
      }
    },
    [isCollaborative, sessionState.mySlot, sessionActions]
  );

  const handlePlayerToggle = useCallback(
    (playerIndex: number) => {
      if (isCollaborative) {
        if (playerIndex === sessionState.mySlot) {
          sessionActions.toggleMyActive();
        }
      } else {
        setPlayerActive((prev) => {
          const next = [...prev];
          next[playerIndex] = !next[playerIndex];
          return next;
        });
      }
    },
    [isCollaborative, sessionState.mySlot, sessionActions]
  );

  const handlePriorityChange = useCallback(
    (newPriority: JokerPriority) => {
      if (isCollaborative) {
        sessionActions.updatePriority(newPriority);
      } else {
        setPriority(newPriority);
      }
    },
    [isCollaborative, sessionActions]
  );

  const handleOptimize = useCallback(() => {
    if (!hasValidInput) return;

    setIsLoading(true);

    setTimeout(() => {
      const activePlayerCount = effectivePlayerActive.filter(Boolean).length;
      const optimization = optimizeRota(
        effectiveInventories,
        effectivePriority,
        effectivePlayerActive,
        activePlayerCount
      );

      setResult(optimization);

      // Broadcast result to session if collaborative
      if (isCollaborative) {
        sessionActions.broadcastResult(optimization);
      }

      setIsLoading(false);
      setToastMessage(t('toast_optimized'));
      setShowToast(true);
    }, 300);
  }, [
    effectiveInventories,
    effectivePriority,
    effectivePlayerActive,
    hasValidInput,
    isCollaborative,
    sessionActions,
    t,
  ]);

  const handleResetRequest = useCallback(() => {
    setShowResetDialog(true);
  }, []);

  const handleResetConfirm = useCallback(() => {
    setInventories([
      createEmptyInventory(),
      createEmptyInventory(),
      createEmptyInventory(),
      createEmptyInventory(),
    ]);
    setPlayerActive([true, true, true, true]);
    setPlayerNames(['', '', '', '']);
    setResult(null);
    setShowResetDialog(false);
    clearStorage();
  }, []);

  const handleResetCancel = useCallback(() => {
    setShowResetDialog(false);
  }, []);

  const handleShowHelp = useCallback(() => {
    setShowTutorialPopup(true);
  }, []);

  const handleCloseTutorial = useCallback(() => {
    setShowTutorialPopup(false);
  }, []);

  const handleScreenshotUpload = useCallback((playerIndex: number) => {
    setScreenshotPlayerIndex(playerIndex);
  }, []);

  const handleScreenshotClose = useCallback(() => {
    setScreenshotPlayerIndex(null);
  }, []);

  const handleScreenshotApply = useCallback(
    (inventory: Partial<PlayerInventory>) => {
      if (screenshotPlayerIndex === null) return;

      if (isCollaborative && screenshotPlayerIndex === sessionState.mySlot) {
        // Apply each material to the session
        for (const [key, value] of Object.entries(inventory)) {
          if (value !== undefined) {
            sessionActions.updateMyInventory(key as MaterialKey | 'stygian', value);
          }
        }
      } else if (!isCollaborative) {
        setInventories((prev) => {
          const next = [...prev];
          next[screenshotPlayerIndex] = {
            ...next[screenshotPlayerIndex],
            ...inventory,
          };
          return next;
        });
      }
    },
    [screenshotPlayerIndex, isCollaborative, sessionState.mySlot, sessionActions]
  );

  const handleHideToast = useCallback(() => {
    setShowToast(false);
  }, []);

  const handleShowToast = useCallback((message: string) => {
    setToastMessage(message);
    setShowToast(true);
  }, []);

  // Session dialog handlers
  const handleShowCreateSession = useCallback(() => {
    setShowCreateSession(true);
  }, []);

  const handleShowJoinSession = useCallback(() => {
    setShowJoinSession(true);
  }, []);

  const handleCloseCreateSession = useCallback(() => {
    setShowCreateSession(false);
  }, []);

  const handleCloseJoinSession = useCallback(() => {
    setShowJoinSession(false);
  }, []);

  return (
    <div className="app">
      <Header
        language={language}
        onToggleLanguage={toggleLanguage}
        onShowHelp={handleShowHelp}
      />

      <SessionBar
        sessionState={sessionState}
        sessionActions={sessionActions}
        t={t}
        onShowCreateSession={handleShowCreateSession}
        onShowJoinSession={handleShowJoinSession}
        onShowToast={handleShowToast}
      />

      <main className="main" role="main" aria-label="Material optimizer">
        <div className="layout">
          {/* Input Panel */}
          <div className="panel panel--input">
            <MaterialGrid
              inventories={effectiveInventories}
              onInventoryChange={handleInventoryChange}
              playerActive={effectivePlayerActive}
              emptyPlayers={emptyPlayers}
              onPlayerToggle={handlePlayerToggle}
              playerNames={effectivePlayerNames}
              onNameChange={handlePlayerNameChange}
              onScreenshotUpload={handleScreenshotUpload}
              isCollaborative={isCollaborative}
              mySlot={sessionState.mySlot}
              players={sessionState.players}
              canEditSlot={isCollaborative ? sessionActions.canEditSlot : undefined}
              t={t}
            />

            <BossPrioritySelector
              priority={effectivePriority}
              onPriorityChange={handlePriorityChange}
              t={t}
            />

            {/* Actions */}
            <div className="actions">
              <p className="actions-hint">
                {!hasValidInput
                  ? t('txt_no_materials')
                  : !allConnectedReady
                    ? t('txt_all_ready_required')
                    : t('txt_no_materials')}
              </p>
              <div className="actions-buttons">
                <DiabloButton
                  variant="primary"
                  size="md"
                  onClick={handleOptimize}
                  disabled={!canOptimize}
                  loading={isLoading}
                  aria-label={t('btn_calculate')}
                >
                  <Sparkles size={16} aria-hidden="true" />
                  {t('btn_calculate')}
                </DiabloButton>
                {!isCollaborative && (
                  <DiabloButton
                    variant="secondary"
                    size="md"
                    onClick={handleResetRequest}
                    aria-label={t('btn_reset')}
                  >
                    <RotateCcw size={16} aria-hidden="true" />
                    {t('btn_reset')}
                  </DiabloButton>
                )}
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="panel panel--results">
            <ResultsPanel
              result={effectiveResult}
              playerNames={effectivePlayerNames}
              playerActive={effectivePlayerActive}
              t={t}
            />
          </div>
        </div>
      </main>

      <Footer />

      <ConfirmDialog
        isOpen={showResetDialog}
        onConfirm={handleResetConfirm}
        onCancel={handleResetCancel}
        t={t}
      />

      <TutorialPopup
        isOpen={showTutorialPopup}
        onClose={handleCloseTutorial}
        t={t}
      />

      <ScreenshotUploader
        isOpen={screenshotPlayerIndex !== null}
        onClose={handleScreenshotClose}
        onApply={handleScreenshotApply}
        playerIndex={screenshotPlayerIndex ?? 0}
        playerName={effectivePlayerNames[screenshotPlayerIndex ?? 0] || ''}
        t={t}
      />

      <CreateSessionDialog
        isOpen={showCreateSession}
        onClose={handleCloseCreateSession}
        onCreate={sessionActions.createSession}
        onShowToast={handleShowToast}
        t={t}
      />

      <JoinSessionDialog
        isOpen={showJoinSession}
        onClose={handleCloseJoinSession}
        onJoin={sessionActions.joinSession}
        t={t}
      />

      <Toast
        message={toastMessage}
        isVisible={showToast}
        onHide={handleHideToast}
      />

      <Analytics />

      <style>{`
        .app {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .main {
          flex: 1;
          padding: 1.5rem;
          display: flex;
          justify-content: center;
        }

        .layout {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 1.5rem;
          align-items: start;
          max-width: 1100px;
          width: 100%;
        }

        .panel {
          position: relative;
          background: linear-gradient(180deg, var(--color-bg-elevated) 0%, var(--color-bg-secondary) 100%);
          border: 1px solid var(--color-border);
          box-shadow: var(--shadow-lg);
          overflow: hidden;
        }

        .panel::before {
          content: '';
          position: absolute;
          inset: 0;
          background: url('/texture-demonic.png') center/400px repeat;
          opacity: 0.02;
          pointer-events: none;
        }

        .panel::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.04), transparent);
          pointer-events: none;
        }

        .panel--results {
          display: flex;
          flex-direction: column;
        }

        /* Actions Section */
        .actions {
          padding: 1.25rem;
          border-top: 1px solid var(--color-border-subtle);
          position: relative;
          z-index: 1;
        }

        .actions-hint {
          color: var(--color-text-muted);
          font-size: 0.875rem;
          text-align: center;
          margin: 0 0 1rem;
          font-style: italic;
        }

        .actions-buttons {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
        }

        /* Responsive */
        @media (max-width: 900px) {
          .layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .main {
            padding: 1rem;
          }

          .layout {
            gap: 1rem;
          }

          .actions-buttons {
            flex-direction: column;
          }

          .action-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
