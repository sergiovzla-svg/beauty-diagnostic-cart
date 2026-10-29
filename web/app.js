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
  customerName: "",
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
// NOTIFICACIONES TOAST LUXURY (FEEDBACK ELEGANTE)
// -------------------------------------------------------------
function showToast(mensaje, tipo = "warning", duration = 3500) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `luxury-toast toast-${tipo}`;

  let icon = "⚠️";
  if (tipo === "success") icon = "✨";
  if (tipo === "info") icon = "ℹ️";

  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message">${mensaje}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("hide");
    setTimeout(() => toast.remove(), 280);
  }, duration);
}

// -------------------------------------------------------------
// PERSISTENCIA EN LOCALSTORAGE (CARRITO Y PERFIL)
// -------------------------------------------------------------
function saveCartToStorage() {
  try {
    const toSave = {};
    Object.entries(state.cart).forEach(([key, item]) => {
      if (item && item.product) {
        toSave[key] = {
          id: item.product.id,
          formato: item.product.formato,
          quantity: item.quantity,
          selected: item.selected,
          fromRoutine: Boolean(item.fromRoutine)
        };
      }
    });
    localStorage.setItem("loreal_cart_v1", JSON.stringify(toSave));
    if (state.customerName) {
      localStorage.setItem("loreal_customer_name", state.customerName);
    }
    if (state.answers && Object.values(state.answers).some(Boolean)) {
      localStorage.setItem("loreal_quiz_answers", JSON.stringify(state.answers));
    }
  } catch (e) {
    console.warn("No se pudo guardar el carrito en almacenamiento local:", e);
  }
}

function loadCartFromStorage() {
  try {
    const savedName = localStorage.getItem("loreal_customer_name");
    if (savedName) state.customerName = savedName;

    const savedAnswers = localStorage.getItem("loreal_quiz_answers");
    if (savedAnswers) {
      try {
        state.answers = JSON.parse(savedAnswers);
      } catch (err) {}
    }

    const savedCart = localStorage.getItem("loreal_cart_v1");
    if (savedCart) {
      const parsed = JSON.parse(savedCart);
      state.cart = {};
      Object.entries(parsed).forEach(([key, item]) => {
        const prod = state.catalog.find(p => p.id === item.id && p.formato === item.formato)
                  || state.catalog.find(p => p.id === item.id);
        if (prod && prod.stock > 0) {
          const qty = Math.min(Math.max(1, item.quantity || 1), prod.stock);
          state.cart[key] = {
            product: prod,
            quantity: qty,
            selected: item.selected !== false,
            fromRoutine: Boolean(item.fromRoutine)
          };
        }
      });
    }
  } catch (e) {
    console.warn("No se pudo restaurar el carrito:", e);
  }
}

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
// CATEGORIZACIÓN DE PRODUCTOS POR TIPO COMERCIAL
// -------------------------------------------------------------
function getCategoryInfo(product) {
  const linea = (product.linea || "").toLowerCase().trim();

  if (linea.startsWith("tecni") || linea === "infinium pure") {
    return {
      category: "estilismo",
      label: "Estilismo",
      badge: "✂️ Estilismo Profesional",
      color: "#8B5CF6"
    };
  }
  if (linea === "smartbond") {
    return {
      category: "complemento",
      label: "Tratamiento Técnico",
      badge: "🔬 Post-Química",
      color: "#0EA5E9",
      tip: "Ideal si realizas decoloraciones o tinturas"
    };
  }
  if (linea === "bed head") {
    return {
      category: "complemento",
      label: "Complemento",
      badge: "💧 Leave-in",
      color: "#0EA5E9"
    };
  }
  if (linea === "american crew") {
    return {
      category: "para-ellos",
      label: "Para Ellos",
      badge: "👔 Para Ellos · Regalo Ideal",
      color: "#F59E0B"
    };
  }
  return { category: "cuidado", label: "Cuidado Capilar", badge: null, color: null };
}

