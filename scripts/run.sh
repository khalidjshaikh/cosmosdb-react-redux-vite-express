#!/usr/bin/env bash
#
# Start the API + Vite dev servers with an explicit data store.
#
# Usage:
#   ./scripts/run.sh            # seeded in-memory store (default, no Cosmos needed)
#   ./scripts/run.sh memory     # same
#   ./scripts/run.sh cosmos     # Cosmos DB emulator / Azure account from .env
#
# DATA_STORE is exported so it overrides the value in .env for both child
# processes (dotenv never replaces variables that are already set).
#
# Ports: the API starts at $PORT (default 8080) and the UI at $WEB_PORT
# (default 3000). If either is taken, the next free port is used and Vite's
# /api proxy is pointed at the chosen API port, so the two can never drift.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

store="${1:-memory}"

if [[ "$store" != "memory" && "$store" != "cosmos" ]]; then
  echo "Usage: $0 [memory|cosmos]" >&2
  exit 1
fi

concurrently_bin="$repo_root/node_modules/.bin/concurrently"
if [[ ! -x "$concurrently_bin" ]]; then
  echo "[dev] concurrently is not installed. Run 'npm install' first." >&2
  exit 1
fi

# Exit 0 when the port can be bound on all interfaces (IPv4 + IPv6).
port_is_free() {
  node -e '
    const net = require("node:net");
    const server = net.createServer();
    server.once("error", () => process.exit(1));
    server.listen(Number(process.argv[1]), () => server.close(() => process.exit(0)));
  ' "$1"
}

find_free_port() {
  local port="$1" last="$2"
  while (( port <= last )); do
    if port_is_free "$port"; then
      printf '%s' "$port"
      return 0
    fi
    port=$((port + 1))
  done
  return 1
}

requested_api_port="${PORT:-8080}"
api_port="$(find_free_port "$requested_api_port" $((requested_api_port + 50)))" || {
  echo "[dev] No free API port between $requested_api_port and $((requested_api_port + 50))." >&2
  exit 1
}

requested_web_port="${WEB_PORT:-3000}"
web_port="$(find_free_port "$requested_web_port" $((requested_web_port + 50)))" || {
  echo "[dev] No free UI port between $requested_web_port and $((requested_web_port + 50))." >&2
  exit 1
}

if (( api_port != requested_api_port )); then
  echo "[dev] port $requested_api_port is in use; API will use $api_port"
fi
if (( web_port != requested_web_port )); then
  echo "[dev] port $requested_web_port is in use; UI will use $web_port"
fi

export DATA_STORE="$store"
export PORT="$api_port"
export WEB_PORT="$web_port"
# Point the Vite dev proxy at the API we actually started.
export API_PROXY_TARGET="http://localhost:$api_port"

echo "[dev] data store: $DATA_STORE"
echo "[dev] API: http://localhost:$api_port  UI: http://localhost:$web_port"

exec "$concurrently_bin" -k -n api,web -c cyan,magenta \
  "npm:dev:server" "npm:dev:client"
