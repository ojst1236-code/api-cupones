# API REST de gestión de cupones

API en Node.js, Express y MySQL para crear, consultar, validar y desactivar
cupones de descuento.

## Requisitos

- Node.js LTS
- MySQL
- Esquema de base de datos en `database/schema.sql`

La base de datos guarda las fechas como `DATETIME` en UTC-05:00. La API recibe
y responde fechas ISO 8601 con zona horaria explícita. Los identificadores
internos numéricos se exponen como cadenas con el formato `CUP-0001`.

## Configuración y ejecución

1. Configura `.env` con las variables de conexión MySQL.
2. Ejecuta `database/schema.sql` en la base de datos.
3. Instala dependencias con `npm install`.
4. Inicia la API con `npm start`. Al arrancar, comprueba la conexión a MySQL.
5. Ejecuta las pruebas con `npm test`.

## Despliegue en Railway

1. Conecta el repositorio `ojst1236-code/api-cupones` desde Railway con
   **Deploy from GitHub repo**.
2. Añade un servicio MySQL al proyecto.
3. En las variables del servicio API, crea referencias a `MYSQLHOST`,
   `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD` y `MYSQLDATABASE` del servicio
   MySQL. No subas secretos al repositorio; Railway asigna `PORT`
   automáticamente.
4. Ejecuta `database/schema.sql` en la base de datos de Railway.
5. Espera a que termine el despliegue y usa el dominio generado por Railway.

La autenticación y los roles están fuera del alcance definido para esta API;
por tanto, sus endpoints no requieren clave.

## Endpoints

### Crear un cupón

`POST /cupones`

```json
{
  "codigo": "ECLIPSE-10",
  "porcentaje_descuento": 10,
  "fecha_inicio": "2026-10-01T00:00:00-05:00",
  "fecha_fin": "2026-12-31T23:59:59-05:00",
  "monto_minimo": 50000
}
```

El estado se asigna automáticamente como `ACTIVO`. La respuesta exitosa
incluye el ID generado, los datos completos del cupón y el estado.

### Consultar un cupón

`GET /cupones/ECLIPSE-10`

La búsqueda normaliza el código a mayúsculas y devuelve los siete campos del
cupón. Un cupón inexistente responde `404` con `CUPON_NO_ENCONTRADO`.

### Validar un cupón

`POST /cupones/validar`

```json
{
  "codigo": "ECLIPSE-10",
  "monto_compra": 80000,
  "fecha_hora_validacion": "2026-10-26T09:00:00-05:00"
}
```

La validación no procesa pagos ni modifica compras. Los montos deben ser
mayores que cero y el descuento se calcula con precisión decimal, redondeado
a dos posiciones.

### Desactivar un cupón

`PATCH /cupones/ECLIPSE-10/desactivar`

La operación es idempotente: si ya está inactivo, conserva el estado y
responde `200`. Si no existe, responde `404` con `CUPON_NO_ENCONTRADO`.

## Comandos de uso desde PowerShell

Ejecuta estos comandos desde la carpeta del proyecto para probarlo localmente:

```powershell
# Ejecutar desde la carpeta raíz del proyecto
npm test
npm start
```

`npm start` debe indicar que MySQL está conectado y que la API escucha en el
puerto `3000`. Déjalo ejecutándose y abre otra ventana de PowerShell para
enviar solicitudes. Para probar Railway, usa su dominio; para probar
localmente, cambia `$base` por `http://localhost:3000`.

```powershell
$base = 'https://api-cupones-production.up.railway.app'

# Comprobar que la API responde
Invoke-RestMethod "$base/" | ConvertTo-Json -Compress
```

### Crear y consultar

Elige un código nuevo de 3 a 10 caracteres. Si repites un código existente, la
API responde `409 CODIGO_DUPLICADO`. La creación agrega un registro permanente
a la base de datos.

```powershell
$codigo = 'PRUEBA-11'
$nuevoCupon = @{
  codigo = $codigo
  porcentaje_descuento = 10
  fecha_inicio = '2026-11-01T00:00:00-05:00'
  fecha_fin = '2026-12-31T23:59:59-05:00'
  monto_minimo = 50000
}

Invoke-RestMethod `
  -Uri "$base/cupones" `
  -Method Post `
  -ContentType 'application/json' `
  -Body ($nuevoCupon | ConvertTo-Json -Compress) |
  ConvertTo-Json -Compress

# La consulta también acepta el código en minúsculas
Invoke-RestMethod "$base/cupones/prueba-11" | ConvertTo-Json -Compress
```

