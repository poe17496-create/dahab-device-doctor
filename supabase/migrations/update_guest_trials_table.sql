-- Migration: Update guest_trials table to use combined identifier + fingerprint
-- This migration adds support for better guest tracking using IP + Session ID + Browser Fingerprint

-- Add identifier column (combined hash of IP + Session ID + Fingerprint)
ALTER TABLE guest_trials
ADD COLUMN IF NOT EXISTS identifier text;

-- Add fingerprint column (stable identifier based on browser characteristics)
ALTER TABLE guest_trials
ADD COLUMN IF NOT EXISTS fingerprint text;

-- Add session_id column for individual session tracking
ALTER TABLE guest_trials
ADD COLUMN IF NOT EXISTS session_id text;

-- Create index on identifier for better performance
CREATE INDEX IF NOT EXISTS idx_guest_trials_identifier
ON guest_trials(identifier);

-- Create index on fingerprint (primary identifier for tracking)
CREATE INDEX IF NOT EXISTS idx_guest_trials_fingerprint
ON guest_trials(fingerprint);

-- Create index on session_id
CREATE INDEX IF NOT EXISTS idx_guest_trials_session_id
ON guest_trials(session_id);

-- Create index on last_date for daily reset queries
CREATE INDEX IF NOT EXISTS idx_guest_trials_last_date
ON guest_trials(last_date);

-- Comment: This migration improves guest tracking by using:
-- 1. Browser Fingerprint (stable even in Incognito)
-- 2. IP Address
-- 3. Session ID
-- This ensures accurate tracking even when users share the same IP or use Incognito mode
