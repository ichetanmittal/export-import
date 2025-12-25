#!/bin/bash

# Apply database migrations to Supabase
# Usage: ./scripts/apply-migrations.sh

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Database Migrations...${NC}\n"

# Database connection info
DB_HOST="db.foiaqmhvdxoeimmcutwy.supabase.co"
DB_PORT="6543"
DB_NAME="postgres"
DB_USER="postgres"
DB_PASSWORD="${SUPABASE_DB_PASSWORD:-xaultschetan123}"

# Build connection string
export PGPASSWORD="$DB_PASSWORD"

# Migration files in order
# NOTE: 20250101000000_create_pending_bank_actions.sql is SKIPPED because:
# - It creates 'pending_bank_actions' table but code uses 'pending_actions'
# - Base schema already creates the correct 'pending_actions' table
MIGRATIONS=(
  "supabase/migrations/20250100000000_create_base_schema.sql"
  "supabase/migrations/20250103000000_create_user_connections.sql"
  "supabase/migrations/20250125000000_refactor_to_organizations.sql"
  "supabase/migrations/20250125000001_migrate_data_to_organizations.sql"
  "supabase/migrations/20250125000002_update_ptt_tokens_for_organizations.sql"
)

# Function to run a migration
run_migration() {
  local file=$1
  local filename=$(basename "$file")

  echo -e "${BLUE}📄 Running: $filename${NC}"

  if psql "postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME" -f "$file" > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ Success${NC}\n"
  else
    echo -e "${RED}   ❌ Failed${NC}"
    echo -e "${RED}   Trying without SSL...${NC}"

    if psql "postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME?sslmode=disable" -f "$file"; then
      echo -e "${GREEN}   ✅ Success (no SSL)${NC}\n"
    else
      echo -e "${RED}   ❌ Migration failed: $filename${NC}\n"
      exit 1
    fi
  fi
}

# Check if psql is installed
if ! command -v psql &> /dev/null; then
  echo -e "${RED}❌ psql is not installed. Please install PostgreSQL client.${NC}"
  echo -e "${BLUE}   Install with: brew install postgresql${NC}"
  exit 1
fi

# Run all migrations
for migration in "${MIGRATIONS[@]}"; do
  if [ -f "$migration" ]; then
    run_migration "$migration"
  else
    echo -e "${RED}❌ File not found: $migration${NC}"
    exit 1
  fi
done

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}✅ All migrations completed successfully!${NC}"
echo -e "${GREEN}================================================${NC}\n"

# Unset password
unset PGPASSWORD
