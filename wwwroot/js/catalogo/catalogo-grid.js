
function crearTarjetaDOM(prod, index = 0) {
    const card = document.createElement("div");
    card.className = "product-card";
    card.dataset.id = prod.IdProducto;

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

    const body = document.createElement("div");
    body.className = "product-card-body";

    const nombre = document.createElement("h3");
    nombre.textContent = safeText(prod.Nombre || prod.nombre);
    body.appendChild(nombre);

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
    if (esAdminActual) {
        const badge = body.querySelector(".disponible");
        if (badge) {
            badge.style.cursor = "pointer";
            badge.addEventListener("click", (e) => {
                e.stopPropagation();
                abrirDialogoStock(prod);
            });
        }
    }
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
    }, { once: true });
    card.addEventListener("click", () => {
        if (_menuCerradoRecien) return;
        abrirModal(prod);
    }, { passive: true });
    cardObserver.observe(card);
    return card;
}
function abrirDialogoStock(prod) {
    // Remover overlay previo si existe (por si quedó uno abierto)
    document.getElementById("dialogStockOverlay")?.remove();

    const enStock = prod.Stock > 0;
    const stockActual = prod.Stock ?? 0;

    const overlay = document.createElement("div");
    overlay.id = "dialogStockOverlay";
    overlay.className = "dialog-stock-overlay";

    if (enStock) {
        // Caso 1: está en stock -> confirmar que se quiere pasar a "sin stock"
        overlay.innerHTML = `
            <div class="dialog-stock-box">
                <div class="dialog-stock-icono sin-stock"><i class="fa-solid fa-triangle-exclamation"></i></div>
                <div class="dialog-stock-titulo">${safeText(prod.Nombre)}</div>
                <div class="dialog-stock-label">¿Marcar como sin stock?</div>
                <div class="dialog-stock-detalle">
                    Stock actual: <strong>${stockActual}</strong> unidad${stockActual !== 1 ? "es" : ""}.<br>
                    Se va a poner en 0.
                </div>
                <div class="dialog-stock-actions">
                    <button type="button" class="dialog-btn-cancelar" id="dsCancelar">Cancelar</button>
                    <button type="button" class="dialog-btn-confirmar dialog-btn-peligro" id="dsConfirmar">
                        <i class="fa-solid fa-ban"></i> Sin stock
                    </button>
                </div>
            </div>
        `;
    } else {
        // Caso 2: está sin stock -> pedir cuánto stock cargar (con contador +/-)
        overlay.innerHTML = `
            <div class="dialog-stock-box">
                <div class="dialog-stock-icono en-stock"><i class="fa-solid fa-circle-check"></i></div>
                <div class="dialog-stock-titulo">${safeText(prod.Nombre)}</div>
                <div class="dialog-stock-label">¿Cuánto stock querés cargar?</div>
                <div class="dialog-stock-controles">
                    <button type="button" class="dialog-stock-btn" id="dsMenos">−</button>
                    <input type="number" class="dialog-stock-num" id="dsNum" value="1" min="0" inputmode="numeric">
                    <button type="button" class="dialog-stock-btn" id="dsMas">+</button>
                </div>
                <div class="dialog-stock-actions">
                    <button type="button" class="dialog-btn-cancelar" id="dsCancelar">Cancelar</button>
                    <button type="button" class="dialog-btn-confirmar" id="dsConfirmar">
                        <i class="fa-solid fa-check"></i> Marcar disponible
                    </button>
                </div>
            </div>
        `;
    }

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add("show"));

    const cerrarDialog = () => {
        overlay.classList.remove("show");
        overlay.classList.add("closing");
        setTimeout(() => overlay.remove(), 380);
        document.removeEventListener("keydown", handleEsc);
    };

    overlay.querySelector("#dsCancelar")?.addEventListener("click", cerrarDialog);
    overlay.addEventListener("click", e => { if (e.target === overlay) cerrarDialog(); });

    const handleEsc = e => { if (e.key === "Escape") cerrarDialog(); };
    document.addEventListener("keydown", handleEsc);

    if (enStock) {
        overlay.querySelector("#dsConfirmar")?.addEventListener("click", () => {
            cerrarDialog();
            actualizarStockProducto(prod, 0);
        });
    } else {
        const numEl = overlay.querySelector("#dsNum");
        const btnMenos = overlay.querySelector("#dsMenos");
        const btnMas = overlay.querySelector("#dsMas");

        const clamp = () => {
            let v = parseInt(numEl.value, 10);
            if (isNaN(v) || v < 0) v = 0;
            numEl.value = v;
            btnMenos.disabled = v <= 0;
        };
        clamp();

        btnMenos.addEventListener("click", () => {
            numEl.value = Math.max(0, (parseInt(numEl.value, 10) || 0) - 1);
            clamp();
        });
        btnMas.addEventListener("click", () => {
            numEl.value = (parseInt(numEl.value, 10) || 0) + 1;
            clamp();
        });
        numEl.addEventListener("input", clamp);

        overlay.querySelector("#dsConfirmar")?.addEventListener("click", () => {
            const nuevoStock = parseInt(numEl.value, 10);
            if (isNaN(nuevoStock) || nuevoStock < 0) {
                mostrarToast("Ingresá un número válido de stock", "error");
                return;
            }
            cerrarDialog();
            actualizarStockProducto(prod, nuevoStock);
        });
    }
}

