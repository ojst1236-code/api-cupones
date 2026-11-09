const CODIGO_REGEX = /^[A-Za-z0-9-]{3,10}$/;
const FECHA_ISO_REGEX =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(Z|[+-]\d{2}:\d{2})$/i;

class ValidationError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
    this.code = code;
  }
}

function fechaIsoValida(value) {
  if (typeof value !== 'string') {
    return false;
  }

  const parts = value.match(FECHA_ISO_REGEX);
  if (!parts) {
    return false;
  }

  const [, yearText, monthText, dayText, hourText, minuteText, secondText, , zone] =
    parts;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  const daysInMonth = [
    31,
    (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31
  ];

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > daysInMonth[month - 1] ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    return false;
  }

  if (zone.toUpperCase() !== 'Z') {
    const [zoneHours, zoneMinutes] = zone.slice(1).split(':').map(Number);
    if (zoneHours > 23 || zoneMinutes > 59) {
      return false;
    }
  }

  return true;
}

function normalizarCodigo(codigo) {
  if (typeof codigo !== 'string' || !CODIGO_REGEX.test(codigo)) {
    throw new ValidationError(
      'CODIGO_INVALIDO',
      'El código debe tener entre 3 y 10 caracteres alfanuméricos o guiones.'
    );
  }

  return codigo.toUpperCase();
}

function validarEntrada(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError(
      'CUERPO_INVALIDO',
      'El cuerpo de la solicitud debe ser un objeto JSON.'
    );
  }

  const { codigo, monto_compra: montoCompra, fecha_hora_validacion: fecha } =
    body;

  const codigoNormalizado = normalizarCodigo(codigo);

  if (
    typeof montoCompra !== 'number' ||
    !Number.isFinite(montoCompra) ||
    montoCompra <= 0
  ) {
    throw new ValidationError(
      'MONTO_COMPRA_INVALIDO',
      'El monto de compra debe ser un número finito mayor que cero.'
    );
  }

  if (!fechaIsoValida(fecha)) {
    throw new ValidationError(
      'FECHA_HORA_VALIDACION_INVALIDA',
      'La fecha debe ser una fecha ISO 8601 válida con zona horaria explícita.'
    );
  }

  return {
    codigo: codigoNormalizado,
    montoCompra,
    fechaHoraValidacion: fecha
  };
}

module.exports = {
  validarEntrada,
  fechaIsoValida,
  normalizarCodigo,
  ValidationError
};
