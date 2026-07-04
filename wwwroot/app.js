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
let categoriaActivaActual = "todos";
let subcategoriaActivaActual = "";
const BLOQUE_CARGA = 12;
window.addEventListener("pageshow", (e) => {
    if (e.persisted) cargarProductos(true);
});
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

function getScrollbarWidth() {
    return window.innerWidth - document.documentElement.clientWidth;
}


let _touchStartY = 0;


document.addEventListener('touchstart', (e) => {
    _touchStartY = e.touches[0].clientY;
}, { passive: true });

function _preventBgScroll(e) {
    // Si hay más de un toque activo es un gesto de pinch/zoom: NUNCA bloquearlo
    if (e.touches && e.touches.length > 1) return;

    const scrollable = e.target.closest('.modal-box, .modal-content, .user-modal-content, .modal-overlay, .mobile-menu');
    if (scrollable) {
        const atTop = scrollable.scrollTop === 0;
        const atBottom = scrollable.scrollTop + scrollable.clientHeight >= scrollable.scrollHeight - 1;
        const deltaY = _touchStartY - e.touches[0].clientY;
        if ((atTop && deltaY < 0) || (atBottom && deltaY > 0)) {
            e.preventDefault();
        }
        return;
    }
    e.preventDefault();
}

function _preventWheel(e) {
    const scrollable = e.target.closest('.modal-box, .modal-overlay, .modal-content, .user-modal-content, .mobile-menu');
    if (scrollable) {
        const atTop = scrollable.scrollTop === 0;
        const atBottom = scrollable.scrollTop + scrollable.clientHeight >= scrollable.scrollHeight - 1;
        const goingDown = e.deltaY > 0;
        if ((goingDown && atBottom) || (!goingDown && atTop)) {
            e.preventDefault();
        }
        return;
    }
    e.preventDefault();
}

const _preventKeyScroll = (e) => {
    const scrollKeys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];
    if (scrollKeys.includes(e.key) && !e.target.closest('.modal-overlay, .modal-content, .user-modal-content')) {
        e.preventDefault();
    }
};

function _restoreScroll() {
    window.scrollTo(0, _scrollLockedAt);
}

function lockScroll() {
    if (document.body.classList.contains('scroll-locked')) return;
    _scrollLockedAt = window.pageYOffset || document.documentElement.scrollTop;
    document.addEventListener('wheel', _preventWheel, { passive: false });
    document.addEventListener('keydown', _preventKeyScroll);
    document.addEventListener('touchmove', _preventBgScroll, { passive: false });
    document.body.classList.add('scroll-locked');
}

function unlockScroll() {
    if (!document.body.classList.contains('scroll-locked')) return;
    document.body.classList.remove('scroll-locked');
    window.scrollTo(0, _scrollLockedAt);
    document.removeEventListener('wheel', _preventWheel);
    document.removeEventListener('keydown', _preventKeyScroll);
    document.removeEventListener('touchmove', _preventBgScroll, { passive: false });
}
(function fixStickyNavbarChromeIOS() {
    if (!/CriOS/.test(navigator.userAgent)) return;

    const navbar = document.querySelector('header.navbar');
    if (!navbar) return;

    navbar.style.position = 'fixed';
    navbar.style.top = '0';
    navbar.style.left = '0';
    navbar.style.right = '0';
    navbar.style.willChange = 'transform';
    navbar.style.transform = 'translateZ(0)';

    function syncPadding() {
        // Forzar reflow para leer altura real con fuentes cargadas
        const h = navbar.getBoundingClientRect().height;
        document.body.style.paddingTop = h + 'px';
        // Una vez medido, sacar willChange para no consumir memoria
        navbar.style.willChange = 'auto';
    }

    // Esperar a fuentes y layout completo
    if (document.readyState === 'complete') {
        syncPadding();
    } else {
        window.addEventListener('load', syncPadding, { once: true });
    }

    // Solo al rotar pantalla
    window.addEventListener('orientationchange', () => {
        navbar.style.willChange = 'transform';
        setTimeout(() => {
            syncPadding();
        }, 400);
    }, { passive: true });
})();
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
        MedidasTexto: p.MedidasTexto ?? p.medidasTexto ?? "—", 
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

    // Toggle dropdown con click/tap para tablets
    document.querySelectorAll(".cat-dropdown").forEach(dropdown => {
        const link = dropdown.querySelector(":scope > a");
        link?.addEventListener("click", (e) => {
            const submenu = dropdown.querySelector(".cat-submenu");
            if (!submenu) return;
            e.preventDefault();
            e.stopPropagation();
            const isOpen = dropdown.classList.contains("open");
            document.querySelectorAll(".cat-dropdown.open").forEach(d => {
                if (d !== dropdown) d.classList.remove("open");
            });
            dropdown.classList.toggle("open", !isOpen);
        });

        dropdown.addEventListener("mouseleave", () => {
            dropdown.classList.remove("open");
        });

    });

    // Cerrar al tocar fuera
    document.addEventListener("click", (e) => {
        if (!e.target.closest(".cat-dropdown")) {
            document.querySelectorAll(".cat-dropdown.open")
                .forEach(d => d.classList.remove("open"));
        }
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
        initZoom();
    });

}
// ══ CARRUSEL VIDRIERA ══
(function () {
    const TOTAL = 3;       // cantidad de fotos
    const DELAY = 5000;    // ms entre slides
    let current = 0;
    let timer = null;
    let startX = 0;
    let isDragging = false;

    const track = document.getElementById('vidreiraTrack');
    const dotsContainer = document.getElementById('vidrieraDots');
    const carousel = track?.closest('.vidriera-carousel');
    if (!track || !dotsContainer) return;

    // Crear dots
    const dots = Array.from({ length: TOTAL }, (_, i) => {
        const d = document.createElement('button');
        d.className = 'vidriera-dot' + (i === 0 ? ' active' : '');
        d.setAttribute('aria-label', `Foto ${i + 1}`);
        d.addEventListener('click', () => goTo(i));
        dotsContainer.appendChild(d);
        return d;
    });

    function goTo(idx) {
        current = (idx + TOTAL) % TOTAL;
        track.style.transform = `translate3d(-${current * 100}%,0,0)`;
        dots.forEach((d, i) => d.classList.toggle('active', i === current));
    }

    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }
    function startAuto() { timer = setInterval(next, DELAY); }
    function stopAuto() { clearInterval(timer); }

    // Botones
    carousel.querySelector('.vidriera-prev').addEventListener('click', () => { stopAuto(); prev(); startAuto(); });
    carousel.querySelector('.vidriera-next').addEventListener('click', () => { stopAuto(); next(); startAuto(); });

    // Pausa en hover (desktop)
    carousel.addEventListener('mouseenter', stopAuto);
    carousel.addEventListener('mouseleave', startAuto);

    // Swipe táctil
    carousel.addEventListener('touchstart', e => { startX = e.touches[0].clientX; isDragging = true; stopAuto(); }, { passive: true });
    carousel.addEventListener('touchend', e => {
        if (!isDragging) return;
        const diff = startX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
        isDragging = false;
        startAuto();
    }, { passive: true });

    startAuto();
})();
/* ---------------- CARRUSEL MODAL ---------------- */
let carruselActual = 0;
function renderCarrusel(imagenes, altTexto, esParcial = false) {
    const wrapper = document.getElementById("carruselWrapper");
    const dots = document.getElementById("carruselDots");
    const btnPrev = document.getElementById("carruselPrev");
    const btnNext = document.getElementById("carruselNext");
    if (!wrapper) return;

    const soloUna = imagenes.length <= 1;

    if (esParcial) {
        // Primera pasada: solo poner la imagen principal sin tocar flechas
        wrapper.innerHTML = "";
        if (dots) dots.innerHTML = "";
        carruselActual = 0;
        btnPrev?.style.setProperty('visibility', 'hidden');
        btnNext?.style.setProperty('visibility', 'hidden');
        if (dots) dots.style.visibility = 'hidden';

        const slide = document.createElement("div");
        slide.className = "carrusel-slide active";
        const img = document.createElement("img");
        img.src = imagenes[0];
        img.alt = altTexto + " 1";
        img.loading = "eager";
        img.width = 400; img.height = 400;
        slide.appendChild(img);
        wrapper.appendChild(slide);
        return;
    }

    // Segunda pasada (definitiva): NO borrar el primer slide, solo agregar los demás
    carruselActual = 0;
    wrapper.innerHTML = "";

    imagenes.forEach((url, idx) => {
        const slide = document.createElement("div");
        slide.className = "carrusel-slide" + (idx === 0 ? " active" : "");
        const img = document.createElement("img");
        img.src = url;
        img.alt = altTexto + " " + (idx + 1);
        img.loading = idx === 0 ? "eager" : "lazy";
        img.width = 400; img.height = 400;
        slide.appendChild(img);
        wrapper.appendChild(slide);
    });

    // Actualizar dots
    if (dots) {
        dots.innerHTML = "";
        imagenes.forEach((_, idx) => {
            const dot = document.createElement("span");
            dot.className = "dot" + (idx === 0 ? " active" : "");
            dot.dataset.idx = idx;
            dot.addEventListener("click", () => irASlide(parseInt(dot.dataset.idx)));
            dots.appendChild(dot);
        });
    }

    // Mostrar/ocultar flechas y dots con transición suave
    btnPrev?.style.removeProperty('visibility');
    btnNext?.style.removeProperty('visibility');
    if (dots) dots.style.visibility = '';
    btnPrev?.classList.toggle("oculto", soloUna);
    btnNext?.classList.toggle("oculto", soloUna);
    if (dots) dots.style.display = soloUna ? "none" : "";
}

/* ----------- COMPLETAR CARRUSEL SIN PARPADEO ----------- */
// Agrega slides 2..n sin destruir el slide 0 (evita el parpadeo de imagen)
function completarCarrusel(imagenes, altTexto) {
    const wrapper = document.getElementById("carruselWrapper");
    const dots = document.getElementById("carruselDots");
    const btnPrev = document.getElementById("carruselPrev");
    const btnNext = document.getElementById("carruselNext");
    if (!wrapper) return;

    const soloUna = imagenes.length <= 1;

    // Actualizar src del primer slide si la URL cambió (raro, pero seguro)
    const primerImg = wrapper.querySelector(".carrusel-slide:first-child img");
    if (primerImg && imagenes[0]) {
        const urlNueva = new URL(imagenes[0], location.href).href;
        if (primerImg.src !== urlNueva) primerImg.src = imagenes[0];
    }

    // Eliminar slides 2..n que pudieran existir de una apertura anterior
    wrapper.querySelectorAll(".carrusel-slide").forEach((slide, i) => {
        if (i > 0) slide.remove();
    });

    // Agregar slides 2..n de forma silenciosa (no hay innerHTML reset → sin parpadeo)
    for (let idx = 1; idx < imagenes.length; idx++) {
        const slide = document.createElement("div");
        slide.className = "carrusel-slide";
        const img = document.createElement("img");
        img.src = imagenes[idx];
        img.alt = altTexto + " " + (idx + 1);
        img.loading = "lazy";
        img.width = 400;
        img.height = 400;
        slide.appendChild(img);
        wrapper.appendChild(slide);
    }

    // Actualizar dots
    if (dots) {
        dots.innerHTML = "";
        imagenes.forEach((_, idx) => {
            const dot = document.createElement("span");
            dot.className = "dot" + (idx === 0 ? " active" : "");
            dot.dataset.idx = idx;
            dot.addEventListener("click", () => irASlide(parseInt(dot.dataset.idx)));
            dots.appendChild(dot);
        });
    }

    // Mostrar/ocultar flechas y dots según corresponda
    btnPrev?.style.removeProperty("visibility");
    btnNext?.style.removeProperty("visibility");
    if (dots) dots.style.visibility = "";
    btnPrev?.classList.toggle("oculto", soloUna);
    btnNext?.classList.toggle("oculto", soloUna);
    if (dots) dots.style.display = soloUna ? "none" : "";
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
    resetZoomCarrusel();
}
let _zoomState = { scale: 1, x: 0, y: 0, startDist: 0, startScale: 1, panStartX: 0, panStartY: 0, panning: false };