// -------------------------------------------------------------
// RENDERIZADO DE TARJETAS COMPACTAS (BANNER FLASH & COMPLEMENTOS)
// -------------------------------------------------------------
function renderCompactCards(products, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";

  products.forEach(prod => {
    const key = prod.id + "_" + prod.formato;
    const catInfo = getCategoryInfo(prod);
    const cartItem = state.cart[key];
    const isSelected = cartItem && cartItem.selected;

    const badgeHTML = catInfo.badge
      ? `<span class="product-category-badge" style="background:${catInfo.color}20; color:${catInfo.color}; border:1px solid ${catInfo.color}40;">${catInfo.badge}</span>`
      : "";
    const tipHTML = catInfo.tip
      ? `<small class="product-category-tip">${catInfo.tip}</small>`
      : "";

    const isAgotado = (prod.stock || 0) <= 0;
    const card = document.createElement("article");
    card.className = `compact-card ${isSelected ? "in-cart" : ""} ${isAgotado ? "is-soldout" : ""}`;
    card.id = `${containerId}-card-${key}`;

    const actionBtnHtml = isAgotado
      ? `<button class="compact-action-btn soldout" type="button" disabled>🚫 Reservado</button>`
      : `<button class="compact-action-btn ${isSelected ? "added" : ""}" type="button" data-action="toggle" data-key="${key}">
          ${isSelected ? "En pedido ✓" : "+ Agregar"}
        </button>`;

    card.innerHTML = `
      <div class="compact-img-wrap" data-action="details" data-key="${key}">
        <img src="${prod.foto}" alt="${prod.nombre}" loading="lazy" onerror="this.style.opacity='0.5'">
      </div>
      <div class="compact-info">
        ${badgeHTML}
        <h4 class="compact-name" data-action="details" data-key="${key}">${prod.titulo_comercial || prod.nombre}</h4>
        <span class="compact-format">${prod.formato}</span>
        ${tipHTML}
        <div class="compact-price-wrap">
          <span class="compact-price">${formatCLP(prod.precio_venta)}</span>
          ${prod.precio_mercado ? `<span class="compact-ref">Ref. ${formatCLP(prod.precio_mercado)}</span>` : ""}
        </div>
        ${actionBtnHtml}
      </div>
    `;

    // Click en imagen o nombre para modal de detalles
    card.querySelectorAll('[data-action="details"]').forEach(el => {
      el.addEventListener("click", () => abrirModal(prod, key));
    });

    // Toggle para agregar/quitar del pedido
    const btnToggle = card.querySelector('[data-action="toggle"]');
    if (btnToggle) {
      btnToggle.addEventListener("click", () => {
      if (!state.cart[key]) {
        state.cart[key] = { product: prod, quantity: 1, selected: true };
      } else {
        state.cart[key].selected = !state.cart[key].selected;
      }
      const nowSelected = state.cart[key].selected;
      card.classList.toggle("in-cart", nowSelected);
      btnToggle.classList.toggle("added", nowSelected);
      btnToggle.textContent = nowSelected ? "En pedido ✓" : "+ Agregar";

      // Sincronizar catálogo si existe
      const catCheck = document.getElementById(`cat-check-${key}`);
      if (catCheck) {
        catCheck.checked = nowSelected;
        const catCard = document.getElementById(`catalog-card-${key}`);
        if (catCard) {
          catCard.classList.toggle("in-cart", nowSelected);
          catCard.querySelector(".toggle-btn span").textContent = nowSelected ? "Agregado al pedido ✓" : "+ Agregar al pedido";
          const st = catCard.querySelector(`#cat-stepper-${key}`);
          if (st) {
            st.style.opacity = nowSelected ? "1" : "0.3";
            st.style.pointerEvents = nowSelected ? "auto" : "none";
          }
        }
      }

      // Sincronizar rutina si existe
      const rutinaCheck = document.getElementById(`check-${key}`);
      if (rutinaCheck) {
        rutinaCheck.checked = nowSelected;
        const rutinaCard = document.getElementById(`card-${key}`);
        if (rutinaCard) {
          rutinaCard.classList.toggle("in-cart", nowSelected);
          rutinaCard.querySelector(".toggle-btn span").textContent = nowSelected ? "Incluido en rutina" : "Agregar a rutina";
        }
      }

      // Sincronizar otros compact cards si existen
      document.querySelectorAll(`.compact-card[id$="-card-${key}"]`).forEach(c => {
        c.classList.toggle("in-cart", nowSelected);
        const b = c.querySelector('[data-action="toggle"]');
        if (b) {
          b.classList.toggle("added", nowSelected);
          b.textContent = nowSelected ? "En pedido ✓" : "+ Agregar";
        }
      });

      actualizarBarraCheckout();
      if (nowSelected) {
        showToast(`✓ Agregado al pedido: ${prod.titulo_comercial || prod.nombre}`, "success", 2000);
      }
    });
    }

    container.appendChild(card);
  });
}

// -------------------------------------------------------------
// RENDERIZADO DEL BANNER HERO DE OFERTAS FLASH
// -------------------------------------------------------------
function renderFlashBanner() {
  const productosFlash = state.catalog.filter(p => getCategoryInfo(p).category !== "cuidado" && (p.stock || 0) > 0);
  renderCompactCards(productosFlash, "flash-offers-grid");
}

