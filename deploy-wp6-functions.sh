#!/bin/bash

# WP6 Edge Functions Deployment Script
# Usage: ./deploy-wp6-functions.sh [--token <SUPABASE_ACCESS_TOKEN>]
# Or set: export SUPABASE_ACCESS_TOKEN="your-token"

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# Configuration
PROJECT_REF="afcmznpvlfmonxoiqdxm"
SUPABASE_URL="https://${PROJECT_REF}.supabase.co"

# Functions to deploy
FUNCTIONS=(
  "generate-daily-quests"
  "refresh-choice-quests"
  "complete-quest-wp6"
)

echo "═══════════════════════════════════════════════════════════════"
echo "WP6 Edge Functions Deployment"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Check for access token
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  # Try to get from arguments
  if [ "$1" = "--token" ] && [ -n "$2" ]; then
    SUPABASE_ACCESS_TOKEN="$2"
    shift 2
  fi
fi

if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "❌ ERROR: No Supabase access token provided."
  echo ""
  echo "Methods to provide token:"
  echo "  1. Via environment variable:"
  echo "     export SUPABASE_ACCESS_TOKEN=\"<your-token>\""
  echo "     ./deploy-wp6-functions.sh"
  echo ""
  echo "  2. Via command argument:"
  echo "     ./deploy-wp6-functions.sh --token <your-token>"
  echo ""
  echo "  3. Via GitHub Actions (configure SUPABASE_ACCESS_TOKEN secret)"
  echo ""
  echo "Get your token: https://app.supabase.com/account/tokens"
  exit 1
fi

echo "✓ Supabase access token found"
echo "✓ Project: $PROJECT_REF"
echo "✓ URL: $SUPABASE_URL"
echo ""

# Check Supabase CLI
if ! command -v supabase &> /dev/null; then
  echo "❌ ERROR: Supabase CLI not found. Install with:"
  echo "  brew install supabase/tap/supabase"
  exit 1
fi

echo "✓ Supabase CLI found ($(supabase --version))"
echo ""

# Export token for supabase CLI
export SUPABASE_ACCESS_TOKEN

echo "Deploying edge functions..."
echo ""

for func in "${FUNCTIONS[@]}"; do
  echo "📦 Deploying: $func"
  if supabase functions deploy "$func" 2>&1 | tail -3; then
    echo "✓ $func deployed successfully"
  else
    echo "✗ $func deployment failed"
    exit 1
  fi
  echo ""
done

echo "═══════════════════════════════════════════════════════════════"
echo "✅ All functions deployed successfully!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Function URLs:"
for func in "${FUNCTIONS[@]}"; do
  echo "  - $SUPABASE_URL/functions/v1/$func"
done

echo ""
echo "Next steps:"
echo "  1. Read WP6-DEPLOYMENT-LOG.md for testing procedures"
echo "  2. Run verification tests to confirm all functions work"
echo "  3. Create a test user and run through the quest flow"
echo ""
