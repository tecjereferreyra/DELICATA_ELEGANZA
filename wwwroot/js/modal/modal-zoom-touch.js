
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
        img.style.transition = "none";
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

    modalImgContainer._resetZoomMouse = function () {
        if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
        isZoomActive = false;
        currentScale = 1; targetScale = 1;
        currentX = 50; currentY = 50; targetX = 50; targetY = 50;
        cachedRect = null;
        const img = getActiveImg();
        if (img) { img.style.transform = "scale(1)"; img.style.transformOrigin = "center"; }
    };

}
function initZoomTouch() {
    const modalImgContainer = document.querySelector(".modal-img-container");
    if (!modalImgContainer || !esTouchDevice) return;
    if (modalImgContainer._zoomTouchInit) return;
    modalImgContainer._zoomTouchInit = true;

    const MAX_SCALE = 3;
    const EASE = 0.22;

    let scale = 1, targetScale = 1;
    let tx = 0, ty = 0, targetTx = 0, targetTy = 0;
    let animId = null;
    let rect = null;
    let startDist = 0, startScale = 1;
    let isPanning = false;
    let panStartX = 0, panStartY = 0;
    let lastTap = 0;
    let lastImg = null;
    let touchStartTime = 0;
    let touchStartX = 0, touchStartY = 0;
    let usedTwoFingers = false;

    const pointers = new Map();


    function getActiveImg() {
        return modalImgContainer.querySelector(".carrusel-slide.active img")
            || modalImgContainer.querySelector("img");
    }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
    function midpoint(a, b) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }
    function puntosActivos() { return Array.from(pointers.values()); }

    function clampXY(x, y, s) {
        const maxX = (rect.width * (s - 1)) / 2;
        const maxY = (rect.height * (s - 1)) / 2;
        return [Math.max(-maxX, Math.min(maxX, x)), Math.max(-maxY, Math.min(maxY, y))];
    }

    function apply() {
        const img = getActiveImg();
        if (img) {
            img.style.transition = "none";
            img.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${scale.toFixed(3)})`;
        }
    }

    function loop() {
        const img = getActiveImg();
        if (!img) { animId = null; return; }
        scale = lerp(scale, targetScale, EASE);
        tx = lerp(tx, targetTx, EASE);
        ty = lerp(ty, targetTy, EASE);
        apply();

        const done = Math.abs(scale - targetScale) < 0.003
            && Math.abs(tx - targetTx) < 0.05
            && Math.abs(ty - targetTy) < 0.05;

        if (done) {
            scale = targetScale; tx = targetTx; ty = targetTy;
            apply();
            animId = null;
            return;
        }
        animId = requestAnimationFrame(loop);
    }
    function ensureLoop() { if (!animId) animId = requestAnimationFrame(loop); }

    function resetZoom() {
        targetScale = 1; targetTx = 0; targetTy = 0;
        ensureLoop();
    }

    function resetZoomInstant() {
        if (animId) { cancelAnimationFrame(animId); animId = null; }
        scale = targetScale = 1;
        tx = targetTx = 0; ty = targetTy = 0;
        isPanning = false;
        rect = null;
        const img = getActiveImg();
        if (img) {
            img.style.transform = "translate(0px,0px) scale(1)";
            img.style.transformOrigin = "center";
        }
    }

    function toggleZoom(clientX, clientY) {
        const img = getActiveImg();
        if (!img) return;
        if (targetScale > 1.02) {
            targetScale = 1; targetTx = 0; targetTy = 0;
        } else {
            rect = modalImgContainer.getBoundingClientRect();
            const ox = ((clientX - rect.left) / rect.width) * 100;
            const oy = ((clientY - rect.top) / rect.height) * 100;
            img.style.transformOrigin = `${ox}% ${oy}%`;
            targetScale = 2.4;
            targetTx = 0; targetTy = 0;
        }
        ensureLoop();
    }

    function esControl(e) {
        return e.target.closest(".carrusel-btn, .carrusel-dots, .dot");
    }

    modalImgContainer.addEventListener("pointerdown", (e) => {
        if (e.pointerType === "mouse") return;
        if (esControl(e)) return;

        const img = getActiveImg();
        if (img !== lastImg) { resetZoomInstant(); lastImg = img; }
        rect = modalImgContainer.getBoundingClientRect();

        if (animId) { cancelAnimationFrame(animId); animId = null; }

        try { modalImgContainer.setPointerCapture(e.pointerId); } catch (_) { }
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (pointers.size === 2) {
            e.preventDefault();
            usedTwoFingers = true;
            isPanning = false;
            const [a, b] = puntosActivos();
            startDist = dist(a, b);
            startScale = scale;
            const mid = midpoint(a, b);
            if (img) {
                const ox = ((mid.x - rect.left) / rect.width) * 100;
                const oy = ((mid.y - rect.top) / rect.height) * 100;
                img.style.transformOrigin = `${ox}% ${oy}%`;
            }
        } else if (pointers.size === 1) {
            e.preventDefault();
            touchStartTime = Date.now();
            touchStartX = e.clientX;
            touchStartY = e.clientY;
            usedTwoFingers = false;
            if (scale > 1.02) {
                isPanning = true;
                panStartX = e.clientX - tx;
                panStartY = e.clientY - ty;
            }
        }
    }, { passive: false });

    modalImgContainer.addEventListener("pointermove", (e) => {
        if (!pointers.has(e.pointerId)) return;
        if (esControl(e)) return;
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        const img = getActiveImg();
        if (!img) return;

        if (pointers.size === 2) {
            e.preventDefault();
            const [a, b] = puntosActivos();
            const newDist = dist(a, b);
            const factor = startDist > 0 ? (newDist / startDist) : 1;
            scale = targetScale = Math.max(1, Math.min(MAX_SCALE, startScale * factor));

            const mid = midpoint(a, b);
            const ox = ((mid.x - rect.left) / rect.width) * 100;
            const oy = ((mid.y - rect.top) / rect.height) * 100;
            img.style.transformOrigin = `${ox}% ${oy}%`;

            [tx, ty] = clampXY(tx, ty, scale);
            targetTx = tx; targetTy = ty;
            apply();
        } else if (pointers.size === 1) {
            if (!isPanning && scale > 1.02) {
                isPanning = true;
                const [p] = puntosActivos();
                panStartX = p.x - tx;
                panStartY = p.y - ty;
            }
            if (isPanning) {
                e.preventDefault();
                const [p] = puntosActivos();
                let nx = p.x - panStartX;
                let ny = p.y - panStartY;
                [tx, ty] = clampXY(nx, ny, scale);
                targetTx = tx; targetTy = ty;
                apply();
            }
        }
    }, { passive: false });

    function finalizarPuntero(e) {
        if (!pointers.has(e.pointerId)) return;
        pointers.delete(e.pointerId);
        try { modalImgContainer.releasePointerCapture(e.pointerId); } catch (_) { }

        if (pointers.size === 0) {
            isPanning = false;

            if (!usedTwoFingers && touchStartTime) {
                const elapsed = Date.now() - touchStartTime;
                const moved = Math.hypot(e.clientX - touchStartX, e.clientY - touchStartY);
                if (elapsed < 300 && moved < 12) {
                    const now = Date.now();
                    if (now - lastTap < 300) {
                        toggleZoom(touchStartX, touchStartY);
                        lastTap = 0;
                        touchStartTime = 0;
                        return;
                    }
                    lastTap = now;
                }
            }
            touchStartTime = 0;

            if (targetScale < 1.08) resetZoom();
            else ensureLoop();
        } else if (pointers.size === 1) {
            isPanning = false;
        }
    }

    modalImgContainer.addEventListener("pointerup", finalizarPuntero);
    modalImgContainer.addEventListener("pointercancel", finalizarPuntero);

    modalImgContainer._resetZoomTouch = resetZoomInstant;
}
document.addEventListener("DOMContentLoaded", () => {
    verificarUsuarioAutorizado();
    cargarProductos();
    document.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === "Go") {
            const active = document.activeElement;
            const tag = active?.tagName;
            if ((tag === "INPUT" || tag === "TEXTAREA") && !active.closest("form")) {
                active.blur();
            }
        }
    });
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
        const irAlContenedor = () => {
            const contenedor = document.getElementById("contenedor-productos");
            if (!contenedor) return;
            const navbar = document.querySelector("header.navbar");
            const navbarH = navbar ? navbar.getBoundingClientRect().height : 80;
            const y = contenedor.getBoundingClientRect().top + window.pageYOffset - navbarH - 24;
            window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
        };
        if (window.visualViewport) {
            const vv = window.visualViewport;
            let yaEjecuto = false;
            const onResize = () => {
                if (yaEjecuto) return;
                yaEjecuto = true;
                vv.removeEventListener("resize", onResize);
                requestAnimationFrame(irAlContenedor);
            };
            vv.addEventListener("resize", onResize);
            setTimeout(() => {
                if (yaEjecuto) return;
                yaEjecuto = true;
                vv.removeEventListener("resize", onResize);
                irAlContenedor();
            }, 350);
        } else {
            setTimeout(irAlContenedor, 300);
        }
    }
    const busquedaDebounced = debounce(aplicarFiltros, 300);
    if (domCache.searchInput) {
        domCache.searchInput.addEventListener("input", () => {
            desactivarModoNuevos();
            busquedaDebounced();
        });
        domCache.searchInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === "Go") {
                e.preventDefault();
                domCache.searchInput.blur();
                aplicarFiltrosYScroll();
            }
        });
    }
    if (domCache.btnBuscar) domCache.btnBuscar.addEventListener("click", aplicarFiltrosYScroll);
    document.getElementById("toggleNuevos")?.addEventListener("click", function () {
        modoNuevosActivo = !modoNuevosActivo;
        this.classList.toggle("active", modoNuevosActivo);

        const icono = document.getElementById("iconoNuevos");
        if (icono) {
            icono.innerHTML = modoNuevosActivo
                ? '<path d="M20 11H7.83l4.88-4.88a1 1 0 10-1.42-1.41L4.7 11.29a1 1 0 000 1.42l6.59 6.59a1 1 0 001.42-1.42L7.83 13H20a1 1 0 000-2z"></path>'
                : '<path d="M12 5l1.8 5.2L19 12l-5.2 1.8L12 19l-1.8-5.2L5 12l5.2-1.8z"></path>';
        }

        if (modoNuevosActivo) {
            filtroPrevioNuevos = {
                categoria: categoriaActivaActual,
                subcategoria: subcategoriaActivaActual,
                busqueda: domCache.searchInput?.value || ""
            };
            categoriaLinks.forEach(l => l.classList.remove("active-cat"));
            if (domCache.searchInput) domCache.searchInput.value = "";
        } else if (filtroPrevioNuevos) {
            categoriaActivaActual = filtroPrevioNuevos.categoria;
            subcategoriaActivaActual = filtroPrevioNuevos.subcategoria;
            if (domCache.searchInput) domCache.searchInput.value = filtroPrevioNuevos.busqueda;
            const linkPrevio = [...categoriaLinks].find(l =>
                normalizar(l.dataset.cat || "todos") === categoriaActivaActual
            );
            linkPrevio?.classList.add("active-cat");
            filtroPrevioNuevos = null;
        }

        aplicarFiltrosYScroll();
    });
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
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            metaTheme.setAttribute('content', '#111111');
        }
        abierto ? lockScroll() : unlockScroll();
    });
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

    document.querySelectorAll(".mobile-categories .has-sub").forEach(item => {
        const row = item.querySelector(".mobile-cat-row");
        const arrow = item.querySelector(".mobile-arrow");
        const catSpan = row?.querySelector("[data-cat]");
        row?.addEventListener("click", (e) => {
            e.stopPropagation();

            const clickedOnText = e.target === catSpan || catSpan?.contains(e.target);
            const clickedOnArrow = e.target === arrow || arrow?.contains(e.target);
            if (clickedOnText && !clickedOnArrow) {
                const cat = catSpan.dataset.cat;
                if (!cat) return;
                mobileMenu.classList.remove("active");
                hamburger.setAttribute("aria-expanded", false);
                mobileMenu.setAttribute("aria-hidden", true);
                document.body.style.backgroundColor = '';
                categoriaLinks.forEach(l => l.classList.remove('active-cat'));
                categoriaActivaActual = normalizar(cat);
                subcategoriaActivaActual = "";
                desactivarModoNuevos();
                _menuCerradoRecien = true;
                activarBloqueoClick(600);
                unlockScroll();
                aplicarFiltros();
                irAlContenedorProductos();
                setTimeout(() => { _menuCerradoRecien = false; }, 500);
                return;
            }

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
            desactivarModoNuevos();
            _menuCerradoRecien = true;
            activarBloqueoClick(600);
            unlockScroll();
            aplicarFiltros();
            irAlContenedorProductos();
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
                preview.style.display = "block";
                if (wrapPrincipal) wrapPrincipal.style.display = "block";
            };
            reader.readAsDataURL(file);
        });
    }

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
                    wrap.querySelector(".btn-preview-remove").addEventListener("click", () => {
                        window._archivosExtraAgregar[idx] = null;
                        wrap.remove();
                    });
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
            inputImgExtra.value = "";
        });
    }

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
    lockScroll();
    const cerrarLogout = () => {
        modal.remove();
        unlockScroll();
    };
    modal.querySelector(".js-confirm-logout").onclick = () => {
        const correoAlSalir = localStorage.getItem("correoDelicata");
        if (typeof guardarYLimpiarCarritoAlCerrarSesion === "function") {
            guardarYLimpiarCarritoAlCerrarSesion(correoAlSalir);
        }
        localStorage.removeItem("usuarioDelicata");
        localStorage.removeItem("correoDelicata");
        localStorage.removeItem("tokenDelicata");
        localStorage.removeItem("rolDelicata");
        cerrarLogout();
        try {
            verificarUsuarioAutorizado?.();
            document.getElementById("contenedor-productos")?.replaceChildren();
            aplicarFiltros?.();
            mostrarToast?.("Sesión cerrada correctamente", "success");
        } catch (e) {
            console.error(e);
        }
    };
    modal.querySelector(".js-cancel-logout").onclick = cerrarLogout;

    modal.addEventListener("click", e => {
        if (e.target === modal) cerrarLogout();
    });
}

function traducirErrorBackend(texto) {
    if (!texto) return "Error desconocido.";

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