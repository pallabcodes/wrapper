-- Rollback Migration: From Service Schemas back to Shared Database
-- WARNING: This script should only be used if migration fails and rollback is necessary

-- Step 1: Restore data from backup (if backup was created)
-- INSERT INTO public.users SELECT * FROM backup_20241226.users;
-- INSERT INTO public.payments SELECT * FROM backup_20241226.payments;
-- INSERT INTO public.products SELECT * FROM backup_20241226.products;
-- INSERT INTO public.categories SELECT * FROM backup_20241226.categories;
-- INSERT INTO public.orders SELECT * FROM backup_20241226.orders;
-- INSERT INTO public.order_events SELECT * FROM backup_20241226.order_events;

-- Step 2: Drop service schemas (WARNING: This will delete all data in schemas)
-- DROP SCHEMA IF EXISTS user_service CASCADE;
-- DROP SCHEMA IF EXISTS payment_service CASCADE;
-- DROP SCHEMA IF EXISTS catalog_service CASCADE;
-- DROP SCHEMA IF EXISTS order_service CASCADE;
-- DROP SCHEMA IF EXISTS video_service CASCADE;
-- DROP SCHEMA IF EXISTS admin CASCADE;

-- Step 3: Reset user search path
-- ALTER USER flashmart SET search_path TO public;

-- Note: In production, you would:
-- 1. Create proper backups before migration
-- 2. Have a proper rollback strategy
-- 3. Test rollback procedures
-- 4. Have monitoring in place during migration

COMMENT ON DATABASE flashmart IS 'Rolled back to shared database architecture';
