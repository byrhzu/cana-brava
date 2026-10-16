/* ============================================================
   LAS CONSULTAS

   Una función por cosa que el panel necesita. Nada de SQL armado con
   pegado de texto: todo va con parámetros, que es lo que evita que un
   nombre con comillas rompa la consulta o algo peor.
   ============================================================ */

var si = function (v) { return v ? 1 : 0; };

/* ---------- lo que el panel necesita para arrancar ---------- */
export async function cargarTodo(db) {
	var r = await db.batch([
		db.prepare('SELECT * FROM locales ORDER BY grupo, sede'),
		db.prepare('SELECT * FROM empleados ORDER BY nombre'),
		db.prepare('SELECT * FROM ausencias ORDER BY desde DESC'),
		db.prepare('SELECT * FROM tasas')
	]);

	var ausenciasPorEmp = {};
	r[2].results.forEach(function (a) {
		(ausenciasPorEmp[a.empleado_id] = ausenciasPorEmp[a.empleado_id] || []).push({
			id: a.id, tipo: a.tipo, desde: a.desde, hasta: a.hasta,
			dias: a.dias, boleta: a.boleta || '', nota: a.nota || ''
		});
	});

	var tasas = {};
	r[3].results.forEach(function (t) { tasas[t.clave] = t.valor; });

	return {
		locales: r[0].results.map(function (l) {
			return { id: l.id, grupo: l.grupo, sede: l.sede, activo: l.activo === 1 };
		}),
		empleados: r[1].results.map(function (e) {
			return {
				id: e.id, localId: e.local_id, nombre: e.nombre, cedula: e.cedula || '',
				correo: e.correo || '', puesto: e.puesto || '',
				fechaIngreso: e.fecha_ingreso || '', fechaSalida: e.fecha_salida || '',
				salarioMensual: e.salario_mensual, cuenta: e.cuenta || '',
				activo: e.activo === 1, ausencias: ausenciasPorEmp[e.id] || []
			};
		}),
		tasas: tasas
	};
}

/* ---------- lo de un mes, que se pide aparte ---------- */
export async function cargarPeriodo(db, periodo) {
	var r = await db.batch([
		db.prepare('SELECT * FROM ajustes WHERE periodo = ?').bind(periodo),
		db.prepare('SELECT * FROM cierres WHERE periodo = ?').bind(periodo),
		db.prepare('SELECT * FROM pagos WHERE periodo = ?').bind(periodo),
		db.prepare('SELECT * FROM bitacora WHERE periodo = ? ORDER BY cuando DESC').bind(periodo)
	]);

	var out = {};
	function local(lid) {
		return (out[lid] = out[lid] || { ajustes: {}, enviado: {}, pagado: {}, reabierta: {}, bitacora: [] });
	}

	r[0].results.forEach(function (a) {
		var pp = local(a.local_id);
		var e = (pp.ajustes[a.empleado_id] = pp.ajustes[a.empleado_id] || { q1: {}, q2: {} });
		e['q' + a.q] = { horasExtra: a.horas_extra, adelanto: a.adelanto, otras: a.otras };
	});
	r[1].results.forEach(function (c) {
		var pp = local(c.local_id);
		if (c.cerrado_en) pp.enviado['q' + c.q] = c.cerrado_en;
		if (c.reabierta) pp.reabierta['q' + c.q] = true;
	});
	r[2].results.forEach(function (p) {
		var pp = local(p.local_id);
		var caja = (pp.pagado['q' + p.q] = pp.pagado['q' + p.q] || { total: 0, empleados: {} });
		caja.empleados[p.empleado_id] = p.neto;
		caja.total += p.neto;
	});
	r[3].results.forEach(function (b) {
		local(b.local_id).bitacora.push({ cuando: b.cuando, que: b.que, quien: b.quien || '' });
	});

	return out;
}

/* ---------- escrituras ---------- */
export function guardarLocal(db, l) {
	return db.prepare(
		'INSERT INTO locales (id, grupo, sede, activo) VALUES (?, ?, ?, ?) ' +
		'ON CONFLICT(id) DO UPDATE SET grupo = excluded.grupo, sede = excluded.sede, activo = excluded.activo'
	).bind(l.id, l.grupo, l.sede || '', si(l.activo)).run();
}

export function guardarEmpleado(db, e) {
	return db.prepare(
		'INSERT INTO empleados (id, local_id, nombre, cedula, correo, puesto, fecha_ingreso, fecha_salida, salario_mensual, cuenta, activo) ' +
		'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ' +
		'ON CONFLICT(id) DO UPDATE SET local_id = excluded.local_id, nombre = excluded.nombre, ' +
		'cedula = excluded.cedula, correo = excluded.correo, puesto = excluded.puesto, ' +
		'fecha_ingreso = excluded.fecha_ingreso, fecha_salida = excluded.fecha_salida, ' +
		'salario_mensual = excluded.salario_mensual, cuenta = excluded.cuenta, activo = excluded.activo'
	).bind(
		e.id, e.localId, e.nombre, e.cedula || '', e.correo || '', e.puesto || '',
		e.fechaIngreso || '', e.fechaSalida || '', Math.round(Number(e.salarioMensual) || 0),
		e.cuenta || '', si(e.activo)
	).run();
}

