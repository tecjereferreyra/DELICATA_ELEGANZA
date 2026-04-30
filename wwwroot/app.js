const API_URL = "https://delicata-eleganza.onrender.com/api/Productos";
const USUARIOS_URL = "https://delicata-eleganza.onrender.com/api/Usuarios";

let productosData = [];
let hamburger;
let mobileMenu;
let isLoadingProductos = false;
let productoSeleccionado = null;
let productosRenderizados = 0;
let _cerrarModalTimeout = null;
let _menuCerradoRecien = false;
const BLOQUE_CARGA = 12;
const delay = 0;
let productosFiltrados = [];
let esAdminActual = false;
/* ---------------- UTILIDADES OPTIMIZADAS ---------------- */
const safeTextPreserve = (value, fallback = "—") =>
    (value === null || value === undefined) ? fallback : String(value);

const safeText = safeTextPreserve;

const toNumber = (v, fallback = 0) => {
    if (v === null || v === undefined) return fallback;
    const n = Number(v);
    return Number.isNaN(n) ? fallback : n;
};

// Debounce optimizado
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Throttle para scroll
const throttle = (func, limit) => {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};
/* ---------------- CAMPOS DEL MODAL ---------------- */
function ocultarCampoModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = "none";
    const parent = el.closest("p, div");
    if (parent) parent.style.display = "none";
}

function mostrarCampoModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = "block";
    const parent = el.closest("p, div");
    if (parent) parent.style.display = "block";
}

let _scrollLockedAt = 0;
function lockScroll() {
    if (document.body.classList.contains('scroll-locked')) return;

    _scrollLockedAt = window.pageYOffset || document.documentElement.scrollTop;

    // En vez de position:fixed en body (que dispara la barra de Safari),
    // usamos overflow:hidden en html + guardamos el scroll manualmente
    document.documentElement.style.overflow = 'hidden';
    document.body.style.paddingRight = ''; // evita layout shift si había scrollbar
    document.body.classList.add('scroll-locked');
}

function unlockScroll() {
    if (!document.body.classList.contains('scroll-locked')) return;

    document.body.classList.remove('scroll-locked');
    document.documentElement.style.overflow = '';

    // Restaurar posición de scroll
    window.scrollTo({ top: _scrollLockedAt, behavior: 'instant' });
}
/* ---------------- NORMALIZADOR ---------------- */
function normalizarProducto(p) {
    return {
        IdProducto: p.IdProducto ?? p.idProducto ?? p.id_producto ?? p.id ?? null,
        Nombre: p.Nombre ?? p.nombre ?? "—",
        Modelo: p.Modelo ?? p.modelo ?? "—",
        Color: p.Color ?? p.color ?? "—",
        Categoria: p.Categoria ?? p.categoria ?? "—",
        Marca: p.Marca ?? p.marca ?? "—",
        Material: p.Material ?? p.material ?? "—",
        Tipo: p.Tipo ?? p.tipo ?? "—",
        Capacidad: p.Capacidad ?? p.capacidad ?? "—",
        Compartimentos: p.Compartimentos ?? p.compartimentos ?? "—",
        Alto: p.Alto ?? p.alto ?? "—",
        Ancho: p.Ancho ?? p.ancho ?? "—",
        Profundidad: p.Profundidad ?? p.profundidad ?? "—",
        Peso: p.Peso ?? p.peso ?? "—",
        Genero: p.Genero ?? p.genero ?? "—",
        Diametro: p.Diametro ?? p.diametro ?? "—",
        CantidadRuedas: p.CantidadRuedas ?? p.cantidadRuedas ?? "—",
        FuelleExpandible: p.FuelleExpandible ?? p.fuelleExpandible ?? null,
        TipoCierre: p.TipoCierre ?? p.tipoCierre ?? "—",
        Stock: Number(p.Stock ?? p.stock ?? 0),
        ImagenUrl: p.ImagenUrl ?? p.imagenUrl ?? "/ImagenUrl/default.jpg",
        Disponible: Number(p.Stock ?? p.stock ?? 0) > 0
    };
}

/* ---------------- MENSAJES LOGIN ---------------- */
function showLoginMessage(message, type = "info") {
    let msgEl = document.getElementById("loginMessageBanner");
    if (!msgEl) {
        const container = document.querySelector(".user-modal-content") || document.body;
        msgEl = document.createElement("div");
        msgEl.id = "loginMessageBanner";
        msgEl.style.cssText = "padding:10px;border-radius:6px;margin-bottom:10px;font-weight:600;";
        container.prepend(msgEl);
    }
    msgEl.textContent = message;
    msgEl.style.display = "block";

    const styles = {
        success: { bg: "rgba(22,163,74,0.12)", color: "rgb(22,163,74)", border: "1px solid rgba(22,163,74,0.2)" },
        error: { bg: "rgba(220,38,38,0.08)", color: "rgb(220,38,38)", border: "1px solid rgba(220,38,38,0.12)" },
        info: { bg: "rgba(0,0,0,0.06)", color: "#222", border: "1px solid rgba(0,0,0,0.06)" }
    };

    const style = styles[type] || styles.info;
    msgEl.style.background = style.bg;
    msgEl.style.color = style.color;
    msgEl.style.border = style.border;

    clearTimeout(msgEl._hideTimeout);
    msgEl._hideTimeout = setTimeout(() => msgEl.style.display = "none", 3500);
}

/* ---------------- REFERENCIAS DOM CACHEADAS ---------------- */
const domCache = {
    contenedor: null,
    userModal: null,
    modal: null,
    searchInput: null,
    btnBuscar: null
};

function initDOMCache() {
    domCache.contenedor = document.getElementById("contenedor-productos");
    domCache.userModal = document.getElementById("userModal");
    domCache.modal = document.getElementById("modalProducto");
    domCache.searchInput = document.getElementById("searchInput");
    domCache.btnBuscar = document.getElementById("btnBuscar");
    domCache.modalNombre = document.getElementById("modalNombre");
    domCache.modalModelo = document.getElementById("modalModelo");
    domCache.modalColor = document.getElementById("modalColor");
    domCache.modalCategoria = document.getElementById("modalCategoria");
    domCache.modalMarca = document.getElementById("modalMarca");
    domCache.modalMaterial = document.getElementById("modalMaterial");
    domCache.modalCapacidad = document.getElementById("modalCapacidad");
    domCache.modalClose = domCache.modal ? domCache.modal.querySelector(".close") : null;
    domCache.userModalContent = domCache.userModal ? domCache.userModal.querySelector(".user-modal-content") : null;
    domCache.openLoginBtn = document.getElementById("openLogin");
    domCache.registerBtnHeader = document.getElementById("createAccount");
    domCache.categoriesLinks = document.querySelectorAll('.categories a');
    // Listeners que antes estaban en nivel de script (dependían de referencias nulas)
    domCache.modalClose?.addEventListener("click", cerrarModalProducto);
    domCache.modal?.addEventListener("click", e => {
        if (e.target === domCache.modal) cerrarModalProducto();
    });

    // ── Botones admin: listeners únicos usando productoSeleccionado ──
    document.getElementById("btnAgregarModal")?.addEventListener("click", () => {
        cerrarModalProducto();
        setTimeout(() => abrirFormularioNuevo(), 250);
    });

    document.getElementById("btnEditarModal")?.addEventListener("click", () => {
        if (!productoSeleccionado) return;
        cerrarModalProducto();
        setTimeout(() => abrirEditarProducto(productoSeleccionado.IdProducto), 250);
    });

    document.getElementById("btnEliminarModal")?.addEventListener("click", () => {
        if (!productoSeleccionado) return;
        idProdEliminar = productoSeleccionado.IdProducto;
        const textoEl = document.getElementById("prodTextoEliminar");
        if (textoEl) textoEl.innerText = `¿Seguro que desea eliminar "${productoSeleccionado.Nombre}"?`;
        cerrarModalProducto();
        setTimeout(() => abrirModalAdmin("modalEliminar"), 250);
    });

    const logoutBtn = document.getElementById("logoutBtn");
    logoutBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        mostrarLogoutConfirm();
    });

    domCache.openLoginBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        openUserModalAsLogin();
    });
}

/* ─── HELPER: cerrar modal al click en backdrop sin interferir
   con selección de texto ni drag desde adentro hacia afuera ── */
function registrarCierreBackdrop(modalEl, cerrarFn) {
    // Guardamos la posición donde comenzó el mousedown
    let mousedownTarget = null;

    function onMousedown(e) {
        mousedownTarget = e.target;
    }

    function onMouseup(e) {
        // Solo cierra si el mousedown Y el mouseup ocurrieron sobre el backdrop
        if (mousedownTarget === modalEl && e.target === modalEl) {
            cerrarFn();
        }
        mousedownTarget = null;
    }

    modalEl.addEventListener("mousedown", onMousedown);
    modalEl.addEventListener("mouseup", onMouseup);

    // Devuelve una función para limpiar los listeners cuando ya no se necesitan
    return function limpiar() {
        modalEl.removeEventListener("mousedown", onMousedown);
        modalEl.removeEventListener("mouseup", onMouseup);
    };
}

function abrirModalProducto() {
    const modal = domCache.modal;
    if (!modal) return;

    if (_cerrarModalTimeout) {
        clearTimeout(_cerrarModalTimeout);
        _cerrarModalTimeout = null;
    }

    lockScroll();
    document.activeElement?.blur();
    modal.removeAttribute("aria-hidden");
    modal.inert = false;

    // Un solo rAF para que el browser procese el estado anterior antes de agregar .show
    requestAnimationFrame(() => {
        modal.classList.add("show");
    });
}
/* ---------------- CARRUSEL MODAL ---------------- */
let carruselActual = 0;

function renderCarrusel(imagenes, altTexto, esParcial = false) {
    const wrapper = document.getElementById("carruselWrapper");
    const dots = document.getElementById("carruselDots");
    const btnPrev = document.getElementById("carruselPrev");
    const btnNext = document.getElementById("carruselNext");
    if (!wrapper) return;

    wrapper.innerHTML = "";
    if (dots) dots.innerHTML = "";
    carruselActual = 0;

    const soloUna = imagenes.length <= 1;

    if (esParcial) {
        btnPrev?.style.setProperty('visibility', 'hidden');
        btnNext?.style.setProperty('visibility', 'hidden');
        if (dots) dots.style.visibility = 'hidden';
    } else {
        btnPrev?.style.removeProperty('visibility');
        btnNext?.style.removeProperty('visibility');
        if (dots) dots.style.visibility = '';
        btnPrev?.classList.toggle("oculto", soloUna);
        btnNext?.classList.toggle("oculto", soloUna);
        if (dots) dots.style.display = soloUna ? "none" : "";
    }

    imagenes.forEach((url, idx) => {
        const slide = document.createElement("div");
        slide.className = "carrusel-slide" + (idx === 0 ? " active" : "");
        const img = document.createElement("img");
        img.src = url;
        img.alt = altTexto + " " + (idx + 1);
        img.loading = idx === 0 ? "eager" : "lazy";
        img.width = 400;
        img.height = 400;
        slide.appendChild(img);
        wrapper.appendChild(slide);

        if (dots) {
            const dot = document.createElement("span");
            dot.className = "dot" + (idx === 0 ? " active" : "");
            dot.dataset.idx = idx;
            dot.addEventListener("click", () => irASlide(parseInt(dot.dataset.idx)));
            dots.appendChild(dot);
        }
    });
}

function irASlide(idx) {
    const slides = document.querySelectorAll("#carruselWrapper .carrusel-slide");
    const dots = document.querySelectorAll("#carruselDots .dot");
    if (!slides[idx]) return;

    const prev = slides[carruselActual];
    const next = slides[idx];

    slides[carruselActual]?.classList.remove("active");
    dots[carruselActual]?.classList.remove("active");
    carruselActual = idx;
    slides[carruselActual].classList.add("active");
    dots[carruselActual]?.classList.add("active");
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("carruselPrev")?.addEventListener("click", () => {
        const total = document.querySelectorAll("#carruselWrapper .carrusel-slide").length;
        irASlide((carruselActual - 1 + total) % total);
    });
    document.getElementById("carruselNext")?.addEventListener("click", () => {
        const total = document.querySelectorAll("#carruselWrapper .carrusel-slide").length;
        irASlide((carruselActual + 1) % total);
    });
});
function cerrarModalProducto() {
    const modal = domCache.modal;
    if (!modal) return;
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    modal.inert = true;
    unlockScroll();
    // Ya no necesitamos setTimeout para display:none porque usamos visibility
    _cerrarModalTimeout = null;
}

