/**
 * Cookie Extraction Helper
 * 
 * Launches a headful browser for you to manually solve any captchas
 * and login. Once done, press Enter in the terminal to save cookies.
 * 
 * Usage: npm run get-cookies
 */

import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createInterface } from 'readline';

// Apply stealth plugin
chromium.use(StealthPlugin());

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TARGET_URL = 'https://diablo.trade/listings/items';

async function waitForEnter(prompt) {
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(prompt, () => {
            rl.close();
            resolve();
        });
    });
}

async function main() {
    console.log('='.repeat(60));
    console.log('Cookie Extraction Helper');
    console.log('='.repeat(60));
    console.log('');
    console.log('A browser window will open. Please:');
    console.log('1. Solve any Cloudflare challenges');
    console.log('2. Login to your account (if needed)');
    console.log('3. Navigate to the listings page');
    console.log('4. Come back here and press ENTER when ready');
    console.log('');
    console.log('='.repeat(60));

    // Launch visible browser
    const browser = await chromium.launch({
        headless: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
        ],
    });

    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1400, height: 900 },
        locale: 'en-US',
    });

    const page = await context.newPage();

    console.log('\nOpening diablo.trade...\n');

    try {
        await page.goto(TARGET_URL, {
            waitUntil: 'domcontentloaded',
            timeout: 120000
        });
    } catch (error) {
        console.log('Page is loading... Please complete any challenges in the browser.');
    }

    // Wait for user to complete the challenge and login
    await waitForEnter('\n>>> Press ENTER after you have solved the captcha and logged in...\n');

    // Extract cookies
    console.log('\nExtracting cookies...');
    const cookies = await context.cookies();

    // Ensure data directory exists
    const dataDir = join(__dirname, '..', 'data');
    if (!existsSync(dataDir)) {
        mkdirSync(dataDir, { recursive: true });
    }

    // Save cookies
    const cookiePath = join(dataDir, 'cookies.json');
    writeFileSync(cookiePath, JSON.stringify(cookies, null, 2));

    console.log(`\n✅ Saved ${cookies.length} cookies to: ${cookiePath}`);

    // Show important cookies
    const cfCookies = cookies.filter(c =>
        c.name.includes('cf_') ||
        c.name.includes('__cf') ||
        c.name.includes('session') ||
        c.name.includes('auth')
    );

    if (cfCookies.length > 0) {
        console.log('\nImportant cookies found:');
        cfCookies.forEach(c => {
            console.log(`  - ${c.name} (expires: ${c.expires ? new Date(c.expires * 1000).toLocaleString() : 'session'})`);
        });
    }

    await browser.close();

    console.log('\n='.repeat(60));
    console.log('Done! You can now run: npm run track-prices');
    console.log('='.repeat(60));
}

main().catch(console.error);
