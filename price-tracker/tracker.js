/**
 * Diablo 4 Rune Price Tracker - CDP Mode
 * 
 * Connects to your already-running Chrome browser via Chrome DevTools Protocol.
 * This bypasses Cloudflare because we use YOUR authenticated session.
 * 
 * SETUP:
 * 1. Close all Chrome windows
 * 2. Start Chrome with: chrome.exe --remote-debugging-port=9222
 * 3. Navigate to diablo.trade, solve captcha, login
 * 4. Run: npm run track-prices
 */

import { chromium } from 'playwright';
import { format } from 'date-fns';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================================
// Configuration
// ============================================================================

const RUNES = [
    'Ahu', 'Bac', 'Igni', 'Lith', 'Nagu', 'Tam', 'Xol', 'Yul',
    'Feo', 'Neo', 'Noc', 'Poc',
    'Cem', 'Cir', 'Moni', 'Yax', 'Zan',
    'Eom', 'Jah', 'Ohm', 'Vex', 'Xan', 'Yom',
    'Chac', 'Kel', 'Kry', 'Lac', 'Mot', 'Ner', 'Qax', 'Que', 'Thul', 'Tzic', 'Wat', 'Xal', 'Zec',
    'Ceh', 'Gar', 'Lum', 'Qua', 'Tal', 'Teb', 'Tec', 'Ton', 'Tun', 'Zid'
];

const CONFIG = {
    cdpUrl: 'http://127.0.0.1:9222',
    baseUrl: 'https://diablo.trade',
    gameMode: 'SEASONAL_SOFTCORE',
    minPrice: 1000000,
    delayBetweenRunes: 3000, // ms
    pageLoadWait: 4000, // ms to wait for dynamic content
};

// ============================================================================
// URL Building
// ============================================================================

function buildSearchUrl(runeName) {
    const params = new URLSearchParams({
        exactItem: runeName,
        mode: 'season-softcore',
        listingType: 'sell',
        minPrice: CONFIG.minPrice.toString(),
    });
    return `${CONFIG.baseUrl}/listings/items?${params.toString()}`;
}

// ============================================================================
// DOM Scraping
// ============================================================================

async function extractPricesFromPage(page) {
    try {
        // Wait for listings to appear
        await page.waitForSelector('article, [class*="listing"], [class*="card"]', {
            timeout: 10000
        }).catch(() => { });

        // Additional wait for dynamic content
        await page.waitForTimeout(CONFIG.pageLoadWait);

        // Extract prices
        // Extract prices
        const prices = await page.evaluate(() => {
            const extractedPrices = [];

            // Targeted strategy based on "EXACT PRICE" label
            const allElements = document.querySelectorAll('*');
            allElements.forEach(el => {
                if (el.textContent?.trim().toUpperCase() === 'EXACT PRICE') {
                    // Price is likely in the parent container
                    const container = el.parentElement;
                    if (container) {
                        const text = container.textContent || '';
                        // Look for price pattern like "500 M", "500M", "1.5 B"
                        const match = text.match(/Exact Price\s*(\d+(?:[.,]\d+)?)\s*([KMB])/i);
                        if (match) {
                            let value = parseFloat(match[1].replace(/,/g, ''));
                            const suffix = match[2].toUpperCase();
                            if (suffix === 'K') value *= 1000;
                            else if (suffix === 'M') value *= 1000000;
                            else if (suffix === 'B') value *= 1000000000;

                            if (value >= 1000000 && value <= 100000000000) {
                                extractedPrices.push(Math.round(value));
                            }
                        }
                    }
                }
            });

            // Fallback: Look for specific price value containers if the label search fails
            if (extractedPrices.length === 0) {
                const priceElements = document.querySelectorAll('[class*="price"], [class*="gold"], [class*="value"]');
                priceElements.forEach(el => {
                    const text = el.textContent?.trim() || '';
                    // Strict regex for price format seen in screenshot: e.g. "500 M" or "500M"
                    // Avoid matching random numbers
                    if (/^\d+(?:[.,]\d+)?\s*[KMB]$/i.test(text)) {
                        const match = text.match(/(\d+(?:[.,]\d+)?)\s*([KMB])/i);
                        if (match) {
                            let value = parseFloat(match[1].replace(/,/g, ''));
                            const suffix = match[2].toUpperCase();
                            if (suffix === 'K') value *= 1000;
                            else if (suffix === 'M') value *= 1000000;
                            else if (suffix === 'B') value *= 1000000000;

                            if (value >= 1000000) {
                                extractedPrices.push(Math.round(value));
                            }
                        }
                    }
                });
            }

            return [...new Set(extractedPrices)];
        });

        return prices;
    } catch (error) {
        console.error('Error extracting prices:', error.message);
        return [];
    }
}

// ============================================================================
// Price Calculation
// ============================================================================

