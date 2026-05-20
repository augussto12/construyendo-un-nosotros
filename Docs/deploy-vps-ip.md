# Deploy VPS por IP

Guia para desplegar Construyendo Un Nosotros en una VPS usando Docker Compose, Git y un puerto publico temporal.

No usa GitHub Actions, registry, Nginx Proxy Manager ni dominio. La prueba queda publicada por IP en el puerto `8096`.

## Arquitectura

```txt
http://IP_VPS:8096
  /
  /admin/login
  /api
  /uploads
```

Servicios Docker:

- `construyendo_frontend`: Nginx que sirve el build React/Vite y hace proxy.
- `construyendo_api`: ASP.NET Core 8 API interna en `8080`.
- `construyendo_postgres`: PostgreSQL interno.
- `construyendo_migrator`: contenedor one-shot para migraciones EF Core, solo con profile `tools`.

Solo se publica `FRONTEND_PUBLIC_PORT`, por defecto `8096`. PostgreSQL y API no exponen puertos publicos.

## Rutas

- Sitio publico: `http://IP_VPS:8096`
- Backoffice V1: `http://IP_VPS:8096/admin/login`
- API por proxy: `http://IP_VPS:8096/api`
- Uploads por proxy: `http://IP_VPS:8096/uploads`
- Health frontend: `http://IP_VPS:8096/health-frontend`
- Health API: `http://IP_VPS:8096/api/health`
- Ping publico: `http://IP_VPS:8096/api/public/ping`

El backoffice vive bajo `/admin` en la misma SPA. `backoffice.construyendounosotros.org` queda como evolucion futura.

## Archivos

- `docker-compose.vps-ip.yml`
- `.env.vps.example`
- `backend/Dockerfile.api.vps`
- `backend/Dockerfile.migrator.vps`
- `frontend/Dockerfile.vps`
- `frontend/nginx.vps-ip.conf`
- `scripts/deploy-vps.sh`
- `scripts/migrate-vps.sh`
- `scripts/backup-db.sh`
- `scripts/backup-uploads.sh`
- `scripts/restore-db.sh`
- `scripts/restore-uploads.sh`
- `scripts/logs-vps.sh`
- `scripts/restart-vps.sh`

## Preparar GitHub

Desde la maquina local:

```bash
git init
git branch -M main
git remote add origin https://github.com/augussto12/construyendo-un-nosotros.git
git status
git add .
git commit -m "Initial deploy-ready monorepo"
git push -u origin main
```

Revisar `git status` antes del commit. No subir `.env`, backups, uploads, `node_modules`, `dist`, `bin` ni `obj`.

## Preparar VPS

```bash
git clone https://github.com/augussto12/construyendo-un-nosotros.git
cd construyendo-un-nosotros
cp .env.vps.example .env.vps
nano .env.vps
chmod +x scripts/*.sh
```

Editar como minimo:

```env
POSTGRES_PASSWORD=una_password_fuerte
ADMIN_EMAIL=admin@tu-dominio-o-email
ADMIN_PASSWORD=una_password_fuerte
ADMIN_DISPLAY_NAME=Administrador
CORS_ALLOWED_ORIGINS=http://IP_VPS:8096
FRONTEND_PUBLIC_PORT=8096
VITE_API_URL=/api
```

Para prueba por HTTP/IP:

```env
AUTH_COOKIE_SECURE=false
```

Cuando haya HTTPS real con dominio:

```env
AUTH_COOKIE_SECURE=true
CORS_ALLOWED_ORIGINS=https://construyendounosotros.org
VITE_API_URL=/api
```

## Validar configuracion

```bash
docker compose --env-file .env.vps -f docker-compose.vps-ip.yml config
```

Este comando valida el compose. No levanta contenedores.

## Migraciones

En VPS se usa `ASPNETCORE_ENVIRONMENT=Production`. La API no aplica migraciones automaticamente al arrancar.

Aplicar migraciones explicitamente:

```bash
sh scripts/migrate-vps.sh
```

El script ejecuta el contenedor one-shot `construyendo_migrator`:

```bash
docker compose --env-file .env.vps -f docker-compose.vps-ip.yml --profile tools run --rm construyendo_migrator
```

Flujo profesional recomendado:

1. Backup DB.
2. Backup uploads.
3. Migraciones.
4. Levantar o reiniciar API/frontend.
5. Health checks.

`scripts/deploy-vps.sh` automatiza ese flujo.

## Deploy Manual

Primer deploy o deploy posterior:

```bash
git pull
sh scripts/deploy-vps.sh
```

El script:

- valida `.env.vps`;
- corre `docker compose config`;
- intenta backup si ya hay DB corriendo;
- levanta PostgreSQL;
- aplica migraciones con migrator;
- ejecuta `docker compose up -d --build construyendo_api construyendo_frontend`;
- revisa health checks.

No usa `down`, no usa `down -v` y no borra volumenes.

## Logs

```bash
sh scripts/logs-vps.sh
```

## Restart

```bash
sh scripts/restart-vps.sh
```

Este script reinicia API y frontend. No borra volumenes.

## Backups

Por defecto se guardan en:

```txt
./backups/db
./backups/uploads
```

Se puede cambiar con:

```bash
BACKUP_ROOT=/backups/construyendo sh scripts/backup-db.sh
BACKUP_ROOT=/backups/construyendo sh scripts/backup-uploads.sh
```

Backup DB:

```bash
sh scripts/backup-db.sh
```

Backup uploads:

```bash
sh scripts/backup-uploads.sh
```

Programar con cron cuando el deploy este estable. Backups externos quedan como mejora futura.

## Restore

Los restores requieren confirmacion explicita:

```bash
CONFIRM_RESTORE=YES sh scripts/restore-db.sh ./backups/db/construyendo-YYYYMMDD-HHMMSS.dump
CONFIRM_RESTORE=YES sh scripts/restore-uploads.sh ./backups/uploads/construyendo-uploads-YYYYMMDD-HHMMSS.tar.gz
```

Restaurar DB puede reemplazar objetos existentes. Restaurar uploads elimina primero los archivos actuales del volumen `construyendo_uploads`.

## Volumenes Persistentes

- `construyendo_postgres_data`: base de datos.
- `construyendo_uploads`: imagenes subidas.
- `construyendo_dataprotection_keys`: claves de cookies ASP.NET.

No ejecutar:

```bash
docker compose down -v
```

Eso borra DB, uploads y keys.

## Seguridad

HTTP por IP es solo para prueba tecnica. No usarlo para credenciales reales o datos sensibles durante mucho tiempo.

Para dominio futuro con Nginx Proxy Manager:

- apuntar `construyendounosotros.org` a la VPS;
- configurar SSL;
- publicar el servicio frontend interno;
- cambiar `AUTH_COOKIE_SECURE=true`;
- mantener `/admin` para V1;
- evaluar `backoffice.construyendounosotros.org` en una fase posterior.

PostgreSQL no debe exponerse publicamente. Los secretos deben vivir solo en `.env.vps` dentro de la VPS.
