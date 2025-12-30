/**
 * Debug script to capture page HTML and understand DOM structure
 */

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONFIG = {
  cdpUrl: 'http://127.0.0.1:9222',
  baseUrl: 'https://diablo.trade',
  minPrice: 1000000,
};

function buildSearchUrl(runeName) {
  const params = new URLSearchParams({
    exactItem: runeName,
    mode: 'season-softcore',
    listingType: 'sell',
    minPrice: CONFIG.minPrice.toString(),
  });
  return `${CONFIG.baseUrl}/listings/items?${params.toString()}`;
}

async function main() {
  console.log('Connecting to Chrome...');
  
  const browser = await chromium.connectOverCDP(CONFIG.cdpUrl);
  console.log('✅ Connected!');
  
  const contexts = browser.contexts();
  const context = contexts[0];
  const page = await context.newPage();
  
  // Navigate to a specific rune
  const testRune = 'Jah';
  console.log(`\nNavigating to ${testRune} listings...`);
  await page.goto(buildSearchUrl(testRune), { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  
  console.log('Page title:', await page.title());
  
  // Take screenshot
  const dataDir = join(__dirname, '..', 'data');
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
  
  await page.screenshot({ path: join(dataDir, 'debug-screenshot.png'), fullPage: false });
  console.log('✅ Screenshot saved to data/debug-screenshot.png');
  
  // Get page HTML
  const html = await page.content();
  writeFileSync(join(dataDir, 'debug-page.html'), html);
  console.log('✅ HTML saved to data/debug-page.html');
  
  // Try to find listing elements
  console.log('\n=== Searching for listing elements ===');
  
  const selectors = [
    'article',
    '[class*="listing"]',
    '[class*="card"]',
    '[class*="item"]',
    '[class*="price"]',
    '[data-testid]',
    '.grid > div',
    'main > div > div',
  ];
  
  for (const selector of selectors) {
    const count = await page.locator(selector).count();
    if (count > 0) {
      console.log(`  ${selector}: ${count} elements`);
      // Get first element's outer HTML
      if (count < 50) {
        const first = await page.locator(selector).first();
        const outerHtml = await first.evaluate(el => el.outerHTML.substring(0, 200));
        console.log(`    First: ${outerHtml}...`);
      }
    }
  }
  
  // Try to find specific price patterns
  console.log('\n=== Looking for price text ===');
  const priceTexts = await page.evaluate(() => {
    const results = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while (node = walker.nextNode()) {
      const text = node.textContent?.trim() || '';
      if (/\d+\s*M\b/i.test(text) && text.length < 30) {
        const parent = node.parentElement;
        results.push({
          text: text,
          tagName: parent?.tagName,
          className: parent?.className?.substring?.(0, 50) || '',
        });
      }
    }
    return results.slice(0, 20);
  });
  
  priceTexts.forEach((p, i) => {
    console.log(`  ${i + 1}. "${p.text}" in <${p.tagName} class="${p.className}">`);
  });
  
  await page.close();
  console.log('\n✅ Debug complete!');
}

main().catch(console.error);
