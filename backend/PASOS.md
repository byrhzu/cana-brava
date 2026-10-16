# Paso 1 — Poner la planilla detrás de login

Todo esto se hace en el panel de Cloudflare. No toca código.

---

## 1.1 — SSL/TLS en "Full" (hacer esto PRIMERO)

Cloudflare → el dominio **canabravacr.com** → **SSL/TLS** → **Overview**.

Elegir **Full**.

> **Por qué primero:** si la nube naranja se prende con SSL en "Flexible",
> Cloudflare le habla a GitHub por HTTP, GitHub redirige a HTTPS, y eso
> rebota para siempre. El sitio queda caído hasta que se corrija.
>
> **Por qué "Full" y no "Full (strict)":** GitHub renueva su certificado
> validando por HTTP, y con el proxy encendido esa validación a veces
> falla. Con "Full (strict)" un certificado vencido en GitHub tumba el
> sitio; con "Full" no. El visitante ve igual el certificado de
> Cloudflare, así que no se pierde nada.

---

## 1.2 — Prender la nube naranja

Cloudflare → **DNS** → **Records**.

Poner en **Proxied** (nube naranja) los cinco registros:

| Tipo  | Nombre | Contenido        |
|-------|--------|------------------|
| A     | @      | 185.199.108.153  |
| A     | @      | 185.199.109.153  |
| A     | @      | 185.199.110.153  |
| A     | @      | 185.199.111.153  |
| CNAME | www    | byrhzu.github.io |

Tarda uno o dos minutos. Avisame cuando esté y lo verifico.

---

## 1.3 — Access sobre la planilla

Cloudflare → **Zero Trust** (menú de la izquierda) → **Access** →
**Applications** → **Add an application** → **Self-hosted**.

| Campo                | Qué poner                |
|----------------------|--------------------------|
| Application name     | Planilla                 |
| Session Duration     | 24 hours                 |
| Subdomain            | *(vacío)*                |
| Domain               | canabravacr.com          |
| Path                 | planilla.html            |

Siguiente pantalla, la política:

| Campo        | Qué poner                              |
|--------------|----------------------------------------|
| Policy name  | Quien hace la planilla                 |
| Action       | Allow                                  |
| Include      | **Emails** → los correos autorizados   |

Ahí van tu correo y el de quien haga la planilla. Nadie más entra.

El método de ingreso por defecto es **One-time PIN**: Cloudflare manda
un código al correo y con eso se entra. No hay que crear contraseñas ni
instalar nada.

> La primera vez que se entra a Zero Trust pide elegir un nombre de
> equipo y un plan. El **Free** cubre hasta 50 personas.

---

## Qué pasa después

- Entrar a `canabravacr.com/planilla.html` va a pedir el correo y el código.
- El resto del sitio sigue abierto como siempre.
- Cloudflare le pasa a la página el correo de quien entró, así que la
  bitácora va a poder decir **quién** hizo cada cambio, no solo qué y cuándo.

---

## Lo que viene

| Paso | Qué |
|------|-----|
| 2 | Crear la base D1 y cargarle `esquema.sql` |
| 3 | El Worker con la API, y el panel leyendo de ahí |
| 4 | Resend para mandar las boletas por correo |