async function actualizarStockProducto(prod, nuevoStock) {
    try {
        const resp = await fetch(`/api/Productos/${prod.IdProducto}/stock`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("tokenDelicata")}`
            },
            body: JSON.stringify({ Stock: nuevoStock })
        });

        if (!resp.ok) {
            mostrarToast("No se pudo actualizar el stock", "error");
            return;
        }

        const data = await resp.json();
        prod.Stock = data.stock;
        prod.Disponible = data.disponible;

        // Actualiza el badge en el DOM sin recargar toda la grilla
        const card = document.querySelector(`.product-card[data-id="${prod.IdProducto}"]`);
        if (card) {
            const badge = card.querySelector(".disponible");
            if (badge) {
                badge.className = `disponible ${data.disponible ? "en-stock" : "sin-stock"}`;
                badge.textContent = data.disponible ? "✦ Disponible" : "✦ Sin stock";
            }
        }

        mostrarToast(data.disponible ? "Producto marcado como disponible" : "Producto marcado sin stock", "exito");
    } catch (err) {
        mostrarToast("Error de conexión al actualizar stock", "error");
    }
}
function abrirModalAdmin(idModal) {
    const modalEl = document.getElementById(idModal);
    if (!modalEl) { console.error("No existe el modal admin:", idModal); return; }
    lockScroll();
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
    unlockScroll();
}

function abrirModal(prod) {
    const prodFresh = productosData.find(p => p.IdProducto === prod.IdProducto) || prod;
    prod = prodFresh;
    const modal = domCache.modal;
    if (!modal) return;
    productoSeleccionado = prod;

    const imagenPrincipal = safeText(prod.ImagenUrl || prod.imagenUrl || "/ImagenUrl/default.webp");

    domCache.modalNombre.textContent = safeText(prod.Nombre || prod.nombre);

    const camposDisponibles = [
        { id: "modalModelo", value: prod.Modelo || prod.modelo },
        { id: "modalColor", value: prod.Color || prod.color },
        { id: "modalMarca", value: prod.Marca || prod.marca },
        { id: "modalMaterial", value: prod.Material || prod.material },
        { id: "modalCapacidad", value: prod.Capacidad || prod.capacidad },
        { id: "modalCompartimentos", value: prod.Compartimentos || prod.compartimentos },
        { id: "modalAlto", value: prod.Alto && prod.Alto !== "—" ? prod.Alto + " cm" : null },
        { id: "modalAncho", value: prod.Ancho && prod.Ancho !== "—" ? prod.Ancho + " cm" : null },
        { id: "modalProfundidad", value: prod.Profundidad && prod.Profundidad !== "—" ? prod.Profundidad + " cm" : null },
        { id: "modalPeso", value: prod.Peso && prod.Peso !== "—" ? prod.Peso + " g" : null },
        { id: "modalDiametro", value: prod.Diametro && prod.Diametro !== "—" ? prod.Diametro + " mm" : null },
        { id: "modalGenero", value: prod.Genero || prod.genero },
        { id: "modalCantidadRuedas", value: prod.CantidadRuedas || prod.cantidadRuedas },
        { id: "modalFuelleExpandible", value: prod.FuelleExpandible === true ? "Sí" : prod.FuelleExpandible === false ? "No" : null },
        { id: "modalMedidas", value: prod.MedidasTexto && prod.MedidasTexto !== "—" ? prod.MedidasTexto : null },
        { id: "modalTipoCierre", value: prod.TipoCierre || prod.tipoCierre },
        { id: "modalStock", value: prod.Stock ?? prod.stock },
    ];

    toggleFieldsByTipo(prod.Nombre || prod.nombre || "", false, "view");

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
            if (el.style.display !== "none") visibles++;
        } else {
            el.hidden = true;
        }
    });

    const grid = document.querySelector(".modal-info-grid");
    if (grid) {
        const todosPs = [...grid.querySelectorAll("p")];
        todosPs.forEach(p => p.classList.remove("centrado"));
        if (visibles % 2 !== 0) {
            const esVisible = el => !el.hidden && el.style.display !== "none";
            const ultimo = todosPs.filter(esVisible).at(-1);
            if (ultimo) ultimo.classList.add("centrado");
        }
    }



    const adminBox = document.getElementById("modalAdminButtons");
    const correo = localStorage.getItem("correoDelicata");
    if (adminBox) {
        const esAdmin = correo === "reflej8@hotmail.com" || correo === "tec.jereferreyra@gmail.com";
        adminBox.style.display = esAdmin ? "flex" : "none";
    }

    const btnWpp = document.getElementById("btnWhatsapp");
    if (btnWpp) {
        const nombreProducto = safeText(prod.Nombre || prod.nombre);
        const modelo = safeText(prod.Modelo || prod.modelo);
        const color = safeText(prod.Color || prod.color);
        const marca = safeText(prod.Marca || prod.marca);
        const material = safeText(prod.Material || prod.material);

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
        renderCarrusel(prod._imagenesCache, safeText(prod.Nombre || prod.nombre));
        renderSwatchesColor(prod);
        abrirModalProducto();
    } else {
        renderCarrusel([imagenPrincipal], safeText(prod.Nombre || prod.nombre), true);
        renderSwatchesColor(prod);
        abrirModalProducto();
        const idAbierto = prod.IdProducto;
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
                    completarCarrusel(todas, safeText(prod.Nombre || prod.nombre));
                }
            })
            .catch(() => { });
    }
}
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

function renderizarProductosProgresivo(reiniciar = false) {
    const contenedor = document.getElementById("contenedor-productos");
    const hasta = Math.min(productosRenderizados + BLOQUE_CARGA, productosFiltrados.length);

    if (reiniciar) {
        const existentes = new Map();
        contenedor.querySelectorAll(".product-card").forEach(card => {
            existentes.set(card.dataset.id, card);
        });

        const fragment = document.createDocumentFragment();
        for (let i = 0; i < hasta; i++) {
            const prod = productosFiltrados[i];
            const idStr = String(prod.IdProducto);
            const existente = existentes.get(idStr);
            if (existente) {
                fragment.appendChild(existente);
                existentes.delete(idStr);
            } else {
                fragment.appendChild(crearTarjetaDOM(prod, i));
            }
        }

        existentes.forEach(card => cardObserver.unobserve(card));
        contenedor.replaceChildren(fragment);
    } else {
        const fragment = document.createDocumentFragment();
        for (let i = productosRenderizados; i < hasta; i++) {
            fragment.appendChild(crearTarjetaDOM(productosFiltrados[i], i));
        }
        contenedor.appendChild(fragment);
    }

    productosRenderizados = hasta;
    const btnVerMas = document.getElementById("btnVerMas");
    btnVerMas.style.display = productosRenderizados < productosFiltrados.length ? "block" : "none";
}
function irAlContenedorProductos() {
    const contenedor = document.getElementById("contenedor-productos");
    if (!contenedor) return;
    const navbar = document.querySelector("header.navbar");
    const navbarH = navbar ? navbar.getBoundingClientRect().height : 80;
    const y = contenedor.getBoundingClientRect().top + window.pageYOffset - navbarH - 24;
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
}
const categoriaLinks = document.querySelectorAll('.categories a');
const normalizar = texto =>
    texto.toString().toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

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
        const target = e.target.closest('[data-cat]') || e.target;
        categoriaLinks.forEach(l => l.classList.remove('active-cat'));
        const linkActivo = e.currentTarget;
        linkActivo.classList.add('active-cat');
        categoriaActivaActual = normalizar(target.dataset.cat || linkActivo.dataset.cat || "todos");
        subcategoriaActivaActual = normalizar(target.dataset.tipo || linkActivo.dataset.tipo || "");

        desactivarModoNuevos();

        aplicarFiltros();
        irAlContenedorProductos();

    });
});