#!/usr/bin/env bash
# Applies every migration to a fresh throwaway database and runs the SQL tests.
# Needs a local Postgres 15+ reachable through the standard libpq variables
# (PGHOST, PGPORT, PGUSER, PGPASSWORD) with a superuser. Never point it at prod:
# it drops and recreates the database named by TEST_DB (default eskool_test).
set -euo pipefail

cd "$(dirname "$0")/.."
TEST_DB="${TEST_DB:-eskool_test}"
PSQL=(psql -X -q -v ON_ERROR_STOP=1 -d "$TEST_DB")

dropdb --if-exists "$TEST_DB"
createdb "$TEST_DB"

"${PSQL[@]}" -f supabase/tests/_supabase_stub.sql
for f in supabase/migrations/*.sql; do
  echo "migrate  $f"
  "${PSQL[@]}" -f "$f"
done
"${PSQL[@]}" -f supabase/tests/_helpers.sql

status=0
for f in supabase/tests/*.test.sql; do
  if out=$("${PSQL[@]}" -f "$f" 2>&1 >/dev/null); then
    echo "pass     $f"
  else
    echo "FAIL     $f"
    echo "$out" | sed 's/^/         /'
    status=1
  fi
done
exit $status
