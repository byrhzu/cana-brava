/* ============================================================
   API DE LA PLANILLA — Cloudflare Worker

   Vive en canabravacr.com/api/*, el mismo dominio que el panel, así
   que el navegador manda sola la galleta de Access en cada llamada.

   Nada entra sin un token de Access válido, ni siquiera un GET: lo
   que hay del otro lado son salarios y cédulas.
   ============================================================ */

import { revisar } from './acceso.js';
import * as datos from './datos.js';
import { ESQUEMA } from './esquema.js';

var VERSION = 'd4';

function json(cuerpo, estado) {
	return new Response(JSON.stringify(cuerpo), {
		status: estado || 200,
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'cache-control': 'no-store'
		}
	});
}

export default {
	async fetch(req, env) {
		var url = new URL(req.url);
		var ruta = url.pathname.replace(/^\/api\/?/, '');

		if (req.method === 'OPTIONS') return new Response(null, { status: 204 });

		var r;
		try {
			r = await revisar(req, env);
		} catch (e) {
			return json({ error: 'No se pudo verificar la sesión', detalle: String(e && e.message || e) }, 503);
		}
		var quien = r && r.correo;
		if (!quien) return json({ error: 'Sesión inválida', version: VERSION, por: r }, 401);

		/* Pulso: sirve para comprobar que el Worker esta publicado y que
		   la sesion de Access llega bien, aunque la base no este todavia. */
		if (url.pathname.replace(/\/+$/, '') === '/api/yo') {
			return json({ correo: quien, base: !!env.DB });
		}

		if (!env.DB) return json({ error: 'La base no está conectada al Worker' }, 503);

		try {
			return await atender(req, env, ruta, url, quien);
		} catch (e) {
			return json({ error: String(e && e.message || e) }, 500);
		}
	}
};

async function atender(req, env, ruta, url, quien) {
	var db = env.DB;
	var cuerpo = null;
	if (req.method === 'POST' || req.method === 'PUT') {
		try { cuerpo = await req.json(); } catch (e) { return json({ error: 'Cuerpo inválido' }, 400); }
	}

	/* ---------- crear las tablas ----------
	   La consola de D1 del panel de Cloudflare se niega a leer el
	   archivo, así que el esquema se aplica desde acá. Se puede llamar
	   las veces que haga falta: todo es CREATE IF NOT EXISTS e
	   INSERT OR IGNORE. */
	if (ruta === 'instalar') {
		var hechas = [];
		for (var i = 0; i < ESQUEMA.length; i++) {
			await db.prepare(ESQUEMA[i]).run();
			hechas.push(ESQUEMA[i].split('\n')[0].slice(0, 60));
		}
		var t = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
		var l = await db.prepare('SELECT * FROM locales ORDER BY grupo, sede').all();
		return json({ ok: true, ejecutadas: hechas.length, tablas: t.results.map(function (x) { return x.name; }), locales: l.results });
	}

	/* ---------- quién soy ---------- */
	if (ruta === 'yo') return json({ correo: quien });

	/* ---------- arranque del panel ---------- */
	if (ruta === 'estado' && req.method === 'GET') {
		var todo = await datos.cargarTodo(db);
		todo.correo = quien;
		return json(todo);
	}

	/* ---------- un mes ---------- */
	if (ruta === 'periodo' && req.method === 'GET') {
		var p = url.searchParams.get('p') || '';
		if (!/^\d{4}-\d{2}$/.test(p)) return json({ error: 'Período inválido' }, 400);
		return json(await datos.cargarPeriodo(db, p));
	}

	/* ---------- locales ---------- */
	if (ruta === 'local' && req.method === 'PUT') {
		if (!cuerpo || !cuerpo.id || !cuerpo.grupo) return json({ error: 'Falta el restaurante' }, 400);
		await datos.guardarLocal(db, cuerpo);
		return json({ ok: true });
	}

	/* ---------- empleados ---------- */
	if (ruta === 'empleado' && req.method === 'PUT') {
		if (!cuerpo || !cuerpo.id || !cuerpo.nombre) return json({ error: 'Falta el nombre' }, 400);
		if (cuerpo.activo === false && !cuerpo.fechaSalida) {
			return json({ error: 'Un empleado inactivo necesita su último día' }, 400);
		}
		await datos.guardarEmpleado(db, cuerpo);
		return json({ ok: true });
	}
	if (ruta.indexOf('empleado/') === 0 && req.method === 'DELETE') {
		await datos.borrarEmpleado(db, decodeURIComponent(ruta.slice('empleado/'.length)));
		return json({ ok: true });
	}

	/* ---------- ausencias ---------- */
	if (ruta === 'ausencia' && req.method === 'PUT') {
		if (!cuerpo || !cuerpo.empleadoId || !cuerpo.ausencia) return json({ error: 'Falta la ausencia' }, 400);
		await datos.guardarAusencia(db, cuerpo.empleadoId, cuerpo.ausencia);
		return json({ ok: true });
	}
	if (ruta.indexOf('ausencia/') === 0 && req.method === 'DELETE') {
		await datos.borrarAusencia(db, decodeURIComponent(ruta.slice('ausencia/'.length)));
		return json({ ok: true });
	}

	/* ---------- horas extra y adelantos ---------- */
	if (ruta === 'ajuste' && req.method === 'PUT') {
		if (!cuerpo || !cuerpo.periodo || !cuerpo.localId || !cuerpo.empleadoId) {
			return json({ error: 'Falta a quién y de cuándo' }, 400);
		}
		await datos.guardarAjuste(db, cuerpo);
		/* Si la quincena ya se había cerrado, el cambio deja rastro con
		   el correo de quien lo hizo. */
		if (cuerpo.anotar) await datos.anotar(db, cuerpo.periodo, cuerpo.localId, quien, cuerpo.anotar);
		return json({ ok: true });
	}

	/* ---------- cerrar y reabrir ---------- */
	if (ruta === 'cerrar' && req.method === 'POST') {
		if (!cuerpo || !cuerpo.periodo || !cuerpo.localId || !cuerpo.q || !Array.isArray(cuerpo.pagos)) {
			return json({ error: 'Falta qué cerrar' }, 400);
		}
		var r = await datos.cerrarQuincena(db, cuerpo.periodo, cuerpo.localId, Number(cuerpo.q), cuerpo.pagos, quien);
		return json(Object.assign({ ok: true }, r));
	}
	if (ruta === 'reabrir' && req.method === 'POST') {
		if (!cuerpo || !cuerpo.periodo || !cuerpo.localId || !cuerpo.q) return json({ error: 'Falta qué reabrir' }, 400);
		await datos.reabrirQuincena(db, cuerpo.periodo, cuerpo.localId, Number(cuerpo.q), quien);
		return json({ ok: true });
	}

	/* ---------- tasas ---------- */
	if (ruta === 'tasas' && req.method === 'PUT') {
		if (!cuerpo || typeof cuerpo !== 'object') return json({ error: 'Faltan los valores' }, 400);
		await datos.guardarTasas(db, cuerpo);
		return json({ ok: true });
	}

	return json({ error: 'No existe esa ruta' }, 404);
}
