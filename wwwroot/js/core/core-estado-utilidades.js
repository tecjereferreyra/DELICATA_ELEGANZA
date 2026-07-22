

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
let modoNuevosActivo = false;
let filtroPrevioNuevos = null;
const CANTIDAD_NUEVOS = 40;

function desactivarModoNuevos() {
    modoNuevosActivo = false;
    document.getElementById("toggleNuevos")?.classList.remove("active");
    const icono = document.getElementById("iconoNuevos");
    if (icono) {
        icono.innerHTML = '<path d="M12 5l1.8 5.2L19 12l-5.2 1.8L12 19l-1.8-5.2L5 12l5.2-1.8z"></path>';
    }
}
const BLOQUE_CARGA = 12;
window.addEventListener("pageshow", (e) => {
    if (e.persisted) cargarProductos(true);
});
const delay = 0;
let productosFiltrados = [];
let esAdminActual = false;
const safeTextPreserve = (value, fallback = "—") =>
    (value === null || value === undefined) ? fallback : String(value);

const safeText = safeTextPreserve;

const toNumber = (v, fallback = 0) => {
    if (v === null || v === undefined) return fallback;
    const n = Number(v);
    return Number.isNaN(n) ? fallback : n;
};

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

    if (e.touches && e.touches.length > 1) {
        e.preventDefault();
        return;
    }

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
function _blockNativeGesture(e) { e.preventDefault(); }
function lockScroll() {
    if (document.documentElement.classList.contains('scroll-locked')) return;
    _scrollLockedAt = window.pageYOffset || document.documentElement.scrollTop;
    document.addEventListener('wheel', _preventWheel, { passive: false });
    document.addEventListener('keydown', _preventKeyScroll);
    document.addEventListener('touchmove', _preventBgScroll, { passive: false });
    document.addEventListener('gesturestart', _blockNativeGesture, { passive: false });
    document.addEventListener('gesturechange', _blockNativeGesture, { passive: false });
    document.addEventListener('gestureend', _blockNativeGesture, { passive: false });
    document.documentElement.classList.add('scroll-locked');
}

function unlockScroll() {
    if (!document.documentElement.classList.contains('scroll-locked')) return;
    document.documentElement.classList.remove('scroll-locked');
    window.scrollTo(0, _scrollLockedAt);
    document.removeEventListener('wheel', _preventWheel);
    document.removeEventListener('keydown', _preventKeyScroll);
    document.removeEventListener('touchmove', _preventBgScroll, { passive: false });
    document.removeEventListener('gesturestart', _blockNativeGesture);
    document.removeEventListener('gesturechange', _blockNativeGesture);
    document.removeEventListener('gestureend', _blockNativeGesture);
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
        const h = navbar.getBoundingClientRect().height;
        document.body.style.paddingTop = h + 'px';
        navbar.style.willChange = 'auto';
    }

    if (document.readyState === 'complete') {
        syncPadding();
    } else {
        window.addEventListener('load', syncPadding, { once: true });
    }

    window.addEventListener('orientationchange', () => {
        navbar.style.willChange = 'transform';
        setTimeout(() => {
            syncPadding();
        }, 400);
    }, { passive: true });
})();
(function corregirLayoutAlZoom() {
    const SELECTORES_FIXED = 'header.navbar, .modal, .modal-overlay, .modal-user, .mobile-menu';
    let zoomAnterior = window.visualViewport ? window.visualViewport.scale : 1;
    let pendiente = false;
    let debounceId = null;

    function regenerarCapas() {
        pendiente = false;
        document.querySelectorAll(SELECTORES_FIXED).forEach(el => {
            const wc = el.style.willChange;
            el.style.willChange = 'auto';
            void el.offsetHeight;
            el.style.willChange = wc;
        });
        window.scrollBy(0, 1);
        window.scrollBy(0, -1);
    }

    function marcarPendiente() {
        pendiente = true;
        clearTimeout(debounceId);
        debounceId = setTimeout(() => { if (pendiente) regenerarCapas(); }, 250);
    }


    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => {
            const zoomActual = window.visualViewport.scale;
            if (Math.abs(zoomActual - zoomAnterior) > 0.01) {
                zoomAnterior = zoomActual;
                marcarPendiente();
            }
        }, { passive: true });
    }


    document.addEventListener('touchend', (e) => {
        if (pendiente && e.touches.length === 0) {
            clearTimeout(debounceId);
            regenerarCapas();
        }
    }, { passive: true });
    document.addEventListener('touchcancel', () => {
        if (pendiente) { clearTimeout(debounceId); regenerarCapas(); }
    }, { passive: true });
})();
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
    domCache.modalMarca = document.getElementById("modalMarca");
    domCache.modalMaterial = document.getElementById("modalMaterial");
    domCache.modalCapacidad = document.getElementById("modalCapacidad");
    domCache.modalClose = domCache.modal ? domCache.modal.querySelector(".close") : null;
    domCache.userModalContent = domCache.userModal ? domCache.userModal.querySelector(".user-modal-content") : null;
    domCache.openLoginBtn = document.getElementById("openLogin");
    domCache.registerBtnHeader = document.getElementById("createAccount");
    domCache.categoriesLinks = document.querySelectorAll('.categories a');
    domCache.modalClose?.addEventListener("click", cerrarModalProducto);
    domCache.modal?.addEventListener("click", e => {
        if (e.target === domCache.modal) cerrarModalProducto();
    });

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

    document.addEventListener("click", (e) => {
        if (!e.target.closest(".cat-dropdown")) {
            document.querySelectorAll(".cat-dropdown.open")
                .forEach(d => d.classList.remove("open"));
        }
    });
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

function registrarCierreBackdrop(modalEl, cerrarFn) {
    let mousedownTarget = null;
    function onMousedown(e) {
        mousedownTarget = e.target;
    }
    function onMouseup(e) {
        if (mousedownTarget === modalEl && e.target === modalEl) {
            cerrarFn();
        }
        mousedownTarget = null;
    }
    modalEl.addEventListener("mousedown", onMousedown);
    modalEl.addEventListener("mouseup", onMouseup);

    return function limpiar() {
        modalEl.removeEventListener("mousedown", onMousedown);
        modalEl.removeEventListener("mouseup", onMouseup);
    };
}