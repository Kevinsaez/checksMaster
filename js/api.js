/* =========================================================
   API.JS
   Toda la comunicación con el backend (Google Apps Script).
   Usa un GET con los datos en la query string para evitar
   el problema de CORS que Apps Script tiene con POST+redirect.
   El backend recibe el payload en e.parameter.payload.
   ========================================================= */

const Api = (() => {
  async function verificarChofer(idToken) {
    return callBackend({ action: "verificarChofer", idToken });
  }

  async function enviarChecklist(idToken, datosChecklist) {
    return callBackend({ action: "guardarChecklist", idToken, data: datosChecklist });
  }

  async function callBackend(body) {
    if (!APP_CONFIG.APPS_SCRIPT_URL || APP_CONFIG.APPS_SCRIPT_URL.includes("TU_DEPLOYMENT_ID")) {
      throw new Error("Todavía no configuraste la URL de Apps Script en js/config.js");
    }

    // Apps Script tiene un problema conocido de CORS con POST que hace redirect.
    // La solución es enviar via GET con el payload en un query param,
    // lo que evita el preflight y el redirect que rompe los headers CORS.
    const payload = encodeURIComponent(JSON.stringify(body));
    const url = APP_CONFIG.APPS_SCRIPT_URL + "?payload=" + payload;

    const response = await fetch(url, { method: "GET" });

    if (!response.ok) {
      throw new Error("Error de red al contactar el servidor (" + response.status + ")");
    }

    const json = await response.json();

    if (json.ok === false) {
      throw new Error(json.message || "El servidor rechazó la solicitud.");
    }

    return json.data !== undefined ? json.data : json;
  }

  return { verificarChofer, enviarChecklist };
})();