La creación exitosa responde `201`, con estado `ACTIVO` e ID público como
`CUP-0001`.

### Validar y comprobar los cálculos

```powershell
$validacion = @{
  codigo = $codigo
  monto_compra = 80000
  fecha_hora_validacion = '2026-11-17T12:00:00-05:00'
}

Invoke-RestMethod `
  -Uri "$base/cupones/validar" `
  -Method Post `
  -ContentType 'application/json' `
  -Body ($validacion | ConvertTo-Json -Compress) |
  ConvertTo-Json -Compress
```

Debe responder `elegible: true`, descuento `8000` y total `72000`. Otros casos
que puedes probar cambiando los valores de `$validacion`:

```powershell
# Compra menor que el mínimo: motivo MONTO_MINIMO_NO_CUMPLIDO
$validacion.monto_compra = 40000

# Fecha antes del inicio: motivo CUPON_FUERA_DE_VIGENCIA
$validacion.monto_compra = 80000
$validacion.fecha_hora_validacion = '2026-10-31T23:59:59-05:00'

# Los dos extremos de la vigencia deben ser válidos (inclusivos)
$validacion.monto_compra = 50000
$validacion.fecha_hora_validacion = '2026-11-01T00:00:00-05:00'
# Ejecuta la solicitud; luego prueba también la fecha final:
$validacion.fecha_hora_validacion = '2026-12-31T23:59:59-05:00'

# Compra que prueba el redondeo HALF_UP: descuento 5000.01, total 45000.04
$validacion.monto_compra = 50000.05
$validacion.fecha_hora_validacion = '2026-11-17T12:00:00-05:00'
```

Después de cada cambio, vuelve a ejecutar el bloque `Invoke-RestMethod` de
validación. Las fechas deben llevar zona horaria explícita y estar dentro del
periodo del cupón para que sea elegible.

### Desactivar

La desactivación cambia el estado guardado. Usa el cupón temporal creado arriba
y no el cupón real que quieras conservar activo.

```powershell
curl.exe -i -X PATCH "$base/cupones/$codigo/desactivar"

# Repetir debe seguir respondiendo HTTP 200 (operación idempotente)
curl.exe -i -X PATCH "$base/cupones/$codigo/desactivar"

Invoke-RestMethod "$base/cupones/$codigo" | ConvertTo-Json -Compress

$validacionInactivo = @{
  codigo = $codigo
  monto_compra = 80000
  fecha_hora_validacion = '2026-11-17T12:00:00-05:00'
}

Invoke-RestMethod `
  -Uri "$base/cupones/validar" `
  -Method Post `
  -ContentType 'application/json' `
  -Body ($validacionInactivo | ConvertTo-Json -Compress) |
  ConvertTo-Json -Compress
```

La consulta final debe mostrar `INACTIVO`. Una validación posterior debe
responder `elegible: false` con motivo `CUPON_INACTIVO`.

### Errores esperados

- `POST /cupones`: porcentaje `0` o mayor que `70` → `400
  PORCENTAJE_INVALIDO`; fechas ISO inválidas o inicio no anterior al fin →
  `400 VIGENCIA_INVALIDA`; monto mínimo negativo → `400
  MONTO_MINIMO_INVALIDO`; código inválido → `400 CODIGO_INVALIDO`.
- Repetir la creación con el mismo código → `409 CODIGO_DUPLICADO`.
- Consultar un código inexistente → `404 CUPON_NO_ENCONTRADO`.
- En `POST /cupones/validar`, monto de compra no positivo → `400
  MONTO_COMPRA_INVALIDO`; fecha inválida o sin zona horaria → `400
  FECHA_HORA_VALIDACION_INVALIDA`.

## Reglas principales

- Código único de 3 a 10 caracteres: letras, números y guiones; se almacena
  en mayúsculas.
- Porcentaje mayor que 0 y menor o igual que 70.
- `fecha_inicio` debe ser anterior a `fecha_fin`.
- `monto_minimo` debe ser mayor o igual que cero.
- Los extremos del periodo de vigencia son inclusivos.
- Los cupones inactivos no son aplicables.
