#!/usr/bin/env sh
set -eu

COMPOSE="docker compose --env-file .env.vps -f docker-compose.vps-ip.yml"

if [ ! -f .env.vps ]; then
  echo "Missing .env.vps." >&2
  exit 1
fi

$COMPOSE restart construyendo_api construyendo_frontend
