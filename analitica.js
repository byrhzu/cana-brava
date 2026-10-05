/* ============================================================
   CAÑA BRAVA — Google Analytics 4

   PARA ACTIVARLO: pegá aquí abajo el ID de medición y listo.
   Es lo único que hay que tocar en todo el archivo.

   Dónde se consigue:
   analytics.google.com → Administrar (engranaje abajo a la izquierda)
   → Flujos de datos → Web → el ID aparece arriba a la derecha.
   Tiene la forma G-XXXXXXXXXX.
   ============================================================ */

var ID_MEDICION = 'G-XXXXXXXXXX';

(function () {
	'use strict';

	/* Mientras no haya ID real, no carga nada. Así el sitio no queda
	   pidiendo un script que no existe. */
	if (!ID_MEDICION || ID_MEDICION.indexOf('XXXX') !== -1) return;

	var s = document.createElement('script');
	s.async = true;
	s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID_MEDICION;
	document.head.appendChild(s);

	window.dataLayer = window.dataLayer || [];
	function gtag() { window.dataLayer.push(arguments); }
	window.gtag = gtag;
	gtag('js', new Date());
	gtag('config', ID_MEDICION);

	/* ---------- Qué se mide ----------
	   Un solo escuchador para toda la página: funciona también con los
	   botones que el menú crea después de cargar (los 123 "＋"). */

	function enviar(evento, datos) {
		gtag('event', evento, datos || {});
	}

	function localDesdeWhatsapp(href) {
		if (href.indexOf('50663018863') !== -1) return 'Guácimo';
		if (href.indexOf('50663528533') !== -1) return 'Guápiles';
		return 'sin identificar';
	}

	document.addEventListener('click', function (e) {
		var el = e.target.closest ? e.target.closest('a, button') : null;
		if (!el) return;
		var href = el.getAttribute('href') || '';

		/* Pedido armado en el carrito. Se engancha por el id y no por el
		   enlace, porque el enlace se escribe recién al llegar al último
		   paso. Vale mucho más que un clic suelto a WhatsApp. */
		if (el.id.indexOf('cart-wa-') === 0) {
			enviar('enviar_pedido', { local: el.id.indexOf('guacimo') !== -1 ? 'Guácimo' : 'Guápiles' });
			return;
		}

		/* WhatsApp suelto */
		if (href.indexOf('wa.me/') !== -1) {
			enviar('pedir_whatsapp', { local: localDesdeWhatsapp(href) });
			return;
		}

		/* PedidosYa */
		if (href.indexOf('pedidosya') !== -1) {
			enviar('pedir_pedidosya');
			return;
		}

		/* Llamar */
		if (href.indexOf('tel:') === 0) {
			enviar('llamar', { numero: href.replace('tel:', '') });
			return;
		}

		/* Cómo llegar */
		if (href.indexOf('waze.com') !== -1) { enviar('como_llegar', { app: 'Waze' }); return; }
		if (href.indexOf('maps.app.goo.gl') !== -1) { enviar('como_llegar', { app: 'Google Maps' }); return; }

		/* Ir al menú, y desde qué tarjeta */
		if (href.indexOf('menu.html') !== -1) {
			var tarjeta = el.classList.contains('showcase-card');
			enviar('ver_menu', {
				desde: tarjeta ? 'tarjeta de especialidad' : 'navegación',
				categoria: href.indexOf('#') !== -1 ? href.split('#')[1] : 'sin categoría'
			});
			return;
		}

		/* Categoría tocada dentro del menú */
		if (el.closest('.menu-nav')) {
			enviar('categoria_menu', { categoria: el.textContent.trim() });
			return;
		}

		/* Agregar un plato al pedido */
		if (el.classList.contains('add-btn')) {
			var fila = el.closest('.menu-item');
			var nombre = fila ? fila.querySelector('.menu-item-name') : null;
			enviar('agregar_plato', { plato: nombre ? nombre.textContent.trim() : 'sin nombre' });
			return;
		}

		/* Abrir el carrito */
		if (el.classList.contains('cart-fab')) { enviar('abrir_pedido'); return; }

		/* Cambio de idioma */
		if (el.id === 'lang-toggle' || el.id === 'idioma') {
			enviar('cambiar_idioma', { a: document.documentElement.lang === 'en' ? 'es' : 'en' });
			return;
		}

		/* Abrir una foto de la galería */
		if (el.classList.contains('galeria-item')) { enviar('ver_foto'); return; }
	}, true);

})();
