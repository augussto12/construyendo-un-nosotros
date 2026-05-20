# Local dev setup

Guia para levantar Construyendo Un Nosotros desde cero en una maquina local.

## Requisitos

- Docker Desktop o Docker daemon activo.
- Node.js.
- npm.
- .NET SDK 8.

## Estructura del repo

```txt
backend/
frontend/
Docs/
scripts/
README.md
```

## Variables de entorno

### Backend

Crear `backend/.env` desde el ejemplo:

```powershell
Copy-Item backend/.env.example backend/.env
```

Editar como minimo:

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-password
ADMIN_DISPLAY_NAME=Administrador
AUTH_COOKIE_SECURE=false
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
DATA_PROTECTION_KEYS_PATH=/app/keys
```

Usar una password local fuerte para `ADMIN_PASSWORD`. No commitear `.env`.

### Frontend

Crear `frontend/.env` desde el ejemplo:

```powershell
Copy-Item frontend/.env.example frontend/.env
```

Debe contener:

```env
VITE_API_URL=http://localhost:5000/api
```

## Levantar backend

```powershell
cd backend
docker compose up -d --build
```

En `Development`, la API aplica migraciones automaticamente antes de ejecutar el seed del primer admin. Las keys de DataProtection se guardan en el volumen `construyendo_dataprotection_keys`, montado en `/app/keys`.

## Verificar backend

Abrir o consultar:

```txt
http://localhost:5000/health
http://localhost:5000/api/health
http://localhost:5000/api/public/ping
```

Con PowerShell:

```powershell
Invoke-WebRequest http://localhost:5000/health
Invoke-WebRequest http://localhost:5000/api/health
Invoke-WebRequest http://localhost:5000/api/public/ping
```

## Levantar frontend

```powershell
cd frontend
npm install
npm run dev
```

## URLs locales

- Web publica: `http://localhost:5173`
- Backoffice: `http://localhost:5173/admin/login`
- API: `http://localhost:5000`

## Flujo de prueba

1. Entrar a `http://localhost:5173/admin/login`.
2. Iniciar sesion con el admin configurado en `backend/.env`.
3. Crear una noticia.
4. Subir una imagen.
5. Asignar imagen principal.
6. Publicar la noticia.
7. Verificar que aparece en `http://localhost:5173/noticias`.

## Scripts desde la raiz

### Levantar todo

```powershell
.\scripts\dev-start.ps1
```

Hace lo siguiente:

- crea `backend/.env` desde `backend/.env.example` si falta;
- crea `frontend/.env` desde `frontend/.env.example` si falta;
- levanta backend con `docker compose -f backend/docker-compose.yml up -d --build`;
- ejecuta `npm install` si falta `frontend/node_modules`;
- ejecuta `npm run dev` en `frontend/`.

Vite queda en primer plano. Para detenerlo, usar `Ctrl+C`.

### Detener backend

```powershell
.\scripts\dev-stop.ps1
```

Detiene los contenedores del backend sin borrar volumenes.

### Reset local

```powershell
.\scripts\dev-reset.ps1
```

Pide confirmacion y ejecuta `docker compose down -v`. Esto borra DB local, uploads locales y keys locales de DataProtection.

## Reset manual del entorno local

```powershell
cd backend
docker compose down -v
docker compose up -d --build
```

Advertencia: `down -v` borra la base de datos local, uploads locales y keys de DataProtection locales.

## Troubleshooting

### Docker no levantado

Si `docker compose` no puede conectarse al engine, abrir Docker Desktop o iniciar el daemon y volver a correr el comando.

### Puerto 5000 ocupado

La API publica `localhost:5000`. Cerrar el proceso que use ese puerto o cambiar el mapeo en `backend/docker-compose.yml` solo para tu entorno local.

### Puerto 5173 ocupado

Vite usa `localhost:5173`. Si esta ocupado, Vite puede sugerir otro puerto. En ese caso agregar ese origen a `CORS_ALLOWED_ORIGINS` y actualizar `VITE_API_URL` si corresponde.

### CORS

Para local:

```env
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

No usar `AllowAnyOrigin` con credenciales.

### Cookies

Para local:

```env
AUTH_COOKIE_SECURE=false
```

En staging/produccion con HTTPS debe ser `true`. Las llamadas admin del frontend usan `credentials: 'include'`.

### Admin seed no creado

El seed solo crea el primer admin si la tabla `AdminUsers` esta vacia y existen:

```env
ADMIN_EMAIL
ADMIN_PASSWORD
ADMIN_DISPLAY_NAME
```

Revisar logs:

```powershell
cd backend
docker compose logs construyendo_api
```

### Migraciones

En `Development`, la API aplica migraciones al iniciar. Para correrlas manualmente:

```powershell
cd backend
dotnet tool restore
dotnet tool run dotnet-ef database update --project Construyendo.Api --startup-project Construyendo.Api
```

En staging/produccion, aplicar migraciones como paso explicito antes de iniciar o reiniciar API.

### Uploads

Los archivos se guardan en el volumen `construyendo_uploads` y se sirven desde `/uploads`. Si una imagen no abre, revisar:

- que el upload haya devuelto URL `/uploads/...`;
- que el volumen exista;
- que `MEDIA_STORAGE_ROOT=/app/uploads`;
- que `MEDIA_PUBLIC_BASE_PATH=/uploads`.

### DataProtection keys

Las cookies dependen de DataProtection. En Docker local las keys se persisten en `construyendo_dataprotection_keys` usando:

```env
DATA_PROTECTION_KEYS_PATH=/app/keys
```

Si se borra el volumen, las cookies anteriores dejan de ser validas y hay que iniciar sesion otra vez. En produccion queda pendiente cifrar keys en reposo con un mecanismo adecuado.