// -------------------------------------------------------------
// INICIALIZACIÓN
// -------------------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
  await cargarCatalogo();
  renderPregunta(0);
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
  const allFilterPill = document.querySelector('.filter-pill[data-filter="all"]');
  if (allFilterPill) allFilterPill.textContent = `Todos (${state.catalog.length})`;
  const btnGotoCatalog = document.getElementById("btn-goto-catalog");
  if (btnGotoCatalog) {
    const span = btnGotoCatalog.querySelector("span:first-child");
    if (span) span.textContent = `🔍 Buscar en Catálogo Completo (${state.catalog.length} productos)`;
  }

  // Restaurar carrito y sincronizar barra
  loadCartFromStorage();
  actualizarBarraCheckout();
  renderFlashBanner();
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
      } else if (state.currentScreen === "screen-quiz" || (state.answers && Object.values(state.answers).some(Boolean))) {
        renderPregunta(state.currentQuestionIndex || 0);
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
    });
  }

  // Banner Flash -> Ver Catálogo Completo
  const btnVerCatalogo = document.getElementById("btn-ver-catalogo-completo");
  if (btnVerCatalogo) {
    btnVerCatalogo.addEventListener("click", () => {
      showScreen("screen-catalog");
      renderCatalogo();
    });
  }

  // Agregar más productos desde Pantalla de Resultados
  const btnResultsAddMore = document.getElementById("btn-results-add-more");
  if (btnResultsAddMore) {
    btnResultsAddMore.addEventListener("click", () => {
      showScreen("screen-catalog");
      renderCatalogo();
    });
  }

  // Buscador en tiempo real
  const searchInput = document.getElementById("catalog-search-input");
  const btnClearSearch = document.getElementById("btn-clear-search");
  const catalogList = document.getElementById("catalog-products-list");

  const dismissSearchKeyboard = () => {
    if (searchInput && document.activeElement === searchInput) {
      searchInput.blur();
    }
  };

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      state.catalogSearchTerm = e.target.value;
      if (btnClearSearch) {
        btnClearSearch.classList.toggle("hidden", !e.target.value.trim());
      }
      renderCatalogo();
    });

    // Cerrar teclado virtual móvil al presionar "Buscar" o "Enter"
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        searchInput.blur();
      }
    });

    // Evento search nativo del navegador
    searchInput.addEventListener("search", () => {
      searchInput.blur();
    });
  }

  // Cerrar teclado automáticamente al deslizar o interactuar con el catálogo de resultados
  if (catalogList) {
    catalogList.addEventListener("touchstart", dismissSearchKeyboard, { passive: true });
    catalogList.addEventListener("touchmove", dismissSearchKeyboard, { passive: true });
  }

  // Cerrar teclado al hacer scroll vertical en la pantalla del catálogo
  window.addEventListener("scroll", () => {
    if (state.currentScreen === "screen-catalog") {
      dismissSearchKeyboard();
    }
  }, { passive: true });

  if (btnClearSearch) {
    btnClearSearch.addEventListener("click", () => {
      if (searchInput) {
        searchInput.value = "";
        state.catalogSearchTerm = "";
        btnClearSearch.classList.add("hidden");
        searchInput.blur();
        renderCatalogo();
      }
    });
  }

  // Filtros de Categoría (Pills)
  document.querySelectorAll(".filter-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      dismissSearchKeyboard();
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
    try {
      localStorage.removeItem("loreal_quiz_answers");
    } catch (e) {}
    // Desmarcar productos de la rutina anterior para no duplicar al formular otra
    if (state.recommendedProducts && state.recommendedProducts.length > 0) {
      state.recommendedProducts.forEach(p => {
        const key = p.id + "_" + p.formato;
        if (state.cart[key]) {
          state.cart[key].selected = false;
        }
      });
      state.recommendedProducts = [];
      saveCartToStorage();
      actualizarBarraCheckout();
    }
    showToast("Diagnóstico reiniciado. Puedes volver a formular tu rutina.", "info", 2500);
    showScreen("screen-intro");
  });

  // Modal Cerrar
  document.getElementById("btn-close-modal").addEventListener("click", cerrarModal);
  document.getElementById("product-modal").addEventListener("click", (e) => {
    if (e.target.id === "product-modal") cerrarModal();
  });

  // Modal de Nombre Checkout (WhatsApp)
  const btnCloseNameModal = document.getElementById("btn-close-name-modal");
  if (btnCloseNameModal) btnCloseNameModal.addEventListener("click", cerrarModalNombre);

  const nameModalBackdrop = document.getElementById("checkout-name-modal");
  if (nameModalBackdrop) {
    nameModalBackdrop.addEventListener("click", (e) => {
      if (e.target.id === "checkout-name-modal") cerrarModalNombre();
    });
  }

  const btnConfirmName = document.getElementById("btn-confirm-name-whatsapp");
  const nameInput = document.getElementById("customer-name-input");
  if (btnConfirmName && nameInput) {
    btnConfirmName.addEventListener("click", () => {
      confirmarNombreYPedir(nameInput.value);
    });

    nameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        confirmarNombreYPedir(nameInput.value);
      }
    });
  }

  const btnSkipName = document.getElementById("btn-skip-name");
  if (btnSkipName) {
    btnSkipName.addEventListener("click", () => {
      cerrarModalNombre();
      ejecutarCheckoutWhatsApp("");
    });
  }

  // Botón WhatsApp Checkout
  document.getElementById("btn-whatsapp-checkout").addEventListener("click", enviarPedidoWhatsApp);

  // Modal de Carrito / Revisión de Pedido
  const btnOpenCart = document.getElementById("btn-open-cart-modal");
  if (btnOpenCart) btnOpenCart.addEventListener("click", abrirModalCarrito);

  const btnCloseCart = document.getElementById("btn-close-cart-modal");
  if (btnCloseCart) btnCloseCart.addEventListener("click", cerrarModalCarrito);

  const btnCartContinue = document.getElementById("btn-cart-modal-continue");
  if (btnCartContinue) btnCartContinue.addEventListener("click", cerrarModalCarrito);

  const cartModalBackdrop = document.getElementById("cart-detail-modal");
  if (cartModalBackdrop) {
    cartModalBackdrop.addEventListener("click", (e) => {
      if (e.target.id === "cart-detail-modal") cerrarModalCarrito();
    });
  }

  const btnClearCart = document.getElementById("btn-cart-modal-clear");
  if (btnClearCart) btnClearCart.addEventListener("click", vaciarPedidoCompleto);

  const btnCartWhatsapp = document.getElementById("btn-cart-modal-whatsapp");
  if (btnCartWhatsapp) {
    btnCartWhatsapp.addEventListener("click", () => {
      cerrarModalCarrito();
      enviarPedidoWhatsApp();
    });
  }
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
  const { patron, raiz, quimico, objetivo } = state.answers;
  const items = [];

  // Puntuación de afinidad según diagnóstico, tipo de paso y stock real
  function puntuarProducto(prod, tipoPaso, lineaSeleccionada) {
    if (!prod || (prod.stock !== undefined && prod.stock <= 0)) return -999;

    let score = 0;
    const paso = prod.paso || "";
    const necesidad = prod.necesidad || "";
    const nombre = (prod.nombre || "") + " " + (prod.titulo_comercial || "");
    const linea = prod.linea || "";
    const patrones = Array.isArray(prod.patron) ? prod.patron : [];
    const raices = Array.isArray(prod.raiz) ? prod.raiz : [];
    const quimicos = Array.isArray(prod.quimico) ? prod.quimico : [];

    // 1. Filtro estricto por paso de la rutina
    if (tipoPaso === "shampoo") {
      if (!paso.includes("Shampoo")) return -999;
    } else if (tipoPaso === "acondicionador") {
      if (!paso.includes("Acondicionador")) return -999;
    } else if (tipoPaso === "mascara") {
      const esMascara = paso.includes("Máscara") || paso.includes("Mscara") || paso.includes("Tratamiento");
      if (!esMascara) return -999;
    } else if (tipoPaso === "finalizador") {
      const esFinalizador = paso.includes("Leave-in") || paso.includes("Crema") || paso.includes("Acabado") || paso.includes("Sérum") || paso.includes("Srum") || paso.includes("Aceite") || paso.includes("Spray");
      if (!esFinalizador) return -999;
    }

    // 2. Objetivo Principal del Cliente (Mayor ponderación)
    if (objetivo === "reparacion") {
      if (necesidad.includes("Reparación") || necesidad.includes("Daño") || necesidad.includes("Nutrición")) score += 10;
      if (linea.includes("Absolut") || linea.includes("Pro Fiber") || linea.includes("Smartbond")) score += 8;
    } else if (objetivo === "color_brillo") {
      if (necesidad.includes("Color") || necesidad.includes("Rubios") || necesidad.includes("Brillo") || necesidad.includes("Decolorados")) score += 10;
      if (linea.includes("Vitamino") || linea.includes("Blondifier") || linea.includes("Mythic")) score += 8;
    } else if (objetivo === "fuerza_resistencia") {
      if (necesidad.includes("Anti-Quiebre") || necesidad.includes("Fuerza") || necesidad.includes("Densidad") || necesidad.includes("Enlaces")) score += 10;
      if (linea.includes("Inforcer") || linea.includes("Serioxyl") || linea.includes("Pro Fiber")) score += 8;
    }

    // 3. Procesos Químicos y Tratamiento de Color
    if (quimico === "decolorado") {
      if (quimicos.includes("Decolorado") || quimicos.includes("Mechas") || quimicos.includes("Canas") || linea.includes("Blondifier") || necesidad.includes("Rubios")) score += 9;
    } else if (quimico === "tinturado") {
      if (quimicos.includes("Tinturado") || linea.includes("Vitamino") || necesidad.includes("Color")) score += 9;
    } else if (quimico === "danado_calor") {
      if (quimicos.includes("Dañado") || quimicos.includes("Procesado") || necesidad.includes("Reparación")) score += 7;
    } else if (quimico === "natural") {
      if (quimicos.includes("Natural") || quimicos.includes("Todos") || necesidad.includes("Nutrición")) score += 5;
    }

    // 4. Patrón y Textura de la Fibra Capilar
    if (patron === "rizado") {
      if (patrones.includes("Rizado") || necesidad.includes("Rizos") || nombre.toLowerCase().includes("curl")) score += 8;
      else if (patrones.includes("Todos")) score += 2;
    } else if (patron === "ondulado") {
      if (patrones.includes("Ondulado") || necesidad.includes("Frizz") || nombre.toLowerCase().includes("waves")) score += 6;
      else if (patrones.includes("Todos")) score += 2;
    } else if (patron === "liso") {
      if (patrones.includes("Liso") || linea.includes("Liss")) score += 6;
      else if (patrones.includes("Todos")) score += 2;
    }

    // 5. Estado de la Raíz / Cuero Cabelludo (relevante para lavado y balance)
    if (raiz === "grasa") {
      if (raices.includes("Graso") || necesidad.includes("Purificante")) score += 8;
    } else if (raiz === "seca") {
      if (necesidad.includes("Nutrición") || raices.includes("Normal")) score += 4;
    }

    // 6. Sinergia de Línea (cohesión con la línea principal de tratamiento)
    if (lineaSeleccionada && linea.toLowerCase().includes(lineaSeleccionada.toLowerCase())) {
      score += 3;
    }

    // 7. Factor de rotación de stock (prioriza productos con stock disponible más holgado)
    score += Math.min(prod.stock || 0, 5) * 0.2;

    return score;
  }

  function seleccionarMejorProducto(tipoPaso, lineaSeleccionada) {
    const candidatos = state.catalog
      .filter(p => (p.stock || 0) > 0)
      .map(p => ({ prod: p, score: puntuarProducto(p, tipoPaso, lineaSeleccionada) }))
      .filter(item => item.score > -900)
      .sort((a, b) => b.score - a.score);

    return candidatos.length > 0 ? candidatos[0].prod : null;
  }

  // Paso 1: Shampoo ideal
  const shampoo = seleccionarMejorProducto("shampoo", null);
  const lineaPrincipal = shampoo ? shampoo.linea : null;

  // Paso 2: Acondicionador con sinergia
  const acondicionador = seleccionarMejorProducto("acondicionador", lineaPrincipal);

  // Paso 3: Máscara de Tratamiento Intensivo
  const mascara = seleccionarMejorProducto("mascara", lineaPrincipal);

  // Paso 4: Finalizador / Leave-in / Termoprotector
  const finalizador = seleccionarMejorProducto("finalizador", lineaPrincipal);

  if (shampoo) items.push({ ...shampoo, rutinaStep: "Paso 1 • Limpieza & Preparación" });
  if (acondicionador) items.push({ ...acondicionador, rutinaStep: "Paso 2 • Sellado Diario & Desenredo" });
  if (mascara) items.push({ ...mascara, rutinaStep: "Paso 3 • Reparación Intensiva Semanal" });
  if (finalizador) items.push({ ...finalizador, rutinaStep: "Paso 4 • Termoprotección & Brillo Final" });

  state.recommendedProducts = items;

  // Actualizar carrito sin sobreescribir productos seleccionados previamente
  items.forEach(p => {
    const key = p.id + "_" + p.formato;
    if (!state.cart[key]) {
      state.cart[key] = {
        product: p,
        quantity: 1,
        selected: true,
        fromRoutine: true
      };
    } else {
      state.cart[key].selected = true;
      state.cart[key].fromRoutine = true;
    }
  });

  saveCartToStorage();
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

  // Eliminar sección complementaria previa si ya existía
  const prevComp = document.getElementById("complementary-offers");
  if (prevComp) prevComp.remove();

  // Productos complementarios (estilismo + complemento + para-ellos) con stock disponible
  const productosComplementarios = state.catalog.filter(p => {
    const cat = getCategoryInfo(p).category;
    return (cat === "estilismo" || cat === "complemento" || cat === "para-ellos") && (p.stock || 0) > 0;
  });

  if (productosComplementarios.length > 0) {
    const compSection = document.createElement("section");
    compSection.id = "complementary-offers";
    compSection.className = "complementary-section";
    compSection.innerHTML = `
      <div class="comp-header">
        <span class="comp-badge">🌟 TAMBIÉN DISPONIBLE</span>
        <h3 class="comp-title">Complementa tu Rutina</h3>
        <p class="comp-sub">Estilismo profesional y tratamientos técnicos en liquidación</p>
      </div>
      <div class="comp-grid" id="complementary-grid"></div>
    `;
    container.after(compSection);
    renderCompactCards(productosComplementarios, "complementary-grid");
  }

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
      const cat = getCategoryInfo(prod).category;
      if (["estilismo", "complemento", "para-ellos"].includes(filter)) {
        if (cat !== filter) return false;
      } else {
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

    const isAgotado = (prod.stock || 0) <= 0;
    const card = document.createElement("article");
    card.className = `product-card ${cartItem.selected ? "in-cart" : ""} ${isAgotado ? "is-soldout" : ""}`;
    card.id = `catalog-card-${key}`;

    let stockBadgeHtml = "";
    if (isAgotado) {
      stockBadgeHtml = `<span class="badge-scarcity soldout">🚫 Reservado</span>`;
    } else if (prod.stock === 1) {
      stockBadgeHtml = `<span class="badge-scarcity urgent">🔥 ¡Última unidad en bodega!</span>`;
    } else if (prod.stock <= 3) {
      stockBadgeHtml = `<span class="badge-scarcity limited">⚡ Solo ${prod.stock} disponibles</span>`;
    } else {
      stockBadgeHtml = `<span class="badge-scarcity limited">✓ Stock: ${prod.stock} un.</span>`;
    }

    const catInfo = getCategoryInfo(prod);
    const badgeHTML = catInfo.badge
      ? `<span class="product-category-badge" style="background:${catInfo.color}20; color:${catInfo.color}; border:1px solid ${catInfo.color}40;">${catInfo.badge}</span>`
      : "";
    const tipHTML = catInfo.tip
      ? `<small class="product-category-tip">${catInfo.tip}</small>`
      : "";

    const actionControlsHtml = isAgotado
      ? `<button class="btn-soldout-disabled" type="button" disabled>🚫 Reservado</button>`
      : `
        <label class="toggle-btn">
          <input type="checkbox" id="cat-check-${key}" ${cartItem.selected ? "checked" : ""}>
          <span>${cartItem.selected ? "Agregado al pedido ✓" : "+ Agregar al pedido"}</span>
        </label>

        <div class="qty-stepper" id="cat-stepper-${key}" style="${cartItem.selected ? "" : "opacity: 0.3; pointer-events: none;"}">
          <button class="btn-qty" type="button" data-action="cat-dec" data-key="${key}" ${cartItem.quantity <= 1 ? "disabled" : ""}>−</button>
          <span class="qty-val" id="cat-qty-val-${key}">${cartItem.quantity}</span>
          <button class="btn-qty" type="button" data-action="cat-inc" data-key="${key}" ${cartItem.quantity >= prod.stock ? "disabled" : ""}>+</button>
        </div>
      `;

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
            ${badgeHTML}
            <h4 class="product-name">${prod.titulo_comercial || prod.nombre}</h4>
            <span class="product-format">Línea: ${prod.linea} • Formato: ${prod.formato}</span>
            ${tipHTML}
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
        ${actionControlsHtml}
        <button class="btn-details" type="button" data-action="details" data-key="${key}">Ver detalles</button>
      </div>
    `;

    // Modal de detalles
    card.querySelectorAll('[data-action="details"]').forEach(el => {
      el.addEventListener("click", () => abrirModal(prod, key));
    });

    // Toggle Checkbox (solo productos con stock disponible)
    const checkbox = card.querySelector(`#cat-check-${key}`);
    if (checkbox) {
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
    }

    // Stepper decrementar
    const btnDec = card.querySelector('[data-action="cat-dec"]');
    if (btnDec) {
      btnDec.addEventListener("click", () => {
        if (state.cart[key] && state.cart[key].quantity > 1) {
          state.cart[key].quantity--;
          actualizarStepperCatalogo(key, prod);
          actualizarBarraCheckout();
        }
      });
    }

    // Stepper incrementar
    const btnInc = card.querySelector('[data-action="cat-inc"]');
    if (btnInc) {
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
    }

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
    cartCountEl.textContent = `${totalProductos} ${totalProductos === 1 ? "producto" : "productos"}`;
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
    const isDoingQuiz = state.currentScreen === "screen-quiz" || state.currentScreen === "screen-loading";
    if (totalProductos > 0 && !isDoingQuiz) {
      stickyCart.classList.remove("hidden");
    } else {
      stickyCart.classList.add("hidden");
    }
  }

  // Si el modal de carrito está abierto, sincronizar su contenido
  const cartModal = document.getElementById("cart-detail-modal");
  if (cartModal && !cartModal.classList.contains("hidden")) {
    renderCartModal();
  }

  // Guardar estado persistente automáticamente
  saveCartToStorage();
}

