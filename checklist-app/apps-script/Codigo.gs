/**
 * =========================================================
 * BACKEND - GOOGLE APPS SCRIPT
 * Checklist Renault Master - Línea San Martín
 * =========================================================
 *
 * Este script se pega en el editor de Apps Script (script.google.com)
 * vinculado a tu Google Sheet. Actúa como backend seguro:
 *
 *  1. Recibe el idToken de Google que manda el frontend.
 *  2. Verifica la firma de ese token contra los servidores
 *     de Google (tokeninfo) -> confirma que es un login real.
 *  3. Busca el email en la pestaña "Choferes". Si no está
 *     autorizado (o está inactivo), rechaza el pedido.
 *  4. Si está autorizado, lee o escribe en el Sheet según
 *     la acción pedida.
 *
 * El Sheet debe tener 2 pestañas:
 *   - "Choferes"   -> columnas: Email | Nombre | Legajo | Activo
 *   - "Checklists" -> se completa sola con encabezados (ver headers abajo)
 *
 * Ver GUIA_INSTALACION.md para el paso a paso de despliegue.
 */

const SHEET_CHOFERES = "Choferes";
const SHEET_CHECKLISTS = "Checklists";

// Encabezados de la pestaña Checklists, en el orden en que se escriben.
const CHECKLIST_HEADERS = [
  "Fecha envío", "Dominio", "Conductor", "Email", "Legajo", "Fecha",
  "Km inicial", "Km llegada", "Tarjeta verde", "VTV vigente", "Seguro vigente",
  "Combustible nivel",
  "Luz baja", "Luz alta", "Posición", "Balizas", "Giros", "Freno", "Marcha atrás",
  "Aceite motor", "Agua/Refrigerante",
  "Criquet", "Llave cruz", "Botiquín", "Matafuego", "Balizas/Triángulo", "Rueda auxilio",
  "Observaciones",
  "Carga combustible", "Litros", "Importe", "Km carga", "Estación",
];

/**
 * Punto de entrada único para todas las solicitudes POST del frontend.
 */
function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({ ok: false, message: "Cuerpo de solicitud inválido." });
  }

  try {
    switch (body.action) {
      case "verificarChofer":
        return jsonResponse(handleVerificarChofer(body));
      case "guardarChecklist":
        return jsonResponse(handleGuardarChecklist(body));
      default:
        return jsonResponse({ ok: false, message: "Acción no reconocida." });
    }
  } catch (err) {
    console.error(err);
    return jsonResponse({ ok: false, message: "Error interno: " + err.message });
  }
}

/**
 * Verifica el idToken contra Google y chequea si el email
 * está en la lista blanca de choferes activos.
 */
function handleVerificarChofer(body) {
  const email = verificarIdTokenYObtenerEmail(body.idToken);
  if (!email) {
    return { ok: false, message: "Token de Google inválido o expirado." };
  }

  const chofer = buscarChoferPorEmail(email);
  if (!chofer || chofer.activo !== true) {
    return { ok: true, data: { authorized: false } };
  }

  return {
    ok: true,
    data: { authorized: true, legajo: chofer.legajo, nombre: chofer.nombre },
  };
}

/**
 * Verifica nuevamente el token (nunca confiamos en el cliente),
 * vuelve a chequear la lista blanca, y si todo está OK,
 * agrega una fila nueva en la pestaña Checklists.
 */
function handleGuardarChecklist(body) {
  const email = verificarIdTokenYObtenerEmail(body.idToken);
  if (!email) {
    return { ok: false, message: "Token de Google inválido o expirado." };
  }

  const chofer = buscarChoferPorEmail(email);
  if (!chofer || chofer.activo !== true) {
    return { ok: false, message: "No estás autorizado para enviar checklists." };
  }

  const d = body.data || {};

  // Coherencia: el email y legajo se toman del backend, no del cliente.
  const fila = [
    new Date(),
    String(d.dominio || "").toUpperCase(),
    chofer.nombre,
    email,
    chofer.legajo,
    d.fecha || "",
    d.kmInicial || "",
    d.kmLlegada || "",
    d.tarjetaVerde || "",
    d.vtvVigente || "",
    d.seguroVigente || "",
    d.combustibleNivel || "",
    d.luzBaja || "",
    d.luzAlta || "",
    d.posicion || "",
    d.balizas || "",
    d.giros || "",
    d.freno || "",
    d.marchaAtras || "",
    d.aceiteMotor || "",
    d.aguaRefrigerante || "",
    d.criquet || "",
    d.llaveCruz || "",
    d.botiquin || "",
    d.matafuego || "",
    d.balizasTriangulo || "",
    d.ruedaAuxilio || "",
    d.observaciones || "",
    d.cargaCombustible || "",
    d.litros || "",
    d.importe || "",
    d.kmCarga || "",
    d.estacion || "",
  ];

  const sheet = getSheetOrCreate(SHEET_CHECKLISTS, CHECKLIST_HEADERS);
  sheet.appendRow(fila);

  return { ok: true, data: { saved: true } };
}

/**
 * Valida el idToken (JWT) llamando al endpoint oficial de Google
 * tokeninfo. Esto confirma que el token es legítimo, no expiró,
 * y que fue emitido para nuestro Client ID (evita tokens ajenos).
 * Devuelve el email verificado, o null si algo no cierra.
 */
function verificarIdTokenYObtenerEmail(idToken) {
  if (!idToken) return null;

  const url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(idToken);
  const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });

  if (response.getResponseCode() !== 200) {
    return null;
  }

  const info = JSON.parse(response.getContentText());

  // El "aud" (audience) del token debe coincidir con tu Client ID.
  // Esto evita que alguien use un idToken de OTRA aplicación.
  const clientId = PropertiesService.getScriptProperties().getProperty("GOOGLE_CLIENT_ID");
  if (clientId && info.aud !== clientId) {
    return null;
  }

  if (!info.email || info.email_verified !== "true") {
    return null;
  }

  return info.email.toLowerCase().trim();
}

/**
 * Busca un email en la pestaña Choferes.
 * Columnas esperadas: Email | Nombre | Legajo | Activo
 */
function buscarChoferPorEmail(email) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CHOFERES);
  if (!sheet) return null;

  const data = sheet.getDataRange().getValues();
  // data[0] son los encabezados
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowEmail = String(row[0] || "").toLowerCase().trim();
    if (rowEmail === email) {
      const activoRaw = String(row[3] || "").toUpperCase().trim();
      return {
        nombre: row[1] || "",
        legajo: row[2] || "",
        activo: activoRaw === "SI" || activoRaw === "SÍ" || activoRaw === "TRUE",
      };
    }
  }
  return null;
}

function getSheetOrCreate(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/**
 * Función auxiliar: ejecutala UNA VEZ manualmente desde el editor
 * (selecciona "configurarClientId" arriba y hacé clic en "Ejecutar")
 * para guardar tu Google Client ID de forma segura en el proyecto.
 * Reemplazá el valor antes de ejecutar.
 */
function configurarClientId() {
  const TU_CLIENT_ID = "TU_CLIENT_ID.apps.googleusercontent.com";
  PropertiesService.getScriptProperties().setProperty("GOOGLE_CLIENT_ID", TU_CLIENT_ID);
  console.log("Client ID guardado correctamente.");
}
