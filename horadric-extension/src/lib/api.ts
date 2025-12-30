import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { ListingData, PriceHistory, WatchItem } from './types';

// Configuration - these will be set up when deploying
// For development, you can hardcode or use a config file
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

let supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
  if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
    console.warn('[Horadric] Supabase not configured - data collection disabled');
    return null;
  }

  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabase;
}

// Get or create anonymous installation UUID
export async function getInstallId(): Promise<string> {
  const result = await chrome.storage.local.get('installId');
  if (result.installId) return result.installId;

  const newId = crypto.randomUUID();
  await chrome.storage.local.set({ installId: newId });
  return newId;
}

// Generate session fingerprint for behavioral analysis
export async function getSessionFingerprint(): Promise<string> {
  const result = await chrome.storage.session.get(['sessionStart', 'pageViews']);
  const sessionStart = result.sessionStart || Date.now();

  if (!result.sessionStart) {
    await chrome.storage.session.set({ sessionStart });
  }

  return JSON.stringify({
    sessionStart,
    browsingSince: Date.now() - sessionStart,
    pageViews: result.pageViews || 0,
  });
}

// Increment page view counter
export async function incrementPageViews(): Promise<void> {
  const result = await chrome.storage.session.get('pageViews');
  const pageViews = (result.pageViews || 0) + 1;
  await chrome.storage.session.set({ pageViews });
}

// Submit price reports to backend
export async function submitPriceReports(reports: ListingData[]): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client || reports.length === 0) return false;

  const installId = await getInstallId();
  const sessionFingerprint = await getSessionFingerprint();

  try {
    const { error } = await client.from('price_reports').insert({
      install_id: installId,
      reports: reports,
      session_fingerprint: sessionFingerprint,
      submitted_at: new Date().toISOString(),
      user_agent: navigator.userAgent,
      report_count: reports.length,
    });

    if (error) {
      console.error('[Horadric] Failed to submit reports:', error);
      return false;
    }

    console.log(`[Horadric] Submitted ${reports.length} price reports`);
    return true;
  } catch (err) {
    console.error('[Horadric] Submission error:', err);
    return false;
  }
}

// Fetch price history for a rune
export async function fetchPriceHistory(runeName: string): Promise<PriceHistory | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await client
      .from('verified_prices')
      .select('average_price, min_price, max_price, verified_at')
      .eq('rune_name', runeName)
      .gte('verified_at', sevenDaysAgo)
      .order('verified_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return null;
    }

    const prices = data.map(d => d.average_price);

    return {
      runeName,
      avg7d: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      min7d: Math.min(...data.map(d => d.min_price)),
      max7d: Math.max(...data.map(d => d.max_price)),
      pricePoints: data.map(d => ({
        date: d.verified_at,
        price: d.average_price,
      })),
    };
  } catch (err) {
    console.error('[Horadric] Error fetching price history:', err);
    return null;
  }
}

// Fetch all current prices
export async function fetchAllPrices(): Promise<Array<{ name: string; avg7d: number; change24h: number }>> {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    // Get latest prices
    const { data: latestData, error: latestError } = await client
      .from('verified_prices')
      .select('rune_name, average_price, verified_at')
      .gte('verified_at', oneDayAgo)
      .order('verified_at', { ascending: false });

    if (latestError || !latestData) return [];

    // Get previous day prices for change calculation
    const { data: prevData } = await client
      .from('verified_prices')
      .select('rune_name, average_price')
      .gte('verified_at', twoDaysAgo)
      .lt('verified_at', oneDayAgo)
      .order('verified_at', { ascending: false });

    // Build price map (latest price per rune)
    const latestByRune = new Map<string, number>();
    for (const item of latestData) {
      if (!latestByRune.has(item.rune_name)) {
        latestByRune.set(item.rune_name, item.average_price);
      }
    }

    // Build previous day map
    const prevByRune = new Map<string, number>();
    if (prevData) {
      for (const item of prevData) {
        if (!prevByRune.has(item.rune_name)) {
          prevByRune.set(item.rune_name, item.average_price);
        }
      }
    }

    // Calculate changes
    const results: Array<{ name: string; avg7d: number; change24h: number }> = [];
    for (const [name, price] of latestByRune) {
      const prevPrice = prevByRune.get(name);
      const change24h = prevPrice ? ((price - prevPrice) / prevPrice) * 100 : 0;
      results.push({ name, avg7d: price, change24h });
    }

    return results.sort((a, b) => b.avg7d - a.avg7d);
  } catch (err) {
    console.error('[Horadric] Error fetching all prices:', err);
    return [];
  }
}

// Save watchlist to Supabase (synced across devices)
export async function saveWatchlist(watchlist: WatchItem[]): Promise<void> {
  const client = getSupabaseClient();
  if (!client) {
    // Fallback to local storage only
    await chrome.storage.sync.set({ watchlist });
    return;
  }

  const installId = await getInstallId();

  try {
    // Delete existing watchlist items
    await client.from('user_watchlists').delete().eq('install_id', installId);

    // Insert new items
    if (watchlist.length > 0) {
      await client.from('user_watchlists').insert(
        watchlist.map(item => ({
          install_id: installId,
          rune_name: item.runeName,
          target_price: item.targetPrice,
          alert_enabled: item.alertEnabled,
        }))
      );
    }
  } catch (err) {
    console.error('[Horadric] Error saving watchlist:', err);
  }

  // Also save locally for offline access
  await chrome.storage.sync.set({ watchlist });
}

// Load watchlist
export async function loadWatchlist(): Promise<WatchItem[]> {
  const client = getSupabaseClient();

  // Try loading from Supabase first
  if (client) {
    try {
      const installId = await getInstallId();
      const { data, error } = await client
        .from('user_watchlists')
        .select('rune_name, target_price, alert_enabled')
        .eq('install_id', installId);

      if (!error && data && data.length > 0) {
        return data.map(item => ({
          runeName: item.rune_name,
          targetPrice: item.target_price,
          alertEnabled: item.alert_enabled,
        }));
      }
    } catch (err) {
      console.error('[Horadric] Error loading watchlist from server:', err);
    }
  }

  // Fallback to local storage
  const result = await chrome.storage.sync.get('watchlist');
  return result.watchlist || [];
}
