
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


    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta?.dataset.original) {
        const metaOriginal = viewportMeta.cloneNode(true);
        metaOriginal.setAttribute("content", viewportMeta.dataset.original);
        delete metaOriginal.dataset.original;
        viewportMeta.parentNode.replaceChild(metaOriginal, viewportMeta);
    }

    requestAnimationFrame(() => {
        modal.classList.add("show");
        initZoom();
        initZoomTouch();
    });
}
(function () {
    const TOTAL = 3;
    const DELAY = 5000;
    let current = 0;
    let timer = null;
    let startX = 0;
    let isDragging = false;
    const track = document.getElementById('vidreiraTrack');
    const dotsContainer = document.getElementById('vidrieraDots');
    const carousel = track?.closest('.vidriera-carousel');
    if (!track || !dotsContainer) return;

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

    carousel.querySelector('.vidriera-prev').addEventListener('click', () => { stopAuto(); prev(); startAuto(); });
    carousel.querySelector('.vidriera-next').addEventListener('click', () => { stopAuto(); next(); startAuto(); });

    carousel.addEventListener('mouseenter', stopAuto);
    carousel.addEventListener('mouseleave', startAuto);

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
let carruselActual = 0;
function renderCarrusel(imagenes, altTexto, esParcial = false) {
    const wrapper = document.getElementById("carruselWrapper");
    const dots = document.getElementById("carruselDots");
    const btnPrev = document.getElementById("carruselPrev");
    const btnNext = document.getElementById("carruselNext");
    if (!wrapper) return;
    const soloUna = imagenes.length <= 1;
    if (esParcial) {
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

    btnPrev?.style.removeProperty('visibility');
    btnNext?.style.removeProperty('visibility');
    if (dots) dots.style.visibility = '';
    btnPrev?.classList.toggle("oculto", soloUna);
    btnNext?.classList.toggle("oculto", soloUna);
    if (dots) dots.style.display = soloUna ? "none" : "";
}

function completarCarrusel(imagenes, altTexto) {
    const wrapper = document.getElementById("carruselWrapper");
    const dots = document.getElementById("carruselDots");
    const btnPrev = document.getElementById("carruselPrev");
    const btnNext = document.getElementById("carruselNext");
    if (!wrapper) return;
    const soloUna = imagenes.length <= 1;

    const primerImg = wrapper.querySelector(".carrusel-slide:first-child img");
    if (primerImg && imagenes[0]) {
        const urlNueva = new URL(imagenes[0], location.href).href;
        if (primerImg.src !== urlNueva) primerImg.src = imagenes[0];
    }

    wrapper.querySelectorAll(".carrusel-slide").forEach((slide, i) => {
        if (i > 0) slide.remove();
    });

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
let _zoomState = { scale: 1, x: 0, y: 0 };
function resetZoomCarrusel() {
    _zoomState.scale = 1; _zoomState.x = 0; _zoomState.y = 0;
    const imgContainer = document.querySelector(".modal-img-container");
    imgContainer?._resetZoomTouch?.();
    imgContainer?._resetZoomMouse?.();
    document.querySelectorAll("#carruselWrapper img").forEach(img => {
        img.style.transition = "transform .25s ease";
        img.style.transform = "translate(0px,0px) scale(1)";
    });
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
    _cerrarModalTimeout = null;
    resetZoomCarrusel();
    document.querySelector(".modal-img-container")?._resetZoomTouch?.();
    const imgContainer = modal.querySelector(".modal-img-container");
    if (imgContainer) imgContainer._zoomInit = false;

    // Restaura el viewport original
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta?.dataset.original) {
        const metaOriginal = viewportMeta.cloneNode(true);
        metaOriginal.setAttribute("content", viewportMeta.dataset.original);
        delete metaOriginal.dataset.original;
        viewportMeta.parentNode.replaceChild(metaOriginal, viewportMeta);
    }
}

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

function verificarUsuarioAutorizado() {
    const usuario = localStorage.getItem("correoDelicata");
    esAdminActual = localStorage.getItem("rolDelicata") === "Administrador";
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

    const modalProducto = domCache.modal;
    if (modalProducto && modalProducto.classList.contains("show")) {
        const adminBox = document.getElementById("modalAdminButtons");
        if (adminBox) {
            const esAdmin = localStorage.getItem("rolDelicata") === "Administrador";
            adminBox.style.display = esAdmin ? "flex" : "none";
        }
    }
}