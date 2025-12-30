import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { formatPrice, RUNE_NAMES } from '../lib/runes';
import type { WatchItem } from '../lib/types';
import './popup.css';

interface RunePrice {
  name: string;
  avg7d: number;
  change24h: number;
}

interface SavedSearch {
  name: string;
  filters: Record<string, string>;
}

function Popup() {
  const [activeTab, setActiveTab] = useState<'prices' | 'alerts' | 'searches'>('prices');
  const [prices, setPrices] = useState<RunePrice[]>([]);
  const [watchlist, setWatchlist] = useState<WatchItem[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // Load watchlist
      const watchlistResponse = await chrome.runtime.sendMessage({ type: 'GET_WATCHLIST' });
      if (watchlistResponse?.watchlist) {
        setWatchlist(watchlistResponse.watchlist);
      }

      // Load saved searches from storage
      const stored = await chrome.storage.sync.get(['savedSearches']);
      if (stored.savedSearches) {
        setSavedSearches(stored.savedSearches);
      }

      // Fetch current prices
      const pricesResponse = await chrome.runtime.sendMessage({ type: 'GET_ALL_PRICES' });
      if (pricesResponse?.prices) {
        setPrices(pricesResponse.prices);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function addToWatchlist(runeName: string, targetPrice: number) {
    const newItem: WatchItem = {
      runeName,
      targetPrice,
      alertEnabled: true,
    };

    await chrome.runtime.sendMessage({ type: 'ADD_TO_WATCHLIST', item: newItem });
    setWatchlist((prev) => [...prev.filter((w) => w.runeName !== runeName), newItem]);
  }

  async function removeFromWatchlist(runeName: string) {
    await chrome.runtime.sendMessage({ type: 'REMOVE_FROM_WATCHLIST', runeName });
    setWatchlist((prev) => prev.filter((w) => w.runeName !== runeName));
  }

  async function updateWatchlistItem(runeName: string, targetPrice: number) {
    const item = watchlist.find((w) => w.runeName === runeName);
    if (item) {
      await addToWatchlist(runeName, targetPrice);
    }
  }

  return (
    <div className="popup">
      <header className="popup-header">
        <img src="icons/icon48.png" alt="Horadric Abacus" />
        <h1>Horadric Abacus</h1>
      </header>

      <nav className="popup-tabs">
        <button
          className={activeTab === 'prices' ? 'active' : ''}
          onClick={() => setActiveTab('prices')}
        >
          Prices
        </button>
        <button
          className={activeTab === 'alerts' ? 'active' : ''}
          onClick={() => setActiveTab('alerts')}
        >
          Alerts ({watchlist.length})
        </button>
        <button
          className={activeTab === 'searches' ? 'active' : ''}
          onClick={() => setActiveTab('searches')}
        >
          Searches
        </button>
      </nav>

      <main className="popup-content">
        {activeTab === 'prices' && (
          <PricesTab
            prices={prices}
            loading={loading}
            onAddAlert={addToWatchlist}
            watchlist={watchlist}
          />
        )}
        {activeTab === 'alerts' && (
          <AlertsTab
            watchlist={watchlist}
            onRemove={removeFromWatchlist}
            onUpdate={updateWatchlistItem}
          />
        )}
        {activeTab === 'searches' && <SearchesTab searches={savedSearches} />}
      </main>

      <footer className="popup-footer">
        <span>Contributing price data</span>
        <span className="status-dot active" />
      </footer>
    </div>
  );
}

function PricesTab({
  prices,
  loading,
  onAddAlert,
  watchlist,
}: {
  prices: RunePrice[];
  loading: boolean;
  onAddAlert: (rune: string, price: number) => void;
  watchlist: WatchItem[];
}) {
  const [filter, setFilter] = useState('');

  // If no server data, show all runes with placeholder
  const displayPrices =
    prices.length > 0
      ? prices
      : RUNE_NAMES.map((name) => ({ name, avg7d: 0, change24h: 0 }));

  const filtered = displayPrices.filter((p) =>
    p.name.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) {
    return <div className="loading">Loading prices...</div>;
  }

  return (
    <div className="prices-tab">
      <input
        type="text"
        placeholder="Search runes..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="search-input"
      />

      <div className="price-list">
        {filtered.map((price) => (
          <div key={price.name} className="price-item">
            <div
              className="rune-icon"
              style={{
                background: `linear-gradient(135deg, #2a2a4e 0%, #1a1a3e 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#f59e0b',
              }}
            >
              {price.name.slice(0, 2)}
            </div>
            <div className="price-info">
              <span className="rune-name">{price.name}</span>
              <span className="rune-price">
                {price.avg7d > 0 ? formatPrice(price.avg7d) : 'No data'}
              </span>
            </div>
            {price.avg7d > 0 && (
              <span className={`price-change ${price.change24h >= 0 ? 'up' : 'down'}`}>
                {price.change24h >= 0 ? '+' : ''}
                {price.change24h.toFixed(1)}%
              </span>
            )}
            <button
              className="alert-btn"
              onClick={() => onAddAlert(price.name, Math.round(price.avg7d * 0.9) || 100000000)}
              disabled={watchlist.some((w) => w.runeName === price.name)}
              title={
                watchlist.some((w) => w.runeName === price.name)
                  ? 'Already watching'
                  : 'Add price alert'
              }
            >
              {watchlist.some((w) => w.runeName === price.name) ? '✓' : '🔔'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AlertsTab({
  watchlist,
  onRemove,
  onUpdate,
}: {
  watchlist: WatchItem[];
  onRemove: (rune: string) => void;
  onUpdate: (rune: string, price: number) => void;
}) {
  if (watchlist.length === 0) {
    return (
      <div className="empty-state">
        <p>No price alerts set.</p>
        <p>Add alerts from the Prices tab to get notified when items drop below your target.</p>
      </div>
    );
  }

  return (
    <div className="alerts-tab">
      <div className="alert-list">
        {watchlist.map((item) => (
          <div key={item.runeName} className="alert-item">
            <div
              className="rune-icon"
              style={{
                background: `linear-gradient(135deg, #2a2a4e 0%, #1a1a3e 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#f59e0b',
              }}
            >
              {item.runeName.slice(0, 2)}
            </div>
            <div className="alert-info">
              <span className="rune-name">{item.runeName}</span>
              <input
                type="number"
                value={item.targetPrice}
                onChange={(e) => onUpdate(item.runeName, parseInt(e.target.value) || 0)}
                className="target-input"
                placeholder="Target price"
              />
            </div>
            <button className="remove-btn" onClick={() => onRemove(item.runeName)}>
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SearchesTab({ searches }: { searches: SavedSearch[] }) {
  function openSearch(filters: Record<string, string>) {
    const params = new URLSearchParams(filters);
    params.set('mode', 'season-softcore');
    const url = `https://diablo.trade/listings/items?${params.toString()}`;
    chrome.tabs.create({ url });
  }

  if (searches.length === 0) {
    return (
      <div className="empty-state">
        <p>No saved searches.</p>
        <p>Save frequently used filter combinations from diablo.trade for quick access.</p>
      </div>
    );
  }

  return (
    <div className="searches-tab">
      <div className="search-list">
        {searches.map((search, i) => (
          <div key={i} className="search-item">
            <span className="search-name">{search.name}</span>
            <button onClick={() => openSearch(search.filters)}>Open</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Mount React app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
}
