/**
 * L'ORÉAL PROFESSIONNEL PARIS - WEB APP ESTÁTICA
 * Diagnóstico Capilar Personalizado & Checkout WhatsApp
 */

// -------------------------------------------------------------
// CONFIGURACIÓN COMERCIAL
// -------------------------------------------------------------
// Reemplaza con tu número de WhatsApp de ventas con código de país (Ej: 56912345678 para Chile)
const CONFIG = {
  WHATSAPP_PHONE: "56998378437", // Número configurado para pedidos directos
  CURRENCY: "CLP"
};

// -------------------------------------------------------------
// BANCO DE PREGUNTAS DEL DIAGNÓSTICO
// -------------------------------------------------------------
const QUIZ_QUESTIONS = [
  {
    step: 1,
    category: "Paso 1 de 4 • Textura Capilar",
    title: "¿Cuál es el patrón o textura de tu cabello?",
    subtitle: "Selecciona la forma natural de tu hebra capilar.",
    key: "patron",
    options: [
      {
        id: "liso",
        icon: "✨",
        title: "Liso o ligeramente ondeado",
        desc: "Hebra lisa o con ondas muy suaves propensas a pérdida de brillo."
      },
      {
        id: "ondulado",
        icon: "🌊",
        title: "Ondulado natural con frizz",
        desc: "Ondas marcadas que requieren control de volumen y suavidad."
      },
      {
        id: "rizado",
        icon: "🌀",
        title: "Rizado o Crespo definido",
        desc: "Espirales o rizos cerrados con alta necesidad de nutrición."
      }
    ]
  },
  {
    step: 2,
    category: "Paso 2 de 4 • Cuero Cabelludo",
    title: "¿Cuál es el estado de tu raíz capilar?",
    subtitle: "Identifica cómo se comporta tu cuero cabelludo.",
    key: "raiz",
    options: [
      {
        id: "grasa",
        icon: "💧",
        title: "Grasa o pesada",
        desc: "Sensación de exceso de oleosidad en menos de 24 horas."
      },
      {
        id: "normal",
        icon: "⚖️",
        title: "Equilibrada / Normal",
        desc: "Sin exceso de sebo ni tirantez, lavado cada 2 o 3 días."
      },
      {
        id: "seca",
        icon: "🍂",
        title: "Seca o sensible",
        desc: "Sensación tirante, hebra opaca o cuero cabelludo delicado."
      }
    ]
  },
  {
    step: 3,
    category: "Paso 3 de 4 • Procesos Químicos",
    title: "¿Tiene tu cabello algún proceso químico o color?",
    subtitle: "Los tratamientos químicos modifican la estructura interna.",
    key: "quimico",
    options: [
      {
        id: "decolorado",
        icon: "⚡",
        title: "Decolorado, Balayage o Mechas",
        desc: "Aclarado químico que requiere rescate intensivo y nutrición."
      },
      {
        id: "tinturado",
        icon: "🎨",
        title: "Tinturado o con Color global",
        desc: "Coloración periódica que necesita protección contra el deslave."
      },
      {
        id: "danado_calor",
        icon: "🔥",
        title: "Cabello Procesado por Calor o Alisado",
        desc: "Uso continuo de plancha/secador o alisados térmicos."
      },
      {
        id: "natural",
        icon: "🌱",
        title: "Cabello Natural (Sin tintura)",
        desc: "Cabello virgen sin decoloraciones ni coloración permanente."
      }
    ]
  },
  {
    step: 4,
    category: "Paso 4 de 4 • Objetivo Principal",
    title: "¿Cuál es tu prioridad capilar hoy?",
    subtitle: "El resultado principal que deseas ver frente al espejo.",
    key: "objetivo",
    options: [
      {
        id: "reparacion",
        icon: "💎",
        title: "Reparación Profunda y Anti-Quiebre",
        desc: "Sellar puntas partidas, reconstruir fibra rota y aportar fuerza."
      },
      {
        id: "color_brillo",
        icon: "🌟",
        title: "Brillo Radiante y Cuidado del Color",
        desc: "Maximizar luminosidad y mantener tono vibrante de peluquería."
      },
      {
        id: "fuerza_resistencia",
        icon: "🛡️",
        title: "Fuerza y Prevención de Quiebre al Peinar",
        desc: "Cabello frágil que se rompe fácilmente durante el cepillado."
      }
    ]
  }
];

// -------------------------------------------------------------
// ESTADO GLOBAL DE LA APLICACIÓN
// -------------------------------------------------------------
const state = {
  currentScreen: "screen-intro",
  currentQuestionIndex: 0,
  answers: {
    patron: null,
    raiz: null,
    quimico: null,
    objetivo: null
  },
  catalog: [],
  recommendedProducts: [],
  cart: {}, // { [key]: { product, quantity, selected } }
  catalogFilter: "all",
  catalogSearchTerm: ""
};

