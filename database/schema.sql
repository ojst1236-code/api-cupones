CREATE TABLE IF NOT EXISTS cupones (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(10) NOT NULL,
  porcentaje_descuento DECIMAL(5, 2) NOT NULL,
  fecha_inicio DATETIME NOT NULL,
  fecha_fin DATETIME NOT NULL,
  monto_minimo DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  estado ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
  PRIMARY KEY (id),
  UNIQUE KEY uq_cupones_codigo (codigo),
  CONSTRAINT chk_cupones_porcentaje
    CHECK (porcentaje_descuento > 0 AND porcentaje_descuento <= 70),
  CONSTRAINT chk_cupones_vigencia CHECK (fecha_inicio < fecha_fin),
  CONSTRAINT chk_cupones_monto_minimo CHECK (monto_minimo >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
