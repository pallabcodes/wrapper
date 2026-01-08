# ClickHouse configuration for StreamVerse logging
# This creates the required table structure for log ingestion

# Log storage table with MergeTree engine for efficient queries
CREATE DATABASE IF NOT EXISTS logs;

CREATE TABLE IF NOT EXISTS logs.streamverse
(
    timestamp DateTime64(9) DEFAULT now64(9),
    level String,
    service String,
    message String,
    correlationId String,
    traceId String,
    spanId String,
    context String,
    host String,
    container String,
    
    -- Indexes for common queries
    INDEX idx_level level TYPE set(100) GRANULARITY 1,
    INDEX idx_service service TYPE set(100) GRANULARITY 1,
    INDEX idx_correlationId correlationId TYPE bloom_filter(0.01) GRANULARITY 1
)
ENGINE = MergeTree()
PARTITION BY toYYYYMMDD(timestamp)
ORDER BY (service, timestamp)
TTL timestamp + INTERVAL 30 DAY
SETTINGS index_granularity = 8192;