// -------------------------------------------------------------
// FORMATEO DE MONEDA CHILENA (CLP)
// -------------------------------------------------------------
function formatCLP(amount) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
  }).format(amount);
}

// -------------------------------------------------------------
// INICIALIZACIÓN
// -------------------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
  await cargarCatalogo();
  bindEvents();
});

// Cargar catálogo (Soporta window.CATALOGO_PRODUCTOS offline y fetch productos.json)
async function cargarCatalogo() {
  if (window.CATALOGO_PRODUCTOS && Array.isArray(window.CATALOGO_PRODUCTOS)) {
    state.catalog = window.CATALOGO_PRODUCTOS;
  } else {
    try {
      const res = await fetch("data/productos.json");
      if (res.ok) {
        state.catalog = await res.json();
      }
    } catch (err) {
      console.warn("Cargando desde fallback offline...", err);
    }
  }

  // Actualizar indicadores del catálogo con el total cargado
  const badge = document.getElementById("nav-catalog-badge");
  if (badge) badge.textContent = state.catalog.length;
  const countEl = document.getElementById("catalog-count-text");
  if (countEl) countEl.textContent = `Mostrando ${state.catalog.length} productos`;
}

// -------------------------------------------------------------
// NAVEGACIÓN ENTRE PANTALLAS
// -------------------------------------------------------------
function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add("active");
    state.currentScreen = screenId;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Actualizar estado visual de las pestañas superiores (Tabs)
  const tabQuiz = document.getElementById("tab-nav-quiz");
  const tabCatalog = document.getElementById("tab-nav-catalog");
  if (tabQuiz && tabCatalog) {
    if (screenId === "screen-catalog") {
      tabCatalog.classList.add("active");
      tabCatalog.setAttribute("aria-selected", "true");
      tabQuiz.classList.remove("active");
      tabQuiz.setAttribute("aria-selected", "false");
    } else {
      tabQuiz.classList.add("active");
      tabQuiz.setAttribute("aria-selected", "true");
      tabCatalog.classList.remove("active");
      tabCatalog.setAttribute("aria-selected", "false");
    }
  }

  actualizarBarraCheckout();
}

// -------------------------------------------------------------
// EVENTOS Y CONTROLES
// -------------------------------------------------------------
function bindEvents() {
  // Pestañas Principales (Tabs Superiores)
  const tabQuiz = document.getElementById("tab-nav-quiz");
  const tabCatalog = document.getElementById("tab-nav-catalog");

  if (tabQuiz) {
    tabQuiz.addEventListener("click", () => {
      if (state.recommendedProducts.length > 0) {
        showScreen("screen-results");
      } else if (state.answers.patron) {
        showScreen("screen-quiz");
      } else {
        showScreen("screen-intro");
      }
    });
  }

  if (tabCatalog) {
    tabCatalog.addEventListener("click", () => {
      showScreen("screen-catalog");
      renderCatalogo();
    });
  }

  // Acceso directo a Catálogo desde Pantalla Intro
  const btnGotoCatalog = document.getElementById("btn-goto-catalog");
  if (btnGotoCatalog) {
    btnGotoCatalog.addEventListener("click", () => {
      showScreen("screen-catalog");
      renderCatalogo();
      const input = document.getElementById("catalog-search-input");
      if (input) input.focus();
    });
  }

  // Agregar más productos desde Pantalla de Resultados
  const btnResultsAddMore = document.getElementById("btn-results-add-more");
  if (btnResultsAddMore) {
    btnResultsAddMore.addEventListener("click", () => {
      showScreen("screen-catalog");
      renderCatalogo();
      const input = document.getElementById("catalog-search-input");
      if (input) input.focus();
    });
  }

  // Buscador en tiempo real
  const searchInput = document.getElementById("catalog-search-input");
  const btnClearSearch = document.getElementById("btn-clear-search");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      state.catalogSearchTerm = e.target.value;
      if (btnClearSearch) {
        btnClearSearch.classList.toggle("hidden", !e.target.value.trim());
      }
      renderCatalogo();
    });
  }

  if (btnClearSearch) {
    btnClearSearch.addEventListener("click", () => {
      if (searchInput) {
        searchInput.value = "";
        state.catalogSearchTerm = "";
        btnClearSearch.classList.add("hidden");
        searchInput.focus();
        renderCatalogo();
      }
    });
  }

  // Filtros de Categoría (Pills)
  document.querySelectorAll(".filter-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      document.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      state.catalogFilter = pill.getAttribute("data-filter") || "all";
      renderCatalogo();
    });
  });

  // Pantalla Intro -> Quiz
  document.getElementById("btn-start-quiz").addEventListener("click", () => {
    state.currentQuestionIndex = 0;
    renderPregunta(0);
    showScreen("screen-quiz");
  });

  // Quiz Anterior
  document.getElementById("btn-quiz-prev").addEventListener("click", () => {
    if (state.currentQuestionIndex > 0) {
      state.currentQuestionIndex--;
      renderPregunta(state.currentQuestionIndex);
    } else {
      showScreen("screen-intro");
    }
  });

  // Quiz Siguiente
  document.getElementById("btn-quiz-next").addEventListener("click", () => {
    if (state.currentQuestionIndex < QUIZ_QUESTIONS.length - 1) {
      state.currentQuestionIndex++;
      renderPregunta(state.currentQuestionIndex);
    } else {
      iniciarDiagnostico();
    }
  });

  // Reiniciar Diagnóstico
  document.getElementById("btn-restart-quiz").addEventListener("click", () => {
    state.answers = { patron: null, raiz: null, quimico: null, objetivo: null };
    showScreen("screen-intro");
  });

  // Modal Cerrar
  document.getElementById("btn-close-modal").addEventListener("click", cerrarModal);
  document.getElementById("product-modal").addEventListener("click", (e) => {
    if (e.target.id === "product-modal") cerrarModal();
  });

  // Botón WhatsApp Checkout
  document.getElementById("btn-whatsapp-checkout").addEventListener("click", enviarPedidoWhatsApp);
}

