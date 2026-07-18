
(function () {
    "use strict";

    /* ---------- Datos fijos del negocio ---------- */
    const MAPS_URL = "https://maps.app.goo.gl/qqT2RS29RPJqmkZA7";
    const DIRECCION = "25 de Mayo & Jose Mateo Luque — Villa del Rosario, Argentina";
    const WPP_NUMERO = "5493573692940";
    const INSTAGRAM_URL = "https://www.instagram.com/delicataeleganza/";
    const FACEBOOK_URL = "https://www.facebook.com/delicata.eleganza.3";
    const EMAIL = "reflej8@hotmail.com";

    const HORARIOS_TEXTO =
        "Atendemos de lunes a sábado.\n" +
        "Mañana: de 09:00 a 12:30 hs.\n" +
        "Tarde: de 16:00 a 20:30 hs.";

    const STORAGE_KEY = "delicatitaDescubierta";

    /* ---------- Utilidades de texto ---------- */
    function normalizarTexto(t) {
        return (t || "")
            .toString()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
    }

    function contieneAlguna(texto, palabras) {
        return palabras.some(function (p) { return texto.indexOf(p) !== -1; });
    }

    function contarPalabras(texto) {
        return texto.split(/\s+/).filter(Boolean).length;
    }

    /* ---------- Acceso al catálogo cargado por app.js ---------- */
    function getCatalogo() {
        if (typeof window.productosData !== "undefined" && Array.isArray(window.productosData)) {
            return window.productosData;
        }
        try {
            // productosData es una variable global de script clásico (no un módulo),
            // por eso también puede referenciarse directamente si existe en el scope global.
            if (typeof productosData !== "undefined" && Array.isArray(productosData)) return productosData;
        } catch (e) { /* no existe todavía */ }
        return [];
    }

    function listaUnica(campo, excluidos) {
        const set = new Set();
        getCatalogo().forEach(function (p) {
            const valor = p && p[campo];
            if (valor && !excluidos.includes(valor)) set.add(valor);
        });
        return Array.from(set).sort(function (a, b) { return a.localeCompare(b, "es"); });
    }

    function getMarcas() {
        return listaUnica("Marca", ["Sin marca", "—"]);
    }

    function getMateriales() {
        return listaUnica("Material", ["Sin material", "—"]);
    }

    function getCategorias() {
        return listaUnica("Categoria", ["Sin categoría", "—"]);
    }

    /* ---------- Recomendaciones de cuidado (genéricas por categoría) ---------- */
    const CUIDADOS = [
        {
            claves: ["marroquineria", "cuero", "cartera", "carteras", "billetera", "mochila", "bolso"],
            titulo: "Marroquinería y cuero",
            texto:
                "Guardá la pieza en un lugar seco, lejos de la humedad y del sol directo.\n" +
                "Limpiala con un paño suave y seco; evitá productos abrasivos.\n" +
                "Hidratá el cuero de tanto en tanto con productos específicos para prolongar su vida útil.\n" +
                "Evitá sobrecargar bolsillos y compartimentos para no deformar la pieza."
        },
        {
            claves: ["bijouterie", "bijou", "aro", "aros", "collar", "collares", "pulsera", "dije", "cadena"],
            titulo: "Bijouterie y accesorios",
            texto:
                "Evitá el contacto directo con perfumes, cremas y agua.\n" +
                "Guardalas por separado, en una bolsita o compartimento, para que no se rayen entre sí.\n" +
                "Secá bien la piel antes de colocarlas si hiciste actividad física.\n" +
                "Quitátelas antes de dormir o bañarte para conservar el brillo."
        },
        {
            claves: ["viaje", "valija", "valijas", "neceser"],
            titulo: "Artículos de viaje",
            texto:
                "Evitá superar el peso máximo indicado para la valija.\n" +
                "Revisá cierres, ruedas y manijas antes de cada viaje.\n" +
                "Guardala en un lugar ventilado, no dentro de bolsas cerradas herméticamente."
        },
        {
            claves: ["pashmina", "pañoleria", "bufanda", "chalina"],
            titulo: "Pashminas y pañuelos",
            texto:
                "Preferí el lavado a mano o en seco, según la etiqueta de la prenda.\n" +
                "Evitá planchar directamente sobre la fibra; usá un paño intermedio si hace falta.\n" +
                "Guardalos doblados, no colgados, para que no se deformen."
        },
        {
            claves: ["piercing"],
            titulo: "Piercings",
            texto:
                "Mantené la zona siempre limpia con los productos indicados durante la cicatrización.\n" +
                "Evitá manipular la joya con las manos sucias.\n" +
                "Ante cualquier molestia o enrojecimiento prolongado, consultá a un profesional."
        },
        {
            claves: ["fiesta"],
            titulo: "Accesorios de fiesta",
            texto:
                "Guardalos en su bolsa o funda después de cada uso, para conservar el brillo y la forma.\n" +
                "Evitá el contacto con perfumes y aerosoles."
        },
        {
            claves: ["complemento", "complementos"],
            titulo: "Complementos",
            texto:
                "Revisá siempre la etiqueta de cada pieza antes de lavarla.\n" +
                "Guardalos doblados, en un lugar seco y ventilado."
        }
    ];

    function respuestaCuidados(texto) {
        for (let i = 0; i < CUIDADOS.length; i++) {
            const grupo = CUIDADOS[i];
            const coincide = grupo.claves.some(function (c) { return texto.indexOf(normalizarTexto(c)) !== -1; });
            if (coincide) return grupo.titulo + ":\n" + grupo.texto;
        }
        const indice = CUIDADOS.map(function (g) { return "• " + g.titulo; }).join("\n");
        return "Tengo recomendaciones de cuidado para estas categorías:\n" + indice +
            "\n\nContame sobre cuál te gustaría conocer las recomendaciones.";
    }

    /* ---------- Búsqueda de productos en el catálogo ---------- */
    function camposBusqueda(p) {
        return normalizarTexto([p.Nombre, p.Marca, p.Categoria, p.Tipo, p.Color, p.Material, p.Modelo].join(" "));
    }

    function buscarProductos(texto) {
        const catalogo = getCatalogo();
        if (!catalogo.length) return [];

        const tokens = normalizarTexto(texto).split(/\s+/).filter(function (t) { return t.length > 2; });
        if (!tokens.length) return [];

        const conPuntaje = catalogo
            .map(function (p) {
                const campo = camposBusqueda(p);
                const puntaje = tokens.reduce(function (acc, t) { return acc + (campo.indexOf(t) !== -1 ? 1 : 0); }, 0);
                return { p: p, puntaje: puntaje };
            })
            .filter(function (r) { return r.puntaje > 0; })
            .sort(function (a, b) { return b.puntaje - a.puntaje; });

        return conPuntaje.slice(0, 3).map(function (r) { return r.p; });
    }

    /* ---------- Construcción de la UI ---------- */
    let panelEl, mensajesEl, inputEl, botonEl, chipsEl;
    let chatIniciado = false;

    function crearElementos() {
        // Botón flotante
        botonEl = document.createElement("button");
        botonEl.id = "btnDelicatita";
        botonEl.className = "btn-delicatita-flotante";
        botonEl.type = "button";
        botonEl.setAttribute("aria-label", "Hablar con Delicatita, asistente virtual");
        botonEl.innerHTML =
            '<i class="fa-solid fa-comment-dots" aria-hidden="true"></i>' +
            '<span class="punto-nuevo" id="delicatitaPuntoNuevo"></span>';
        document.body.appendChild(botonEl);

        // Panel de chat
        panelEl = document.createElement("div");
        panelEl.className = "delicatita-panel";
        panelEl.setAttribute("role", "dialog");
        panelEl.setAttribute("aria-label", "Chat con Delicatita");
        panelEl.innerHTML =
            '<div class="delicatita-header">' +
            '  <div class="delicatita-avatar">DE</div>' +
            '  <div class="delicatita-header-texto">' +
            '    <strong>Delicatita</strong>' +
            '    <span>Asistente virtual de Delicata Eleganza</span>' +
            '  </div>' +
            '  <button type="button" class="delicatita-cerrar" aria-label="Cerrar chat">' +
            '    <i class="fa-solid fa-xmark"></i>' +
            '  </button>' +
            '</div>' +
            '<div class="delicatita-mensajes" id="delicatitaMensajes"></div>' +
            '<div class="delicatita-chips" id="delicatitaChips"></div>' +
            '<div class="delicatita-input-row">' +
            '  <input type="text" id="delicatitaInput" placeholder="Escribí tu consulta..." autocomplete="off">' +
            '  <button type="button" id="delicatitaEnviar" aria-label="Enviar">' +
            '    <i class="fa-solid fa-paper-plane"></i>' +
            '  </button>' +
            '</div>';
        document.body.appendChild(panelEl);

        mensajesEl = document.getElementById("delicatitaMensajes");
        inputEl = document.getElementById("delicatitaInput");
        chipsEl = document.getElementById("delicatitaChips");
    }

    function scrollAbajo() {
        mensajesEl.scrollTop = mensajesEl.scrollHeight;
    }

    function agregarMensajeTexto(texto, quien) {
        const div = document.createElement("div");
        div.className = "delicatita-msg " + quien;
        div.textContent = texto;
        mensajesEl.appendChild(div);
        scrollAbajo();
    }

    function agregarAccion(etiqueta, icono, url) {
        const a = document.createElement("a");
        a.className = "delicatita-accion";
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.innerHTML = '<i class="' + icono + '" aria-hidden="true"></i> ' + etiqueta;
        mensajesEl.appendChild(a);
        scrollAbajo();
    }

    function agregarTarjetaProducto(p) {
        const div = document.createElement("div");
        div.className = "delicatita-msg-producto";

        const filas = [
            ["Marca", p.Marca],
            ["Categoría", p.Categoria],
            ["Material", p.Material],
            ["Color", p.Color]
        ].filter(function (f) { return f[1] && f[1] !== "—"; });

        const stockTexto = p.Stock > 0 ? "En stock" : "Sin stock por el momento";

        div.innerHTML =
            '<img src="' + (p.ImagenUrl || "/ImagenUrl/default.jpg") + '" alt="' + (p.Nombre || "Producto") + '" loading="lazy">' +
            '<div class="cuerpo">' +
            '  <strong>' + (p.Nombre || "Producto") + '</strong>' +
            '  <ul>' +
            filas.map(function (f) { return "<li><span>" + f[0] + "</span><span>" + f[1] + "</span></li>"; }).join("") +
            '    <li><span>Disponibilidad</span><span>' + stockTexto + '</span></li>' +
            '  </ul>' +
            '</div>';

        mensajesEl.appendChild(div);

        // Botón para abrir la ficha completa si la función ya existe en app.js
        if (typeof window.abrirModal === "function") {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "delicatita-accion";
            btn.style.marginTop = "-.3rem";
            btn.innerHTML = '<i class="fa-solid fa-eye"></i> Ver ficha completa';
            btn.addEventListener("click", function () {
                window.abrirModal(p);
                cerrarPanel();
            });
            mensajesEl.appendChild(btn);
        }

        scrollAbajo();
    }

    function mostrarEscribiendo() {
        const div = document.createElement("div");
        div.className = "delicatita-typing";
        div.id = "delicatitaTyping";
        div.innerHTML = "<span></span><span></span><span></span>";
        mensajesEl.appendChild(div);
        scrollAbajo();
        return div;
    }

    function ocultarEscribiendo(el) {
        el && el.remove();
    }

    /* ---------- Chips de sugerencias rápidas ---------- */
    const SUGERENCIAS = [
        "Horarios", "Ubicación", "Marcas", "Materiales", "Redes sociales", "Recomendaciones de cuidado"
    ];

    function renderChips() {
        chipsEl.innerHTML = "";
        SUGERENCIAS.forEach(function (texto) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "delicatita-chip";
            btn.textContent = texto;
            btn.addEventListener("click", function () { procesarConsulta(texto); });
            chipsEl.appendChild(btn);
        });
    }

    /* ---------- Motor de respuestas (reglas por palabras clave) ---------- */
    function generarRespuesta(textoOriginal) {
        const t = normalizarTexto(textoOriginal);
        const nPalabras = contarPalabras(t);

        // Despedida
        if (nPalabras <= 4 && contieneAlguna(t, ["gracias", "chau", "adios", "hasta luego", "nos vemos"])) {
            return { texto: "Gracias por escribirnos. Que tengas un excelente día." };
        }

        // Horarios
        if (contieneAlguna(t, ["horario", "hora", "abren", "cierran", "atienden", "dias de atencion", "cuando abren"])) {
            return { texto: HORARIOS_TEXTO };
        }

        // Ubicación
        if (contieneAlguna(t, ["donde", "ubicacion", "direccion", "local", "como llegar", "mapa"])) {
            return {
                texto: "Nos encontramos en " + DIRECCION + ".",
                accion: { etiqueta: "Cómo llegar en Google Maps", icono: "fa-solid fa-location-dot", url: MAPS_URL }
            };
        }

        // Redes sociales / contacto
        if (contieneAlguna(t, ["instagram", "facebook", "redes", "whatsapp", "contacto", "mail", "correo"])) {
            return {
                texto: "Podés encontrarnos también en:",
                acciones: [
                    { etiqueta: "Instagram", icono: "fa-brands fa-instagram", url: INSTAGRAM_URL },
                    { etiqueta: "Facebook", icono: "fa-brands fa-facebook", url: FACEBOOK_URL },
                    { etiqueta: "WhatsApp", icono: "fa-brands fa-whatsapp", url: "https://wa.me/" + WPP_NUMERO },
                    { etiqueta: "Enviar un correo", icono: "fa-solid fa-envelope", url: "mailto:" + EMAIL }
                ]
            };
        }

        // Marcas
        if (contieneAlguna(t, ["marca", "marcas"])) {
            const marcas = getMarcas();
            if (!marcas.length) return { texto: "Estoy terminando de cargar el catálogo. Probá de nuevo en unos segundos." };
            return { texto: "Trabajamos, entre otras, con estas marcas:\n" + marcas.join(", ") + "." };
        }

        // Materiales
        if (contieneAlguna(t, ["material", "materiales"])) {
            const materiales = getMateriales();
            if (!materiales.length) return { texto: "Estoy terminando de cargar el catálogo. Probá de nuevo en unos segundos." };
            return { texto: "Trabajamos con estos materiales:\n" + materiales.join(", ") + "." };
        }

        // Qué productos / categorías se venden
        if (contieneAlguna(t, ["que venden", "que productos", "catalogo", "categoria", "categorias", "que tienen", "que hay"])) {
            const categorias = getCategorias();
            if (!categorias.length) return { texto: "Estoy terminando de cargar el catálogo. Probá de nuevo en unos segundos." };
            return { texto: "Nuestras categorías de productos son:\n" + categorias.join(", ") + "." };
        }

        // Recomendaciones / cuidados de uso
        if (contieneAlguna(t, ["cuidado", "cuidar", "mantenimiento", "limpiar", "conservar", "recomendacion", "como cuido"])) {
            return { texto: respuestaCuidados(t) };
        }

        // Ayuda / qué podés hacer
        if (contieneAlguna(t, ["ayuda", "que podes hacer", "que sabes hacer", "menu"])) {
            return {
                texto: "Puedo ayudarte con:\n" +
                    "• Horarios y días de atención\n" +
                    "• Ubicación del local\n" +
                    "• Marcas y materiales que trabajamos\n" +
                    "• Recomendaciones de cuidado por tipo de producto\n" +
                    "• Datos de un producto puntual del catálogo\n" +
                    "• Nuestras redes sociales\n\n" +
                    "También podés tocar una de las sugerencias de abajo."
            };
        }

        // Saludo (solo si el mensaje es corto, para no tapar preguntas más largas)
        if (nPalabras <= 3 && contieneAlguna(t, ["hola", "buenas", "buen dia", "buenos dias", "buenas tardes", "buenas noches"])) {
            return {
                texto: "¡Hola! Soy Delicatita, el asistente virtual de Delicata Eleganza. " +
                    "Puedo ayudarte con horarios, ubicación, marcas, materiales, recomendaciones de cuidado " +
                    "y datos sobre nuestros productos. ¿En qué puedo ayudarte?"
            };
        }

        // Búsqueda de producto puntual en el catálogo
        const resultados = buscarProductos(textoOriginal);
        if (resultados.length) {
            return { productos: resultados };
        }

        // Fallback
        return {
            texto: "No logré identificar tu consulta. Puedo ayudarte con horarios, ubicación, redes sociales, " +
                "marcas, materiales, recomendaciones de cuidado o información de un producto puntual. " +
                "¿Podrías reformular tu pregunta?"
        };
    }

    function procesarConsulta(texto) {
        const limpio = (texto || "").trim();
        if (!limpio) return;

        agregarMensajeTexto(limpio, "usuario");
        inputEl.value = "";

        const escribiendoEl = mostrarEscribiendo();

        setTimeout(function () {
            ocultarEscribiendo(escribiendoEl);
            const respuesta = generarRespuesta(limpio);

            if (respuesta.productos) {
                agregarMensajeTexto(
                    respuesta.productos.length === 1
                        ? "Encontré este producto en el catálogo:"
                        : "Encontré estos productos en el catálogo:",
                    "bot"
                );
                respuesta.productos.forEach(agregarTarjetaProducto);
                return;
            }

            agregarMensajeTexto(respuesta.texto, "bot");

            if (respuesta.accion) {
                agregarAccion(respuesta.accion.etiqueta, respuesta.accion.icono, respuesta.accion.url);
            }
            if (respuesta.acciones) {
                respuesta.acciones.forEach(function (a) { agregarAccion(a.etiqueta, a.icono, a.url); });
            }
        }, 450);
    }

    /* ---------- Apertura / cierre del panel ---------- */
    function abrirPanel() {
        panelEl.classList.add("abierto");
        if (!chatIniciado) {
            chatIniciado = true;
            renderChips();
            agregarMensajeTexto(
                "¡Hola! Soy Delicatita, el asistente virtual de Delicata Eleganza. " +
                "Puedo contarte sobre horarios, ubicación, marcas, materiales, recomendaciones de cuidado " +
                "y productos del catálogo. ¿En qué puedo ayudarte?",
                "bot"
            );
        }
        setTimeout(function () { inputEl.focus(); }, 250);
    }

    function cerrarPanel() {
        panelEl.classList.remove("abierto");
    }

    /* ---------- Revelar el botón al usar "Ver novedades" ---------- */
    function revelarBoton() {
        botonEl.classList.add("visible");
        try { localStorage.setItem(STORAGE_KEY, "1"); } catch (e) { /* almacenamiento no disponible */ }
    }

    /* ---------- Inicialización ---------- */
    document.addEventListener("DOMContentLoaded", function () {
        if (!document.getElementById("toggleNuevos")) return; // esta página no tiene catálogo (ej: carrito.html)

        crearElementos();

        botonEl.addEventListener("click", function () {
            if (panelEl.classList.contains("abierto")) cerrarPanel();
            else abrirPanel();
        });
        panelEl.querySelector(".delicatita-cerrar").addEventListener("click", cerrarPanel);

        document.getElementById("delicatitaEnviar").addEventListener("click", function () {
            procesarConsulta(inputEl.value);
        });
        inputEl.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                e.preventDefault();
                procesarConsulta(inputEl.value);
            }
        });

        // Si el usuario ya la había descubierto antes, mostrarla directamente
        try {
            if (localStorage.getItem(STORAGE_KEY) === "1") revelarBoton();
        } catch (e) { /* almacenamiento no disponible */ }

        // Se revela (si todavía no lo estaba) al tocar "Ver novedades"
        document.getElementById("toggleNuevos").addEventListener("click", revelarBoton);
    });
})();