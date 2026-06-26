/* =========================================================
   APP.JS
   Orquesta el flujo completo: boot -> login -> verificación
   de chofer autorizado -> formulario -> envío -> éxito.
   ========================================================= */

const Toast = (() => {
  let toastInstance = null;
  function show(message, variant = "danger") {
    const toastEl = document.getElementById("app-toast");
    const body = document.getElementById("app-toast-body");
    body.textContent = message;
    toastEl.classList.remove("text-bg-danger", "text-bg-success");
    toastEl.classList.add(variant === "success" ? "text-bg-success" : "text-bg-danger");
    if (!toastInstance) {
      toastInstance = new bootstrap.Toast(toastEl, { delay: 4000 });
    }
    toastInstance.show();
  }
  return { show };
})();

const Screens = (() => {
  const ids = ["screen-boot", "screen-login", "screen-app", "screen-success"];
  function show(id) {
    ids.forEach((s) => {
      document.getElementById(s).classList.toggle("d-none", s !== id);
    });
  }
  return { show };
})();

(function main() {
  document.addEventListener("DOMContentLoaded", async () => {
    FormLogic.init();
    wireLogoutButton();
    wireSubmitButton();
    wireNewChecklistButton();

    // ¿Hay sesión guardada? Intentamos restaurarla sin pedir login de nuevo.
    const session = Auth.loadSession();
    if (session && session.idToken) {
      const valid = await tryRestoreSession(session);
      if (valid) return;
    }

    showLoginScreen();
  });

  function showLoginScreen() {
    Screens.show("screen-login");
    setLoginError("");
    Auth.renderGoogleButton("google-btn-container", onGoogleCredential);
  }

  async function tryRestoreSession(session) {
    try {
      const result = await Api.verificarChofer(session.idToken);
      if (result && result.authorized) {
        Auth.setCurrentUser(session.user);
        enterApp(session.user, result.legajo, result.nombre);
        return true;
      }
    } catch (e) {
      // El token puede haber expirado; pedimos login de nuevo silenciosamente.
    }
    Auth.clearSession();
    return false;
  }

  async function onGoogleCredential(idToken, user) {
    setLoginError("");
    setLoginChecking(true);
    try {
      const result = await Api.verificarChofer(idToken);
      setLoginChecking(false);

      if (!result || !result.authorized) {
        setLoginError(
          "Tu cuenta (" + user.email + ") no está autorizada. Pedile a tu supervisor que te registre como chofer."
        );
        return;
      }

      Auth.saveSession(user, idToken);
      enterApp(user, result.legajo, result.nombre);
    } catch (err) {
      setLoginChecking(false);
      setLoginError("No se pudo verificar tu acceso: " + err.message);
    }
  }

  function setLoginError(msg) {
    const el = document.getElementById("login-error");
    if (!msg) {
      el.classList.add("d-none");
      el.textContent = "";
    } else {
      el.classList.remove("d-none");
      el.textContent = msg;
    }
  }

  function setLoginChecking(isChecking) {
    document.getElementById("login-checking").classList.toggle("d-none", !isChecking);
  }

  function enterApp(user, legajo, nombreOficial) {
    document.getElementById("user-avatar").src = user.picture || "";
    document.getElementById("user-name-short").textContent = (nombreOficial || user.name || "").split(" ")[0];
    document.getElementById("user-email-full").textContent = user.email;
    FormLogic.setFirmante(nombreOficial || user.name, legajo);
    Screens.show("screen-app");
  }

  function wireLogoutButton() {
    document.getElementById("btn-logout").addEventListener("click", () => {
      Auth.signOut();
      FormLogic.resetForm();
      showLoginScreen();
    });
  }

  function wireSubmitButton() {
    document.getElementById("btn-submit").addEventListener("click", async () => {
      if (!FormLogic.validateAll()) return;

      const session = Auth.loadSession();
      if (!session || !session.idToken) {
        Toast.show("Tu sesión expiró. Iniciá sesión de nuevo.");
        Auth.clearSession();
        showLoginScreen();
        return;
      }

      const legajo = document.getElementById("firma-legajo").textContent;
      const payload = FormLogic.buildPayload(session.user, legajo);

      toggleSubmitOverlay(true);
      try {
        await Api.enviarChecklist(session.idToken, payload);
        toggleSubmitOverlay(false);
        Screens.show("screen-success");
      } catch (err) {
        toggleSubmitOverlay(false);
        Toast.show("No se pudo enviar el checklist: " + err.message);
      }
    });
  }

  function wireNewChecklistButton() {
    document.getElementById("btn-new-checklist").addEventListener("click", () => {
      FormLogic.resetForm();
      Screens.show("screen-app");
    });
  }

  function toggleSubmitOverlay(show) {
    document.getElementById("submit-overlay").classList.toggle("d-none", !show);
  }
})();
