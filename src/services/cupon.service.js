const Decimal = require('decimal.js');
const cuponRepository = require('../repositories/cupon.repository');
const {
  validarEntrada,
  normalizarCodigo
} = require('../validators/cupon.validator');

const OFFSET_DATETIME = '-05:00';
const DATETIME_REGEX =
  /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;

function datetimeLocalAInstante(value) {
  if (typeof value !== 'string' || !DATETIME_REGEX.test(value)) {
    throw new Error('MySQL devolvió una fecha DATETIME inválida.');
  }

  const [year, month, day, hour, minute, second] = value
    .match(DATETIME_REGEX)
    .slice(1)
    .map(Number);
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
    throw new Error('MySQL devolvió una fecha DATETIME inválida.');
  }

  const instante = Date.parse(`${value.replace(' ', 'T')}${OFFSET_DATETIME}`);
  if (!Number.isFinite(instante)) {
    throw new Error('MySQL devolvió una fecha DATETIME inválida.');
  }
  return instante;
}

async function validarCupon(body, repository = cuponRepository) {
  const entrada = validarEntrada(body);
  const cupon = await repository.obtenerPorCodigo(entrada.codigo);

  if (!cupon) {
    return {
      status: 404,
      body: {
        error: 'CUPON_NO_ENCONTRADO',
        mensaje: 'El cupón solicitado no existe.'
      }
    };
  }

  if (cupon.estado === 'INACTIVO') {
    return rechazo('CUPON_INACTIVO', entrada.montoCompra, cupon);
  }

  const instanteValidacion = Date.parse(entrada.fechaHoraValidacion);
  const instanteInicio = datetimeLocalAInstante(cupon.fecha_inicio);
  const instanteFin = datetimeLocalAInstante(cupon.fecha_fin);

  if (
    instanteValidacion < instanteInicio ||
    instanteValidacion > instanteFin
  ) {
    return rechazo('CUPON_FUERA_DE_VIGENCIA', entrada.montoCompra, cupon);
  }

  const montoCompra = new Decimal(String(entrada.montoCompra));
  const montoMinimo = new Decimal(String(cupon.monto_minimo));
  if (montoCompra.lessThan(montoMinimo)) {
    return rechazo('MONTO_MINIMO_NO_CUMPLIDO', entrada.montoCompra, cupon);
  }

  const porcentaje = new Decimal(String(cupon.porcentaje_descuento));
  const descuento = montoCompra
    .times(porcentaje)
    .dividedBy(100)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const total = montoCompra.minus(descuento);

  return {
    status: 200,
    body: {
      elegible: true,
      porcentaje_descuento: porcentaje.toNumber(),
      monto_compra: montoCompra.toNumber(),
      descuento_calculado: descuento.toNumber(),
      total_estimado: total.toNumber(),
      motivo: 'CUPON_APLICABLE'
    }
  };
}

async function consultarCupon(codigo, repository = cuponRepository) {
  const codigoNormalizado = normalizarCodigo(codigo);
  const cupon = await repository.obtenerPorCodigo(codigoNormalizado);

  if (!cupon) {
    return {
      status: 404,
      body: {
        error: 'CUPON_NO_ENCONTRADO',
        mensaje: 'El cupón solicitado no existe.'
      }
    };
  }

  const porcentaje = new Decimal(String(cupon.porcentaje_descuento));
  const montoMinimo = new Decimal(String(cupon.monto_minimo));
  if (!porcentaje.isFinite() || !montoMinimo.isFinite()) {
    throw new Error('MySQL devolvió valores numéricos inválidos para el cupón.');
  }

  const fechaInicio = formatearFechaLocal(cupon.fecha_inicio);
  const fechaFin = formatearFechaLocal(cupon.fecha_fin);

  return {
    status: 200,
    body: {
      id: cupon.id,
      codigo: cupon.codigo,
      porcentaje_descuento: porcentaje.toNumber(),
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      monto_minimo: montoMinimo.toNumber(),
      estado: cupon.estado
    }
  };
}

function formatearFechaLocal(value) {
  datetimeLocalAInstante(value);
  return `${value.replace(' ', 'T')}${OFFSET_DATETIME}`;
}

function rechazo(motivo, montoCompra, cupon) {
  return {
    status: 200,
    body: {
      elegible: false,
      porcentaje_descuento: Number(cupon.porcentaje_descuento),
      monto_compra: montoCompra,
      descuento_calculado: 0,
      total_estimado: montoCompra,
      motivo
    }
  };
}

module.exports = {
  validarCupon,
  consultarCupon,
  datetimeLocalAInstante,
  formatearFechaLocal
};
