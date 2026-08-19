/* ============================================================
   CAÑA BRAVA — Interactive Script
   ============================================================ */

(function() {
	'use strict';

	/* Configuration */
	const config = {
		navStickyThreshold: 50,
		countUpDuration: 2000,
		scrollSmoothness: 0.1,
	};

	/* State */
	const state = {
		scrollProgress: 0,
		isScrolling: false,
		isScrollingTimeout: null,
	};

	/* ============================================================
	   INITIALIZATION
	   ============================================================ */

	function init() {
		hideSplash();
		setupNavigation();
		setupCounter();
		setupFormValidation();
		setupScrollEffects();
		setupSmoothScroll();
		setupModal('reserva');
		setupModal('pedir');
		setupModal('whatsapp');
		setupMobileNav();
	}

	/* ============================================================
	   MENÚ MÓVIL (hamburguesa)
	   ============================================================ */

	function setupMobileNav() {
		var toggle = document.getElementById('nav-toggle');
		var backdrop = document.getElementById('nav-backdrop');
		var menu = document.getElementById('nav-menu');
		if (!toggle || !menu) return;

		function openMenu() {
			document.body.classList.add('menu-open');
			toggle.setAttribute('aria-expanded', 'true');
		}
		function closeMenu() {
			document.body.classList.remove('menu-open');
			toggle.setAttribute('aria-expanded', 'false');
		}
		function toggleMenu() {
			if (document.body.classList.contains('menu-open')) closeMenu();
			else openMenu();
		}

		toggle.addEventListener('click', toggleMenu);
		if (backdrop) backdrop.addEventListener('click', closeMenu);

		/* Cerrar al pulsar un enlace del menú */
		menu.querySelectorAll('a').forEach(function (link) {
			link.addEventListener('click', closeMenu);
		});

		/* Cerrar con Escape */
		document.addEventListener('keydown', function (e) {
			if (e.key === 'Escape') closeMenu();
		});
	}

	/* ============================================================
	   VENTANAS EMERGENTES (reservas / pedidos)
	   ============================================================ */

	function setupModal(name) {
		var modal = document.getElementById(name + '-modal');
		if (!modal) return;

		var openers = document.querySelectorAll('[data-open-' + name + ']');
		var closeBtn = document.getElementById(name + '-close');

		function open(e) {
			if (e) e.preventDefault();
			modal.classList.add('open');
			modal.setAttribute('aria-hidden', 'false');
			document.body.style.overflow = 'hidden';
		}

		function close() {
			modal.classList.remove('open');
			modal.setAttribute('aria-hidden', 'true');
			document.body.style.overflow = '';
		}

		openers.forEach(function (btn) { btn.addEventListener('click', open); });
		if (closeBtn) closeBtn.addEventListener('click', close);

		/* Cerrar al hacer clic fuera de la caja */
		modal.addEventListener('click', function (e) {
			if (e.target === modal) close();
		});

		/* Cerrar con la tecla Escape */
		document.addEventListener('keydown', function (e) {
			if (e.key === 'Escape' && modal.classList.contains('open')) close();
		});

		/* Exponer para cerrar desde fuera */
		if (name === 'reserva') window.__closeReserva = close;

		/* Abrir automáticamente si la URL trae el ancla (#pedir / #reserva) */
		if (window.location.hash === '#' + name) open();
	}

	/* Hide splash loader after delay */
	function hideSplash() {
		const splash = document.querySelector('.splash-loader');
		if (splash) {
			setTimeout(() => {
				splash.style.pointerEvents = 'none';
			}, 2400);
		}
	}

	/* ============================================================
	   NAVIGATION
	   ============================================================ */

	function setupNavigation() {
		const nav = document.querySelector('.nav-main');
		if (!nav) return;

		window.addEventListener('scroll', () => {
			if (window.scrollY > config.navStickyThreshold) {
				nav.classList.add('scrolled');
			} else {
				nav.classList.remove('scrolled');
			}
		});

		/* Smooth scroll on nav links */
		const navLinks = nav.querySelectorAll('a[href^="#"]');
		navLinks.forEach(link => {
			link.addEventListener('click', (e) => {
				const href = link.getAttribute('href');
				if (href === '#') return;

				e.preventDefault();
				const target = document.querySelector(href);
				if (target) {
					const offset = 80;
					const elementPosition = target.offsetTop - offset;
					window.scrollTo({
						top: elementPosition,
						behavior: 'smooth',
					});
				}
			});
		});
	}

	/* ============================================================
	   COUNTER ANIMATION
	   ============================================================ */

	function setupCounter() {
		const counters = document.querySelectorAll('[data-count-to]');
		if (!counters.length) return;

		const observerOptions = {
			threshold: 0.5,
		};

		const counterObserver = new IntersectionObserver((entries) => {
			entries.forEach(entry => {
				if (entry.isIntersecting && !entry.target.dataset.counted) {
					animateCounter(entry.target);
					entry.target.dataset.counted = 'true';
				}
			});
		}, observerOptions);

		counters.forEach(counter => counterObserver.observe(counter));
	}

	function animateCounter(element) {
		const target = parseFloat(element.dataset.countTo);
		const isDecimal = !Number.isInteger(target);
		const duration = config.countUpDuration;
		const startTime = Date.now();

		const update = () => {
			const elapsed = Date.now() - startTime;
			const progress = Math.min(elapsed / duration, 1);
			const easeOutQuad = 1 - (1 - progress) * (1 - progress);
			const current = target * easeOutQuad;

			element.textContent = isDecimal
				? current.toFixed(1)
				: Math.round(current).toString();

			if (progress < 1) {
				requestAnimationFrame(update);
			} else {
				element.textContent = isDecimal ? target.toFixed(1) : target.toString();
			}
		};

		update();
	}

	/* ============================================================
	   FORM VALIDATION & SUBMISSION
	   ============================================================ */

	function setupFormValidation() {
		const form = document.getElementById('reserva-form');
		if (!form) return;

		form.addEventListener('submit', (e) => {
			e.preventDefault();

			/* Collect form data */
			const formData = new FormData(form);
			const data = Object.fromEntries(formData);

			/* Validate */
			if (!validateForm(data)) {
				alert('Por favor completa todos los campos requeridos.');
				return;
			}

			/* Create message */
			const message = crearMensajeReserva(data);

			/* Send via WhatsApp */
			const telefono = data.ubicacion === 'guacimo' ? '50663018863' : '50663528533';
			const whatsappUrl = `https://wa.me/${telefono}?text=${encodeURIComponent(message)}`;

			window.open(whatsappUrl, '_blank');

			/* Reset form y cerrar modal */
			form.reset();
			if (window.__closeReserva) window.__closeReserva();
		});
	}

	function validateForm(data) {
		return (
			data.nombre &&
			data.telefono &&
			data.fecha &&
			data.hora &&
			data.personas &&
			data.ubicacion
		);
	}

	function crearMensajeReserva(data) {
		return `
Hola, quisiera hacer una reserva en Caña Brava.

📋 Datos:
Nombre: ${data.nombre}
Teléfono: ${data.telefono}
Ubicación: ${data.ubicacion === 'guacimo' ? 'Guácimo' : 'Guápiles'}
Fecha: ${data.fecha}
Hora: ${data.hora}
Número de personas: ${data.personas}
${data.notas ? `\nNotas: ${data.notas}` : ''}

Gracias.
		`.trim();
	}

	/* ============================================================
	   SCROLL EFFECTS
	   ============================================================ */

	function setupScrollEffects() {
		window.addEventListener('scroll', updateScrollProgress);
	}

	function updateScrollProgress() {
		const docHeight = document.documentElement.scrollHeight - window.innerHeight;
		state.scrollProgress = window.scrollY / docHeight;

		/* Add smooth parallax to showcase cards */
		const cards = document.querySelectorAll('.showcase-card');
		cards.forEach((card, index) => {
			const offset = (state.scrollProgress * 10) + (index % 2 ? -5 : 5);
			card.style.transform = `translateY(${offset}px)`;
		});
	}

	/* ============================================================
	   SMOOTH SCROLL
	   ============================================================ */

	function setupSmoothScroll() {
		/* Aparición suave de secciones al hacer scroll — con red de seguridad:
		   el contenido SIEMPRE termina visible aunque el observer no dispare. */
		const sections = Array.prototype.slice.call(document.querySelectorAll('section'));

		function reveal(el) {
			el.style.opacity = '1';
			el.style.transform = 'none';
		}

		/* El hero (primera sección) nunca se oculta: debe verse de inmediato. */
		const toAnimate = sections.filter(function (s) { return !s.classList.contains('hero'); });

		/* Sin soporte de IntersectionObserver → mostrar todo y salir. */
		if (!('IntersectionObserver' in window)) {
			sections.forEach(reveal);
			return;
		}

		const sectionObserver = new IntersectionObserver(function (entries, obs) {
			entries.forEach(function (entry) {
				if (entry.isIntersecting) {
					reveal(entry.target);
					obs.unobserve(entry.target);
				}
			});
		}, { threshold: 0.02, rootMargin: '0px 0px -5% 0px' });

		toAnimate.forEach(function (section) {
			section.style.opacity = '0';
			section.style.transform = 'translateY(20px)';
			section.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
			sectionObserver.observe(section);
		});

		/* Red de seguridad: pase lo que pase, todo visible al segundo. */
		setTimeout(function () { sections.forEach(reveal); }, 1000);
	}

	/* ============================================================
	   UTILITY: Count animation helper
	   ============================================================ */

	function animateValue(element, start, end, duration) {
		const startTime = Date.now();
		const update = () => {
			const elapsed = Date.now() - startTime;
			const progress = Math.min(elapsed / duration, 1);
			const value = Math.floor(start + (end - start) * progress);
			element.textContent = value;

			if (progress < 1) {
				requestAnimationFrame(update);
			}
		};
		update();
	}

	/* ============================================================
	   LAZY LOAD IMAGES
	   ============================================================ */

	function setupLazyLoad() {
		const images = document.querySelectorAll('img');
		if ('IntersectionObserver' in window) {
			const imageObserver = new IntersectionObserver((entries) => {
				entries.forEach(entry => {
					if (entry.isIntersecting) {
						const img = entry.target;
						if (img.dataset.src) {
							img.src = img.dataset.src;
							img.removeAttribute('data-src');
							imageObserver.unobserve(img);
						}
					}
				});
			});

			images.forEach(img => imageObserver.observe(img));
		}
	}

	/* ============================================================
	   KEYBOARD NAVIGATION
	   ============================================================ */

	function setupKeyboardNav() {
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') {
				/* Handle escape key if needed */
			}
		});
	}

	/* ============================================================
	   READY TO INIT
	   ============================================================ */

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}

	/* Export for debugging */
	window.__CANA_BRAVA__ = {
		state,
		config,
	};
})();
