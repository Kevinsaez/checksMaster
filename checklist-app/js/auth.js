/* =========================================================
   AUTH.JS
   Maneja el login con Google (Google Identity Services).
   No contiene contraseñas: Google verifica la identidad,
   y el backend (Apps Script) verifica si el email está
   autorizado en la planilla de "Choferes".
   ========================================================= */

const Auth = (() => {
  const SESSION_KEY = "checklist_session_v1";
  let currentUser = null; // { email, name, picture, legajo }

  /**
   * Decodifica el JWT (id_token) que entrega Google.
   * Solo se usa para mostrar nombre/foto en pantalla;
   * la verificación real de identidad la hace Apps Script
   * validando la firma del token contra los servidores de Google.
   */
  function decodeJwt(token) {
    try {
      const payload = token.split(".")[1];
      const decoded = decodeURIComponent(
        atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
          .split("")
          .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
          .join("")
      );
      return JSON.parse(decoded);
    } catch (e) {
      console.error("No se pudo decodificar el token", e);
      return null;
    }
  }

  function saveSession(user, idToken) {
    currentUser = user;
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ user, idToken, savedAt: Date.now() })
    );
  }

  function loadSession() {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function clearSession() {
    currentUser = null;
    sessionStorage.removeItem(SESSION_KEY);
  }

  function getIdToken() {
    const session = loadSession();
    return session ? session.idToken : null;
  }

  function getUser() {
    return currentUser;
  }

  /**
   * Inicializa el botón de Google y define qué pasa
   * cuando el usuario completa el login en el popup de Google.
   * onCredential recibe el idToken crudo (JWT) para enviarlo
   * al backend y que este lo valide y autorice.
   */
  function renderGoogleButton(containerId, onCredential) {
    if (!window.google || !google.accounts || !google.accounts.id) {
      console.error("Google Identity Services no cargó todavía.");
      return;
    }

    google.accounts.id.initialize({
      client_id: APP_CONFIG.GOOGLE_CLIENT_ID,
      callback: (response) => {
        const payload = decodeJwt(response.credential);
        if (!payload) return;
        onCredential(response.credential, {
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
        });
      },
      auto_select: false,
      ux_mode: "popup",
    });

    google.accounts.id.renderButton(document.getElementById(containerId), {
      theme: "filled_blue",
      size: "large",
      shape: "pill",
      text: "signin_with",
      width: 300,
      locale: "es",
    });
  }

  function signOut() {
    clearSession();
    if (window.google && google.accounts && google.accounts.id) {
      google.accounts.id.disableAutoSelect();
    }
  }

  return {
    renderGoogleButton,
    saveSession,
    loadSession,
    clearSession,
    getIdToken,
    getUser,
    signOut,
    setCurrentUser: (u) => (currentUser = u),
  };
})();
