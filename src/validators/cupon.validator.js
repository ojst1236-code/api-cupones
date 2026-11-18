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

  return Number.isFinite(Date.parse(value));
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

function validarCrearCupon(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError(
      'CUERPO_INVALIDO',
      'El cuerpo de la solicitud debe ser un objeto JSON.'
    );
  }

  const codigo = normalizarCodigo(body.codigo);
  const porcentaje = body.porcentaje_descuento;
  const fechaInicio = body.fecha_inicio;
  const fechaFin = body.fecha_fin;
  const montoMinimo = body.monto_minimo;

  if (
    typeof porcentaje !== 'number' ||
    !Number.isFinite(porcentaje) ||
    porcentaje <= 0 ||
    porcentaje > 70
  ) {
    throw new ValidationError(
      'PORCENTAJE_INVALIDO',
      'El porcentaje de descuento debe ser mayor que 0 y menor o igual que 70.'
    );
  }

  if (!fechaIsoValida(fechaInicio) || !fechaIsoValida(fechaFin)) {
    throw new ValidationError(
      'VIGENCIA_INVALIDA',
      'Las fechas de inicio y fin deben ser ISO 8601 válidas con zona horaria.'
    );
  }

  if (Date.parse(fechaInicio) >= Date.parse(fechaFin)) {
    throw new ValidationError(
      'VIGENCIA_INVALIDA',
      'La fecha de inicio debe ser anterior a la fecha de fin.'
    );
  }

  if (
    typeof montoMinimo !== 'number' ||
    !Number.isFinite(montoMinimo) ||
    montoMinimo < 0
  ) {
    throw new ValidationError(
      'MONTO_MINIMO_INVALIDO',
      'El monto mínimo debe ser un número finito mayor o igual que cero.'
    );
  }

  return {
    codigo,
    porcentaje_descuento: porcentaje,
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin,
    monto_minimo: montoMinimo,
    estado: 'ACTIVO'
  };
}

module.exports = {
  validarEntrada,
  fechaIsoValida,
  validarCrearCupon,
  normalizarCodigo,
  ValidationError
};
