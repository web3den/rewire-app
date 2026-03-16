# Rewire App — Development Commands

.PHONY: dev test lint fmt check seed db-reset db-migrate functions-serve

# ============================================================
# Local Development
# ============================================================

# Start Supabase local dev stack
dev:
	supabase start

# Stop local dev stack
stop:
	supabase stop

# Serve edge functions locally
functions-serve:
	supabase functions serve --env-file .env.local

# ============================================================
# Database
# ============================================================

# Run migrations
db-migrate:
	supabase db push

# Reset database (drops all data!)
db-reset:
	supabase db reset

# Seed database with sample data
seed:
	supabase db reset && echo "Database reset and seeded"

# Generate TypeScript types from schema
db-types:
	supabase gen types typescript --local > supabase/functions/_shared/database.types.ts

# ============================================================
# Testing
# ============================================================

# Run all tests
test:
	deno test supabase/functions/tests/ --allow-env --allow-net --allow-read

# Run tests in watch mode
test-watch:
	deno test supabase/functions/tests/ --allow-env --allow-net --allow-read --watch

# Run specific test file
test-file:
	deno test supabase/functions/tests/$(FILE) --allow-env --allow-net --allow-read

# ============================================================
# Code Quality
# ============================================================

# Lint all TypeScript
lint:
	deno lint supabase/functions/

# Format all TypeScript
fmt:
	deno fmt supabase/functions/

# Type check
check:
	deno check supabase/functions/**/*.ts

# Run all quality checks
quality: lint check test

# ============================================================
# Deployment
# ============================================================

# Deploy all edge functions
deploy-functions:
	supabase functions deploy guide-chat
	supabase functions deploy get-daily-quests
	supabase functions deploy complete-quest
	supabase functions deploy create-profile
	supabase functions deploy weekly-quest-gen
	supabase functions deploy memory-compress
	supabase functions deploy notification-send
	supabase functions deploy crisis-alert
	supabase functions deploy verify-subscription
	supabase functions deploy apple-webhook

# Deploy single function
deploy:
	supabase functions deploy $(FUNC)

# Link to remote project
link:
	supabase link --project-ref $(PROJECT_REF)

# Push schema to remote
push:
	supabase db push
