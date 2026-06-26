# Guía de instalación — Checklist Renault Master

Esta guía te lleva paso a paso para tener la app funcionando.
No hace falta saber programar, solo seguir el orden.

Vas a necesitar:
- Tu cuenta de Google (la misma del proyecto `n8n-gmail` que ya tenés en Google Cloud, o cualquier otra).
- Una cuenta de Netlify (gratis) para publicar la app.
- 20-30 minutos.

---

## PASO 1 — Crear el Google Sheet (la base de datos)

1. Entrá a [sheets.google.com](https://sheets.google.com) y creá una planilla nueva.
2. Nombrala, por ejemplo: **"Checklist Vehículos - Línea San Martín"**.
3. Creá dos pestañas (hojas) dentro de esa planilla:

### Pestaña "Choferes"
Esta es tu lista blanca: solo estos emails van a poder entrar a la app.
En la fila 1 poné estos encabezados exactos:

| A (Email) | B (Nombre) | C (Legajo) | D (Activo) |
|---|---|---|---|
| juan.perez@gmail.com | Juan Pérez | 4521 | SI |
| maria.gomez@gmail.com | María Gómez | 4522 | SI |

- **Email**: el Gmail (o cuenta de Google) que usa el chofer para loguearse.
- **Activo**: poné `SI` para habilitarlo, `NO` para bloquearlo sin borrar la fila.
- Agregá una fila por cada chofer. Podés sumar o sacar choferes en cualquier momento, sin tocar código.

### Pestaña "Checklists"
Dejala vacía. El sistema la completa solo, automáticamente, con los encabezados correctos la primera vez que alguien envía un checklist.

---

## PASO 2 — Crear el backend (Google Apps Script)

1. Dentro de tu Google Sheet, andá a **Extensiones > Apps Script**.
2. Se abre un editor de código. Borrá todo el contenido de `Código.gs` (o `Code.gs`) que viene por defecto.
3. Pegá ahí todo el contenido del archivo **`apps-script/Codigo.gs`** que te entregué.
4. Guardá el proyecto (ícono de disquete o `Ctrl+S`). Podés ponerle nombre, ej: "Backend Checklist".

### Configurar el Client ID (lo hacemos en el Paso 3, dejá esto abierto)

---

## PASO 3 — Crear las credenciales de Google (OAuth Client ID)

Esto es lo que permite el botón "Iniciar sesión con Google".

1. Entrá a [Google Cloud Console](https://console.cloud.google.com/).
2. Arriba a la izquierda, elegí el proyecto que ya tenés (el de `n8n-gmail`) **o** creá uno nuevo si preferís separarlo.
3. Andá a **APIs y servicios > Pantalla de consentimiento de OAuth**.
   - Si no la configuraste antes: tipo de usuario **Externo**, completá nombre de la app ("Checklist Renault Master"), tu email de soporte, y guardá.
   - En "Usuarios de prueba" (si la app queda en modo "Prueba"), agregá los emails de los choferes que vayan a probarla, o publicá la app en modo producción si tu organización lo permite.
4. Andá a **APIs y servicios > Credenciales**.
5. Clic en **+ Crear credenciales > ID de cliente de OAuth**.
6. Tipo de aplicación: **Aplicación web**.
7. Nombre: "Checklist Web App".
8. En **"Orígenes de JavaScript autorizados"** agregá la URL donde vas a publicar la app en Netlify. Como todavía no la tenés, podés:
   - Crear primero el sitio en Netlify (Paso 5) para tener la URL, **o**
   - Completar este paso después y volver a editarlo (Google te deja agregar orígenes en cualquier momento).
   - Ejemplo de origen: `https://checklist-master-sanmartin.netlify.app`
9. Hacé clic en **Crear**. Google te va a mostrar un **Client ID** (termina en `.apps.googleusercontent.com`). **Copialo.**

### Ahora completá la configuración con ese Client ID:

**A) En el archivo `js/config.js` de la app:**
```js
GOOGLE_CLIENT_ID: "PEGÁ_AQUÍ_TU_CLIENT_ID.apps.googleusercontent.com",
```

**B) En el Apps Script** (volvé al editor del Paso 2):
1. Buscá la función `configurarClientId()` al final del código.
2. Reemplazá el valor de `TU_CLIENT_ID` por tu Client ID real.
3. Arriba del editor, en el selector de funciones, elegí `configurarClientId`.
4. Hacé clic en **Ejecutar** (▶). La primera vez te va a pedir permisos: aceptá todos (son los permisos para que el script pueda leer/escribir tu propia planilla).
5. Confirmá en el log que dice "Client ID guardado correctamente."

