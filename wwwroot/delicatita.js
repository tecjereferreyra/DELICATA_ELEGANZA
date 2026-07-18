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

    // Tipos de producto (campo "Tipo") que existen dentro de una categoría puntual,
    // ej: dentro de "Bijouteria" -> ["Aros", "Collares", "Pulseras", ...]
    function getTiposDeCategoria(categoria) {
        const norm = normalizarTexto(categoria);
        const excluidos = ["sin tipo", "—", "-", ""];
        const set = new Set();
        getCatalogo().forEach(function (p) {
            if (p.Categoria && normalizarTexto(p.Categoria) === norm) {
                const tipo = p.Tipo;
                if (tipo && excluidos.indexOf(normalizarTexto(tipo)) === -1) set.add(tipo);
            }
        });
        return Array.from(set).sort(function (a, b) { return a.localeCompare(b, "es"); });
    }

    // Para "Complementos" usamos la lista curada (COMPLEMENTOS_SUBTIPOS, definida más abajo);
    // para el resto de las categorías, los tipos reales del catálogo.
    function getOpcionesDeCategoria(categoria) {
        const norm = normalizarTexto(categoria);
        if (norm.indexOf("complemento") !== -1) {
            return COMPLEMENTOS_SUBTIPOS.map(function (s) { return s.etiqueta; });
        }
        return getTiposDeCategoria(categoria);
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

    /* ---------- Recomendaciones específicas para subtipos de Complementos ---------- */
    const COMPLEMENTOS_SUBTIPOS = [
        {
            claves: ["caja bijou", "cajas bijou", "caja de bijou", "cajas de bijou", "joyero", "joyeros"],
            etiqueta: "Cajas bijou",
            texto:
                "Guardá cada pieza en su compartimento para que no se rayen o enreden entre sí.\n" +
                "Mantené la caja cerrada cuando no la uses, lejos de la humedad y del sol directo.\n" +
                "Limpiá el interior de tanto en tanto con un paño seco."
        },
        {
            claves: ["abanico", "abanicos"],
            etiqueta: "Abanicos",
            texto:
                "Abrilo y cerralo con cuidado, sin forzar las varillas.\n" +
                "Evitá mojarlo o exponerlo a humedad prolongada.\n" +
                "Guardalo extendido o en su funda, en un lugar plano y seco."
        },
        {
            claves: ["cinto", "cintos", "cinturon", "cinturones"],
            etiqueta: "Cintos",
            texto:
                "Enrollalo o colgalo sin doblarlo siempre en el mismo punto, para no marcar el material.\n" +
                "Limpialo con un paño húmedo y dejalo secar antes de guardarlo.\n" +
                "Evitá el contacto con perfumes y productos químicos."
        },
        {
            claves: ["paraguas"],
            etiqueta: "Paraguas",
            texto:
                "Dejalo secar abierto antes de guardarlo, para evitar humedad y malos olores.\n" +
                "No lo fuerces al abrir o cerrar con viento fuerte.\n" +
                "Revisá de tanto en tanto el mecanismo y las varillas."
        },
        {
            claves: ["bomba de vacio electrica", "bomba electrica", "bomba de vacio elec"],
            etiqueta: "Bomba de vacío eléctrica",
            texto:
                "Cargá la batería por completo antes de cada viaje largo.\n" +
                "No la uses con prendas mojadas; dejalas secar antes de envasar.\n" +
                "Guardala en un lugar seco y limpiá la boquilla después de cada uso."
        },
        {
            claves: ["bomba de vacio manual", "bomba manual"],
            etiqueta: "Bomba de vacío manual",
            texto:
                "Revisá que la válvula de la bolsa esté bien cerrada antes de bombear.\n" +
                "No fuerces el mecanismo si sentís resistencia; puede indicar que la bolsa ya está al vacío.\n" +
                "Guardala en un lugar seco junto con las bolsas."
        },
        {
            claves: ["balanza de equipaje", "balanza para valija", "balanza de valija", "pesa valija", "pesa equipaje"],
            etiqueta: "Balanza de equipaje",
            texto:
                "Colocá la pila indicada antes del viaje para evitar sorpresas en el check-in.\n" +
                "Enganchala del asa de la valija y levantá de a poco hasta que el número se estabilice.\n" +
                "Guardala en un lugar seco; evitá golpes que puedan descalibrarla."
        },
        {
            claves: ["porta valores", "portavalores", "riñonera de viaje"],
            etiqueta: "Porta valores",
            texto:
                "Usalo debajo de la ropa para mayor seguridad al viajar.\n" +
                "Evitá sobrecargarlo; guardá solo documentos y valores esenciales.\n" +
                "Limpialo con un paño húmedo y dejalo secar bien antes de guardarlo."
        },
        {
            claves: ["candado"],
            etiqueta: "Candados",
            texto:
                "Anotá o guardá la combinación en un lugar seguro, separado de la valija.\n" +
                "Lubricá el mecanismo de tanto en tanto si notás que traba.\n" +
                "Revisá que cierre bien antes de cada viaje."
        },
        {
            claves: ["almohada de viaje", "almohadas de viaje", "almohada cervical"],
            etiqueta: "Almohadas de viaje",
            texto:
                "Lavala siguiendo la etiqueta; muchas admiten lavado a mano.\n" +
                "Dejala secar completamente antes de guardarla, para evitar olores.\n" +
                "Guardala en su bolsa o comprimida solo cuando esté bien seca."
        },
        {
            claves: ["rueda de valija", "ruedas de valija", "ruedas de valijas", "rueda de maleta"],
            etiqueta: "Ruedas de valijas",
            texto:
                "Verificá que el modelo sea compatible con tu valija antes de instalarlas.\n" +
                "Limpiá el eje de tanto en tanto para que giren sin trabarse.\n" +
                "Ajustá bien los tornillos o el sistema de fijación luego de instalarlas."
        }
    ];

    function respuestaComplementoSubtipo(texto) {
        for (let i = 0; i < COMPLEMENTOS_SUBTIPOS.length; i++) {
            const s = COMPLEMENTOS_SUBTIPOS[i];
            const coincide = s.claves.some(function (c) { return texto.indexOf(normalizarTexto(c)) !== -1; });
            if (coincide) return s.etiqueta + ":\n" + s.texto;
        }
        return null;
    }

    function menuComplementos() {
        return {
            texto: "Dentro de Complementos tenemos varios tipos de productos. ¿Sobre cuál te gustaría conocer las recomendaciones de cuidado?",
            botones: COMPLEMENTOS_SUBTIPOS.map(function (s) {
                return { etiqueta: s.etiqueta, mensaje: "recomendaciones de " + s.etiqueta };
            })
        };
    }

    /* ---------- Detección de categorías del catálogo dentro de un texto ---------- */
    function detectarCategoriaExacta(texto) {
        const categorias = getCategorias();
        for (let i = 0; i < categorias.length; i++) {
            if (texto.indexOf(normalizarTexto(categorias[i])) !== -1) return categorias[i];
        }
        return null;
    }

    // Busca coincidencia por una palabra clave puntual de tipo de producto (ej: "aro", "cartera"),
    // a diferencia de detectarCategoriaExacta que busca el nombre de una categoría completa del catálogo.
    function detectarGrupoCuidadoPorClave(texto) {
        for (let i = 0; i < CUIDADOS.length; i++) {
            const grupo = CUIDADOS[i];
            const coincide = grupo.claves.some(function (c) { return texto.indexOf(normalizarTexto(c)) !== -1; });
            if (coincide) return grupo;
        }
        return null;
    }

    function productosPorCategoria(categoria) {
        const norm = normalizarTexto(categoria);
        return getCatalogo().filter(function (p) { return p.Categoria && normalizarTexto(p.Categoria) === norm; });
    }

    function respuestaCuidadosCategoria(categoria) {
        const norm = normalizarTexto(categoria);
        if (norm.indexOf("complemento") !== -1) return menuComplementos();

        const grupo = CUIDADOS.find(function (g) {
            return g.claves.some(function (c) {
                const cNorm = normalizarTexto(c);
                return norm.indexOf(cNorm) !== -1 || cNorm.indexOf(norm) !== -1;
            });
        });
        if (grupo) return { texto: grupo.titulo + ":\n" + grupo.texto };

        return { texto: "Todavía no tengo recomendaciones específicas para " + categoria + ", pero puedo ayudarte con otra consulta." };
    }

    // Paso 1 del flujo de recomendaciones: preguntar la categoría y mostrar sus chips
    // en el lugar de los chips originales (Horarios, Ubicación, etc.).
    function iniciarFlujoCategorias(reintentar) {
        const categorias = getCategorias();
        if (!categorias.length) return { texto: "Estoy terminando de cargar el catálogo. Probá de nuevo en unos segundos." };
        contextoPendiente = "categoria";
        categoriaEnCurso = null;
        return {
            texto: (reintentar ? "No encontré esa categoría. " : "") +
                "Elegí una categoría (tocando un botón de abajo, o escribiéndola) para ver las recomendaciones de cuidado:",
            chips: "categorias"
        };
    }

    // Paso 2: dada una categoría, si tiene tipos de producto puntuales (aros, carteras, etc.)
    // se pregunta cuál, mostrando esos tipos como chips; si no tiene, se responde directo.
    function iniciarFlujoTipo(categoria, reintentar) {
        const opciones = getOpcionesDeCategoria(categoria);
        if (!opciones || !opciones.length) {
            const resultado = respuestaCuidadosCategoria(categoria);
            resultado.chips = "principal";
            return resultado;
        }
        contextoPendiente = "tipo";
        categoriaEnCurso = categoria;
        return {
            texto: (reintentar ? "No encontré ese tipo de producto dentro de " + categoria + ". " : "") +
                "¿Sobre qué tipo de producto dentro de " + categoria + " te gustaría conocer las recomendaciones de cuidado?",
            chips: { modo: "tipos", categoria: categoria, opciones: opciones }
        };
    }

    // Palabras de otras intenciones claras (horarios, ubicación, etc.) para poder abandonar
    // el flujo de recomendaciones si el usuario cambia de tema en medio de una pregunta.
    function esOtraIntencionClara(texto) {
        return contieneAlguna(texto, [
            "horario", "hora", "abren", "cierran", "atienden", "dias de atencion", "cuando abren",
            "donde", "ubicacion", "direccion", "local", "como llegar", "mapa",
            "instagram", "facebook", "redes", "whatsapp", "contacto", "mail", "correo",
            "marca", "marcas", "material", "materiales",
            "gracias", "chau", "adios", "hasta luego", "nos vemos",
            "hola", "buenas", "ayuda", "que podes hacer", "que sabes hacer", "menu"
        ]);
    }

    function preguntaCategoria(categoria) {
        return {
            texto: "¿Querés recomendaciones de cuidado sobre " + categoria + ", o preferís que te muestre todos los productos de esa categoría?",
            botones: [
                { etiqueta: "Recomendaciones", mensaje: "recomendaciones de " + categoria },
                { etiqueta: "Ver todos los productos", mensaje: "mostrame todos los productos de " + categoria }
            ]
        };
    }

    /* ---------- Búsqueda de productos en el catálogo ---------- */
    function camposBusqueda(p) {
        return normalizarTexto([p.Nombre, p.Marca, p.Categoria, p.Tipo, p.Color, p.Material, p.Modelo].join(" "));
    }

    /* ---------- Conexión con el filtro de categorías del main (app.js) ----------
     * app.js maneja el filtrado real mediante los links "<a data-cat="...">" dentro
     * de ".categories" (o ".mobile-categories li[data-cat]"): al hacer click ahí,
     * setea categoriaActivaActual/subcategoriaActivaActual, llama a aplicarFiltros()
     * y hace scroll con irAlContenedorProductos(). En vez de duplicar esa lógica acá,
     * buscamos el link real de la categoría pedida y lo "clickeamos" por código, así
     * el resultado es exactamente el mismo que si el usuario lo hubiera tocado él mismo.
     */
    function irACategoriaEnMain(categoria) {
        const objetivo = normalizarTexto(categoria);
        if (!objetivo) return false;

        const selectores = '.categories a[data-cat], .mobile-categories li[data-cat]';
        const candidatos = Array.from(document.querySelectorAll(selectores));
        if (!candidatos.length) return false;

        // 1) Coincidencia exacta de data-cat
        let elegido = candidatos.find(function (el) {
            return normalizarTexto(el.dataset.cat || "") === objetivo;
        });

        // 2) Si no hay exacta, coincidencia parcial (por si el nombre no es idéntico)
        if (!elegido) {
            elegido = candidatos.find(function (el) {
                const cat = normalizarTexto(el.dataset.cat || "");
                return cat && (cat.indexOf(objetivo) !== -1 || objetivo.indexOf(cat) !== -1);
            });
        }

        if (!elegido) return false;

        // Si el elemento clickeable no es el <a>/<li> con data-cat sino un hijo, buscamos el clickeable real
        const clickeable = elegido.matches('a, li') ? elegido : (elegido.closest('a, li') || elegido);
        clickeable.click();
        return true;
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

    // Recuerda en qué paso del flujo de recomendaciones estamos ("categoria" | "tipo" | null),
    // para poder interpretar la respuesta libre siguiente (ej: "aros", "marroquineria")
    // sin que el usuario tenga que tocar un botón, y para saber qué chips mostrar.
    let contextoPendiente = null;
    let categoriaEnCurso = null;

    function crearElementos() {
        // Botón flotante
        botonEl = document.createElement("button");
        botonEl.id = "btnDelicatita";
        botonEl.className = "btn-delicatita-flotante";
        botonEl.type = "button";
        botonEl.setAttribute("aria-label", "Hablar con Delicatita, asistente virtual");
        botonEl.innerHTML =
            '<i class="fa-solid fa-comment-dots" aria-hidden="true"></i>' +
            '<span class="punto-nuevo" id="delicatitaPuntoNuevo"></span>' +
            '<span class="tooltip-boton">Asistente virtual</span>';
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
            '    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>' +
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

    function agregarBotones(botones) {
        const wrap = document.createElement("div");
        wrap.className = "delicatita-botones-inline";
        botones.forEach(function (b) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "delicatita-chip delicatita-chip-inline";
            btn.textContent = b.etiqueta;
            btn.addEventListener("click", function () { procesarConsulta(b.mensaje); });
            wrap.appendChild(btn);
        });
        mensajesEl.appendChild(wrap);
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

    function renderChipsGenerico(items) {
        chipsEl.innerHTML = "";
        items.forEach(function (it) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "delicatita-chip";
            btn.textContent = it.etiqueta;
            btn.addEventListener("click", function () { procesarConsulta(it.mensaje); });
            chipsEl.appendChild(btn);
        });
    }

    // Chips originales (Horarios, Ubicación, Marcas, etc.)
    function renderChipsPrincipales() {
        renderChipsGenerico(SUGERENCIAS.map(function (texto) { return { etiqueta: texto, mensaje: texto }; }));
    }

    // Reemplaza los chips originales por las categorías del catálogo (paso 1 de recomendaciones)
    function renderChipsCategoriasRecomendacion() {
        const categorias = getCategorias();
        renderChipsGenerico(categorias.map(function (c) { return { etiqueta: c, mensaje: "recomendaciones de " + c }; }));
    }

    // Reemplaza los chips por los tipos de producto de la categoría elegida (paso 2)
    function renderChipsTiposDeCategoria(categoria, opciones) {
        const lista = opciones || getOpcionesDeCategoria(categoria) || [];
        renderChipsGenerico(lista.map(function (o) { return { etiqueta: o, mensaje: "recomendaciones de " + o }; }));
    }

    // Aplica en la UI lo que haya pedido la respuesta del motor de reglas: volver a los
    // chips originales, mostrar categorías, o mostrar los tipos de una categoría puntual.
    function aplicarChips(chips) {
        if (!chips) return;
        if (chips === "principal") {
            renderChipsPrincipales();
        } else if (chips === "categorias") {
            renderChipsCategoriasRecomendacion();
        } else if (chips.modo === "tipos") {
            renderChipsTiposDeCategoria(chips.categoria, chips.opciones);
        }
    }

    /* ---------- Motor de respuestas (reglas por palabras clave) ---------- */

    // Punto de entrada: si estamos en medio del flujo de recomendaciones (esperando
    // categoría o tipo de producto), intenta resolverlo acá antes que nada. Si el
    // mensaje no tiene nada que ver, abandona el flujo y sigue con las reglas normales.
    function generarRespuesta(textoOriginal) {
        const t = normalizarTexto(textoOriginal);
        const nPalabras = contarPalabras(t);
        let forzarChipsPrincipales = false;

        if (contextoPendiente === "categoria" || contextoPendiente === "tipo") {
            const etapaPrevia = contextoPendiente;
            const categoriaGuardada = categoriaEnCurso;

            // ¿Es un subtipo puntual de Complementos? (cajas bijou, abanicos, bomba de vacío, etc.)
            const subtipo = respuestaComplementoSubtipo(t);
            if (subtipo) {
                contextoPendiente = null;
                categoriaEnCurso = null;
                return { texto: subtipo, chips: "principal" };
            }

            // ¿Nombró una categoría exacta del catálogo? (ej: "marroquineria") -> preguntamos el tipo
            const categoriaExacta = detectarCategoriaExacta(t);
            if (categoriaExacta) return iniciarFlujoTipo(categoriaExacta);

            // ¿Nombró un tipo de producto puntual conocido? (ej: "aros", "carteras") -> respuesta directa
            const grupo = detectarGrupoCuidadoPorClave(t);
            if (grupo) {
                contextoPendiente = null;
                categoriaEnCurso = null;
                return { texto: grupo.titulo + ":\n" + grupo.texto, chips: "principal" };
            }

            // Si estábamos esperando un tipo, probamos contra la lista concreta de esa categoría
            if (etapaPrevia === "tipo" && categoriaGuardada) {
                const opciones = getOpcionesDeCategoria(categoriaGuardada) || [];
                const encontrada = opciones.find(function (o) {
                    const on = normalizarTexto(o);
                    return on === t || t.indexOf(on) !== -1 || on.indexOf(t) !== -1;
                });
                if (encontrada) {
                    contextoPendiente = null;
                    categoriaEnCurso = null;
                    const resultado = respuestaCuidadosCategoria(encontrada);
                    resultado.chips = "principal";
                    return resultado;
                }
            }

            // No coincidió con nada del flujo de recomendaciones. Si el mensaje parece
            // referirse a otra cosa (horarios, ubicación, etc.), abandonamos el flujo y
            // dejamos que las reglas normales de abajo lo resuelvan.
            if (esOtraIntencionClara(t)) {
                contextoPendiente = null;
                categoriaEnCurso = null;
                forzarChipsPrincipales = true;
            } else {
                return (etapaPrevia === "tipo" && categoriaGuardada)
                    ? iniciarFlujoTipo(categoriaGuardada, true)
                    : iniciarFlujoCategorias(true);
            }
        }

        const resultado = generarRespuestaBase(t, nPalabras, textoOriginal);
        if (forzarChipsPrincipales && !resultado.chips) resultado.chips = "principal";
        return resultado;
    }

    function generarRespuestaBase(t, nPalabras, textoOriginal) {
        // Despedida
        if (nPalabras <= 4 && contieneAlguna(t, ["gracias", "chau", "adios", "hasta luego", "nos vemos"])) {
            return { texto: "Gracias por escribirnos. Que tengas un excelente día." };
        }

        // Saludo (solo si el mensaje es corto, para no tapar preguntas más largas)
        if (nPalabras <= 5 && contieneAlguna(t, [
            "hola", "buenas", "buen dia", "buenos dias", "buenas tardes", "buenas noches",
            "como estas", "como andas", "como te va", "que tal", "todo bien"
        ])) {
            return {
                texto: "¡Hola! Todo bien por acá, gracias. Soy Delicatita, el asistente virtual de Delicata Eleganza. " +
                    "Puedo ayudarte con horarios, ubicación, marcas, materiales, recomendaciones de cuidado " +
                    "y datos sobre nuestros productos. ¿En qué puedo ayudarte?"
            };
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

        // Mostrar todos los productos de una categoría puntual (esto cierra el chat y
        // muestra las tarjetas en el main, usando el filtro real de categorías del sitio)
        const pideVerCategoriaCompleta = contieneAlguna(t, [
            "todos los productos", "mostrame todo", "muestrame todo", "ver todos los productos",
            "todo el catalogo de", "mostrame los productos de", "muestrame los productos de",
            "quiero ver todos", "quiero ver solo", "quiero ver los"
        ]) || (t.indexOf("ver") !== -1 && (t.indexOf("todos") !== -1 || t.indexOf("solo") !== -1));

        if (pideVerCategoriaCompleta) {
            const categoriaExacta = detectarCategoriaExacta(t);
            if (categoriaExacta) {
                return { verEnMain: categoriaExacta };
            }
            return { texto: "¿De qué categoría te gustaría ver todos los productos? Contame el nombre y te los muestro." };
        }

        // Recomendaciones / cuidados de uso
        if (contieneAlguna(t, ["cuidado", "cuidar", "mantenimiento", "limpiar", "conservar", "recomendacion", "como cuido"])) {
            // 1) ¿Es un subtipo puntual de Complementos? (cajas bijou, abanicos, bomba de vacío, etc.)
            const subtipo = respuestaComplementoSubtipo(t);
            if (subtipo) return { texto: subtipo, chips: "principal" };

            // 2) ¿Nombró una categoría exacta del catálogo? (ej: "recomendaciones de marroquineria")
            //    -> preguntamos sobre qué tipo de producto dentro de esa categoría, mostrando sus chips.
            const categoriaExacta = detectarCategoriaExacta(t);
            if (categoriaExacta) return iniciarFlujoTipo(categoriaExacta);

            // 3) ¿Nombró directamente un tipo de producto puntual? (ej: "dame recomendaciones de aros")
            //    -> respuesta directa, sin pasar por el menú de categorías.
            const grupo = detectarGrupoCuidadoPorClave(t);
            if (grupo) return { texto: grupo.titulo + ":\n" + grupo.texto, chips: "principal" };

            // 4) Genérico: preguntamos la categoría y mostramos los chips de categorías
            return iniciarFlujoCategorias();
        }

        // Ayuda / qué podés hacer
        if (contieneAlguna(t, ["ayuda", "que podes hacer", "que sabes hacer", "menu"])) {
            return {
                texto: "Puedo ayudarte con:\n" +
                    "• Horarios y días de atención\n" +
                    "• Ubicación del local\n" +
                    "• Marcas y materiales que trabajamos\n" +
                    "• Recomendaciones de cuidado por categoría o tipo de producto\n" +
                    "• Mostrarte todos los productos de una categoría\n" +
                    "• Datos de un producto puntual del catálogo\n" +
                    "• Nuestras redes sociales\n\n" +
                    "También podés tocar una de las sugerencias de abajo."
            };
        }

        // Mención suelta de una categoría del catálogo (ej: "bijouterie") -> preguntar qué desea
        // Solo si el mensaje es prácticamente la categoría sola, para no interferir con búsquedas
        // de productos más específicas (ej: "tienen collar dorado").
        if (nPalabras <= 2) {
            const categoriaSuelta = detectarCategoriaExacta(t);
            if (categoriaSuelta) return preguntaCategoria(categoriaSuelta);
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

            if (respuesta.verEnMain) {
                const enganchado = irACategoriaEnMain(respuesta.verEnMain);
                if (enganchado) {
                    cerrarPanel();
                    return;
                }
                // Fallback por si no se encuentra el link de esa categoría en el main:
                // mostramos las tarjetas acá mismo, como antes.
                const productos = productosPorCategoria(respuesta.verEnMain);
                if (!productos.length) {
                    agregarMensajeTexto("Por el momento no tengo productos cargados en la categoría " + respuesta.verEnMain + ".", "bot");
                    return;
                }
                agregarMensajeTexto("Estos son los productos que tenemos en " + respuesta.verEnMain + ":", "bot");
                productos.slice(0, 6).forEach(agregarTarjetaProducto);
                return;
            }

            if (respuesta.productos) {
                agregarMensajeTexto(
                    respuesta.textoProductos ||
                    (respuesta.productos.length === 1
                        ? "Encontré este producto en el catálogo:"
                        : "Encontré estos productos en el catálogo:"),
                    "bot"
                );
                respuesta.productos.forEach(agregarTarjetaProducto);
                if (respuesta.chips) aplicarChips(respuesta.chips);
                return;
            }

            agregarMensajeTexto(respuesta.texto, "bot");

            if (respuesta.accion) {
                agregarAccion(respuesta.accion.etiqueta, respuesta.accion.icono, respuesta.accion.url);
            }
            if (respuesta.acciones) {
                respuesta.acciones.forEach(function (a) { agregarAccion(a.etiqueta, a.icono, a.url); });
            }
            if (respuesta.botones) {
                agregarBotones(respuesta.botones);
            }
            if (respuesta.chips) {
                aplicarChips(respuesta.chips);
            }
        }, 450);
    }

    /* ---------- Apertura / cierre del panel ---------- */
    function abrirPanel() {
        panelEl.classList.add("abierto");
        if (!chatIniciado) {
            chatIniciado = true;
            renderChipsPrincipales();
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

    /* ---------- Tooltips de los botones flotantes ---------- */
    function esTactil() {
        try { return window.matchMedia("(hover: none)").matches; } catch (e) { return false; }
    }

    function mostrarTooltipTemporal(el, duracion) {
        if (!el) return;
        const tip = el.querySelector(".tooltip-boton");
        if (!tip) return;
        tip.classList.add("mostrar");
        setTimeout(function () { tip.classList.remove("mostrar"); }, duracion || 1800);
    }

    // En desktop, el tooltip aparece solo con :hover (CSS). En táctil no hay hover,
    // así que la primera vez que se carga la página lo mostramos solo un instante,
    // como un toast, para enseñar qué es cada botón sin que el usuario tenga que tocarlo.
    function iniciarOnboardingTooltips() {
        if (!esTactil()) return;

        const TOOLTIP_KEY = "delicatitaTooltipsVistos";
        let vistos = false;
        try { vistos = localStorage.getItem(TOOLTIP_KEY) === "1"; } catch (e) { /* no disponible */ }
        if (vistos) return;

        setTimeout(function () { mostrarTooltipTemporal(document.getElementById("toggleNuevos")); }, 700);
        setTimeout(function () { mostrarTooltipTemporal(document.querySelector(".btn-carrito-flotante")); }, 2600);

        try { localStorage.setItem(TOOLTIP_KEY, "1"); } catch (e) { /* no disponible */ }
    }

    /* ---------- Revelar el botón al usar "Ver novedades" ---------- */
    function revelarBoton() {
        botonEl.classList.add("visible");
        try { localStorage.setItem(STORAGE_KEY, "1"); } catch (e) { /* almacenamiento no disponible */ }

        // El botón del asistente recién existe visualmente acá, así que su tooltip
        // de bienvenida se dispara en este momento (una sola vez), y no antes.
        if (esTactil()) {
            const TOOLTIP_ASISTENTE_KEY = "delicatitaTooltipAsistenteVisto";
            let visto = false;
            try { visto = localStorage.getItem(TOOLTIP_ASISTENTE_KEY) === "1"; } catch (e) { /* no disponible */ }
            if (!visto) {
                setTimeout(function () { mostrarTooltipTemporal(botonEl); }, 700);
                try { localStorage.setItem(TOOLTIP_ASISTENTE_KEY, "1"); } catch (e) { /* no disponible */ }
            }
        }
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

        // Enseña brevemente qué es cada botón flotante en dispositivos táctiles
        iniciarOnboardingTooltips();
    });
})();