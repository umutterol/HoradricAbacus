# Diablo 4 Rune Price Tracker - PRD

## 1. Overview

**Project Name:** Diablo 4 Rune Price Tracker
**Purpose:** Automated collection of Diablo 4 rune average prices from diablo.trade marketplace every 2 hours, with historical tracking and API exposure for display projects.
**Target Users:** Diablo 4 traders, price analysis tools, personal dashboards
**Success Metric:** Accurate, consistently-updated price data available via API or exported format

---

## 2. Rune List & Search Parameters

### Target Runes (48 total)
```
Ahu, Bac, Igni, Lith, Nagu, Tam, Xol, Yul, Feo, Neo, Noc, Poc, Cem, Cir, Moni, Yax, Zan, Eom, Jah, Ohm, Vex, Xan, Yom, Chac, Kel, Kry, Lac, Mot, Ner, Qax, Que, Thul, Tzic, Wat, Xal, Zec, Ceh, Gar, Lum, Qua, Tal, Teb, Tec, Ton, Tun, Zid
```

### Search Filters (Fixed)
- **Game Mode:** SEASONAL_SOFTCORE
- **Listing Mode:** SELLING
- **Price Type:** FIXED (buyout/fixed price only, excludes negotiations)
- **Minimum Price:** 1,000,000 gold (filters out spam/false listings)
- **Item Type:** MATERIAL (runes are categorized as materials)
- **Status:** ACTIVE only

### Dynamic Parameters Per Rune
- **Item Name:** Each rune name (case-sensitive search)
- **Pagination:** Limit to latest 20 results per rune (1 page)

---

## 3. Data Collection Architecture

### 3.1 API Flow
```
┌─────────────────────────────────────────────────────────────┐
│  GitHub Actions Trigger (every 2 hours)                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Cookie Helper Script: scripts/get-cookies.js               │
│  - Launches headful browser                                 │
│  - User manually solves captcha/logs in                     │
│  - Saves `cookies.json`                                     │
└──────────┬──────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│  Node.js Script: price-tracker.js    │
│  - Loads `cookies.json`              │
│  - Bypasses Cloudflare with cookies  │
└──────────────────────────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
        ▼                                     ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│ Search diablo.trade for  │    │ Per-rune loop:           │
│ each rune using filters  │    │ - Navigate/POST          │
│                          │    │ - Extract listing IDs    │
│ POST /listings/items     │    │ - Collect top 20 IDs     │
│ (search endpoint)        │    │                          │
└──────────────────────────┘    └──────────────────────────┘
                │                      │
                └──────────┬───────────┘
                           ▼
        ┌────────────────────────────────────┐
        │ Fetch Listing Details              │
        │ GET /api/listing/get?ids=...       │
        │ (batch fetch 10 IDs at a time)     │
        └────────────────────────────────────┘
                           │
                           ▼
        ┌────────────────────────────────────┐
        │ Process & Calculate Metrics        │
        │ - Extract rawPrice from each item  │
        │ - Filter: price >= 1M              │
        │ - Calculate:                       │
        │   * Average price                  │
        │   * Median price                   │
        │   * Min/Max prices                 │
        │   * Count of listings              │
        │   * Timestamp                      │
        └────────────────────────────────────┘
                           │
                           ▼
        ┌────────────────────────────────────┐
        │ Store Results                      │
        │ Option A: JSON file in repo        │
        │ Option B: Database                 │
        │ Option C: Push to API endpoint     │
        └────────────────────────────────────┘
                           │
                           ▼
        ┌────────────────────────────────────┐
        │ Output/Expose Data                 │
        │ - Commit JSON to repo + git push   │
        │ - Or POST to external API          │
        │ - Or update database               │
        └────────────────────────────────────┘
```

### 3.2 API Endpoints

#### Search Endpoint (Reverse-engineered)
```
POST https://diablo.trade/listings/items

Body Structure (Example for Yul):
{
  "filters": {
    "itemName": "Yul",
    "gameMode": "SEASONAL_SOFTCORE",
    "listingMode": "SELLING",
    "priceType": "FIXED",
    "minPrice": 1000000
  },
  "sort": "NEWEST",
  "limit": 20,
  "offset": 0
}

Response:
{
  "listings": [
    { "id": "cd3bd303-c0ed-4fc2-80c2-3e3c44355521", ... },
    ...
  ],
  "total": 147,
  "hasMore": true
}
```

#### Get Listing Details Endpoint
```
GET https://diablo.trade/api/listing/get?ids=<id1>,<id2>,...

Response (Array):
[
  {
    "id": "cd3bd303-c0ed-4fc2-80c2-3e3c44355521",
    "name": "Yul",
    "price": "100M",
    "rawPrice": 100000000,
    "user": { "name": "SwiftDevil", "online": true, ... },
    "createdAt": "2025-12-28T22:36:05.114Z",
    "gameMode": "SEASONAL_SOFTCORE",
    "status": "ACTIVE",
    "sold": false,
    "item": {
      "quantity": 7,
      "materialType": "RUNE",
      ...
    }
  },
  ...
]
```

