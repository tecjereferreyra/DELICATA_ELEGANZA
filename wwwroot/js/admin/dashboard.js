document.addEventListener("DOMContentLoaded", () => {
    const rol = localStorage.getItem("rolDelicata");
    if (rol !== "Administrador") {
        window.location.href = "/index.html";
        return;
    }
    cargarDashboard();
    cargarUsuarios();
});

const USUARIOS_URL_ADMIN = "https://delicata-eleganza.onrender.com/api/Usuarios";

async function cargarDashboard() {
    const contenedor = document.getElementById("dashboardContenido");
    if (!contenedor) return;
    contenedor.innerHTML = `
    <div class="dashboard-card skeleton-card"></div>
    <div class="dashboard-card skeleton-card"></div>
    <div class="dashboard-card skeleton-card"></div>
    <div class="dashboard-card skeleton-card"></div>
    <div class="dashboard-card skeleton-card"></div>
    <div class="dashboard-card skeleton-lista"></div>
`;

    try {
        const resp = await fetch(`${DASHBOARD_URL}/resumen`, {
            headers: { "Authorization": `Bearer ${localStorage.getItem("tokenDelicata")}` }
        });

        if (resp.status === 401 || resp.status === 403) {
            contenedor.innerHTML = '<p class="dashboard-cargando">No tenés permisos para ver este panel.</p>';
            return;
        }
        if (!resp.ok) throw new Error("Respuesta no OK");

        const data = await resp.json();

        contenedor.innerHTML = `
        <div class="dashboard-card acento-neutro"><i class="fa-solid fa-box"></i><span class="valor">${data.totalProductos ?? 0}</span><span class="etiqueta">Productos totales</span></div>
        <a href="/index.html?filtroAdmin=sinStock" class="dashboard-card acento-alerta"><i class="fa-solid fa-triangle-exclamation"></i><span class="valor">${data.sinStock ?? 0}</span><span class="etiqueta">Sin stock</span></a>
        <a href="/index.html?filtroAdmin=stockBajo" class="dashboard-card acento-advertencia"><i class="fa-solid fa-layer-group"></i><span class="valor">${data.stockBajo ?? 0}</span><span class="etiqueta">Stock bajo (&lt;6)</span></a>
        <div class="dashboard-card acento-positivo"><i class="fa-solid fa-user-plus"></i><span class="valor">${data.usuariosUltimos30d ?? 0}</span><span class="etiqueta">Usuarios nuevos (30d)</span></div>
        ${renderListaDashboard("Productos por categoría", data.porCategoria)}
        ${renderListaDashboard("Productos por marca", data.porMarca, 8)}
    `;
    } catch (err) {
        console.error("Error cargando dashboard:", err);
        contenedor.innerHTML = '<p class="dashboard-cargando">No se pudo cargar el panel. Probá de nuevo.</p>';
    }
}

function renderListaDashboard(titulo, items, limite = null) {
    if (!items || !items.length) return "";
    const total = items.length;
    const expandible = limite && total > limite;

    const filas = items.map((it, idx) => {
        const oculto = expandible && idx >= limite ? ' style="display:none"' : '';
        return `<li${oculto}><span>${it.nombre}</span><strong>${it.cantidad}</strong></li>`;
    }).join("");

    const boton = expandible
        ? `<button type="button" class="dashboard-ver-todas">Ver todas (${total})</button>`
        : "";

    return `
    <div class="dashboard-card dashboard-lista">
        <span class="etiqueta-titulo">${titulo}</span>
        <ul>${filas}</ul>
        ${boton}
    </div>
`;
}

async function cargarUsuarios() {
    const contenedor = document.getElementById("usuariosContenido");
    if (!contenedor) return;
    contenedor.innerHTML = `
    <div class="skeleton-row"></div>
    <div class="skeleton-row"></div>
    <div class="skeleton-row"></div>
    <div class="skeleton-row"></div>
`;

    try {
        const resp = await fetch(USUARIOS_URL_ADMIN, {
            headers: { "Authorization": `Bearer ${localStorage.getItem("tokenDelicata")}` }
        });
        if (!resp.ok) throw new Error("Respuesta no OK");
        const usuarios = await resp.json();

        if (!usuarios.length) {
            contenedor.innerHTML = '<p class="dashboard-cargando">No hay usuarios registrados.</p>';
            return;
        }

        const filas = usuarios.map(u => {
            const esAdmin = u.rol === "Administrador";
            return `
            <tr data-id="${u.idUsuario}">
                <td>${u.userName || "—"}</td>
                <td>${u.email || "—"}</td>
                <td><span class="badge-rol ${esAdmin ? "admin" : ""}">${u.rol}</span></td>
                <td>
                    <button type="button" class="btn-toggle-rol" data-rol-actual="${u.rol}">
                        ${esAdmin ? "Quitar admin" : "Hacer admin"}
                    </button>
                </td>
            </tr>`;
        }).join("");

        contenedor.innerHTML = `
        <table class="tabla-usuarios">
            <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Acción</th></tr></thead>
            <tbody>${filas}</tbody>
        </table>`;
    } catch (err) {
        console.error("Error cargando usuarios:", err);
        contenedor.innerHTML = '<p class="dashboard-cargando">No se pudo cargar la lista de usuarios.</p>';
    }
}

document.addEventListener("click", async (e) => {
    const botonVerTodas = e.target.closest(".dashboard-ver-todas");
    if (botonVerTodas) {
        const card = botonVerTodas.closest(".dashboard-lista");
        card?.querySelectorAll("li").forEach(li => li.style.display = "");
        botonVerTodas.remove();
        return;
    }

    const btnRol = e.target.closest(".btn-toggle-rol");
    if (btnRol) {
        const fila = btnRol.closest("tr");
        const id = fila?.dataset.id;
        const rolActual = btnRol.dataset.rolActual;
        const nuevoRol = rolActual === "Administrador" ? "Usuario" : "Administrador";

        if (!confirm(`¿Cambiar el rol a "${nuevoRol}"?`)) return;

        btnRol.disabled = true;
        btnRol.textContent = "Guardando...";

        try {
            const resp = await fetch(`${USUARIOS_URL_ADMIN}/${id}/rol`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("tokenDelicata")}`
                },
                body: JSON.stringify({ Rol: nuevoRol })
            });
            if (!resp.ok) throw new Error("No se pudo actualizar");
            cargarUsuarios();
        } catch (err) {
            console.error(err);
            alert("No se pudo actualizar el rol. Intentá de nuevo.");
            btnRol.disabled = false;
            btnRol.textContent = rolActual === "Administrador" ? "Quitar admin" : "Hacer admin";
        }
    }
});