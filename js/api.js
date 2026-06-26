/* =========================================================
   API.JS
   Toda la comunicación con el backend (Google Apps Script).
   El backend recibe el idToken de Google en cada request,
   lo valida, y solo entonces lee/escribe en el Sheet.
   ========================================================= */

const Api = (() => {
  /**
   * Llama al backend para verificar si el usuario logueado
   * está autorizado (existe en la pestaña "Choferes" y activo = SI).
   * Devuelve { authorized: bool, legajo, nombre, message }
   */
  async function verificarChofer(idToken) {
    return postToBackend({
      action: "verificarChofer",
      idToken,
    });
  }

  /**
   * Envía el checklist completo para que se guarde como
   * una fila nueva en la pestaña "Checklists" del Sheet.
   */
  async function enviarChecklist(idToken, datosChecklist) {
    return postToBackend({
      action: "guardarChecklist",
      idToken,
      data: datosChecklist,
    });
  }

  async function postToBackend(body) {
    if (
      !APP_CONFIG.APPS_SCRIPT_URL ||
      APP_CONFIG.APPS_SCRIPT_URL.includes("TU_DEPLOYMENT_ID")
    ) {
      throw new Error(
        "Todavía no configuraste la URL de Apps Script en js/config.js"
      );
    }

    const response = await fetch(APP_CONFIG.APPS_SCRIPT_URL, {
      method: "POST",
      // Apps Script Web Apps esperan text/plain para evitar
      // el preflight CORS de application/json en algunos casos.
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body),
    });

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