// -------------------------------------------------------------
// RENDERIZADO DEL CUESTIONARIO
// -------------------------------------------------------------
function renderPregunta(index) {
  const q = QUIZ_QUESTIONS[index];
  const total = QUIZ_QUESTIONS.length;

  // Actualizar indicadores
  document.getElementById("quiz-step-indicator").textContent = `Paso ${index + 1} de ${total}`;
  document.getElementById("quiz-progress-fill").style.width = `${((index + 1) / total) * 100}%`;
  document.getElementById("question-category").textContent = q.category;
  document.getElementById("question-title").textContent = q.title;
  document.getElementById("question-subtitle").textContent = q.subtitle;

  // Renderizar tarjetas de opciones
  const container = document.getElementById("options-container");
  container.innerHTML = "";

  const valorActual = state.answers[q.key];

  q.options.forEach(opt => {
    const isSelected = valorActual === opt.id;
    const card = document.createElement("div");
    card.className = `option-card ${isSelected ? "selected" : ""}`;
    card.innerHTML = `
      <div class="option-icon">${opt.icon}</div>
      <div class="option-text">
        <strong>${opt.title}</strong>
        <p>${opt.desc}</p>
      </div>
    `;

    card.addEventListener("click", () => {
      state.answers[q.key] = opt.id;
      // Actualizar estilo visual
      container.querySelectorAll(".option-card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      document.getElementById("btn-quiz-next").removeAttribute("disabled");

      // Auto-avance suave después de 300ms para mayor fluidez
      setTimeout(() => {
        if (state.currentQuestionIndex < QUIZ_QUESTIONS.length - 1) {
          state.currentQuestionIndex++;
          renderPregunta(state.currentQuestionIndex);
        } else {
          iniciarDiagnostico();
        }
      }, 350);
    });

    container.appendChild(card);
  });

  // Estado del botón siguiente
  const btnNext = document.getElementById("btn-quiz-next");
  if (valorActual) {
    btnNext.removeAttribute("disabled");
  } else {
    btnNext.setAttribute("disabled", "true");
  }
}

// -------------------------------------------------------------
// MOTOR DE DIAGNÓSTICO Y TRANSICIÓN
// -------------------------------------------------------------
function iniciarDiagnostico() {
  showScreen("screen-loading");

  // Simular análisis visual y secuencial de salón de belleza
  const ch1 = document.getElementById("check-1");
  const ch2 = document.getElementById("check-2");
  const ch3 = document.getElementById("check-3");

  ch1.classList.remove("active");
  ch2.classList.remove("active");
  ch3.classList.remove("active");

  setTimeout(() => ch1.classList.add("active"), 350);
  setTimeout(() => ch2.classList.add("active"), 750);
  setTimeout(() => ch3.classList.add("active"), 1100);

  setTimeout(() => {
    calcularRecomendaciones();
    renderResultados();
    showScreen("screen-results");
  }, 1500);
}

// -------------------------------------------------------------
// CÁLCULO DE RUTINA PERSONALIZADA
// -------------------------------------------------------------
function calcularRecomendaciones() {
  const { patron, quimico, objetivo } = state.answers;
  const items = [];

  // Paso 1: Selección inteligente del Shampoo
  let shampooId = "LOR-0004"; // Default: Absolut Repair Quinoa
  if (quimico === "decolorado" || objetivo === "color_brillo") {
    // Si tiene mechas/decoloración o busca realzar rubios -> Blondifier o Vitamino
    const blondifier = state.catalog.find(p => p.id === "LOR-0068" && p.nombre.includes("Blondifier"));
    if (blondifier && quimico === "decolorado") {
      shampooId = "LOR-0068_BLOND";
    } else {
      shampooId = "LOR-0003"; // Vitamino Color Resveratrol
    }
  } else if (quimico === "tinturado") {
    shampooId = "LOR-0003"; // Vitamino Color Resveratrol
  }

  // Buscar productos en el catálogo
  const shampoo = state.catalog.find(p => {
    if (shampooId === "LOR-0068_BLOND") return p.id === "LOR-0068" && p.nombre.includes("Blondifier");
    return p.id === shampooId;
  }) || state.catalog.find(p => p.paso.includes("Shampoo"));

  // Paso 2: Acondicionador Inforcer B6 + Biotin
  const acondicionador = state.catalog.find(p => p.id === "LOR-0005") || state.catalog.find(p => p.paso.includes("Acondicionador"));

  // Paso 3: Máscara Absolut Repair Quinoa
  const mascara = state.catalog.find(p => p.id === "LOR-0021") || state.catalog.find(p => p.paso.includes("Máscara"));

  // Paso 4: Leave-in Spray 10 en 1 Absolut Repair
  const leaveIn = state.catalog.find(p => p.id === "LOR-0068" && p.nombre.includes("Spray")) || state.catalog.find(p => p.paso.includes("Leave-in"));

  if (shampoo) items.push({ ...shampoo, rutinaStep: "Paso 1 • Limpieza & Preparación" });
  if (acondicionador) items.push({ ...acondicionador, rutinaStep: "Paso 2 • Desenredo & Anti-Quiebre" });
  if (mascara) items.push({ ...mascara, rutinaStep: "Paso 3 • Reparación Intensiva Semanal" });
  if (leaveIn) items.push({ ...leaveIn, rutinaStep: "Paso 4 • Termoprotección & Brillo" });

  state.recommendedProducts = items;

  // Inicializar carrito con 1 unidad por cada producto recomendado
  state.cart = {};
  items.forEach(p => {
    const key = p.id + "_" + p.formato;
    state.cart[key] = {
      product: p,
      quantity: 1,
      selected: true
    };
  });
}

// -------------------------------------------------------------
// RENDERIZADO DE RESULTADOS & PRODUCTOS
// -------------------------------------------------------------
function renderResultados() {
  const container = document.getElementById("products-list");
  container.innerHTML = "";

  // Resumen del perfil capilar detectado
  const profileSummary = document.getElementById("profile-summary-text");
  const perfilDesc = [];
  if (state.answers.quimico === "decolorado") perfilDesc.push("Decolorado / Mechas");
  else if (state.answers.quimico === "tinturado") perfilDesc.push("Color Protegido");
  else perfilDesc.push("Fibra Natural");

  if (state.answers.objetivo === "reparacion") perfilDesc.push("Reparación Profunda");
  else if (state.answers.objetivo === "color_brillo") perfilDesc.push("Brillo & Resplandor");
  else perfilDesc.push("Fuerza & Anti-Quiebre");

  profileSummary.textContent = `Perfil detectado: ${perfilDesc.join(" • ")}`;

  // Renderizar tarjetas de la rutina
  state.recommendedProducts.forEach(prod => {
    const key = prod.id + "_" + prod.formato;
    const cartItem = state.cart[key] || { quantity: 1, selected: true };

    const card = document.createElement("article");
    card.className = `product-card ${cartItem.selected ? "in-cart" : ""}`;
    card.id = `card-${key}`;

    // Badge de Escasez / Stock
    let stockBadgeHtml = "";
    if (prod.stock === 1) {
      stockBadgeHtml = `<span class="badge-scarcity urgent">🔥 ¡Última unidad en bodega!</span>`;
    } else if (prod.stock <= 3) {
      stockBadgeHtml = `<span class="badge-scarcity limited">⚡ Solo ${prod.stock} disponibles</span>`;
    } else {
      stockBadgeHtml = `<span class="badge-scarcity limited">✓ Stock: ${prod.stock} unidades</span>`;
    }

    card.innerHTML = `
      <div class="routine-step-tag">
        <span class="step-label">${prod.rutinaStep}</span>
        <span class="step-line-name">${prod.linea}</span>
      </div>
      
      <div class="card-content">
        <div class="img-container" data-action="details" data-key="${key}">
          <img src="${prod.foto}" alt="${prod.nombre}" loading="lazy">
        </div>
        <div class="product-info">
          <div class="title-wrap" data-action="details" data-key="${key}">
            <h4 class="product-name">${prod.titulo_comercial || prod.nombre}</h4>
            <span class="product-format">Formato: ${prod.formato}</span>
          </div>

          <div class="badges-wrap">
            ${stockBadgeHtml}
          </div>

          <div class="price-container">
            <span class="price-main">${formatCLP(prod.precio_venta)}</span>
            ${prod.precio_mercado ? `<span class="price-ref">Ref. ${formatCLP(prod.precio_mercado)}</span>` : ""}
          </div>
        </div>
      </div>

      <div class="card-actions">
        <label class="toggle-btn">
          <input type="checkbox" id="check-${key}" ${cartItem.selected ? "checked" : ""}>
          <span>${cartItem.selected ? "Incluido en rutina" : "Agregar a rutina"}</span>
        </label>

        <div class="qty-stepper" id="stepper-${key}" style="${cartItem.selected ? "" : "opacity: 0.3; pointer-events: none;"}">
          <button class="btn-qty" type="button" data-action="dec" data-key="${key}" ${cartItem.quantity <= 1 ? "disabled" : ""}>−</button>
          <span class="qty-val" id="qty-val-${key}">${cartItem.quantity}</span>
          <button class="btn-qty" type="button" data-action="inc" data-key="${key}" ${cartItem.quantity >= prod.stock ? "disabled" : ""}>+</button>
        </div>

        <button class="btn-details" type="button" data-action="details" data-key="${key}">Ver detalles</button>
      </div>
    `;

    // Eventos de la tarjeta
    card.querySelectorAll('[data-action="details"]').forEach(el => {
      el.addEventListener("click", () => abrirModal(prod, key));
    });

    const checkbox = card.querySelector(`#check-${key}`);
    checkbox.addEventListener("change", (e) => {
      state.cart[key].selected = e.target.checked;
      card.classList.toggle("in-cart", e.target.checked);
      card.querySelector(".toggle-btn span").textContent = e.target.checked ? "Incluido en rutina" : "Agregar a rutina";
      card.querySelector(`#stepper-${key}`).style.opacity = e.target.checked ? "1" : "0.3";
      card.querySelector(`#stepper-${key}`).style.pointerEvents = e.target.checked ? "auto" : "none";
      actualizarBarraCheckout();
    });

    // Control de Cantidades [+] y [-]
    const btnDec = card.querySelector('[data-action="dec"]');
    const btnInc = card.querySelector('[data-action="inc"]');

    btnDec.addEventListener("click", () => {
      if (state.cart[key].quantity > 1) {
        state.cart[key].quantity--;
        actualizarStepper(key, prod);
        actualizarBarraCheckout();
      }
    });

    btnInc.addEventListener("click", () => {
      if (state.cart[key].quantity < prod.stock) {
        state.cart[key].quantity++;
        actualizarStepper(key, prod);
        actualizarBarraCheckout();
      }
    });

    container.appendChild(card);
  });

  actualizarBarraCheckout();
}

// -------------------------------------------------------------
// ACTUALIZACIÓN DE CONTROLES DE CANTIDAD
// -------------------------------------------------------------
function actualizarStepper(key, prod) {
  const item = state.cart[key];
  if (!item) return;
  const qtyLabel = document.getElementById(`qty-val-${key}`);
  const card = document.getElementById(`card-${key}`);
  if (qtyLabel) qtyLabel.textContent = item.quantity;

  if (card) {
    const btnDec = card.querySelector('[data-action="dec"]');
    const btnInc = card.querySelector('[data-action="inc"]');
    if (btnDec) btnDec.disabled = item.quantity <= 1;
    if (btnInc) btnInc.disabled = item.quantity >= prod.stock;
  }
}

// -------------------------------------------------------------
// RENDERIZADO DEL CATÁLOGO COMPLETO Y BÚSQUEDA EN TIEMPO REAL
// -------------------------------------------------------------
function normalizarTexto(txt) {
  return (txt || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function renderCatalogo() {
  const container = document.getElementById("catalog-products-list");
  if (!container) return;

  const searchRaw = state.catalogSearchTerm || "";
  const search = normalizarTexto(searchRaw);
  const filter = state.catalogFilter || "all";

  // Filtrado
  const filtrados = state.catalog.filter(prod => {
    // 1. Filtro por Categoría
    if (filter !== "all") {
      const nombreNorm = normalizarTexto(prod.nombre + " " + (prod.titulo_comercial || ""));
      const pasoNorm = normalizarTexto(prod.paso || "");
      if (filter === "shampoo") {
        if (!nombreNorm.includes("shampoo") && !pasoNorm.includes("shampoo")) return false;
      } else if (filter === "acondicionador") {
        if (!nombreNorm.includes("acondicionador") && !pasoNorm.includes("acondicionador") && !nombreNorm.includes("aco_")) return false;
      } else if (filter === "mascara") {
        if (!nombreNorm.includes("mascara") && !pasoNorm.includes("mascara")) return false;
      } else if (filter === "tratamiento") {
        const esTratamiento = nombreNorm.includes("aceite") || nombreNorm.includes("serum") || nombreNorm.includes("crema") || nombreNorm.includes("ampolla") || nombreNorm.includes("pro-fiber") || nombreNorm.includes("re-create") || nombreNorm.includes("reconstruct") || nombreNorm.includes("step-3");
        if (!esTratamiento) return false;
      } else if (filter === "peinado") {
        const esPeinado = nombreNorm.includes("spray") || nombreNorm.includes("gel") || nombreNorm.includes("laca") || nombreNorm.includes("fijacion") || nombreNorm.includes("infinium") || nombreNorm.includes("tecni");
        if (!esPeinado) return false;
      }
    }

    // 2. Filtro por Término de Búsqueda
    if (search) {
      const haystack = normalizarTexto(
        `${prod.nombre} ${prod.titulo_comercial || ""} ${prod.linea} ${prod.formato} ${prod.resena || ""} ${prod.necesidad || ""}`
      );
      const palabras = search.split(/\s+/).filter(Boolean);
      const coincide = palabras.every(p => haystack.includes(p));
      if (!coincide) return false;
    }

    return true;
  });

  // Actualizar meta info
  const countEl = document.getElementById("catalog-count-text");
  if (countEl) {
    if (search || filter !== "all") {
      countEl.textContent = `Encontrados ${filtrados.length} de ${state.catalog.length} productos`;
    } else {
      countEl.textContent = `Mostrando ${filtrados.length} productos en stock`;
    }
  }

  container.innerHTML = "";

  if (filtrados.length === 0) {
    container.innerHTML = `
      <div class="no-results-box">
        <div class="no-results-icon">🔍</div>
        <h4>No encontramos productos para "${searchRaw}"</h4>
        <p>Prueba buscando por línea (ej: <strong>Inforcer, Absolut, Vitamino</strong>) o limpia el filtro para ver todo el stock.</p>
      </div>
    `;
    return;
  }

  filtrados.forEach(prod => {
    const key = prod.id + "_" + prod.formato;
    const cartItem = state.cart[key] || { product: prod, quantity: 1, selected: false };

    const card = document.createElement("article");
    card.className = `product-card ${cartItem.selected ? "in-cart" : ""}`;
    card.id = `catalog-card-${key}`;

    let stockBadgeHtml = "";
    if (prod.stock === 1) {
      stockBadgeHtml = `<span class="badge-scarcity urgent">🔥 ¡Última unidad en bodega!</span>`;
    } else if (prod.stock <= 3) {
      stockBadgeHtml = `<span class="badge-scarcity limited">⚡ Solo ${prod.stock} disponibles</span>`;
    } else {
      stockBadgeHtml = `<span class="badge-scarcity limited">✓ Stock: ${prod.stock} un.</span>`;
    }

    card.innerHTML = `
      <div class="routine-step-tag">
        <span class="step-label">${prod.linea.toUpperCase()}</span>
        <span class="step-line-name">${prod.formato}</span>
      </div>
      
      <div class="card-content">
        <div class="img-container" data-action="details" data-key="${key}">
          <img src="${prod.foto}" alt="${prod.nombre}" loading="lazy" onerror="this.style.opacity='0.5'">
        </div>
        <div class="product-info">
          <div class="title-wrap" data-action="details" data-key="${key}">
            <h4 class="product-name">${prod.titulo_comercial || prod.nombre}</h4>
            <span class="product-format">Línea: ${prod.linea} • Formato: ${prod.formato}</span>
          </div>

          <div class="badges-wrap">
            ${stockBadgeHtml}
          </div>

          <div class="price-container">
            <span class="price-main">${formatCLP(prod.precio_venta)}</span>
            ${prod.precio_mercado ? `<span class="price-ref">Ref. ${formatCLP(prod.precio_mercado)}</span>` : ""}
          </div>
        </div>
      </div>

      <div class="card-actions">
        <label class="toggle-btn">
          <input type="checkbox" id="cat-check-${key}" ${cartItem.selected ? "checked" : ""}>
          <span>${cartItem.selected ? "Agregado al pedido ✓" : "+ Agregar al pedido"}</span>
        </label>

        <div class="qty-stepper" id="cat-stepper-${key}" style="${cartItem.selected ? "" : "opacity: 0.3; pointer-events: none;"}">
          <button class="btn-qty" type="button" data-action="cat-dec" data-key="${key}" ${cartItem.quantity <= 1 ? "disabled" : ""}>−</button>
          <span class="qty-val" id="cat-qty-val-${key}">${cartItem.quantity}</span>
          <button class="btn-qty" type="button" data-action="cat-inc" data-key="${key}" ${cartItem.quantity >= prod.stock ? "disabled" : ""}>+</button>
        </div>

        <button class="btn-details" type="button" data-action="details" data-key="${key}">Ver detalles</button>
      </div>
    `;

    // Modal de detalles
    card.querySelectorAll('[data-action="details"]').forEach(el => {
      el.addEventListener("click", () => abrirModal(prod, key));
    });

    // Toggle Checkbox
    const checkbox = card.querySelector(`#cat-check-${key}`);
    checkbox.addEventListener("change", (e) => {
      const isChecked = e.target.checked;
      if (!state.cart[key]) {
        state.cart[key] = { product: prod, quantity: 1, selected: isChecked };
      } else {
        state.cart[key].selected = isChecked;
      }
      card.classList.toggle("in-cart", isChecked);
      card.querySelector(".toggle-btn span").textContent = isChecked ? "Agregado al pedido ✓" : "+ Agregar al pedido";
      const stepper = card.querySelector(`#cat-stepper-${key}`);
      if (stepper) {
        stepper.style.opacity = isChecked ? "1" : "0.3";
        stepper.style.pointerEvents = isChecked ? "auto" : "none";
      }

      // Sincronizar si también existe en la pantalla de rutina
      const rutinaCheck = document.getElementById(`check-${key}`);
      if (rutinaCheck) {
        rutinaCheck.checked = isChecked;
        const rutinaCard = document.getElementById(`card-${key}`);
        if (rutinaCard) {
          rutinaCard.classList.toggle("in-cart", isChecked);
          rutinaCard.querySelector(".toggle-btn span").textContent = isChecked ? "Incluido en rutina" : "Agregar a rutina";
        }
      }

      actualizarBarraCheckout();
    });

    // Stepper decrementar
    const btnDec = card.querySelector('[data-action="cat-dec"]');
    btnDec.addEventListener("click", () => {
      if (state.cart[key] && state.cart[key].quantity > 1) {
        state.cart[key].quantity--;
        actualizarStepperCatalogo(key, prod);
        actualizarBarraCheckout();
      }
    });

    // Stepper incrementar
    const btnInc = card.querySelector('[data-action="cat-inc"]');
    btnInc.addEventListener("click", () => {
      if (!state.cart[key]) {
        state.cart[key] = { product: prod, quantity: 1, selected: true };
      }
      if (state.cart[key].quantity < prod.stock) {
        state.cart[key].quantity++;
        actualizarStepperCatalogo(key, prod);
        actualizarBarraCheckout();
      }
    });

    container.appendChild(card);
  });
}

function actualizarStepperCatalogo(key, prod) {
  const item = state.cart[key];
  if (!item) return;

  const qtyLabel = document.getElementById(`cat-qty-val-${key}`);
  const card = document.getElementById(`catalog-card-${key}`);
  if (qtyLabel) qtyLabel.textContent = item.quantity;

  if (card) {
    const btnDec = card.querySelector('[data-action="cat-dec"]');
    const btnInc = card.querySelector('[data-action="cat-inc"]');
    if (btnDec) btnDec.disabled = item.quantity <= 1;
    if (btnInc) btnInc.disabled = item.quantity >= prod.stock;
  }

  // Sincronizar stepper de rutina si existe
  actualizarStepper(key, prod);
}

// -------------------------------------------------------------
// BARRA DE CHECKOUT FLOTANTE
// -------------------------------------------------------------
function actualizarBarraCheckout() {
  let totalProductos = 0;
  let totalCLP = 0;

  Object.values(state.cart).forEach(item => {
    if (item.selected) {
      totalProductos += item.quantity;
      totalCLP += item.quantity * item.product.precio_venta;
    }
  });

  const cartCountEl = document.getElementById("cart-items-count");
  if (cartCountEl) {
    cartCountEl.textContent = `${totalProductos} ${totalProductos === 1 ? "producto seleccionado" : "productos seleccionados"}`;
  }
  const cartPriceEl = document.getElementById("cart-total-price");
  if (cartPriceEl) {
    cartPriceEl.textContent = formatCLP(totalCLP);
  }

  const btnCheckout = document.getElementById("btn-whatsapp-checkout");
  if (btnCheckout) {
    if (totalProductos === 0) {
      btnCheckout.setAttribute("disabled", "true");
      btnCheckout.style.opacity = "0.5";
    } else {
      btnCheckout.removeAttribute("disabled");
      btnCheckout.style.opacity = "1";
    }
  }

  const stickyCart = document.getElementById("sticky-cart-bar");
  if (stickyCart) {
    if (state.currentScreen === "screen-results" || (state.currentScreen === "screen-catalog" && totalProductos > 0)) {
      stickyCart.classList.remove("hidden");
    } else {
      stickyCart.classList.add("hidden");
    }
  }
}

// -------------------------------------------------------------
// MODAL DE DETALLES
// -------------------------------------------------------------
function abrirModal(prod, key) {
  const modal = document.getElementById("product-modal");
  document.getElementById("modal-img").src = prod.foto;
  document.getElementById("modal-img").alt = prod.nombre;
  document.getElementById("modal-line").textContent = prod.linea;
  document.getElementById("modal-title").textContent = prod.titulo_comercial || prod.nombre;
  document.getElementById("modal-format").textContent = `Formato profesional: ${prod.formato} • Stock: ${prod.stock} un.`;
  document.getElementById("modal-price").textContent = formatCLP(prod.precio_venta);
  document.getElementById("modal-market-range").textContent = prod.rango_mercado ? `Precio mercado: ${prod.rango_mercado}` : "";

  // Separar descripción y modo de uso si vienen juntos en la reseña
  const resena = prod.resena || "";
  let descText = resena;
  let usageText = "";

  if (resena.includes("MODO DE USO:")) {
    const parts = resena.split("MODO DE USO:");
    descText = parts[0].trim();
    usageText = parts[1].trim();
  }

  document.getElementById("modal-description").textContent = descText;
  const usageSection = document.getElementById("modal-usage-section");
  if (usageText) {
    document.getElementById("modal-usage").textContent = usageText;
    usageSection.style.display = "block";
  } else {
    usageSection.style.display = "none";
  }

  // Botón de incluir en pedido
  const btnModalAdd = document.getElementById("btn-modal-add");
  const isSelected = state.cart[key] && state.cart[key].selected;
  btnModalAdd.textContent = isSelected ? "Ya está en tu pedido ✓" : "Incluir en mi Pedido";

  btnModalAdd.onclick = () => {
    if (!state.cart[key]) {
      state.cart[key] = { product: prod, quantity: 1, selected: true };
    } else {
      state.cart[key].selected = true;
    }

    // Sincronizar tarjeta en rutina si existe
    const checkbox = document.getElementById(`check-${key}`);
    if (checkbox) checkbox.checked = true;
    const card = document.getElementById(`card-${key}`);
    if (card) {
      card.classList.add("in-cart");
      card.querySelector(".toggle-btn span").textContent = "Incluido en rutina";
      const st = card.querySelector(`#stepper-${key}`);
      if (st) {
        st.style.opacity = "1";
        st.style.pointerEvents = "auto";
      }
    }

    // Sincronizar tarjeta en catálogo si existe
    const catCheck = document.getElementById(`cat-check-${key}`);
    if (catCheck) catCheck.checked = true;
    const catCard = document.getElementById(`catalog-card-${key}`);
    if (catCard) {
      catCard.classList.add("in-cart");
      catCard.querySelector(".toggle-btn span").textContent = "Agregado al pedido ✓";
      const stCat = catCard.querySelector(`#cat-stepper-${key}`);
      if (stCat) {
        stCat.style.opacity = "1";
        stCat.style.pointerEvents = "auto";
      }
    }

    actualizarBarraCheckout();
    cerrarModal();
  };

  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function cerrarModal() {
  const modal = document.getElementById("product-modal");
  modal.classList.add("hidden");
  document.body.style.overflow = "";
}

// -------------------------------------------------------------
// CHECKOUT: ENVIAR PEDIDO POR WHATSAPP
// -------------------------------------------------------------
function enviarPedidoWhatsApp() {
  const itemsSeleccionados = Object.values(state.cart).filter(item => item.selected);

  if (itemsSeleccionados.length === 0) {
    alert("Por favor selecciona al menos un producto para coordinar tu pedido.");
    return;
  }

  let totalCLP = 0;
  let lineasProductos = "";

  itemsSeleccionados.forEach(item => {
    const subtotal = item.quantity * item.product.precio_venta;
    totalCLP += subtotal;
    const nombre = item.product.titulo_comercial || item.product.nombre;
    lineasProductos += `• ${item.quantity}x ${nombre} (${item.product.formato}) - ${formatCLP(subtotal)}\n`;
  });

  // Resumen del diagnóstico si se realizó
  const tieneDiagnostico = state.answers.patron || state.answers.raiz || state.answers.quimico || state.answers.objetivo;
  const diagnosticoTxt = tieneDiagnostico
    ? `Textura: ${state.answers.patron || "Natural"} | Raíz: ${state.answers.raiz || "Normal"} | Proceso: ${state.answers.quimico || "Normal"}`
    : "Pedido directo desde Catálogo";

  const saludo = tieneDiagnostico
    ? `¡Hola! Acabo de completar el diagnóstico capilar L'Oréal Professionnel en la web y me gustaría reservar los siguientes productos de mi rutina:`
    : `¡Hola! Estuve revisando el catálogo online de L'Oréal Professionnel y me gustaría reservar los siguientes productos:`;

  const mensaje =
    `${saludo}

📋 PRODUCTOS SELECCIONADOS:
${lineasProductos}
💰 TOTAL A PAGAR: ${formatCLP(totalCLP)}

✨ (${tieneDiagnostico ? `Perfil diagnosticado: ${diagnosticoTxt}` : diagnosticoTxt})

¿Tienen disponibilidad en bodega para coordinar la entrega / despacho y los datos de transferencia? ¡Muchas gracias!`;

  const phone = CONFIG.WHATSAPP_PHONE.replace(/\D/g, "");
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(mensaje)}`;

  // Abrir WhatsApp en nueva pestaña o aplicación nativa del teléfono
  window.open(url, "_blank");
}
