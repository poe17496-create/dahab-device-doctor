-- Migration: Add Cache Table for AI Responses
-- This migration adds a cache table to store AI responses and diagnostic results
-- for improved performance and reduced API costs.

-- Cache Entries Table
CREATE TABLE IF NOT EXISTS cache_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  cache_value JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  hit_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cache_entries_key ON cache_entries(cache_key);
CREATE INDEX IF NOT EXISTS idx_cache_entries_expires ON cache_entries(expires_at);
CREATE INDEX IF NOT EXISTS idx_cache_entries_created ON cache_entries(created_at);

-- Add comment for documentation
COMMENT ON TABLE cache_entries IS 'Cache table for AI responses and diagnostic results with automatic expiration';

-- Enable Row Level Security (RLS)
ALTER TABLE cache_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Service role bypasses RLS, so server-side operations work
-- Public read is not needed since this is server-side only
-- We can create a policy to allow authenticated users to read if needed
DROP POLICY IF EXISTS "Service role bypass for cache_entries" ON cache_entries;
CREATE POLICY "Service role bypass for cache_entries" ON cache_entries FOR ALL USING (true);

-- Create a function to automatically clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM cache_entries WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get cache statistics
CREATE OR REPLACE FUNCTION get_cache_stats()
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total_entries', (SELECT COUNT(*) FROM cache_entries),
    'active_entries', (SELECT COUNT(*) FROM cache_entries WHERE expires_at > NOW()),
    'expired_entries', (SELECT COUNT(*) FROM cache_entries WHERE expires_at <= NOW()),
    'total_hits', (SELECT COALESCE(SUM(hit_count), 0) FROM cache_entries),
    'avg_hit_count', (SELECT COALESCE(AVG(hit_count), 0) FROM cache_entries)
  ) INTO stats;
  RETURN stats;
END;
$$ LANGUAGE plpgsql;
