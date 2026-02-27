#!/usr/bin/env bash
set -euo pipefail

# Memex Test Script
# Usage: ./scripts/test.sh [command]
#
# Commands:
#   all       Run everything (default)
#   unit      Run unit tests only
#   build     Build and verify CLI
#   mcp       Test MCP server tools/list
#   e2e       Full end-to-end: init → save → recall → search → delete
#   clean     Remove test artifacts

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
MCP_DIR="$ROOT_DIR/packages/memex-mcp"
DIST="$MCP_DIR/dist/index.js"

# Test data directory (isolated from real data)
export XDG_CONFIG_HOME="/tmp/memex-test-config-$$"
export XDG_DATA_HOME="/tmp/memex-test-data-$$"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}✓${NC} $1"; }
fail() { echo -e "${RED}✗${NC} $1"; exit 1; }
info() { echo -e "${YELLOW}→${NC} $1"; }

cleanup() {
  rm -rf "/tmp/memex-test-config-$$" "/tmp/memex-test-data-$$"
}
trap cleanup EXIT

cmd_unit() {
  info "Running unit tests..."
  cd "$ROOT_DIR"
  npm test -w packages/memex-mcp
  pass "Unit tests passed"
}

cmd_build() {
  info "Building memex-mcp..."
  cd "$ROOT_DIR"
  npm run build -w packages/memex-mcp 2>&1 | tail -3

  info "Verifying CLI..."
  node "$DIST" --version > /dev/null 2>&1 || fail "CLI --version failed"
  pass "CLI runs"

  node "$DIST" --help > /dev/null 2>&1 || fail "CLI --help failed"
  pass "CLI help works"
}

cmd_mcp() {
  info "Testing MCP server tools/list..."

  # Need init first for MCP to start
  cmd_init_silent

  local result
  result=$(echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}
{"jsonrpc":"2.0","id":2,"method":"tools/list"}' | node "$DIST" serve 2>/dev/null)

  echo "$result" | grep -q "save_memory" || fail "save_memory not found in tools/list"
  echo "$result" | grep -q "recall_memories" || fail "recall_memories not found"
  echo "$result" | grep -q "search_memories" || fail "search_memories not found"
  echo "$result" | grep -q "delete_memory" || fail "delete_memory not found"
  pass "All 4 MCP tools registered"
}

cmd_init_silent() {
  # Silent init for other tests that need it
  node "$DIST" init > /dev/null 2>&1 || true
}

cmd_e2e() {
  info "Running E2E test..."

  # 1. Init
  info "  Step 1: memex init"
  node "$DIST" init 2>&1 | grep -q "Setup complete" || fail "Init failed"
  pass "  Init completed"

  # 2. Status
  info "  Step 2: memex status"
  node "$DIST" status 2>&1 | grep -q "Encryption: Configured" || fail "Status doesn't show encryption"
  pass "  Status shows configured"

  # 3. Save a memory via MCP
  info "  Step 3: save_memory via MCP"
  local save_result
  save_result=$(printf '%s\n%s\n' \
    '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' \
    '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"save_memory","arguments":{"content":"The auth system uses JWT with refresh tokens stored in httpOnly cookies","tags":["auth","architecture"]}}}' \
    | node "$DIST" serve 2>/dev/null || true)

  if [ -z "$save_result" ]; then
    fail "Save returned empty response (server may have crashed)"
  fi
  echo "$save_result" | grep -q 'duplicate.*false' || fail "Save didn't return duplicate:false"
  pass "  Memory saved"

  # 4. Save duplicate
  info "  Step 4: Duplicate detection"
  local dup_result
  dup_result=$(printf '%s\n%s\n' \
    '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' \
    '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"save_memory","arguments":{"content":"The auth system uses JWT with refresh tokens stored in httpOnly cookies","tags":["auth"]}}}' \
    | node "$DIST" serve 2>/dev/null || true)

  echo "$dup_result" | grep -q 'duplicate.*true' || fail "Duplicate not detected"
  pass "  Duplicate detected"

  # 5. Save another memory
  printf '%s\n%s\n' \
    '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' \
    '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"save_memory","arguments":{"content":"Database uses PostgreSQL with Prisma ORM for type-safe queries","tags":["database","architecture"]}}}' \
    | node "$DIST" serve > /dev/null 2>&1 || true

  # 6. Recall memories
  info "  Step 5: recall_memories"
  local recall_result
  recall_result=$(printf '%s\n%s\n' \
    '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' \
    '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"recall_memories","arguments":{"query":"auth JWT"}}}' \
    | node "$DIST" serve 2>/dev/null || true)

  echo "$recall_result" | grep -q 'JWT' || fail "Recall didn't find JWT memory"
  pass "  Recall found memory via FTS"

  # 7. Search across projects
  info "  Step 6: search_memories"
  local search_result
  search_result=$(printf '%s\n%s\n' \
    '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' \
    '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"search_memories","arguments":{"query":"architecture"}}}' \
    | node "$DIST" serve 2>/dev/null || true)

  if [ -z "$search_result" ]; then
    fail "Search returned empty response"
  fi
  echo "$search_result" | grep -q 'memories' || fail "Search didn't return memories"
  pass "  Cross-project search works"

  # 8. CLI memories list
  info "  Step 7: memex memories list"
  local list_result
  list_result=$(node "$DIST" memories list 2>&1)
  echo "$list_result" | grep -q "auth" || fail "List didn't show memories"
  pass "  CLI list works"

  # 9. Delete memory
  info "  Step 8: delete_memory"
  local mem_id
  mem_id=$(echo "$save_result" | grep -oE '01[A-Z0-9]{24}' | head -1)
  if [ -n "$mem_id" ]; then
    local del_result
    del_result=$(printf '%s\n%s\n' \
      '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' \
      "{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"tools/call\",\"params\":{\"name\":\"delete_memory\",\"arguments\":{\"id\":\"$mem_id\"}}}" \
      | node "$DIST" serve 2>/dev/null || true)

    echo "$del_result" | grep -q 'deleted.*true' || fail "Delete failed"
    pass "  Memory deleted"
  else
    info "  Skipped delete (couldn't extract ID)"
  fi

  # 10. Export
  info "  Step 9: memex export"
  local export_result
  export_result=$(node "$DIST" export 2>&1)
  echo "$export_result" | grep -q "PostgreSQL" || fail "Export missing memory"
  pass "  Export works"

  echo ""
  pass "All E2E tests passed!"
}

cmd_clean() {
  info "Cleaning test artifacts..."
  rm -rf /tmp/memex-test-config-* /tmp/memex-test-data-*
  pass "Cleaned"
}

reset_test_env() {
  rm -rf "$XDG_CONFIG_HOME" "$XDG_DATA_HOME"
}

cmd_all() {
  echo "═══════════════════════════════════"
  echo "  Memex Test Suite"
  echo "═══════════════════════════════════"
  echo ""

  cmd_build
  echo ""
  cmd_unit
  echo ""
  cmd_mcp
  echo ""
  reset_test_env
  cmd_e2e
  echo ""

  echo "═══════════════════════════════════"
  pass "All tests passed!"
  echo "═══════════════════════════════════"
}

# Route to command
case "${1:-all}" in
  all)   cmd_all ;;
  unit)  cmd_unit ;;
  build) cmd_build ;;
  mcp)   cmd_mcp ;;
  e2e)   cmd_e2e ;;
  clean) cmd_clean ;;
  *)     echo "Usage: $0 {all|unit|build|mcp|e2e|clean}"; exit 1 ;;
esac
