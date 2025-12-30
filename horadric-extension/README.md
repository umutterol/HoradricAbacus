# Horadric Abacus Chrome Extension

A Chrome extension for tracking Diablo 4 rune market prices on diablo.trade, with deal alerts and price history.

## Features

- **Price Tracking**: Passively collects rune prices while you browse diablo.trade
- **Deal Alerts**: Get notified when items drop below your target price
- **Price History**: View 7-day price trends for any rune
- **Saved Searches**: Save and quickly access your favorite search filters

## Installation

### Development Setup

1. Install dependencies:
   ```bash
   cd horadric-extension
   npm install
   ```

2. Build the extension:
   ```bash
   npm run build
   ```

3. Load in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

### Configuration

1. Set up Supabase:
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the schema from `supabase-schema.sql` in the SQL Editor
   - Copy your project URL and anon key

2. Update API credentials in `src/lib/api.ts`:
   ```typescript
   const SUPABASE_URL = 'your-project-url';
   const SUPABASE_ANON_KEY = 'your-anon-key';
   ```

3. Rebuild and reload the extension

## Development

```bash
# Watch mode (auto-rebuild on changes)
npm run watch

# Build for production
npm run build
```

## How It Works

### Data Collection

The extension intercepts API responses from diablo.trade when you browse the site. It extracts rune listing data and sends it to the backend for aggregation.

### Anti-Tampering

Since the extension runs on user machines, we use server-side validation:

1. **Consensus Model**: Requires 3+ unique users to report similar prices
2. **Outlier Rejection**: IQR filtering removes statistical anomalies
3. **Rate Limiting**: Max 100 reports/hour per installation
4. **DOM Context**: Validates that data matches expected page patterns
5. **Trust Scores**: Weights reports by source reliability

### Privacy

- No personal information collected
- Anonymous installation UUIDs (not linked to identity)
- Only collects data from diablo.trade (no tracking elsewhere)
- Open source code for full transparency

## File Structure

```
horadric-extension/
├── public/
│   └── manifest.json         # Extension configuration
├── src/
│   ├── background/
│   │   └── service-worker.ts # Background service worker
│   ├── content/
│   │   ├── interceptor.ts    # Fetch/XHR interception
│   │   ├── injected.ts       # Page context script
│   │   └── styles.css        # Injected styles
│   ├── popup/
│   │   ├── popup.tsx         # React popup component
│   │   └── popup.css         # Popup styles
│   └── lib/
│       ├── api.ts            # Supabase client
│       ├── runes.ts          # Rune list & helpers
│       └── types.ts          # TypeScript types
├── supabase-schema.sql       # Database schema
└── vite.config.ts            # Build configuration
```

## License

MIT