export function borrarEmpleado(db, id) {
	return db.prepare('DELETE FROM empleados WHERE id = ?').bind(id).run();
}

export function guardarAusencia(db, empId, a) {
	return db.prepare(
		'INSERT INTO ausencias (id, empleado_id, tipo, desde, hasta, dias, boleta, nota) ' +
		'VALUES (?, ?, ?, ?, ?, ?, ?, ?) ' +
		'ON CONFLICT(id) DO UPDATE SET tipo = excluded.tipo, desde = excluded.desde, ' +
		'hasta = excluded.hasta, dias = excluded.dias, boleta = excluded.boleta, nota = excluded.nota'
	).bind(a.id, empId, a.tipo, a.desde, a.hasta || a.desde, Number(a.dias) || 1, a.boleta || '', a.nota || '').run();
}

export function borrarAusencia(db, id) {
	return db.prepare('DELETE FROM ausencias WHERE id = ?').bind(id).run();
}

export function guardarAjuste(db, a) {
	return db.prepare(
		'INSERT INTO ajustes (periodo, local_id, empleado_id, q, horas_extra, adelanto, otras) ' +
		'VALUES (?, ?, ?, ?, ?, ?, ?) ' +
		'ON CONFLICT(periodo, local_id, empleado_id, q) DO UPDATE SET ' +
		'horas_extra = excluded.horas_extra, adelanto = excluded.adelanto, otras = excluded.otras'
	).bind(
		a.periodo, a.localId, a.empleadoId, Number(a.q),
		Number(a.horasExtra) || 0, Math.round(Number(a.adelanto) || 0), Math.round(Number(a.otras) || 0)
	).run();
}

export function guardarTasas(db, tasas) {
	var filas = Object.keys(tasas).map(function (k) {
		return db.prepare(
			'INSERT INTO tasas (clave, valor) VALUES (?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor'
		).bind(k, Number(tasas[k]) || 0);
	});
	return filas.length ? db.batch(filas) : Promise.resolve();
}

export function anotar(db, periodo, localId, quien, que) {
	return db.prepare(
		'INSERT INTO bitacora (periodo, local_id, cuando, quien, que) VALUES (?, ?, ?, ?, ?)'
	).bind(periodo, localId, new Date().toISOString(), quien || '', que).run();
}

/* Cerrar: se congela el monto de cada boleta. El cierre y los pagos
   entran juntos, así no queda una quincena cerrada sin sus montos si
   algo falla en medio. */
export async function cerrarQuincena(db, periodo, localId, q, lista, quien) {
	var ahora = new Date().toISOString();
	var total = lista.reduce(function (t, p) { return t + Math.round(p.neto); }, 0);

	var ops = [
		db.prepare('DELETE FROM pagos WHERE periodo = ? AND local_id = ? AND q = ?').bind(periodo, localId, q),
		db.prepare(
			'INSERT INTO cierres (periodo, local_id, q, cerrado_en, cerrado_por, total, reabierta) ' +
			'VALUES (?, ?, ?, ?, ?, ?, 0) ' +
			'ON CONFLICT(periodo, local_id, q) DO UPDATE SET cerrado_en = excluded.cerrado_en, ' +
			'cerrado_por = excluded.cerrado_por, total = excluded.total, reabierta = 0'
		).bind(periodo, localId, q, ahora, quien || '', total)
	];

	lista.forEach(function (p) {
		ops.push(db.prepare(
			'INSERT INTO pagos (periodo, local_id, q, empleado_id, neto, correo) VALUES (?, ?, ?, ?, ?, ?)'
		).bind(periodo, localId, q, p.empleadoId, Math.round(p.neto), p.correo || ''));
	});

	ops.push(db.prepare(
		'INSERT INTO bitacora (periodo, local_id, cuando, quien, que) VALUES (?, ?, ?, ?, ?)'
	).bind(periodo, localId, ahora, quien || '', 'Se cerró la quincena ' + q + ' por ₡' + total.toLocaleString('es-CR') + '.'));

	await db.batch(ops);
	return { total: total, cerradoEn: ahora };
}

export async function reabrirQuincena(db, periodo, localId, q, quien) {
	var ahora = new Date().toISOString();
	await db.batch([
		db.prepare('UPDATE cierres SET cerrado_en = NULL, reabierta = 1 WHERE periodo = ? AND local_id = ? AND q = ?')
			.bind(periodo, localId, q),
		db.prepare('DELETE FROM pagos WHERE periodo = ? AND local_id = ? AND q = ?').bind(periodo, localId, q),
		db.prepare('INSERT INTO bitacora (periodo, local_id, cuando, quien, que) VALUES (?, ?, ?, ?, ?)')
			.bind(periodo, localId, ahora, quien || '', 'Se reabrió la quincena ' + q + ' para corregir.')
	]);
}
