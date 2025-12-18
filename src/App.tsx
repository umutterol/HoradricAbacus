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

  // Initialize state from localStorage or defaults
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

  // Save to localStorage whenever relevant state changes
  useEffect(() => {
    saveToStorage({ inventories, playerNames, playerActive, priority });
  }, [inventories, playerNames, playerActive, priority]);

  // Calculate which players have empty inventories
  const emptyPlayers = useMemo(() =>
    inventories.map(inv => isInventoryEmpty(inv)),
    [inventories]
  );

  // Check if there's any valid input for optimization
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

    // Small delay to show loading state
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

      <main className="main-content" role="main" aria-label="Material optimizer">
        <div className="content-grid">
          {/* Left Column - Inputs */}
          <div className="input-panel card">
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

            {/* Validation message */}
            {!hasValidInput && (
              <p className="validation-message" role="alert">
                {t('txt_no_materials')}
              </p>
            )}

            <div className="action-buttons">
              <DiabloButton
                variant="primary"
                size="lg"
                onClick={handleOptimize}
                loading={isLoading}
                disabled={!hasValidInput}
                aria-label={t('btn_calculate')}
              >
                <Sparkles size={18} aria-hidden="true" />
                {t('btn_calculate')}
              </DiabloButton>
              <DiabloButton
                variant="secondary"
                size="lg"
                onClick={handleResetRequest}
                aria-label={t('btn_reset')}
              >
                <RotateCcw size={18} aria-hidden="true" />
                {t('btn_reset')}
              </DiabloButton>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="results-panel-container">
            <ResultsPanel
              result={result}
              playerNames={playerNames}
              t={t}
            />
          </div>
        </div>
      </main>

      <Footer />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showResetDialog}
        onConfirm={handleResetConfirm}
        onCancel={handleResetCancel}
        t={t}
      />

      {/* Tutorial Popup */}
      <TutorialPopup
        isOpen={showTutorialPopup}
        onClose={handleCloseTutorial}
        t={t}
      />

      {/* Success Toast */}
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

        .main-content {
          flex: 1;
          padding: 1rem;
          display: flex;
          justify-content: center;
        }

        .content-grid {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 1rem;
          align-items: stretch;
          max-width: 1200px;
          width: 100%;
        }

        .input-panel {
          min-width: 360px;
        }

        .results-panel-container {
          min-width: 280px;
          display: flex;
          flex-direction: column;
        }

        .validation-message {
          color: var(--color-text-secondary);
          font-size: 0.875rem;
          text-align: center;
          margin: 0;
          padding: 0.75rem 1.25rem;
          font-style: italic;
          border-top: 1px solid var(--color-border);
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
          padding: 1.25rem;
          justify-content: center;
          flex-wrap: wrap;
          border-top: 1px solid var(--color-border);
        }

        .action-buttons .btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          justify-content: center;
          min-width: 110px;
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
        }

        /* Stack vertically on smaller screens */
        @media (max-width: 800px) {
          .content-grid {
            grid-template-columns: 1fr;
          }

          .input-panel {
            min-width: auto;
          }

          .results-panel-container {
            min-width: auto;
          }
        }

        @media (max-width: 480px) {
          .main-content {
            padding: 0.75rem;
          }

          .action-buttons {
            flex-direction: column;
          }

          .action-buttons .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
