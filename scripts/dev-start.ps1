$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendEnv = Join-Path $repoRoot "backend\.env"
$backendEnvExample = Join-Path $repoRoot "backend\.env.example"
$frontendEnv = Join-Path $repoRoot "frontend\.env"
$frontendEnvExample = Join-Path $repoRoot "frontend\.env.example"
$composeFile = Join-Path $repoRoot "backend\docker-compose.yml"
$frontendDir = Join-Path $repoRoot "frontend"

if (-not (Test-Path $backendEnv)) {
    Copy-Item $backendEnvExample $backendEnv
    Write-Warning "Se creo backend/.env desde backend/.env.example. Edita ADMIN_EMAIL, ADMIN_PASSWORD y ADMIN_DISPLAY_NAME para tu entorno local."
}

$backendEnvContent = Get-Content $backendEnv -Raw
if ($backendEnvContent -match "ADMIN_PASSWORD=change-this-password") {
    Write-Warning "backend/.env sigue usando ADMIN_PASSWORD=change-this-password. Cambialo por una password local fuerte."
}

if (-not (Test-Path $frontendEnv)) {
    Copy-Item $frontendEnvExample $frontendEnv
    Write-Host "Se creo frontend/.env desde frontend/.env.example."
}

Write-Host "Levantando backend con Docker Compose..."
docker compose -f $composeFile up -d --build

if (-not (Test-Path (Join-Path $frontendDir "node_modules"))) {
    Write-Host "Instalando dependencias frontend..."
    Push-Location $frontendDir
    try {
        npm install
    }
    finally {
        Pop-Location
    }
}

Write-Host "Levantando frontend en modo dev. Usar Ctrl+C para detener Vite."
Push-Location $frontendDir
try {
    npm run dev
}
finally {
    Pop-Location
}
