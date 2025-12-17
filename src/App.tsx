import { useState, useCallback, useMemo } from 'react';
import { Sparkles, RotateCcw } from 'lucide-react';
import { Header } from './components/Header';
import { MaterialGrid } from './components/MaterialGrid';
import { BossPrioritySelector } from './components/BossPrioritySelector';
import { ResultsPanel } from './components/ResultsPanel';
import { DiabloButton } from './components/DiabloButton';
import { useLanguage } from './hooks/useLanguage';
import { optimizeRota, createEmptyInventory, isInventoryEmpty } from './lib/optimizer';
import type { PlayerInventory, OptimizationResult } from './lib/optimizer';
import type { JokerPriority, MaterialKey } from './constants';

function App() {
  const { language, toggleLanguage, t } = useLanguage('en');
  const [inventories, setInventories] = useState<PlayerInventory[]>([
    createEmptyInventory(),
    createEmptyInventory(),
    createEmptyInventory(),
    createEmptyInventory(),
  ]);
  const [playerNames, setPlayerNames] = useState<string[]>(['', '', '', '']);
  const [playerActive, setPlayerActive] = useState<boolean[]>([true, true, true, true]);
  const [priority, setPriority] = useState<JokerPriority>('duriel');
  const [result, setResult] = useState<OptimizationResult | null>(null);

  // Calculate which players have empty inventories
  const emptyPlayers = useMemo(() =>
    inventories.map(inv => isInventoryEmpty(inv)),
    [inventories]
  );

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
    // Get number of active players
    const activePlayerCount = playerActive.filter(Boolean).length;
    const optimization = optimizeRota(inventories, priority, playerActive, activePlayerCount);
    setResult(optimization);
  }, [inventories, priority, playerActive]);

  const handleReset = useCallback(() => {
    setInventories([
      createEmptyInventory(),
      createEmptyInventory(),
      createEmptyInventory(),
      createEmptyInventory(),
    ]);
    setPlayerActive([true, true, true, true]);
    setPlayerNames(['', '', '', '']);
    setResult(null);
  }, []);

  return (
    <div className="app">
      <Header
        language={language}
        onToggleLanguage={toggleLanguage}
      />

      <main className="main-content">
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

            <div className="action-buttons">
              <DiabloButton variant="primary" size="lg" onClick={handleOptimize}>
                <Sparkles size={18} />
                {t('btn_calculate')}
              </DiabloButton>
              <DiabloButton variant="secondary" size="lg" onClick={handleReset}>
                <RotateCcw size={18} />
                {t('btn_reset')}
              </DiabloButton>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="results-panel-container">
            <ResultsPanel result={result} playerNames={playerNames} t={t} />
          </div>
        </div>
      </main>

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
          align-items: start;
          max-width: 1200px;
          width: 100%;
        }
        
        .input-panel {
          min-width: 360px;
        }
        
        .results-panel-container {
          min-width: 280px;
        }
        
        .action-buttons {
          display: flex;
          gap: 1rem;
          padding: 1.25rem;
          justify-content: center;
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
