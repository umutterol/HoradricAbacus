import { useState, useCallback, useMemo, useEffect } from 'react';
import { Sparkles, RotateCcw } from 'lucide-react';
import { Header } from './components/Header';
import { MaterialGrid } from './components/MaterialGrid';
import { BossPrioritySelector } from './components/BossPrioritySelector';
import { ResultsPanel } from './components/ResultsPanel';
import { DiabloButton } from './components/DiabloButton';
import { ConfirmDialog } from './components/ConfirmDialog';
import { TutorialPopup } from './components/TutorialPopup';
import { Toast } from './components/Toast';
import { Footer } from './components/Footer';
import { useLanguage } from './hooks/useLanguage';
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
  const [showTutorialPopup, setShowTutorialPopup] = useState(false);

  useEffect(() => {
    saveToStorage({ inventories, playerNames, playerActive, priority });
  }, [inventories, playerNames, playerActive, priority]);

  const emptyPlayers = useMemo(() =>
    inventories.map(inv => isInventoryEmpty(inv)),
    [inventories]
  );

  const hasValidInput = useMemo(() => {
    return inventories.some((inv, idx) =>
      playerActive[idx] && !isInventoryEmpty(inv)
    );
  }, [inventories, playerActive]);

  const handleInventoryChange = useCallback((
    playerIndex: number,
    material: MaterialKey | 'stygian',
    value: number
  ) => {
    setInventories(prev => {
      const next = [...prev];
      next[playerIndex] = { ...next[playerIndex], [material]: value };
      return next;
    });
  }, []);

  const handlePlayerNameChange = useCallback((playerIndex: number, name: string) => {
    setPlayerNames(prev => {
      const next = [...prev];
      next[playerIndex] = name;
      return next;
    });
  }, []);

  const handlePlayerToggle = useCallback((playerIndex: number) => {
    setPlayerActive(prev => {
      const next = [...prev];
      next[playerIndex] = !next[playerIndex];
      return next;
    });
  }, []);

  const handleOptimize = useCallback(() => {
    if (!hasValidInput) return;

    setIsLoading(true);

    setTimeout(() => {
      const activePlayerCount = playerActive.filter(Boolean).length;
      const optimization = optimizeRota(inventories, priority, playerActive, activePlayerCount);
      setResult(optimization);
      setIsLoading(false);
      setShowToast(true);
    }, 300);
  }, [inventories, priority, playerActive, hasValidInput]);

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

  const handleHideToast = useCallback(() => {
    setShowToast(false);
  }, []);

  return (
    <div className="app">
      <Header
        language={language}
        onToggleLanguage={toggleLanguage}
        onShowHelp={handleShowHelp}
      />

      <main className="main" role="main" aria-label="Material optimizer">
        <div className="layout">
          {/* Input Panel */}
          <div className="panel panel--input">
            <MaterialGrid
              inventories={inventories}
              onInventoryChange={handleInventoryChange}
              playerActive={playerActive}
              emptyPlayers={emptyPlayers}
              onPlayerToggle={handlePlayerToggle}
              playerNames={playerNames}
              onNameChange={handlePlayerNameChange}
              t={t}
            />

            <BossPrioritySelector
              priority={priority}
              onPriorityChange={setPriority}
              t={t}
            />

            {/* Actions */}
            <div className="actions">
              <p className="actions-hint">{t('txt_no_materials')}</p>
              <div className="actions-buttons">
                <DiabloButton
                  variant="primary"
                  size="md"
                  onClick={handleOptimize}
                  disabled={!hasValidInput}
                  loading={isLoading}
                  aria-label={t('btn_calculate')}
                >
                  <Sparkles size={16} aria-hidden="true" />
                  {t('btn_calculate')}
                </DiabloButton>
                <DiabloButton
                  variant="secondary"
                  size="md"
                  onClick={handleResetRequest}
                  aria-label={t('btn_reset')}
                >
                  <RotateCcw size={16} aria-hidden="true" />
                  {t('btn_reset')}
                </DiabloButton>
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="panel panel--results">
            <ResultsPanel
              result={result}
              playerNames={playerNames}
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

      <Toast
        message={t('toast_optimized')}
        isVisible={showToast}
        onHide={handleHideToast}
      />

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
          min-height: 400px;
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

          .panel--results {
            min-height: 300px;
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
