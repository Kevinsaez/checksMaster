/* =========================================================
   FORM-LOGIC.JS
   Maneja el wizard de pasos, los botones de selección
   Sí/No - Bien/Mal, validaciones y el resumen final.
   ========================================================= */

const FormLogic = (() => {
  const TOTAL_STEPS = 6;
  let currentStep = 1;
  // Guarda los valores elegidos en los botones de toggle: { "luz-baja": "Bien", ... }
  const toggleValues = {};

  function init() {
    initToggleButtons();
    initCombustibleSlider();
    initCargaCombustible();
    initStepNav();
    initFechaHoy();
    goToStep(1);
  }

  function initFechaHoy() {
    const fechaInput = document.getElementById("fecha");
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, "0");
    const dd = String(hoy.getDate()).padStart(2, "0");
    fechaInput.value = `${yyyy}-${mm}-${dd}`;
  }

  function initToggleButtons() {
    document.querySelectorAll(".btn-group-toggle").forEach((group) => {
      // El nombre puede estar en el propio grupo (pasos 1 y 5) o en el
      // .check-row contenedor (Luces, Motor, Accesorios).
      const name = group.dataset.name || group.closest(".check-row")?.dataset.name;
      if (!name) {
        console.warn("btn-group-toggle sin data-name asociado", group);
        return;
      }
      group.querySelectorAll(".btn-toggle").forEach((btn) => {
        btn.addEventListener("click", () => {
          group
            .querySelectorAll(".btn-toggle")
            .forEach((b) => b.classList.remove("selected"));
          btn.classList.add("selected");
          toggleValues[name] = btn.dataset.value;

          // Caso especial: mostrar/ocultar detalle de carga de combustible
          if (name === "carga-si-no") {
            const detalle = document.getElementById("carga-detalle");
            if (btn.dataset.value === "SI") {
              detalle.classList.remove("d-none");
            } else {
              detalle.classList.add("d-none");
            }
          }
        });
      });
    });
  }

  function initCombustibleSlider() {
    const slider = document.getElementById("combustible");
    const label = document.getElementById("combustible-value");
    slider.addEventListener("input", () => {
      label.textContent = slider.value + "%";
    });
  }

  function initCargaCombustible() {
    // nada adicional por ahora; ya cubierto en initToggleButtons
  }

  function initStepNav() {
    document.getElementById("btn-next").addEventListener("click", () => {
      if (validateStep(currentStep)) {
        if (currentStep < TOTAL_STEPS) goToStep(currentStep + 1);
      }
    });

    document.getElementById("btn-prev").addEventListener("click", () => {
      if (currentStep > 1) goToStep(currentStep - 1);
    });
  }

  function goToStep(step) {
    currentStep = step;

    document.querySelectorAll(".form-step").forEach((el) => {
      el.classList.toggle("active", Number(el.dataset.step) === step);
    });

    document.querySelectorAll(".step-dot").forEach((dot) => {
      const n = Number(dot.dataset.step);
      dot.classList.toggle("active", n === step);
      dot.classList.toggle("completed", n < step);
    });

    document.getElementById("btn-prev").disabled = step === 1;

    const btnNext = document.getElementById("btn-next");
    const btnSubmit = document.getElementById("btn-submit");
    if (step === TOTAL_STEPS) {
      btnNext.classList.add("d-none");
      btnSubmit.classList.remove("d-none");
      renderResumen();
    } else {
      btnNext.classList.remove("d-none");
      btnSubmit.classList.add("d-none");
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /**
   * Valida el paso actual antes de dejar avanzar.
   * Usa la validación nativa de HTML5 para inputs requeridos
   * y chequeos manuales para los botones de toggle obligatorios.
   */
  function validateStep(step) {
    const section = document.querySelector(`.form-step[data-step="${step}"]`);
    const inputs = section.querySelectorAll("input[required], textarea[required]");
    let valid = true;

    inputs.forEach((input) => {
      if (!input.checkValidity()) {
        input.reportValidity();
        valid = false;
      }
    });

    if (!valid) return false;

    if (step === 1) {
      const requeridos = ["tarjeta-verde", "vtv-vigente", "seguro-vigente"];
      for (const r of requeridos) {
        if (!toggleValues[r]) {
          Toast.show("Completá Tarjeta verde, VTV y Seguro antes de continuar.");
          return false;
        }
      }
    }

    if (step === 5) {
      if (!toggleValues["carga-si-no"]) {
        Toast.show("Indicá si hubo carga de combustible.");
        return false;
      }
    }

    if (step === TOTAL_STEPS) {
      const confirmCheck = document.getElementById("confirmar-veracidad");
      if (!confirmCheck.checked) {
        Toast.show("Tenés que confirmar que los datos son correctos.");
        return false;
      }
    }

    return true;
  }

  function validateAll() {
    for (let s = 1; s <= TOTAL_STEPS; s++) {
      if (!validateStep(s)) {
        goToStep(s);
        return false;
      }
    }
    return true;
  }

  function val(id) {
    const el = document.getElementById(id);
    return el ? el.value : "";
  }

  /** Construye el objeto final que se envía al backend */
  function buildPayload(user, legajo) {
    return {
      // Información general
      dominio: val("dominio").toUpperCase().trim(),
      conductor: user.name,
      conductorEmail: user.email,
      legajo: legajo,
      fecha: val("fecha"),
      kmInicial: val("km-inicial"),
      kmLlegada: val("km-llegada"),
      tarjetaVerde: toggleValues["tarjeta-verde"] || "",
      vtvVigente: toggleValues["vtv-vigente"] || "",
      seguroVigente: toggleValues["seguro-vigente"] || "",
      combustibleNivel: val("combustible") + "%",

      // Luces
      luzBaja: toggleValues["luz-baja"] || "",
      luzAlta: toggleValues["luz-alta"] || "",
      posicion: toggleValues["posicion"] || "",
      balizas: toggleValues["balizas"] || "",
      giros: toggleValues["giros"] || "",
      freno: toggleValues["freno"] || "",
      marchaAtras: toggleValues["marcha-atras"] || "",

      // Motor
      aceiteMotor: toggleValues["aceite-motor"] || "",
      aguaRefrigerante: toggleValues["agua-refrigerante"] || "",

      // Accesorios
      criquet: toggleValues["criquet"] || "",
      llaveCruz: toggleValues["llave-cruz"] || "",
      botiquin: toggleValues["botiquin"] || "",
      matafuego: toggleValues["matafuego"] || "",
      balizasTriangulo: toggleValues["balizas-triangulo"] || "",
      ruedaAuxilio: toggleValues["rueda-auxilio"] || "",
      observaciones: val("observaciones").trim(),

      // Carga de combustible
      cargaCombustible: toggleValues["carga-si-no"] || "NO",
      litros: toggleValues["carga-si-no"] === "SI" ? val("litros") : "",
      importe: toggleValues["carga-si-no"] === "SI" ? val("importe") : "",
      kmCarga: toggleValues["carga-si-no"] === "SI" ? val("km-carga") : "",
      estacion: toggleValues["carga-si-no"] === "SI" ? val("estacion").trim() : "",

      // Metadata
      fechaEnvio: new Date().toISOString(),
    };
  }

  function renderResumen() {
    const box = document.getElementById("resumen-checklist");
    const badge = (v) =>
      v === "Bien" || v === "SI"
        ? `<span class="badge-bien">${v}</span>`
        : v
        ? `<span class="badge-mal">${v}</span>`
        : "<span class='text-muted'>—</span>";

    const row = (label, value) =>
      `<div class="resumen-row"><span>${label}</span>${badge(value)}</div>`;

    box.innerHTML = `
      <div class="resumen-section">
        <h3>General</h3>
        <div class="resumen-row"><span>Dominio</span><strong>${val("dominio").toUpperCase() || "—"}</strong></div>
        <div class="resumen-row"><span>Fecha</span><strong>${val("fecha") || "—"}</strong></div>
        <div class="resumen-row"><span>Km inicial / llegada</span><strong>${val("km-inicial") || "—"} / ${val("km-llegada") || "—"}</strong></div>
        ${row("Tarjeta verde", toggleValues["tarjeta-verde"])}
        ${row("VTV vigente", toggleValues["vtv-vigente"])}
        ${row("Seguro vigente", toggleValues["seguro-vigente"])}
        <div class="resumen-row"><span>Combustible</span><strong>${val("combustible")}%</strong></div>
      </div>
      <div class="resumen-section">
        <h3>Luces</h3>
        ${row("Luz baja", toggleValues["luz-baja"])}
        ${row("Luz alta", toggleValues["luz-alta"])}
        ${row("Posición", toggleValues["posicion"])}
        ${row("Balizas", toggleValues["balizas"])}
        ${row("Giros", toggleValues["giros"])}
        ${row("Freno", toggleValues["freno"])}
        ${row("Marcha atrás", toggleValues["marcha-atras"])}
      </div>
      <div class="resumen-section">
        <h3>Motor</h3>
        ${row("Aceite de motor", toggleValues["aceite-motor"])}
        ${row("Agua / Refrigerante", toggleValues["agua-refrigerante"])}
      </div>
      <div class="resumen-section">
        <h3>Accesorios</h3>
        ${row("Criquet", toggleValues["criquet"])}
        ${row("Llave cruz", toggleValues["llave-cruz"])}
        ${row("Botiquín", toggleValues["botiquin"])}
        ${row("Matafuego", toggleValues["matafuego"])}
        ${row("Balizas / Triángulo", toggleValues["balizas-triangulo"])}
        ${row("Rueda de auxilio", toggleValues["rueda-auxilio"])}
        ${val("observaciones") ? `<div class="resumen-row"><span>Observaciones</span></div><p class="small text-muted mb-0">${val("observaciones")}</p>` : ""}
      </div>
      <div class="resumen-section">
        <h3>Carga de combustible</h3>
        ${row("¿Hubo carga?", toggleValues["carga-si-no"])}
        ${toggleValues["carga-si-no"] === "SI" ? `
          <div class="resumen-row"><span>Litros</span><strong>${val("litros") || "—"}</strong></div>
          <div class="resumen-row"><span>Importe</span><strong>$${val("importe") || "—"}</strong></div>
          <div class="resumen-row"><span>Km de carga</span><strong>${val("km-carga") || "—"}</strong></div>
          <div class="resumen-row"><span>Estación</span><strong>${val("estacion") || "—"}</strong></div>
        ` : ""}
      </div>
    `;
  }

  function resetForm() {
    document.getElementById("checklist-form").reset();
    Object.keys(toggleValues).forEach((k) => delete toggleValues[k]);
    document.querySelectorAll(".btn-toggle.selected").forEach((b) =>
      b.classList.remove("selected")
    );
    document.getElementById("carga-detalle").classList.add("d-none");
    document.getElementById("combustible-value").textContent = "50%";
    initFechaHoy();
    goToStep(1);
  }

  return {
    init,
    validateAll,
    buildPayload,
    resetForm,
    setFirmante: (nombre, legajo) => {
      document.getElementById("firma-nombre").textContent = nombre;
      document.getElementById("firma-legajo").textContent = legajo || "—";
    },
  };
})();
