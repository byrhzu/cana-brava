# DESIGN.md — Caña Brava

Especificación visual del sitio de Caña Brava (Guácimo y Guápiles, Limón, Costa Rica).

**Origen:** este documento no propone un diseño nuevo. Documenta el sistema que **ya existe** en `styles.css`, extraído de las 379 reglas del archivo, y fija las reglas para que los cambios futuros no lo desordenen.

**Estado:** el sitio está en producción en https://canabravacr.com y recibe pedidos reales por WhatsApp. Cualquier cambio se hace de forma incremental y verificable.

> **Aviso (5/10/2026):** el sitio se reorganizó en tres hojas de estilo:
> - `shell.css` — tokens de marca, enlace de salto, foco de teclado y **la barra superior**. Lo cargan las dos páginas; es el único sitio donde se toca la cabecera.
> - `portada.css` — solo la portada (órbita, sucursales, relato, galería, contacto).
> - `styles.css` — solo el menú (categorías, platos, armador de pedido).
>
> La paleta, la tipografía y los principios de este documento siguen vigentes.
> Los componentes de §4 describen el sistema anterior: **pendiente actualizarlos**.

---

## 1. Visual Theme & Atmosphere

**Filosofía:** parrilla de noche. Fondo casi negro con tinte verde, tipografía serif de carácter para los titulares, y la comida —fotografiada sobre pizarra negra y madera oscura, con bombillos cálidos de fondo— como único elemento que aporta color.

**Palabras clave del ambiente:** oscuro · cálido · sabroso · de barrio, no de cadena.

**Una frase:** *el local a las 8 de la noche, no un folleto de comida rápida.*

**Anclaje material:** la paleta sale de dos objetos reales del negocio — la carta impresa (amarillo sobre negro con hojas verdes tropicales) y el rótulo del local. El verde `#6FB04A` es el verde de marca; el fondo casi negro es el de la carta.

**Nivel de interacción: L2 (interacción fluida).** Reveal al hacer scroll, barra de navegación que cambia al bajar, galería con lightbox, indicador de horario en vivo. **Sin** WebGL, sin scroll-jacking, sin pin-scrub, sin cursor personalizado. Ver §7 para la justificación.

---

## 2. Color Palette & Roles

```css
:root {
	/* --- Fondos --- */
	--bg:          #0D0F0D;   --bg-rgb:        13, 15, 13;      /* negro con tinte verde: base */
	--bg-2:        #141714;   --bg-2-rgb:      20, 23, 20;      /* secciones alternas */
	--bg-3:        #1B1F1B;   --bg-3-rgb:      27, 31, 27;      /* tarjetas */
	--bg-4:        #232823;   --bg-4-rgb:      35, 40, 35;      /* hover de tarjeta / bordes */

	/* --- Texto --- */
	--cream:       #F1F2ED;   --cream-rgb:     241, 242, 237;   /* texto principal */
	--cream-2:     #C6C9C0;   --cream-2-rgb:   198, 201, 192;   /* texto secundario */
	--cream-3:     #868D82;   --cream-3-rgb:   134, 141, 130;   /* metadatos, etiquetas */

	/* --- Acento (marca) --- */
	--accent:      #6FB04A;   --accent-rgb:    111, 176, 74;    /* verde de marca */
	--accent-2:    #58913A;   --accent-2-rgb:  88, 145, 58;     /* hover */
	--accent-soft: rgba(var(--accent-rgb), .12);                /* fondos y anillos */
	--green:       #2E5B1E;   --green-rgb:     46, 91, 30;      /* verde hoja profundo */
	--green-2:     #1C3A12;   --green-2-rgb:   28, 58, 18;

	/* --- Estructura --- */
	--line:        rgba(var(--cream-rgb), .12);                 /* bordes de 1px */
	--line-2:      rgba(var(--cream-rgb), .28);                 /* bordes destacados */
	--ink:         var(--bg);                                   /* texto sobre verde */

	/* --- Estado --- */
	--abierto:     var(--accent);
	--cerrado:     #C0392B;   --cerrado-rgb:   192, 57, 43;

	/* --- Marcas de terceros (no son de la paleta; solo para sus botones) --- */
	--whatsapp:    #25D366;
	--pedidosya:   #EE2738;   --pedidosya-2:   #D41C2C;
	--facebook:    #1877F2;
	--tiktok:      #33CCFF;
}
```

