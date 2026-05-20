# Donaciones con Mercado Pago Checkout Pro

Este documento deja planificada la estrategia tecnica para implementar donaciones con Mercado Pago Checkout Pro en una fase posterior. No describe una implementacion activa ni contiene credenciales reales.

## 1. Resumen de la estrategia

Proveedor inicial: Mercado Pago Checkout Pro.

La integracion se hara con backend server-side:

- el usuario ingresa un monto en `/donar`;
- el backend valida el monto y crea una donacion `Pending`;
- el backend crea una preferencia de pago en Mercado Pago usando el Access Token del servidor;
- el frontend redirige al usuario al `init_point` de Mercado Pago;
- Mercado Pago procesa el pago en su entorno seguro;
- el backend recibe el webhook;
- el backend consulta el pago real a Mercado Pago;
- recien despues de esa consulta se actualiza la donacion a `Paid`, `Rejected`, `Cancelled` o `Expired`.

Decisiones confirmadas para V1:

- moneda inicial: `ARS`;
- monto minimo: `1000`;
- monto maximo: `1000000`, configurable;
- datos del donante opcionales: nombre, email y mensaje;
- donacion general, sin campanas;
- backoffice de donaciones solo para usuarios `Admin`;
- no export CSV;
- no QR;
- no deeplinks a apps bancarias;
- no procesamiento de tarjetas en nuestro backend;
- no almacenamiento de datos de tarjeta;
- no confirmacion de pago por redirect/back URL;
- produccion siempre con HTTPS;
- para pruebas de webhook real, usar URL publica HTTPS tipo ngrok o cloudflared si hace falta.

## 2. Pasos previos en Mercado Pago Developers

Antes de implementar hay que crear una aplicacion en Mercado Pago Developers:

1. Ingresar a Mercado Pago Developers con la cuenta correspondiente.
2. Ir a **Tus integraciones**.
3. Crear una nueva aplicacion.
4. Ingresar un nombre de hasta 50 caracteres alfanumericos.
5. Seleccionar **Pagos online**.
6. Indicar que es una tienda o sitio con desarrollo propio.
7. Seleccionar **Checkouts**.
8. Seleccionar **Checkout Pro**.
9. Confirmar las opciones y aceptar la Declaracion de Privacidad y los Terminos.
10. Entrar a **Datos de integracion**.
11. Obtener credenciales de prueba:
    - Public Key de prueba.
    - Access Token de prueba.

Reglas:

- usar primero credenciales de prueba;
- no hardcodear Public Key ni Access Token;
- el Access Token nunca va al frontend;
- las credenciales reales se usan recien cuando sandbox este validado;
- guardar credenciales en variables de entorno o secrets;
- no commitear credenciales.

## 3. Flujo completo

1. El usuario entra a `/donar`.
2. Elige un monto sugerido o ingresa un monto manual.
3. Opcionalmente carga nombre, email y mensaje.
4. El frontend llama:

```http
POST /api/public/donations/create-preference
```

5. El backend valida:

- monto requerido;
- monto minimo y maximo;
- moneda fija `ARS`;
- longitud de nombre y mensaje;
- formato de email si viene informado.

6. El backend crea una entidad `Donation`:

```txt
Status = Pending
Provider = MercadoPago
ExternalReference = valor unico generado por backend
```

7. El backend crea una preferencia en Mercado Pago con:

- monto;
- moneda;
- descripcion;
- `external_reference`;
- `back_urls`;
- `notification_url`.

8. El backend guarda:

- `PreferenceId`;
- `CheckoutUrl`;
- `ExternalReference`.

9. El frontend redirige al usuario al checkout de Mercado Pago.
10. El usuario paga, deja pendiente, cancela o abandona.
11. Mercado Pago puede redirigir a success, failure o pending, pero ese redirect solo sirve para experiencia de usuario.
12. Mercado Pago envia el webhook a:

```http
POST /api/webhooks/mercadopago
```

13. El backend guarda un `DonationWebhookLog`.
14. El backend valida la notificacion y consulta el pago real a Mercado Pago.
15. El backend verifica que el `external_reference` coincida con una donacion existente.
16. El backend actualiza la donacion.
17. Al volver del checkout, el frontend consulta:

```http
GET /api/public/donations/{id}/status
```

18. La pantalla publica muestra gracias, pendiente o error segun el estado confirmado por backend.

Importante: nunca marcar una donacion como pagada solamente por llegar a la URL de exito.

## 4. Modelo de datos propuesto

### Donation

```txt
Id
Amount
Currency
DonorName nullable
DonorEmail nullable
DonorMessage nullable
Status
Provider
PreferenceId nullable
PaymentId nullable
ExternalReference unique
CheckoutUrl nullable
ProviderStatus nullable
ProviderStatusDetail nullable
CreatedAt
UpdatedAt
PaidAt nullable
```

Estados internos:

```txt
Pending
Paid
Rejected
Cancelled
Expired
Refunded futuro
```

Indices recomendados:

```txt
ExternalReference unique
PaymentId
PreferenceId
Status
CreatedAt
```

### DonationWebhookLog

```txt
Id
Provider
EventType
ExternalId
PayloadJson
HeadersJson
Processed
ProcessingError nullable
CreatedAt
ProcessedAt nullable
```