/* ---------------- INICIALIZACIÓN RÁPIDA ---------------- */
document.addEventListener("DOMContentLoaded", () => {
    initDOMCache();

    const modalLogin = document.getElementById("userModal");
    const modalRecuperar = document.getElementById("modalRecuperar");
    const linkOlvidaste = document.getElementById("linkOlvidaste");
    const btnRecuperar = document.getElementById("btnRecuperar");
    const closeRecuperar = document.getElementById("closeRecuperar");

    if (linkOlvidaste) {
        linkOlvidaste.addEventListener("click", e => {
            e.preventDefault();
            modalLogin.style.display = "none";
            modalRecuperar.style.display = "flex";
        });
    }

    if (closeRecuperar) {
        closeRecuperar.addEventListener("click", () => {
            modalRecuperar.style.display = "none";
            modalLogin.style.display = "flex";
        });
    }

    if (btnRecuperar) {
        btnRecuperar.addEventListener("click", async () => {
            const emailInput = document.getElementById("recuperarEmail");
            const email = emailInput.value.trim();
            if (!email) {
                alert("Ingresá un correo válido");
                return;
            }
            try {
                await fetch("/api/usuarios/recuperar", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email })
                });
                alert("Si el correo existe, se enviará un enlace.");
                modalRecuperar.style.display = "none";
            } catch (err) {
                console.error(err);
                alert("Error al procesar la solicitud");
            }
        });
    }
});

function mostrarFormularioRecuperar() {
    const contenedor = document.querySelector("#loginForm");
    contenedor.innerHTML = `
        <h3>Recuperar Contraseña</h3>
        <p>Ingresa tu correo o teléfono para recibir un enlace de recuperación.</p>
        <div class="input-group">
            <input type="text" id="recuperarDato" placeholder="Correo o Teléfono" required>
        </div>
        <button type="button" onclick="enviarSolicitudRecuperacion()" class="btn-premium">Enviar Enlace</button>
        <button type="button" onclick="window.location.reload()" class="btn-link">Volver al Login</button>
    `;
}

async function enviarSolicitudRecuperacion() {
    const dato = document.getElementById("recuperarDato").value;
    if (!dato) return alert("Por favor ingresa un dato");
    try {
        const res = await fetch(`${USUARIOS_URL}/recuperar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contacto: dato })
        });
        if (res.ok) {
            alert("Si el usuario existe, se enviará un enlace de recuperación.");
        }
    } catch (err) {
        console.error(err);
    }
}

/* ---------------- VERIFICAR AUTORIZACIÓN ---------------- */
function verificarUsuarioAutorizado() {
    const usuario = localStorage.getItem("correoDelicata");
    esAdminActual = ["tec.jereferreyra@gmail.com", "reflej8@hotmail.com"].includes(usuario);

    const greeting = document.getElementById("greeting");
    const mobileGreeting = document.getElementById("mobileGreeting");
    const nombre = localStorage.getItem("usuarioDelicata");

    if (nombre) {
        if (greeting) greeting.textContent = `¡Hola ${nombre}!`;
        if (mobileGreeting) mobileGreeting.textContent = `¡Hola ${nombre}!`;
    } else {
        if (greeting) greeting.textContent = "¡Hola Visitante!";
        if (mobileGreeting) mobileGreeting.textContent = "¡Hola Visitante!";
    }

    const loginIcon = document.getElementById("openLogin");
    const logoutIcon = document.getElementById("logoutBtn");
    const correo = localStorage.getItem("correoDelicata");

    if (correo) {
        if (loginIcon) loginIcon.style.display = "none";
        if (logoutIcon) logoutIcon.style.display = "inline-block";
    } else {
        if (loginIcon) loginIcon.style.display = "inline-block";
        if (logoutIcon) logoutIcon.style.display = "none";
    }

    // Si el modal de producto está abierto, actualizar los botones admin en tiempo real
    const modalProducto = domCache.modal;
    if (modalProducto && modalProducto.classList.contains("show")) {
        const adminBox = document.getElementById("modalAdminButtons");
        if (adminBox) {
            const esAdmin = correo === "reflej8@hotmail.com" || correo === "tec.jereferreyra@gmail.com";
            adminBox.style.display = esAdmin ? "flex" : "none";
        }
    }
}
/* ---------------- CREAR TARJETA OPTIMIZADA ---------------- */
function crearTarjetaDOM(prod, index = 0) {
    const card = document.createElement("div");
    card.className = "product-card";
    card.dataset.id = prod.IdProducto;

    /* ================= IMAGEN ================= */
    const img = document.createElement("img");
    img.src = safeText(prod.ImagenUrl);
    img.alt = safeText(prod.Nombre || prod.nombre);
    img.width = 254;
    img.height = 254;
    const esPrimera = index === 0;
    img.loading = esPrimera ? "eager" : "lazy";
    img.decoding = "async";
    if (esPrimera) {
        img.fetchPriority = "high";
    }
    img.style.backgroundColor = "#f0f0f0";
    card.appendChild(img);

    /* ================= BODY ================= */
    const body = document.createElement("div");
    body.className = "product-card-body";

    /* ================= NOMBRE ================= */
    const nombre = document.createElement("h3");
    nombre.textContent = safeText(prod.Nombre || prod.nombre);
    body.appendChild(nombre);

    /* ================= INFO ================= */
    const infoCampos = [
        { label: "Modelo", value: prod.Modelo || prod.modelo },
        { label: "Color", value: prod.Color || prod.color },
        { label: "Marca", value: prod.Marca || prod.marca },
    ];

    const infoHTML = infoCampos
        .filter(c => c.value && c.value !== "0" && c.value !== "—")
        .map(c => `<p><b>${c.label}:</b> ${safeText(c.value)}</p>`)
        .join("");

    const disponible = prod.Stock > 0;
    const disponibilidad = `
        <p class="disponible ${disponible ? "en-stock" : "sin-stock"}">
            ${disponible ? "✦ Disponible" : "✦ Sin stock"}
        </p>
    `;

    body.insertAdjacentHTML("beforeend", infoHTML + disponibilidad);

    card.appendChild(body);

    card.addEventListener("mouseenter", () => {
        if (!prod._imagenesCache) {
            fetch(`/api/Productos/${prod.IdProducto}`)
                .then(r => r.ok ? r.json() : null)
                .then(detalle => {
                    if (!detalle) return;
                    const extras = detalle.imagenes || detalle.Imagenes || [];
                    if (extras.length > 0) {
                        prod._imagenesCache = [
                            safeText(detalle.imagenUrl || detalle.ImagenUrl || prod.ImagenUrl || prod.imagenUrl),
                            ...extras
                        ];
                    }
                })
                .catch(() => { });
        }
    }, { once: true }); // el observer la muestra cuando entra en pantalla
    card.addEventListener("click", () => {
        if (_menuCerradoRecien) return;  
        abrirModal(prod);
    }, { passive: true });
    cardObserver.observe(card);   
    return card;
}


function abrirModalAdmin(idModal) {
    const modalEl = document.getElementById(idModal);
    if (!modalEl) { console.error("No existe el modal admin:", idModal); return; }
    lockScroll();              // ← AGREGAR
    if (modalEl.classList.contains("modal-overlay")) {
        modalEl.classList.add("active");
    } else if (modalEl.classList.contains("modal")) {
        modalEl.classList.add("show");
    } else {
        modalEl.classList.add("active");
    }
}
function cerrarModalAdmin(idModal) {
    const modalEl = document.getElementById(idModal);
    if (!modalEl) return;
    modalEl.classList.remove("show", "active");
    unlockScroll(); // ← agregar esta línea
}

/* ---------------- MODAL PRODUCTO ---------------- */
// REEMPLAZÁ esta función en tu app.js

function abrirModal(prod) {
    const modal = domCache.modal;
    if (!modal) return;

    productoSeleccionado = prod;

    /* ================= CARRUSEL DEL MODAL ================= */
    const imagenPrincipal = safeText(prod.ImagenUrl || prod.imagenUrl || "/ImagenUrl/default.webp");

    /* ================= NOMBRE ================= */
    domCache.modalNombre.textContent = safeText(prod.Nombre || prod.nombre);

    /* ================= GRID SIN RECREAR NODOS ================= */
    const camposDisponibles = [
        { id: "modalModelo", value: prod.Modelo || prod.modelo },
        { id: "modalColor", value: prod.Color || prod.color },
        { id: "modalCategoria", value: prod.Categoria || prod.categoria },
        { id: "modalMarca", value: prod.Marca || prod.marca },
        { id: "modalMaterial", value: prod.Material || prod.material },
        { id: "modalCapacidad", value: prod.Capacidad || prod.capacidad },
        { id: "modalTipo", value: prod.Tipo || prod.tipo },
        { id: "modalCompartimentos", value: prod.Compartimentos || prod.compartimentos },
        { id: "modalAlto", value: prod.Alto && prod.Alto !== "—" ? prod.Alto + " cm" : null },
        { id: "modalAncho", value: prod.Ancho && prod.Ancho !== "—" ? prod.Ancho + " cm" : null },
        { id: "modalProfundidad", value: prod.Profundidad && prod.Profundidad !== "—" ? prod.Profundidad + " cm" : null },
        { id: "modalPeso", value: prod.Peso && prod.Peso !== "—" ? prod.Peso + " g" : null },
        { id: "modalDiametro", value: prod.Diametro && prod.Diametro !== "—" ? prod.Diametro + " mm" : null },
        { id: "modalGenero", value: prod.Genero || prod.genero },
        { id: "modalCantidadRuedas", value: prod.CantidadRuedas || prod.cantidadRuedas },
        { id: "modalFuelleExpandible", value: prod.FuelleExpandible === true ? "Sí" : prod.FuelleExpandible === false ? "No" : null },
        { id: "modalTipoCierre", value: prod.TipoCierre || prod.tipoCierre },
        { id: "modalStock", value: prod.Stock || prod.stock },
    ];

    let visibles = 0;
    camposDisponibles.forEach(campo => {
        const el = document.getElementById(campo.id);
        if (!el) return;
        const valor = campo.value;
        const valido = valor !== null && valor !== undefined &&
            valor !== "" && valor !== "0" && valor !== "—" &&
            valor !== "null" && String(valor).trim() !== "";

        el.classList.remove("centrado");
        if (valido) {
            el.textContent = safeText(valor);
            el.hidden = false;
            visibles++;
        } else {
            el.hidden = true;
        }
    });

    // Centrar el último si la cantidad es impar
    if (visibles % 2 !== 0) {
        const grid = document.querySelector(".modal-info-grid");
        const ultimo = grid ? [...grid.querySelectorAll("p:not([hidden])")].at(-1) : null;
        if (ultimo) ultimo.classList.add("centrado");
    }

    /* ================= AJUSTES VISUALES ================= */
    toggleFieldsByTipo(prod.Nombre || prod.nombre || "", false, "view");

    /* ================= ADMIN ================= */
    const adminBox = document.getElementById("modalAdminButtons");
    const correo = localStorage.getItem("correoDelicata");
    if (adminBox) {
        const esAdmin = correo === "reflej8@hotmail.com" || correo === "tec.jereferreyra@gmail.com";
        adminBox.style.display = esAdmin ? "flex" : "none";
    }

    /* ================= WHATSAPP ================= */
    const btnWpp = document.getElementById("btnWhatsapp");
    if (btnWpp) {
        const nombreProducto = safeText(prod.Nombre || prod.nombre);
        const modelo = safeText(prod.Modelo || prod.modelo);
        const color = safeText(prod.Color || prod.color);
        const marca = safeText(prod.Marca || prod.marca);
        const material = safeText(prod.Material || prod.material);

        // Construir URL absoluta de la imagen
        const imagenRelativa = prod.ImagenUrl || prod.imagenUrl || "";
        const imagenAbsoluta = imagenRelativa.startsWith("http")
            ? imagenRelativa
            : `https://delicata-eleganza.onrender.com${imagenRelativa}`;

        const mensaje = `¡Hola Edgar!, me gustaría saber el precio de este producto:\n` +
            `Nombre: ${nombreProducto}\n` +
            `Modelo: ${modelo}\n` +
            `Color: ${color}\n` +
            `Marca: ${marca}\n` +
            `Material: ${material}\n` +
            `Foto: ${imagenAbsoluta}`;

        btnWpp.href = `https://wa.me/+5493573692940?text=${encodeURIComponent(mensaje)}`;
        btnWpp.target = "_blank";
        btnWpp.rel = "noopener noreferrer";
    }

    /* ================= CARRITO ================= */
    const btnCarrito = document.getElementById("btnAgregarCarritoModal");
    if (btnCarrito) {

        if (btnCarrito._abortCarrito) btnCarrito._abortCarrito.abort();
        btnCarrito._abortCarrito = new AbortController();

        btnCarrito.addEventListener("click", () => {
            const correoSesion = localStorage.getItem("correoDelicata");
            if (!correoSesion) {
                mostrarToast("Tenés que iniciar sesión para agregar al carrito.", "info", 3500);
                setTimeout(() => openUserModalAsLogin(), 400);
                return;
            }
            if (typeof abrirDialogCantidad === "function") {
                abrirDialogCantidad(prod);
            }
        }, { signal: btnCarrito._abortCarrito.signal });
    }

    // Abrir el modal DESPUÉS de armar todo el contenido,
    // así el fade-in del modal cubre cualquier re-render del carrusel
    if (prod._imagenesCache) {
        // Ya tenemos todas las imágenes en caché: renderizar directo y abrir
        renderCarrusel(prod._imagenesCache, safeText(prod.Nombre || prod.nombre));
        abrirModalProducto();
    } else {
        // Sin caché: true = parcial, oculta flechas sin flash
        renderCarrusel([imagenPrincipal], safeText(prod.Nombre || prod.nombre), true);
        abrirModalProducto();
        fetch(`/api/Productos/${prod.IdProducto}`)
            .then(r => r.ok ? r.json() : null)
            .then(detalle => {
                if (!detalle) return;
                const extras = detalle.imagenes || detalle.Imagenes || [];
                const todas = extras.length > 0
                    ? [safeText(detalle.imagenUrl || detalle.ImagenUrl || imagenPrincipal), ...extras]
                    : [imagenPrincipal];
                prod._imagenesCache = todas;
                if (domCache.modal?.classList.contains("show")) {
                    const wrapper = document.getElementById("carruselWrapper");
                    if (wrapper) wrapper.style.minHeight = wrapper.offsetHeight + "px";
                    // false = definitivo, muestra/oculta flechas según corresponda
                    renderCarrusel(todas, safeText(prod.Nombre || prod.nombre), false);
                    requestAnimationFrame(() => { if (wrapper) wrapper.style.minHeight = ""; });
                }
            })
            .catch(() => { });
    }
}
/* ---------------- INTERSECTION OBSERVER OPTIMIZADO ---------------- */
// LÍNEA 562-566 — CAMBIAR
const cardObserver = new IntersectionObserver(
    (entries, observer) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                const delay = window.innerWidth < 768 ? (index % 2) * 60 : 0;
                setTimeout(() => {
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                }, delay);
            }
        });
    },
    {
        root: null,
        threshold: 0,
        rootMargin: "200px 0px"
    }
);