// -------------------------------------------------------------
// MODAL DE DETALLES
// -------------------------------------------------------------
function abrirModal(prod, key) {
  const modal = document.getElementById("product-modal");
  const isAgotado = (prod.stock || 0) <= 0;

  document.getElementById("modal-img").src = prod.foto;
  document.getElementById("modal-img").alt = prod.nombre;
  document.getElementById("modal-line").textContent = prod.linea;
  document.getElementById("modal-title").textContent = prod.titulo_comercial || prod.nombre;
  document.getElementById("modal-format").textContent = isAgotado
    ? `Formato profesional: ${prod.formato} • Estado: 🚫 Reservado`
    : `Formato profesional: ${prod.formato} • Stock: ${prod.stock} un.`;
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
  if (isAgotado) {
    btnModalAdd.textContent = "🚫 Producto Reservado";
    btnModalAdd.disabled = true;
    btnModalAdd.style.opacity = "0.5";
    btnModalAdd.style.cursor = "not-allowed";
    btnModalAdd.onclick = null;
  } else {
    btnModalAdd.disabled = false;
    btnModalAdd.style.opacity = "";
    btnModalAdd.style.cursor = "";
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

    // Sincronizar compact cards si existen
    document.querySelectorAll(`.compact-action-btn[data-key="${key}"]`).forEach(btn => {
      btn.textContent = "En pedido ✓";
      btn.classList.add("added");
    });
    document.querySelectorAll(`.compact-card[id$="-card-${key}"]`).forEach(c => {
      c.classList.add("in-cart");
    });

    actualizarBarraCheckout();
    showToast(`✓ Agregado al pedido: ${prod.titulo_comercial || prod.nombre}`, "success", 2500);
    cerrarModal();
  };
  }

  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function cerrarModal() {
  const modal = document.getElementById("product-modal");
  modal.classList.add("hidden");
  document.body.style.overflow = "";
}

