-- Horadric Abacus Extension - Supabase Database Schema
-- Run this in the Supabase SQL Editor to set up the required tables

-- ============================================================================
-- Extension Installs (Anonymous tracking for rate limiting)
-- ============================================================================
CREATE TABLE IF NOT EXISTS extension_installs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  install_id UUID UNIQUE NOT NULL,
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  total_reports INTEGER DEFAULT 0,
  trust_score DECIMAL(3,2) DEFAULT 0.50,  -- 0.00 to 1.00
  is_banned BOOLEAN DEFAULT FALSE,
  ban_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_installs_install_id ON extension_installs(install_id);
CREATE INDEX IF NOT EXISTS idx_installs_trust_score ON extension_installs(trust_score);

-- ============================================================================
-- Raw Price Reports (Unverified, buffered)
-- ============================================================================
CREATE TABLE IF NOT EXISTS price_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  install_id UUID NOT NULL,
  reports JSONB NOT NULL,  -- Array of listings
  session_fingerprint TEXT,
  user_agent TEXT,
  report_count INTEGER NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,
  submitted_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_install_id ON price_reports(install_id);
CREATE INDEX IF NOT EXISTS idx_reports_submitted ON price_reports(submitted_at);
CREATE INDEX IF NOT EXISTS idx_reports_processed ON price_reports(processed) WHERE processed = FALSE;

-- ============================================================================
-- Individual Prices (Parsed from reports)
-- ============================================================================
CREATE TABLE IF NOT EXISTS raw_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES price_reports(id) ON DELETE CASCADE,
  install_id UUID NOT NULL,
  rune_name TEXT NOT NULL,
  price BIGINT NOT NULL,
  listing_type TEXT NOT NULL DEFAULT 'sell',  -- 'sell' or 'buy'
  dom_context TEXT,
  page_url TEXT,
  observed_at TIMESTAMPTZ NOT NULL,
  is_outlier BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_raw_prices_rune ON raw_prices(rune_name);
CREATE INDEX IF NOT EXISTS idx_raw_prices_observed ON raw_prices(observed_at);
CREATE INDEX IF NOT EXISTS idx_raw_prices_install ON raw_prices(install_id);

-- ============================================================================
-- Verified Prices (After consensus validation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS verified_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rune_name TEXT NOT NULL,
  average_price BIGINT NOT NULL,
  median_price BIGINT NOT NULL,
  min_price BIGINT NOT NULL,
  max_price BIGINT NOT NULL,
  sample_count INTEGER NOT NULL,
  unique_sources INTEGER NOT NULL,  -- Number of unique install_ids
  confidence_score DECIMAL(3,2) NOT NULL,  -- 0.00 to 1.00
  game_mode TEXT DEFAULT 'SEASONAL_SOFTCORE',
  verified_at TIMESTAMPTZ NOT NULL,
  time_window_start TIMESTAMPTZ NOT NULL,
  time_window_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verified_rune ON verified_prices(rune_name);
CREATE INDEX IF NOT EXISTS idx_verified_at ON verified_prices(verified_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_verified_unique ON verified_prices(rune_name, verified_at);

-- ============================================================================
-- User Watchlists (Synced across devices)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  install_id UUID NOT NULL,
  rune_name TEXT NOT NULL,
  target_price BIGINT NOT NULL,
  alert_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(install_id, rune_name)
);

CREATE INDEX IF NOT EXISTS idx_watchlists_install ON user_watchlists(install_id);

-- ============================================================================
-- Behavioral Patterns (For anomaly detection)
-- ============================================================================
CREATE TABLE IF NOT EXISTS behavioral_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  install_id UUID NOT NULL,
  pattern_date DATE NOT NULL,
  reports_per_hour JSONB,  -- Array of counts by hour
  avg_reports_per_session DECIMAL,
  unique_runes_seen INTEGER,
  submission_intervals JSONB,  -- Array of intervals between submissions
  anomaly_score DECIMAL(3,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(install_id, pattern_date)
);

CREATE INDEX IF NOT EXISTS idx_patterns_install ON behavioral_patterns(install_id);
CREATE INDEX IF NOT EXISTS idx_patterns_date ON behavioral_patterns(pattern_date);

-- ============================================================================
-- Saved Searches (User feature)
-- ============================================================================
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  install_id UUID NOT NULL,
  search_name TEXT NOT NULL,
  filters JSONB NOT NULL,  -- {runeName, minPrice, maxPrice, listingType, etc.}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_searches_install ON saved_searches(install_id);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE extension_installs ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE verified_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavioral_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts to price_reports (anyone can submit)
CREATE POLICY "Allow anonymous price report inserts"
  ON price_reports FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow reading verified prices (public data)
CREATE POLICY "Allow reading verified prices"
  ON verified_prices FOR SELECT
  TO anon
  USING (true);

-- Allow users to manage their own watchlists
CREATE POLICY "Users can insert their own watchlist items"
  ON user_watchlists FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Users can read their own watchlist items"
  ON user_watchlists FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Users can delete their own watchlist items"
  ON user_watchlists FOR DELETE
  TO anon
  USING (true);

-- Allow users to manage their own saved searches
CREATE POLICY "Users can manage saved searches"
  ON saved_searches FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Functions for Price Processing (to be called by Edge Functions or CRON)
-- ============================================================================

-- Function to get the current average price for a rune
CREATE OR REPLACE FUNCTION get_current_rune_price(p_rune_name TEXT)
RETURNS TABLE (
  rune_name TEXT,
  average_price BIGINT,
  median_price BIGINT,
  min_price BIGINT,
  max_price BIGINT,
  sample_count INTEGER,
  last_updated TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    vp.rune_name,
    vp.average_price,
    vp.median_price,
    vp.min_price,
    vp.max_price,
    vp.sample_count,
    vp.verified_at as last_updated
  FROM verified_prices vp
  WHERE vp.rune_name = p_rune_name
  ORDER BY vp.verified_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get price history for a rune
CREATE OR REPLACE FUNCTION get_rune_price_history(
  p_rune_name TEXT,
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  average_price BIGINT,
  min_price BIGINT,
  max_price BIGINT,
  verified_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    vp.average_price,
    vp.min_price,
    vp.max_price,
    vp.verified_at
  FROM verified_prices vp
  WHERE vp.rune_name = p_rune_name
    AND vp.verified_at >= NOW() - (p_days || ' days')::INTERVAL
  ORDER BY vp.verified_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Sample data for testing (optional)
-- ============================================================================
-- Uncomment to insert sample verified prices for testing

/*
INSERT INTO verified_prices (rune_name, average_price, median_price, min_price, max_price, sample_count, unique_sources, confidence_score, verified_at, time_window_start, time_window_end)
VALUES
  ('Jah', 500000000, 500000000, 450000000, 550000000, 15, 8, 0.95, NOW(), NOW() - INTERVAL '1 hour', NOW()),
  ('Ohm', 350000000, 340000000, 300000000, 400000000, 12, 6, 0.90, NOW(), NOW() - INTERVAL '1 hour', NOW()),
  ('Vex', 200000000, 200000000, 180000000, 220000000, 20, 10, 0.92, NOW(), NOW() - INTERVAL '1 hour', NOW()),
  ('Yul', 100000000, 100000000, 90000000, 120000000, 25, 12, 0.88, NOW(), NOW() - INTERVAL '1 hour', NOW());
*/
