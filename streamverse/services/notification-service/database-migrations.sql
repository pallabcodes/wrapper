-- Database Migrations for Notification Service
-- Run these migrations after deploying the service

-- Migration 1: Add time-based unique constraints for advanced idempotency
-- This prevents duplicate notifications within the same hour using database triggers

-- Add function for time-based uniqueness (PostgreSQL specific)
CREATE OR REPLACE FUNCTION check_notification_uniqueness()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if a similar notification exists within the last hour
    IF EXISTS (
        SELECT 1 FROM notifications
        WHERE recipient = NEW.recipient
        AND type = NEW.type
        AND created_at >= NOW() - INTERVAL '1 hour'
        AND id != NEW.id
    ) THEN
        RAISE EXCEPTION 'Duplicate notification within 1-hour window for recipient % and type %', NEW.recipient, NEW.type;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for time-based uniqueness
CREATE TRIGGER notification_uniqueness_trigger
    BEFORE INSERT ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION check_notification_uniqueness();

-- Migration 2: Add indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_recipient_type_created_at
ON notifications (recipient, type, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_status_created_at
ON notifications (status, created_at DESC);

-- Migration 3: Add partial indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_pending
ON notifications (created_at DESC)
WHERE status = 'pending';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_failed
ON notifications (created_at DESC)
WHERE status = 'failed';

-- Migration 4: Add idempotency key constraint (optional, for external systems)
ALTER TABLE notifications
ADD CONSTRAINT unique_idempotency_key
UNIQUE (idempotency_key)
DEFERRABLE INITIALLY DEFERRED;

-- Migration 5: Create event store table (for event sourcing)
CREATE TABLE IF NOT EXISTS event_store (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(255) NOT NULL UNIQUE,
    event_type VARCHAR(255) NOT NULL,
    aggregate_id VARCHAR(255) NOT NULL,
    event_data JSONB NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1,

    -- Indexes for performance
    INDEX idx_event_store_aggregate_id (aggregate_id),
    INDEX idx_event_store_event_type (event_type),
    INDEX idx_event_store_timestamp (timestamp DESC)
);

-- Migration 6: Create outbox table (for transactional messaging)
CREATE TABLE IF NOT EXISTS outbox (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(255) NOT NULL UNIQUE,
    event_type VARCHAR(255) NOT NULL,
    aggregate_id VARCHAR(255) NOT NULL,
    event_data JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    retry_count INTEGER DEFAULT 0,
    last_error TEXT,

    -- Indexes for performance
    INDEX idx_outbox_status_created_at (status, created_at),
    INDEX idx_outbox_pending (created_at) WHERE status = 'pending'
);

-- Migration 7: Create dead letter queue table
CREATE TABLE IF NOT EXISTS dead_letter_queue (
    id SERIAL PRIMARY KEY,
    original_event_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(255) NOT NULL,
    aggregate_id VARCHAR(255) NOT NULL,
    event_data JSONB NOT NULL,
    failure_reason VARCHAR(255) NOT NULL,
    retry_count INTEGER DEFAULT 0,
    failed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_error TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'failed',

    -- Indexes for monitoring
    INDEX idx_dlq_failed_at (failed_at DESC),
    INDEX idx_dlq_event_type (event_type),
    INDEX idx_dlq_aggregate_id (aggregate_id)
);

-- Comments for documentation
COMMENT ON TABLE event_store IS 'Event sourcing table for complete audit trail';
COMMENT ON TABLE outbox IS 'Transactional outbox for reliable messaging';
COMMENT ON TABLE dead_letter_queue IS 'Dead letter queue for failed message processing';

-- Grant permissions (adjust based on your database users)
-- GRANT SELECT, INSERT, UPDATE ON event_store TO notification_service;
-- GRANT SELECT, INSERT, UPDATE ON outbox TO notification_service;
-- GRANT SELECT, INSERT, UPDATE ON dead_letter_queue TO notification_service;
