-- Add expiry field to sessions table for time-limited access (exams, temporary sessions)

ALTER TABLE kilat_baca.sessions 
ADD COLUMN expires_at TIMESTAMPTZ;

-- Index for efficient expiry checks in public API
CREATE INDEX sessions_expires_at_idx ON kilat_baca.sessions(expires_at) 
WHERE expires_at IS NOT NULL;

-- Composite index for active session queries (share_token + expiry check)
CREATE INDEX sessions_token_expiry_idx ON kilat_baca.sessions(share_token, expires_at);
