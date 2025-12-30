# Crowdsourced Market Data Analysis (Chrome Extension Strategy)

## 1. Executive Summary
Replacing the centralized bot/scraper with a crowdsourced Chrome extension is **technically viable** and effectively solves the primary technical hurdle (Cloudflare protection). However, it exchanges a "Technical Problem" (evading bot detection) for a "Product & Data Integrity Problem" (getting users to install it and ensuring they don't submit fake data).

**Verdict:** High Viability, High Complexity (Data Quality).

## 2. Technical Viability

### How it works
Instead of running a headless browser on a server, you leverage the thousands of real users already browsing `diablo.trade`.
1.  **Passive Collection (Sniffing):** The extension uses the `webRequest` or `debugger` API, or simply interacts with the DOM/`window.fetch` to intercept data the user *already* requested.
    *   *Pros:* Zero extra load on `diablo.trade`. Low detection risk.
    *   *Cons:* You only get data for items people are actually looking for. Niche items might have gaps.
2.  **Active Collection (Background Worker):** The extension makes additional requests in the background.
    *   *Pros:* Controllable coverage.
    *   *Cons:* **High Risk.** If `diablo.trade` detects background traffic (requests without corresponding user inputs like mouse movement), they may flag the user's IP. Should strictly be "Opt-in" or throttle heavily.

### Cloudflare
Since the user has already passed the Cloudflare challenge (Turnstile/JS challenge) to view the site, the extension inherits this trust. This completely eliminates the need for cookie harvesting scripts.

## 3. Security Perspectives

### A. User Security & Privacy (The User's Perspective)
*   **Malware Perception:** Users are wary of extensions. The code must be unobtrusive.
*   **Permissions:** You will need `host_permissions` for `diablo.trade`.
*   **Recommendation:** Open Source the extension code. Minimize permissions (don't ask for "All Sites").

### B. Data Integrity & Poisoning (The System's Perspective)
**This is the biggest risk.**
If you rely on client-side reporting, a malicious actor can:
1.  Reverse-engineer your reporting API.
2.  Spam your server with `{ item: "Jah", price: 100 }` (fake low prices) to manipulate the market average.
3.  Because you have no "source of truth" to verify against, your tracker becomes a vector for market manipulation.

**Mitigation Strategies:**
*   **Consensus Model:** Do not trust a single report. Require X unique users to report similar prices within a timeframe.
*   **Outlier Rejection:** If the current average is 100M, and a user reports 1M, flag it.
*   **Reputation System:** Users could log in (via Discord/Battle.net). Trusted users get higher weight. Anonymous users get 0 weight initially.
*   **Snapshot Validation:** Occasionally, the extension could send a screenshot (or DOM snapshot) to be OCR'd/parsed server-side to prove the data was actually on screen (Computationally expensive).

### C. Legal / ToS Perspective
*   `diablo.trade` might block the extension if it facilitates spam or aggressive scraping.
*   Passive sniffing is generally safer than active crawling.

## 4. Product Strategy: "Value for Value"

Nobody installs an extension just to "help you get data." You must frame it as a tool *for them*.

**Proposed Features for the "Horadric Abacus" Extension:**
1.  **"Deal Alerter":**  User sets a watch list. If *any other user* sees a listing below X price, the extension notifies everyone. (Incentivizes network effect).
2.  **"Price History Tooltips":** Inject a graph onto `diablo.trade` listings showing the 7-day average. The user gets this data *in exchange* for contributing their view data.
3.  **"Saved Searches":** Better UI for managing complex filters than the site offers.

## 5. Architecture Proposal

1.  **Client (Extension):**
    *   Content Pattern: `diablo.trade/*`
    *   Mechanism: Intercept `XMLHttpRequest` / `fetch` responses matching `/listing/search`.
    *   Payload: Send sanitized JSON to your ingest server.
2.  **Ingest API (Serverless/Node):**
    *   Endpoint: `POST /api/v1/report`
    *   Auth: Anonymous generated UUID per install (for rate limiting).
3.  **Data Processing:**
    *   Buffer reports in Redis/Queue.
    *   Aggregator worker computes averages (discarding top/bottom 10% outliers).
    *   Commit verified cache to Database.

## 6. Comparison

| Feature | Automated Bot (Old Plan) | Crowdsourced Extension (New Plan) |
| :--- | :--- | :--- |
| **Cloudflare** | 🛑 Hard (Constant breaks) | ✅ Solved (Uses user session) |
| **Data Quality** | ✅ High (Trustworthy source) | ⚠️ Low/Noisy (Needs filtering) |
| **Coverage** | ✅ Complete (We choose what to search) | ⚠️ Spotty (Only what users search) |
| **Cost** | 💸 Hosting + Proxies | ⏳ Dev time (Extension + Marketing) |
| **Scale** | 📉 Hard to scale (IP Limits) | 📈 Scales with userbase |

## Recommendation
**Pivot to the Extension.** The "Automated Bot" battle against Cloudflare is a war of attrition you will likely lose as a solo/small team. The Extension approach aligns better with "Web 3.0" community principles and solve the access problem permanently, provided you can solve the Data Integrity challenge.
