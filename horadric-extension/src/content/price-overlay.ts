/**
 * Price Overlay Content Script
 * Injects price history badges and tooltips onto diablo.trade listing pages
 */

import { extractRuneName, formatPrice } from '../lib/runes';
import type { PriceHistory } from '../lib/types';

// Initialize price overlay
function initPriceOverlay(): void {
  // Watch for DOM changes (diablo.trade uses dynamic content)
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        injectPriceBadges();
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Initial injection
  setTimeout(injectPriceBadges, 1000);
}

// Inject price badges onto listing cards
async function injectPriceBadges(): Promise<void> {
  // Find all listing cards
  const listings = document.querySelectorAll(
    'article, [class*="listing"], [class*="card"], [class*="item-row"]'
  );

  for (const listing of listings) {
    // Skip if already processed
    if (listing.hasAttribute('data-horadric-enhanced')) continue;
    listing.setAttribute('data-horadric-enhanced', 'true');

    // Find item name element
    const nameEl = listing.querySelector(
      '[class*="item-name"], [class*="name"], h3, h4, .title'
    );
    if (!nameEl) continue;

    const itemName = nameEl.textContent?.trim() || '';
    const runeName = extractRuneName(itemName);
    if (!runeName) continue;

    // Create and inject badge
    const badge = await createPriceBadge(runeName);
    if (badge) {
      // Insert after the name element
      if (nameEl.parentElement) {
        nameEl.parentElement.style.position = 'relative';
        nameEl.after(badge);
      }
    }
  }
}

// Create a price badge element
async function createPriceBadge(runeName: string): Promise<HTMLElement | null> {
  // Fetch price history from background
  const priceData = await fetchPriceHistory(runeName);

  // Create badge element
  const badge = document.createElement('div');
  badge.className = 'horadric-price-badge';

  if (!priceData || priceData.avg7d === 0) {
    badge.innerHTML = `
      <span class="badge-icon">📊</span>
      <span class="badge-text">No data</span>
    `;
    badge.title = 'No price history available yet';
    return badge;
  }

  // Calculate if current listing is a good deal
  const currentPriceEl = badge.closest('[data-horadric-enhanced]')?.querySelector(
    '[class*="price"], [class*="gold"]'
  );
  const currentPriceText = currentPriceEl?.textContent || '';
  const currentPriceMatch = currentPriceText.match(/(\d+(?:[.,]\d+)?)\s*([KMB])?/i);

  let isGoodDeal = false;
  if (currentPriceMatch) {
    let currentPrice = parseFloat(currentPriceMatch[1].replace(/,/g, ''));
    const suffix = currentPriceMatch[2]?.toUpperCase();
    if (suffix === 'K') currentPrice *= 1000;
    else if (suffix === 'M') currentPrice *= 1000000;
    else if (suffix === 'B') currentPrice *= 1000000000;

    isGoodDeal = currentPrice < priceData.avg7d * 0.9; // 10% below average
  }

  badge.innerHTML = `
    <span class="badge-icon">📊</span>
    <span class="badge-text">7d: ${formatPrice(priceData.avg7d)}</span>
    ${isGoodDeal ? '<span class="horadric-deal-alert"></span>' : ''}
  `;

  // Create tooltip
  const tooltip = createTooltip(priceData);
  badge.appendChild(tooltip);

  return badge;
}

// Create tooltip element
function createTooltip(data: PriceHistory): HTMLElement {
  const tooltip = document.createElement('div');
  tooltip.className = 'horadric-tooltip';

  const chartSvg = createMiniChart(data.pricePoints);

  tooltip.innerHTML = `
    <div class="horadric-tooltip-header">
      <div class="horadric-tooltip-title">${data.runeName}</div>
      <div class="horadric-tooltip-subtitle">7-Day Price History</div>
    </div>
    <div class="horadric-tooltip-stats">
      <div class="horadric-stat">
        <span class="horadric-stat-label">Average</span>
        <span class="horadric-stat-value">${formatPrice(data.avg7d)}</span>
      </div>
      <div class="horadric-stat">
        <span class="horadric-stat-label">Min</span>
        <span class="horadric-stat-value">${formatPrice(data.min7d)}</span>
      </div>
      <div class="horadric-stat">
        <span class="horadric-stat-label">Max</span>
        <span class="horadric-stat-value">${formatPrice(data.max7d)}</span>
      </div>
    </div>
    ${chartSvg ? `<div class="horadric-tooltip-chart">${chartSvg}</div>` : ''}
  `;

  return tooltip;
}

// Create mini SVG chart
function createMiniChart(pricePoints: Array<{ date: string; price: number }>): string {
  if (pricePoints.length < 2) return '';

  const width = 200;
  const height = 50;
  const padding = 5;

  const prices = pricePoints.map((p) => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  const points = pricePoints
    .map((p, i) => {
      const x = padding + (i / (pricePoints.length - 1)) * (width - 2 * padding);
      const y =
        height - padding - ((p.price - minPrice) / priceRange) * (height - 2 * padding);
      return `${x},${y}`;
    })
    .join(' ');

  return `
    <svg viewBox="0 0 ${width} ${height}" class="horadric-mini-chart">
      <polyline points="${points}" />
    </svg>
  `;
}

// Fetch price history from background worker
async function fetchPriceHistory(runeName: string): Promise<PriceHistory | null> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: 'GET_PRICE_HISTORY', runeName },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('[Horadric] Error fetching price history:', chrome.runtime.lastError);
          resolve(null);
          return;
        }
        resolve(response || null);
      }
    );
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPriceOverlay);
} else {
  initPriceOverlay();
}

export {};
