/**
 * Content Script - runs in isolated context with access to chrome APIs
 * Bridges between injected page script and background service worker
 */

import { extractRuneName, parsePrice, RUNE_NAMES } from '../lib/runes';
import type { ListingData } from '../lib/types';

// Inject the fetch interceptor into the page context
function injectInterceptor(): void {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected.js');
  script.onload = function () {
    script.remove();
  };
  (document.head || document.documentElement).appendChild(script);
}

// Listen for intercepted data from the injected script
window.addEventListener('message', (event) => {
  if (event.source !== window) return;

  if (
    event.data?.type === 'HORADRIC_FETCH_INTERCEPT' ||
    event.data?.type === 'HORADRIC_XHR_INTERCEPT'
  ) {
    processInterceptedData(event.data.url, event.data.data);
  }
});

// Process intercepted API response
function processInterceptedData(url: string, data: unknown): void {
  const listings = extractRuneListings(data);

  if (listings.length > 0) {
    console.log(`[Horadric] Extracted ${listings.length} rune listings from ${url}`);

    // Enrich with DOM context for validation
    const enrichedListings: ListingData[] = listings.map((listing) => ({
      ...listing,
      domContext: captureDOMContext(listing.itemName),
      pageUrl: window.location.href,
      timestamp: Date.now(),
    }));

    // Send to background worker
    chrome.runtime.sendMessage({
      type: 'PRICE_DATA_COLLECTED',
      listings: enrichedListings,
    });
  }
}

// Extract rune listings from API response
function extractRuneListings(data: unknown): Partial<ListingData>[] {
  const listings: Partial<ListingData>[] = [];

  if (!data) return listings;

  // Handle array response
  if (Array.isArray(data)) {
    for (const item of data) {
      const listing = extractFromItem(item);
      if (listing) listings.push(listing);
    }
    return listings;
  }

  // Handle object with listings array
  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>;

    // Check common response patterns
    const possibleArrays = ['listings', 'items', 'data', 'results'];
    for (const key of possibleArrays) {
      if (Array.isArray(obj[key])) {
        for (const item of obj[key] as unknown[]) {
          const listing = extractFromItem(item);
          if (listing) listings.push(listing);
        }
        if (listings.length > 0) return listings;
      }
    }

    // Try the object itself as a single item
    const listing = extractFromItem(data);
    if (listing) listings.push(listing);
  }

  return listings;
}

// Extract listing data from a single item
function extractFromItem(item: unknown): Partial<ListingData> | null {
  if (!item || typeof item !== 'object') return null;

  const obj = item as Record<string, unknown>;

  // Try to find item name
  const nameFields = ['itemName', 'name', 'item_name', 'exactItem'];
  let itemName = '';
  for (const field of nameFields) {
    if (typeof obj[field] === 'string') {
      itemName = obj[field] as string;
      break;
    }
    // Check nested item object
    if (obj.item && typeof obj.item === 'object') {
      const nested = obj.item as Record<string, unknown>;
      if (typeof nested[field] === 'string') {
        itemName = nested[field] as string;
        break;
      }
    }
  }

  // Check if it's a rune
  const runeName = extractRuneName(itemName);
  if (!runeName) return null;

  // Try to find price
  const priceFields = ['rawPrice', 'price', 'exactPrice', 'gold', 'amount'];
  let price = 0;
  for (const field of priceFields) {
    if (obj[field] !== undefined) {
      price = parsePrice(obj[field]);
      if (price > 0) break;
    }
  }

  // Must have a valid price (at least 1M gold)
  if (price < 1000000) return null;

  // Determine listing type
  const listingType: 'sell' | 'buy' =
    obj.listingMode === 'BUYING' || obj.type === 'buy' ? 'buy' : 'sell';

  return {
    itemName: runeName,
    price,
    currency: 'gold',
    listingType,
  };
}

// Capture DOM context around a rune name for server-side validation
function captureDOMContext(itemName: string): string {
  // Find elements containing the item name
  const allElements = document.querySelectorAll('article, [class*="listing"], [class*="card"]');

  for (const el of allElements) {
    if (el.textContent?.toLowerCase().includes(itemName.toLowerCase())) {
      // Return sanitized HTML snippet (limit to 500 chars)
      const html = el.innerHTML
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove styles
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      return html.slice(0, 500);
    }
  }

  return '';
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectInterceptor);
} else {
  injectInterceptor();
}

// Export for type checking (not actually used at runtime)
export {};