/* ---------------- RENDERIZADO PROGRESIVO OPTIMIZADO ---------------- */
function renderizarProductosProgresivo() {
    const contenedor = document.getElementById("contenedor-productos");
    const hasta = Math.min(productosRenderizados + BLOQUE_CARGA, productosFiltrados.length);

    // DocumentFragment para mejor rendimiento
    const fragment = document.createDocumentFragment();

    for (let i = productosRenderizados; i < hasta; i++) {
        const card = crearTarjetaDOM(productosFiltrados[i], i);

        fragment.appendChild(card);
    }

    contenedor.appendChild(fragment);
    productosRenderizados = hasta;

    const btnVerMas = document.getElementById("btnVerMas");
    btnVerMas.style.display = productosRenderizados < productosFiltrados.length ? "block" : "none";
}
/* ---------------- FILTROS POR CATEGORÍA ---------------- */
const categoriaLinks = document.querySelectorAll('.categories a');

const normalizar = texto =>
    texto.toString().toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

categoriaLinks.forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        categoriaLinks.forEach(l => l.classList.remove('active-cat'));
        e.target.classList.add('active-cat');
        aplicarFiltros();
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
});
const COLOR_SINONIMOS = {
    "negro": ["negro", "negra", "negros", "negras", "black", "ebano", "carbon", "oscuro", "oscuras", "oscuros"],
    "blanco": ["blanco", "blanca", "blancos", "blancas", "white", "marfil", "crema", "blanquito"],
    "rojo": ["rojo", "roja", "rojos", "rojas", "red", "bordo", "bordeau", "granate"],
    "azul": ["azul", "azules", "blue", "marino", "celeste", "navy"],
    "verde": ["verde", "verdes", "green", "oliva", "militar", "kaki", "verde francia"],
    "marron": ["marron", "marrones", "marron", "cafe", "tabaco", "cognac", "camel", "cuero"],
    "rosa": ["rosa", "rosas", "pink", "fucsia", "salmon"],
    "lila": ["lila", "lilas", "violeta", "violetas", "morado", "morada", "purple"],
    "gris": ["gris", "grises", "grey", "gray", "plata", "plateado", "plateada"],
    "dorado": ["dorado", "dorada", "dorados", "doradas", "gold", "oro"],
    "naranja": ["naranja", "naranjas", "orange", "terracota"],
    "amarillo": ["amarillo", "amarilla", "amarillos", "amarillas", "yellow"],
    "beige": ["beige", "beis", "nude", "arena", "tostado", "tostada", "nute", "nutes"],
};

// Genera texto extra de sinónimos para un producto dado su color
function expandirConSinonimos(color) {
    if (!color || color === "—") return "";
    const colorNorm = normalizar(color);
    for (const [canonical, sinonimos] of Object.entries(COLOR_SINONIMOS)) {
        if (sinonimos.some(s => colorNorm.includes(s))) {
            return sinonimos.join(" ");
        }
    }
    return colorNorm;
}
function recalcularCamposBusqueda(prod) {
    const altoStr = prod.Alto && prod.Alto !== "—" ? String(prod.Alto) : null;
    const anchoStr = prod.Ancho && prod.Ancho !== "—" ? String(prod.Ancho) : null;
    const profStr = prod.Profundidad && prod.Profundidad !== "—" ? String(prod.Profundidad) : null;
    const pesoStr = prod.Peso && prod.Peso !== "—" ? String(prod.Peso) : null;
    const diamStr = prod.Diametro && prod.Diametro !== "—" ? String(prod.Diametro) : null;

    prod._camposNormalizados = [
        prod.Nombre, prod.Modelo, prod.Color,
        prod.Marca, prod.Material, prod.Tipo,
        prod.Capacidad, prod.Categoria,
        prod.Genero, prod.TipoCierre,
        String(prod.Stock ?? ""),
        prod.Compartimentos !== "—" ? String(prod.Compartimentos) : null,
        prod.CantidadRuedas !== "—" ? String(prod.CantidadRuedas) : null,
        prod.Disponible ? "disponible" : "sin stock",
        altoStr ? altoStr + "cm" : null,
        altoStr ? altoStr + " cm" : null,
        anchoStr ? anchoStr + "cm" : null,
        anchoStr ? anchoStr + " cm" : null,
        profStr ? profStr + "cm" : null,
        pesoStr ? pesoStr + "g" : null,
        pesoStr ? pesoStr + " g" : null,
        diamStr ? diamStr + "mm" : null,
        diamStr ? diamStr + " mm" : null,
        altoStr, anchoStr, profStr, pesoStr, diamStr,
        expandirConSinonimos(prod.Color),   // ← AGREGAR ESTA LÍNEA
    ].filter(v => v && v !== "—" && v !== "null" && String(v).trim() !== "")
        .join(" ")
        .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/-/g, " ");

    return prod;
}
function renderSkeletons(cantidad = 8) {
    const contenedor = document.getElementById("contenedor-productos");
    if (!contenedor) return;

    contenedor.innerHTML = "";

    const fragment = document.createDocumentFragment();
    for (let i = 0; i < cantidad; i++) {
        const skel = document.createElement("div");
        skel.className = "product-card-skeleton";
        skel.innerHTML = `
            <div class="skeleton-image"></div>
            <div class="skeleton-title"></div>
            <div class="skeleton-price"></div>
            <div class="skeleton-buttons"></div>
        `;
        fragment.appendChild(skel);
    }
    contenedor.appendChild(fragment);
}

/* ---------------- CARGA DE PRODUCTOS OPTIMIZADA ---------------- */
async function cargarProductos(forzar = false) {
    if (isLoadingProductos) return;
    isLoadingProductos = true;

    try {
        if (productosData.length === 0) renderSkeletons(8);

        const resp = await fetch(API_URL, {
            headers: forzar
                ? { "Cache-Control": "no-cache, no-store" }
                : { "Cache-Control": "max-age=60" }
        });
        if (!resp.ok) throw new Error("Error cargando productos");

        const data = await resp.json();
        productosData = data.map(p => {
            const prod = normalizarProducto(p);
            return recalcularCamposBusqueda(prod);
        });
        aplicarFiltros();
    } catch (err) {
        console.error("Error cargando productos", err);
        const contenedor = document.getElementById("contenedor-productos");
        contenedor.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--color-marca-oro);">
            <p style="font-size:1.1rem; margin-bottom:12px;">⏳ El servidor está iniciando, esto puede tardar hasta 1 minuto...</p>
            <p style="font-size:0.9rem; opacity:0.7;">Por favor esperá y recargá la página en unos segundos.</p>
        </div>`;
    } finally {
        isLoadingProductos = false;
    }
}
function levenshtein(a, b) {
    const m = a.length, n = b.length;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
        const curr = [i];
        for (let j = 1; j <= n; j++) {
            curr[j] = a[i - 1] === b[j - 1]
                ? prev[j - 1]
                : 1 + Math.min(prev[j], curr[j - 1], prev[j - 1]);
        }
        prev = curr;
    }
    return prev[n];
}
function parsearGrupos(textoBusqueda) {
    const raw = textoBusqueda.split(/\s+/).filter(Boolean);
    const grupos = [];

    for (let i = 0; i < raw.length; i++) {
        const tok = raw[i];

        if (PALABRAS_IGNORAR.has(tok)) continue;

        // Si el token anterior era "y", este token es una alternativa OR del último grupo
        if (tok === "y" || tok === "o") continue;

        const prevRaw = i > 0 ? raw[i - 1] : null;
        if ((prevRaw === "y" || prevRaw === "o") && grupos.length > 0) {
            grupos[grupos.length - 1].push(tok);
        } else {
            grupos.push([tok]);
        }
    }

    return grupos;
}


function palabraMatchFuzzy(palabra, textoNormalizado) {
    const tokens = textoNormalizado.split(/\s+/);
    if (tokens.includes(palabra)) return true;
    // Si tiene dígitos: solo match exacto por inclusión
    if (/\d/.test(palabra)) {
        return tokens.some(token => token.includes(palabra));
    }
    // Palabras cortas (<=4 letras): sin tolerancia a errores
    const maxDist = palabra.length <= 6 ? 0 : 1;
    if (maxDist === 0) return false;
    return tokens.some(token => {
        if (Math.abs(token.length - palabra.length) > maxDist) return false;
        return levenshtein(palabra, token) <= maxDist;
    });
}


const PALABRAS_IGNORAR = new Set([
    "con", "de", "para", "del", "en", "a", "el", "la", "los", "las", "un", "una",
    "modelo", "color", "medidas", "marca", "material", "tipo", "categoria",
    "alto", "lrg", "alt", "largo", "capacidad", "compartimentos",
    "tipo", "cierre", "simple", "doble",   // ← cierre/tipo no deben ser términos solos
    "por", "x", "cm", "mm", "de", "y",    // ← separadores de medidas
    "unisex", "mixto", "milimetros", "modelo", "profundidad", "peso", "g", "diametro", "fuelle", "expandible", "stock", "genero", "cantidad", "ruedas", "ancho", "triple", "imantado", "a presion"
]);


function normalizarTermino(p) {
    return p
        .replace(/os$/, "o")
        .replace(/as$/, "a")
        .replace(/es$/, "");
}

function matchBusquedaFuzzy(camposNormalizados, textoBusqueda) {
    const grupos = parsearGrupos(textoBusqueda);
    if (grupos.length === 0) return true;

    return grupos.every(alternativas =>
        alternativas.some(palabra => {
            const normalizada = normalizarTermino(palabra);
            return palabraMatchFuzzy(palabra, camposNormalizados) ||
                palabraMatchFuzzy(normalizada, camposNormalizados);
        })
    );
}

// ─── Función principal de filtrado ────────────────────────────
const CATEGORIAS_MAP = {
    "marroquineria": "marroquineria",
    "bijouterie": "bijouterie",
    "complementos": "complementos",
    "articulos de viaje": "articulos de viaje"
};

const aplicarFiltros = () => {
    const textoBusqueda = normalizar(domCache.searchInput?.value || "")
        .replace(/-/g, " ")
        .replace(/\balt\.?\b/gi, "")
        .replace(/\blrg\.?\b/gi, "")
        .replace(/\bpor\b/gi, "")    // ← AGREGAR: "por" = separador de medidas
        .replace(/\baltо\b/gi, "")
        .replace(/\blargo\b/gi, "")
        .replace(/\bancho\b/gi, "")  // ← AGREGAR: "ancho" ya está en los campos
        .replace(/\bx\b/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();

    const categoriaActivaRaw = [...(domCache.categoriesLinks || [])]
        .find(l => l.classList.contains("active-cat"))?.dataset.cat
        || window._categoriaMobileActiva
        || "todos";
    window._categoriaMobileActiva = null; // limpiar después de usar
    const categoriaActiva = normalizar(categoriaActivaRaw);

    // 1. Filtrar por categoría (match exacto normalizado)
    let base;
    if (categoriaActiva === "" || categoriaActiva === "todos") {
        base = [...productosData];
    } else {
        base = productosData.filter(p => {
            const cat = normalizar(
                p.Categoria?.Nombre ||
                p.categoria?.Nombre ||
                p.Categoria ||
                p.categoria || ""
            );
            // match exacto: la categoría del producto debe ser exactamente la activa
            return cat === categoriaActiva || cat.startsWith(categoriaActiva);
        });
    }

    // 2. Filtrar por búsqueda fuzzy multi-palabra (solo sobre el base ya filtrado)
    if (textoBusqueda !== "") {
        base = base.filter(p => matchBusquedaFuzzy(p._camposNormalizados, textoBusqueda));
    }

    productosFiltrados = base;
    productosRenderizados = 0;

    const contenedor = document.getElementById("contenedor-productos");
    contenedor.replaceChildren();

    if (productosFiltrados.length === 0) {
        contenedor.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:50px;color:var(--color-marca-oro);">
                <p>No se encontraron productos para "${document.getElementById("searchInput")?.value}"</p>
            </div>`;
        const btnVerMas = document.getElementById("btnVerMas");
        if (btnVerMas) btnVerMas.style.display = "none";
        return;
    }

    renderizarProductosProgresivo();
};

