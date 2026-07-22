
function validarCampos(data, esEditar = false) {
    const suf = esEditar ? "Editar" : "";
    const errores = [];

    if (!data.Nombre?.trim()) errores.push("• El nombre es obligatorio.");
    if (!data.Modelo?.trim()) errores.push("• El modelo es obligatorio.");
    if (!data.Color?.trim()) errores.push("• El color es obligatorio.");
    if (!data.Categoria?.trim()) errores.push("• La categoría es obligatoria.");
    if (!data.Marca?.trim()) errores.push("• La marca es obligatoria.");
    if (data.Stock === "" || data.Stock === null || data.Stock === undefined || isNaN(Number(data.Stock)))
        errores.push("• El stock debe ser un número válido.");

    if (!esEditar) {
        const imgInput = document.getElementById("prodImagen");
        if (!imgInput?.files?.length)
            errores.push("• La imagen principal es obligatoria.");
    }

    function campoVisible(id) {
        const el = document.getElementById(id);
        if (!el) return false;

        if (el.style.display === "none") return false;

        const col = el.closest(".col");
        if (col && col.style.display === "none") return false;

        const parent = el.parentElement;
        if (parent && parent.style.display === "none") return false;
        return true;
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

window._colaProductos = [];

function _leerSnapshotFormulario() {
    const val = id => document.getElementById(id)?.value?.trim() ?? "";
    const checked = id => document.getElementById(id)?.checked ?? false;
    const imgInput = document.getElementById("prodImagen");
    const archivo = imgInput && imgInput.files[0] ? imgInput.files[0] : null;
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
        _tipoNombre: val("prodNombre"),
    };
}

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
    _actualizarPreviewColorAgregar();
    toggleFieldsByTipo(snap.Nombre, false, "form");
}

function _actualizarPreviewColorAgregar() {
    const input = document.getElementById("prodColor");
    const preview = document.getElementById("colorSwatchPreviewAgregar");
    if (!input || !preview) return;
    const css = colorACSS(input.value.trim());
    preview.style.background = css;
    preview.style.display = input.value.trim() ? "inline-block" : "none";
}

function agregarProductoACola() {
    const snap = _leerSnapshotFormulario();

    if (!snap.Nombre) { mostrarToast("El nombre es obligatorio", "error"); return; }
    if (!snap.Color) { mostrarToast("El color es obligatorio", "error"); return; }
    if (!snap.Stock) { mostrarToast("El stock es obligatorio", "error"); return; }
    window._colaProductos.push(snap);
    _renderColaProductos();

    const colorEl = document.getElementById("prodColor");
    if (colorEl) { colorEl.value = ""; _actualizarPreviewColorAgregar(); }
    const stockEl = document.getElementById("prodStock");
    if (stockEl) stockEl.value = "";
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

function _renderColaProductos() {
    const contenedor = document.getElementById("colaProductosAgregar");
    if (!contenedor) return;
    if (window._colaProductos.length === 0) {
        contenedor.style.display = "none";
        contenedor.innerHTML = "";
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

    const btnGuardar = document.querySelector("#modalAgregar .btn-save");
    if (btnGuardar) btnGuardar.textContent = `Guardar todos (${window._colaProductos.length + 1})`;
}
function _quitarItemCola(idx) {
    window._colaProductos.splice(idx, 1);
    _renderColaProductos();
}

function _editarItemCola(idx) {
    const snap = window._colaProductos[idx];
    _cargarSnapshotAlFormulario(snap);
    window._colaProductos.splice(idx, 1);
    _renderColaProductos();
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

    _renderColaProductos();
    const swatchPrev = document.getElementById("colorSwatchPreviewAgregar");
    if (swatchPrev) swatchPrev.style.display = "none";

    const colorInput = document.getElementById("prodColor");
    if (colorInput) colorInput.oninput = _actualizarPreviewColorAgregar;

    const btnGuardar = document.querySelector("#modalAgregar .btn-save");
    if (btnGuardar) btnGuardar.textContent = "Guardar";
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
        if (fallback !== undefined) fd.append(fieldName, fallback);
    }
}

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

async function _enviarSnapshot(snap) {
    const fd = _snapToFormData(snap);
    const res = await fetch("/api/Productos", {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("tokenDelicata")}` },
        body: fd
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(traducirErrorBackend(text));
    }
    const nuevoProd = await res.json();
    const nuevoId = nuevoProd.id_producto ?? nuevoProd.idProducto ?? nuevoProd.IdProducto;

    const extras = (snap._archivosExtra || []).filter(Boolean);
    if (extras.length > 0 && nuevoId) {
        const fdImg = new FormData();
        extras.forEach(f => fdImg.append("imagenes", f));
        await fetch(`/api/Productos/${nuevoId}/imagenes`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${localStorage.getItem("tokenDelicata")}` },
            body: fdImg
        })
            .catch(e => console.warn("Error subiendo imágenes extra:", e));
    }
    return nuevoId;
}

