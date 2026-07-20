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
        "Mañana: de 09:30 a 12:30 hs.\n" +
        "Tarde: de 16:30 a 20:30 hs.";

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

  
    function getOpcionesDeCategoria(categoria) {
        const norm = normalizarTexto(categoria);
        if (norm.indexOf("complemento") !== -1) {
            if (norm.indexOf("viaje") !== -1) {
                return COMPLEMENTOS_VIAJE_SUBTIPOS.map(function (s) { return s.etiqueta; });
            }
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
        }
    ];

   
    const COMPLEMENTOS_VIAJE_SUBTIPOS = [
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
        const todos = COMPLEMENTOS_SUBTIPOS.concat(COMPLEMENTOS_VIAJE_SUBTIPOS);
        for (let i = 0; i < todos.length; i++) {
            const s = todos[i];
            const coincide = s.claves.some(function (c) { return texto.indexOf(normalizarTexto(c)) !== -1; });
            if (coincide) return s.etiqueta + ":\n" + s.texto;
        }
        return null;
    }


    function esFraseComplementosDeViaje(texto) {
        return texto.indexOf("complementos de viaje") !== -1 || texto.indexOf("complemento de viaje") !== -1;
    }

   
    const TIPOS_ESPECIFICOS = [
        // --- Bijouterie / Fiesta ---
        {
            claves: ["aro", "aros"],
            etiqueta: "Aros",
            texto:
                "Quitátelos antes de dormir, bañarte o nadar, para que no pierdan el brillo.\n" +
                "Evitá el contacto con perfumes, cremas o alcohol en gel.\n" +
                "Guardalos en un lugar seco, separados entre sí para que no se rayen."
        },
        {
            claves: ["cadena", "cadenas"],
            etiqueta: "Cadenas",
            texto:
                "Guardala extendida o en su bolsita, para que no se enrede ni se tuerza.\n" +
                "Evitá tironear del broche; abrilo y cerralo con cuidado.\n" +
                "Limpiala con un paño suave, sin productos abrasivos."
        },
        {
            claves: ["dije", "dijes"],
            etiqueta: "Dijes",
            texto:
                "Revisá de tanto en tanto que el enganche esté firme, para que no se pierda.\n" +
                "Evitá el contacto directo con agua, perfumes y cremas.\n" +
                "Guardalo en un compartimento aparte para que no se raye con otras piezas."
        },
        {
            claves: ["collar", "collares"],
            etiqueta: "Collares",
            texto:
                "Guardalo extendido o colgado, no enroscado, para que la cadena no se enrede.\n" +
                "Es la última prenda que te ponés y la primera que te sacás, para minimizar el contacto con perfumes y cosméticos.\n" +
                "Limpialo con un paño seco después de cada uso."
        },
        {
            claves: ["pulsera", "pulseras"],
            etiqueta: "Pulseras",
            texto:
                "Sacátela antes de lavarte las manos, cocinar o hacer actividad física.\n" +
                "Evitá golpes contra superficies duras que puedan deformar eslabones o dijes.\n" +
                "Guardala por separado para que no se enganche con otras piezas."
        },
        {
            claves: ["chal", "chales"],
            etiqueta: "Chales",
            texto:
                "Doblalo con cuidado, sin colgarlo, para que no se deforme ni se estire.\n" +
                "Preferí el lavado a mano o en seco, según la etiqueta.\n" +
                "Evitá el contacto prolongado con perfumes y desodorantes."
        },
        {
            claves: ["sobres de fiesta", "sobre de fiesta", "cartera sobre", "sobres"],
            etiqueta: "Sobres",
            texto:
                "Guardalo relleno con papel de seda para que mantenga su forma plana.\n" +
                "Evitá sobrecargarlo; suelen tener menos refuerzo que una cartera grande.\n" +
                "Limpiá el exterior con un paño suave, según el material."
        },
        // --- Marroquinería ---
        {
            claves: ["bandolera", "bandoleras"],
            etiqueta: "Bandoleras",
            texto:
                "Ajustá la correa a una altura cómoda para no forzar las costuras.\n" +
                "Evitá sobrecargarla más allá de su capacidad; hidratá el cuero de tanto en tanto.\n" +
                "Guardala rellena con papel o tela para que mantenga su forma."
        },
        {
            claves: ["billetera", "billeteras"],
            etiqueta: "Billeteras",
            texto:
                "No la sobrecargues con monedas, tarjetas o papeles de más; deforma las costuras.\n" +
                "Limpiala con un paño ligeramente húmedo y dejala secar a la sombra.\n" +
                "Guardala en un lugar seco, lejos de fuentes de calor directo."
        },
        {
            claves: ["bolso", "bolsos"],
            etiqueta: "Bolsos",
            texto:
                "Vaciá los bolsillos internos cuando no lo uses, para que no pierda su forma.\n" +
                "Evitá apoyarlo en superficies mojadas o sucias.\n" +
                "Hidratá el cuero periódicamente si el material lo requiere."
        },
        {
            claves: ["cartera", "carteras"],
            etiqueta: "Carteras",
            texto:
                "Guardala rellena con papel de seda o tela para que conserve su forma.\n" +
                "Evitá sobrecargarla; el peso extra tensiona asas y costuras.\n" +
                "Limpiala con un paño suave humedecido y dejala secar a la sombra, lejos del sol directo."
        },
        {
            claves: ["mochila", "mochilas"],
            etiqueta: "Mochilas",
            texto:
                "Distribuí el peso entre los compartimentos para no forzar costuras ni correas.\n" +
                "Aireala después de cada uso, sobre todo si estuvo en contacto con humedad.\n" +
                "Limpiá correas y base con un paño húmedo de tanto en tanto."
        },
        {
            claves: ["morral", "morrales"],
            etiqueta: "Morrales",
            texto:
                "Ajustá bien las correas para no forzar las costuras al cargarlo.\n" +
                "Evitá superar el peso que indica el fabricante.\n" +
                "Guardalo vacío o semi-relleno, en un lugar ventilado."
        },
        {
            claves: ["mini bag", "mini bags", "minibag", "minibags"],
            etiqueta: "Mini Bags",
            texto:
                "Al ser más chica, evitá sobrecargarla: guardá solo lo esencial.\n" +
                "Limpiala con un paño suave, prestando atención a herrajes y cierres.\n" +
                "Guardala rellena con papel para que no pierda su forma."
        },
        {
            claves: ["portanotebook", "portanotebooks", "porta notebook", "porta notebooks"],
            etiqueta: "Portanotebooks",
            texto:
                "Revisá que el compartimento acolchado esté seco antes de guardar el equipo.\n" +
                "Evitá guardar objetos punzantes junto al notebook, para no dañar el forro.\n" +
                "Limpiá el exterior con un paño húmedo, sin mojar el interior."
        },
        {
            claves: ["riñonera", "riñoneras", "rinonera", "rinoneras"],
            etiqueta: "Riñoneras",
            texto:
                "Ajustá bien la correa para que no cargue todo el peso de un solo lado.\n" +
                "Evitá sobrecargarla más allá de lo que soporta cómodamente.\n" +
                "Limpiala con un paño húmedo y dejala secar antes de guardarla."
        },
        // --- Artículos de viaje ---
        {
            claves: ["valija", "valijas"],
            etiqueta: "Valijas",
            texto:
                "Revisá ruedas, manijas y cierres antes de cada viaje.\n" +
                "No superes el peso máximo indicado, para no forzar costuras ni ruedas.\n" +
                "Guardala en un lugar ventilado, no dentro de bolsas cerradas herméticamente."
        },
        // --- Pañolería (chalinas: invierno o verano) ---
        {
            claves: ["invierno"],
            etiqueta: "Chalinas de invierno",
            texto:
                "Preferí el lavado a mano con agua fría, sobre todo si es lana o tejido grueso.\n" +
                "No retuerzas la prenda al escurrir; presioná suavemente entre toallas.\n" +
                "Guardala doblada, no colgada, para que no se estire ni pierda la forma."
        },
        {
            claves: ["verano"],
            etiqueta: "Chalinas de verano",
            texto:
                "Al ser telas livianas, evitá el planchado directo; usá temperatura baja o un paño intermedio.\n" +
                "Lavala a mano y dejala secar a la sombra, para que no pierda el color.\n" +
                "Guardala doblada en un lugar seco, lejos de la luz solar directa."
        }
    ];

    function respuestaTipoEspecifico(texto) {
        for (let i = 0; i < TIPOS_ESPECIFICOS.length; i++) {
            const s = TIPOS_ESPECIFICOS[i];
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

    function menuComplementosViaje() {
        return {
            texto: "Dentro de Complementos de viaje tenemos varios accesorios. ¿Sobre cuál te gustaría conocer las recomendaciones de cuidado?",
            botones: COMPLEMENTOS_VIAJE_SUBTIPOS.map(function (s) {
                return { etiqueta: s.etiqueta, mensaje: "recomendaciones de " + s.etiqueta };
            })
        };
    }

    function getTodosLosTipos() {
        const excluidos = ["sin tipo", "—", "-", ""];
        const set = new Set();
        getCatalogo().forEach(function (p) {
            const tipo = p.Tipo;
            if (tipo && excluidos.indexOf(normalizarTexto(tipo)) === -1) set.add(tipo);
        });
        return Array.from(set).sort(function (a, b) { return a.localeCompare(b, "es"); });
    }

    function detectarTipoExacto(texto) {
        const tipos = getTodosLosTipos();

        function tipoDelCatalogo(alias) {
            if (!alias) return null;
            return tipos.find(function (tp) { return normalizarTexto(tp) === normalizarTexto(alias); }) || null;
        }

  
        if (typeof extraerTipoExacto === "function") {
            const viaAlias = extraerTipoExacto(texto);
            const encontrado = tipoDelCatalogo(viaAlias && viaAlias.tipo);
            if (encontrado) return encontrado;
        }


        if (typeof TIPO_ALIAS_MAP !== "undefined" && typeof normalizarTermino === "function") {
            const tokens = texto.split(/\s+/).filter(Boolean);
            for (let i = 0; i < tokens.length; i++) {
                const singular = normalizarTermino(tokens[i]);
                if (TIPO_ALIAS_MAP[singular]) {
                    const encontrado = tipoDelCatalogo(TIPO_ALIAS_MAP[singular]);
                    if (encontrado) return encontrado;
                }
            }
        }

        for (let i = 0; i < tipos.length; i++) {
            if (texto.indexOf(normalizarTexto(tipos[i])) !== -1) return tipos[i];
        }
        return null;
    }

    /* ---------- Detección de categorías del catálogo dentro de un texto ---------- */
    function detectarCategoriaExacta(texto) {
        const categorias = getCategorias();
        for (let i = 0; i < categorias.length; i++) {
            if (texto.indexOf(normalizarTexto(categorias[i])) !== -1) return categorias[i];
        }
        return null;
    }

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

    function productosPorTipo(tipo, categoria) {
        const normTipo = normalizarTexto(tipo);
        const normCat = categoria ? normalizarTexto(categoria) : null;
        return getCatalogo().filter(function (p) {
            if (!p.Tipo || normalizarTexto(p.Tipo) !== normTipo) return false;
            if (normCat && p.Categoria && normalizarTexto(p.Categoria) !== normCat) return false;
            return true;
        });
    }

    function respuestaCuidadosCategoria(categoria) {
        const norm = normalizarTexto(categoria);


        const especifico = respuestaTipoEspecifico(norm) || respuestaComplementoSubtipo(norm);
        if (especifico) return { texto: especifico };

       
        if (norm.indexOf("complemento") !== -1) {
            if (norm.indexOf("viaje") !== -1) return menuComplementosViaje();
            return menuComplementos();
        }

        const grupo = CUIDADOS.find(function (g) {
            return g.claves.some(function (c) {
                const cNorm = normalizarTexto(c);
                return norm.indexOf(cNorm) !== -1 || cNorm.indexOf(norm) !== -1;
            });
        });
        if (grupo) return { texto: grupo.titulo + ":\n" + grupo.texto };

        return { texto: "Todavía no tengo recomendaciones específicas para " + categoria + ", pero puedo ayudarte con otra consulta." };
    }


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


    function iniciarFlujoTipo(categoria, reintentar) {
        const normCategoria = normalizarTexto(categoria);
        if (normCategoria === "piercing" || normCategoria === "piercings") {
            contextoPendiente = null;
            categoriaEnCurso = null;
            const resultado = respuestaCuidadosCategoria(categoria);
            resultado.chips = "principal";
            return resultado;
        }

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
    function irAGridConBusqueda(texto) {
        const input = document.getElementById("searchInput");
        if (!input || typeof aplicarFiltros !== "function") return false;
        if (typeof categoriaActivaActual !== "undefined") categoriaActivaActual = "todos";
        if (typeof subcategoriaActivaActual !== "undefined") subcategoriaActivaActual = "";
        document.querySelectorAll(".categories a.active-cat, .mobile-categories li.active-cat")
            .forEach(function (el) { el.classList.remove("active-cat"); });
        input.value = texto || "";
        aplicarFiltros();
        if (typeof irAlContenedorProductos === "function") irAlContenedorProductos();
        return true;
    }
    function irACategoriaEnMain(categoria, tipo) {
        const objetivoCat = normalizarTexto(categoria || "");
        const objetivoTipo = normalizarTexto(tipo || "");
        if (!objetivoCat && !objetivoTipo) return false;

        const candidatosDesktop = Array.from(document.querySelectorAll('.categories a[data-cat]'));
        const candidatosMobile = Array.from(document.querySelectorAll('.mobile-categories li[data-cat]'));
        const candidatos = candidatosDesktop.concat(candidatosMobile);
        if (!candidatos.length) return false;

        function catCoincide(el) {
            if (!objetivoCat) return true;
            const cat = normalizarTexto(el.dataset.cat || "");
            return cat === objetivoCat || cat.indexOf(objetivoCat) !== -1 || objetivoCat.indexOf(cat) !== -1;
        }

        let elegido = null;

        if (objetivoTipo) {
            // 1) Categoría + tipo exactos (ej: Marroquinería > Carteras)
            elegido = candidatos.find(function (el) {
                return catCoincide(el) && normalizarTexto(el.dataset.tipo || "") === objetivoTipo;
            });

            if (!elegido && !objetivoCat) {
                elegido = candidatos.find(function (el) {
                    return normalizarTexto(el.dataset.tipo || "") === objetivoTipo;
                });
            }
        }

        if (!elegido && objetivoCat) {
            // Categoría sola, sin tipo puntual
            elegido = candidatos.find(function (el) { return catCoincide(el) && !el.dataset.tipo; });
            if (!elegido) elegido = candidatos.find(catCoincide);
        }

        if (!elegido) return false;

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
    let panelEl, mensajesEl, inputEl, botonEl, chipsEl, backdropEl;
    let chatIniciado = false;
    let _scrollAncladoAlInicio = false;
    let _ultimoAnclaje = null;
  
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

       
        backdropEl = document.createElement("div");
        backdropEl.className = "delicatita-backdrop";
        backdropEl.addEventListener("click", function () { cerrarPanel(); });
        document.body.appendChild(backdropEl);

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


    function scrollAlInicioDe(el) {
        const offset = el.getBoundingClientRect().top - mensajesEl.getBoundingClientRect().top + mensajesEl.scrollTop;
        mensajesEl.scrollTop = Math.max(0, offset - 6);
    }
    function esMensajeLargo(texto) {
        const renglones = (texto.match(/\n/g) || []).length;
        return renglones >= 4 || texto.length > 220;
    }

    function agregarMensajeTexto(texto, quien) {
        const div = document.createElement("div");
        div.className = "delicatita-msg " + quien;
        div.textContent = texto;
        mensajesEl.appendChild(div);
        if (quien === "bot" && esMensajeLargo(texto)) {
            scrollAlInicioDe(div);
            _scrollAncladoAlInicio = true;
            _ultimoAnclaje = div;
        } else {
            scrollAbajo();
            _scrollAncladoAlInicio = false;
            _ultimoAnclaje = null;
        }
    }

    function agregarAccion(etiqueta, icono, url) {
        const a = document.createElement("a");
        a.className = "delicatita-accion";
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.innerHTML = '<i class="' + icono + '" aria-hidden="true"></i> ' + etiqueta;
        mensajesEl.appendChild(a);
        if (_scrollAncladoAlInicio) { _scrollAncladoAlInicio = false; } else { scrollAbajo(); }
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
        if (_scrollAncladoAlInicio) { _scrollAncladoAlInicio = false; } else { scrollAbajo(); }
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
                cerrarPanel();
                window.abrirModal(p);
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

    function _suprimirHoverFantasma() {
        chipsEl.style.pointerEvents = "none";
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                chipsEl.style.pointerEvents = "";
            });
        });
    }

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
        _suprimirHoverFantasma();
    }

    function renderChipsConVolver(items, alVolver) {
        chipsEl.innerHTML = "";

        const btnVolver = document.createElement("button");
        btnVolver.type = "button";
        btnVolver.className = "delicatita-chip delicatita-chip-volver";
        btnVolver.innerHTML = "&larr; Volver";
        btnVolver.addEventListener("click", alVolver);
        chipsEl.appendChild(btnVolver);

        items.forEach(function (it) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "delicatita-chip";
            btn.textContent = it.etiqueta;
            btn.addEventListener("click", function () { procesarConsulta(it.mensaje); });
            chipsEl.appendChild(btn);
        });
        _suprimirHoverFantasma();
    }
    function renderChipsPrincipales() {
        renderChipsGenerico(SUGERENCIAS.map(function (texto) { return { etiqueta: texto, mensaje: texto }; }));
    }

    // Reemplaza los chips originales por las categorías del catálogo (paso 1 de recomendaciones)
    function renderChipsCategoriasRecomendacion() {
        const categorias = getCategorias();
        renderChipsConVolver(
            categorias.map(function (c) { return { etiqueta: c, mensaje: "recomendaciones de " + c }; }),
            function () {
                contextoPendiente = null;
                categoriaEnCurso = null;
                renderChipsPrincipales();
            }
        );
    }

    // Reemplaza los chips por los tipos de producto de la categoría elegida (paso 2)
    function renderChipsTiposDeCategoria(categoria, opciones) {
        const lista = opciones || getOpcionesDeCategoria(categoria) || [];
        renderChipsConVolver(
            lista.map(function (o) { return { etiqueta: o, mensaje: "recomendaciones de " + o }; }),
            function () {
                contextoPendiente = "categoria";
                categoriaEnCurso = null;
                renderChipsCategoriasRecomendacion();
            }
        );
    }

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

            // ¿Es un tipo de producto con recomendación específica? (aros, carteras, valijas, etc.)
            const especifico = respuestaTipoEspecifico(t);
            if (especifico) {
                contextoPendiente = null;
                categoriaEnCurso = null;
                return { texto: especifico, chips: "principal" };
            }


            if (esFraseComplementosDeViaje(t)) return iniciarFlujoTipo("Complementos de viaje");


            const categoriaExacta = detectarCategoriaExacta(t);
            if (categoriaExacta) return iniciarFlujoTipo(categoriaExacta);


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
            return { texto: "Trabajamos, entre otras, con estas marcas:\n" + marcas.map(function (m) { return "• " + m; }).join("\n") };
        }

        // Materiales
        if (contieneAlguna(t, ["material", "materiales"])) {
            const materiales = getMateriales();
            if (!materiales.length) return { texto: "Estoy terminando de cargar el catálogo. Probá de nuevo en unos segundos." };
            return { texto: "Trabajamos con estos materiales:\n" + materiales.map(function (m) { return "• " + m; }).join("\n") };
        }

        // Qué productos / categorías se venden
        if (contieneAlguna(t, ["que venden", "que productos", "catalogo", "categoria", "categorias", "que tienen", "que hay"])) {
            const categorias = getCategorias();
            if (!categorias.length) return { texto: "Estoy terminando de cargar el catálogo. Probá de nuevo en unos segundos." };
            return { texto: "Nuestras categorías de productos son:\n" + categorias.join(", ") + "." };
        }


        const esConsultaCuidado = contieneAlguna(t, ["cuidado", "cuidar", "mantenimiento", "limpiar", "conservar", "recomendacion", "como cuido"]);
        const pideVerCategoriaCompleta = !esConsultaCuidado && (
            /\bver\b/.test(t) ||
            contieneAlguna(t, [
                "todos los productos", "mostrame todo", "muestrame todo",
                "todo el catalogo de", "mostrame los productos de", "muestrame los productos de",
                "quiero ver todos", "quiero ver solo", "quiero ver los"
            ])
        );

        if (pideVerCategoriaCompleta) {
            const tipoExacto = detectarTipoExacto(t);
            if (tipoExacto) {
                const categoriaExacta = detectarCategoriaExacta(t);
                return { verEnMain: { tipo: tipoExacto, categoria: categoriaExacta } };
            }
            const categoriaExacta = detectarCategoriaExacta(t);
            if (categoriaExacta) {
                return { verEnMain: { categoria: categoriaExacta } };
            }
 
            return { verEnMain: {} };
        }

        // Recomendaciones / cuidados de uso
        if (contieneAlguna(t, ["cuidado", "cuidar", "mantenimiento", "limpiar", "conservar", "recomendacion", "como cuido"])) {
            // 1) ¿Es un subtipo puntual de Complementos? (cajas bijou, abanicos, bomba de vacío, etc.)
            const subtipo = respuestaComplementoSubtipo(t);
            if (subtipo) return { texto: subtipo, chips: "principal" };

            
            const especifico = respuestaTipoEspecifico(t);
            if (especifico) return { texto: especifico, chips: "principal" };


            if (esFraseComplementosDeViaje(t)) return iniciarFlujoTipo("Complementos de viaje");


            const categoriaExacta = detectarCategoriaExacta(t);
            if (categoriaExacta) return iniciarFlujoTipo(categoriaExacta);

            // 4) ¿Nombró un tipo puntual sin recomendación específica propia? -> texto genérico de su categoría
            const grupo = detectarGrupoCuidadoPorClave(t);
            if (grupo) return { texto: grupo.titulo + ":\n" + grupo.texto, chips: "principal" };

            // 5) Genérico: preguntamos la categoría y mostramos los chips de categorías
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

       
        if (nPalabras <= 2) {
            const categoriaSuelta = detectarCategoriaExacta(t);
            if (categoriaSuelta) return preguntaCategoria(categoriaSuelta);
        }

        
        return { irABuscador: textoOriginal };

       
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
                const destino = respuesta.verEnMain;
                cerrarPanel();
                const enganchado = irACategoriaEnMain(destino.categoria, destino.tipo);
                if (enganchado) {
                    return;
                }
             
                irAGridConBusqueda(destino.tipo || destino.categoria || "");
                return;
            }

            if (respuesta.irABuscador) {
                cerrarPanel();
                irAGridConBusqueda(respuesta.irABuscador);
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

            if (_ultimoAnclaje) {
                scrollAlInicioDe(_ultimoAnclaje);
            } else {
                scrollAbajo();
            }
        }, 450);
    }


    let _delicatitaScrollY = 0;

    function bloquearScrollFondo() {
        if (document.documentElement.classList.contains("delicatita-scroll-lock")) return;
        _delicatitaScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
        document.documentElement.classList.add("delicatita-scroll-lock");
        document.body.style.position = "fixed";
        document.body.style.top = (-_delicatitaScrollY) + "px";
        document.body.style.left = "0";
        document.body.style.right = "0";
        document.body.style.width = "100%";
    }

    function desbloquearScrollFondo() {
        if (!document.documentElement.classList.contains("delicatita-scroll-lock")) return;
        document.documentElement.classList.remove("delicatita-scroll-lock");
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.width = "";
        window.scrollTo(0, _delicatitaScrollY);
    }

    /* ---------- Apertura / cierre del panel ---------- */
    function abrirPanel() {
        panelEl.classList.add("abierto");
        backdropEl.classList.add("activo");
        bloquearScrollFondo();
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
        backdropEl.classList.remove("activo");
        desbloquearScrollFondo();
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

  
        try {
            if (localStorage.getItem(STORAGE_KEY) === "1") revelarBoton();
        } catch (e) { /* almacenamiento no disponible */ }

  
        document.getElementById("toggleNuevos").addEventListener("click", revelarBoton);


        iniciarOnboardingTooltips();
    });
})();