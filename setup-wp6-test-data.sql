-- WP6 Test Data Setup
-- Creates a test user and initializes required records for WP6 testing
-- 
-- Usage: Connect to Supabase SQL editor and paste this entire script

-- Test user ID (consistent for all tests)
-- 550e8400-e29b-41d4-a716-446655440000

BEGIN;

-- 1. Create test user profile
INSERT INTO user_profiles (
  id,
  display_name,
  date_of_birth,
  onboarding_completed,
  first_quest_completed,
  created_at,
  prologue_start_date
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::UUID,
  'WP6 Test User',
  '2000-01-15',
  true,
  true,
  NOW(),
  NOW() - INTERVAL '7 days'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Create user stats record
INSERT INTO user_stats (
  user_id,
  body,
  mind,
  heart,
  courage,
  created_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::UUID,
  5.0,
  5.0,
  5.0,
  5.0,
  NOW()
)
ON CONFLICT (user_id) DO NOTHING;

-- 3. Create user currencies record (for Fragment tracking)
INSERT INTO user_currencies (
  user_id,
  currency_type,
  balance,
  lifetime_earned,
  created_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::UUID,
  'fragments',
  0,
  0,
  NOW()
)
ON CONFLICT (user_id, currency_type) DO NOTHING;

-- 4. Initialize user sparks (WP6-specific)
INSERT INTO user_sparks (
  user_id,
  sparks,
  last_earned,
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::UUID,
  0,
  NULL,
  NOW()
)
ON CONFLICT (user_id) DO NOTHING;

COMMIT;

-- Verification queries
-- Run these to confirm test user is ready:

-- Check user profile exists:
-- SELECT id, display_name, onboarding_completed FROM user_profiles 
--   WHERE id = '550e8400-e29b-41d4-a716-446655440000'::UUID;

-- Check user stats initialized:
-- SELECT user_id, body, mind, heart, courage FROM user_stats 
--   WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'::UUID;

-- Check user sparks initialized (should be 0):
-- SELECT user_id, sparks FROM user_sparks 
--   WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'::UUID;

-- All should return 1 row each.
