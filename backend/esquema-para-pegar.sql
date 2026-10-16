CREATE TABLE IF NOT EXISTS locales (
	id      TEXT PRIMARY KEY,
	grupo   TEXT NOT NULL,
	sede    TEXT,
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
	fecha_salida     TEXT,
	salario_mensual  INTEGER NOT NULL DEFAULT 0,
	cuenta           TEXT,
	activo           INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_empleados_local ON empleados(local_id);
CREATE TABLE IF NOT EXISTS ausencias (
	id          TEXT PRIMARY KEY,
	empleado_id TEXT NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
	tipo        TEXT NOT NULL CHECK (tipo IN ('vacaciones','ccss','ins','maternidad','singoce')),
	desde       TEXT NOT NULL,
	hasta       TEXT,
	dias        REAL NOT NULL DEFAULT 1,
	boleta      TEXT,
	nota        TEXT
);
CREATE INDEX IF NOT EXISTS idx_ausencias_emp ON ausencias(empleado_id, desde);
CREATE TABLE IF NOT EXISTS ajustes (
	periodo     TEXT NOT NULL,
	local_id    TEXT NOT NULL,
	empleado_id TEXT NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
	q           INTEGER NOT NULL CHECK (q IN (1,2)),
	horas_extra REAL    NOT NULL DEFAULT 0,
	adelanto    INTEGER NOT NULL DEFAULT 0,
	otras       INTEGER NOT NULL DEFAULT 0,
	PRIMARY KEY (periodo, local_id, empleado_id, q)
);
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
	correo          TEXT,
	enviado_en      TEXT,
	error_envio     TEXT,
	PRIMARY KEY (periodo, local_id, q, empleado_id)
);
CREATE TABLE IF NOT EXISTS bitacora (
	id       INTEGER PRIMARY KEY AUTOINCREMENT,
	periodo  TEXT NOT NULL,
	local_id TEXT NOT NULL,
	cuando   TEXT NOT NULL,
	quien    TEXT,
	que      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_bitacora_periodo ON bitacora(periodo, local_id, cuando);
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
