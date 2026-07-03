#!/bin/bash
# In-memory LangGraph server (no Postgres/Redis). Boots in a few seconds so it
# fits inside Vercel's container startup timeout. State is not persisted across
# cold starts / redeploys — fine for demos and the homework, not production.
set -euo pipefail

export LANG=C.UTF-8 LC_ALL=C.UTF-8

cd /deps/09_Agent_Servers

# Vercel forwards traffic to $PORT and reaches the container over its network
# interface, so bind 0.0.0.0 (not the dev default of 127.0.0.1).
echo "Starting LangGraph in-memory server on 0.0.0.0:${PORT:-80}..."
exec langgraph dev --host 0.0.0.0 --port "${PORT:-80}" --no-browser --no-reload
