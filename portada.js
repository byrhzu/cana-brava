/* ============================================================
   CAÑA BRAVA — portada
   Las categorías y las dos sucursales están escritas en el HTML,
   no se generan aquí: así Google las lee sin ejecutar JavaScript.
   ============================================================ */
(function () {
	'use strict';
	var q = function (s, c) { return (c || document).querySelector(s); };
	var qa = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

	/* ---------- 1. Órbita de categorías ---------- */
	var etiquetas = qa('.orb-etiqueta');
	var chips = qa('#tira button');
	var foto = q('#orb-img');
	var nombre = q('#orb-nombre');
	var cuenta = q('#orb-n');
	var precio = q('#orb-precio');
	var ver = q('#orb-ver');
	var anillo = q('#anillo');
	var activa = etiquetas.findIndex(function (b) { return b.getAttribute('aria-selected') === 'true'; });
	if (activa < 0) activa = 0;

	function elegir(i) {
		if (i === activa || !etiquetas[i]) return;
		activa = i;
		var d = etiquetas[i].dataset;
		foto.classList.add('saliendo');
		setTimeout(function () {
			foto.src = 'assets/img/' + d.img;
			foto.alt = d.alt;
			foto.classList.remove('saliendo');
		}, 200);
		nombre.textContent = d.nombre;
		cuenta.textContent = d.platos + (window.__lang === 'en' ? ' dishes' : ' platos');
		precio.textContent = d.precio;
		ver.href = 'menu.html#' + d.ancla;
		etiquetas.forEach(function (b, k) { b.setAttribute('aria-selected', k === i); });
		chips.forEach(function (b, k) {
			b.setAttribute('aria-selected', k === i);
			if (k === i && b.scrollIntoView) b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
		});
	}

	/* reparte las etiquetas sobre el arco superior */
	function colocar() {
		if (!anillo || !etiquetas.length) return;
		var caja = anillo.getBoundingClientRect();
		if (!caja.width) return;
		var R = caja.width / 2 - 6;
		var n = etiquetas.length, abanico = 212, paso = abanico / (n - 1), inicio = -abanico / 2;
		etiquetas.forEach(function (b, i) {
			var grados = inicio + paso * i;
			var rad = grados * Math.PI / 180;
			var x = Math.sin(rad) * R, y = -Math.cos(rad) * R;
			b.style.transform = 'translate(' + (x - b.offsetWidth / 2) + 'px,' + (y - b.offsetHeight / 2) + 'px) rotate(' + grados + 'deg)';
		});
	}

	etiquetas.forEach(function (b, i) {
		b.addEventListener('click', function () { elegir(i); });
		b.addEventListener('mouseenter', function () { elegir(i); });
	});
	chips.forEach(function (b, i) { b.addEventListener('click', function () { elegir(i); }); });

	if (anillo) {
		anillo.addEventListener('keydown', function (e) {
			if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); elegir((activa + 1) % etiquetas.length); etiquetas[activa].focus(); }
			if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); elegir((activa - 1 + etiquetas.length) % etiquetas.length); etiquetas[activa].focus(); }
		});
	}
	window.addEventListener('resize', colocar);
	window.addEventListener('load', colocar);
	colocar();
	setTimeout(colocar, 350);
	if (document.fonts && document.fonts.ready) document.fonts.ready.then(colocar);

	/* ---------- 2. Sucursales ---------- */
	/* Los dos paneles existen en el HTML; aquí solo se muestra uno. */
	var pestanas = qa('.linea button');
	var paneles = qa('.sede-panel');
	pestanas.forEach(function (b, i) {
		b.addEventListener('click', function () {
			pestanas.forEach(function (o, k) { o.setAttribute('aria-selected', k === i); });
			paneles.forEach(function (p, k) { p.hidden = (k !== i); });
		});
	});

	/* ---------- 3. Abierto / cerrado ---------- */
	function horario() {
		var caja = q('#estado'), txt = q('#estado-txt');
		if (!caja || !txt) return;
		var d = new Date(), min = d.getHours() * 60 + d.getMinutes();
		var abierto = min >= 720 && min <= 1290;   /* 12:00 a 21:30 */
		var en = window.__lang === 'en';
		caja.classList.toggle('cerrado', !abierto);
		txt.textContent = abierto
			? (en ? 'Open · closes 9:30 PM' : 'Abierto · cerramos 9:30')
			: (en ? 'Closed · opens at noon' : 'Cerrado · abrimos a mediodía');
	}
	horario();
	setInterval(horario, 60000);

	/* ---------- 4. Menú móvil ---------- */
	var ham = q('#hamburguesa');
	if (ham) {
		ham.addEventListener('click', function () {
			var abierto = document.body.classList.toggle('abierto');
			ham.setAttribute('aria-expanded', abierto);
			ham.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
		});
		qa('.barra nav a').forEach(function (a) {
			a.addEventListener('click', function () {
				document.body.classList.remove('abierto');
				ham.setAttribute('aria-expanded', 'false');
			});
		});
	}

	/* ---------- 5. Modales (elegir local) ---------- */
	function modal(id) {
		var m = q('#' + id);
		if (!m) return null;
		var ultimoFoco = null;
		function abrir() {
			ultimoFoco = document.activeElement;
			m.classList.add('abierto');
			m.setAttribute('aria-hidden', 'false');
			var f = m.querySelector('a, button');
			if (f) f.focus();
		}
		function cerrar() {
			m.classList.remove('abierto');
			m.setAttribute('aria-hidden', 'true');
			if (ultimoFoco) ultimoFoco.focus();
		}
		qa('.modal-cerrar', m).forEach(function (b) { b.addEventListener('click', cerrar); });
		m.addEventListener('click', function (e) { if (e.target === m) cerrar(); });
		document.addEventListener('keydown', function (e) {
			if (e.key === 'Escape' && m.classList.contains('abierto')) cerrar();
		});
		return { abrir: abrir, cerrar: cerrar };
	}
	var mPedir = modal('modal-pedir');
	var mWa = modal('modal-whatsapp');
	qa('[data-abre="pedir"]').forEach(function (b) {
		b.addEventListener('click', function (e) { e.preventDefault(); if (mPedir) mPedir.abrir(); });
	});
	qa('[data-abre="whatsapp"]').forEach(function (b) {
		b.addEventListener('click', function (e) { e.preventDefault(); if (mWa) mWa.abrir(); });
	});
	if (location.hash === '#pedir' && mPedir) setTimeout(mPedir.abrir, 400);

	/* ---------- 6. Visor de fotos ---------- */
	var visor = q('#visor');
	if (visor) {
		var vImg = q('#visor-img'), vPie = q('#visor-pie');
		var botones = qa('.galeria-grid button');
		var actual = 0, antesDelVisor = null;
		function mostrar(i) {
			actual = (i + botones.length) % botones.length;
			var im = botones[actual].querySelector('img');
			vImg.src = im.src;
			vImg.alt = im.alt;
			vPie.textContent = im.alt;
		}
		function abrirVisor(i) {
			antesDelVisor = document.activeElement;
			mostrar(i);
			visor.classList.add('abierto');
			visor.setAttribute('aria-hidden', 'false');
			q('.visor-cerrar', visor).focus();
		}
		function cerrarVisor() {
			visor.classList.remove('abierto');
			visor.setAttribute('aria-hidden', 'true');
			if (antesDelVisor) antesDelVisor.focus();
		}
		botones.forEach(function (b, i) { b.addEventListener('click', function () { abrirVisor(i); }); });
		q('.visor-cerrar', visor).addEventListener('click', cerrarVisor);
		q('.visor-ant', visor).addEventListener('click', function () { mostrar(actual - 1); });
		q('.visor-sig', visor).addEventListener('click', function () { mostrar(actual + 1); });
		visor.addEventListener('click', function (e) { if (e.target === visor) cerrarVisor(); });
		document.addEventListener('keydown', function (e) {
			if (!visor.classList.contains('abierto')) return;
			if (e.key === 'Escape') cerrarVisor();
			if (e.key === 'ArrowRight') mostrar(actual + 1);
			if (e.key === 'ArrowLeft') mostrar(actual - 1);
		});
	}

	/* ---------- 7. Español / English ---------- */
	/* Los nombres de los platos y el mensaje de WhatsApp quedan en
	   español a propósito: los lee el personal del restaurante. */
	var boton = q('#idioma');
	window.__lang = 'es';
	function aplicar(lang) {
		window.__lang = lang;
		document.documentElement.lang = lang;
		qa('[data-en]').forEach(function (el) {
			if (!el.dataset.es) el.dataset.es = el.textContent;
			el.textContent = lang === 'en' ? el.dataset.en : el.dataset.es;
		});
		if (boton) {
			boton.textContent = lang === 'en' ? 'ES' : 'EN';
			boton.setAttribute('aria-label', lang === 'en' ? 'Cambiar a español' : 'Change to English');
		}
		var d = etiquetas[activa] && etiquetas[activa].dataset;
		if (d && cuenta) cuenta.textContent = d.platos + (lang === 'en' ? ' dishes' : ' platos');
		horario();
		try { localStorage.setItem('cb_lang', lang); } catch (e) {}
	}
	if (boton) {
		boton.addEventListener('click', function () { aplicar(window.__lang === 'en' ? 'es' : 'en'); });
		var guardado = null;
		try { guardado = localStorage.getItem('cb_lang'); } catch (e) {}
		if (guardado === 'en') aplicar('en');
	}
})();
