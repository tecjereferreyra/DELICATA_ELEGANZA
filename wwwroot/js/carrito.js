const IMG_BASE_URL = "https://delicata-eleganza.onrender.com";
const CARRITO_KEY = "carritoDelicata";
const WPP_CARRITO = "5493573692940";   

/* ─── OBTENER / GUARDAR ─────────────────────────────────── */
function obtenerCarrito() {
    try {
        return JSON.parse(localStorage.getItem(CARRITO_KEY)) || [];
    } catch {
        return [];
    }
}

function obtenerCantidadEnCarrito(idProducto) {
    const carrito = obtenerCarrito();
    const item = carrito.find(i => String(i.id) === String(idProducto));
    return item ? item.cantidad : 0;
}

function guardarCarrito(items) {
    localStorage.setItem(CARRITO_KEY, JSON.stringify(items));
    actualizarBadge();
    actualizarTarjetasEnCatalogo();
}

/* ─── PERSISTENCIA POR USUARIO ─────────────────────────── */
function restaurarCarritoUsuario(correo) {
    if (!correo) return;
    const key = `${CARRITO_KEY}_${correo}`;
    try {
        const guardado = JSON.parse(localStorage.getItem(key));
        if (guardado && guardado.length > 0) {
            localStorage.setItem(CARRITO_KEY, JSON.stringify(guardado));
            actualizarBadge();
        }
    } catch { /* ignorar */ }
}

function guardarYLimpiarCarritoAlCerrarSesion(correo) {
    if (!correo) return;
    const key = `${CARRITO_KEY}_${correo}`;
    const items = obtenerCarrito();
    try { localStorage.setItem(key, JSON.stringify(items)); } catch { /* ignorar */ }
    localStorage.removeItem(CARRITO_KEY);
    actualizarBadge();
}

/* ─── SINCRONIZAR BADGES EN CATÁLOGO ───────────────────── */
function actualizarTarjetasEnCatalogo() {
    if (typeof productosMap === "undefined") return;
    const carrito = obtenerCarrito();
    document.querySelectorAll(".product-card[data-id]").forEach(card => {
        const id = card.dataset.id;
        const producto = productosMap.get(String(id));
        if (!producto) return;

        const enCarrito = carrito.find(i => String(i.id) === String(id));
        const cantidad = enCarrito ? enCarrito.cantidad : 0;
        const stockDisp = producto.Stock - cantidad;

        const badge = card.querySelector(".disponible");
        if (!badge) return;
        badge.className = "disponible " + (stockDisp > 0 ? "en-stock" : "sin-stock");
        badge.textContent = stockDisp > 0 ? "✓ En stock" : "✕ Sin stock";
    });
}

/* ─── BADGE FLOTANTE ────────────────────────────────────── */
function actualizarBadge() {
    const badge = document.getElementById("carritoBadge");
    if (!badge) return;
    const total = obtenerCarrito().reduce((acc, item) => acc + item.cantidad, 0);
    badge.textContent = total;
    badge.classList.remove("bump");
    void badge.offsetWidth;
    if (total > 0) badge.classList.add("bump");
    setTimeout(() => badge.classList.remove("bump"), 300);
}