// NOTA: Los listeners de búsqueda se registran dentro del DOMContentLoaded
// de inicialización (línea ~1177) para garantizar que domCache ya fue inicializado.
function editarProducto(prod) {
    abrirModalAdmin("modalEditar");
    cargarFKs().catch(e => console.warn(e));

    const preview = document.getElementById("previewImgEditar");
    if (prod.imagenUrl) {
        preview.src = prod.imagenUrl;
        preview.style.display = "block";
    } else {
        preview.style.display = "none";
    }

    const input = document.getElementById("prodImagenEditar");
    cargarPreviewImagen(input, preview);
}

function cargarPreviewImagen(inputFile, imgPreview) {
    if (!inputFile || !imgPreview) return;


    const nuevoInput = inputFile.cloneNode(true);
    inputFile.replaceWith(nuevoInput);

    imgPreview.src = "";
    imgPreview.style.display = "none";

    nuevoInput.addEventListener("change", () => {
        const file = nuevoInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = e => {
                imgPreview.src = e.target.result;
                imgPreview.style.display = "block";
            };
            reader.readAsDataURL(file);
        } else {
            imgPreview.src = "";
            imgPreview.style.display = "none";
        }
    });
}

/* ---------------- USUARIOS (LOGIN/REGISTER) ---------------- */
function openUserModalAsLogin() {
    const userModal = domCache.userModal;
    const userModalContent = domCache.userModalContent;
    if (!userModal || !userModalContent) return;
    userModal.style.display = "flex";
    lockScroll();

    userModalContent.innerHTML = `
    <button class="close-user" aria-label="Cerrar login">&times;</button>
    <h2 class="user-title">Iniciar sesión</h2>
    <form id="loginFormLocal">
        <input type="email" id="loginCorreoLocal" placeholder="Correo electrónico" required aria-label="Correo electrónico">
        <input type="password" id="loginContrasenaLocal" placeholder="Contraseña" required aria-label="Contraseña">
        <div class="forgot-container">
            <a href="#" id="linkOlvidaste" class="forgot-password">¿Olvidaste tu contraseña?</a>
        </div>
        <button type="submit" class="btn-user">Iniciar Sesión</button>
    </form>
    <hr>
    <p>¿No tenés cuenta?</p>
    <button id="toRegisterBtn" class="btn-user">Registrar</button>
    `;

    const linkOlvidaste = document.getElementById("linkOlvidaste");
    linkOlvidaste?.addEventListener("click", (e) => {
        e.preventDefault();
        userModal.style.display = "none";
        openRecuperarModal();
    });

    const closeUserInner = userModalContent.querySelector(".close-user");
    closeUserInner?.addEventListener("click", () => {
        userModal.style.display = "none";
        unlockScroll();
    });

    const toRegisterBtn = document.getElementById("toRegisterBtn");
    toRegisterBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        openUserModalAsRegister();
    });

    const loginFormLocal = document.getElementById("loginFormLocal");
    loginFormLocal?.addEventListener("submit", async (ev) => {
        ev.preventDefault();
        const correo = document.getElementById("loginCorreoLocal").value.trim();
        const contrasena = document.getElementById("loginContrasenaLocal").value.trim();
        if (!correo || !contrasena) {
            showLoginMessage("Completá correo y contraseña", "error");
            return;
        }

        const btn = loginFormLocal.querySelector("button[type='submit']");

        try {
            btn.disabled = true;
            btn.textContent = "Conectando...";
            showLoginMessage("Conectando con el servidor, aguardá un momento...", "info");

            let res;
            for (let intento = 0; intento < 2; intento++) {
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), 60000); // 60s para el cold start
                try {
                    res = await fetch(`${USUARIOS_URL}/login`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ correo, contrasena }),
                        signal: controller.signal
                    });
                    clearTimeout(timer);
                    break;
                } catch (innerErr) {
                    clearTimeout(timer);
                    if (intento === 0) {
                        showLoginMessage("El servidor está iniciando, reintentando...", "info");
                        await new Promise(r => setTimeout(r, 3000));
                    } else {
                        throw innerErr;
                    }
                }
            }

            btn.disabled = false;
            btn.textContent = "Iniciar Sesión";

            if (res.ok) {
                const data = await res.json();
                const nombreMostrar = data.userName || data.Nombre || data.nombre || data.user || "Usuario";
                const correoMostrar = data.correo || correo;
                localStorage.setItem("usuarioDelicata", nombreMostrar);
                localStorage.setItem("correoDelicata", correoMostrar);
                if (typeof restaurarCarritoUsuario === "function") {
                    restaurarCarritoUsuario(correoMostrar);
                }
                mostrarToast("Inicio de sesión con éxito ✨", "success");
                setTimeout(() => {
                    userModal.style.display = "none";
                    unlockScroll();
                }, 700);
                verificarUsuarioAutorizado();
            } else if (res.status === 401) {
                showLoginMessage("Credenciales incorrectas.", "error");
            } else {
                showLoginMessage("Error en el servidor. Intenta nuevamente.", "error");
            }
        } catch (err) {
            btn.disabled = false;
            btn.textContent = "Iniciar Sesión";
            console.error("Error en login:", err);
            showLoginMessage("No se pudo conectar. Verificá tu internet e intentá de nuevo.", "error");
        }
    });

    registrarCierreBackdrop(userModal, () => {
        userModal.style.display = "none";
        unlockScroll();
    });
}

function openUserModalAsRegister() {
    const userModal = domCache.userModal;
    const userModalContent = domCache.userModalContent;
    if (!userModal || !userModalContent) return;
    userModal.style.display = "flex";
    lockScroll();

    userModalContent.innerHTML = `
        <button class="close-user" aria-label="Cerrar registro">&times;</button>
        <h2>Crear cuenta</h2>
        <form id="registerFormLocal">
          <input type="text" placeholder="Nombre completo" id="regNombreLocal" required>
          <input type="email" placeholder="Correo electrónico" id="regCorreoLocal" required>
          <input type="password" placeholder="Contraseña" id="regContrasenaLocal" required>
          <button type="submit" class="btn-user">Registrar</button>
        </form>
        <hr>
        <p>¿Ya tenés cuenta?</p>
        <button id="toLoginBtn" class="btn-user">Iniciar Sesión</button>
    `;

    const closeUserInner = userModalContent.querySelector(".close-user");
    closeUserInner?.addEventListener("click", () => {
        userModal.style.display = "none";
        unlockScroll();
    });

    const toLoginBtn = document.getElementById("toLoginBtn");
    toLoginBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        openUserModalAsLogin();
    });

    const registerFormLocal = document.getElementById("registerFormLocal");
    registerFormLocal?.addEventListener("submit", async (ev) => {
        ev.preventDefault();
        const nombre = document.getElementById("regNombreLocal").value.trim();
        const correo = document.getElementById("regCorreoLocal").value.trim();
        const contrasena = document.getElementById("regContrasenaLocal").value.trim();
        if (!nombre || !correo || !contrasena) {
            showLoginMessage("Completá todos los campos", "error");
            return;
        }

        try {
            showLoginMessage("Conectando con el servidor, aguardá un momento...", "info");
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 90000);
            const res = await fetch(`${USUARIOS_URL}/registro`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ Nombre: nombre, Correo: correo, Contrasena: contrasena }),
                signal: controller.signal
            });
            clearTimeout(timer);

            if (res.ok) {
                showLoginMessage("Cuenta creada con éxito 🎉", "success");
                localStorage.setItem("usuarioDelicata", nombre);
                localStorage.setItem("correoDelicata", correo);
                verificarUsuarioAutorizado();
                setTimeout(() => {
                    userModal.style.display = "none";
                    unlockScroll();
                }, 700);
            } else {
                let texto = "Error al registrar usuario, el correo ya está en uso.";
                try {
                    const j = await res.json();
                    if (j && j.message) texto = j.message;
                } catch (e) { }
                showLoginMessage(texto, "error");
            }
        } catch (err) {
            console.error("Registro error:", err);
            showLoginMessage("Error de conexión al servidor.", "error");
        }
    });
    registrarCierreBackdrop(userModal, () => {
        userModal.style.display = "none";
        unlockScroll();
    });
}
const modalImgContainer = document.querySelector(".modal-img-container");
const esTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