function _imgActivaCarrusel() {
    return document.querySelector("#carruselWrapper .carrusel-slide.active img");
}

function resetZoomCarrusel() {
    _zoomState = { scale: 1, x: 0, y: 0, startDist: 0, startScale: 1, panStartX: 0, panStartY: 0, panning: false };
    document.querySelectorAll("#carruselWrapper img").forEach(img => img.style.transform = "");
}

function _aplicarTransformZoom(img) {
    img.style.transform = `translate(${_zoomState.x}px, ${_zoomState.y}px) scale(${_zoomState.scale})`;
}

(function initPinchZoomCarrusel() {
    const wrapper = document.getElementById("carruselWrapper");
    if (!wrapper) return;

    wrapper.addEventListener("touchstart", (e) => {
        const img = _imgActivaCarrusel();
        if (!img) return;
        if (e.touches.length === 2) {
            e.preventDefault();
            _zoomState.startDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            _zoomState.startScale = _zoomState.scale;
            _zoomState.panning = false;
        } else if (e.touches.length === 1 && _zoomState.scale > 1) {
            _zoomState.panning = true;
            _zoomState.panStartX = e.touches[0].clientX - _zoomState.x;
            _zoomState.panStartY = e.touches[0].clientY - _zoomState.y;
        }
    }, { passive: false });

    wrapper.addEventListener("touchmove", (e) => {
        const img = _imgActivaCarrusel();
        if (!img) return;
        if (e.touches.length === 2) {
            e.preventDefault();
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            _zoomState.scale = Math.min(4, Math.max(1, _zoomState.startScale * (dist / _zoomState.startDist)));
            if (_zoomState.scale === 1) { _zoomState.x = 0; _zoomState.y = 0; }
            _aplicarTransformZoom(img);
        } else if (e.touches.length === 1 && _zoomState.panning) {
            e.preventDefault();
            _zoomState.x = e.touches[0].clientX - _zoomState.panStartX;
            _zoomState.y = e.touches[0].clientY - _zoomState.panStartY;
            _aplicarTransformZoom(img);
        }
    }, { passive: false });

    wrapper.addEventListener("touchend", (e) => {
        if (e.touches.length === 0) _zoomState.panning = false;
    });

    let _ultimoTap = 0;
    wrapper.addEventListener("touchend", () => {
        const ahora = Date.now();
        if (ahora - _ultimoTap < 300) resetZoomCarrusel();
        _ultimoTap = ahora;
    });
})();

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
    _cerrarModalTimeout = null;
    resetZoomCarrusel();
    // ← NUEVO: resetear el flag de zoom para la próxima apertura
    const imgContainer = modal.querySelector(".modal-img-container");
    if (imgContainer) imgContainer._zoomInit = false;
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
    const prodFresh = productosData.find(p => p.IdProducto === prod.IdProducto) || prod;
    prod = prodFresh;
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
        { id: "modalMedidas", value: prod.MedidasTexto && prod.MedidasTexto !== "—" ? prod.MedidasTexto : null },   // ← agregar
        { id: "modalTipoCierre", value: prod.TipoCierre || prod.tipoCierre },
        { id: "modalStock", value: prod.Stock ?? prod.stock },
    ];

    /* ================= AJUSTES VISUALES ================= */
    // toggleFieldsByTipo también renombra data-label según el tipo de producto
    toggleFieldsByTipo(prod.Nombre || prod.nombre || "", false, "view");

    // Ajustar unidades de Ancho en modal vista si el label fue renombrado a "Grosor"
    const modalAnchoEl = document.getElementById("modalAncho");
    if (modalAnchoEl && modalAnchoEl.getAttribute("data-label") === "Grosor") {
        const idx = camposDisponibles.findIndex(c => c.id === "modalAncho");
        if (idx !== -1 && prod.Ancho && prod.Ancho !== "—") {
            camposDisponibles[idx].value = prod.Ancho + " mm";
        }
    }

    let visibles = 0;
    camposDisponibles.forEach(campo => {
        const el = document.getElementById(campo.id);
        if (!el) return;
        const valor = campo.value;
        const valido = valor !== null && valor !== undefined &&
            valor !== "" && valor !== "—" &&
            valor !== "null" && String(valor).trim() !== "";

        el.classList.remove("centrado");
        if (valido) {
            el.textContent = safeText(valor);
            el.hidden = false;
            // Solo contar como visible si toggleFieldsByTipo no lo ocultó por display:none
            if (el.style.display !== "none") visibles++;
        } else {
            el.hidden = true;
        }
    });

    // Centrar el último si la cantidad es impar
    const grid = document.querySelector(".modal-info-grid");
    if (grid) {
        const todosPs = [...grid.querySelectorAll("p")];
        // Limpiar primero cualquier centrado previo
        todosPs.forEach(p => p.classList.remove("centrado"));
        if (visibles % 2 !== 0) {
            const esVisible = el => !el.hidden && el.style.display !== "none";
            const ultimo = todosPs.filter(esVisible).at(-1);
            if (ultimo) ultimo.classList.add("centrado");
        }
    }



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


    if (prod._imagenesCache) {
        // Ya tenemos todas las imágenes en caché: renderizar directo y abrir
        renderCarrusel(prod._imagenesCache, safeText(prod.Nombre || prod.nombre));
        renderSwatchesColor(prod);
        abrirModalProducto();
    } else {
        renderCarrusel([imagenPrincipal], safeText(prod.Nombre || prod.nombre), true);
        renderSwatchesColor(prod);   // ← AGREGAR
        abrirModalProducto();
        const idAbierto = prod.IdProducto; // ← línea nueva
        fetch(`/api/Productos/${prod.IdProducto}`)
            .then(r => r.ok ? r.json() : null)
            .then(detalle => {
                if (!detalle) return;
                if (productoSeleccionado?.IdProducto !== idAbierto) return;
                const extras = detalle.imagenes || detalle.Imagenes || [];
                const todas = extras.length > 0
                    ? [safeText(detalle.imagenUrl || detalle.ImagenUrl || imagenPrincipal), ...extras]
                    : [imagenPrincipal];
                prod._imagenesCache = todas;
                if (domCache.modal?.classList.contains("show")) {
                    // Usar completarCarrusel: agrega slides 2..n sin tocar slide 0 → sin parpadeo
                    completarCarrusel(todas, safeText(prod.Nombre || prod.nombre));
                }
            })
            .catch(() => { });
    }
}
/* ---------------- INTERSECTION OBSERVER OPTIMIZADO ---------------- */
// LÍNEA 562-566 — CAMBIAR
const cardObserver = new IntersectionObserver(
    (entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
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

// ── Bloqueo global de clicks fantasma post-cierre de menú móvil ──
let _bloqueoClickGlobal = false;
function activarBloqueoClick(ms = 600) {
    _bloqueoClickGlobal = true;
    document.addEventListener('click', _capturarClickFantasma, true);
    setTimeout(() => {
        _bloqueoClickGlobal = false;
        document.removeEventListener('click', _capturarClickFantasma, true);
    }, ms);
}
function _capturarClickFantasma(e) {
    if (_bloqueoClickGlobal) {
        if (e.target.closest('.mobile-menu, .hamburger')) return;
        e.preventDefault();
        e.stopPropagation();
    }
}

categoriaLinks.forEach(link => {
    link.addEventListener('click', e => {
        if (_menuCerradoRecien) { e.preventDefault(); return; }
        e.preventDefault();
        // Buscar el elemento con data-cat más cercano (por si el click cayó en el ícono <i>)
        const target = e.target.closest('[data-cat]') || e.target;
        categoriaLinks.forEach(l => l.classList.remove('active-cat'));
        // Marcar el <a> padre como activo (no el <i>)
        const linkActivo = e.currentTarget;
        linkActivo.classList.add('active-cat');
        categoriaActivaActual = normalizar(target.dataset.cat || linkActivo.dataset.cat || "todos");
        subcategoriaActivaActual = normalizar(target.dataset.tipo || linkActivo.dataset.tipo || "");
        aplicarFiltros();
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
});
const COLOR_SINONIMOS = {
    "negro": ["negro", "negra", "negros", "negras", "black", "ebano", "carbon", "carbón", "oscuro", "oscura", "oscuros", "oscuras", "noche"],
    "blanco": ["blanco", "blanca", "blancos", "blancas", "white", "marfil", "crema", "tiza", "perla", "nieve", "ivory", "blanquito"],
    "rojo": ["rojo", "roja", "rojos", "rojas", "red", "bordo", "bordeau", "granate", "carmesi", "carmesí", "escarlata", "cereza", "vino", "sangre"],
    "azul": ["azul", "azules", "blue", "marino", "celeste", "navy", "cobalto", "zafiro", "klein", "royal", "indigo", "índigo", "petroleo", "petróleo"],
    "verde": ["verde", "verdes", "green", "oliva", "militar", "kaki", "esmeralda", "menta", "sage", "botella", "musgo", "selva", "lima", "verde francia"],
    "marron": ["marron", "marrón", "marrones", "cafe", "café", "tabaco", "cognac", "camel", "cuero", "chocolate", "tierra", "havana", "walnut", "tobacco", "avellana"],
    "suela": ["suela", "teja", "madera", "castano", "castaño", "castañas", "nuez", "roble", "cobre", "cobre viejo"],
    "rosa": ["rosa", "rosas", "pink", "fucsia", "salmon", "salmón", "palo de rosa", "flamingo", "blush", "magenta", "hot pink"],
    "lila": ["lila", "lilas", "violeta", "violetas", "morado", "morada", "purple", "lavanda", "lavender", "malva", "orquidea", "orquídea", "amatista"],
    "gris": ["gris", "grises", "grey", "gray", "plata", "plateado", "plateada", "antracita", "grafito", "piedra", "humo", "ceniza"],
    "acero": ["acero", "acero inoxidable", "steel", "inox", "inoxidable", "metalico", "metálico", "cromado"],
    "dorado": ["dorado", "dorada", "dorados", "doradas", "gold", "oro", "champagne", "bronce"],
    "naranja": ["naranja", "naranjas", "orange", "oxido", "óxido", "mango", "calabaza", "ladrillo", "brick"],
    "terracota": ["terracota", "terracotta", "coral", "teja clara", "ocre rojo", "arcilla", "canyon"],
    "amarillo": ["amarillo", "amarilla", "amarillos", "amarillas", "yellow", "ocre", "mostaza", "limón", "limon", "canario", "miel"],
    "beige": ["beige", "beis", "nude", "arena", "tostado", "tostada", "nute", "nutes", "vison", "visón", "bisón", "bison", "taupe", "natural", "crudo", "ecru", "lino", "caqui claro"],
    "rosa_palo": ["rosa palo", "nude rosa", "piel", "skin", "durazno", "peach", "albaricoque", "apricot", "melocoton", "melocotón"],
    "turquesa": ["turquesa", "turquoise", "agua", "aqua", "aguamarina", "tiffany", "verde agua", "aqua marine"],
    "bordeaux": ["bordeaux", "bordo", "burdeos", "vino tinto", "marsala", "granate oscuro"],
    "multicolor": ["multicolor", "estampado", "colores", "tie dye", "tie-dye", "multicolores"],
};

const COLOR_CSS = {
    // Negro
    "negro": "#111", "negra": "#111", "negros": "#111", "negras": "#111",
    "ebano": "#111", "carbon": "#1a1a1a", "carbón": "#1a1a1a", "noche": "#0d0d0d",

    // Blanco
    "blanco": "#f5f5f5", "blanca": "#f5f5f5", "blancos": "#f5f5f5", "blancas": "#f5f5f5",
    "white": "#f5f5f5", "marfil": "#fffff0", "crema": "#fffdd0", "tiza": "#f0ece4",
    "perla": "#f0e8d8", "nieve": "#fafafa", "ivory": "#fffff0",

    // Rojo
    "rojo": "#c62828", "roja": "#c62828", "rojos": "#c62828", "rojas": "#c62828",
    "red": "#c62828", "escarlata": "#d50000", "carmesi": "#b71c1c", "carmesí": "#b71c1c",
    "cereza": "#880e4f", "sangre": "#7b0000",

    // Bordeaux / Vino
    "bordo": "#6d1b2e", "bordeau": "#6d1b2e", "bordeaux": "#6d1b2e",
    "burdeos": "#6d1b2e", "vino": "#6d1b2e", "vino tinto": "#6d1b2e",
    "granate": "#7b2d3a", "granate oscuro": "#5c1a26", "marsala": "#955251",

    // Azul
    "azul": "#1565c0", "azules": "#1565c0", "blue": "#1565c0",
    "marino": "#0d2b6b", "navy": "#0d2b6b", "celeste": "#64b5f6",
    "cobalto": "#1a3a8f", "zafiro": "#003153", "klein": "#002fa7",
    "royal": "#1a3a8f", "indigo": "#3949ab", "índigo": "#3949ab",
    "petroleo": "#00454a", "petróleo": "#00454a",

    // Verde
    "verde": "#2e7d32", "verdes": "#2e7d32", "green": "#2e7d32",
    "oliva": "#6b6b2a", "militar": "#4a5240", "kaki": "#8b8040",
    "esmeralda": "#004d40", "menta": "#80cbc4", "sage": "#7d9b76",
    "botella": "#1b4d2e", "musgo": "#556b2f", "selva": "#1a3a26",
    "lima": "#8bc34a", "verde francia": "#267f00",

    // Marrón / Café
    "marron": "#6d4c41", "marrón": "#6d4c41", "marrones": "#6d4c41",
    "cafe": "#6d4c41", "café": "#6d4c41", "tabaco": "#7a5230",
    "cognac": "#9b5e28", "camel": "#c19a6b", "cuero": "#8b5a2b",
    "chocolate": "#4e342e", "tierra": "#795548", "havana": "#5d3a1a",
    "walnut": "#5c4033", "tobacco": "#7a5230", "avellana": "#9e7b5a",

    // Suela / Tonos cálidos terrosos oscuros
    "suela": "#8B5E3C", "teja": "#b05c34", "madera": "#8b6347",
    "castano": "#7b4f2e", "castaño": "#7b4f2e", "nuez": "#7a4e2d",
    "roble": "#8c6239", "cobre": "#b87333", "cobre viejo": "#a06535",

    // Rosa / Fucsia
    "rosa": "#e91e8c", "rosas": "#e91e8c", "pink": "#e91e8c",
    "fucsia": "#c2185b", "salmon": "#ff8a65", "salmón": "#ff8a65",
    "palo de rosa": "#d4a0a0", "flamingo": "#fc8eac", "blush": "#f4a7b9",
    "magenta": "#e040fb", "hot pink": "#ff4081",

    // Rosa palo / Nude rosado
    "rosa palo": "#e8c5b0", "nude rosa": "#e0b49a", "piel": "#d4a882",
    "skin": "#d4a882", "durazno": "#ffb347", "peach": "#ffcba4",
    "albaricoque": "#f4a460", "apricot": "#f4a460",
    "melocoton": "#ff8c69", "melocotón": "#ff8c69",

    // Lila / Violeta / Morado
    "lila": "#ba68c8", "lilas": "#ba68c8", "violeta": "#7e57c2",
    "violetas": "#7e57c2", "morado": "#6a1b9a", "morada": "#6a1b9a",
    "purple": "#6a1b9a", "lavanda": "#b39ddb", "lavender": "#b39ddb",
    "malva": "#9c4f96", "orquidea": "#da70d6", "orquídea": "#da70d6",
    "amatista": "#9b59b6",

    // Gris
    "gris": "#757575", "grises": "#757575", "grey": "#757575", "gray": "#757575",
    "plata": "#b0bec5", "plateado": "#b0bec5", "plateada": "#b0bec5",
    "antracita": "#3d3d3d", "grafito": "#4a4a4a",
    "piedra": "#9e9e8f", "humo": "#8d8d8d", "ceniza": "#ababab",

    // Acero (familia separada del gris)
    "acero": "#8da9bc", "acero inoxidable": "#8da9bc", "steel": "#8da9bc",
    "inox": "#9eb4c4", "inoxidable": "#9eb4c4",
    "metalico": "#a0aab4", "metálico": "#a0aab4", "cromado": "#b8c4cc",

    // Dorado / Bronce
    "dorado": "#c9a84c", "dorada": "#c9a84c", "dorados": "#c9a84c", "doradas": "#c9a84c",
    "gold": "#c9a84c", "oro": "#c9a84c", "champagne": "#f5e6c8", "bronce": "#8c6a2f",

    // Naranja
    "naranja": "#ef6c00", "naranjas": "#ef6c00", "orange": "#ef6c00",
    "oxido": "#bf4e0a", "óxido": "#bf4e0a", "mango": "#e67e22",
    "calabaza": "#d35400", "ladrillo": "#b94a2c", "brick": "#b94a2c",

    // Terracota / Coral
    "terracota": "#c0522a", "terracotta": "#c0522a", "coral": "#e8735a",
    "teja clara": "#c1603a", "ocre rojo": "#b5451b", "arcilla": "#c1694f",
    "canyon": "#c96a40",

    // Amarillo
    "amarillo": "#f9a825", "amarilla": "#f9a825", "amarillos": "#f9a825", "amarillas": "#f9a825",
    "yellow": "#f9a825", "ocre": "#cc8800", "mostaza": "#c9a227",
    "limón": "#d4e157", "limon": "#d4e157", "canario": "#ffe082", "miel": "#e6ac00",

    // Beige / Nude neutro
    "beige": "#d4b896", "beis": "#d4b896", "nude": "#d4b49c", "arena": "#c2a882",
    "tostado": "#b8915a", "tostada": "#b8915a", "nute": "#ceb49a", "nutes": "#ceb49a",
    "vison": "#c4a882", "visón": "#c4a882", "bisón": "#c4a882", "bison": "#c4a882",
    "taupe": "#b09880", "natural": "#d2b48c", "crudo": "#c8b89a",
    "ecru": "#c8b89a", "lino": "#cdc2a8", "caqui claro": "#c2b280",

    // Turquesa
    "turquesa": "#00897b", "turquoise": "#00897b", "agua": "#00acc1",
    "aqua": "#00bcd4", "aguamarina": "#00bfa5", "tiffany": "#0abfbc",
    "verde agua": "#4db6ac", "aqua marine": "#7fffd4",

    // Multicolor
    "multicolor": "linear-gradient(135deg,#e53935,#1e88e5,#43a047,#fdd835)",
    "estampado": "linear-gradient(135deg,#e53935,#1e88e5,#43a047,#fdd835)",
    "tie dye": "linear-gradient(135deg,#e91e63,#9c27b0,#3f51b5,#00bcd4,#4caf50)",
    "tie-dye": "linear-gradient(135deg,#e91e63,#9c27b0,#3f51b5,#00bcd4,#4caf50)",
};

function colorACSS(nombreColor) {
    if (!nombreColor || nombreColor === "—") return "#ccc";
    // Si hay múltiples colores separados por / o coma, usar el primero para el swatch
    const primero = nombreColor.split(/[\/,]/).map(c => c.trim()).filter(Boolean)[0] || nombreColor;
    const norm = primero.toLowerCase().trim()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    // Buscar coincidencia directa
    if (COLOR_CSS[norm]) return COLOR_CSS[norm];
    // Buscar si alguna clave está contenida en el nombre
    for (const [key, val] of Object.entries(COLOR_CSS)) {
        if (norm.includes(key)) return val;
    }
    // Intentar usar el valor directamente como color CSS válido (ej: "teal", "coral")
    if (typeof CSS !== "undefined" && CSS.supports && CSS.supports("color", norm)) return norm;
    return "#ccc"; // fallback gris neutro
}
function renderSwatchesColor(prodActual) {
    const swatchBox = document.getElementById("modalColorSwatches");
    if (!swatchBox) return;

    // Buscar variantes: mismo Nombre Y mismo Modelo
    const nombreNorm = normalizar(prodActual.Nombre || "");
    const modeloNorm = normalizar(prodActual.Modelo || "");

    const variantes = productosData.filter(p =>
        normalizar(p.Nombre || "") === nombreNorm &&
        normalizar(p.Modelo || "") === modeloNorm
    );

    // Si solo hay una variante (este mismo producto), ocultar swatches
    if (variantes.length <= 1) {
        swatchBox.style.display = "none";
        swatchBox.innerHTML = "";
        return;
    }

    swatchBox.style.display = "flex";
    swatchBox.innerHTML = "";

    variantes.forEach(variante => {
        const colorNombre = variante.Color || variante.color || "—";
        const colorCSS = colorACSS(colorNombre);
        const esActivo = variante.IdProducto === prodActual.IdProducto;

        const swatch = document.createElement("button");
        swatch.className = "color-swatch" + (esActivo ? " activo" : "");
        swatch.title = colorNombre;
        swatch.setAttribute("aria-label", `Color ${colorNombre}`);
        swatch.setAttribute("type", "button");

        // Soporte para gradiente (multicolor)
        if (colorCSS.startsWith("linear-gradient")) {
            swatch.style.background = colorCSS;
        } else {
            swatch.style.background = colorCSS;
        }

        // Al hacer click, abrir ese producto en el modal
        swatch.addEventListener("click", () => {
            if (variante.IdProducto === productoSeleccionado?.IdProducto) return;
            abrirModal(variante);
        });

        swatchBox.appendChild(swatch);
    });
}
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
function expandirGenero(genero) {
    if (!genero || genero === "—") return "";
    const n = normalizar(String(genero));
    if (n.includes("mujer") || n.includes("femen") || n.includes("dama") || n === "f")
        return "mujer femenino dama";
    if (n.includes("hombre") || n.includes("mascul") || n.includes("caballero") || n.includes("varon") || n === "m")
        return "hombre masculino caballero varon";
    return n;
}
function recalcularCamposBusqueda(prod) {
    const altoStr = prod.Alto && prod.Alto !== "—" ? String(prod.Alto) : null;
    const anchoStr = prod.Ancho && prod.Ancho !== "—" ? String(prod.Ancho) : null;
    const profStr = prod.Profundidad && prod.Profundidad !== "—" ? String(prod.Profundidad) : null;
    const pesoStr = prod.Peso && prod.Peso !== "—" ? String(prod.Peso) : null;
    const diamStr = prod.Diametro && prod.Diametro !== "—" ? String(prod.Diametro) : null;

    // Indexar cada color por separado (ej: "verde/negro" → "verde" y "negro")
    // Color como frase completa (no partir en tokens para evitar falsos positivos)
    const colorNorm = prod.Color && prod.Color !== "—"
        ? normalizar(prod.Color.replace(/-/g, " "))
        : "";
    prod._indiceBusqueda = {
        nombre: normalizar(prod.Nombre || ""),
        modelo: normalizar(prod.Modelo || ""),
        color: normalizar(prod.Color || ""),
        marca: normalizar(prod.Marca || ""),
        material: normalizar(prod.Material || ""),
        tipo: normalizar(prod.Tipo || ""),
        categoria: normalizar(prod.Categoria || ""),
        genero: normalizar(prod.Genero || ""),
        alto: prod.Alto ? String(prod.Alto) : "",
        ancho: prod.Ancho ? String(prod.Ancho) : "",
        profundidad: prod.Profundidad ? String(prod.Profundidad) : "",
        diametro: prod.Diametro ? String(prod.Diametro) : ""
    };
    prod._camposNormalizados = [
        prod.Nombre, prod.Modelo, colorNorm,
        prod.Marca, prod.Material, prod.Tipo,
        prod.Capacidad, prod.Categoria,
        expandirGenero(prod.Genero), prod.TipoCierre,
        String(prod.Stock ?? ""),
        prod.Compartimentos !== "—" ? String(prod.Compartimentos) : null,
        prod.CantidadRuedas !== "—" ? String(prod.CantidadRuedas) : null,
        prod.Disponible ? "disponible" : "sin stock",
        // Fuelle expandible indexado correctamente
        prod.FuelleExpandible === true ? "fuelle expandible" : null,
        prod.FuelleExpandible === false ? "sin fuelle" : null,
        // Medidas
        altoStr ? `alto ${altoStr}cm` : null,
        altoStr ? `alto ${altoStr} cm` : null,
        altoStr ? altoStr + "cm" : null,
        altoStr ? altoStr + " cm" : null,
        anchoStr ? `ancho ${anchoStr}cm` : null,
        anchoStr ? anchoStr + "cm" : null,
        anchoStr ? anchoStr + " cm" : null,
        profStr ? `largo ${profStr}cm` : null,
        profStr ? `largo ${profStr} cm` : null,
        profStr ? profStr + "cm" : null,
        pesoStr ? pesoStr + "g" : null,
        pesoStr ? pesoStr + " g" : null,
        diamStr ? diamStr + "mm" : null,
        diamStr ? diamStr + " mm" : null,
        altoStr, anchoStr, profStr, pesoStr, diamStr,
        // Sinónimos solo para material (no color, para evitar falsos positivos)
        prod.Material && prod.Material !== "—" ? expandirConSinonimos(prod.Material) : null,
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
        const cacheKey = "delicata_productos_v1";
        const cacheTsKey = "delicata_productos_ts";
        const MAX_AGE = 5 * 60 * 1000; // 5 minutos
        const ahora = Date.now();
        const ts = parseInt(localStorage.getItem(cacheTsKey) || "0");
        const cacheVigente = !forzar && (ahora - ts) < MAX_AGE && !!localStorage.getItem(cacheKey);
        const cachedRaw = cacheVigente ? localStorage.getItem(cacheKey) : null;

        if (cachedRaw) {
            try {
                const cached = JSON.parse(cachedRaw);
                if (cached?.length > 0) {
                    productosData = cached;
                    aplicarFiltros(); // mostrar inmediatamente
                }
            } catch (e) {
                localStorage.removeItem(cacheKey);
            }
        } else {
            // Solo mostrar skeletons si no hay nada que mostrar
            renderSkeletons(8);
        }

        // ── Siempre buscar la versión actualizada en background ──
        const resp = await fetch(`${API_URL}?_=${Date.now()}`, {
            cache: "no-store"
        });
        if (!resp.ok) throw new Error("Error cargando productos");

        const data = await resp.json();
        const nuevos = data.map(p => {
            const prod = normalizarProducto(p);
            return recalcularCamposBusqueda(prod);
        });
        // Guardar en localStorage para la próxima visita
        try {
            localStorage.setItem(cacheKey, JSON.stringify(nuevos));
            localStorage.setItem(cacheTsKey, String(Date.now()));
        } catch (e) {
            // localStorage lleno — no es crítico
        }

        productosData = nuevos;
        aplicarFiltros();

    } catch (err) {
        console.error("Error cargando productos", err);
        // Si hay caché, no mostrar el error — ya se están viendo los productos
        if (productosData.length === 0) {
            const contenedor = document.getElementById("contenedor-productos");
            contenedor.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--color-marca-oro);">
                <p style="font-size:1.1rem; margin-bottom:12px;">⏳ El servidor está iniciando, esto puede tardar hasta 1 minuto...</p>
                <p style="font-size:0.9rem; opacity:0.7;">Por favor esperá y recargá la página en unos segundos.</p>
            </div>`;
        }
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
    // Match exacto como token
    const tokens = textoNormalizado.split(/\s+/);
    if (tokens.includes(palabra)) return true;

    if (/^\d+([.,]\d+)?$/.test(palabra)) {
        return tokens.includes(palabra);
    }

    // Palabras cortas (≤5 letras): solo exacto, sin fuzzy
    if (palabra.length <= 5) return false;


    if (palabra.length >= 8) {
        const prefijo = palabra.slice(0, 4);
        return tokens.some(token => {
            if (!token.startsWith(prefijo)) return false;
            if (Math.abs(token.length - palabra.length) > 2) return false;
            return levenshtein(palabra, token) <= 1;
        });
    }

    // Palabras de 6-7 letras: sin fuzzy, solo exacto (zona más conflictiva)
    return false;
}


const PALABRAS_IGNORAR = new Set([
    "con", "de", "para", "del", "en", "a", "el", "la", "los", "las", "un", "una",
    "modelo", "color", "medidas", "marca", "material", "tipo", "categoria",
    "lrg", "alt", "capacidad", "compartimentos",
    "tipo", "cierre", "simple", "doble",
    "por", "x", "cm", "mm", "de", "y",
    "milimetros", "profundidad", "peso", "g", "diametro",
    "stock", "genero", "cantidad", "ruedas", "triple",
    "imantado", "a presion"

]);
const BUSQUEDA_ALIAS = {
    "dama": "mujer",
    "femenino": "mujer",
    "masculino": "hombre",
    "caballero": "hombre",
    "varon": "hombre",
};

function normalizarBusqueda(texto) {
    return texto.split(/\s+/).map(p => BUSQUEDA_ALIAS[p] || p).join(" ");
}
function normalizarTermino(p) {
    return p
        .replace(/os$/, "o")
        .replace(/as$/, "a")
        .replace(/([^aeiou]{2,})es$/, "$1")
        .replace(/([^aeiou])es$/, "$1");

}
function extraerFiltrosBusqueda(texto) {

    texto = normalizar(texto);

    const filtros = {};

    // Alto
    let m = texto.match(/(\d+(?:[.,]\d+)?)\s*cm\s*de\s*alto/);
    if (!m) m = texto.match(/alto\s*(\d+(?:[.,]\d+)?)/);

    if (m) filtros.alto = m[1];

    // Ancho
    m = texto.match(/(\d+(?:[.,]\d+)?)\s*cm\s*de\s*ancho/);
    if (!m) m = texto.match(/ancho\s*(\d+(?:[.,]\d+)?)/);

    if (m) filtros.ancho = m[1];

    return filtros;
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
    "articulos de viaje": "articulos de viaje",
    "piercing": "piercing",
    "panoleria": "panoleria"
};

const aplicarFiltros = (preservarPaginacion = false) => {
    const productosYaRenderizadosPrevios = productosRenderizados;
    const textoBusqueda = normalizarBusqueda(   // ← envolver con esta función
        normalizar(domCache.searchInput?.value || "")
            .replace(/[\/,]+/g, " ")   // tratar / y , como separadores de palabra
            .replace(/-/g, " ")
            .replace(/\balt\.?\b/gi, "alto")
            .replace(/\blrg\.?\b/gi, "largo")
            .replace(/\bpor\b/gi, "")
            .replace(/\bx\b/g, "")
            .trim()
    );

    const categoriaActivaRaw = categoriaActivaActual;
    const categoriaActiva = categoriaActivaRaw;

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


    // 1b. Filtrar por subcategoría/tipo si hay una activa
    if (subcategoriaActivaActual !== "") {
        base = base.filter(p => {
            const tipo = normalizar(
                p.Tipo?.Nombre ||
                p.tipo?.Nombre ||
                p.Tipo ||
                p.tipo || ""
            );
            // Match exacto, o el tipo del producto empieza con la subcategoría del menú,
            // o la subcategoría del menú está contenida en el tipo del producto
            // Esto permite que "billeteras" matchee "billeteras h/m"
            return tipo === subcategoriaActivaActual ||
                tipo.startsWith(subcategoriaActivaActual) ||
                tipo.includes(subcategoriaActivaActual) ||
                subcategoriaActivaActual.includes(tipo);
        });
    }

    if (textoBusqueda !== "") {

        const filtros = extraerFiltrosBusqueda(textoBusqueda);

        base = base.filter(p => {

            const idx = p._indiceBusqueda;

            if (
                filtros.alto &&
                idx.alto !== filtros.alto
            ) {
                return false;
            }

            if (
                filtros.ancho &&
                idx.ancho !== filtros.ancho
            ) {
                return false;
            }

            return matchBusquedaFuzzy(
                p._camposNormalizados,
                textoBusqueda
            );
        });
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
    if (preservarPaginacion) {
        const objetivo = Math.min(productosYaRenderizadosPrevios, productosFiltrados.length);
        do {
            renderizarProductosProgresivo();
        } while (productosRenderizados < objetivo);
    } else {
        renderizarProductosProgresivo();
    }
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
const esTouchDevice = ('ontouchstart' in window || navigator.maxTouchPoints > 0)
    && window.matchMedia('(pointer: coarse)').matches;

function initZoom() {
    const modalImgContainer = document.querySelector(".modal-img-container");
    if (!modalImgContainer || esTouchDevice) return;
    if (modalImgContainer._zoomInit) return;
    modalImgContainer._zoomInit = true;

    let isZoomActive = false;
    let animFrameId = null;
    let currentX = 50, currentY = 50;
    let targetX = 50, targetY = 50;
    let currentScale = 1, targetScale = 1;
    let cachedRect = null;

    function getActiveImg() {
        return modalImgContainer.querySelector(".carrusel-slide.active img")
            || modalImgContainer.querySelector("img");
    }

    function lerp(a, b, t) { return a + (b - a) * t; }

    function iniciarLoop() {
        if (!animFrameId) animFrameId = requestAnimationFrame(animateLoop);
    }

    function esControlCarrusel(e) {
        return e.target.closest(".carrusel-btn") || e.target.closest(".carrusel-dots") || e.target.closest(".dot");
    }

    function activarZoom(clientX, clientY) {
        const img = getActiveImg();
        if (!img) return;
        if (!cachedRect) cachedRect = modalImgContainer.getBoundingClientRect();
        isZoomActive = true;
        targetScale = 2.8;
        if (clientX !== undefined) {
            const x = ((clientX - cachedRect.left) / cachedRect.width) * 100;
            const y = ((clientY - cachedRect.top) / cachedRect.height) * 100;
            if (currentScale < 1.05) { currentX = x; currentY = y; }
            targetX = Math.max(18, Math.min(82, x));
            targetY = Math.max(10, Math.min(90, y));
        }
        iniciarLoop();
    }

    function suavizarSalida() {
        isZoomActive = false;
        targetScale = 1;
        iniciarLoop();
    }

    function animateLoop() {
        const img = getActiveImg();
        if (!img) { animFrameId = null; return; }
        currentScale = lerp(currentScale, targetScale, 0.09);
        img.style.transform = `scale(${currentScale.toFixed(3)})`;
        if (currentScale > 1.02) {
            currentX = lerp(currentX, targetX, 0.14);
            currentY = lerp(currentY, targetY, 0.14);
            img.style.transformOrigin = `${currentX.toFixed(2)}% ${currentY.toFixed(2)}%`;
        }
        const scaleOk = Math.abs(currentScale - targetScale) < 0.004;
        const originOk = Math.abs(currentX - targetX) < 0.05 && Math.abs(currentY - targetY) < 0.05;
        if (scaleOk && (originOk || targetScale < 1.05)) {
            currentScale = targetScale;
            if (targetScale <= 1) {
                img.style.transform = "scale(1)";
                img.style.transformOrigin = "center";
                cachedRect = null;
            }
            animFrameId = null;
            return;
        }
        animFrameId = requestAnimationFrame(animateLoop);
    }

    modalImgContainer.addEventListener("mousemove", (e) => {
        if (esControlCarrusel(e)) { suavizarSalida(); return; }
        activarZoom(e.clientX, e.clientY);
    });
    modalImgContainer.addEventListener("mouseenter", (e) => {
        if (esControlCarrusel(e)) return;
        activarZoom(e.clientX, e.clientY);
    });
    modalImgContainer.addEventListener("mouseleave", () => { suavizarSalida(); });
    window.addEventListener("resize", () => {
        if (isZoomActive || currentScale > 1) cachedRect = modalImgContainer.getBoundingClientRect();
    }, { passive: true });
}
/* ---------------- INICIALIZACIÓN OPTIMIZADA ---------------- */
document.addEventListener("DOMContentLoaded", () => {
    // Carga inicial crítica
    cargarProductos();
    verificarUsuarioAutorizado();

    document.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === "Go") {
            const active = document.activeElement;
            const tag = active?.tagName;
            if ((tag === "INPUT" || tag === "TEXTAREA") && !active.closest("form")) {
                active.blur();
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


    const nombreEditarInput = document.getElementById("prodNombreEditar");
    if (nombreEditarInput) {
        nombreEditarInput.addEventListener("input", e => {
            toggleFieldsByTipo(e.target.value, true, "edit");
        });
    }


    const tipoEditarInput = document.getElementById("prodTipoEditar");


    function aplicarFiltrosYScroll() {
        aplicarFiltros();
        requestAnimationFrame(() => {
            const contenedor = document.getElementById("contenedor-productos");
            if (contenedor) {
                const navbar = document.querySelector("header.navbar");
                const navbarH = navbar ? navbar.getBoundingClientRect().height : 80;
                const y = contenedor.getBoundingClientRect().top + window.pageYOffset - navbarH - 24;
                window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
            }
        });
    }

    const busquedaDebounced = debounce(aplicarFiltros, 300);
    if (domCache.searchInput) {
        domCache.searchInput.addEventListener("input", busquedaDebounced);
        domCache.searchInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === "Go") {
                e.preventDefault();
                domCache.searchInput.blur();
                aplicarFiltrosYScroll();
            }
        });
    }
    if (domCache.btnBuscar) domCache.btnBuscar.addEventListener("click", aplicarFiltrosYScroll);

    hamburger = document.querySelector(".hamburger");
    mobileMenu = document.querySelector(".mobile-menu");

    hamburger?.addEventListener("click", (e) => {
        e.stopPropagation();
        const abierto = mobileMenu.classList.toggle("active");
        hamburger.setAttribute("aria-expanded", abierto);
        mobileMenu.setAttribute("aria-hidden", !abierto);

        if (abierto) {
            document.querySelectorAll(".mobile-categories .has-sub.sub-open").forEach(i => {
                i.classList.remove("sub-open");
                i.querySelector(".mobile-arrow")?.classList.remove("rotated");
            });
        }
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
    // CÓDIGO NUEVO (poner esto):

    // Toggle flechas en items con subcategorías
    document.querySelectorAll(".mobile-categories .has-sub").forEach(item => {
        const row = item.querySelector(".mobile-cat-row");
        const arrow = item.querySelector(".mobile-arrow");
        const catSpan = row?.querySelector("[data-cat]");

        row?.addEventListener("click", (e) => {
            e.stopPropagation();

            // Si el click fue directamente sobre el texto de la categoría, filtrar
            const clickedOnText = e.target === catSpan || catSpan?.contains(e.target);
            const clickedOnArrow = e.target === arrow || arrow?.contains(e.target);

            if (clickedOnText && !clickedOnArrow) {
                // Aplicar filtro por categoría padre (sin subcategoría)
                const cat = catSpan.dataset.cat;
                if (!cat) return;

                mobileMenu.classList.remove("active");
                hamburger.setAttribute("aria-expanded", false);
                mobileMenu.setAttribute("aria-hidden", true);
                document.body.style.backgroundColor = '';

                categoriaLinks.forEach(l => l.classList.remove('active-cat'));
                categoriaActivaActual = normalizar(cat);
                subcategoriaActivaActual = "";
                _menuCerradoRecien = true;
                activarBloqueoClick(600);
                unlockScroll();
                aplicarFiltros();
                window.scrollTo({ top: 0, behavior: "instant" });
                setTimeout(() => { _menuCerradoRecien = false; }, 500);
                return;
            }

            // Si no, toggle del submenu (flecha o área vacía de la fila)
            const isOpen = item.classList.contains("sub-open");
            document.querySelectorAll(".mobile-categories .has-sub").forEach(i => {
                i.classList.remove("sub-open");
                i.querySelector(".mobile-arrow")?.classList.remove("rotated");
            });
            if (!isOpen) {
                item.classList.add("sub-open");
                arrow?.classList.add("rotated");
            }
        });
    });

    // Click en items con data-cat (categorías simples y subcategorías)
    document.querySelectorAll(".mobile-categories li[data-cat]").forEach(item => {
        item.addEventListener("click", (e) => {
            if (_menuCerradoRecien) { e.stopPropagation(); return; }
            e.stopPropagation();
            const cat = item.dataset.cat;
            const tipo = item.dataset.tipo || "";
            if (!cat) return;

            mobileMenu.classList.remove("active");
            hamburger.setAttribute("aria-expanded", false);
            mobileMenu.setAttribute("aria-hidden", true);
            document.body.style.backgroundColor = '';

            categoriaLinks.forEach(l => l.classList.remove('active-cat'));
            const catNorm = normalizar(cat);
            const tipoNorm = normalizar(tipo);
            const linkDesktop = [...categoriaLinks].find(l =>
                normalizar(l.dataset.cat || "") === catNorm &&
                normalizar(l.dataset.tipo || "") === tipoNorm
            );
            if (linkDesktop) linkDesktop.classList.add('active-cat');

            categoriaActivaActual = catNorm || "todos";
            subcategoriaActivaActual = tipoNorm;
            _menuCerradoRecien = true;
            activarBloqueoClick(600);
            unlockScroll();
            aplicarFiltros();
            window.scrollTo({ top: 0, behavior: "instant" });
            setTimeout(() => { _menuCerradoRecien = false; }, 500);
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

        // Verificar que el propio elemento no esté oculto
        if (el.style.display === "none") return false;

        // Verificar el .col contenedor
        const col = el.closest(".col");
        if (col && col.style.display === "none") return false;

        // Si no hay .col, verificar el padre directo como fallback
        const parent = el.parentElement;
        if (parent && parent.style.display === "none") return false;

        return true; // solo es visible si ningún contenedor está oculto
    }


    if (!esEditar) {
        if (campoVisible("prodMaterial") && !data.Material?.trim())
            errores.push("• El material es obligatorio.");
        if (campoVisible("prodTipo") && !data.Tipo?.trim())
            errores.push("• El tipo es obligatorio.");
    }

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

// ══ COLA DE PRODUCTOS ══
// Cada entrada es un snapshot completo de los campos del formulario
window._colaProductos = [];

/* ─── Leer snapshot del formulario actual ─── */
function _leerSnapshotFormulario() {
    const val = id => document.getElementById(id)?.value?.trim() ?? "";
    const checked = id => document.getElementById(id)?.checked ?? false;
    // Imagen principal (File object si se seleccionó, null si no)
    const imgInput = document.getElementById("prodImagen");
    const archivo = imgInput && imgInput.files[0] ? imgInput.files[0] : null;
    // Imágenes extra
    const archivosExtra = [...(window._archivosExtraAgregar || [])].filter(Boolean);

    return {
        Nombre: val("prodNombre"),
        Modelo: val("prodModelo"),
        Color: val("prodColor"),
        Categoria: val("prodCategoria"),
        Marca: val("prodMarca"),
        Tipo: val("prodTipo"),
        Material: val("prodMaterial"),
        Compartimentos: val("prodCompartimentos"),
        Capacidad: val("prodCapacidad"),
        Alto: val("prodAlto"),
        Ancho: val("prodAncho"),
        Profundidad: val("prodProfundidad"),
        Peso: val("prodPeso"),
        Genero: val("prodGenero"),
        Diametro: val("prodDiametro"),
        CantidadRuedas: val("prodCantidadRuedas"),
        TipoCierre: val("prodTipoCierre"),
        FuelleExpandible: checked("prodFuelleExpandible"),
        MedidasTexto: val("prodMedidas"),
        Stock: val("prodStock"),
        _archivo: archivo,
        _archivosExtra: archivosExtra,
        // Snapshot de qué columnas eran visibles (para validación)
        _tipoNombre: val("prodNombre"),
    };
}

/* ─── Cargar snapshot al formulario ─── */
function _cargarSnapshotAlFormulario(snap) {
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v ?? ""; };
    set("prodNombre", snap.Nombre);
    set("prodModelo", snap.Modelo);
    set("prodColor", snap.Color);
    set("prodCategoria", snap.Categoria);
    set("prodMarca", snap.Marca);
    set("prodTipo", snap.Tipo);
    set("prodMaterial", snap.Material);
    set("prodCompartimentos", snap.Compartimentos);
    set("prodCapacidad", snap.Capacidad);
    set("prodAlto", snap.Alto);
    set("prodAncho", snap.Ancho);
    set("prodProfundidad", snap.Profundidad);
    set("prodPeso", snap.Peso);
    set("prodGenero", snap.Genero);
    set("prodDiametro", snap.Diametro);
    set("prodCantidadRuedas", snap.CantidadRuedas);
    set("prodTipoCierre", snap.TipoCierre);
    set("prodStock", snap.Stock);
    const fuelle = document.getElementById("prodFuelleExpandible");
    if (fuelle) fuelle.checked = !!snap.FuelleExpandible;
    set("prodMedidas", snap.MedidasTexto);  
    // Actualizar swatch
    _actualizarPreviewColorAgregar();
    // Re-aplicar toggleFields
    toggleFieldsByTipo(snap.Nombre, false, "form");
}

/* ─── Preview de color en tiempo real ─── */
function _actualizarPreviewColorAgregar() {
    const input = document.getElementById("prodColor");
    const preview = document.getElementById("colorSwatchPreviewAgregar");
    if (!input || !preview) return;
    const css = colorACSS(input.value.trim());
    preview.style.background = css;
    preview.style.display = input.value.trim() ? "inline-block" : "none";
}

/* ─── Agregar producto actual a la cola ─── */
function agregarProductoACola() {
    const snap = _leerSnapshotFormulario();

    // Validación mínima
    if (!snap.Nombre) { mostrarToast("El nombre es obligatorio", "error"); return; }
    if (!snap.Color) { mostrarToast("El color es obligatorio", "error"); return; }
    if (!snap.Stock) { mostrarToast("El stock es obligatorio", "error"); return; }

    window._colaProductos.push(snap);
    _renderColaProductos();

    // Limpiar solo Color y Stock para facilitar el siguiente (mantiene nombre/modelo/etc)
    const colorEl = document.getElementById("prodColor");
    if (colorEl) { colorEl.value = ""; _actualizarPreviewColorAgregar(); }
    const stockEl = document.getElementById("prodStock");
    if (stockEl) stockEl.value = "";
    // Limpiar imagen (no se puede clonar un File entre productos distintos automáticamente)
    const imgEl = document.getElementById("prodImagen");
    if (imgEl) imgEl.value = "";
    const prevPrinc = document.getElementById("imgPreviewAgregar");
    if (prevPrinc) { prevPrinc.src = ""; prevPrinc.style.display = "none"; }
    const wrapPrinc = document.getElementById("wrapPreviewPrincipalAgregar");
    if (wrapPrinc) wrapPrinc.style.display = "none";
    const prevGrid = document.getElementById("previewGridAgregar");
    if (prevGrid) prevGrid.innerHTML = "";
    window._archivosExtraAgregar = [];

    mostrarToast(`Producto "${snap.Nombre} – ${snap.Color}" agregado a la cola`, "success");
    document.getElementById("prodColor")?.focus();
}

/* ─── Renderizar cola visual ─── */
function _renderColaProductos() {
    const contenedor = document.getElementById("colaProductosAgregar");
    if (!contenedor) return;

    if (window._colaProductos.length === 0) {
        contenedor.style.display = "none";
        contenedor.innerHTML = "";
        // Actualizar label del botón guardar
        const btnGuardar = document.querySelector("#modalAgregar .btn-save");
        if (btnGuardar) btnGuardar.textContent = "Guardar";
        return;
    }

    contenedor.style.display = "block";
    contenedor.innerHTML = `
        <div class="cola-header">
            <strong>Cola de productos (${window._colaProductos.length})</strong>
            <small style="color:#888;margin-left:8px;">Se guardarán todos al hacer clic en "Guardar todos"</small>
        </div>
        <div class="cola-lista" id="colaListaItems"></div>
    `;

    const lista = document.getElementById("colaListaItems");
    window._colaProductos.forEach((snap, i) => {
        const colorCss = colorACSS(snap.Color);
        const item = document.createElement("div");
        item.className = "cola-item";
        item.innerHTML = `
            <span class="cola-dot" style="background:${colorCss};"></span>
            <span class="cola-nombre">${snap.Nombre}</span>
            <span class="cola-color">${snap.Color}</span>
            <span class="cola-stock">Stock: ${snap.Stock}</span>
            <div class="cola-actions">
                <button type="button" class="cola-btn-editar" title="Editar este producto" onclick="_editarItemCola(${i})">✏️</button>
                <button type="button" class="cola-btn-quitar" title="Quitar de la cola" onclick="_quitarItemCola(${i})">✕</button>
            </div>
        `;
        lista.appendChild(item);
    });

    // Actualizar label del botón guardar
    const btnGuardar = document.querySelector("#modalAgregar .btn-save");
    if (btnGuardar) btnGuardar.textContent = `Guardar todos (${window._colaProductos.length + 1})`;
}

function _quitarItemCola(idx) {
    window._colaProductos.splice(idx, 1);
    _renderColaProductos();
}

/* Editar un item de la cola: carga sus datos al formulario y lo quita de la cola */
function _editarItemCola(idx) {
    const snap = window._colaProductos[idx];
    _cargarSnapshotAlFormulario(snap);
    window._colaProductos.splice(idx, 1);
    _renderColaProductos();
    // Scroll al tope del modal
    document.querySelector("#modalAgregar .modal-box")?.scrollTo({ top: 0, behavior: "smooth" });
}

function abrirFormularioNuevo() {
    const modalAgregar = document.getElementById("modalAgregar");
    if (!modalAgregar) return;

    productoSeleccionado = null;
    window._colaProductos = [];

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
    if (preview) { preview.src = ""; preview.style.display = "none"; }
    const wrapPrinc = document.getElementById("wrapPreviewPrincipalAgregar");
    if (wrapPrinc) wrapPrinc.style.display = "none";

    const inputImg = document.getElementById("prodImagen");
    if (inputImg) inputImg.value = "";

    const inputImgExtra = document.getElementById("prodImagenesExtra");
    if (inputImgExtra) inputImgExtra.value = "";
    const prevGrid = document.getElementById("previewGridAgregar");
    if (prevGrid) prevGrid.innerHTML = "";
    window._archivosExtraAgregar = [];

    // Reset cola
    _renderColaProductos();
    const swatchPrev = document.getElementById("colorSwatchPreviewAgregar");
    if (swatchPrev) swatchPrev.style.display = "none";

    // Listener en tiempo real del input de color
    const colorInput = document.getElementById("prodColor");
    if (colorInput) colorInput.oninput = _actualizarPreviewColorAgregar;

    // Botón guardar: resetear label
    const btnGuardar = document.querySelector("#modalAgregar .btn-save");
    if (btnGuardar) btnGuardar.textContent = "Guardar";

    abrirModalAdmin("modalAgregar");

    requestIdleCallback(() => {
        cargarOpcionesDatalist().catch(console.warn);
    }, { timeout: 1000 });
}


/* ─── appendIfVisible (usada por guardar/editar) ─── */
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
        if (fallback !== undefined) fd.append(fieldName, fallback);
    }
}

/* ─── Construir FormData desde un snapshot ─── */
function _snapToFormData(snap) {
    const fd = new FormData();
    fd.append("Nombre", snap.Nombre || "");
    fd.append("Modelo", snap.Modelo || "");
    fd.append("Color", snap.Color || "");
    fd.append("Categoria", snap.Categoria || "");
    fd.append("Marca", snap.Marca || "");
    fd.append("Tipo", normalizarTipo(snap.Tipo || ""));
    fd.append("Material", snap.Material || "");
    fd.append("Stock", snap.Stock || "0");
    if (snap.Compartimentos) fd.append("Compartimentos", snap.Compartimentos);
    if (snap.Capacidad) fd.append("Capacidad", snap.Capacidad);
    if (snap.Alto) fd.append("Alto", snap.Alto);
    if (snap.Ancho) fd.append("Ancho", snap.Ancho);
    if (snap.Profundidad) fd.append("Profundidad", snap.Profundidad);
    if (snap.Peso) fd.append("Peso", snap.Peso);
    if (snap.Genero) fd.append("Genero", snap.Genero);
    if (snap.Diametro) fd.append("Diametro", snap.Diametro);
    if (snap.CantidadRuedas) fd.append("CantidadRuedas", snap.CantidadRuedas);
    if (snap.TipoCierre) fd.append("TipoCierre", snap.TipoCierre);
    fd.append("FuelleExpandible", snap.FuelleExpandible ? "true" : "false");
    if (snap.MedidasTexto) fd.append("MedidasTexto", snap.MedidasTexto);  
    if (snap._archivo) fd.append("imagen", snap._archivo);
    return fd;
}

/* ─── Enviar un snapshot al backend ─── */
async function _enviarSnapshot(snap) {
    const fd = _snapToFormData(snap);
    const res = await fetch("/api/Productos", { method: "POST", body: fd });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(traducirErrorBackend(text));
    }
    const nuevoProd = await res.json();
    const nuevoId = nuevoProd.id_producto ?? nuevoProd.idProducto ?? nuevoProd.IdProducto;

    // Imágenes extra
    const extras = (snap._archivosExtra || []).filter(Boolean);
    if (extras.length > 0 && nuevoId) {
        const fdImg = new FormData();
        extras.forEach(f => fdImg.append("imagenes", f));
        await fetch(`/api/Productos/${nuevoId}/imagenes`, { method: "POST", body: fdImg })
            .catch(e => console.warn("Error subiendo imágenes extra:", e));
    }
    return nuevoId;
}

/* ─── Guardar: el formulario actual + toda la cola ─── */
async function guardarNuevoProducto() {
    // 1. Leer snapshot del formulario actual
    const snapActual = _leerSnapshotFormulario();

    // 2. Validación mínima del formulario actual
    if (!snapActual.Nombre) { mostrarToast("El nombre es obligatorio", "error"); return; }
    if (!snapActual.Color) { mostrarToast("El color es obligatorio", "error"); return; }
    if (!snapActual.Stock) { mostrarToast("El stock es obligatorio", "error"); return; }

    // 3. Armar lista completa: cola acumulada + el formulario actual al final
    const todos = [...(window._colaProductos || []), snapActual];
    const total = todos.length;

    mostrarToast(total > 1 ? `Guardando ${total} productos...` : "Guardando producto...", "info");

    const _savedScroll = _scrollLockedAt;
    const nuevosIds = [];
    const errores = [];

    for (let i = 0; i < todos.length; i++) {
        const snap = todos[i];
        try {
            const id = await _enviarSnapshot(snap);
            if (id) nuevosIds.push(id);
        } catch (err) {
            errores.push(`"${snap.Nombre} – ${snap.Color}": ${err.message}`);
            console.error("Error guardando producto de cola:", err);
        }
    }

    // 4. Feedback
    if (errores.length === 0) {
        mostrarToast(total > 1 ? `${total} productos guardados ✓` : "Producto guardado ✓", "success");
    } else {
        mostrarToast(`${errores.length} error(es): ${errores[0]}`, "error");
    }

    // 5. Reset y cerrar
    window._colaProductos = [];
    _renderColaProductos();
    _fkCargadas = false;
    cerrarModalCRUD("modalAgregar");

    // 6. Inyectar los productos nuevos al array local y re-renderizar
    if (nuevosIds.length > 0) {
        for (const id of nuevosIds) {
            try {
                const p = await fetch(`/api/Productos/${id}`).then(r => r.json());
                const prod = normalizarProducto(p);
                recalcularCamposBusqueda(prod);
                productosData.push(prod);
            } catch (e) { /* si falla uno, el reload general lo va a buscar */ }
        }
        aplicarFiltros(true);
        requestAnimationFrame(() => window.scrollTo({ top: _savedScroll, behavior: "instant" }));
    } else if (errores.length === 0) {
        cargarProductos(true);
    }
}


async function abrirEditarProducto(id) {
    window._scrollAntesDeCRUD = window.pageYOffset;
    await cargarOpcionesDatalist();

    fetch(`/api/Productos/${id}`)
        .then(r => {
            if (!r.ok) throw new Error("Error al obtener producto");
            return r.json();
        })
        .then(p => {
            const producto = {
                id: p.IdProducto ?? p.idProducto ?? p.id_producto ?? "",
                nombre: p.Nombre ?? p.nombre ?? "",
                modelo: p.Modelo ?? p.modelo ?? "",
                color: p.Color ?? p.color ?? "",
                categoria: p.Categoria ?? p.categoria ?? "",
                marca: p.Marca ?? p.marca ?? "",
                tipo: p.Tipo ?? p.tipo ?? "",
                material: p.Material ?? p.material ?? "",
                compartimentos: p.Compartimentos ?? p.compartimentos ?? "",
                capacidad: p.Capacidad ?? p.capacidad ?? "",
                alto: p.Alto ?? p.alto ?? "",
                ancho: p.Ancho ?? p.ancho ?? "",
                profundidad: p.Profundidad ?? p.profundidad ?? "",
                peso: p.Peso ?? p.peso ?? "",
                genero: p.Genero ?? p.genero ?? "",
                diametro: p.Diametro ?? p.diametro ?? "",
                cantidadRuedas: p.CantidadRuedas ?? p.cantidadRuedas ?? "",
                fuelleExpandible: p.FuelleExpandible ?? p.fuelleExpandible ?? null,
                medidasTexto: p.MedidasTexto ?? p.medidasTexto ?? "", // ← línea nueva
                tipoCierre: p.TipoCierre ?? p.tipoCierre ?? "",
                stock: p.Stock ?? p.stock ?? "",
                disponible: p.Disponible ?? p.disponible ?? false,
                imagen: p.ImagenUrl ?? p.imagenUrl ?? ""
            };

            document.getElementById("prodIdEditar").value = producto.id;
            document.getElementById("prodNombreEditar").value = producto.nombre;
            document.getElementById("prodModeloEditar").value = producto.modelo;
            document.getElementById("prodColorEditar").value = producto.color;

            document.getElementById("prodCategoriaEditar").value = producto.categoria;
            document.getElementById("prodMarcaEditar").value = producto.marca;
            document.getElementById("prodTipoEditar").value = producto.tipo;
            document.getElementById("prodMaterialEditar").value = producto.material;
            // Filtrar tipos según la categoría cargada
            filtrarTiposPorCategoria(producto.categoria, "dlTiposEditar");

            const elIdCat = document.getElementById("prodIdCategoriaEditar");
            const elIdMarca = document.getElementById("prodIdMarcaEditar");
            const elIdTipo = document.getElementById("prodIdTipoEditar");
            const elIdMaterial = document.getElementById("prodIdMaterialEditar");
            if (elIdCat) elIdCat.value = producto.idCategoria;
            if (elIdMarca) elIdMarca.value = producto.idMarca;
            if (elIdTipo) elIdTipo.value = producto.idTipo;
            if (elIdMaterial) elIdMaterial.value = producto.idMaterial;
            toggleFieldsByTipo(producto.nombre || "", true, "edit");

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
            const medidasInput = document.getElementById("prodMedidasEditar");
            if (medidasInput) medidasInput.value = producto.medidasTexto ?? "";  
            document.getElementById("prodTipoCierreEditar").value = producto.tipoCierre ?? "";
            document.getElementById("prodStockEditar").value = producto.stock;
            const inputPrincipalReset = document.getElementById("prodImagenEditar");
            if (inputPrincipalReset) inputPrincipalReset.value = "";
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

/* ── MAPA DE TIPOS POR CATEGORÍA ── */
const TIPOS_POR_CATEGORIA = {
    "marroquineria": ["Carteras", "Billeteras H/M", "Bandoleras", "Bolsos", "Ficheros", "Morrales", "Riñoneras", "Mochilas H/M", "Mini Bags", "Portanotebooks"],
    "bijouterie": ["Aros", "Cadenas", "Pulseras", "Collares", "Cadenas", "Dijes", "Fiesta"],
    "complementos": ["Paraguas", "Cajas Bijou", "Abanicos", "Cintos"],
    "artículos de viaje": ["Valijas", "Complementos de viaje"],
    "piercing": ["Piercing"],
    "pañoleria": ["Invierno", "Verano"]
};
const TIPO_ALIAS_MAP = {
    "morral": "Morrales",
    "morrales": "Morrales",
    "cartera": "Carteras",
    "cartera bolso": "Bolsos",
    "cartera bandolera": "Bandoleras",
    "billetera": "Billeteras H/M",
    "billeteras": "Billeteras H/M",
    "billetera hombre": "Billeteras H/M",
    "billetera mujer": "Billeteras H/M",
    "billetera h/m": "Billeteras H/M",
    "billetera h m": "Billeteras H/M",
    "bandolera": "Bandoleras",
    "bandoleras": "Bandoleras",
    "bolso": "Bolsos",
    "bolsos": "Bolsos",
    "fichero": "Ficheros",
    "ficheros": "Ficheros",
    "rinonera": "Riñoneras",
    "riñonera": "Riñoneras",
    "riñoneras": "Riñoneras",
    "mochila": "Mochilas H/M",
    "mochilas": "Mochilas H/M",
    "mochila hombre": "Mochilas H/M",
    "mochila mujer": "Mochilas H/M",
    "mochila h/m": "Mochilas H/M",
    "mini bag": "Mini Bags",
    "mini bags": "Mini Bags",
    "portanotebook": "Portanotebooks",
    "portanotebooks": "Portanotebooks",
    "porta notebook": "Portanotebooks",
    "porta notebooks": "Portanotebooks",
    "fiesta": "Fiesta",
    "aro": "Aros",
    "argolla": "Argollas",
    "argollas": "Argollas",
    "cadena": "Cadenas",
    "cadenas": "Cadenas",
    "pulsera": "Pulseras",
    "pulseras": "Pulseras",
    "collar": "Collares",
    "collares": "Collares",
    "cadena con dije": "Cadenas con Dijes",
    "cadenas con dije": "Cadenas con Dijes",
    "cadena dije": "Cadenas con Dijes",
    "paragua": "Paraguas",
    "caja bijou": "Cajas Bijou",
    "cajas bijou": "Cajas Bijou",
    "abanico": "Abanicos",
    "abanicos": "Abanicos",
    "cinto": "Cintos",
    "cintos": "Cintos",
    "cinta": "Cintos",
    "cintas": "Cintos",
    "correa": "Cintos",
    "correas": "Cintos",
    "cenidor": "Cintos",
    "cenidores": "Cintos",
    "valija": "Valijas",
    "bufanda": "Bufandas",
    "chalina": "Chalinas",
    "cuello": "Cuellos",
    "pashmina": "Pashminas",
};
function normalizarTipo(valor) {
    if (!valor || !valor.trim()) return valor;
    const key = valor.trim().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return TIPO_ALIAS_MAP[key] || valor.trim();
}
function filtrarTiposPorCategoria(categoriaValor, dlId) {
    const dl = document.getElementById(dlId);
    if (!dl) return;
    // Buscar coincidencia normalizada en el mapa
    const catNorm = normalizar(categoriaValor || "");
    let tipos = null;
    for (const [key, vals] of Object.entries(TIPOS_POR_CATEGORIA)) {
        if (normalizar(key) === catNorm || catNorm.includes(normalizar(key)) || normalizar(key).includes(catNorm)) {
            tipos = vals;
            break;
        }
    }
    // Si encontramos tipos para esta categoría, reemplazar las opciones del datalist
    if (tipos) {
        dl.innerHTML = "";
        tipos.forEach(t => {
            const opt = document.createElement("option");
            opt.value = t;
            dl.appendChild(opt);
        });
    }
    // Si no hay match (categoría nueva o no mapeada) dejamos el datalist con todos los tipos del backend
}

document.getElementById("prodCategoria")?.addEventListener("change", function () {
    actualizarIdDesdeDatalist(this, "dlCategorias", "prodIdCategoria");
    filtrarTiposPorCategoria(this.value, "dlTipos");
    // Limpiar el campo tipo para que el admin elija uno acorde
    const tipoInput = document.getElementById("prodTipo");
    if (tipoInput) tipoInput.value = "";
    // El toggle depende únicamente de nombre, así que se recalcula con su valor actual (no se resetea a vacío)
    const nombreActual = document.getElementById("prodNombre")?.value ?? "";
    toggleFieldsByTipo(nombreActual, false, "form");
});

document.getElementById("prodCategoriaEditar")?.addEventListener("change", function () {
    filtrarTiposPorCategoria(this.value, "dlTiposEditar");
});

document.getElementById("prodCategoria")?.addEventListener("input", function () {
    filtrarTiposPorCategoria(this.value, "dlTipos");
});

document.getElementById("prodCategoriaEditar")?.addEventListener("input", function () {
    filtrarTiposPorCategoria(this.value, "dlTiposEditar");
});

document.getElementById("prodMarca")?.addEventListener("change", function () {
    actualizarIdDesdeDatalist(this, "dlMarcas", "prodIdMarca");
});

document.getElementById("prodTipo")?.addEventListener("change", function () {
    actualizarIdDesdeDatalist(this, "dlTipos", "prodIdTipo");
    // toggleFieldsByTipo NO se dispara desde acá: el campo tipo no debe afectar el toggle, solo nombre.
});

document.getElementById("prodNombre")?.addEventListener("input", function () {
    toggleFieldsByTipo(this.value, false, "form");
});

document.getElementById("prodNombreEditar")?.addEventListener("input", function () {
    toggleFieldsByTipo(this.value, true, "edit");
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
            Capacidad: (() => { const el = document.getElementById("prodCapacidadEditar"); const col = el?.closest(".col"); return (col?.style.display === "none") ? "" : (el?.value.trim() ?? ""); })(),
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
        const tipoVal = normalizarTipo(document.getElementById("prodTipoEditar").value);
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

        const capElEdit = document.getElementById("prodCapacidadEditar");
        const capColEdit = capElEdit?.closest(".col");
        if (capColEdit?.style.display !== "none") {
            const capV = capElEdit?.value?.trim();
            if (capV) fd.append("Capacidad", capV);
        }
        appendIfVisible(fd, "prodAltoEditar", "Alto", "");
        appendIfVisible(fd, "prodCompartimentosEditar", "Compartimentos", "");
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
        appendIfVisible(fd, "prodMedidasEditar", "MedidasTexto", "");
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
        _fkCargadas = false;
        const _savedScrollEditar = window._scrollAntesDeCRUD ?? _scrollLockedAt;
        cerrarModalCRUD("modalEditar");
        fetch(`/api/Productos/${id}`)
            .then(r => r.json())
            .then(p => {
                const actualizado = normalizarProducto(p);
                recalcularCamposBusqueda(actualizado);

                const idx = productosData.findIndex(x => x.IdProducto === actualizado.IdProducto);
                if (idx !== -1) productosData[idx] = actualizado;
                else productosData.push(actualizado);
                try {
                    localStorage.setItem("delicata_productos_v1", JSON.stringify(productosData));
                } catch (e) { }

                // ✅ AGREGAR ESTO: actualizar productoSeleccionado y refrescar el modal si está abierto
                if (productoSeleccionado?.IdProducto === actualizado.IdProducto) {
                    productoSeleccionado = actualizado;
                    const modal = domCache.modal;
                    if (modal && modal.classList.contains("show")) {
                        abrirModal(actualizado);
                    }
                }

                aplicarFiltros(true);
                requestAnimationFrame(() => window.scrollTo({ top: _savedScrollEditar, behavior: "instant" }));
            })
            .catch(() => cargarProductos(true));

    } catch (err) {
        console.error(err);
        alert("Error inesperado.");
    }
}

let idProdEliminar = null;

function abrirEliminarProducto(id, nombre) {
    window._scrollAntesDeCRUD = window.pageYOffset;
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

    const _savedScrollEliminarProd = window._scrollAntesDeCRUD ?? _scrollLockedAt;
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
            aplicarFiltros(true); // re-renderiza con los datos ya en memoria
            requestAnimationFrame(() => window.scrollTo({ top: _savedScrollEliminarProd, behavior: "instant" }));
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
    // Guardar posición antes de unlock para restaurarla después
    const scrollY = _scrollLockedAt;
    unlockScroll();
    requestAnimationFrame(() => {
        window.scrollTo({ top: scrollY, behavior: "instant" });
    });
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

    const _savedScrollEliminar = window._scrollAntesDeCRUD ?? _scrollLockedAt;
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
            aplicarFiltros(true);
            requestAnimationFrame(() => window.scrollTo({ top: _savedScrollEliminar, behavior: "instant" }));
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
        fuelle: get("FuelleExpandible"),
        medidas: get("Medidas"), // ← AGREGAR
    };

    const campoStock = get("Stock");
    // Renombra el label visible del campo (tanto en formulario como en modal vista)
    function renameLabel(elem, nuevoLabel) {
        if (!elem) return;
        if (isView) {
            // En modal vista el label está en data-label del <p>
            elem.setAttribute("data-label", nuevoLabel);
        } else {
            // En formularios el label está en el <label> hermano dentro del .col
            const col = elem.closest(".col");
            if (col) {
                const lbl = col.querySelector("label");
                if (lbl) lbl.textContent = nuevoLabel;
            }
        }
    }

    // Restaura los labels originales de los campos dimensionales
    function resetLabels() {
        renameLabel(campos.alto, isView ? "Alto" : "Alto (cm)");
        renameLabel(campos.ancho, isView ? "Ancho" : "Ancho (cm)");
        renameLabel(campos.prof, isView ? "Profundidad" : "Profundidad (cm)");
        renameLabel(campos.diametro, isView ? "Diámetro" : "Diámetro (mm)");
        renameLabel(campoStock, "Stock total");
        renameLabel(campos.peso, isView ? "Peso total" : "Peso total (g)");  // ← AGREGAR
    }

    function setVisible(elem, visible) {
        if (!elem) return;
        if (isView) {
            elem.style.display = visible ? "" : "none";
            return;
        }
        const col = elem.closest(".col");
        if (col) col.style.display = visible ? "" : "none";

        // NUEVO: limpiar valor al ocultar para no enviar datos residuales
        if (!visible) {
            if (elem.type === "checkbox") {
                elem.checked = false;
            } else {
                elem.value = "";
            }
        }
    }

    // 👉 Restaurar labels originales y Ocultar TODO primero
    resetLabels();
    Object.values(campos).forEach(el => setVisible(el, false));

    if (!norm) {
        Object.values(campos).forEach(el => setVisible(el, true));
        return;
    }

    // Devuelve true si alguna palabra de la lista aparece en el texto normalizado
    const match = (list) => list.some(w => norm.includes(w));


    // 💳 BILLETERA — sin capacidad ni compartimentos
    if (match(["billetera", "wallet", "portatarjeta", "porta tarjeta", "tarjetero", "monedero", "portamonedas", "porta monedas"])) {
        setVisible(campos.cierre, true);
        setVisible(campos.genero, true);
        setVisible(campos.alto, true);
        setVisible(campos.ancho, true);
        setVisible(campos.prof, true);
        setVisible(campos.peso, true);
        return;
    }

    // 👜 CARTERA / BANDOLERA / BOLSO / MOCHILA
    if (match(["cartera", "bandolera", "bolso", "fichero", "rinonera", "necesser", "mochila", "morral", "bag", "minibag","mini bag", "mini-bag", "caja porta joyas", "cajaportajoyas", "neceser", "gondola", "backpack", "tote", "clutch", "sobre", "maletín", "maletin", "portafolio","portanotebook"])) {
        setVisible(campos.comp, true);
        setVisible(campos.cierre, true);
        setVisible(campos.cap, true);
        setVisible(campos.genero, true);
        setVisible(campos.alto, true);
        setVisible(campos.ancho, true);
        setVisible(campos.prof, true);
        setVisible(campos.peso, true);
        setVisible(campos.fuelle, true);
        return;
    }

    // ==========================================================
    // 🧳 VALIJA / COMBO VALIJAS
    //    campos extra: compartimentos, cierre, capacidad, genero,
    //                  alto, ancho, profundidad, peso
    // ==========================================================
    if (match(["valija", "trolley", "set valijas", "maleta", "equipaje", "carry on", "carry-on", "cabina", "baulera", "baul", "maletín de viaje", "maletin de viaje", "trolley bag"])) {
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
    if (match(["abanico", "aplique", "tiara", "corona", "cinto", "cinta", "correa", "cenidor", "vincha", "diadema", "headband", "pin", "broche", "pasador", "hebilla", "clip pelo", "accesorio pelo", "tocado"])) {
        setVisible(campos.genero, true);
        setVisible(campos.alto, true);
        setVisible(campos.ancho, true);
        setVisible(campos.peso, true);
        return;
    }

    // ==========================================================
    // 💍 AROS / PIERCING / EXPANSOR / HELIX / CLAPTON /
    //    NOSTRIL / ARGOLLA / PIEDRITA / DIJE / BULL
    //
    //  • Dije circular / Aro / Argolla / Piercing → solo Diámetro
    //  • Dije (rectangular, forma, genérico) → Alto=Alto, Ancho=Largo
    //  • Cadenas / Collares / Pulseras → Alto=Largo, Ancho=Grosor
    // ==========================================================

    // Cadena / collar / pulsera
    if (match(["collar", "cadena", "pulsera", "pandora", "brazalete", "tobillera", "gargantilla", "choker", "necklace", "bracelet", "chain", "enklet", "anklet"])) {
        renameLabel(campos.alto, isView ? "Largo" : "Largo (cm)");
        renameLabel(campos.ancho, isView ? "Grosor" : "Grosor (mm)");
        setVisible(campos.genero, true);
        setVisible(campos.alto, true);
        setVisible(campos.ancho, true);
        setVisible(campos.peso, true);
        return;
    }




    // Aros / Piercing → alto y ancho (sin profundidad)
    if (match([
        "aro", "piercing", "expansor", "espansor",
        "helix", "clapton", "nostril", "earcuff", "cuff", "ear-cuff",
        "argolla", "septum", "bull", "industrial", "flecha",
        "earring", "pendiente", "arete", "earing", "dormilon", "dormilón", "tuerca", "stick", "clip oreja"
    ])) {
        setVisible(campos.genero, true);
        setVisible(campos.alto, true);
        setVisible(campos.ancho, true);
        setVisible(campos.peso, true);
        renameLabel(campoStock, "Stock por par");
        renameLabel(campos.peso, isView ? "Peso total" : "Peso total (g)");
        return;
    }

    // ==========================================================
    // 🧣 CHALINAS / BUFANDAS / CUELLOS / CUELLITOS / SACOS
    //    campos extra: genero, ancho, alto, peso
    // ==========================================================
    if (match(["chalina", "bufanda", "cuello", "cuellito", "saco", "tapado", "pashmina", "bufandon", "maxi bufanda", "megabufanda", "estola", "chal", "mantón", "manton", "foulard", "scarf", "pañuelo", "infinity scarf"])) {
        setVisible(campos.genero, true);
        setVisible(campos.ancho, true);
        setVisible(campos.alto, true);
        setVisible(campos.peso, true);
        return;
    }

    // ==========================================================
    // 🛏 ALMOHADAS / ALMOHADILLAS / CANDADOS
    //    campos: alto, ancho, profundidad, peso, genero
    // ==========================================================
    if (match(["almohada", "almohadilla", "almohadin", "candado", "cerrojo", "lock", "cadeado", "candadito", "seguro valija", "pillow", "cushion"])) {
        setVisible(campos.alto, true);
        setVisible(campos.ancho, true);
        setVisible(campos.prof, true);
        setVisible(campos.peso, true);
        setVisible(campos.genero, true);
        return;
    }

    // ==========================================================
    // ⚖️ BALANZA PARA VALIJAS
    //    campos: alto, ancho, profundidad, peso
    // ==========================================================
    if (match(["balanza", "peso valija", "pesa valija", "pesaje", "escala", "luggage scale"])) {
        setVisible(campos.alto, true);
        setVisible(campos.ancho, true);
        setVisible(campos.prof, true);
        setVisible(campos.peso, true);
        renameLabel(campoStock, "Stock por unidad");
        renameLabel(campos.alto, isView ? "Alto por unidad" : "Alto por unidad (cm)");
        renameLabel(campos.ancho, isView ? "Ancho por unidad" : "Ancho por unidad (cm)");
        renameLabel(campos.prof, isView ? "Profundidad por unidad" : "Profundidad por unidad (cm)");
        return;
    }

    // ==========================================================
    // 🔌 BOMBA ELÉCTRICA / MANUAL DE VACÍO
    //    campos: alto, ancho, profundidad, peso
    // ==========================================================
    if (match(["bomba", "bomba vacio", "bomba vacío", "bomba al vacio", "bomba de vacio", "bomba de vacío", "bomba manual", "bomba electrica", "bomba eléctrica", "bomba de vacío eléctrica", "aspiradora ropa", "compresor"])) {
        setVisible(campos.alto, true);
        setVisible(campos.ancho, true);
        setVisible(campos.prof, true);
        setVisible(campos.peso, true);
        return;
    }

    // ==========================================================
    // 🫙 BOLSAS DE VACÍO
    //    campos: alto, ancho, profundidad, peso, capacidad
    //    (va ANTES del bloque genérico de "bolsa" para tener prioridad)
    // ==========================================================
    if (match(["vacio", "vacío", "bolsa vacio", "bolsa vacío", "bolsas vacio", "bolsas vacío"])) {
        setVisible(campos.medidas, true);
        setVisible(campos.peso, true);
        renameLabel(campoStock, "Stock por unidad");
        renameLabel(campos.peso, isView ? "Peso total" : "Peso total (g)"); 
        return;
    }
    // ==========================================================
    // 🔒 PORTA VALORES
    //    campos: compartimentos, capacidad, alto, ancho,
    //            profundidad, peso, genero, cierre
    // ==========================================================
    if (match(["porta valores", "portavalores", "caja fuerte", "caja de seguridad", "cofre", "safe box", "porta documentos", "portadocumentos"])) {
        setVisible(campos.comp, true);
        setVisible(campos.cap, true);
        setVisible(campos.alto, true);
        setVisible(campos.ancho, true);
        setVisible(campos.prof, true);
        setVisible(campos.peso, true);
        setVisible(campos.genero, true);
        setVisible(campos.cierre, true);
        return;
    }

    // Dije circular / redondo → solo diámetro
    if (match(["dije circular", "dije redondo", "medallon", "medallón", "colgante redondo", "pendant redondo", "moneda colgante"])) {
        setVisible(campos.genero, true);
        setVisible(campos.diametro, true);
        setVisible(campos.peso, true);
        renameLabel(campos.diametro, isView ? "Diámetro total" : "Diámetro total (mm)");
        return;
    }

    // Dije genérico / charm → alto y ancho
    if (match(["dije", "charm", "colgante", "pendant", "charms", "dijecito"])) {
        setVisible(campos.genero, true);
        setVisible(campos.alto, true);
        setVisible(campos.ancho, true);
        setVisible(campos.peso, true);
        return;
    }

    setVisible(campos.alto, true);
    setVisible(campos.ancho, true);
    setVisible(campos.prof, true);
    setVisible(campos.peso, true);
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