**Reglas de uso**

| Rol | Token | Dónde |
|---|---|---|
| Fondo de página | `--bg` | `body`, hero, secciones principales |
| Fondo alterno | `--bg-2` / `--bg-3` | Secciones que necesitan separarse, tarjetas |
| Texto principal | `--cream` | Titulares, texto de lectura |
| Texto secundario | `--cream-2` | Subtítulos, descripciones |
| Metadatos | `--cream-3` | Etiquetas, notas, direcciones |
| Acción principal | `--accent` | Botón "Pedir", enlaces activos, precios destacados |
| Estado abierto | `--abierto` | Punto y borde del indicador de horario |
| Estado cerrado | `--cerrado` | Punto y borde del indicador de horario |

**El acento se usa poco y en sitios concretos**: el botón principal, el estado abierto, y el énfasis del titular. Si el verde aparece en todo, deja de ser acento.

**Contraste medido** (WCAG 2.1, texto normal):

| Par | Ratio | Nivel |
|---|---|---|
| `--cream` sobre `--bg` | 17.10:1 | AAA |
| `--cream-2` sobre `--bg` | 11.47:1 | AAA |
| `--cream-3` sobre `--bg` | 5.63:1 | AA |
| `--cream-3` sobre `--bg-3` | 4.88:1 | AA |
| `--accent` sobre `--bg` | 7.32:1 | AAA |
| `--bg` sobre `--accent` (botón principal) | 7.32:1 | AAA |
| `--ink` sobre `--accent-2` (botón en hover) | 5.06:1 | AA |

Dos casos por debajo de AA, ambos justificados y sin acción pendiente:

- **Logotipo blanco sobre `--pedidosya`** = 4.21:1. WCAG exime a los logotipos del requisito de contraste, y es el color oficial de esa marca; no se puede alterar.
- **Punto rojo de "cerrado" sobre `--bg`** = 3.54:1. Es un indicador gráfico, no texto: le aplica el mínimo de 3:1 para elementos no textuales, que cumple. El texto que lo acompaña va en `--cream` (17.10:1), así que el estado nunca depende solo del color.

`--cream-3` se queda en AA y no debe usarse por debajo de 0.85rem sobre `--bg-3`.

**Resuelto el 22/09/2026:** las 5 declaraciones con el terracota `rgba(197, 48, 30, …)` — acento anterior al cambio de marca a verde — ya no existen.

---

## 3. Typography Rules

```css
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400;1,9..144,600&family=Inter:wght@300;400;500;600&display=swap');

--fuente-titulo: 'Fraunces', Georgia, 'Times New Roman', serif;
--fuente-texto:  'Inter', -apple-system, 'Segoe UI', Roboto, sans-serif;
```

**Dos familias, sin excepción.** Fraunces carga la personalidad; Inter hace el trabajo de lectura.

| Nivel | Familia | Tamaño | Peso | Interlineado | Uso |
|---|---|---|---|---|---|
| Hero H1 | Fraunces | `clamp(2rem, 6vw, 4.5rem)` | 600 | 1.1 | Solo el titular del hero |
| H2 sección | Fraunces | `clamp(1.8rem, 4vw, 2.5rem)` | 600 | 1.15 | Título de cada sección |
| H3 tarjeta | Fraunces | `1.3rem` | 600 | 1.2 | Nombre de local, categoría |
| Subtítulo hero | Inter | `clamp(1rem, 2.4vw, 1.2rem)` | 400 | 1.8 | Bajada del hero |
| Texto normal | Inter | `1rem` | 400 | 1.7 | Párrafos |
| Texto de apoyo | Inter | `0.95rem` | 400 | 1.6 | Descripciones de plato |
| Etiqueta / meta | Inter | `0.85rem` | 500 | 1.5 | Direcciones, notas, estado |
| Micro | Inter | `0.78rem` | 500 | 1.4 | Servicios, pie |