Indices recomendados:

```txt
Provider + ExternalId
CreatedAt
Processed
```

## 5. Endpoints propuestos

Publicos:

```http
POST /api/public/donations/create-preference
GET /api/public/donations/{id}/status
```

Webhook:

```http
POST /api/webhooks/mercadopago
```

Admin:

```http
GET /api/admin/donations
GET /api/admin/donations/{id}
```

Filtros admin sugeridos:

```txt
status
dateFrom
dateTo
minAmount
maxAmount
search
page
pageSize
```

El backoffice de donaciones queda visible solo para rol `Admin`.

## 6. Variables de entorno

Variables Mercado Pago:

```env
MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_PUBLIC_KEY=
MERCADOPAGO_WEBHOOK_SECRET=
MERCADOPAGO_SUCCESS_URL=
MERCADOPAGO_FAILURE_URL=
MERCADOPAGO_PENDING_URL=
MERCADOPAGO_NOTIFICATION_URL=
```

Variables del modulo de donaciones:

```env
DONATIONS_MIN_AMOUNT=1000
DONATIONS_MAX_AMOUNT=1000000
DONATIONS_CURRENCY=ARS
DONATIONS_PROVIDER=mercadopago
```

Sandbox:

- `MERCADOPAGO_ACCESS_TOKEN` de prueba es obligatorio para crear preferencias reales en sandbox.
- `MERCADOPAGO_PUBLIC_KEY` se guarda como referencia, aunque Checkout Pro server-side no deberia necesitar exponerla en frontend.
- `MERCADOPAGO_WEBHOOK_SECRET` se usa si la configuracion de Webhooks lo entrega para validar firma.
- `MERCADOPAGO_NOTIFICATION_URL` debe ser HTTPS publico si se quiere probar webhook real.

Produccion:

- usar credenciales reales recien despues de validar sandbox;
- `MERCADOPAGO_SUCCESS_URL`, `MERCADOPAGO_FAILURE_URL`, `MERCADOPAGO_PENDING_URL` y `MERCADOPAGO_NOTIFICATION_URL` deben usar HTTPS;
- secrets fuera del repo;
- no mezclar credenciales de prueba y produccion.

## 7. Seguridad

Reglas obligatorias:

- validar monto en backend;
- usar monto minimo y maximo configurables;
- usar moneda fija inicial `ARS`;
- generar `ExternalReference` unico en backend;
- webhook idempotente;
- guardar logs de webhook para auditoria;
- validar firma/secreto de webhook cuando este disponible;
- consultar el pago real a Mercado Pago antes de marcar `Paid`;
- no confiar en `success_url`, `failure_url` ni `pending_url` para confirmar pagos;
- no exponer `MERCADOPAGO_ACCESS_TOKEN` al frontend;
- no guardar datos de tarjeta;
- no procesar tarjetas en nuestro backend;
- no registrar datos sensibles en logs;
- aplicar rate limit a `create-preference`;
- si el webhook llega duplicado, no duplicar donaciones ni repetir efectos;
- si el pago queda pendiente, mantener `Pending` hasta confirmacion real;
- si el `external_reference` no coincide, no asociar el pago automaticamente.

## 8. Fases futuras

### 1B Backend mock

- Crear entidades `Donation` y `DonationWebhookLog`.
- Crear endpoints publicos y admin.
- Usar provider falso que devuelve una URL simulada.
- No conectar Mercado Pago todavia.

### 1C Frontend `/donar` mock

- Crear o completar `/donar`.
- Montos sugeridos.
- Monto manual.
- Datos opcionales.
- Pantallas gracias, pendiente y error.
- Consultar estado contra backend mock.

### 1D Sandbox Mercado Pago

- Agregar cliente Mercado Pago en backend.
- Crear preferencias reales con Access Token de prueba.
- Redireccionar al checkout sandbox.
- Configurar back URLs.

### 1E Webhook

- Recibir webhook.
- Validar firma/secreto si aplica.
- Consultar pago real.
- Actualizar donacion de forma idempotente.
- Guardar `DonationWebhookLog`.
- Probar reintentos y duplicados.

### 1F Admin donaciones

- Listado de donaciones.
- Filtros por estado, fecha y monto.
- Detalle con `paymentId`, `preferenceId`, `externalReference` y estados del proveedor.
- Solo rol `Admin`.

## 9. Que queda fuera

Fuera de esta etapa:

- QR;
- campanas;
- export CSV;
- otros proveedores de pago;
- transferencias bancarias directas;
- Mercado Pago real en produccion;
- credenciales reales;
- deeplinks a apps bancarias;
- procesamiento o almacenamiento de tarjetas;
- edicion manual de pagos desde backoffice.

## 10. Checklist antes de implementar

Antes de empezar la fase 1B conviene confirmar:

1. Textos legales o institucionales que deben aparecer en `/donar`.
2. Si se muestra email opcional o se oculta para simplificar.
3. Si el mensaje del donante queda visible solo en backoffice.
4. Dominio de staging con HTTPS.
5. Herramienta para webhook local: ngrok, cloudflared u otra.
6. Cuenta de Mercado Pago que quedara asociada a la fundacion.
7. Responsable de custodiar credenciales reales.