---

## 4. Data Processing Specifications

### 4.1 Price Extraction Logic
```javascript
// For each listing returned:
1. Check: rawPrice >= 1000000 (minimum filter)
2. Check: gameMode === "SEASONAL_SOFTCORE"
3. Check: status === "ACTIVE" && sold === false && expired === false
4. Extract: rawPrice value
5. Calculate quantity if available (item.quantity)
```

### 4.2 Metrics Per Rune
```javascript
{
  "runeName": "Yul",
  "timestamp": "2025-12-29T10:30:00Z",
  "gameMode": "SEASONAL_SOFTCORE",
  "prices": {
    "average": 98500000,      // Mean of all valid prices
    "median": 100000000,      // Middle value
    "min": 75000000,          // Lowest price
    "max": 120000000,         // Highest price
    "stdDev": 15000000        // Standard deviation
  },
  "listings": {
    "count": 42,              // Number of active listings
    "onlineSellers": 38,      // Count where user.online === true
    "offlineSellers": 4
  },
  "priceHistory": [
    {
      "timestamp": "2025-12-29T08:30:00Z",
      "average": 96000000
    },
    ...
  ]
}
```

---

## 5. Data Storage Options

### Option A: JSON File (Simplest, GitHub-friendly)
```
project-root/
├── data/
│   ├── rune-prices-current.json
│   ├── rune-prices-history.jsonl  (newline-delimited JSON)
│   └── price-snapshots/
│       ├── 2025-12-29-10-30.json
│       ├── 2025-12-29-12-30.json
│       └── ...
└── price-tracker/
    └── tracker.js
```

**Advantages:**
- Version controlled with git
- Easy to review changes
- Can use GitHub's built-in file viewer
- No external service needed

### Option B: SQLite Database
```
rune_prices.db
├── runes
│   └── id, name, created_at
├── price_snapshots
│   └── id, rune_id, avg_price, median_price, timestamp, etc.
└── listings
    └── id, rune_id, price, seller, timestamp, etc.
```

**Advantages:**
- Better for querying trends
- Supports complex aggregations
- Smaller file size long-term

### Option C: External API/Database (Scalable)
- Push data to your own backend API
- Store in PostgreSQL, MongoDB, etc.
- Keep repo lightweight

---

## 6. GitHub Actions Automation

### 6.1 Workflow Configuration

**File Location:** `.github/workflows/rune-price-tracker.yml`
```yaml
name: Diablo 4 Rune Price Tracker

on:
  schedule:
    # Every 2 hours (UTC)
    - cron: '0 */2 * * *'
  workflow_dispatch:  # Manual trigger button

jobs:
  track-prices:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run price tracker
        run: npm run track-prices
        env:
          DIABLO_TRADE_BASE_URL: https://diablo.trade
          MIN_PRICE: 1000000
      
      - name: Commit and push changes
        run: |
          git config user.name "price-tracker-bot"
          git config user.email "bot@diablotracker.local"
          git add data/
          git diff --quiet && git diff --staged --quiet || (git commit -m "Update rune prices: $(date -u +'%Y-%m-%d %H:%M UTC')" && git push)
```

### 6.2 Cron Schedule Options
```
# Every 2 hours
0 */2 * * *

# Every 4 hours
0 */4 * * *

# Every 6 hours
0 */6 * * *

# 3 times per day (8am, 4pm, 12am UTC)
0 8,16,0 * * *

# Every 30 minutes (for testing/high-frequency)
*/30 * * * *
```

### 6.3 GitHub Actions Limitations & Considerations

✅ **Pros:**
- Free tier: 2,000 minutes/month
- 2-hour cron job = 720 executions/month ≈ 12-15 minutes total
- Well within free quota
- Perfect for every-2-hours tracking
- Automatic git commits to repo
- No additional infrastructure needed

⚠️ **Considerations:**
- Cron jobs in GitHub Actions have ~15 minute variance (not exact)
- Free runners may be slower during peak times
- Max job timeout: 6 hours (not a concern for price tracking)
- Best effort - no SLA guarantee

---

## 7. Output Format Specification

### 7.1 Current Prices JSON
```json
{
  "generated": "2025-12-29T10:30:00Z",
  "gameMode": "SEASONAL_SOFTCORE",
  "source": "diablo.trade",
  "runes": [
    {
      "name": "Yul",
      "averagePrice": 98500000,
      "medianPrice": 100000000,
      "minPrice": 75000000,
      "maxPrice": 120000000,
      "count": 42,
      "currency": "gold",
      "lastUpdated": "2025-12-29T10:30:00Z"
    },
    {
      "name": "Vex",
      "averagePrice": 150000000,
      "medianPrice": 148000000,
      "minPrice": 125000000,
      "maxPrice": 200000000,
      "count": 28,
      "currency": "gold",
      "lastUpdated": "2025-12-29T10:30:00Z"
    },
    ...
  ]
}
```

