# Construyendo Un Nosotros

Repositorio monorepo para el sitio institucional y el backoffice V1 de Construyendo Un Nosotros.

## Estructura del repo

```txt
construyendounnosotros/
  backend/
  frontend/
  README.md
  .gitignore
```

## Comandos principales

Frontend:

```bash
cd frontend
npm run dev
npm run build
```

Backend:

```bash
cd backend
dotnet build Construyendo.sln
docker compose up --build
```

## Levantar local

Guia completa: [Docs/local-dev-setup.md](Docs/local-dev-setup.md).

Comando comodo desde la raiz en Windows/PowerShell:

```powershell
.\scripts\dev-start.ps1
```

Detener backend sin borrar datos:

```powershell
.\scripts\dev-stop.ps1
```

Resetear DB/uploads/keys locales, con confirmacion:

```powershell
.\scripts\dev-reset.ps1
```

Flujo manual minimo:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
cd backend
docker compose up -d --build
cd ../frontend
npm install
npm run dev
```

## Deploy VPS por IP

Guia completa: [Docs/deploy-vps-ip.md](Docs/deploy-vps-ip.md).

Arquitectura V1:

```txt
http://IP_VPS:8096
http://IP_VPS:8096/admin/login
http://IP_VPS:8096/api
http://IP_VPS:8096/uploads
```

El deploy usa Docker Compose, build en VPS, PostgreSQL interno, API interna, uploads persistentes y migraciones explicitas con un contenedor one-shot.

Comandos principales en VPS:

```bash
cp .env.vps.example .env.vps
chmod +x scripts/*.sh
docker compose --env-file .env.vps -f docker-compose.vps-ip.yml config
sh scripts/deploy-vps.sh
```

No usar `docker compose down -v` en VPS.

## Subir a GitHub

Repositorio remoto:

```txt
https://github.com/augussto12/construyendo-un-nosotros.git
```

Comandos sugeridos desde la raiz del monorepo:

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

## Donaciones con Mercado Pago

La estrategia tecnica para una futura integracion de donaciones con Mercado Pago Checkout Pro esta documentada en [Docs/donaciones-mercado-pago.md](Docs/donaciones-mercado-pago.md).

No esta implementada en la V1: no hay pagos reales, credenciales reales, QR ni procesamiento de tarjetas en este repo.

## Validacion integral local V1

Esta guia valida el sistema local actual antes de avanzar con integraciones nuevas. No incluye Mercado Pago, donaciones reales, deploy ni cambios productivos.

### 1. Variables de entorno

Backend: crear `backend/.env` a partir de `backend/.env.example`.

```env
POSTGRES_DB=construyendo
POSTGRES_USER=construyendo
POSTGRES_PASSWORD=construyendo_dev_password
ASPNETCORE_ENVIRONMENT=Development
ASPNETCORE_URLS=http://+:8080
ConnectionStrings__DefaultConnection=Host=construyendo_postgres;Port=5432;Database=construyendo;Username=construyendo;Password=construyendo_dev_password
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-password
ADMIN_DISPLAY_NAME=Administrador
COOKIE_NAME=construyendo_admin_dev
AUTH_COOKIE_SECURE=false
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
MEDIA_STORAGE_ROOT=/app/uploads
MEDIA_PUBLIC_BASE_PATH=/uploads
MEDIA_MAX_IMAGE_BYTES=5242880
MEDIA_ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp
DATA_PROTECTION_KEYS_PATH=/app/keys
```

Frontend: crear `frontend/.env` a partir de `frontend/.env.example`.

```env
VITE_API_URL=http://localhost:5000/api
```

Los archivos `.env` estan ignorados por git. No commitear passwords ni secretos reales. Los `.env.example` deben conservar solo valores de desarrollo.

### 2. Correr backend local

Con Docker Compose:

```bash
cd backend
docker compose up --build
```

En `Development`, la API aplica migraciones automaticamente antes de ejecutar el seed inicial. Esto evita que una base local fresca falle porque todavia no existen tablas.

La API queda publicada en:

```txt
http://localhost:5000
```

Health checks esperados:

```bash
curl http://localhost:5000/health
curl http://localhost:5000/api/health
curl http://localhost:5000/api/public/ping
```

El primer admin se crea al iniciar la API si la base no tiene usuarios y existen `ADMIN_EMAIL`, `ADMIN_PASSWORD` y `ADMIN_DISPLAY_NAME`.

Para aplicar migraciones manualmente, util en staging o si se quiere validar el paso por separado:

```bash
cd backend
dotnet tool restore
dotnet tool run dotnet-ef database update --project Construyendo.Api --startup-project Construyendo.Api
```

### 3. Correr frontend local

```bash
cd frontend
npm install
npm run dev
```

Abrir:

```txt
http://localhost:5173
http://localhost:5173/admin/login
```

El login admin usa cookie HttpOnly del backend. El frontend no guarda tokens en `localStorage` ni `sessionStorage`.

### 4. Flujo de prueba editorial

1. Entrar a `/admin/login` con el admin seed.
2. Subir una imagen valida en `/admin/media`.
3. Crear una noticia en `/admin/noticias/nueva`.
4. Escribir contenido en TipTap y guardar como borrador.
5. Editar la noticia y seleccionar imagen principal.
6. Agregar imagenes a galeria y reordenarlas.
7. Revisar la preview editorial.
8. Publicar la noticia.
9. Verificarla en `/noticias` y `/noticias/:slug`.
10. Probar despublicar, programar, archivar, destacada y orden de destacadas desde el backoffice.

El sitio publico solo debe mostrar noticias visibles: publicadas, no archivadas, no borradores, no expiradas y no programadas a futuro.

### 5. Media

Validar en `/admin/media`:

- subir `jpg`, `png` y `webp` validos;
- rechazar formatos invalidos;
- rechazar archivos mayores a 5 MB;
- verificar que una URL `/uploads/...` abre desde `http://localhost:5000/uploads/...`;
- archivar media y confirmar que no aparece en listados activos;
- confirmar que la API no devuelve `StoragePath`.

### 6. Settings

`/admin/settings` requiere rol `Admin`.

Validar que se guardan:

- `donationUrl`
- `contactEmail`
- `whatsappUrl`
- `instagramUrl`
- `facebookUrl`
- `youtubeUrl`
- `addressText`
- `footerText`

El frontend publico tiene endpoint y cliente para settings publicos, pero las vistas publicas todavia no consumen esos settings. Queda pendiente conectar `donationUrl`, `contactEmail`, redes y `footerText` al sitio publico antes de deploy.

### 7. Checks tecnicos

```bash
cd backend
dotnet build Construyendo.sln
dotnet test Construyendo.sln
docker compose config

cd ../frontend
npm run build
npm run lint
```

### 8. Troubleshooting local

CORS: `CORS_ALLOWED_ORIGINS` debe incluir el origen exacto del frontend local, por ejemplo `http://localhost:5173,http://127.0.0.1:5173`. No usar `AllowAnyOrigin` con cookies.

Cookies: en desarrollo local usar `AUTH_COOKIE_SECURE=false`. Si el login responde OK pero `/me` falla, revisar que las llamadas admin usen `credentials: 'include'`.

API caida/fallback: si `VITE_API_URL` no existe o la API falla, `/noticias` vuelve a datos locales. Para probar API real, confirmar `frontend/.env` y reiniciar Vite.

Uploads: las imagenes se guardan bajo `MEDIA_STORAGE_ROOT` y se sirven desde `MEDIA_PUBLIC_BASE_PATH`. En Docker, el volumen `construyendo_uploads` conserva los archivos.

Migrations: si `/api/health` falla por base de datos, correr `dotnet tool restore` y `dotnet tool run dotnet-ef database update --project Construyendo.Api --startup-project Construyendo.Api`.

Admin seed: si no se puede iniciar sesion, revisar logs de API. El seed no crea usuario si falta `ADMIN_EMAIL`, `ADMIN_PASSWORD` o `ADMIN_DISPLAY_NAME`, o si ya existe algun admin en la base.

DataProtection: en Docker local las keys se guardan en el volumen `construyendo_dataprotection_keys` montado en `DATA_PROTECTION_KEYS_PATH=/app/keys`. Esto mantiene validas las cookies entre reinicios del contenedor. En staging/produccion tambien hay que persistir esa carpeta. Si aparece un warning sobre keys no cifradas en reposo, documenta un pendiente de hardening: usar un encryptor/certificado o mecanismo gestionado de secretos.

### 9. Staging y produccion

No usar credenciales de ejemplo ni passwords de desarrollo. Configurar secretos fuera del repo.

Variables recomendadas:

```env
ASPNETCORE_ENVIRONMENT=Staging
AUTH_COOKIE_SECURE=true
CORS_ALLOWED_ORIGINS=https://dominio-real
DATA_PROTECTION_KEYS_PATH=/app/keys
```

En staging/produccion no se aplican migraciones automaticamente desde la API. Aplicarlas como paso explicito antes de levantar o reiniciar la API:

```bash
cd backend
dotnet tool restore
dotnet tool run dotnet-ef database update --project Construyendo.Api --startup-project Construyendo.Api
```

Cookies/CORS:

- Local: `CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173` y `AUTH_COOKIE_SECURE=false`.
- Staging/produccion: `CORS_ALLOWED_ORIGINS=https://dominio-real` y `AUTH_COOKIE_SECURE=true`.
- No usar `AllowAnyOrigin` con credenciales.
- `SameSite=Lax` funciona para frontend/API en el mismo sitio navegacional. Si se separan dominios de forma cross-site, revisar la estrategia antes de deploy.

## Frontend

El frontend vive en `frontend/` y usa React + TypeScript + Vite + TailwindCSS.
El sitio publico conserva fallback local para noticias si no hay API disponible.
El backoffice vive en el mismo proyecto bajo `frontend/src/features/admin/`.

## Estado V1

La V1 incluye:

- Backend .NET 8 Web API con PostgreSQL, EF Core, Docker Compose local y health checks.
- Auth admin con cookie HttpOnly, roles `Admin` y `Editor`, seed seguro del primer admin y rate limit basico en login.
- CRUD backend de noticias, categorias y tags, con UI admin enfocada en noticias.
- Editor visual TipTap, preview editorial, publicacion, despublicacion, programacion y archivo.
- Upload backend y UI de media para imagenes, imagen principal y galeria ordenable.
- Endpoints publicos reales de noticias/categorias/tags/settings.
- Frontend publico conectado gradualmente a API con fallback local.
- Settings basicos publicos editables por `Admin`: `donationUrl`, `contactEmail`, `whatsappUrl`, `instagramUrl`, `facebookUrl`, `youtubeUrl`, `addressText`, `footerText`.

Fuera de V1:

- Donaciones reales o Mercado Pago.
- Contacto con envio de email o guardado en DB.
- Newsletter.
- Multi-idioma.
- Constructor de paginas.
- Workflow editorial avanzado.
- Deploy productivo.
- Upload de videos.
- MinIO o Cloudinary.

## Fase 0: preparacion para API y backoffice

Esta fase prepara el frontend institucional para consumir una API futura sin exigir que el backend exista todavia.

### Variable de entorno

Crear `frontend/.env` a partir de `frontend/.env.example` cuando haya una API disponible:

```env
VITE_API_URL=http://localhost:5000/api
```

Si `VITE_API_URL` no esta configurada, el sitio usa automaticamente los datos locales actuales de `frontend/src/data/news.ts`.

### Estrategia de API futura

La capa de acceso a datos quedo separada en:

- `frontend/src/api/apiClient.ts`: cliente HTTP base.
- `frontend/src/api/publicNewsApi.ts`: endpoints publicos futuros de noticias.
- `frontend/src/api/publicSettingsApi.ts`: endpoint publico futuro de settings.
- `frontend/src/services/newsService.ts`: puente entre API futura y fallback local.

Los endpoints esperados para la API publica son:

```txt
GET /api/public/news
GET /api/public/news/featured
GET /api/public/news/{slug}
GET /api/public/categories
GET /api/public/tags
GET /api/public/site-settings
```

### Fallback local

`newsService` intenta usar la API solamente si existe `VITE_API_URL`. Si la API no existe, no responde o falla, vuelve a usar `frontend/src/data/news.ts`.

Esto permite avanzar de forma gradual:

1. Mantener el sitio funcionando sin backend.
2. Crear el backend .NET en una fase posterior.
3. Conectar el frontend cambiando solo la variable de entorno.
4. Retirar el fallback cuando el backend este estable.

### DTOs preparados

Los contratos publicos quedaron definidos en `frontend/src/types/index.ts`:

- `PublicNewsListItemDto`
- `PublicNewsDetailDto`
- `PublicNewsCategoryDto`
- `PublicNewsTagDto`
- `PublicMediaAssetDto`
- `PublicSiteSettingDto`
- `NewsStatus`
- `VideoEmbedInfo`

Los videos de v1 se modelan como URL externa/embebida. No se suben videos al servidor.

### Pantallas preparadas

Estas pantallas/secciones ya consumen `newsService`:

- `/noticias`
- `/noticias/:slug`
- tira de ultimas noticias en home

Cada una mantiene fallback local y estados simples de carga, error o contenido vacio.

### Fuera de esta fase

No se implementa en Fase 0:

- backend .NET
- PostgreSQL
- autenticacion
- backoffice
- upload de imagenes
- donaciones reales
- Mercado Pago
- contacto con envio de email
- migracion automatica desde WordPress

## Fase 1: backend base .NET

La Fase 1 agrega una base de backend en `backend/` sin conectar todavia el frontend y sin implementar auth, CRUD ni backoffice.

### Stack

- .NET 8 Web API
- PostgreSQL
- Entity Framework Core
- Docker Compose local
- Swagger solo en Development
- Health checks

### Estructura

```txt
backend/
  Construyendo.sln
  docker-compose.yml
  .env.example
  .config/dotnet-tools.json
  Construyendo.Api/
    Controllers/
    Data/
    Domain/
    DTOs/
    Services/
    Auth/
    Media/
    Migrations/
    Program.cs
    appsettings.json
    appsettings.Development.json
    Dockerfile
```

### Variables de entorno

Para Docker Compose local, copiar `backend/.env.example` a `backend/.env`:

```env
POSTGRES_DB=construyendo
POSTGRES_USER=construyendo
POSTGRES_PASSWORD=construyendo_dev_password
ASPNETCORE_ENVIRONMENT=Development
ASPNETCORE_URLS=http://+:8080
ConnectionStrings__DefaultConnection=Host=construyendo_postgres;Port=5432;Database=construyendo;Username=construyendo;Password=construyendo_dev_password
```

La variable del frontend sigue siendo:

```env
VITE_API_URL=http://localhost:5000/api
```

No hace falta configurarla todavia para seguir usando el fallback local de noticias.

### Comandos utiles

Restaurar y compilar backend:

```bash
dotnet restore backend/Construyendo.sln
dotnet build backend/Construyendo.sln
```

Levantar PostgreSQL y API con Docker Compose local:

```bash
cd backend
docker compose up --build
```

Levantar solo PostgreSQL para desarrollo local:

```bash
cd backend
docker compose up -d construyendo_postgres
```

Aplicar migraciones con la herramienta local de EF:

```bash
cd backend
dotnet tool restore
dotnet tool run dotnet-ef database update --project Construyendo.Api --startup-project Construyendo.Api
```

Ejecutar API local sin Docker:

```bash
cd backend/Construyendo.Api
dotnet run
```

### Endpoints disponibles

```txt
GET /health
GET /api/health
GET /api/public/ping
```

Swagger queda disponible en Development:

```txt
http://localhost:5000/swagger
```

### Entidades base

La primera migracion incluye las tablas base para:

- `AdminUser`
- `NewsArticle`
- `NewsCategory`
- `NewsTag`
- `MediaAsset`
- `NewsImage`
- `SiteSetting`
- `AuditLog`

No se seedearon usuarios ni categorias en esta fase. Eso queda para Fase 2/3.

### Pendiente para Fase 2

- Auth admin.
- Login/logout.
- Cookie segura o estrategia definitiva de sesion.
- Roles `Admin` y `Editor`.
- Seed seguro de usuario admin inicial.
- Proteccion de endpoints admin.

## Fase 2: auth admin y roles

La Fase 2 agrega autenticacion de administradores con cookie HttpOnly. No se implementan todavia CRUD de noticias, upload de imagenes ni UI de backoffice.

### Decision de auth

Se usa cookie HttpOnly en lugar de JWT porque el backoffice va a vivir dentro del mismo frontend React bajo `/admin`. Esto evita guardar tokens en `localStorage` y deja una base simple para rutas protegidas.

La cookie:

- es `HttpOnly`
- usa `SameSite=Lax`
- usa `Secure` por defecto fuera de Development
- permite override con `AUTH_COOKIE_SECURE`

### Variables nuevas

Agregar estas variables en `backend/.env` para crear el primer admin:

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-password
ADMIN_DISPLAY_NAME=Administrador
COOKIE_NAME=construyendo_admin_dev
AUTH_COOKIE_SECURE=false
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

`ADMIN_PASSWORD` debe cambiarse por una contrasena fuerte antes de levantar el entorno por primera vez.

### Seed del primer admin

Al iniciar la API:

1. Si ya existe algun `AdminUser`, no hace nada.
2. Si no existe ningun `AdminUser`, intenta leer `ADMIN_EMAIL`, `ADMIN_PASSWORD` y `ADMIN_DISPLAY_NAME`.
3. Si faltan variables, no crea usuario y registra un warning.
4. Si estan todas, crea el primer usuario con rol `Admin` y password hasheado.

No hay credenciales hardcodeadas.

### Endpoints de auth

```txt
POST /api/admin/auth/login
POST /api/admin/auth/logout
GET /api/admin/auth/me
```

Login:

```bash
curl -i -X POST http://localhost:5000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@example.com\",\"password\":\"change-this-password\"}"
```

Me, reutilizando la cookie recibida:

```bash
curl -i http://localhost:5000/api/admin/auth/me \
  -H "Cookie: construyendo_admin_dev=COOKIE_VALUE"
```

Logout:

```bash
curl -i -X POST http://localhost:5000/api/admin/auth/logout \
  -H "Cookie: construyendo_admin_dev=COOKIE_VALUE"
```

Desde frontend, las llamadas futuras al admin API deberan usar `credentials: 'include'`.

### Seguridad incluida

- Login con error generico.
- Usuarios inactivos no pueden loguearse.
- Password hasheado con PBKDF2-SHA256.
- No se devuelve `PasswordHash`.
- Rate limit basico en login: 5 intentos por minuto.
- CORS con credenciales solo para origenes configurados.
- Policies listas:
  - `AdminOnly`
  - `AdminOrEditor`
- Auditoria basica de login/logout en `AuditLog`.

### Tests

No se agrego proyecto de tests en esta fase porque el repo aun no tenia estructura de testing backend. Queda recomendado para la siguiente iteracion tecnica cubrir:

- login correcto no devuelve password hash
- login incorrecto responde error generico
- usuario inactivo no loguea
- `/me` requiere auth
- seed crea admin si no existe
- seed no duplica admin

### Pendiente para Fase 3

- CRUD de noticias sin imagenes.
- DTOs admin de noticias.
- Validaciones de slug, estado y fechas.
- Categorias/tags en modo lectura o CRUD inicial segun alcance.
- Sanitizacion de HTML del editor futuro.

## Fase 3: CRUD admin de noticias sin imagenes

La Fase 3 agrega endpoints privados para administrar noticias, categorias y tags. Todos requieren cookie de admin/editor.

### Endpoints de noticias

```txt
GET /api/admin/news
GET /api/admin/news/{id}
POST /api/admin/news
PUT /api/admin/news/{id}
DELETE /api/admin/news/{id}
POST /api/admin/news/{id}/publish
POST /api/admin/news/{id}/unpublish
POST /api/admin/news/{id}/schedule
POST /api/admin/news/{id}/archive
PUT /api/admin/news/featured-order
```

`GET /api/admin/news` soporta:

```txt
search
status
categoryId
tagId
featured
page
pageSize
sort
```

Valores utiles de `sort`: `-updatedAt`, `updatedAt`, `title`, `-title`, `publishedAt`, `-publishedAt`, `featuredOrder`, `sortOrder`.

### Endpoints de categorias y tags

```txt
GET /api/admin/categories
POST /api/admin/categories
PUT /api/admin/categories/{id}
DELETE /api/admin/categories/{id}

GET /api/admin/tags
POST /api/admin/tags
PUT /api/admin/tags/{id}
DELETE /api/admin/tags/{id}
```

### Reglas implementadas

- Slug autogenerado desde titulo/nombre si no viene.
- Slug editable si viene en el request.
- Slug unico con sufijo incremental.
- Fechas normalizadas a UTC.
- `Scheduled` requiere `PublishedAt` futuro.
- `DELETE /api/admin/news/{id}` aplica soft delete: marca `Archived` y completa `DeletedAt`.
- Categorias se desactivan con `IsActive=false` al eliminar.
- Tags se eliminan y se limpian sus relaciones.
- `ContentHtml` se sanitiza antes de guardar con `HtmlSanitizer`.
- Auditoria acotada en `AuditLog`, sin guardar HTML completo.

### Estados de noticias

```txt
Draft
Published
Scheduled
Unpublished
Expired
Archived
```

### Ejemplo curl

Login y guardar cookie:

```bash
curl -i -c cookies.txt -X POST http://localhost:5000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@example.com\",\"password\":\"change-this-password\"}"
```

Crear noticia:

```bash
curl -i -b cookies.txt -X POST http://localhost:5000/api/admin/news \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Nueva noticia\",\"excerpt\":\"Resumen corto\",\"contentHtml\":\"<p>Contenido</p>\",\"status\":\"Draft\"}"
```

Listar noticias:

```bash
curl -i -b cookies.txt "http://localhost:5000/api/admin/news?page=1&pageSize=20"
```

Programar noticia:

```bash
curl -i -b cookies.txt -X POST http://localhost:5000/api/admin/news/ARTICLE_ID/schedule \
  -H "Content-Type: application/json" \
  -d "{\"publishedAt\":\"2026-06-01T12:00:00Z\"}"
```

### Tests

Se agrego `backend/Construyendo.Api.Tests` con pruebas para:

- slug normalizado/autogenerado
- slug unico en creacion de noticias
- edicion de noticias con sanitizacion
- publicacion
- programacion futura
- rechazo de programacion pasada
- soft delete/archive
- sanitizacion de scripts, handlers y URLs peligrosas

El backend productivo sigue apuntando a `.NET 8`. El proyecto de tests apunta a `.NET 9` para poder ejecutarse en esta maquina, donde falta el runtime local `Microsoft.AspNetCore.App 8`.

## Fase 4: media upload e imagenes de noticias

La Fase 4 agrega gestion backend de imagenes para noticias. No agrega backoffice UI ni conecta el frontend publico todavia.

### Variables de media

```env
MEDIA_STORAGE_ROOT=/app/uploads
MEDIA_PUBLIC_BASE_PATH=/uploads
MEDIA_MAX_IMAGE_BYTES=5242880
MEDIA_ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp
```

En Docker Compose los uploads quedan persistidos en el volumen `construyendo_uploads`. Ese volumen debe incluirse en la estrategia de backup junto con PostgreSQL.

### Endpoints de media

```txt
POST /api/admin/media
GET /api/admin/media
GET /api/admin/media/{id}
DELETE /api/admin/media/{id}
```

`POST /api/admin/media` recibe `multipart/form-data` con campo `file` y opcional `altText`.

Validaciones:

- archivo no vacio
- maximo 5 MB por imagen
- extensiones `.jpg`, `.jpeg`, `.png`, `.webp`
- content-types `image/jpeg`, `image/png`, `image/webp`
- magic bytes basicos por formato
- no SVG
- no GIF
- no video
- nombre fisico seguro y unico
- binario en filesystem, no en DB

### Endpoints de imagenes por noticia

```txt
POST /api/admin/news/{id}/main-image
DELETE /api/admin/news/{id}/main-image

POST /api/admin/news/{id}/gallery
DELETE /api/admin/news/{id}/gallery/{imageId}
PUT /api/admin/news/{id}/gallery-order
```

Reglas:

- la noticia debe existir y no estar archivada/deleted
- el `MediaAsset` debe existir y ser imagen disponible
- maximo 20 imagenes por galeria
- no se permite duplicar una misma imagen en la galeria de una noticia
- `gallery-order` rechaza ids duplicados, ordenes duplicados e ids inexistentes
- quitar imagen principal o de galeria no borra fisicamente el asset
- `DELETE /api/admin/media/{id}` hace soft delete del asset

### Ejemplos curl

Subir imagen:

```bash
curl -i -b cookies.txt -X POST http://localhost:5000/api/admin/media \
  -F "file=@./imagen.jpg;type=image/jpeg" \
  -F "altText=Descripcion de la imagen"
```

Asignar imagen principal:

```bash
curl -i -b cookies.txt -X POST http://localhost:5000/api/admin/news/NEWS_ID/main-image \
  -H "Content-Type: application/json" \
  -d "{\"mediaAssetId\":\"MEDIA_ID\"}"
```

Agregar imagen a galeria:

```bash
curl -i -b cookies.txt -X POST http://localhost:5000/api/admin/news/NEWS_ID/gallery \
  -H "Content-Type: application/json" \
  -d "{\"mediaAssetId\":\"MEDIA_ID\",\"caption\":\"Pie de foto\",\"altText\":\"Descripcion\",\"sortOrder\":1}"
```

Reordenar galeria:

```bash
curl -i -b cookies.txt -X PUT http://localhost:5000/api/admin/news/NEWS_ID/gallery-order \
  -H "Content-Type: application/json" \
  -d "{\"items\":[{\"imageId\":\"IMAGE_ID\",\"sortOrder\":1}]}"
```

### Tests

Se agregaron pruebas para:

- extension invalida
- content-type invalido
- magic bytes invalidos
- archivo mayor a 5 MB
- creacion de `MediaAsset` sin binario en DB
- nombre fisico seguro
- set/remove de imagen principal
- add/remove de imagen en galeria
- no duplicar imagen en galeria
- maximo 20 imagenes
- validacion de orden de galeria

## Fase 5: endpoints publicos y conexion gradual del frontend

La Fase 5 agrega endpoints publicos reales para noticias, categorias, tags y settings. El frontend institucional ya puede consumirlos mediante `VITE_API_URL`, pero conserva el fallback local a `frontend/src/data/news.ts` si la API no esta configurada o falla.

No se agrega backoffice UI en esta fase. El backoffice futuro vivira dentro del mismo proyecto React/Vite en `frontend/src/features/admin/`, con rutas bajo `/admin`.

### Endpoints publicos

```txt
GET /api/public/news
GET /api/public/news/featured
GET /api/public/news/{slug}
GET /api/public/categories
GET /api/public/tags
GET /api/public/site-settings
```

`GET /api/public/news` soporta:

```txt
page
pageSize
category
tag
search
featured
```

`GET /api/public/news/featured` soporta:

```txt
take
```

### Reglas de visibilidad publica

Una noticia se devuelve publicamente solo si:

- no tiene `DeletedAt`
- no esta `Draft`, `Unpublished`, `Archived` ni `Expired`
- esta `Published` o `Scheduled` ya vencida
- `PublishedAt <= now UTC`
- `ExpiresAt` es null o mayor a `now UTC`

No se exponen rutas internas de storage. Las imagenes publicas devuelven URLs relativas tipo `/uploads/...`, y el frontend las resuelve contra el origen de `VITE_API_URL` durante desarrollo local.

### Probar API publica

Con backend corriendo en `http://localhost:5000`:

```bash
curl "http://localhost:5000/api/public/news?page=1&pageSize=20"
curl "http://localhost:5000/api/public/news/featured?take=3"
curl "http://localhost:5000/api/public/news/SLUG_DE_NOTICIA"
curl "http://localhost:5000/api/public/categories"
curl "http://localhost:5000/api/public/tags"
curl "http://localhost:5000/api/public/site-settings"
```

### Probar frontend con API

Crear `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Luego:

```bash
cd frontend
npm run dev
```

Si la API no responde, el frontend sigue usando `frontend/src/data/news.ts` automaticamente.

### Cambios frontend

La conexion sigue pasando por:

- `frontend/src/api/apiClient.ts`
- `frontend/src/api/publicNewsApi.ts`
- `frontend/src/services/newsService.ts`

Pantallas conectadas:

- `/noticias`
- `/noticias/:slug`
- tira de ultimas noticias en home

El detalle de noticia usa `seoTitle`/`seoDescription` si vienen de la API, renderiza `contentHtml` sanitizado desde backend y muestra galeria cuando existe.

### Pendiente para Fase 6

- backoffice integrado en `frontend/src/features/admin/`
- `/admin/login`
- rutas protegidas
- dashboard admin
- UI CRUD de noticias
- UI media
- TipTap o editor visual equivalente

## Fase 6A: base de backoffice y login admin

La Fase 6A crea la estructura inicial del backoffice dentro del mismo proyecto React/Vite, sin app separada y sin CRUD visual todavia.

### Ubicacion

```txt
frontend/src/features/admin/
```

### Rutas admin

```txt
/admin/login
/admin/dashboard
/admin/noticias
/admin/media
/admin/settings
```

`/admin/dashboard` y las rutas de modulos usan `ProtectedAdminRoute`. Si no hay sesion valida, redirigen a `/admin/login`.

### Auth frontend

El frontend usa los endpoints existentes del backend:

```txt
POST /api/admin/auth/login
POST /api/admin/auth/logout
GET /api/admin/auth/me
```

Las llamadas admin usan `credentials: 'include'` para trabajar con la cookie HttpOnly. No se usa `localStorage`, `sessionStorage` ni tokens en JavaScript.

### Probar login admin

1. Configurar `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

2. Levantar backend con un admin seed configurado en `backend/.env`.
3. Levantar frontend:

```bash
cd frontend
npm run dev
```

4. Abrir:

```txt
http://localhost:5173/admin/login
```

Al iniciar sesion correctamente, el navegador recibe la cookie HttpOnly del backend y redirige a `/admin/dashboard`.

### Pendiente para Fase 6B

- listado real de noticias admin
- crear/editar noticias
- editor visual
- categorias/tags UI
- media manager UI
- integracion de imagen principal y galeria desde UI

## Fase 6D: editor visual y preview editorial

La Fase 6D mejora el formulario de noticias con un editor visual basico y una vista previa editorial. No agrega upload UI, media manager, imagen principal ni galeria desde el backoffice.

### Editor visual

Se usa TipTap con paquetes minimos:

```txt
@tiptap/react
@tiptap/starter-kit
@tiptap/extension-link
```

La toolbar disponible incluye:

- parrafo
- titulo H2
- titulo H3
- negrita
- cursiva
- lista desordenada
- lista ordenada
- cita
- link
- quitar formato

El editor no permite imagenes embebidas, videos embebidos dentro del contenido, tablas complejas, colores ni fuentes custom. El HTML final sigue siendo sanitizado por el backend con `HtmlSanitizer`.

### Preview editorial

El formulario permite alternar entre:

```txt
Editar
Vista previa
```

La vista previa usa el estado actual del formulario y no llama endpoints publicos ni publica contenido. Incluye titulo, bajada, fecha, autor, video externo si aplica, contenido y panel SEO.

### Seguridad

El frontend aplica una sanitizacion local minima para paste/preview, removiendo scripts, iframes, handlers `on*`, estilos inline y URLs `javascript:`. Esto es defensa adicional: la sanitizacion definitiva sigue estando en el backend.

### Performance

La pagina de editor admin se carga con `React.lazy`, para que TipTap quede separado del bundle inicial del sitio publico.

## Fase 6E: media manager, imagen principal y galeria desde UI

La Fase 6E completa la gestion visual de imagenes dentro del backoffice. No agrega upload de videos, edicion/crop de imagenes, MinIO ni Cloudinary.

### UI de media

Ruta:

```txt
/admin/media
```

Permite:

- subir imagenes `jpg`, `jpeg`, `png` y `webp`
- validar tipo y maximo 5 MB antes de subir
- listar imagenes existentes
- ver miniatura, nombre original, tamano y texto alternativo si existe
- archivar media con confirmacion

Las llamadas usan `credentials: 'include'` y no exponen `StoragePath`.

### Imagen principal y galeria

En `/admin/noticias/:id` se puede:

- seleccionar o subir imagen principal
- quitar imagen principal
- agregar imagenes a galeria
- agregar caption y alt text al agregar
- quitar imagenes de galeria
- reordenar galeria con controles subir/bajar

En `/admin/noticias/nueva`, primero hay que guardar la noticia para poder asociar media.

## Fase 6F: settings basicos

### Settings

Ruta:

```txt
/admin/settings
```

Endpoints admin:

```txt
GET /api/admin/settings
PUT /api/admin/settings/{key}
```

Estos endpoints requieren rol `Admin`. Los editores pueden gestionar contenido, pero no settings.

Settings V1:

- `donationUrl`
- `contactEmail`
- `whatsappUrl`
- `instagramUrl`
- `facebookUrl`
- `youtubeUrl`
- `addressText`
- `footerText`

`donationUrl` es solamente un link configurable. No hay pagos reales ni integracion con Mercado Pago.

## Checklist de pruebas manuales V1

Antes de staging/deploy conviene probar manualmente:

1. Login, `/me`, logout y redireccion de rutas protegidas.
2. Acceso a settings con `Admin` y bloqueo con `Editor`.
3. Crear noticia como borrador, editarla, publicarla, despublicarla, programarla y archivarla.
4. Validar slug unico, fecha de expiracion y sanitizacion HTML.
5. Subir imagen valida y rechazar formatos/tamanos invalidos.
6. Asignar/quitar imagen principal.
7. Agregar/quitar/reordenar galeria.
8. Revisar `/noticias`, `/noticias/:slug` y tira de ultimas noticias con API real.
9. Apagar API o quitar `VITE_API_URL` y verificar fallback local.
10. Confirmar que no se exponen `PasswordHash`, `StoragePath` ni endpoints admin sin auth.