> Esto guarda el Client ID en una "Propiedad del script", separado del código, para que el backend pueda comprobar que el login viene de tu app y no de otra.

---

## PASO 4 — Publicar el backend como Web App

1. En el editor de Apps Script, arriba a la derecha, clic en **Implementar > Nueva implementación**.
2. Tipo: **Aplicación web**.
3. Configurá:
   - **Ejecutar como**: Yo (tu cuenta).
   - **Quién tiene acceso**: **Cualquier usuario** (esto NO significa que cualquiera pueda guardar datos — el script igual revisa el login y la lista blanca antes de hacer nada. Es necesario para que el navegador del chofer pueda llamar a la URL).
4. Clic en **Implementar**.
5. Te va a pedir autorizar permisos otra vez la primera vez: aceptá.
6. Copiá la **URL de la aplicación web** que te entrega (termina en `/exec`).

### Completá la configuración con esa URL:

En `js/config.js`:
```js
APPS_SCRIPT_URL: "PEGÁ_AQUÍ_TU_URL_TERMINADA_EN_/exec",
```

> ⚠️ Importante: cada vez que modifiques el código del Apps Script (`Codigo.gs`), tenés que hacer **Implementar > Administrar implementaciones > ✏️ Editar > Nueva versión > Implementar** para que los cambios se reflejen en la URL pública.

---

## PASO 5 — Publicar el frontend en Netlify

1. Entrá a [netlify.com](https://www.netlify.com/) y creá una cuenta gratis (podés usar tu cuenta de Google).
2. En el panel principal, buscá la opción de arrastrar y soltar una carpeta ("Deploy manually" / "Drag and drop your site folder").
3. Arrastrá la carpeta completa de la app (la que contiene `index.html`, `css/`, `js/`).
4. Netlify te va a dar una URL del tipo `https://nombre-random.netlify.app`. Podés cambiarle el nombre desde **Site settings > Change site name**.

### Último paso: actualizar el origen autorizado en Google Cloud

1. Volvé a **Google Cloud Console > APIs y servicios > Credenciales**.
2. Editá el Client ID que creaste en el Paso 3.
3. En "Orígenes de JavaScript autorizados", agregá (o confirmá) la URL real de Netlify, por ejemplo:
   `https://checklist-master-sanmartin.netlify.app`
4. Guardá.

> Sin este paso, Google va a rechazar el login con un error de "origen no autorizado".

---

## PASO 6 — Probar todo el flujo

1. Abrí la URL de Netlify desde tu celular o PC.
2. Iniciá sesión con un email que **sí** esté en la pestaña "Choferes" con `Activo = SI`.
3. Completá el checklist paso a paso y enviá.
4. Volvé al Google Sheet → pestaña "Checklists" → debería aparecer la fila nueva.
5. Probá también con un email que **no** esté en la lista: tiene que rechazar el acceso con un mensaje claro.

---

## Mantenimiento del día a día

- **Agregar un chofer nuevo**: sumá una fila en la pestaña "Choferes" del Sheet. Nada más.
- **Bloquear un chofer**: cambiá su columna "Activo" a `NO`.
- **Ver los registros**: pestaña "Checklists" del mismo Sheet. Podés filtrar, exportar, hacer gráficos, etc. como cualquier planilla.
- **Actualizar la app**: si en el futuro querés cambiar textos o estilos, edito los archivos y volvés a arrastrar la carpeta a Netlify (sobrescribe el sitio).

---

## Resumen de seguridad (por qué este diseño es seguro)

- Nunca se manejan contraseñas propias: Google verifica la identidad del chofer.
- El frontend (HTML/CSS/JS) no tiene ninguna clave secreta: solo tiene el Client ID (que es público por diseño) y la URL del backend.
- El backend (Apps Script) vuelve a verificar el token de Google de forma independiente — nunca confía en lo que diga el navegador del chofer.
- El backend también vuelve a comprobar la lista blanca de choferes en cada envío, no solo al loguearse, así que si bloqueás a alguien a mitad de su sesión, su próximo envío va a ser rechazado.
- El campo "legajo" y "nombre" que se guarda en cada checklist viene de la planilla de Choferes (no de lo que mande el navegador), para que nadie pueda hacerse pasar por otra persona.