### 7.2 Commit Message Format
```
Update rune prices: 2025-12-29 10:30 UTC

Summary:
- Tracked 48 runes
- Total listings analyzed: 1,247
- Success rate: 100%
- Execution time: 2m 34s
```

---

## 8. Integration with Display Project

### 8.1 API Endpoint for Your Project
```javascript
// Your project's main app/API server:
app.get('/api/rune-prices', (req, res) => {
  const data = require('./data/rune-prices-current.json');
  res.json(data);
});
```

### 8.2 Webhook Alternative
If you want real-time updates to your project:
```javascript
// In GitHub Actions after price update:
- name: Notify your API
  run: |
    curl -X POST https://your-project-api.com/webhooks/rune-prices \\
      -H "Authorization: Bearer ${{ secrets.WEBHOOK_TOKEN }}" \\
      -H "Content-Type: application/json" \\
      -d @data/rune-prices-current.json
```

### 8.3 Frontend Display Example
```javascript
// In your display project:
async function fetchRunePrices() {
  const response = await fetch('/api/rune-prices');
  const data = await response.json();
  
  // Sort by average price descending
  const sorted = data.runes.sort((a, b) => 
    b.averagePrice - a.averagePrice
  );
  
  // Display in table
  renderPriceTable(sorted);
}

// Refresh every 30 minutes
setInterval(fetchRunePrices, 30 * 60 * 1000);
```

---

## 9. Error Handling & Monitoring

### 9.1 Expected Failure Modes
- Network timeouts on diablo.trade API
- Rate limiting (implement exponential backoff)
- Rune not found (removed from marketplace)
- API response format changes

### 9.2 Logging Strategy
```
[2025-12-29 10:30:45] Starting rune price tracking
[2025-12-29 10:30:47] Fetching: Ahu - Found 12 listings
[2025-12-29 10:30:49] Fetching: Bac - Found 8 listings
[2025-12-29 10:30:51] Fetching: Igni - ERROR: Timeout (retry #1)
[2025-12-29 10:30:56] Fetching: Igni - SUCCESS - Found 5 listings
...
[2025-12-29 10:33:22] Completed: 48/48 runes, 1247 total listings
[2025-12-29 10:33:25] Data written to: data/rune-prices-current.json
```

### 9.3 GitHub Actions Notifications
```yaml
- name: Notify on failure
  if: failure()
  run: |
    echo "Price tracker failed"
    # Optional: Send Slack/Discord notification
```

---

## 10. Implementation Checklist

- [ ] Create GitHub repository
- [ ] Set up Node.js project with dependencies
  - [ ] playwright-extra and puppeteer-extra-plugin-stealth
  - [ ] date-fns for timestamp handling
- [ ] Create `scripts/get-cookies.js` helper
  - [ ] Headful browser launch
  - [ ] Cookie extraction logic
- [ ] Write price-tracker.js script
  - [ ] Rune list array (48 runes)
  - [ ] Search API function
  - [ ] Listing details fetch function
  - [ ] Price calculation function
  - [ ] Data persistence function
- [ ] Create GitHub Actions workflow file
- [ ] Set up data directory structure
- [ ] Test locally with npm run
- [ ] Deploy and enable scheduled workflow
- [ ] Add git ignore rules for node_modules
- [ ] Document any API authentication needed
- [ ] Create fallback/retry logic
- [ ] Integrate with display project API

---

## 11. Success Criteria

- ✅ Prices collected every 2 hours ±15 minutes
- ✅ All 48 runes tracked consistently
- ✅ Price data accurate to within 1% of live site
- ✅ Zero missed execution windows per month
- ✅ Data persisted and queryable historically
- ✅ Integration available to display project
- ✅ Logs captured for debugging
- ✅ Handles API timeouts gracefully

---

## 12. Future Enhancements

1. **Multi-game-mode tracking:** Add HARDCORE, ETERNAL variants
2. **Trend analysis:** Calculate 7-day, 30-day moving averages
3. **Alerts:** Notify when price drops >10% or spikes >20%
4. **Price comparison:** Track same rune across different seasons
5. **Seller reputation:** Weight prices by seller ratings
6. **Volume analysis:** Track how many runes sold vs listed
7. **API versioning:** Build display endpoint with filtering/sorting options

---

**Last Updated:** 2025-12-29
**Author:** Diablo 4 Rune Price Tracker Team
**Status:** PRD Complete - Ready for Development