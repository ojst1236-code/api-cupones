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

## Reglas principales

- Código único de 3 a 10 caracteres: letras, números y guiones; se almacena
  en mayúsculas.
- Porcentaje mayor que 0 y menor o igual que 70.
- `fecha_inicio` debe ser anterior a `fecha_fin`.
- `monto_minimo` debe ser mayor o igual que cero.
- Los extremos del periodo de vigencia son inclusivos.
- Los cupones inactivos no son aplicables.
