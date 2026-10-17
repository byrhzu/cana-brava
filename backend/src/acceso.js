/* ============================================================
   QUIÉN ESTÁ LLAMANDO

   Cloudflare Access pone un token firmado en cada petición que deja
   pasar. Acá se verifica la firma contra los certificados del equipo
   en vez de confiar en la cabecera a ojo: un Worker puede llegar a
   correr antes que Access en la cadena, y una cabecera sin verificar
   la escribe cualquiera.
   ============================================================ */

var cache = { cuando: 0, llaves: null };

async function llavesDelEquipo(equipo) {
	var ahora = Date.now();
	/* Las llaves rotan de vez en cuando; una hora de caché es de sobra
	   y evita una llamada por cada petición. */
	if (cache.llaves && ahora - cache.cuando < 3600000) return cache.llaves;
	var r = await fetch('https://' + equipo + '/cdn-cgi/access/certs');
	if (!r.ok) throw new Error('No se pudieron leer los certificados de Access');
	var j = await r.json();
	cache = { cuando: ahora, llaves: j.keys || [] };
	return cache.llaves;
}

function bytesDeBase64url(s) {
	s = s.replace(/-/g, '+').replace(/_/g, '/');
	s += '='.repeat((4 - (s.length % 4)) % 4);
	var bin = atob(s);
	var out = new Uint8Array(bin.length);
	for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
	return out;
}

function textoDeBase64url(s) {
	return new TextDecoder().decode(bytesDeBase64url(s));
}

/* Devuelve el correo de quien entró, o null si el token no sirve. */
function galletas(req) {
	var out = {};
	(req.headers.get('cookie') || '').split(';').forEach(function (p) {
		var i = p.indexOf('=');
		if (i > 0) out[p.slice(0, i).trim()] = p.slice(i + 1).trim();
	});
	return out;
}
function galleta(req, nombre) { return galletas(req)[nombre] || null; }

export async function revisar(req, env) {
	/* Access pone la cabecera solo en las rutas que cubre una de sus
	   aplicaciones. La galleta, en cambio, viaja a todo el dominio, así
	   que sirve igual y evita tener que crear una aplicación aparte
	   para /api. Es el mismo token firmado por el mismo equipo. */
	var token = req.headers.get('Cf-Access-Jwt-Assertion') || galleta(req, 'CF_Authorization');
	if (!token) return { correo: null, motivo: 'no llego ni cabecera ni galleta' };

	var partes = token.split('.');
	if (partes.length !== 3) return { correo: null, motivo: 'el token no tiene tres partes' };

	var cabecera, cuerpo;
	try {
		cabecera = JSON.parse(textoDeBase64url(partes[0]));
		cuerpo = JSON.parse(textoDeBase64url(partes[1]));
	} catch (e) { return { correo: null, motivo: 'no se pudo leer el token' }; }

	/* Para qué aplicación se emitió. Sin esto, un token de cualquier
	   otra aplicación del mismo equipo entraría igual. */
	var permitidas = String(env.ACCESS_AUD || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean);
	var aud = Array.isArray(cuerpo.aud) ? cuerpo.aud : [cuerpo.aud];
	if (permitidas.length && !aud.some(function (a) { return permitidas.indexOf(a) !== -1; })) {
		return { correo: null, motivo: 'el token es de otra aplicacion' };
	}

	if (cuerpo.iss !== 'https://' + env.ACCESS_TEAM) {
		return { correo: null, motivo: 'otro equipo' };
	}

	var ahora = Math.floor(Date.now() / 1000);
	if (!cuerpo.exp || cuerpo.exp < ahora) return { correo: null, motivo: 'token vencido' };
	if (cuerpo.nbf && cuerpo.nbf > ahora + 60) return { correo: null, motivo: 'token del futuro' };

	var llaves = await llavesDelEquipo(env.ACCESS_TEAM);
	var jwk = llaves.find(function (k) { return k.kid === cabecera.kid; });
	if (!jwk) return { correo: null, motivo: 'no esta la llave que firmo' };

	var llave = await crypto.subtle.importKey(
		'jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']
	);
	var firmado = new TextEncoder().encode(partes[0] + '.' + partes[1]);
	var bien = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', llave, bytesDeBase64url(partes[2]), firmado);
	if (!bien) return { correo: null, motivo: 'la firma no cuadra' };

	return { correo: cuerpo.email || cuerpo.common_name || null, motivo: 'ok' };
}

/* Compatibilidad: devuelve solo el correo. */
export async function quienEntra(req, env) {
	var r = await revisar(req, env);
	return r && r.correo;
}