// -------------------------------------------------------------
// MODAL DE REVISIÓN DE CARRITO / PEDIDO ACTUAL
// -------------------------------------------------------------
function abrirModalCarrito() {
  const modal = document.getElementById("cart-detail-modal");
  if (!modal) return;
  renderCartModal();
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function cerrarModalCarrito() {
  const modal = document.getElementById("cart-detail-modal");
  if (modal) modal.classList.add("hidden");
  document.body.style.overflow = "";
}

function renderCartModal() {
  const container = document.getElementById("cart-modal-items");
  if (!container) return;

  const itemsSeleccionados = Object.entries(state.cart).filter(([_, item]) => item && item.selected);

  let totalProductos = 0;
  let totalCLP = 0;

  itemsSeleccionados.forEach(([_, item]) => {
    totalProductos += item.quantity;
    totalCLP += item.quantity * item.product.precio_venta;
  });

  const countLabel = document.getElementById("cart-modal-count-label");
  if (countLabel) {
    countLabel.textContent = `${totalProductos} ${totalProductos === 1 ? "producto seleccionado" : "productos seleccionados"}`;
  }

  const totalAmount = document.getElementById("cart-modal-total-amount");
  if (totalAmount) {
    totalAmount.textContent = formatCLP(totalCLP);
  }

  const btnCartWhatsapp = document.getElementById("btn-cart-modal-whatsapp");
  if (btnCartWhatsapp) {
    if (totalProductos === 0) {
      btnCartWhatsapp.setAttribute("disabled", "true");
      btnCartWhatsapp.style.opacity = "0.5";
    } else {
      btnCartWhatsapp.removeAttribute("disabled");
      btnCartWhatsapp.style.opacity = "1";
    }
  }

  const btnClear = document.getElementById("btn-cart-modal-clear");
  if (btnClear) {
    btnClear.style.display = itemsSeleccionados.length === 0 ? "none" : "inline-flex";
  }

  if (itemsSeleccionados.length === 0) {
    container.innerHTML = `
      <div class="cart-empty-state">
        <div class="cart-empty-icon">🛍️</div>
        <h4>Tu pedido está vacío</h4>
        <p>Selecciona productos desde tu recomendación capilar o en el catálogo para sumarlos aquí.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = "";

  itemsSeleccionados.forEach(([key, item]) => {
    const prod = item.product;
    const subtotal = item.quantity * prod.precio_venta;

    const row = document.createElement("div");
    row.className = "cart-item-row";
    row.id = `cart-modal-row-${key}`;

    row.innerHTML = `
      <div class="cart-item-img-wrap">
        <img src="${prod.foto}" alt="${prod.nombre}" loading="lazy" onerror="this.style.opacity='0.5'">
      </div>
      <div class="cart-item-details">
        <div class="cart-item-top">
          <span class="cart-item-line">${prod.linea}</span>
          <button class="btn-cart-remove" type="button" data-action="cart-remove" data-key="${key}" title="Eliminar producto">✕ Eliminar</button>
        </div>
        <h4 class="cart-item-title">${prod.titulo_comercial || prod.nombre}</h4>
        <div class="cart-item-format">Formato: ${prod.formato}</div>
        <div class="cart-item-bottom">
          <div class="cart-item-prices">
            <span class="cart-item-unit">${formatCLP(prod.precio_venta)} c/u</span>
            <span class="cart-item-subtotal">${formatCLP(subtotal)}</span>
          </div>
          <div class="qty-stepper cart-item-stepper">
            <button class="btn-qty" type="button" data-action="cart-dec" data-key="${key}" ${item.quantity <= 1 ? "disabled" : ""}>−</button>
            <span class="qty-val">${item.quantity}</span>
            <button class="btn-qty" type="button" data-action="cart-inc" data-key="${key}" ${item.quantity >= prod.stock ? "disabled" : ""}>+</button>
          </div>
        </div>
      </div>
    `;

    // Quitar producto
    const btnRemove = row.querySelector('[data-action="cart-remove"]');
    btnRemove.addEventListener("click", () => {
      state.cart[key].selected = false;
      sincronizarDesmarcarProducto(key);
      actualizarBarraCheckout();
      renderCartModal();
      showToast(`Producto quitado del pedido: ${prod.titulo_comercial || prod.nombre}`, "info", 2000);
    });

    // Disminuir cantidad
    const btnDec = row.querySelector('[data-action="cart-dec"]');
    btnDec.addEventListener("click", () => {
      if (state.cart[key] && state.cart[key].quantity > 1) {
        state.cart[key].quantity--;
        actualizarStepper(key, prod);
        actualizarStepperCatalogo(key, prod);
        actualizarBarraCheckout();
        renderCartModal();
      }
    });

    // Aumentar cantidad
    const btnInc = row.querySelector('[data-action="cart-inc"]');
    btnInc.addEventListener("click", () => {
      if (state.cart[key] && state.cart[key].quantity < prod.stock) {
        state.cart[key].quantity++;
        actualizarStepper(key, prod);
        actualizarStepperCatalogo(key, prod);
        actualizarBarraCheckout();
        renderCartModal();
      }
    });

    container.appendChild(row);
  });
}

function vaciarPedidoCompleto() {
  const keys = Object.keys(state.cart);
  if (keys.length === 0) return;
  keys.forEach(key => {
    if (state.cart[key]) {
      state.cart[key].selected = false;
      sincronizarDesmarcarProducto(key);
    }
  });
  saveCartToStorage();
  actualizarBarraCheckout();
  renderCartModal();
  showToast("Se vació todo el pedido.", "info", 2000);
}

function sincronizarDesmarcarProducto(key) {
  // Sincronizar catálogo
  const catCheck = document.getElementById(`cat-check-${key}`);
  if (catCheck) catCheck.checked = false;
  const catCard = document.getElementById(`catalog-card-${key}`);
  if (catCard) {
    catCard.classList.remove("in-cart");
    catCard.querySelector(".toggle-btn span").textContent = "+ Agregar al pedido";
    const st = catCard.querySelector(`#cat-stepper-${key}`);
    if (st) {
      st.style.opacity = "0.3";
      st.style.pointerEvents = "none";
    }
  }

  // Sincronizar rutina
  const rutinaCheck = document.getElementById(`check-${key}`);
  if (rutinaCheck) rutinaCheck.checked = false;
  const rutinaCard = document.getElementById(`card-${key}`);
  if (rutinaCard) {
    rutinaCard.classList.remove("in-cart");
    rutinaCard.querySelector(".toggle-btn span").textContent = "Agregar a rutina";
    const st = rutinaCard.querySelector(`#stepper-${key}`);
    if (st) {
      st.style.opacity = "0.3";
      st.style.pointerEvents = "none";
    }
  }

  // Sincronizar compact cards
  document.querySelectorAll(`.compact-card[id$="-card-${key}"]`).forEach(c => {
    c.classList.remove("in-cart");
    const b = c.querySelector('[data-action="toggle"]');
    if (b) {
      b.classList.remove("added");
      b.textContent = "+ Agregar";
    }
  });
}

// -------------------------------------------------------------
// MODAL DE NOMBRE DE CLIENTE (CHECKOUT)
// -------------------------------------------------------------
function abrirModalNombre() {
  const modal = document.getElementById("checkout-name-modal");
  if (!modal) return;
  const input = document.getElementById("customer-name-input");
  if (input) {
    input.value = state.customerName || localStorage.getItem("loreal_customer_name") || "";
  }
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  setTimeout(() => {
    if (input) input.focus();
  }, 150);
}

function cerrarModalNombre() {
  const modal = document.getElementById("checkout-name-modal");
  if (modal) modal.classList.add("hidden");
  document.body.style.overflow = "";
}

function confirmarNombreYPedir(nombre) {
  const nombreLimpio = (nombre || "").trim();
  if (nombreLimpio) {
    state.customerName = nombreLimpio;
    try {
      localStorage.setItem("loreal_customer_name", nombreLimpio);
    } catch (e) {}
  }
  cerrarModalNombre();
  ejecutarCheckoutWhatsApp(state.customerName);
}

// -------------------------------------------------------------
// CHECKOUT: ENVIAR PEDIDO POR WHATSAPP
// -------------------------------------------------------------
function enviarPedidoWhatsApp() {
  const itemsSeleccionados = Object.values(state.cart).filter(item => item.selected);

  if (itemsSeleccionados.length === 0) {
    showToast("Por favor selecciona al menos un producto para coordinar tu pedido.", "warning");
    return;
  }

  const nombreGuardado = (state.customerName || localStorage.getItem("loreal_customer_name") || "").trim();
  if (!nombreGuardado) {
    abrirModalNombre();
  } else {
    ejecutarCheckoutWhatsApp(nombreGuardado);
  }
}

function ejecutarCheckoutWhatsApp(customerName) {
  const itemsSeleccionados = Object.values(state.cart).filter(item => item.selected);

  if (itemsSeleccionados.length === 0) {
    showToast("Por favor selecciona al menos un producto para coordinar tu pedido.", "warning");
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

  // Verificar si el pedido proviene legítimamente de un diagnóstico capilar completado
  const tieneProductosRutina = itemsSeleccionados.some(item => item && item.fromRoutine === true);
  const esPedidoDiagnostico = tieneProductosRutina && Boolean(state.recommendedProducts && state.recommendedProducts.length > 0);

  const saludoNombre = customerName ? `¡Hola! Soy *${customerName}*.\n` : "¡Hola!\n";
  const saludo = esPedidoDiagnostico
    ? `${saludoNombre}Acabo de realizar el diagnóstico capilar L'Oréal Professionnel en la web y me gustaría reservar los siguientes productos de mi rutina:`
    : `${saludoNombre}Estuve revisando el catálogo online de L'Oréal Professionnel y me gustaría consultar disponibilidad y reservar los siguientes productos:`;

  let mensaje =
    `${saludo}

📋 PRODUCTOS SELECCIONADOS:
${lineasProductos}
💰 TOTAL SUGERIDO DEL PEDIDO: ${formatCLP(totalCLP)}
📍 Entrega en San Pedro de la Paz / Concepción (a convenir)
`;

  // Solo incluir perfil si el pedido proviene de un diagnóstico capilar
  if (esPedidoDiagnostico) {
    const diagnosticoTxt = `Textura: ${state.answers.patron || "Natural"} | Raíz: ${state.answers.raiz || "Normal"} | Proceso: ${state.answers.quimico || "Normal"}`;
    mensaje += `\n✨ (Perfil diagnosticado: ${diagnosticoTxt})\n`;
  }

  mensaje += `\n¿Tienen disponibilidad para coordinar la entrega y los datos de transferencia? ¡Muchas gracias!`;

  const phone = CONFIG.WHATSAPP_PHONE.replace(/\D/g, "");
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(mensaje)}`;

  showToast("Conectando con WhatsApp para confirmar tu reserva...", "success", 3000);

  // Abrir WhatsApp en nueva pestaña o aplicación nativa del teléfono
  window.open(url, "_blank");
}
