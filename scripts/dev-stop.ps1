$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$composeFile = Join-Path $repoRoot "backend\docker-compose.yml"

Write-Host "Deteniendo backend local sin borrar volumenes..."
docker compose -f $composeFile down
