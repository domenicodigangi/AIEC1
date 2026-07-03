#!/bin/bash
# Start Redis + Postgres locally, then hand off to the LangGraph API entrypoint.
set -euo pipefail

export LANG=C.UTF-8 LC_ALL=C.UTF-8 PGCLIENTENCODING=UTF8

PGDATA="${PGDATA:-/var/lib/postgresql/data}"
PG_BIN="${PG_BIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | head -1)}"
REDIS_URI="${REDIS_URI:-redis://127.0.0.1:6379}"
POSTGRES_URI="${POSTGRES_URI:-postgres://postgres@127.0.0.1:5432/postgres?sslmode=disable}"

export REDIS_URI
export POSTGRES_URI
export DATABASE_URI="${DATABASE_URI:-$POSTGRES_URI}"

if [ -z "$PG_BIN" ] || [ ! -x "$PG_BIN/initdb" ]; then
  echo "Postgres binaries not found. Is postgresql installed?" >&2
  exit 1
fi

echo "Starting Redis..."
mkdir -p /var/lib/redis /var/run/redis
chown -R redis:redis /var/lib/redis /var/run/redis 2>/dev/null || true
redis-server --daemonize yes --bind 127.0.0.1 --port 6379 --dir /var/lib/redis

echo "Starting Postgres..."
mkdir -p "$PGDATA"
chown -R postgres:postgres "$PGDATA"

if [ ! -f "$PGDATA/PG_VERSION" ]; then
  echo "Initializing Postgres data directory..."
  su postgres -c "$PG_BIN/initdb -D '$PGDATA' --auth=trust"
  {
    echo "local all all trust"
    echo "host all all 127.0.0.1/32 trust"
    echo "host all all ::1/128 trust"
  } >> "$PGDATA/pg_hba.conf"
fi

su postgres -c "$PG_BIN/pg_ctl -D '$PGDATA' -o '-c listen_addresses=127.0.0.1' -w start"

echo "Waiting for Redis and Postgres..."
until redis-cli -h 127.0.0.1 ping 2>/dev/null | grep -q PONG; do sleep 0.2; done
until su postgres -c "$PG_BIN/pg_isready -h 127.0.0.1 -q"; do sleep 0.2; done

echo "Redis and Postgres are ready."
echo "Starting LangGraph API on port ${PORT:-80}..."

exec /storage/entrypoint.sh