**Cursiva:** reservada para **un solo elemento por pantalla**, y es el énfasis del titular del hero (`.hero-title em`, en `--accent`). No se usa cursiva para destacar palabras sueltas en ningún otro lugar.

**Negrita:** solo para jerarquía estructural (titulares, botones, precios). No para resaltar palabras dentro de un párrafo.

**Fuentes prohibidas:** Poppins, Montserrat, Roboto, Open Sans, Lato como tipografía de titular. No introducir una tercera familia sin aprobación explícita.

---

## 4. Component Stylings

### Botones

```css
.btn {
	display: inline-block;
	padding: 0.75rem 2rem;
	border-radius: var(--radio-boton);        /* 4px */
	font-family: var(--fuente-texto);
	font-size: 0.95rem;
	font-weight: 500;
	text-align: center;
	border: 1px solid transparent;
	cursor: pointer;
	transition: background 0.25s ease, transform 0.25s var(--curva-suave), box-shadow 0.25s ease;
}

.btn-primary          { background: var(--accent); color: var(--ink); border-color: var(--accent); font-weight: 600; }
.btn-primary:hover    { background: var(--accent-2); border-color: var(--accent-2); transform: translateY(-2px);
                        box-shadow: 0 12px 24px rgba(var(--accent-rgb), 0.25); }
.btn-primary:active   { transform: translateY(0); box-shadow: none; }
.btn-primary:focus-visible { outline: 2px solid var(--cream); outline-offset: 2px; }
.btn-primary:disabled { background: var(--bg-4); border-color: var(--bg-4); color: var(--cream-3);
                        cursor: not-allowed; transform: none; box-shadow: none; }

.btn-ghost            { background: transparent; color: var(--cream); border-color: var(--line); }
.btn-ghost:hover      { background: var(--accent-soft); border-color: var(--accent); }
.btn-ghost:active     { background: rgba(var(--accent-rgb), 0.2); }
.btn-ghost:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.btn-ghost:disabled   { color: var(--cream-3); border-color: var(--line); cursor: not-allowed; }
```

**Botones de marca de terceros** (WhatsApp, PedidosYa): conservan el color oficial de esa marca y el logotipo blanco. Misma altura y radio que `.btn` para que lean como un conjunto.

### Tarjetas

```css
.card {
	background: var(--bg-3);
	border: 1px solid var(--line);
	border-radius: var(--radio-tarjeta);       /* 10px */
	overflow: hidden;
	transition: transform 0.3s var(--curva-suave), border-color 0.3s ease, box-shadow 0.3s ease;
}
.card:hover         { transform: translateY(-4px); border-color: var(--bg-4);
                      box-shadow: 0 24px 48px rgba(0, 0, 0, 0.45); }
.card:focus-within  { border-color: var(--accent); }
.card a:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
```

### Navegación

```css
.nav-main            { position: fixed; inset: 0 0 auto; z-index: 100;
                       background: transparent; transition: background 0.3s ease, border-color 0.3s ease; }
.nav-main.scrolled   { background: rgba(var(--bg-rgb), 0.92); border-bottom: 1px solid var(--line); }
.nav-menu a          { color: var(--cream-2); transition: color 0.25s ease; }
.nav-menu a:hover    { color: var(--cream); }
.nav-menu a[aria-current="page"] { color: var(--accent); }
.nav-menu a:focus-visible { outline: 2px solid var(--accent); outline-offset: 4px; border-radius: 2px; }
```

### Enlaces

```css
a                  { color: inherit; text-decoration: none; }
.enlace            { color: var(--accent); border-bottom: 1px solid transparent; transition: border-color 0.2s ease; }
.enlace:hover      { border-bottom-color: var(--accent); }
.enlace:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
```

### Etiquetas y estado