/* ─── DIALOG ELEGIR CANTIDAD ────────────────────────────── */
function abrirDialogCantidad(producto) {
    // Remover overlay previo si existe
    document.getElementById("dialogCantidadOverlay")?.remove();

    const stock = producto.Stock || 0;
    let cantidadSeleccionada = 1;

    const carrito = obtenerCarrito();
    const enCarrito = carrito.find(i => String(i.id) === String(producto.IdProducto));
    const yaAgregado = enCarrito ? enCarrito.cantidad : 0;
    const stockDisponible = Math.max(0, stock - yaAgregado);

    if (stockDisponible < 1) {
        if (typeof mostrarToast === "function") mostrarToast("Sin stock disponible.", "info", 3000);
        return;
    }

    const overlay = document.createElement("div");
    overlay.id = "dialogCantidadOverlay";
    overlay.className = "dialog-cantidad-overlay";
    overlay.innerHTML = `
        <div class="dialog-cantidad-box">
            <img class="dialog-cantidad-img"
                 src="${producto.ImagenUrl}"
                 alt="${producto.Nombre}">
            <div class="dialog-cantidad-titulo">${producto.Nombre}</div>
            <div class="dialog-cantidad-label">¿Cuántos querés agregar?</div>
            <div class="dialog-cantidad-controles">
                <button class="dialog-cantidad-btn" id="dcMenos"
                    ${stockDisponible < 1 || cantidadSeleccionada <= 1 ? "disabled" : ""}>−</button>
                <span class="dialog-cantidad-num" id="dcNum">1</span>
                <button class="dialog-cantidad-btn" id="dcMas"
                    ${stockDisponible <= 1 ? "disabled" : ""}>+</button>
            </div>
            <div class="dialog-cantidad-stock">
                Stock disponible: <strong>${stockDisponible}</strong>
                unidad${stockDisponible !== 1 ? "es" : ""}
                ${yaAgregado > 0 ? `<br>(Ya tenés ${yaAgregado} en el carrito)` : ""}
            </div>
            <div class="dialog-cantidad-actions">
                <button class="dialog-btn-cancelar" id="dcCancelar">Cancelar</button>
                <button class="dialog-btn-agregar" id="dcAgregar"
                    ${stockDisponible < 1 ? "disabled" : ""}>
                    <i class="fa-solid fa-bag-shopping"></i> Agregar
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add("show"));

    const btnMenos = document.getElementById("dcMenos");
    const btnMas = document.getElementById("dcMas");
    const numEl = document.getElementById("dcNum");

    const actualizarControles = () => {
        numEl.textContent = cantidadSeleccionada;
        btnMenos.disabled = cantidadSeleccionada <= 1;
        btnMas.disabled = cantidadSeleccionada >= stockDisponible;
    };

    btnMenos?.addEventListener("click", () => {
        if (cantidadSeleccionada > 1) { cantidadSeleccionada--; actualizarControles(); }
    });
    btnMas?.addEventListener("click", () => {
        if (cantidadSeleccionada < stockDisponible) { cantidadSeleccionada++; actualizarControles(); }
    });

    const cerrarDialog = () => {
        overlay.classList.remove("show");
        overlay.classList.add("closing");
        setTimeout(() => overlay.remove(), 380);
    };

    document.getElementById("dcCancelar")?.addEventListener("click", cerrarDialog);
    overlay.addEventListener("click", e => { if (e.target === overlay) cerrarDialog(); });

    document.getElementById("dcAgregar")?.addEventListener("click", () => {
        if (stockDisponible < 1) return;
        const carrito = obtenerCarrito();
        const idx = carrito.findIndex(i => String(i.id) === String(producto.IdProducto));

        if (idx !== -1) {
            carrito[idx].cantidad = Math.min(carrito[idx].cantidad + cantidadSeleccionada, stock);
        } else {
            carrito.push({
                id: String(producto.IdProducto),
                nombre: producto.Nombre,
                modelo: producto.Modelo || "—",
                color: producto.Color || "—",
                marca: producto.Marca || "—",
                material: producto.Material || "—",
                imagenUrl: producto.ImagenUrl,
                stock: stock,
                cantidad: cantidadSeleccionada
            });
        }

        guardarCarrito(carrito);
        cerrarDialog();
        if (typeof mostrarToast === "function") {
            mostrarToast(`✓ ${producto.Nombre} agregado al carrito`, "info", 2500);
        }
    });

    const handleEsc = e => {
        if (e.key === "Escape") { cerrarDialog(); document.removeEventListener("keydown", handleEsc); }
    };
    document.addEventListener("keydown", handleEsc);
}

/* ═══════════════════════════════════════════════════════════
   PÁGINA CARRITO (carrito.html de Delicata)
   ═══════════════════════════════════════════════════════════ */
function inicializarPaginaCarrito() {
    const lista = document.getElementById("carritoLista");
    const resumen = document.getElementById("carritoResumen");
    const btnWpp = document.getElementById("btnConsultarWpp");
    const btnVaciar = document.getElementById("btnVaciar");

    if (!lista) return; // No estamos en carrito.html

    function renderCarrito() {
        const items = obtenerCarrito();
        lista.innerHTML = "";

        if (items.length === 0) {
            lista.innerHTML = `
                <div class="carrito-vacio">
                    <i class="fa-solid fa-bag-shopping"></i>
                    <p>Tu carrito está vacío.<br>
                       Explorá nuestros productos y agregá los que más te gusten.</p>
                    <a href="/"><i class="fa-solid fa-arrow-left"></i> Ir al catálogo</a>
                </div>`;
            if (resumen) resumen.style.display = "none";
            return;
        }

        if (resumen) resumen.style.display = "";

        items.forEach((item, idx) => {
            const stockReal = Math.max(item.stock || 1, item.cantidad);
            const div = document.createElement("div");
            div.className = "carrito-item";
            div.dataset.idx = idx;
            div.innerHTML = `
                <img class="carrito-item-img" src="${item.imagenUrl}" alt="${item.nombre}" loading="lazy" width="72" height="72">
                <div class="carrito-item-info">
                    <div class="carrito-item-nombre">${item.nombre}</div>
                    <div class="carrito-item-modelo">
                        <i class="fa-solid fa-tag"></i> ${item.modelo}
                    </div>
                    <div class="carrito-item-cantidad-row">
                        <button class="carrito-item-qty-btn btn-menos" data-idx="${idx}"
                            ${item.cantidad <= 1 ? "disabled" : ""}>−</button>
                        <span class="carrito-item-qty-num">${item.cantidad}</span>
                        <button class="carrito-item-qty-btn btn-mas" data-idx="${idx}"
                            ${item.cantidad >= stockReal ? "disabled" : ""}>+</button>
                    </div>
                    <div class="carrito-item-stock-info">
                        Stock disponible: ${stockReal - item.cantidad}
                        restante${(stockReal - item.cantidad) !== 1 ? "s" : ""}
                    </div>
                </div>
                <button class="carrito-item-eliminar" data-idx="${idx}"
                        aria-label="Eliminar producto">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            `;
            lista.appendChild(div);
        });

        actualizarResumen(items);
    }

    function actualizarResumen(items) {
        const totalUnidades = items.reduce((a, i) => a + i.cantidad, 0);
        const spanUnidades = document.getElementById("resumenUnidades");
        const spanProductos = document.getElementById("resumenProductos");
        if (spanUnidades) spanUnidades.textContent = totalUnidades;
        if (spanProductos) spanProductos.textContent = items.length;
    }

    // Eventos delegados
    lista.addEventListener("click", e => {
        const target = e.target.closest("[data-idx]");
        if (!target) return;
        const idx = parseInt(target.dataset.idx);
        if (isNaN(idx)) return;

        const carrito = obtenerCarrito();
        const item = carrito[idx];
        if (!item) return;
        const stockReal = Math.max(item.stock || 1, item.cantidad);

        if (e.target.closest(".btn-menos") && item.cantidad > 1) {
            item.cantidad--;
            guardarCarrito(carrito);
            renderCarrito();
        } else if (e.target.closest(".btn-mas") && item.cantidad < stockReal) {
            item.cantidad++;
            guardarCarrito(carrito);
            renderCarrito();
        } else if (e.target.closest(".carrito-item-eliminar")) {
            carrito.splice(idx, 1);
            guardarCarrito(carrito);
            renderCarrito();
        }
    });

    // Vaciar
    btnVaciar?.addEventListener("click", () => {
        if (confirm("¿Querés vaciar todo el carrito?")) {
            guardarCarrito([]);
            renderCarrito();
        }
    });

    // Consultar por WhatsApp
    btnWpp?.addEventListener("click", () => {
        const items = obtenerCarrito();
        if (items.length === 0) return;

        const lineas = items.map(i => {
            const imagenRelativa = i.imagenUrl || "";
            const foto = imagenRelativa.startsWith("http")
                ? imagenRelativa
                : `${IMG_BASE_URL}${imagenRelativa}`;

            return `• ${i.nombre}\n` +
                `  Modelo: ${i.modelo}\n` +
                `  Color: ${i.color}\n` +
                `  Marca: ${i.marca || "—"}\n` +
                `  Material: ${i.material || "—"}\n` +
                `  Cantidad: ${i.cantidad}\n` +
                `  Foto: ${foto}`;
        }).join("\n\n");

        const msg = `Hola Edgar, cómo estás? Quisiera consultar el precio de los siguientes productos:\n\n${lineas}\n\n¿Podrías pasarme el total? Gracias!`;
        window.open(`https://wa.me/${WPP_CARRITO}?text=${encodeURIComponent(msg)}`, "_blank");
    });

    renderCarrito();
}

/* ─── TOAST ─────────────────────────────────────────────── */
function mostrarToast(mensaje, tipo = "info", duracion = 4000) {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "toast-item";
    toast.innerHTML = `<i class="fa-solid fa-bag-shopping"></i> ${mensaje}`;
    container.appendChild(toast);

    // Forzar reflow para activar transición
    void toast.offsetWidth;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
        toast.classList.add("hide");
        setTimeout(() => toast.remove(), 380);
    }, duracion);
}

/* ─── INIT ───────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
    actualizarBadge();
    inicializarPaginaCarrito();
});