function calculateMetrics(prices) {
    if (prices.length === 0) return null;

    const sorted = [...prices].sort((a, b) => a - b);
    const sum = sorted.reduce((acc, p) => acc + p, 0);

    return {
        averagePrice: Math.round(sum / sorted.length),
        medianPrice: sorted.length % 2 === 0
            ? Math.round((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2)
            : sorted[Math.floor(sorted.length / 2)],
        minPrice: sorted[0],
        maxPrice: sorted[sorted.length - 1],
        count: sorted.length,
    };
}

// ============================================================================
// Rune Processing
// ============================================================================

async function processRune(page, runeName) {
    const searchUrl = buildSearchUrl(runeName);

    try {
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Check for Cloudflare
        // Check for Cloudflare
        const title = await page.title();
        if (title.toLowerCase().includes('just a moment')) {
            console.log(`\n⚠️ [${runeName}] Cloudflare Challenge Detected!`);
            console.log('   Please switch to the browser window and solve the captcha.');
            console.log('   Waiting 30 seconds to check again...');

            // Wait for user to solve it
            for (let i = 0; i < 6; i++) {
                await delay(5000);
                const newTitle = await page.title();
                if (!newTitle.toLowerCase().includes('just a moment')) {
                    console.log('✅ Challenge solved! Resuming...');
                    break;
                }
                if (i === 5) {
                    console.error(`❌ Timed out waiting for solution. Skipping ${runeName}`);
                    return createEmptyResult(runeName);
                }
            }
        }

        const prices = await extractPricesFromPage(page);
        console.log(`[${runeName}] Found ${prices.length} prices${prices.length > 0 ? `: ${prices.slice(0, 3).map(p => `${(p / 1000000).toFixed(1)}M`).join(', ')}...` : ''}`);

        const metrics = calculateMetrics(prices);

        return {
            name: runeName,
            averagePrice: metrics?.averagePrice || null,
            medianPrice: metrics?.medianPrice || null,
            minPrice: metrics?.minPrice || null,
            maxPrice: metrics?.maxPrice || null,
            count: metrics?.count || 0,
            currency: 'gold',
            lastUpdated: new Date().toISOString(),
        };
    } catch (error) {
        console.error(`[${runeName}] Error:`, error.message);
        return createEmptyResult(runeName);
    }
}

function createEmptyResult(runeName) {
    return {
        name: runeName,
        averagePrice: null,
        medianPrice: null,
        minPrice: null,
        maxPrice: null,
        count: 0,
        currency: 'gold',
        lastUpdated: new Date().toISOString(),
    };
}

// ============================================================================
// Helpers
// ============================================================================

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// Main
// ============================================================================

async function main() {
    console.log('='.repeat(60));
    console.log('Diablo 4 Rune Price Tracker (CDP Mode)');
    console.log(`Started at: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`);
    console.log('='.repeat(60));
    console.log('');
    console.log('Connecting to Chrome at', CONFIG.cdpUrl);
    console.log('Make sure Chrome is running with: --remote-debugging-port=9222');
    console.log('');

    let browser;
    try {
        browser = await chromium.connectOverCDP(CONFIG.cdpUrl);
        console.log('✅ Connected to Chrome successfully!');
    } catch (error) {
        console.error('❌ Failed to connect to Chrome.');
        console.error('');
        console.error('Please start Chrome with remote debugging:');
        console.error('');
        console.error('  Windows:');
        console.error('    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --remote-debugging-port=9222');
        console.error('');
        console.error('  Mac:');
        console.error('    /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222');
        console.error('');
        process.exit(1);
    }

    // Get the default context (user's browser session)
    const contexts = browser.contexts();
    if (contexts.length === 0) {
        console.error('❌ No browser contexts found. Open a tab in Chrome first.');
        process.exit(1);
    }

    const context = contexts[0];
    console.log(`✅ Found ${context.pages().length} open tabs`);

    // Create a new page for our work (or reuse existing)
    const page = await context.newPage();
    console.log('✅ Created new tab for price tracking\n');

    // Test with first rune
    console.log('Testing connection...');
    await page.goto(buildSearchUrl('Jah'), { waitUntil: 'domcontentloaded', timeout: 30000 });
    await delay(3000);

    const title = await page.title();
    console.log(`Page title: ${title}`);

    if (title.toLowerCase().includes('just a moment')) {
        console.error('');
        console.error('❌ Cloudflare challenge detected!');
        console.error('Please solve the captcha in the new tab, then restart this script.');
        await browser.close();
        process.exit(1);
    }

    console.log('✅ Session is valid!\n');

    const results = [];

    for (let i = 0; i < RUNES.length; i++) {
        const runeName = RUNES[i];
        console.log(`[${i + 1}/${RUNES.length}] Processing: ${runeName}`);

        const runeData = await processRune(page, runeName);
        results.push(runeData);

        if (i < RUNES.length - 1) {
            await delay(CONFIG.delayBetweenRunes);
        }
    }

    // Close our tab but keep browser running
    await page.close();

    // Prepare output
    const outputData = {
        generated: new Date().toISOString(),
        gameMode: CONFIG.gameMode,
        source: 'diablo.trade',
        runes: results,
    };

    // Ensure data directory exists
    const dataDir = join(__dirname, '..', 'data');
    if (!existsSync(dataDir)) {
        mkdirSync(dataDir, { recursive: true });
    }

    // Write output
    const outputPath = join(dataDir, 'rune-prices-current.json');
    writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
    console.log(`\nData written to: ${outputPath}`);

    // Summary
    const successCount = results.filter(r => r.count > 0).length;
    console.log('\n' + '='.repeat(60));
    console.log(`Completed: ${successCount}/${RUNES.length} runes with data`);
    console.log(`Finished at: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`);
    console.log('='.repeat(60));
}

main().catch(console.error);
