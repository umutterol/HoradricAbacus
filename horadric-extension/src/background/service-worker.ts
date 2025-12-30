/**
 * Background Service Worker
 * Handles price report batching, submission, and deal alerts
 */

import {
  submitPriceReports,
  fetchPriceHistory,
  fetchAllPrices,
  loadWatchlist,
  saveWatchlist,
  incrementPageViews,
} from '../lib/api';
import { formatPrice } from '../lib/runes';
import type { ListingData, WatchItem, MessageType } from '../lib/types';

// Buffer for batching submissions
let pendingReports: ListingData[] = [];
let lastSubmission = 0;
const BATCH_SIZE = 20;
const BATCH_INTERVAL_MS = 30000; // 30 seconds

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message: MessageType, _sender, sendResponse) => {
  handleMessage(message, sendResponse);
  return true; // Keep channel open for async response
});

async function handleMessage(
  message: MessageType,
  sendResponse: (response: unknown) => void
): Promise<void> {
  switch (message.type) {
    case 'PRICE_DATA_COLLECTED':
      await handlePriceDataCollected(message.listings);
      sendResponse({ success: true });
      break;

    case 'GET_PRICE_HISTORY':
      const history = await fetchPriceHistory(message.runeName);
      sendResponse(history);
      break;

    case 'GET_ALL_PRICES':
      const prices = await fetchAllPrices();
      sendResponse({ prices });
      break;

    case 'CHECK_DEAL_ALERTS':
      const alerts = await checkDealAlerts(message.listings);
      sendResponse({ alerts });
      break;

    case 'ADD_TO_WATCHLIST':
      await addToWatchlist(message.item);
      sendResponse({ success: true });
      break;

    case 'REMOVE_FROM_WATCHLIST':
      await removeFromWatchlist(message.runeName);
      sendResponse({ success: true });
      break;

    case 'GET_WATCHLIST':
      const watchlist = await loadWatchlist();
      sendResponse({ watchlist });
      break;

    default:
      sendResponse({ error: 'Unknown message type' });
  }
}

// Handle incoming price data
async function handlePriceDataCollected(listings: ListingData[]): Promise<void> {
  pendingReports.push(...listings);

  // Check if we should submit
  const shouldSubmit =
    pendingReports.length >= BATCH_SIZE ||
    Date.now() - lastSubmission > BATCH_INTERVAL_MS;

  if (shouldSubmit) {
    await submitBatch();
  }

  // Also check for deal alerts
  await checkDealAlerts(listings);
}

// Submit batched reports
async function submitBatch(): Promise<void> {
  if (pendingReports.length === 0) return;

  const reportsToSubmit = [...pendingReports];
  pendingReports = [];
  lastSubmission = Date.now();

  const success = await submitPriceReports(reportsToSubmit);

  if (!success && pendingReports.length < 100) {
    // Re-add failed reports (with limit to prevent memory issues)
    pendingReports.unshift(...reportsToSubmit);
  }
}

// Check for deal alerts
async function checkDealAlerts(listings: ListingData[]): Promise<string[]> {
  const watchlist = await loadWatchlist();
  if (watchlist.length === 0) return [];

  const alerts: string[] = [];

  for (const watch of watchlist) {
    if (!watch.alertEnabled) continue;

    const matching = listings.filter(
      (l) =>
        l.itemName.toLowerCase() === watch.runeName.toLowerCase() &&
        l.listingType === 'sell' &&
        l.price <= watch.targetPrice
    );

    if (matching.length > 0) {
      const best = matching.reduce((a, b) => (a.price < b.price ? a : b));
      const alertMsg = `${watch.runeName} at ${formatPrice(best.price)} (target: ${formatPrice(watch.targetPrice)})`;
      alerts.push(alertMsg);

      // Show notification
      await showNotification(
        `Deal Alert: ${watch.runeName}`,
        `Found at ${formatPrice(best.price)}! (Your target: ${formatPrice(watch.targetPrice)})`
      );
    }
  }

  return alerts;
}

// Show browser notification
async function showNotification(title: string, message: string): Promise<void> {
  try {
    await chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon128.png'),
      title: title,
      message: message,
      priority: 2,
    });
  } catch (err) {
    console.error('[Horadric] Failed to show notification:', err);
  }
}

// Watchlist management
async function addToWatchlist(item: WatchItem): Promise<void> {
  const watchlist = await loadWatchlist();
  const filtered = watchlist.filter((w) => w.runeName !== item.runeName);
  filtered.push(item);
  await saveWatchlist(filtered);
}

async function removeFromWatchlist(runeName: string): Promise<void> {
  const watchlist = await loadWatchlist();
  const filtered = watchlist.filter((w) => w.runeName !== runeName);
  await saveWatchlist(filtered);
}

// Set up periodic alarm for batch submission
chrome.alarms.create('submitBatch', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'submitBatch') {
    submitBatch();
  }
});

// Track page views when user navigates diablo.trade
chrome.webNavigation?.onCompleted.addListener(
  (details) => {
    if (details.frameId === 0) {
      // Main frame only
      incrementPageViews();
    }
  },
  { url: [{ hostContains: 'diablo.trade' }] }
);

// Log startup
console.log('[Horadric Abacus] Background service worker started');
