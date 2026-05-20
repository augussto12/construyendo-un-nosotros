$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$composeFile = Join-Path $repoRoot "backend\docker-compose.yml"

Write-Warning "Esto va a borrar la DB local, uploads locales y keys locales de DataProtection."
$confirmation = Read-Host "Escribi RESET para confirmar"

if ($confirmation -ne "RESET") {
    Write-Host "Reset cancelado."
    exit 0
}

docker compose -f $composeFile down -v
Write-Host "Entorno local reseteado."
