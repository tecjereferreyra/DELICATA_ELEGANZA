
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
                const timer = setTimeout(() => controller.abort(), 60000);
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
                localStorage.setItem("tokenDelicata", data.token || "");
                localStorage.setItem("rolDelicata", data.rol || "Usuario");
                if (typeof restaurarCarritoUsuario === "function") {
                    restaurarCarritoUsuario(correoMostrar);
                }
                mostrarToast("Inicio de sesión con éxito ✨", "success");
                setTimeout(() => {
                    userModal.style.display = "none";
                    unlockScroll();
                }, 700);
                verificarUsuarioAutorizado();
                document.getElementById("contenedor-productos")?.replaceChildren();
                aplicarFiltros();
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
                document.getElementById("contenedor-productos")?.replaceChildren();
                aplicarFiltros();
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