if (modalImgContainer && !esTouchDevice) {
    let isZoomActive = false;
    let leaveTimeout = null;
    let animFrameId = null;
    let currentX = 50, currentY = 50;
    let targetX = 50, targetY = 50;
    let cachedRect = null;

    function getActiveImg() {
        return modalImgContainer.querySelector(".carrusel-slide.active img")
            || modalImgContainer.querySelector("img");
    }

    function lerp(a, b, t) { return a + (b - a) * t; }

    function activarZoom(clientX, clientY) {
        const img = getActiveImg();
        if (!img) return;
        clearTimeout(leaveTimeout);
        cachedRect = modalImgContainer.getBoundingClientRect();
        isZoomActive = true;
        if (clientX !== undefined) {
            currentX = ((clientX - cachedRect.left) / cachedRect.width) * 100;
            currentY = ((clientY - cachedRect.top) / cachedRect.height) * 100;
            targetX = currentX; targetY = currentY;
        }
        img.style.transform = "scale(2.8)";
        if (!animFrameId) animFrameId = requestAnimationFrame(animateOrigin);
    }

    function desactivarZoom() {
        const img = getActiveImg();
        isZoomActive = false;
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
        cachedRect = null;
        if (img) {
            img.style.transformOrigin = "center";
            clearTimeout(leaveTimeout);
            leaveTimeout = setTimeout(() => { img.style.transform = "scale(1)"; }, 80);
        }
    }

    function animateOrigin() {
        if (!isZoomActive) { animFrameId = null; return; }
        const img = getActiveImg();
        if (!img) { animFrameId = null; return; }
        currentX = lerp(currentX, targetX, 0.18);
        currentY = lerp(currentY, targetY, 0.18);
        img.style.transformOrigin = `${currentX.toFixed(2)}% ${currentY.toFixed(2)}%`;
        animFrameId = requestAnimationFrame(animateOrigin);
    }

    modalImgContainer.addEventListener("mousemove", (e) => {
        const sobreFlecha = e.target.closest && e.target.closest(".carrusel-btn");
        if (sobreFlecha) {
            if (isZoomActive) desactivarZoom();
            return;
        }
        // Re-activar zoom si el mouse viene de una flecha
        if (!isZoomActive) activarZoom(e.clientX, e.clientY);
        cachedRect = modalImgContainer.getBoundingClientRect();
        const rawX = ((e.clientX - cachedRect.left) / cachedRect.width) * 100;
        const rawY = ((e.clientY - cachedRect.top) / cachedRect.height) * 100;
        // Clamp: el zoom no llega a los bordes donde están los botones
        targetX = Math.max(18, Math.min(82, rawX));
        targetY = Math.max(10, Math.min(90, rawY));
    }, { passive: true });

    modalImgContainer.addEventListener("mouseenter", (e) => {
        if (e.target.closest && e.target.closest(".carrusel-btn")) return;
        activarZoom(e.clientX, e.clientY);
    });

    modalImgContainer.addEventListener("mouseleave", (e) => {
        desactivarZoom();
    });

    window.addEventListener("resize", () => {
        if (isZoomActive) cachedRect = modalImgContainer.getBoundingClientRect();
    }, { passive: true });
}
/* ---------------- INICIALIZACIÓN OPTIMIZADA ---------------- */
document.addEventListener("DOMContentLoaded", () => {
    // Carga inicial crítica
    cargarProductos();
    verificarUsuarioAutorizado();

    document.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === "Go") {
            const tag = document.activeElement?.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA") {
                document.activeElement.blur();
            }
        }
    });
    // Carga diferida de FKs
    if (typeof requestIdleCallback === "function") {
        requestIdleCallback(() => cargarFKs(), { timeout: 2000 });
    } else {
        setTimeout(() => cargarFKs(), 2000);
    }

    const nombreGuardado = localStorage.getItem("usuarioDelicata");
    if (nombreGuardado) {
        actualizarSaludos(nombreGuardado);
    }

    const link = document.getElementById("linkOlvidaste");
    if (link) {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            mostrarFormularioRecuperar();
        });
    }

    const createAccountBtn = document.getElementById("createAccount");
    if (createAccountBtn) {
        createAccountBtn.addEventListener("click", (e) => {
            e.preventDefault();
            openUserModalAsRegister();
        });
    }

    const nombreInput = document.getElementById("prodNombre");
    if (nombreInput) {
        nombreInput.addEventListener("input", e => {
            toggleFieldsByTipo(e.target.value, false, "form");
        });
    }

    const tipoInput = document.getElementById("prodTipo");
    if (tipoInput) {
        tipoInput.addEventListener("input", e => {
            toggleFieldsByTipo(e.target.value, false, "form");
        });
        tipoInput.addEventListener("change", e => {
            toggleFieldsByTipo(e.target.value, false, "form");
        });
    }

    const nombreEditarInput = document.getElementById("prodNombreEditar");
    if (nombreEditarInput) {
        nombreEditarInput.addEventListener("input", e => {
            toggleFieldsByTipo(e.target.value, true, "edit");
        });
    }

    const tipoEditarInput = document.getElementById("prodTipoEditar");
    if (tipoEditarInput) {
        tipoEditarInput.addEventListener("input", e => {
            toggleFieldsByTipo(e.target.value, true, "edit");
        });
        tipoEditarInput.addEventListener("change", e => {
            toggleFieldsByTipo(e.target.value, true, "edit");
        });
    }

    // ── Búsqueda: registrar aquí para garantizar que domCache ya está listo ──
    const busquedaDebounced = debounce(aplicarFiltros, 300);
    if (domCache.searchInput) domCache.searchInput.addEventListener("input", busquedaDebounced);
    if (domCache.btnBuscar) domCache.btnBuscar.addEventListener("click", aplicarFiltros);

    hamburger = document.querySelector(".hamburger");
    mobileMenu = document.querySelector(".mobile-menu");

    hamburger?.addEventListener("click", (e) => {
        e.stopPropagation();
        const abierto = mobileMenu.classList.toggle("active");
        hamburger.setAttribute("aria-expanded", abierto);
        mobileMenu.setAttribute("aria-hidden", !abierto);

        // Actualizar theme-color para Safari
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            metaTheme.setAttribute('content', '#111111'); // siempre negro
        }

        abierto ? lockScroll() : unlockScroll();
    });
    // ── Cerrar menú al tocar fuera (tap en overlay) ──
    document.addEventListener("click", (e) => {
        if (
            mobileMenu?.classList.contains("active") &&
            !mobileMenu.contains(e.target) &&
            !hamburger.contains(e.target)
        ) {
            mobileMenu.classList.remove("active");
            hamburger.setAttribute("aria-expanded", "false");
            mobileMenu.setAttribute("aria-hidden", "true");
            document.body.style.backgroundColor = '';
            unlockScroll();
        }
    }); 
    document.querySelectorAll(".mobile-categories li").forEach(item => {
        item.addEventListener("click", (e) => {
            e.stopPropagation();
            const cat = item.dataset.cat;

            mobileMenu.classList.remove("active");
            hamburger.setAttribute("aria-expanded", false);
            mobileMenu.setAttribute("aria-hidden", true);
            document.body.style.backgroundColor = '';

            // Limpiar active-cat de todos los links desktop
            categoriaLinks.forEach(l => l.classList.remove('active-cat'));

            // Buscar el link desktop comparando con normalizar() igual que hace aplicarFiltros
            const catNorm = normalizar(cat);
            const linkDesktop = [...categoriaLinks].find(l => normalizar(l.dataset.cat || "") === catNorm);
            if (linkDesktop) {
                linkDesktop.classList.add('active-cat');
            } else {
                // Fallback: guardar la categoría para que aplicarFiltros la use directamente
                window._categoriaMobileActiva = cat;
            }

            _menuCerradoRecien = true;
            setTimeout(() => { _menuCerradoRecien = false; }, 600);

            aplicarFiltros();
            unlockScroll();

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                });
            });
        });
    });
    const closeBtn = document.querySelector(".menu-close");
    closeBtn?.addEventListener("click", () => {
        mobileMenu.classList.remove("active");
        hamburger.setAttribute("aria-expanded", false);
        mobileMenu.setAttribute("aria-hidden", true);
        document.body.style.backgroundColor = '';
        unlockScroll();
    });

    const btnVerMas = document.getElementById("btnVerMas");
    if (btnVerMas) {
        btnVerMas.addEventListener("click", renderizarProductosProgresivo);
    }

    const inputImg = document.getElementById("prodImagen");
    const preview = document.getElementById("imgPreviewAgregar");
    const wrapPrincipal = document.getElementById("wrapPreviewPrincipalAgregar");

    if (inputImg && preview) {
        inputImg.addEventListener("change", () => {
            const file = inputImg.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = e => {
                preview.src = e.target.result;
                preview.style.display = "block";                    // ← ÚNICO CAMBIO
                if (wrapPrincipal) wrapPrincipal.style.display = "block";
            };
            reader.readAsDataURL(file);
        });
    }

    // ── Imágenes extra Agregar: acumulación con cruz y lápiz ──
    const inputImgExtra = document.getElementById("prodImagenesExtra");
    const prevGridAgregar = document.getElementById("previewGridAgregar");
    if (inputImgExtra && prevGridAgregar) {
        window._archivosExtraAgregar = window._archivosExtraAgregar || [];

        inputImgExtra.addEventListener("change", () => {
            Array.from(inputImgExtra.files).forEach(f => {
                window._archivosExtraAgregar.push(f);
                const idx = window._archivosExtraAgregar.length - 1;
                const reader = new FileReader();
                reader.onload = ev => {
                    const wrap = document.createElement("div");
                    wrap.className = "preview-img-wrap";
                    wrap.dataset.idx = idx;
                    wrap.innerHTML = `
                        <button type="button" class="btn-preview-remove" title="Quitar">✕</button>
                        <img src="${ev.target.result}" class="preview-thumb" alt="Extra ${idx + 1}">
                        <button type="button" class="btn-preview-edit" title="Reemplazar">✏ Reemplazar</button>
                    `;
                    // Cruz: quita la preview y marca el archivo como nulo
                    wrap.querySelector(".btn-preview-remove").addEventListener("click", () => {
                        window._archivosExtraAgregar[idx] = null;
                        wrap.remove();
                    });
                    // Lápiz: abre selector de archivo para reemplazar esa posición
                    wrap.querySelector(".btn-preview-edit").addEventListener("click", () => {
                        const tmp = document.createElement("input");
                        tmp.type = "file";
                        tmp.accept = "image/*";
                        tmp.onchange = () => {
                            const newFile = tmp.files[0];
                            if (!newFile) return;
                            window._archivosExtraAgregar[idx] = newFile;
                            const r2 = new FileReader();
                            r2.onload = ev2 => {
                                wrap.querySelector("img").src = ev2.target.result;
                            };
                            r2.readAsDataURL(newFile);
                        };
                        tmp.click();
                    });
                    prevGridAgregar.appendChild(wrap);
                };
                reader.readAsDataURL(f);
            });
            // Limpiar el input para permitir agregar el mismo archivo otra vez
            inputImgExtra.value = "";
        });
    }

    // ── Imágenes extra Editar: acumulación con cruz y lápiz ──
    const inputImgExtraEdit = document.getElementById("prodImagenesExtraEditar");
    const prevGridEditar = document.getElementById("previewGridEditar");
    if (inputImgExtraEdit && prevGridEditar) {
        window._archivosExtraEditar = window._archivosExtraEditar || [];

        inputImgExtraEdit.addEventListener("change", () => {
            Array.from(inputImgExtraEdit.files).forEach(f => {
                window._archivosExtraEditar.push(f);
                const idx = window._archivosExtraEditar.length - 1;
                const reader = new FileReader();
                reader.onload = ev => {
                    const wrap = document.createElement("div");
                    wrap.className = "preview-img-wrap preview-nueva";
                    wrap.dataset.idx = idx;
                    wrap.innerHTML = `
                        <button type="button" class="btn-preview-remove" title="Quitar">✕</button>
                        <img src="${ev.target.result}" class="preview-thumb" alt="Nueva ${idx + 1}">
                        <button type="button" class="btn-preview-edit" title="Reemplazar">✏ Reemplazar</button>
                    `;
                    wrap.querySelector(".btn-preview-remove").addEventListener("click", () => {
                        window._archivosExtraEditar[idx] = null;
                        wrap.remove();
                    });
                    wrap.querySelector(".btn-preview-edit").addEventListener("click", () => {
                        const tmp = document.createElement("input");
                        tmp.type = "file";
                        tmp.accept = "image/*";
                        tmp.onchange = () => {
                            const newFile = tmp.files[0];
                            if (!newFile) return;
                            window._archivosExtraEditar[idx] = newFile;
                            const r2 = new FileReader();
                            r2.onload = ev2 => {
                                wrap.querySelector("img").src = ev2.target.result;
                            };
                            r2.readAsDataURL(newFile);
                        };
                        tmp.click();
                    });
                    prevGridEditar.appendChild(wrap);
                };
                reader.readAsDataURL(f);
            });
            inputImgExtraEdit.value = "";
        });
    }
});
function eliminarPreviewPrincipalAgregar() {
    const preview = document.getElementById("imgPreviewAgregar");
    const wrap = document.getElementById("wrapPreviewPrincipalAgregar");
    const input = document.getElementById("prodImagen");
    if (preview) preview.src = "";
    if (wrap) wrap.style.display = "none";
    if (input) input.value = "";
}

function eliminarPreviewPrincipalEditar() {
    const preview = document.getElementById("imgPreviewEditar");
    const wrap = document.getElementById("wrapPreviewPrincipalEditar");
    const input = document.getElementById("prodImagenEditar");
    if (preview) preview.src = "";
    if (wrap) wrap.style.display = "none";
    if (input) input.value = "";
}
// Listener de logoutBtn movido a initDOMCache().

