-- Database Migration: From Shared Tables to Service-Specific Schemas
-- This script migrates existing data from shared tables to service-specific schemas

-- Step 1: Create backup of existing data (if not already done)
-- CREATE SCHEMA backup_20241226 AS SELECT * FROM users;
-- CREATE SCHEMA backup_20241226 AS SELECT * FROM payments;
-- CREATE SCHEMA backup_20241226 AS SELECT * FROM products;
-- CREATE SCHEMA backup_20241226 AS SELECT * FROM categories;
-- CREATE SCHEMA backup_20241226 AS SELECT * FROM orders;
-- CREATE SCHEMA backup_20241226 AS SELECT * FROM order_events;

-- Step 2: Migrate data to service schemas

-- Migrate user data
INSERT INTO user_service.users (id, email, name, password_hash, avatar_url, email_verified, created_at, updated_at)
SELECT id, email, name, password_hash, avatar_url, email_verified, created_at, updated_at
FROM public.users
ON CONFLICT (id) DO NOTHING;

-- Migrate payment data
INSERT INTO payment_service.payments (
    id, user_id, amount, currency, status, stripe_payment_intent_id,
    order_id, metadata, created_at, updated_at
)
SELECT id, user_id, amount, currency, status, stripe_payment_intent_id,
       order_id, metadata, created_at, updated_at
FROM public.payments
ON CONFLICT (id) DO NOTHING;

-- Migrate product data
INSERT INTO catalog_service.products (
    id, name, description, price, stock, image_url, images, category_id,
    seller_id, is_active, attributes, created_at, updated_at
)
SELECT id, name, description, price, stock, image_url, images, category_id,
       seller_id, is_active, attributes, created_at, updated_at
FROM public.products
ON CONFLICT (id) DO NOTHING;

-- Migrate category data
INSERT INTO catalog_service.categories (id, name, description, image_url, parent_id, created_at, updated_at)
SELECT id, name, description, image_url, parent_id, created_at, updated_at
FROM public.categories
ON CONFLICT (id) DO NOTHING;

-- Migrate order data
INSERT INTO order_service.orders (
    id, user_id, items, total_amount, status, payment_id, created_at, updated_at, version
)
SELECT id, user_id, items, total_amount, status, payment_id, created_at, updated_at, version
FROM public.orders
ON CONFLICT (id) DO NOTHING;

-- Migrate order events
INSERT INTO order_service.order_events (
    id, order_id, event_type, payload, version, created_at
)
SELECT id, order_id, event_type, payload, version, created_at
FROM public.order_events
ON CONFLICT (id) DO NOTHING;

-- Step 3: Update foreign key references (if any cross-schema references exist)
-- Note: In a proper microservices architecture, we avoid cross-schema foreign keys
-- Instead, we use event-driven updates and data duplication where needed

-- Step 4: Create views for cross-service reporting (optional)
-- These views can be used for analytics and reporting without breaking service boundaries

CREATE OR REPLACE VIEW admin.user_orders AS
SELECT
    u.name as user_name,
    u.email as user_email,
    o.id as order_id,
    o.total_amount,
    o.status as order_status,
    o.created_at as order_date,
    p.status as payment_status
FROM user_service.users u
LEFT JOIN order_service.orders o ON u.id = o.user_id::text
LEFT JOIN payment_service.payments p ON o.payment_id::text = p.id::text;

CREATE OR REPLACE VIEW admin.product_sales AS
SELECT
    pr.name as product_name,
    pr.price,
    cat.name as category_name,
    COUNT(oi->>'productId') as total_sold,
    SUM((oi->>'quantity')::int) as total_quantity
FROM catalog_service.products pr
LEFT JOIN catalog_service.categories cat ON pr.category_id::text = cat.id::text
LEFT JOIN order_service.orders o ON jsonb_exists(o.items, pr.id::text)
LEFT JOIN LATERAL jsonb_array_elements(o.items) oi ON oi->>'productId' = pr.id::text
WHERE o.status = 'DELIVERED'
GROUP BY pr.id, pr.name, pr.price, cat.name;

-- Step 5: Set permissions for admin views
GRANT SELECT ON admin.user_orders TO flashmart;
GRANT SELECT ON admin.product_sales TO flashmart;

-- Step 6: Validation queries to verify migration
-- Run these after migration to ensure data integrity

-- SELECT COUNT(*) as users_migrated FROM user_service.users;
-- SELECT COUNT(*) as payments_migrated FROM payment_service.payments;
-- SELECT COUNT(*) as products_migrated FROM catalog_service.products;
-- SELECT COUNT(*) as orders_migrated FROM order_service.orders;

-- Step 7: Optional - Drop old tables after verification
-- WARNING: Only do this after thorough testing and backup verification
-- DROP TABLE public.users CASCADE;
-- DROP TABLE public.payments CASCADE;
-- DROP TABLE public.products CASCADE;
-- DROP TABLE public.categories CASCADE;
-- DROP TABLE public.orders CASCADE;
-- DROP TABLE public.order_events CASCADE;

-- Step 8: Update search paths for backward compatibility (temporary)
-- This allows existing queries to work during transition
-- ALTER USER flashmart SET search_path TO user_service, payment_service, catalog_service, order_service, video_service, public;

COMMENT ON SCHEMA user_service IS 'User service schema - migrated from shared database';
COMMENT ON SCHEMA payment_service IS 'Payment service schema - migrated from shared database';
COMMENT ON SCHEMA catalog_service IS 'Catalog service schema - migrated from shared database';
COMMENT ON SCHEMA order_service IS 'Order service schema - migrated from shared database';
