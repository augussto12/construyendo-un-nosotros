#!/usr/bin/env sh
set -eu

COMPOSE="docker compose --env-file .env.vps -f docker-compose.vps-ip.yml"

if [ ! -f .env.vps ]; then
  echo "Missing .env.vps. Copy .env.vps.example to .env.vps and edit it first." >&2
  exit 1
fi

$COMPOSE --profile tools run --rm construyendo_migrator
