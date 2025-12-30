// Rune listing data collected from diablo.trade
export interface ListingData {
  itemName: string;
  price: number;
  currency: 'gold';
  listingType: 'sell' | 'buy';
  timestamp: number;
  pageUrl: string;
  domContext: string; // HTML snippet for server-side validation
}

// Batch of reports sent to backend
export interface PriceReport {
  installId: string;
  reports: ListingData[];
  sessionFingerprint: string;
  submittedAt: number;
}

// Price history data from backend
export interface PriceHistory {
  runeName: string;
  avg7d: number;
  min7d: number;
  max7d: number;
  pricePoints: Array<{ date: string; price: number }>;
}

// User's watchlist item
export interface WatchItem {
  runeName: string;
  targetPrice: number;
  alertEnabled: boolean;
}

// Saved search configuration
export interface SavedSearch {
  id: string;
  name: string;
  filters: {
    runeName?: string;
    minPrice?: number;
    maxPrice?: number;
    listingType?: 'sell' | 'buy';
  };
  createdAt: number;
}

// Message types for extension communication
export type MessageType =
  | { type: 'PRICE_DATA_COLLECTED'; listings: ListingData[] }
  | { type: 'GET_PRICE_HISTORY'; runeName: string }
  | { type: 'GET_ALL_PRICES' }
  | { type: 'CHECK_DEAL_ALERTS'; listings: ListingData[] }
  | { type: 'ADD_TO_WATCHLIST'; item: WatchItem }
  | { type: 'REMOVE_FROM_WATCHLIST'; runeName: string }
  | { type: 'GET_WATCHLIST' };

// Response types
export interface PriceHistoryResponse extends PriceHistory {}

export interface AllPricesResponse {
  prices: Array<{
    name: string;
    avg7d: number;
    change24h: number;
  }>;
}

export interface AlertsResponse {
  alerts: string[];
}