async function guardarNuevoProducto() {
    const snapActual = _leerSnapshotFormulario();

    if (!snapActual.Nombre) { mostrarToast("El nombre es obligatorio", "error"); return; }
    if (!snapActual.Color) { mostrarToast("El color es obligatorio", "error"); return; }
    if (!snapActual.Stock) { mostrarToast("El stock es obligatorio", "error"); return; }

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

    if (errores.length === 0) {
        mostrarToast(total > 1 ? `${total} productos guardados ✓` : "Producto guardado ✓", "success");
    } else {
        mostrarToast(`${errores.length} error(es): ${errores[0]}`, "error");
    }

    window._colaProductos = [];
    _renderColaProductos();
    _fkCargadas = false;
    cerrarModalCRUD("modalAgregar");

    if (nuevosIds.length > 0) {
        for (const id of nuevosIds) {
            try {
                const p = await fetch(`/api/Productos/${id}`, { cache: "no-store" })
                    .then(r => r.json())
                const prod = normalizarProducto(p);
                recalcularCamposBusqueda(prod);
                productosData.push(prod);
            } catch (e) { }
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
    fetch(`/api/Productos/${id}`, { cache: "no-store" })
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
                medidasTexto: p.MedidasTexto ?? p.medidasTexto ?? "",
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

            const prevGridEdit = document.getElementById("previewGridEditar");
            if (prevGridEdit) {
                prevGridEdit.innerHTML = "";
                window._imagenesGuardadasAEliminar = [];
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
                        window._imagenesGuardadasAEliminar.push(url);
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
    if (_fkCargadas) return;
    try {
        const [categorias, marcas, tipos, materiales, tiposCierre, capacidades, generos] = await Promise.all([
            fetch("/api/Categorias").then(res => res.json()),
            fetch("/api/Marcas").then(res => res.json()),
            fetch("/api/Tipos").then(res => res.json()),
            fetch("/api/Materiales").then(res => res.json()),
            fetch("/api/TiposCierre").then(res => res.json()),
            fetch("/api/Capacidades").then(res => res.json()),
            fetch("/api/Generos").then(res => res.json())
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
        _fkCargadas = true;
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

const TIPOS_POR_CATEGORIA = {
    "marroquineria": ["Carteras", "Billeteras H/M", "Bandoleras", "Bolsos", "Ficheros", "Morrales", "Riñoneras", "Mochilas H/M", "Mini Bags", "Portanotebooks"],
    "bijouterie": ["Aros", "Cadenas", "Pulseras", "Collares", "Cadenas", "Dijes"],
    "fiesta": ["Aros", "Collares", "Chales", "Sobres"],
    "complementos": ["Paraguas", "Cajas Bijou", "Abanicos", "Cintos"],
    "artículos de viaje": ["Valijas", "Complementos de viaje"],
    "piercing": ["Piercing"],
    "pañoleria": ["Invierno", "Verano"]
};
const TIPO_ALIAS_MAP = {
    "morral": "Morrales",
    "chale": "Chales",
    "chales": "Chales",
    "sobre": "Sobres",
    "sobres": "Sobres",
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
    "aro": "Aros",
    "aros": "Aros",
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
    "dije": "Dijes",
    "dijes": "Dijes",
};
function extraerTipoExacto(textoNormalizado) {
    const clavesCompuestas = Object.keys(TIPO_ALIAS_MAP)
        .filter(k => k.includes(" "))
        .sort((a, b) => b.length - a.length);
    for (const clave of clavesCompuestas) {
        const patron = new RegExp(`\\b${clave.replace(/\s+/g, "\\s+")}\\b`);
        if (patron.test(textoNormalizado)) {
            return {
                tipo: normalizar(TIPO_ALIAS_MAP[clave]),
                textoRestante: textoNormalizado.replace(patron, " ").replace(/\s+/g, " ").trim()
            };
        }
    }
    const tokens = textoNormalizado.split(/\s+/).filter(Boolean);
    for (const tok of tokens) {
        const clave = TIPO_ALIAS_MAP[tok] ? tok : normalizarTermino(tok);
        if (TIPO_ALIAS_MAP[clave]) {
            return {
                tipo: normalizar(TIPO_ALIAS_MAP[clave]),
                textoRestante: textoNormalizado.replace(new RegExp(`\\b${tok}\\b`), " ").replace(/\s+/g, " ").trim()
            };
        }
    }
    return null;
}
function normalizarTipo(valor) {
    if (!valor || !valor.trim()) return valor;
    const key = valor.trim().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return TIPO_ALIAS_MAP[key] || valor.trim();
}
function filtrarTiposPorCategoria(categoriaValor, dlId) {
    const dl = document.getElementById(dlId);
    if (!dl) return;
    const catNorm = normalizar(categoriaValor || "");
    let tipos = null;
    for (const [key, vals] of Object.entries(TIPOS_POR_CATEGORIA)) {
        if (normalizar(key) === catNorm || catNorm.includes(normalizar(key)) || normalizar(key).includes(catNorm)) {
            tipos = vals;
            break;
        }
    }
    if (tipos) {
        dl.innerHTML = "";
        tipos.forEach(t => {
            const opt = document.createElement("option");
            opt.value = t;
            dl.appendChild(opt);
        });
    }
}
document.getElementById("prodCategoria")?.addEventListener("change", function () {
    actualizarIdDesdeDatalist(this, "dlCategorias", "prodIdCategoria");
    filtrarTiposPorCategoria(this.value, "dlTipos");
    const tipoInput = document.getElementById("prodTipo");
    if (tipoInput) tipoInput.value = "";
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
            headers: { "Authorization": `Bearer ${localStorage.getItem("tokenDelicata")}` },
            body: fd
        });
        if (!res.ok) {
            const text = await res.text();
            mostrarToast("Error al editar: " + traducirErrorBackend(text), "error");
            return;
        }

        const archivosExtraEdit = (window._archivosExtraEditar || []).filter(f => f !== null);
        if (archivosExtraEdit.length > 0) {
            const fdImgs = new FormData();
            archivosExtraEdit.forEach(f => fdImgs.append("imagenes", f));
            await fetch(`/api/Productos/${id}/imagenes`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${localStorage.getItem("tokenDelicata")}` },
                body: fdImgs
            })
                .catch(e => console.warn("Error subiendo imágenes extra:", e));
        }
        window._archivosExtraEditar = [];
        const imagenesAEliminar = window._imagenesGuardadasAEliminar || [];
        for (const url of imagenesAEliminar) {
            await fetch(`/api/Productos/${id}/imagenes/by-url`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("tokenDelicata")}`
                },
                body: JSON.stringify(url)
            }).catch(e => console.warn("Error eliminando imagen del carrusel:", e));
        }
        window._imagenesGuardadasAEliminar = [];
        mostrarToast("Producto editado correctamente ✓", "success");
        _fkCargadas = false;
        const _savedScrollEditar = window._scrollAntesDeCRUD ?? _scrollLockedAt;
        cerrarModalCRUD("modalEditar");
        fetch(`/api/Productos/${id}`, { cache: "no-store" })
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
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("tokenDelicata")}` }
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
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("tokenDelicata")}` }
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
        medidas: get("Medidas"),
    };
    const campoStock = get("Stock");
    function renameLabel(elem, nuevoLabel) {
        if (!elem) return;
        if (isView) {
            elem.setAttribute("data-label", nuevoLabel);
        } else {
            const col = elem.closest(".col");
            if (col) {
                const lbl = col.querySelector("label");
                if (lbl) lbl.textContent = nuevoLabel;
            }
        }
    }

    function resetLabels() {
        renameLabel(campos.alto, isView ? "Alto" : "Alto (cm)");
        renameLabel(campos.ancho, isView ? "Ancho" : "Ancho (cm)");
        renameLabel(campos.prof, isView ? "Profundidad" : "Profundidad (cm)");
        renameLabel(campos.diametro, isView ? "Diámetro" : "Diámetro (mm)");
        renameLabel(campoStock, "Stock total");
        renameLabel(campos.peso, isView ? "Peso total" : "Peso total (g)");
    }
    function setVisible(elem, visible) {
        if (!elem) return;
        if (isView) {
            elem.style.display = visible ? "" : "none";
            return;
        }
        const col = elem.closest(".col");
        if (col) col.style.display = visible ? "" : "none";

    }

    function limpiarCamposOcultos() {
        Object.values(campos).forEach(elem => {
            if (!elem) return;
            const oculto = isView
                ? elem.style.display === "none"
                : (elem.closest(".col")?.style.display === "none");
            if (oculto) {
                if (elem.type === "checkbox") {
                    elem.checked = false;
                } else {
                    elem.value = "";
                }
            }
        });
    }


    function aplicarReglasDeVisibilidad() {
        resetLabels();
        Object.values(campos).forEach(el => setVisible(el, false));
        if (!norm) {
            Object.values(campos).forEach(el => setVisible(el, true));
            return;
        }

        const match = (list) => list.some(w => norm.includes(w));


        if (match(["billetera", "wallet", "portatarjeta", "porta tarjeta", "tarjetero", "monedero", "portamonedas", "porta monedas"])) {
            setVisible(campos.cierre, true);
            setVisible(campos.genero, true);
            setVisible(campos.alto, true);
            setVisible(campos.ancho, true);
            setVisible(campos.prof, true);
            setVisible(campos.peso, true);
            return;
        }

        if (match(["cartera", "bandolera", "sobre", "bolso", "fichero", "rinonera", "necesser", "mochila", "morral", "bag", "minibag", "mini bag", "mini-bag", "caja porta joyas", "cajaportajoyas", "neceser", "gondola", "backpack", "tote", "clutch", "sobre", "maletín", "maletin", "portafolio", "portanotebook"])) {
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
            setVisible(campos.fuelle, true);
            return;
        }

        if (match(["abanico", "aplique", "tiara", "corona", "cinto", "cinta", "correa", "cenidor", "vincha", "diadema", "headband", "pin", "broche", "pasador", "hebilla", "clip pelo", "accesorio pelo", "tocado"])) {
            setVisible(campos.genero, true);
            setVisible(campos.alto, true);
            setVisible(campos.ancho, true);
            setVisible(campos.peso, true);
            return;
        }


        if (match(["collar", "cadena", "pulsera", "pandora", "brazalete", "tobillera", "gargantilla", "choker", "necklace", "bracelet", "chain", "enklet", "anklet"])) {
            renameLabel(campos.alto, isView ? "Largo" : "Largo (cm)");
            renameLabel(campos.ancho, isView ? "Grosor" : "Grosor (mm)");
            setVisible(campos.genero, true);
            setVisible(campos.alto, true);
            setVisible(campos.ancho, true);
            setVisible(campos.peso, true);
            return;
        }


        if (match(["aro", "earring", "pendiente", "arete", "earing", "dormilon", "dormilón", "tuerca", "stick", "clip oreja"])) {
            setVisible(campos.genero, true);
            setVisible(campos.alto, true);
            setVisible(campos.ancho, true);
            setVisible(campos.peso, true);
            renameLabel(campoStock, "Stock por par");
            renameLabel(campos.peso, isView ? "Peso total" : "Peso total (g)");
            return;
        }

        if (match([
            "piercing", "expansor", "espansor",
            "helix", "clapton", "nostril", "earcuff", "cuff", "ear-cuff",
            "argolla", "septum", "bull", "industrial", "flecha"
        ])) {
            setVisible(campos.genero, true);
            setVisible(campos.alto, true);
            setVisible(campos.ancho, true);
            setVisible(campos.peso, true);
            renameLabel(campoStock, "Stock por unidad");
            renameLabel(campos.peso, isView ? "Peso total" : "Peso total (g)");
            return;
        }

        if (match(["chalina", "bufanda", "cuello", "chales", "chale", "cuellito", "saco", "tapado", "pashmina", "bufandon", "maxi bufanda", "megabufanda", "estola", "chal", "mantón", "manton", "foulard", "scarf", "pañuelo", "infinity scarf"])) {
            setVisible(campos.genero, true);
            setVisible(campos.ancho, true);
            setVisible(campos.alto, true);
            setVisible(campos.peso, true);
            return;
        }

        if (match(["almohada", "almohadilla", "almohadin", "candado", "cerrojo", "lock", "cadeado", "candadito", "seguro valija", "pillow", "cushion"])) {
            setVisible(campos.alto, true);
            setVisible(campos.ancho, true);
            setVisible(campos.prof, true);
            setVisible(campos.peso, true);
            setVisible(campos.genero, true);
            return;
        }

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

        if (match(["bomba", "bomba vacio", "bomba vacío", "bomba al vacio", "bomba de vacio", "bomba de vacío", "bomba manual", "bomba electrica", "bomba eléctrica", "bomba de vacío eléctrica", "aspiradora ropa", "compresor"])) {
            setVisible(campos.alto, true);
            setVisible(campos.ancho, true);
            setVisible(campos.prof, true);
            setVisible(campos.peso, true);
            return;
        }

        if (match(["vacio", "vacío", "bolsa vacio", "bolsa vacío", "bolsas vacio", "bolsas vacío"])) {
            setVisible(campos.medidas, true);
            setVisible(campos.peso, true);
            renameLabel(campoStock, "Stock por unidad");
            renameLabel(campos.peso, isView ? "Peso total" : "Peso total (g)");
            return;
        }
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

        if (match(["dije circular", "dije redondo", "medallon", "medallón", "colgante redondo", "pendant redondo", "moneda colgante"])) {
            setVisible(campos.genero, true);
            setVisible(campos.diametro, true);
            setVisible(campos.peso, true);
            renameLabel(campos.diametro, isView ? "Diámetro total" : "Diámetro total (mm)");
            return;
        }

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

    aplicarReglasDeVisibilidad();
    if (modo !== "edit") {
        limpiarCamposOcultos();
    }
}

function keepAliveRender() {
    fetch("https://delicata-eleganza.onrender.com/api/Productos?limit=1", {
        method: "GET",
        cache: "no-store"
    }).catch(() => { });
}
setInterval(keepAliveRender, 10 * 60 * 1000);

window.addEventListener("load", () => {
    requestAnimationFrame(() => {
        document.body.classList.add("page-ready");
    });
});