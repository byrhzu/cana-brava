-- ============================================================
-- PLANILLA CAÑA BRAVA — base de datos (Cloudflare D1)
--
-- Sale tal cual del modelo que ya usa el panel: locales,
-- empleados, ausencias, los ajustes de cada quincena, los
-- cierres con su monto congelado y la bitácora.
--
-- Las fechas se guardan como texto 'AAAA-MM-DD' y los períodos
-- como 'AAAA-MM', igual que hoy. El dinero va en colones
-- enteros: no hay céntimos en una planilla.
-- ============================================================

CREATE TABLE IF NOT EXISTS locales (
	id      TEXT PRIMARY KEY,
	grupo   TEXT NOT NULL,              -- el restaurante: Caña Brava, Pollo Bravo
	sede    TEXT,                       -- Guápiles, Guácimo
	activo  INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS empleados (
	id               TEXT PRIMARY KEY,
	local_id         TEXT NOT NULL REFERENCES locales(id),
	nombre           TEXT NOT NULL,
	cedula           TEXT,
	correo           TEXT,
	puesto           TEXT,
	fecha_ingreso    TEXT,
	fecha_salida     TEXT,              -- el último día; manda sobre 'activo'
	salario_mensual  INTEGER NOT NULL DEFAULT 0,
	cuenta           TEXT,
	activo           INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_empleados_local ON empleados(local_id);

-- Vacaciones, incapacidades, maternidad y permisos: todo el
-- tiempo fuera del puesto en una sola tabla, como en el panel.
CREATE TABLE IF NOT EXISTS ausencias (
	id          TEXT PRIMARY KEY,
	empleado_id TEXT NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
	tipo        TEXT NOT NULL CHECK (tipo IN ('vacaciones','ccss','ins','maternidad','singoce')),
	desde       TEXT NOT NULL,
	hasta       TEXT,
	dias        REAL NOT NULL DEFAULT 1,
	boleta      TEXT,                   -- número de boleta de la CCSS o el INS
	nota        TEXT
);
CREATE INDEX IF NOT EXISTS idx_ausencias_emp ON ausencias(empleado_id, desde);

-- Lo que se escribe a mano en la quincena.
CREATE TABLE IF NOT EXISTS ajustes (
	periodo     TEXT NOT NULL,          -- 'AAAA-MM'
	local_id    TEXT NOT NULL,
	empleado_id TEXT NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
	q           INTEGER NOT NULL CHECK (q IN (1,2)),
	horas_extra REAL    NOT NULL DEFAULT 0,
	adelanto    INTEGER NOT NULL DEFAULT 0,
	otras       INTEGER NOT NULL DEFAULT 0,
	PRIMARY KEY (periodo, local_id, empleado_id, q)
);

-- Una quincena cerrada por local. 'total' y la tabla pagos
-- guardan lo que de verdad se pagó: si después cambia un
-- salario, el historial no se mueve.
CREATE TABLE IF NOT EXISTS cierres (
	periodo    TEXT NOT NULL,
	local_id   TEXT NOT NULL REFERENCES locales(id),
	q          INTEGER NOT NULL CHECK (q IN (1,2)),
	cerrado_en TEXT NOT NULL,
	cerrado_por TEXT,
	total      INTEGER NOT NULL DEFAULT 0,
	reabierta  INTEGER NOT NULL DEFAULT 0,
	PRIMARY KEY (periodo, local_id, q)
);

CREATE TABLE IF NOT EXISTS pagos (
	periodo         TEXT NOT NULL,
	local_id        TEXT NOT NULL,
	q               INTEGER NOT NULL CHECK (q IN (1,2)),
	empleado_id     TEXT NOT NULL REFERENCES empleados(id),
	neto            INTEGER NOT NULL,
	correo          TEXT,               -- a dónde se mandó la boleta
	enviado_en      TEXT,               -- null mientras no se haya enviado
	error_envio     TEXT,
	PRIMARY KEY (periodo, local_id, q, empleado_id)
);

-- Quién tocó qué después de un cierre. Con Access en la puerta
-- ya se sabe el correo de quien entró, así que 'quien' deja de
-- estar vacío como en la versión local.
CREATE TABLE IF NOT EXISTS bitacora (
	id       INTEGER PRIMARY KEY AUTOINCREMENT,
	periodo  TEXT NOT NULL,
	local_id TEXT NOT NULL,
	cuando   TEXT NOT NULL,
	quien    TEXT,
	que      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_bitacora_periodo ON bitacora(periodo, local_id, cuando);

-- Porcentajes y días. Una fila por valor, así agregar uno nuevo
-- no obliga a migrar la tabla.
CREATE TABLE IF NOT EXISTS tasas (
	clave TEXT PRIMARY KEY,
	valor REAL NOT NULL
);

INSERT OR IGNORE INTO tasas (clave, valor) VALUES
	('sem', 5.50), ('ivm', 4.33), ('bp', 1.00), ('patronal', 26.83),
	('rentaExento', 918000), ('vacDiasMes', 1),
	('incDias', 3), ('incPct', 50),
	('insDias', 0), ('insPct', 50),
	('matPct', 50);

INSERT OR IGNORE INTO locales (id, grupo, sede, activo) VALUES
	('cbgpl', 'Caña Brava',  'Guápiles', 1),
	('cbgua', 'Caña Brava',  'Guácimo',  1),
	('pbgpl', 'Pollo Bravo', 'Guápiles', 1),
	('pbgua', 'Pollo Bravo', 'Guácimo',  1);
