# API REST de cupones

API en Node.js, Express y MySQL que implementa `POST /cupones/validar`.
También permite consultar cupones con `GET /cupones/:codigo`, crear cupones
con `POST /cupones` y modificarlos con `PUT /cupones/:codigo`.

## Requisitos

- Node.js LTS
- MySQL Server con la base `api_cupones` y la tabla `cupones`

La tabla debe incluir `id`, `codigo`, `porcentaje_descuento`, `fecha_inicio`,
`fecha_fin`, `monto_minimo` y `estado`. Las columnas `DATETIME` existentes
representan hora local UTC-05:00 y se comparan como instantes con la fecha ISO
8601 enviada en la solicitud. `fecha_hora_validacion` es obligatoria por ahora
para reproducir evaluaciones; falta confirmar con el docente si debe seguir
siendo obligatoria o si, al omitirse, se usará la hora del servidor.

El descuento se calcula con aritmética decimal y se redondea a dos decimales
con `ROUND_HALF_UP`; el total se obtiene restando ese descuento redondeado.
Este redondeo es una decisión técnica propuesta por el equipo.

## Configuración y ejecución

1. Verifica que `.env` tenga la configuración local de MySQL.
2. Configura `ADMIN_API_KEY` con una clave aleatoria de al menos 32 caracteres.
   Puedes generar una con `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`.
3. Desde la carpeta del proyecto, instala dependencias con `npm install`.
4. Inicia la API con `npm start`. Al arrancar, comprueba la conexión a MySQL.
5. Ejecuta las pruebas unitarias con `npm test`.

## Despliegue en Railway

1. Conecta el repositorio `ojst1236-code/api-cupones` desde Railway con
   **Deploy from GitHub repo**.
2. Añade un servicio MySQL al proyecto.
3. En las variables del servicio de la API, crea referencias a las variables
   MySQL `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD` y
   `MYSQLDATABASE`. Configura también `ADMIN_API_KEY` con una clave aleatoria
   de al menos 32 caracteres. No subas secretos al repositorio. Railway asigna
   `PORT` automáticamente.
4. Crea la tabla `cupones` en la base de datos antes de probar los endpoints;
   este proyecto no incluye un esquema ni migración SQL.
5. Espera a que termine el despliegue y usa el dominio generado por Railway
   para probar `GET /`, `GET /cupones/:codigo` y
   `POST /cupones/validar`.

## Solicitud de ejemplo

```http
POST http://localhost:3000/cupones/validar
Content-Type: application/json
```

```json
{
  "codigo": "ECLIPSE-10",
  "monto_compra": 80000,
  "fecha_hora_validacion": "2026-11-03T15:00:00-05:00"
}
```

Los códigos válidos se convierten a mayúsculas. Las solicitudes inválidas
responden con HTTP 400. Además de los códigos originales del catálogo, se
proponen `CUERPO_INVALIDO` y `FECHA_HORA_VALIDACION_INVALIDA` como extensiones
técnicas para describir esas entradas incorrectas.

En Postman, crea una solicitud `POST` a
`http://localhost:3000/cupones/validar`, selecciona **Body → raw → JSON** y usa
el JSON anterior. Para probar un cupón inexistente, cambia `codigo` por otro
código válido que no esté guardado en la base de datos.

Para consultar un cupón en Postman, envía `GET
http://localhost:3000/cupones/eclipse-10`. La respuesta incluye los siete
campos del registro; los importes son números y los `DATETIME` llevan el
offset `-05:00`. La consulta también devuelve cupones inactivos, vencidos o
futuros: no determina su elegibilidad.

Para crear un cupón, envía `POST http://localhost:3000/cupones` con un cuerpo
JSON que incluya `codigo`, `porcentaje_descuento`, `fecha_inicio`, `fecha_fin`
y `monto_minimo`. `estado` es opcional y, si se omite, queda como `ACTIVO`.
Las fechas deben enviarse en el formato que acepte la columna `DATETIME` de
MySQL, por ejemplo `"2026-11-03 15:00:00"`. Incluye el encabezado
`Authorization: Bearer <ADMIN_API_KEY>` para autenticarte.

Para modificarlo, envía `PUT http://localhost:3000/cupones/ECLIPSE-10` con
`porcentaje_descuento`, `fecha_inicio`, `fecha_fin`, `monto_minimo` y `estado`.
El código de la URL identifica el cupón y no se modifica. Esta solicitud
también requiere `Authorization: Bearer <ADMIN_API_KEY>`. La consulta y la
validación permanecen públicas.

## Archivos

- `src/app.js`: configura Express, conecta las rutas y comprueba MySQL al iniciar.
- `src/config/db.js`: carga variables de entorno y crea el pool de conexiones.
- `src/routes/cupon.routes.js`: declara las rutas de validación, consulta, creación y modificación de cupones.
- `src/controllers/cupon.controller.js`: recibe solicitudes, delega al servicio y traduce errores HTTP.
- `src/services/cupon.service.js`: aplica reglas de elegibilidad y consulta/serializa cupones.
- `src/repositories/cupon.repository.js`: obtiene los datos reales con una consulta parametrizada.
- `src/validators/cupon.validator.js`: valida el cuerpo, el formato del código, el monto y la fecha.
- `test/cupon.validator.test.js`, `test/cupon.service.test.js` y `test/cupon.consulta.test.js`: prueban validación, fechas, RF-03 y consulta de cupones.