```css
.chip-estado {
	display: inline-flex; align-items: center; gap: 0.45rem;
	padding: 0.34rem 0.75rem;
	border: 1px solid var(--line-2);
	border-radius: var(--radio-boton);
	background: rgba(var(--bg-rgb), 0.72);
	font-size: 0.84rem; font-weight: 500; color: var(--cream);
}
.chip-estado.is-open   { border-color: rgba(var(--accent-rgb), 0.55); }
.chip-estado.is-closed { border-color: rgba(var(--cerrado-rgb), 0.5); }
```

### Lista de precios (patrón de carta impresa)

Nombre a la izquierda, línea de puntos que estira, precio a la derecha en cifras tabulares. Es el patrón de una carta de restaurante y se prefiere sobre tarjetas para listar platos.

---

## 5. Layout Principles

```css
--ancho-max:      1200px;   /* contenedor estándar de sección */
--ancho-amplio:   1400px;   /* galería, franjas a sangre completa */
--ancho-lectura:  600px;    /* párrafos largos */
--respiro:        clamp(1.25rem, 5vw, 3rem);   /* padding lateral */
```

**Escala de espaciado** (múltiplos de 0.25rem, sin valores sueltos):

`0.25 · 0.5 · 0.75 · 1 · 1.5 · 2 · 3 · 4 · 6 rem`

**Ritmo vertical de sección:** `clamp(3rem, 8vw, 6rem)` arriba y abajo. No todas las secciones llevan el mismo padding: hero y galería respiran más; contacto y pie respiran menos.

**Alineación:** a la izquierda por defecto en contenido de lectura. El hero está centrado a propósito (decisión heredada y aprobada); centrar no es el valor por defecto en el resto del sitio.

**Rejilla:** flexbox y grid con `gap`. Nunca márgenes por elemento para separar hermanos.

**Contenido ancho** (tablas, mapas, carruseles): `overflow-x: auto` en su propio contenedor. El `body` nunca hace scroll horizontal.

---

## 6. Depth & Elevation

Sistema de tres niveles. La profundidad se construye con **borde de 1px + fondo**, no con sombras difusas.

```css
--sombra-1: 0 8px 24px rgba(0, 0, 0, 0.40);                    /* tarjeta elevada */
--sombra-2: 0 24px 48px rgba(0, 0, 0, 0.45);                   /* tarjeta en hover, modal */
--sombra-3: 0 12px 24px rgba(var(--accent-rgb), 0.25);         /* botón principal en hover */
--anillo:   0 0 0 3px var(--accent-soft);                      /* foco / selección */
```

Sobre fondo oscuro la sombra aporta poco. La separación real la dan `--line` y el escalón `--bg` → `--bg-3`.

```css
--radio-boton:  4px;    /* botones, chips, campos */
--radio-tarjeta: 10px;  /* tarjetas, mapas, fotos */
--radio-pill:  999px;   /* selector de idioma, servicios */
--radio-circulo: 50%;   /* puntos, avatares, iconos redondos */
```

Cuatro radios, cada uno con un propósito. No inventar valores intermedios.

---

## 7. Animation & Interaction

### Nivel: L2 — interacción fluida

**Dependencias: ninguna.** JavaScript propio, sin librerías. No se añaden GSAP, ScrollTrigger, Lenis ni Three.js.

### Base

```css
--curva-suave:  cubic-bezier(0.34, 1.56, 0.64, 1);   /* rebote leve: botones */
--curva-salida: cubic-bezier(0.16, 0.84, 0.44, 1);   /* entradas */
--rapido: 0.2s;  --normal: 0.3s;  --lento: 0.5s;
```

Se transicionan **propiedades concretas** (`transform`, `opacity`, `background`, `border-color`). Nunca `transition: all`.

### Entrada

- Splash con el logotipo, una sola vez por carga.
- Hero: `heroFadeIn` — opacidad + `translateY(20px)`, 0.8s, con 0.3s de retraso.
- El hero **nunca** se oculta a la espera del observador; y hay una red de seguridad de 1000 ms que revela todas las secciones si el `IntersectionObserver` no dispara.

### Scroll

- Reveal por sección: `opacity 0 → 1` + `translateY`, 0.6s, disparado por `IntersectionObserver` una sola vez.
- Barra de navegación: pasa a `.scrolled` (fondo + borde inferior) tras 50px.
- **Sin parallax.** Se retiró porque desalineaba las tarjetas de especialidades.

