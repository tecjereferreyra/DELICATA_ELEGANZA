document.addEventListener("DOMContentLoaded", () => {
    const rol = localStorage.getItem("rolDelicata");
    if (rol !== "Administrador") {
        window.location.href = "/index.html";
        return;
    }
    cargarDashboard();
});

async function cargarDashboard() {
    const contenedor = document.getElementById("dashboardContenido");
    if (!contenedor) return;
    contenedor.innerHTML = '<p class="dashboard-cargando">Cargando indicadores…</p>';

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
        <div class="dashboard-card"><span class="valor">${data.totalProductos ?? 0}</span><span class="etiqueta">Productos totales</span></div>
        <div class="dashboard-card"><span class="valor">${data.sinStock ?? 0}</span><span class="etiqueta">Sin stock</span></div>
        <div class="dashboard-card"><span class="valor">${data.stockBajo ?? 0}</span><span class="etiqueta">Stock bajo (&lt;6)</span></div>
        <div class="dashboard-card"><span class="valor">${data.sinImagen ?? 0}</span><span class="etiqueta">Sin imagen</span></div>
        <div class="dashboard-card"><span class="valor">${data.usuariosUltimos30d ?? 0}</span><span class="etiqueta">Usuarios nuevos (30d)</span></div>
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

document.addEventListener("click", (e) => {
    const boton = e.target.closest(".dashboard-ver-todas");
    if (!boton) return;
    const card = boton.closest(".dashboard-lista");
    card?.querySelectorAll("li").forEach(li => li.style.display = "");
    boton.remove();
});