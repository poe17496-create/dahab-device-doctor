-- Migration: Update guest_trials table to use combined identifier
-- This migration adds support for better guest tracking using IP + Session ID

-- Add identifier column (combined hash of IP + Session ID)
ALTER TABLE guest_trials
ADD COLUMN IF NOT EXISTS identifier text;

-- Add session_id column for individual session tracking
ALTER TABLE guest_trials
ADD COLUMN IF NOT EXISTS session_id text;

-- Create index on identifier for better performance
CREATE INDEX IF NOT EXISTS idx_guest_trials_identifier
ON guest_trials(identifier);

-- Create index on session_id
CREATE INDEX IF NOT EXISTS idx_guest_trials_session_id
ON guest_trials(session_id);

-- Create index on last_date for daily reset queries
CREATE INDEX IF NOT EXISTS idx_guest_trials_last_date
ON guest_trials(last_date);

-- Comment: This migration improves guest tracking by using a combination of IP and Session ID
-- instead of relying solely on IP address, which can be shared by multiple users behind NAT/Proxy