function openRecuperarModal() {
    const userModal = domCache.userModal;
    const userModalContent = domCache.userModalContent;
    if (!userModal || !userModalContent) return;

    userModal.style.display = "flex";
    lockScroll();

    userModalContent.innerHTML = `
        <button class="close-user" aria-label="Cerrar">&times;</button>
        <h2 class="user-title">Recuperar contraseña</h2>
        <input type="email" id="recuperarEmail" placeholder="Correo electrónico" required>
        <button id="btnRecuperar" class="btn-user">Enviar enlace</button>
    `;

    userModalContent.querySelector(".close-user")
        .addEventListener("click", () => {
            userModal.style.display = "none";
            unlockScroll();
        });

    document.getElementById("btnRecuperar").addEventListener("click", async () => {
        const email = document.getElementById("recuperarEmail").value.trim();

        if (!email) {
            alert("Ingresá un correo válido");
            return;
        }

        const res = await fetch(`${USUARIOS_URL}/recuperar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });

        if (!res.ok) {
            const texto = await res.text();
            console.error("ERROR BACKEND:", texto);
            alert("Error real del servidor. Mirá la consola.");
            return;
        }

        mostrarToast("Si el correo existe, se enviará un enlace.");
        userModal.style.display = "none";
        unlockScroll();
    });

    registrarCierreBackdrop(userModal, () => {
        userModal.style.display = "none";
        unlockScroll();
    });
}

function actualizarSaludos(nombre) {
    const greeting = document.getElementById("greeting");
    const mobileGreeting = document.getElementById("mobileGreeting");

    if (nombre) {
        greeting.textContent = `¡Hola ${nombre}!`;
        mobileGreeting.textContent = `¡Hola ${nombre}!`;
    } else {
        greeting.textContent = "¡Hola Visitante!";
        mobileGreeting.textContent = "¡Hola Visitante!";
    }
}

function mostrarLogoutConfirm() {
    const modal = document.createElement("div");
    modal.className = "modal-user";
    modal.style.display = "flex";

    modal.innerHTML = `
<div class="user-modal-content">
    <h2>¿Cerrar sesión?</h2>
    <p style="margin: 10px 0 20px;">¿Seguro que deseas cerrar sesión?</p>
    <div style="display:flex; justify-content:center; gap:1rem;">
        <button class="btn-delete js-confirm-logout">Sí, cerrar sesión</button>
        <button class="btn-cancel js-cancel-logout">Cancelar</button>
    </div>
</div>
`;

    document.body.appendChild(modal);
    lockScroll(); // ← bloquear scroll al abrir

    const cerrarLogout = () => {
        modal.remove();
        unlockScroll(); // ← restaurar scroll al cerrar
    };

    modal.querySelector(".js-confirm-logout").onclick = () => {
        const correoAlSalir = localStorage.getItem("correoDelicata");
        if (typeof guardarYLimpiarCarritoAlCerrarSesion === "function") {
            guardarYLimpiarCarritoAlCerrarSesion(correoAlSalir);
        }
        localStorage.removeItem("usuarioDelicata");
        localStorage.removeItem("correoDelicata");

        cerrarLogout();

        try {
            verificarUsuarioAutorizado?.();
            mostrarToast?.("Sesión cerrada correctamente", "success");
        } catch (e) {
            console.error(e);
        }
    };

    modal.querySelector(".js-cancel-logout").onclick = cerrarLogout;

    // También cerrar al hacer click en el backdrop
    modal.addEventListener("click", e => {
        if (e.target === modal) cerrarLogout();
    });
}

/* ---------------- VALIDACIONES & FK ---------------- */

function traducirErrorBackend(texto) {
    if (!texto) return "Error desconocido.";

    // Aseguramos que el texto sea un String
    const mensajeOriginal = String(texto);

    const traducciones = [
        [/the name field is required/i, "El nombre es obligatorio."],
        [/the nombre field is required/i, "El nombre es obligatorio."],
        [/the model(o)? (is|field is) required/i, "El modelo es obligatorio."],
        [/the color (is|field is) required/i, "El color es obligatorio."],
        [/the marca (is|field is) required/i, "La marca es obligatoria."],
        [/the brand (is|field is) required/i, "La marca es obligatoria."],
        [/the categor(ia|ía|y) (is|field is) required/i, "La categoría es obligatoria."],
        [/the tipo (is|field is) required/i, "El tipo es obligatorio."],
        [/the type (is|field is) required/i, "El tipo es obligatorio."],
        [/the material (is|field is) required/i, "El material es obligatorio."],
        [/the stock (is|field is) required/i, "El stock es obligatorio."],
        [/the stock (must be|should be) a number/i, "El stock debe ser un número."],
        [/the alto (is|field is) required/i, "El alto es obligatorio."],
        [/the largo (is|field is) required/i, "El largo es obligatorio."],
        [/the capacidad (is|field is) required/i, "La capacidad es obligatoria."],
        [/the compartimentos (is|field is) required/i, "Los compartimentos son obligatorios."],
        [/the imagen(url)? (is|field is) required/i, "La imagen es obligatoria."],
        [/the image (is|field is) required/i, "La imagen es obligatoria."],
        [/is required/i, "Campo obligatorio faltante."],
        [/must be a number/i, "El valor debe ser numérico."],
        [/invalid/i, "Valor inválido."],
        [/not found/i, "Producto no encontrado."],
        [/duplicate/i, "Ya existe un producto con esos datos."],
        [/unauthorized/i, "No tenés permiso para realizar esta acción."],
        [/bad request/i, "Los datos enviados son incorrectos."],
    ];

    for (const [patron, mensaje] of traducciones) {
        if (patron.test(mensajeOriginal)) return mensaje;
    }

    return mensajeOriginal;
}
function validarCampos(data, esEditar = false) {
    const suf = esEditar ? "Editar" : "";
    const errores = [];

    // Campos siempre obligatorios en ambos modos
    if (!data.Nombre?.trim()) errores.push("• El nombre es obligatorio.");
    if (!data.Modelo?.trim()) errores.push("• El modelo es obligatorio.");
    if (!data.Color?.trim()) errores.push("• El color es obligatorio.");
    if (!data.Categoria?.trim()) errores.push("• La categoría es obligatoria.");
    if (!data.Marca?.trim()) errores.push("• La marca es obligatoria.");

    if (data.Stock === "" || data.Stock === null || data.Stock === undefined || isNaN(Number(data.Stock)))
        errores.push("• El stock debe ser un número válido.");

    // Imagen solo al crear
    if (!esEditar) {
        const imgInput = document.getElementById("prodImagen");
        if (!imgInput?.files?.length)
            errores.push("• La imagen principal es obligatoria.");
    }

    // Helper visibilidad
    function campoVisible(id) {
        const el = document.getElementById(id);
        if (!el) return false;
        const col = el.closest(".col");
        return !col || col.style.display !== "none";
    }

    // Material y Tipo: obligatorios solo al CREAR
    // En edición ya están cargados, no forzar re-completar
    if (!esEditar) {
        if (campoVisible("prodMaterial") && !data.Material?.trim())
            errores.push("• El material es obligatorio.");
        if (campoVisible("prodTipo") && !data.Tipo?.trim())
            errores.push("• El tipo es obligatorio.");
    }

    // Campos dimensionales (alto, ancho, peso, etc.):
    // Solo obligatorios al CREAR y si están visibles.
    // En edición son siempre opcionales — el usuario puede modificar
    // solo lo que quiere sin tocar el resto.
    if (!esEditar) {
        if (campoVisible("prodAlto") && !data.Alto) errores.push("• El alto es obligatorio.");
        if (campoVisible("prodAncho") && !data.Ancho) errores.push("• El ancho es obligatorio.");
        if (campoVisible("prodCapacidad") && !data.Capacidad) errores.push("• La capacidad es obligatoria.");
        if (campoVisible("prodCompartimentos") && !data.Compartimentos) errores.push("• Los compartimentos son obligatorios.");
        if (campoVisible("prodProfundidad") && !data.Profundidad) errores.push("• La profundidad es obligatoria.");
        if (campoVisible("prodPeso") && !data.Peso) errores.push("• El peso es obligatorio.");
        if (campoVisible("prodGenero") && !data.Genero?.trim()) errores.push("• El género es obligatorio.");
        if (campoVisible("prodDiametro") && !data.Diametro) errores.push("• El diámetro es obligatorio.");
        if (campoVisible("prodCantidadRuedas") && (data.CantidadRuedas === "" || data.CantidadRuedas == null))
            errores.push("• La cantidad de ruedas es obligatoria.");
        if (campoVisible("prodTipoCierre") && !data.TipoCierre?.trim())
            errores.push("• El tipo de cierre es obligatorio.");
    }

    if (errores.length > 0) {
        alert("Por favor corregí los siguientes errores:\n\n" + errores.join("\n"));
        return false;
    }
    return true;
}

function aplicarNullCamposOcultos(data, esEditar = false) {
    const suf = esEditar ? "Editar" : "";

    const mapa = {
        Capacidad: `prodCapacidad${suf}`,
        Compartimentos: `prodCompartimentos${suf}`,
        Alto: `prodAlto${suf}`,
        Largo: `prodLargo${suf}`
    };

    for (const campo in mapa) {
        const el = document.getElementById(mapa[campo]);
        if (!el) continue;

        const col = el.closest(".col");
        if (col && col.style.display === "none") {
            data[campo] = null;
        }
    }

    return data;
}

function obtenerCampoVisible(idCrear, idEditar) {
    const crear = document.getElementById(idCrear);
    const editar = document.getElementById(idEditar);

    if (crear && crear.closest(".col").style.display !== "none") return crear;
    if (editar && editar.closest(".col").style.display !== "none") return editar;

    return crear || editar;
}

async function resolveOrCreateFK(endpoint, valor) {
    if (!valor || valor.trim() === "") return null;

    valor = valor.trim();

    try {
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error("No se pudo consultar " + endpoint);

        const items = await res.json();

        const encontrado = items.find(i =>
            (i.nombre ?? i.Nombre ?? "").toLowerCase() === valor.toLowerCase()
        );

        if (encontrado) {
            return (
                encontrado.id ?? encontrado.Id ??
                encontrado.IdCategoria ?? encontrado.IdMarca ??
                encontrado.IdTipo ?? encontrado.IdMaterial
            );
        }

        const crear = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre: valor })
        });

        if (!crear.ok) throw new Error("No se pudo crear FK en: " + endpoint);

        const creado = await crear.json();

        return (
            creado.id ?? creado.Id ??
            creado.IdCategoria ?? creado.IdMarca ??
            creado.IdTipo ?? creado.IdMaterial
        );

    } catch (err) {
        console.error("ERROR FK:", endpoint, err);
        alert("Error resolviendo FK: " + valor);
        return null;
    }
}

function getDataIdFromDatalist(datalistId, selectedValue) {
    const datalist = document.getElementById(datalistId);
    if (!datalist || !datalist.options) {
        console.error(`Datalist con ID ${datalistId} no encontrado o no tiene opciones`);
        return null;
    }

    const option = Array.from(datalist.options).find(opt => opt.value === selectedValue);

    if (!option) {
        console.error(`Opción con valor "${selectedValue}" no encontrada en ${datalistId}`);
        return null;
    }

    return option.dataset.id;
}

function abrirFormularioNuevo() {
    const modalAgregar = document.getElementById("modalAgregar");
    if (!modalAgregar) return;

    productoSeleccionado = null;

    const form = document.getElementById("formAgregar");
    form.reset();

    form.querySelectorAll("input, select, textarea").forEach(el => {
        if (el.type !== "button" && el.type !== "submit") {
            el.value = "";
        }
    });

    ["prodIdCategoria", "prodIdMarca", "prodIdTipo", "prodIdMaterial"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });

    const preview = document.getElementById("imgPreviewAgregar");
    if (preview) {
        preview.src = "";
        preview.style.display = "none";
    }

    const inputImg = document.getElementById("prodImagen");
    if (inputImg) inputImg.value = "";

    const inputImgExtra = document.getElementById("prodImagenesExtra");
    if (inputImgExtra) inputImgExtra.value = "";
    const prevGrid = document.getElementById("previewGridAgregar");
    if (prevGrid) prevGrid.innerHTML = "";
    window._archivosExtraAgregar = [];

    abrirModalAdmin("modalAgregar");

    requestIdleCallback(() => {
        cargarOpcionesDatalist().catch(console.warn);
    }, { timeout: 1000 });
}

function appendIfVisible(fd, inputId, fieldName, fallback = undefined) {
    const el = document.getElementById(inputId);
    if (!el) {
        if (fallback !== undefined) fd.append(fieldName, fallback);
        return;
    }

    const col = el.closest(".col");
    const visible = col ? (col.style.display !== "none") : true;

    if (visible) {
        const val = el.value?.trim();
        if (val !== "") {
            fd.append(fieldName, val);
        } else if (fallback !== undefined) {
            fd.append(fieldName, fallback);
        }
    } else {
        if (fallback !== undefined) {
            fd.append(fieldName, fallback);
        }
    }
}

async function guardarNuevoProducto() {
    try {
        // ── Validación client-side (un solo alert con todos los errores) ──
        const datosValidar = {
            Nombre: document.getElementById("prodNombre")?.value.trim() ?? "",
            Modelo: document.getElementById("prodModelo")?.value.trim() ?? "",
            Color: document.getElementById("prodColor")?.value.trim() ?? "",
            Marca: document.getElementById("prodMarca")?.value.trim() ?? "",
            Categoria: document.getElementById("prodCategoria")?.value.trim() ?? "",
            Material: document.getElementById("prodMaterial")?.value.trim() ?? "",
            Tipo: document.getElementById("prodTipo")?.value.trim() ?? "",
            Stock: document.getElementById("prodStock")?.value.trim() ?? "",
            Alto: document.getElementById("prodAlto")?.value.trim() ?? "",
            Ancho: document.getElementById("prodAncho")?.value.trim() ?? "",
            Capacidad: document.getElementById("prodCapacidad")?.value.trim() ?? "",
            Compartimentos: document.getElementById("prodCompartimentos")?.value.trim() ?? "",
            Profundidad: document.getElementById("prodProfundidad")?.value.trim() ?? "",
            Peso: document.getElementById("prodPeso")?.value.trim() ?? "",
            Genero: document.getElementById("prodGenero")?.value.trim() ?? "",
            Diametro: document.getElementById("prodDiametro")?.value.trim() ?? "",
            CantidadRuedas: document.getElementById("prodCantidadRuedas")?.value.trim() ?? "",
            TipoCierre: document.getElementById("prodTipoCierre")?.value.trim() ?? "",
        };
        if (!validarCampos(datosValidar, false)) return;

        const catVal = document.getElementById("prodCategoria").value;
        const marcaVal = document.getElementById("prodMarca").value;
        const tipoVal = document.getElementById("prodTipo").value;
        const materialVal = document.getElementById("prodMaterial").value;

        const fd = new FormData();

        fd.append("Categoria", catVal);
        fd.append("Marca", marcaVal);
        fd.append("Tipo", tipoVal);
        fd.append("Material", materialVal);

        fd.append("Nombre", document.getElementById("prodNombre").value);
        fd.append("Modelo", document.getElementById("prodModelo").value);
        fd.append("Color", document.getElementById("prodColor").value);

        appendIfVisible(fd, "prodCompartimentos", "Compartimentos", "0");
        const capVal = document.getElementById("prodCapacidad")?.value.trim();
        if (capVal) fd.append("Capacidad", capVal);

        appendIfVisible(fd, "prodAlto", "Alto", "0");
        appendIfVisible(fd, "prodAncho", "Ancho", "");
        appendIfVisible(fd, "prodProfundidad", "Profundidad", "");
        appendIfVisible(fd, "prodDiametro", "Diametro", "");
        appendIfVisible(fd, "prodPeso", "Peso", "");
        const generoVal = document.getElementById("prodGenero")?.value.trim();
        if (generoVal) fd.append("Genero", generoVal);
        appendIfVisible(fd, "prodCantidadRuedas", "CantidadRuedas", "");
        appendIfVisible(fd, "prodTipoCierre", "TipoCierre", "");
        const fuelleVal = document.getElementById("prodFuelleExpandible")?.checked;
        const fuelleCol = document.getElementById("prodFuelleExpandible")?.closest(".col");
        if (fuelleCol?.style.display !== "none") {
            fd.append("FuelleExpandible", fuelleVal ? "true" : "false");
        }
        fd.append("Stock", document.getElementById("prodStock").value);

        const archivo = document.getElementById("prodImagen").files[0];
        if (archivo) fd.append("imagen", archivo);

        mostrarToast("Guardando producto...", "info");

        const res = await fetch("/api/Productos", {
            method: "POST",
            body: fd
        });

        if (!res.ok) {
            const text = await res.text();
            mostrarToast("Error al agregar: " + traducirErrorBackend(text), "error");
            return;
        }

        const nuevoProd = await res.json(); // el backend devuelve el producto creado
        const nuevoId = nuevoProd.id_producto ?? nuevoProd.idProducto ?? nuevoProd.IdProducto;

        // Subir imágenes extra al endpoint dedicado
        const archivosExtra = (window._archivosExtraAgregar || []).filter(f => f !== null);
        if (archivosExtra.length > 0 && nuevoId) {
            const fdImagenes = new FormData();
            archivosExtra.forEach(f => fdImagenes.append("imagenes", f));
            await fetch(`/api/Productos/${nuevoId}/imagenes`, { method: "POST", body: fdImagenes })
                .catch(e => console.warn("Error subiendo imágenes extra:", e));
        }
        window._archivosExtraAgregar = [];

        mostrarToast("Producto agregado correctamente ✓", "success");
        cerrarModalCRUD("modalAgregar");
        // Agregar al array local y re-filtrar sin refetch
        productosData.push(normalizarProducto(nuevoProd));
        // Recalcular _camposNormalizados para el nuevo producto
        const ultimo = productosData[productosData.length - 1];
        recalcularCamposBusqueda(ultimo);
        aplicarFiltros();

    } catch (err) {
        console.error(err);
        alert("Error inesperado.");
    }
}

async function abrirEditarProducto(id) {
    await cargarOpcionesDatalist();

    fetch(`/api/Productos/${id}`)
        .then(r => {
            if (!r.ok) throw new Error("Error al obtener producto");
            return r.json();
        })
        .then(p => {
            const producto = {
                id: p.IdProducto ?? p.idProducto ?? p.id_producto ?? "",
                nombre: p.nombre ?? "",
                modelo: p.modelo ?? "",
                color: p.color ?? "",
                idCategoria: p.idCategoria ?? p.id_categoria ?? "",
                idMarca: p.idMarca ?? p.id_marca ?? "",
                idTipo: p.idTipo ?? p.id_tipo ?? "",
                idMaterial: p.idMaterial ?? p.id_material ?? "",
                categoria: p.categoria ?? "",
                marca: p.marca ?? "",
                tipo: p.tipo ?? "",
                material: p.material ?? "",
                compartimentos: p.compartimentos ?? "",
                capacidad: p.capacidad ?? "",
                alto: p.alto ?? "",
                ancho: p.ancho ?? "",
                profundidad: p.profundidad ?? "",
                peso: p.peso ?? "",
                genero: p.genero ?? "",
                diametro: p.diametro ?? "",
                cantidadRuedas: p.cantidadRuedas ?? "",
                tipoCierre: p.tipoCierre ?? "",
                stock: p.stock ?? "",
                disponible: p.disponible ?? false,
                imagen: p.imagenUrl ?? ""
            };

            document.getElementById("prodIdEditar").value = producto.id;
            document.getElementById("prodNombreEditar").value = producto.nombre;
            document.getElementById("prodModeloEditar").value = producto.modelo;
            document.getElementById("prodColorEditar").value = producto.color;

            document.getElementById("prodCategoriaEditar").value = producto.categoria;
            document.getElementById("prodMarcaEditar").value = producto.marca;
            document.getElementById("prodTipoEditar").value = producto.tipo;
            document.getElementById("prodMaterialEditar").value = producto.material;

            const elIdCat = document.getElementById("prodIdCategoriaEditar");
            const elIdMarca = document.getElementById("prodIdMarcaEditar");
            const elIdTipo = document.getElementById("prodIdTipoEditar");
            const elIdMaterial = document.getElementById("prodIdMaterialEditar");
            if (elIdCat) elIdCat.value = producto.idCategoria;
            if (elIdMarca) elIdMarca.value = producto.idMarca;
            if (elIdTipo) elIdTipo.value = producto.idTipo;
            if (elIdMaterial) elIdMaterial.value = producto.idMaterial;

            document.getElementById("prodCompartimentosEditar").value = producto.compartimentos;
            document.getElementById("prodCapacidadEditar").value = producto.capacidad;
            document.getElementById("prodAltoEditar").value = producto.alto;
            document.getElementById("prodAnchoEditar").value = producto.ancho ?? "";
            document.getElementById("prodProfundidadEditar").value = producto.profundidad ?? "";
            document.getElementById("prodPesoEditar").value = producto.peso ?? "";
            document.getElementById("prodGeneroEditar").value = producto.genero ?? "";
            document.getElementById("prodDiametroEditar").value = producto.diametro ?? "";
            document.getElementById("prodCantidadRuedasEditar").value = producto.cantidadRuedas ?? "";
            const fuelleInput = document.getElementById("prodFuelleExpandibleEditar");
            if (fuelleInput) fuelleInput.checked = producto.fuelleExpandible === true;
            document.getElementById("prodTipoCierreEditar").value = producto.tipoCierre ?? "";
            document.getElementById("prodStockEditar").value = producto.stock;

            const previewEditar = document.getElementById("imgPreviewEditar");
            if (previewEditar) {
                const ruta = producto.imagen;
                previewEditar.src = ruta && ruta.trim() !== "" ? ruta : "/ImagenUrl/default.jpg";
                previewEditar.style.display = "block";
                const wrapEdit = document.getElementById("wrapPreviewPrincipalEditar");
                if (wrapEdit) wrapEdit.style.display = "block";
            }
            // Registrar listener para NUEVAS selecciones de archivo (sin borrar el src actual)
            const inputPrincipalEditar = document.getElementById("prodImagenEditar");
            if (inputPrincipalEditar && previewEditar) {
                const nuevoInputPrincipal = inputPrincipalEditar.cloneNode(true);
                inputPrincipalEditar.replaceWith(nuevoInputPrincipal);
                nuevoInputPrincipal.addEventListener("change", () => {
                    const file = nuevoInputPrincipal.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = ev => {
                        previewEditar.src = ev.target.result;
                        previewEditar.style.display = "block";
                        const wrapEdit2 = document.getElementById("wrapPreviewPrincipalEditar");
                        if (wrapEdit2) wrapEdit2.style.display = "block";
                    };
                    reader.readAsDataURL(file);
                });
            }

            // Mostrar imágenes extra existentes en el grid
            const prevGridEdit = document.getElementById("previewGridEditar");
            if (prevGridEdit) {
                prevGridEdit.innerHTML = "";
                window._imagenesGuardadasAEliminar = [];          // ← array de URLs a borrar
                const extras = p.imagenes || p.Imagenes || [];
                extras.forEach(url => {
                    const wrap = document.createElement("div");
                    wrap.className = "preview-img-wrap preview-guardada";
                    wrap.innerHTML = `
            <img src="${url}" class="preview-thumb" title="Imagen guardada" alt="Imagen guardada">
            <div class="preview-img-actions">
                <button type="button" class="btn-preview-delete" title="Eliminar imagen">🗑</button>
            </div>
        `;
                    wrap.querySelector(".btn-preview-delete").addEventListener("click", () => {
                        window._imagenesGuardadasAEliminar.push(url);  // marcar para eliminar en el backend
                        wrap.remove();
                    });
                    prevGridEdit.appendChild(wrap);
                });
            }
            window._archivosExtraEditar = [];
            const inputImgExtraEdit2 = document.getElementById("prodImagenesExtraEditar");
            if (inputImgExtraEdit2) inputImgExtraEdit2.value = "";

            abrirModalAdmin("modalEditar");
            toggleFieldsByTipo(producto.nombre || "", true, "edit");

        })
        .catch(err => console.error("Error al abrir edición:", err));
}

let _fkCargadas = false;

async function cargarOpcionesDatalist() {
    if (_fkCargadas) return; // ya cargado, no volver a fetchear
    try {
        const [categorias, marcas, tipos, materiales, tiposCierre, capacidades, generos] = await Promise.all([
            fetch("/api/Categorias").then(res => res.json()),
            fetch("/api/Marcas").then(res => res.json()),
            fetch("/api/Tipos").then(res => res.json()),
            fetch("/api/Materiales").then(res => res.json()),
            fetch("/api/TiposCierre").then(res => res.json()),
            fetch("/api/Capacidades").then(res => res.json()),   // ← AGREGAR
            fetch("/api/Generos").then(res => res.json())        // ← AGREGAR
        ]);

        const listas = [
            { data: categorias, crear: "dlCategorias", editar: "dlCategoriasEditar", key: "id" },
            { data: marcas, crear: "dlMarcas", editar: "dlMarcasEditar", key: "id" },
            { data: tipos, crear: "dlTipos", editar: "dlTiposEditar", key: "id" },
            { data: materiales, crear: "dlMateriales", editar: "dlMaterialesEditar", key: "id" },
            { data: tiposCierre, crear: "dlTiposCierre", editar: "dlTiposCierreEditar", key: "id_tipo_cierre" },
            { data: capacidades, crear: "dlCapacidades", editar: "dlCapacidadesEditar", key: "id_capacidad" },
            { data: generos, crear: "dlGeneros", editar: "dlGenerosEditar", key: "id_genero" }
        ];

        listas.forEach(({ data, crear, editar, key }) => {
            const dlCrear = document.getElementById(crear);
            const dlEditar = document.getElementById(editar);
            dlCrear.innerHTML = "";
            dlEditar.innerHTML = "";

            data.forEach(item => {
                const option = document.createElement("option");
                option.value = item.Nombre ?? item.Descripcion;
                option.dataset.id = item[key];

                dlCrear.appendChild(option.cloneNode(true));
                dlEditar.appendChild(option);
            });
        });

        _fkCargadas = true; // marcar como cargado para evitar re-fetch

    } catch (err) {
        console.error("Error al cargar datalists:", err);
    }
}

function actualizarIdDesdeDatalist(input, datalistId, hiddenInputId) {
    const selectedOption = document.querySelector(`#${datalistId} option[value="${input.value}"]`);
    if (selectedOption) {
        const id = selectedOption.dataset.id;
        document.getElementById(hiddenInputId).value = id;
    }
}

document.getElementById("prodCategoria")?.addEventListener("change", function () {
    actualizarIdDesdeDatalist(this, "dlCategorias", "prodIdCategoria");
});

document.getElementById("prodMarca")?.addEventListener("change", function () {
    actualizarIdDesdeDatalist(this, "dlMarcas", "prodIdMarca");
});

document.getElementById("prodTipo")?.addEventListener("change", function () {
    actualizarIdDesdeDatalist(this, "dlTipos", "prodIdTipo");
    toggleFieldsByTipo(this.value, false, "form");
});

document.getElementById("prodTipo")?.addEventListener("input", function () {
    toggleFieldsByTipo(this.value, false, "form");
});

document.getElementById("prodMaterial")?.addEventListener("change", function () {
    actualizarIdDesdeDatalist(this, "dlMateriales", "prodIdMaterial");
});

async function guardarEdicionProducto() {
    try {
        const id = document.getElementById("prodIdEditar").value;

        if (!id) {
            alert("Error: ID de producto inválido");
            return;
        }


        const datosValidar = {
            Nombre: document.getElementById("prodNombreEditar")?.value.trim() ?? "",
            Modelo: document.getElementById("prodModeloEditar")?.value.trim() ?? "",
            Color: document.getElementById("prodColorEditar")?.value.trim() ?? "",
            Marca: document.getElementById("prodMarcaEditar")?.value.trim() ?? "",
            Categoria: document.getElementById("prodCategoriaEditar")?.value.trim() ?? "",
            Material: document.getElementById("prodMaterialEditar")?.value.trim() ?? "",
            Tipo: document.getElementById("prodTipoEditar")?.value.trim() ?? "",
            Stock: document.getElementById("prodStockEditar")?.value.trim() ?? "",
            Alto: document.getElementById("prodAltoEditar")?.value.trim() ?? "",
            Ancho: document.getElementById("prodAnchoEditar")?.value.trim() ?? "",
            Capacidad: document.getElementById("prodCapacidadEditar")?.value.trim() ?? "",
            Compartimentos: document.getElementById("prodCompartimentosEditar")?.value.trim() ?? "",
            Profundidad: document.getElementById("prodProfundidadEditar")?.value.trim() ?? "",
            Peso: document.getElementById("prodPesoEditar")?.value.trim() ?? "",
            Genero: document.getElementById("prodGeneroEditar")?.value.trim() ?? "",
            Diametro: document.getElementById("prodDiametroEditar")?.value.trim() ?? "",
            CantidadRuedas: document.getElementById("prodCantidadRuedasEditar")?.value.trim() ?? "",
            TipoCierre: document.getElementById("prodTipoCierreEditar")?.value.trim() ?? "",
        };
        if (!validarCampos(datosValidar, true)) return;

        const catVal = document.getElementById("prodCategoriaEditar").value;
        const marcaVal = document.getElementById("prodMarcaEditar").value;
        const tipoVal = document.getElementById("prodTipoEditar").value;
        const materialVal = document.getElementById("prodMaterialEditar").value;

        const fd = new FormData();
        fd.append("id_producto", id);

        fd.append("Categoria", catVal);
        fd.append("Marca", marcaVal);
        fd.append("Tipo", tipoVal);
        fd.append("Material", materialVal);

        fd.append("Nombre", document.getElementById("prodNombreEditar").value);
        fd.append("Modelo", document.getElementById("prodModeloEditar").value);
        fd.append("Color", document.getElementById("prodColorEditar").value);

        const capValEdit = document.getElementById("prodCapacidadEditar")?.value.trim();
        const capColEdit = document.getElementById("prodCapacidadEditar")?.closest(".col");
        if (capValEdit && capColEdit?.style.display !== "none") {
            fd.append("Capacidad", capValEdit);
        }
        appendIfVisible(fd, "prodAltoEditar", "Alto", "0");
        appendIfVisible(fd, "prodCompartimentosEditar", "Compartimentos", "0");
        appendIfVisible(fd, "prodAnchoEditar", "Ancho", "");
        appendIfVisible(fd, "prodProfundidadEditar", "Profundidad", "");
        appendIfVisible(fd, "prodPesoEditar", "Peso", "");
        const generoValEdit = document.getElementById("prodGeneroEditar")?.value.trim();
        const generoColEdit = document.getElementById("prodGeneroEditar")?.closest(".col");
        if (generoValEdit && generoColEdit?.style.display !== "none") {
            fd.append("Genero", generoValEdit);
        }
        appendIfVisible(fd, "prodDiametroEditar", "Diametro", "");
        appendIfVisible(fd, "prodCantidadRuedasEditar", "CantidadRuedas", "");
        appendIfVisible(fd, "prodTipoCierreEditar", "TipoCierre", "");
        const fuelleValEdit = document.getElementById("prodFuelleExpandibleEditar")?.checked;
        const fuelleColEdit = document.getElementById("prodFuelleExpandibleEditar")?.closest(".col");
        if (fuelleColEdit?.style.display !== "none") {
            fd.append("FuelleExpandible", fuelleValEdit ? "true" : "false");
        }
        fd.append("Stock", document.getElementById("prodStockEditar").value);

        const archivo = document.getElementById("prodImagenEditar").files[0];
        if (archivo) fd.append("imagen", archivo);

        mostrarToast("Guardando cambios...", "info");

        const res = await fetch(`/api/Productos/${id}`, {
            method: "PUT",
            body: fd
        });

        if (!res.ok) {
            const text = await res.text();
            mostrarToast("Error al editar: " + traducirErrorBackend(text), "error");
            return;
        }

        // Subir imágenes extra si seleccionaron
        const archivosExtraEdit = (window._archivosExtraEditar || []).filter(f => f !== null);
        if (archivosExtraEdit.length > 0) {
            const fdImgs = new FormData();
            archivosExtraEdit.forEach(f => fdImgs.append("imagenes", f));
            await fetch(`/api/Productos/${id}/imagenes`, { method: "POST", body: fdImgs })
                .catch(e => console.warn("Error subiendo imágenes extra:", e));
        }
        window._archivosExtraEditar = [];

        const imagenesAEliminar = window._imagenesGuardadasAEliminar || [];
        for (const url of imagenesAEliminar) {
            await fetch(`/api/Productos/${id}/imagenes/by-url`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(url)
            }).catch(e => console.warn("Error eliminando imagen del carrusel:", e));
        }
        window._imagenesGuardadasAEliminar = [];
        mostrarToast("Producto editado correctamente ✓", "success");
        cerrarModalCRUD("modalEditar");
        // Recargar solo este producto del backend y reemplazarlo en el array
        fetch(`/api/Productos/${id}`)
            .then(r => r.json())
            .then(p => {
                const actualizado = normalizarProducto(p);
                recalcularCamposBusqueda(actualizado);

                const idx = productosData.findIndex(x => x.IdProducto === actualizado.IdProducto);
                if (idx !== -1) productosData[idx] = actualizado;
                else productosData.push(actualizado);

                aplicarFiltros();
            })
            .catch(() => cargarProductos(true));

    } catch (err) {
        console.error(err);
        alert("Error inesperado.");
    }
}

let idProdEliminar = null;

function abrirEliminarProducto(id, nombre) {
    idProdEliminar = id;

    const textoEl = document.getElementById("prodTextoEliminar");
    if (textoEl) textoEl.innerText = `¿Seguro que desea eliminar "${nombre}"?`;

    abrirModalAdmin("modalEliminar");
}

function confirmarEliminarProducto() {
    if (!idProdEliminar || isNaN(idProdEliminar)) {
        alert("ID inválido");
        return;
    }

    document.activeElement?.blur();

    fetch(`${API_URL}/${idProdEliminar}`, {
        method: "DELETE"
    })
        .then(res => {
            if (!res.ok) throw new Error("No se pudo eliminar");
            return res.text();
        })
        .then(() => {
            mostrarToast("Producto eliminado ✓", "success");
            cerrarModalCRUD("modalEliminar");
            // Actualizar array local sin refetch
            productosData = productosData.filter(p => p.IdProducto !== idProdEliminar);
            idProdEliminar = null;
            aplicarFiltros(); // re-renderiza con los datos ya en memoria
        })
        .catch(err => {
            console.error("Error eliminando:", err);
            alert("No se pudo eliminar el producto");
        });
}

function cerrarModalCRUD(id) {
    document.activeElement.blur();
    const modalEl = document.getElementById(id);
    if (!modalEl) return;
    modalEl.classList.remove("show", "active");
    if (modalEl.classList.contains("modal-user")) {
        modalEl.style.display = "none";
    }
    unlockScroll();            // ← AGREGAR
}

function resetFormAndClose(idModal, idForm) {
    const form = document.getElementById(idForm);
    if (form) {
        setTimeout(() => form.reset(), 300);
    }
    cerrarModalCRUD(idModal);
}

function validarYSolicitarGuardar(accion) {
    if (accion === "agregar") guardarNuevoProducto();
    if (accion === "editar") guardarEdicionProducto();
}

function confirmarEliminar() {
    if (!idProdEliminar) {
        alert("ID inválido");
        return;
    }

    mostrarToast("Eliminando producto...", "info");

    fetch(`/api/Productos/${idProdEliminar}`, {
        method: "DELETE"
    })
        .then(res => {
            if (!res.ok) throw new Error("No se pudo eliminar");
            return res.text();
        })
        .then(() => {
            mostrarToast("Producto eliminado ✓", "success");
            cerrarModalCRUD("modalEliminar");
            productosData = productosData.filter(p => p.IdProducto !== idProdEliminar);
            idProdEliminar = null;
            aplicarFiltros();
        })
        .catch(err => {
            console.error("Error eliminando:", err);
            mostrarToast("No se pudo eliminar el producto", "error");
        });
}

async function cargarFKs() {
    // Delegamos en cargarOpcionesDatalist que ya tiene caché y maneja ambos sets de datalists
    await cargarOpcionesDatalist();
}
function toggleFieldsByTipo(nombre, esEditar = false, modo = "form") {
    const raw = (nombre || "").toString();

    const norm = raw.trim().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();

    const suf = modo === "edit" ? "Editar" : "";
    const isView = modo === "view";

    const get = (base) => isView
        ? document.getElementById("modal" + base)
        : document.getElementById("prod" + base + suf);

    const campos = {
        cap: get("Capacidad"),
        comp: get("Compartimentos"),
        alto: get("Alto"),
        ancho: get("Ancho"),
        prof: get("Profundidad"),
        peso: get("Peso"),
        genero: get("Genero"),
        diametro: get("Diametro"),
        ruedas: get("CantidadRuedas"),
        cierre: get("TipoCierre"),
        fuelle: get("FuelleExpandible"),   // ← AGREGAR
    };

    function setVisible(elem, visible) {
        if (!elem) return;
        if (isView) {
            elem.style.display = visible ? "" : "none";
            return;
        }
        const col = elem.closest(".col");
        if (col) col.style.display = visible ? "" : "none";
    }

    // 👉 Ocultar TODO primero
    Object.values(campos).forEach(el => setVisible(el, false));

    if (!norm) {
        Object.values(campos).forEach(el => setVisible(el, true));
        return;
    }

    // Devuelve true si alguna palabra de la lista aparece en el texto normalizado
    const match = (list) => list.some(w => norm.includes(w));

    // ==========================================================
    // 👜 CARTERA / BANDOLERA / BOLSO / BOLSA / BILLETERA
    //    campos extra: compartimentos, cierre, capacidad, genero,
    //                  alto, ancho, profundidad, peso
    // ==========================================================
    if (match(["cartera", "bandolera", "bolso", "bolsa", "billetera","fichero", "riñonera", "necesser", "mochila", "morral", "bag", "minibag", "mini-bag", "morral", "caja porta joyas", "cajaportajoyas", "neceser", "gondola"])) {
        setVisible(campos.comp, true);
        setVisible(campos.cierre, true);
        setVisible(campos.cap, true);
        setVisible(campos.genero, true);
        setVisible(campos.alto, true);
        setVisible(campos.ancho, true);
        setVisible(campos.prof, true);
        setVisible(campos.peso, true);
        setVisible(campos.fuelle, true);   // ← AGREGAR
        return;
    }

    // ==========================================================
    // 🧳 VALIJA / COMBO VALIJAS
    //    campos extra: compartimentos, cierre, capacidad, genero,
    //                  alto, ancho, profundidad, peso
    // ==========================================================
    if (match(["valija", "trolley", "set valijas"])) {
        setVisible(campos.comp, true);
        setVisible(campos.cierre, true);
        setVisible(campos.cap, true);
        setVisible(campos.genero, true);
        setVisible(campos.alto, true);
        setVisible(campos.ancho, true);
        setVisible(campos.prof, true);
        setVisible(campos.peso, true);
        setVisible(campos.ruedas, true);
        setVisible(campos.fuelle, true);   // ← AGREGAR
        return;
    }

    // ==========================================================
    // 🪭 ABANICOS / APLIQUES / TIARAS / CORONAS
    //    campos extra: genero, alto, ancho, peso
    // ==========================================================
    if (match(["abanico", "aplique", "tiara", "corona"])) {
        setVisible(campos.genero, true);
        setVisible(campos.alto, true);
        setVisible(campos.ancho, true);
        setVisible(campos.peso, true);
        return;
    }

    // ==========================================================
    // 💍 AROS / PIERCING / EXPANSOR / HELIX / CLAPTON /
    //    NOSTRIL / ARGOLLA / PIEDRITA / DIJE / BULL
    //    campos extra: genero, diametro, peso
    // ==========================================================
    if (match([
        "aro", "piercing", "expansor", "espansor",
        "helix", "clapton", "nostril",
        "argolla",
        "piedrita", "dije", "septum",
        "bull"
    ])) {
        setVisible(campos.genero, true);
        setVisible(campos.diametro, true);
        setVisible(campos.peso, true);
        return;
    }

    // ==========================================================
    // 🧣 CHALINAS / BUFANDAS / CUELLOS / CUELLITOS / SACOS
    //    campos extra: genero, ancho, alto, peso
    // ==========================================================
    if (match(["chalina", "bufanda", "cuello", "cuellito", "saco", "tapado", "pashmina"])) {
        setVisible(campos.genero, true);
        setVisible(campos.ancho, true);
        setVisible(campos.alto, true);
        setVisible(campos.peso, true);
        return;
    }

    // ==========================================================
    // 📿 COLLARES / CADENAS / PULSERAS
    //    campos extra: genero, ancho, alto, peso
    // ==========================================================
    if (match(["collar", "cadena", "pulsera", "pandora", "brazalete"])) {
        setVisible(campos.genero, true);
        setVisible(campos.ancho, true);
        setVisible(campos.alto, true);
        setVisible(campos.peso, true);
        return;
    }

    // ==========================================================
    // 🟡 DEFAULT — tipo no reconocido: mostrar todos los campos
    // ==========================================================
    Object.values(campos).forEach(el => setVisible(el, true));
}
// Mantener el servidor de Render despierto
function keepAliveRender() {
    fetch("https://delicata-eleganza.onrender.com/api/Productos?limit=1", {
        method: "GET",
        cache: "no-store"
    }).catch(() => { });
}
setInterval(keepAliveRender, 10 * 60 * 1000);

// ← esto ya estaba, no lo toques
window.addEventListener("load", () => {
    requestAnimationFrame(() => {
        document.body.classList.add("page-ready");
    });
});
window.addEventListener("load", () => {
    requestAnimationFrame(() => {
        document.body.classList.add("page-ready");
    });
});