### Hover y foco

Todo elemento interactivo tiene los cinco estados: `default · hover · active · focus-visible · disabled`.

El foco de teclado es **obligatorio y visible**: `outline: 2px solid var(--accent); outline-offset: 2px`. Nunca `outline: none` sin sustituto.

### Efectos concretos

- Punto de estado: pulso de 2s (solo cuando está abierto).
- Lightbox de galería: apertura con opacidad, zoom táctil y arrastre.
- Carrusel de especialidades: `scroll-snap` horizontal con pista visible en móvil.

### Movimiento reducido

```css
@media (prefers-reduced-motion: reduce) {
	*, *::before, *::after {
		animation-duration: 0.01ms !important;
		animation-iteration-count: 1 !important;
		transition-duration: 0.01ms !important;
		scroll-behavior: auto !important;
	}
}
```

### Por qué L2 y no L3

Este sitio es una **herramienta de pedidos** para un restaurante de pueblo, no una pieza de portafolio. Sus visitantes llegan con hambre, desde un teléfono, muchas veces con datos móviles en la zona de Limón. Un fondo WebGL, un scroll secuestrado o un `pin-scrub` añadirían segundos de carga y batería a cambio de nada en el objetivo real: que alguien mande el pedido por WhatsApp. **El nivel se sube solo si el dueño lo pide explícitamente.**

---

## 8. Do's and Don'ts

### Do

1. **Definir todo color como variable CSS**, con su versión `-rgb` para poder usar `rgba()`.
2. **Mantener dos familias tipográficas**: Fraunces para titulares, Inter para todo lo demás.
3. **Dar los cinco estados** a cada elemento interactivo, incluido `:focus-visible`.
4. **Usar la escala de espaciado** (múltiplos de 0.25rem) y los cuatro radios definidos.
5. **Transicionar propiedades concretas**, nunca `all`.
6. **Verificar en 375px, 768px y escritorio** antes de dar por hecho un cambio.
7. **Escribir el texto en español de Costa Rica**, con la voz del dueño: "Pedí", "Elegí", "Contános".
8. **Usar fotos reales del negocio.** Hay 26 disponibles en `assets/img/`.
9. **Mantener el objetivo a la vista**: cada pantalla debe dejar a un clic el pedido por WhatsApp.

### Don't

1. **No poner palabras sueltas en cursiva o negrita** dentro de titulares o párrafos para "darles énfasis". La única cursiva del sitio es la del titular del hero.
2. **No introducir una tercera tipografía** sin aprobación explícita.
3. **No usar emojis como iconos.** Se retiraron a propósito de todo el sitio.
4. **No inventar cifras.** Nada de "4.8 ★ · 850 reseñas" sin una fuente real; los contadores animados sobre datos no verificados son una mentira con animación.
5. **No usar `transition: all`** ni `outline: none` sin sustituto visible.
6. **No añadir WebGL, GSAP, Lenis, scroll secuestrado, cursor personalizado ni `pin-scrub`.** Ver §7.
7. **No apilar radios distintos** ni sombras nuevas fuera del sistema de §6.
8. **No hacer rediseños completos.** Los cambios son incrementales, verificados y aprobados uno a uno.
9. **No dejar código de funciones eliminadas.** Reservas, asistente de IA y sección "Nuestra Propuesta" ya no existen; su CSS tampoco debería.
10. **No usar `rgba(197, 48, 30, …)`.** Es el acento terracota anterior a que la marca pasara a verde. Quedan 5 declaraciones; hay que sustituirlas.

---

## 9. Responsive Behavior

**Puntos de corte oficiales.** El archivo tiene hoy 9 anchos distintos (480, 500, 560, 600, 640, 720, 768, 860, 900); se consolidan en cuatro:

