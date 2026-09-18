/* ==========================================================================
   herramientas-nivel1.js
   Selección de herramientas (click en la barra) y su uso sobre el gabinete
   (click en el gabinete). Reglas:
     - data-uso="unico"        -> se puede usar una sola vez (placa madre)
     - data-uso="ilimitado"    -> se puede usar siempre (destornillador)
     - data-usos-restantes="N" -> se gasta 1 por uso (tornillos)
   ========================================================================== */

(function () {
  const itemsHerramientas = document.querySelectorAll(
    ".barra-herramientas__item[data-herramienta]"
  );
  const zonaPlacaMadre = document.querySelector(".zona-placa-madre");
  const placaMadreColocada = document.querySelector(".placa-madre-colocada");
  const puntosTornillo = document.querySelectorAll(".punto-tornillo");
  const itemTornillo = document.querySelector('[data-herramienta="tornillo"]');
  const itemPlacaMadre = document.querySelector('[data-herramienta="placa-madre"]');
  const contadorTornillo = itemTornillo
    ? itemTornillo.querySelector(".barra-herramientas__contador")
    : null;

  if (!itemsHerramientas.length || !zonaPlacaMadre || !placaMadreColocada) return;

  let herramientaActual = null; // "placa-madre" | "destornillador" | "tornillo" | null

  function placaMadreYaColocada() {
    return !placaMadreColocada.hidden;
  }

  function actualizarCursor(item) {
    const img = item.querySelector("img");
    // Usamos el propio ícono de la herramienta como cursor. Si en algún
    // momento se ve muy grande/borroso, conviene crear versiones chicas
    // (ej. 32x32) de cada sprite específicas para el cursor.
    document.body.style.cursor = img ? `url("${img.src}") 16 16, pointer` : "pointer";
  }

  function actualizarZonaActiva() {
    zonaPlacaMadre.classList.toggle(
      "zona-activa",
      herramientaActual === "placa-madre" && !placaMadreYaColocada()
    );
  }

  function seleccionarHerramienta(item) {
    const nombre = item.dataset.herramienta;

    if (herramientaActual === nombre) {
      deseleccionarHerramienta();
      return;
    }

    herramientaActual = nombre;
    itemsHerramientas.forEach((i) =>
      i.setAttribute("aria-pressed", i === item ? "true" : "false")
    );
    actualizarCursor(item);
    actualizarZonaActiva();
  }

  function deseleccionarHerramienta() {
    herramientaActual = null;
    itemsHerramientas.forEach((i) => i.setAttribute("aria-pressed", "false"));
    document.body.style.cursor = "";
    actualizarZonaActiva();
  }

  itemsHerramientas.forEach((item) => {
    item.setAttribute("aria-pressed", "false");
    item.addEventListener("click", () => {
      if (item.dataset.agotado === "true") return;
      seleccionarHerramienta(item);
    });
  });

  // --- Colocar la placa madre (uso único) ---
  zonaPlacaMadre.addEventListener("click", () => {
    if (herramientaActual !== "placa-madre" || placaMadreYaColocada()) return;

    placaMadreColocada.hidden = false;
    itemPlacaMadre.dataset.agotado = "true";
    deseleccionarHerramienta();

    // TODO: enganchar acá el avance de la barra de progreso del nivel.
    document.dispatchEvent(new CustomEvent("nivel1:placaColocada"));
  });

  // --- Colocar tornillos (se gastan) y apretarlos (destornillador, ilimitado) ---
  puntosTornillo.forEach((punto) => {
    punto.addEventListener("click", () => {
      if (herramientaActual === "tornillo") {
        if (!placaMadreYaColocada()) return; // hace falta la placa puesta primero
        if (punto.dataset.colocado === "true") return;

        punto.dataset.colocado = "true";

        const restantes = parseInt(itemTornillo.dataset.usosRestantes, 10) - 1;
        itemTornillo.dataset.usosRestantes = String(restantes);
        if (contadorTornillo) contadorTornillo.textContent = String(restantes);

        document.dispatchEvent(new CustomEvent("nivel1:tornilloColocado"));

        if (restantes <= 0) {
          itemTornillo.dataset.agotado = "true";
          deseleccionarHerramienta();
        }
      } else if (herramientaActual === "destornillador") {
        if (punto.dataset.colocado !== "true") return; // no hay tornillo que apretar
        if (punto.dataset.apretado === "true") return;

        punto.dataset.apretado = "true";
        document.dispatchEvent(new CustomEvent("nivel1:tornilloApretado"));

        const todosApretados = Array.from(puntosTornillo).every(
          (p) => p.dataset.apretado === "true"
        );
        if (todosApretados) {
          // TODO: acá se puede dar por completado este paso del nivel 1.
          document.dispatchEvent(new CustomEvent("nivel1:pasoCompletado"));
        }
      }
    });
  });

  // Si se abre el diálogo de "¿Estás seguro de salir?", soltamos la
  // herramienta seleccionada para no dejar el cursor "pegado".
  document.addEventListener("juego:pausar", deseleccionarHerramienta);
})();