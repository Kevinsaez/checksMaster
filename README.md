# Checklist Renault Master — Línea San Martín

App web responsive para que los choferes completen el checklist diario del
vehículo (Renault Master) y los datos se guarden automáticamente en una
planilla de Google Sheets.

## Estructura del proyecto

```
checklist-app/
├── index.html              ← Estructura de la app (todas las pantallas)
├── css/
│   └── styles.css          ← Estilos (identidad Línea San Martín)
├── js/
│   ├── config.js           ← ⚠️ ÚNICO archivo que tenés que editar con tus datos
│   ├── auth.js             ← Login con Google (sin contraseñas)
│   ├── api.js               ← Comunicación con el backend
│   ├── form-logic.js        ← Wizard de pasos, validaciones, resumen
│   └── app.js               ← Orquestador general
├── apps-script/
│   └── Codigo.gs            ← Backend (se pega en Google Apps Script)
└── GUIA_INSTALACION.md      ← Paso a paso para dejarlo funcionando
```

## ⚠️ Antes de usar

Esta app **no funciona "out of the box"**: necesita que conectes tu propio
Google Sheet, tu propio backend (Apps Script) y tu propio Client ID de Google.
Seguí **GUIA_INSTALACION.md** de principio a fin — está pensada para que no
necesites saber programar.

## Funcionalidades

- ✅ Login exclusivo con cuenta de Google (sin contraseñas que administrar).
- ✅ Lista blanca de choferes autorizados, editable directamente desde el Sheet.
- ✅ Formulario en 6 pasos que replica el checklist en papel exacto:
  información general, luces, motor, accesorios, carga de combustible y
  revisión final con firma digital (nombre + legajo).
- ✅ 100% responsive: pensado mobile-first para uso en el celular dentro de
  la van, pero funciona igual de bien en PC.
- ✅ Guardado automático en Google Sheets vía backend seguro (Apps Script).
- ✅ El backend revalida la identidad e la autorización en cada envío,
  nunca confía en datos del navegador.
- ✅ Accesible: foco visible, contraste alto, botones grandes para uso táctil.

## Stack

- HTML5 + CSS3 + JavaScript (vanilla, sin frameworks pesados)
- Bootstrap 5.3 (vía CDN) para grid y componentes responsive
- Bootstrap Icons
- Google Identity Services (login)
- Google Apps Script (backend gratuito, sin servidor propio)
- Google Sheets (base de datos)
- Netlify (hosting gratuito con HTTPS)