| Nombre | Ancho | Qué cambia |
|---|---|---|
| `movil` | ≤ 560px | Una columna; el hero apila lugar y estado; la barra deja logo, idioma, PedidosYa y menú |
| `tableta` | ≤ 860px | Aparece el menú hamburguesa; las tarjetas pasan a carrusel con `scroll-snap` |
| `escritorio` | ≤ 1200px | Rejillas de 2–3 columnas; contenedor al ancho máximo |
| `amplio` | > 1200px | Contenedor fijo en 1200px; galería hasta 1400px |

**Tipografía fluida:** los tamaños usan `clamp()` para crecer de forma continua. **Prohibido cortar un `clamp()` con un `font-size` fijo dentro de una media query** — produce un salto visible entre pantallas. (Ya ocurrió con `.hero-title` y `.hero-sub`; está corregido.)

**Objetivos táctiles:** mínimo 44×44px en todo lo que se toca. Barra inferior fija en móvil con "Ver Menú" y "Pedir Ahora".

**Sin desbordamiento horizontal** a 375px. Se verifica midiendo `document.documentElement.scrollWidth` contra `window.innerWidth`.

**Imágenes:** WebP, `loading="lazy"` salvo el hero, y nombre de archivo descriptivo (`cortes-parrilla-guapiles.webp`, no `IMG_2231.webp`).

---

## Deuda técnica — estado

Auditoría del 1 de septiembre de 2026, **resuelta el 22 de septiembre** en una pasada de pulido. Los colores no se tocaron: se verificó que fondo, texto, verde de marca y rojo de PedidosYa siguen dando exactamente los mismos valores computados.

| # | Hallazgo | Estado |
|---|---|---|
| 1 | Acento terracota abandonado (5 usos) | **Resuelto.** El único vivo (`.showcase-card:hover`, que teñía de rojizo el hover de las 7 tarjetas) ahora usa el verde de marca; los otros 4 desaparecieron con el código muerto |
| 2 | Cero reglas `:focus-visible` | **Resuelto.** 18 reglas; anillo verde general y crema sobre fondos de color. Verificado con tabulador real |
| 3 | 28 clases muertas (15% del CSS) | **Resuelto.** 47 reglas eliminadas |
| 4 | 9 puntos de corte distintos | **No aplicado a propósito.** Consolidarlos cambia el comportamiento en anchos intermedios; es un cambio de diseño, no de pulido. Sigue pendiente |
| 5 | Radios, sombras y transiciones sin sistema | **Parcial.** Los 16 `transition: all` pasaron a propiedades explícitas. Los 10 radios y 8 sombras siguen sin consolidar |
| 6 | Colores en hexadecimal fuera de `:root` | **Resuelto.** De 20 a 4, y esos 4 son blanco puro sobre botones de marcas de terceros, donde es obligado |

### Añadido en la misma pasada

| Área | Cambio |
|---|---|
| Rendimiento | El logotipo pesaba **205 KB a 2048px** y se muestra a 42px. Reescalado a 400px: **29 KB, −86%**. Está en la ruta crítica (splash y barra), así que es lo primero que carga todo el mundo |
| Estabilidad visual | **33 imágenes** llevan ahora `width` y `height`. El navegador reserva el espacio y la página deja de saltar mientras cargan las fotos |
| Navegación por teclado | Enlace **"Saltar al contenido"** en ambas páginas, oculto hasta que se le da el tabulador |
| Semántica | `<main id="contenido">` en la portada, que no lo tenía |
| Táctil | Los enlaces del menú lateral pasaron de **23px a 50px** de alto y el botón de hamburguesa a **44×44** |
| Estado | El color de "cerrado" dejó de estar escrito a mano en el JavaScript |

**Verificado:** escritorio (1280px) y móvil (375px), portada y menú. Sin desbordamiento horizontal, sin errores en consola, el menú lateral abre y cierra, los 123 platos y el armador de pedido intactos, y los colores idénticos.

---

## Cómo se usa este documento

1. Antes de tocar `styles.css`, se comprueba que el cambio cabe en estos tokens.
2. Si hace falta un valor nuevo, primero se añade aquí y se justifica.
3. Después de cada cambio: verificar 375px + escritorio, y que no se rompió ninguna regla de §8.
