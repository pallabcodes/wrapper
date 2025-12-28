-- Database schema initialization for FlashMart microservices
-- This script creates separate schemas for each service to achieve logical separation

-- Create schemas for each service
CREATE SCHEMA IF NOT EXISTS user_service;
CREATE SCHEMA IF NOT EXISTS payment_service;
CREATE SCHEMA IF NOT EXISTS catalog_service;
CREATE SCHEMA IF NOT EXISTS order_service;
CREATE SCHEMA IF NOT EXISTS video_service;

-- Grant permissions to the flashmart user on all schemas
GRANT ALL ON SCHEMA user_service TO flashmart;
GRANT ALL ON SCHEMA payment_service TO flashmart;
GRANT ALL ON SCHEMA catalog_service TO flashmart;
GRANT ALL ON SCHEMA order_service TO flashmart;
GRANT ALL ON SCHEMA video_service TO flashmart;

-- Set default privileges for future objects in each schema
ALTER DEFAULT PRIVILEGES IN SCHEMA user_service GRANT ALL ON TABLES TO flashmart;
ALTER DEFAULT PRIVILEGES IN SCHEMA payment_service GRANT ALL ON TABLES TO flashmart;
ALTER DEFAULT PRIVILEGES IN SCHEMA catalog_service GRANT ALL ON TABLES TO flashmart;
ALTER DEFAULT PRIVILEGES IN SCHEMA order_service GRANT ALL ON TABLES TO flashmart;
ALTER DEFAULT PRIVILEGES IN SCHEMA video_service GRANT ALL ON TABLES TO flashmart;

-- Set search path for the user to include all service schemas
ALTER USER flashmart SET search_path TO user_service, payment_service, catalog_service, order_service, video_service, public;

-- Create a function to easily switch between schemas (for development/admin purposes)
CREATE OR REPLACE FUNCTION set_service_schema(service_name TEXT)
RETURNS TEXT AS $$
BEGIN
  EXECUTE format('SET LOCAL search_path TO %I, public', service_name);
  RETURN 'Schema set to: ' || service_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance (if needed)
-- Note: These will be created automatically by TypeORM synchronize
-- But we can add additional indexes here for cross-schema queries if needed

-- Example: Create a view for cross-service reporting (if needed in future)
-- This would allow querying across services while maintaining separation
-- CREATE VIEW admin.user_orders AS
-- SELECT
--   u.name as user_name,
--   u.email,
--   o.id as order_id,
--   o.total_amount,
--   o.status,
--   o.created_at
-- FROM user_service.users u
-- JOIN order_service.orders o ON u.id = o.user_id;

-- Grant read-only access to admin schema for reporting (future enhancement)
-- GRANT USAGE ON SCHEMA admin TO flashmart;
-- GRANT SELECT ON ALL TABLES IN SCHEMA admin TO flashmart;

COMMENT ON SCHEMA user_service IS 'User management service - handles authentication and user profiles';
COMMENT ON SCHEMA payment_service IS 'Payment processing service - manages transactions and payment methods';
COMMENT ON SCHEMA catalog_service IS 'Product catalog service - manages products and categories';
COMMENT ON SCHEMA order_service IS 'Order management service - handles order lifecycle and event sourcing';
COMMENT ON SCHEMA video_service IS 'Video content service - manages video uploads and processing';
