# Frontend (estático)

Esta carpeta contiene la interfaz estática que consume la API del backend.

Archivos principales:
- `index.html` — formulario de login/registro.
- `computadores.html` — interfaz CRUD para computadores.
- `static/css/login.css` — estilos.
- `static/js/app.js` — lógica JS que llama a la API.

Cómo servir localmente (desarrollo):

1. Desde la carpeta `frontend/` ejecuta un servidor estático simple:

```bash
cd frontend
python -m http.server 8080
```

2. Abre en el navegador: `http://127.0.0.1:8080/index.html`

3. Por defecto `app.js` usa `http://127.0.0.1:5000` como `API_BASE_URL`. Si tu backend está en otra URL, puedes sobrescribirla antes de cargar `app.js` añadiendo en el HTML:

```html
<script>window.API_BASE_URL = 'https://api.tudominio.com';</script>
<script src="static/js/app.js"></script>
```

Notas de seguridad:
- Nunca pongas el secreto JWT en el frontend.
- En producción usar HTTPS y considerar HttpOnly cookies en lugar de localStorage si precisas mayor seguridad.
