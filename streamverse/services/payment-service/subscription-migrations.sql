-- Subscription Tables Migration
-- Run this after the payment tables are created

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'incomplete',
    interval VARCHAR(20) NOT NULL DEFAULT 'month',
    amount INTEGER NOT NULL, -- Amount in cents
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    description TEXT NOT NULL,
    current_period_start TIMESTAMP NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    canceled_at TIMESTAMP NULL,
    stripe_subscription_id VARCHAR(255) NULL,
    stripe_customer_id VARCHAR(255) NULL,
    stripe_price_id VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,

    -- Indexes for performance
    INDEX idx_subscriptions_user_id (user_id),
    INDEX idx_subscriptions_status (status),
    INDEX idx_subscriptions_stripe_subscription_id (stripe_subscription_id),
    INDEX idx_subscriptions_stripe_customer_id (stripe_customer_id),
    INDEX idx_subscriptions_current_period_end (current_period_end),

    -- Foreign key constraint (assuming users table exists)
    -- CONSTRAINT fk_subscriptions_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    -- Unique constraint to prevent duplicate active subscriptions per user
    CONSTRAINT uk_user_active_subscription UNIQUE (user_id, status) DEFERRABLE INITIALLY DEFERRED
);

-- Create subscription_audit_log table for compliance
CREATE TABLE IF NOT EXISTS subscription_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL,
    user_id UUID NOT NULL,
    action VARCHAR(100) NOT NULL, -- 'created', 'activated', 'cancelled', 'updated', etc.
    old_status VARCHAR(50) NULL,
    new_status VARCHAR(50) NULL,
    stripe_event_id VARCHAR(255) NULL,
    metadata JSONB NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    INDEX idx_subscription_audit_subscription_id (subscription_id),
    INDEX idx_subscription_audit_user_id (user_id),
    INDEX idx_subscription_audit_created_at (created_at)
);

-- Create subscription_plans table for plan management
CREATE TABLE IF NOT EXISTS subscription_plans (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    interval VARCHAR(20) NOT NULL,
    amount INTEGER NOT NULL, -- Amount in cents
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    stripe_price_id VARCHAR(255) NULL,
    features JSONB NOT NULL DEFAULT '[]',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    INDEX idx_subscription_plans_active (active),
    INDEX idx_subscription_plans_interval (interval)
);

-- Insert default subscription plans
INSERT INTO subscription_plans (id, name, description, interval, amount, currency, stripe_price_id, features, active) VALUES
('basic-monthly', 'Basic Monthly', 'Basic streaming access with monthly billing', 'month', 999, 'USD', 'price_basic_monthly', '["HD streaming", "1 device", "Basic support"]', true),
('premium-monthly', 'Premium Monthly', 'Premium streaming access with monthly billing', 'month', 1499, 'USD', 'price_premium_monthly', '["4K streaming", "3 devices", "Priority support", "Offline downloads"]', true),
('basic-quarterly', 'Basic Quarterly', 'Basic streaming access with quarterly billing', 'quarter', 2799, 'USD', 'price_basic_quarterly', '["HD streaming", "1 device", "Basic support", "Save 10%"]', true),
('premium-quarterly', 'Premium Quarterly', 'Premium streaming access with quarterly billing', 'quarter', 3999, 'USD', 'price_premium_quarterly', '["4K streaming", "3 devices", "Priority support", "Offline downloads", "Save 11%"]', true),
('basic-yearly', 'Basic Yearly', 'Basic streaming access with yearly billing', 'year', 9999, 'USD', 'price_basic_yearly', '["HD streaming", "1 device", "Basic support", "Save 17%"]', true),
('premium-yearly', 'Premium Yearly', 'Premium streaming access with yearly billing', 'year', 14999, 'USD', 'price_premium_yearly', '["4K streaming", "3 devices", "Priority support", "Offline downloads", "Save 17%"]', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    amount = EXCLUDED.amount,
    stripe_price_id = EXCLUDED.stripe_price_id,
    features = EXCLUDED.features,
    updated_at = NOW();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
