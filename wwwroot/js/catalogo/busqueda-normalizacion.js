
const COLOR_SINONIMOS = {
    "negro": ["negro", "negra", "negros", "negras", "black", "ebano", "carbon", "carbón", "oscuro", "oscura", "oscuros", "oscuras", "noche"],
    "blanco": ["blanco", "blanca", "blancos", "blancas", "white", "marfil", "crema", "tiza", "nieve", "ivory", "blanquito", "nacarado", "nacarada", "vainilla"],
    "rojo": ["rojo", "roja", "rojos", "rojas", "red", "carmesi", "carmesí", "escarlata", "cereza", "sangre", "rubi", "rubí"],
    "azul": ["azul", "azules", "blue", "marino", "azul marino", "celeste", "azul cielo", "cielo", "navy", "cobalto", "zafiro", "klein", "royal", "indigo", "índigo", "petroleo", "petróleo", "azul francia", "azul rey", "azul electrico", "azul eléctrico", "azul bebe", "azul bebé", "azul acero", "denim", "jean", "azul oscuro", "azul pastel"],

    "verde": ["verde", "verdes", "green", "oliva", "militar", "verde militar", "kaki", "esmeralda", "menta", "sage", "botella", "verde botella", "musgo", "selva", "lima", "verde francia", "verde ingles", "verde inglés", "verde seco", "verde bosque", "verde jade", "verde manzana", "verde oscuro", "verde pastel"],
    "marron": ["marron", "marrón", "marrones", "cafe", "café", "tabaco", "cognac", "camel", "cuero", "chocolate", "tierra", "havana", "walnut", "tobacco", "avellana", "canela"],
    "suela": ["suela", "teja", "madera", "castano", "castaño", "castañas", "nuez", "roble", "cobre", "cobre viejo"],
    "rosa": ["rosa", "rosas", "pink", "fucsia", "salmon", "salmón", "palo de rosa", "flamingo", "blush", "magenta", "hot pink", "rosa pastel"],
    "lila": ["lila", "lilas", "violeta", "violetas", "morado", "morada", "purple", "lavanda", "lavender", "malva", "orquidea", "orquídea", "amatista", "uva", "berenjena", "violeta pastel"],
    "gris": ["gris", "grises", "grey", "gray", "plata", "plateado", "plateada", "antracita", "grafito", "piedra", "humo", "ceniza", "gris topo"],
    "acero": ["acero", "acero inoxidable", "steel", "inox", "inoxidable", "metalico", "metálico", "cromado"],
    "dorado": ["dorado", "dorada", "dorados", "doradas", "gold", "oro", "champagne", "bronce"],
    "oro_rosa": ["oro rosa", "rose gold", "rosegold", "oro rosado"],
    "oro_blanco": ["oro blanco", "white gold", "plata brillante"],
    "ambar": ["ambar", "ámbar", "amber", "ambarino", "ambarina", "topacio", "miel oscura"],
    "naranja": ["naranja", "naranjas", "orange", "oxido", "óxido", "mango", "calabaza", "ladrillo", "brick", "anaranjado", "anaranjada", "anaranjados", "anaranjadas", "bermellon", "bermellón", "naranja pastel"],
    "terracota": ["terracota", "terracotta", "coral", "teja clara", "ocre rojo", "arcilla", "canyon"],
    "amarillo": ["amarillo", "amarilla", "amarillos", "amarillas", "yellow", "ocre", "mostaza", "limón", "limon", "canario", "miel", "amarillo pastel"],
    "beige": ["beige", "beis", "nude", "arena", "tostado", "tostada", "nute", "nutes", "vison", "visón", "bisón", "bison", "taupe", "natural", "crudo", "ecru", "lino", "caqui claro"],
    "rosa_palo": ["rosa palo", "nude rosa", "piel", "skin", "durazno", "peach", "albaricoque", "apricot", "melocoton", "melocotón"],
    "turquesa": ["turquesa", "turquoise", "agua", "aqua", "aguamarina", "tiffany", "verde agua", "aqua marine"],
    "bordeaux": ["bordeaux", "bordo", "bordeau", "burdeos", "vino", "vino tinto", "vinotinto", "granate", "granate oscuro", "marsala"],
    "multicolor": ["multicolor", "estampado", "colores", "tie dye", "tie-dye", "multicolores", "arcoiris", "arco iris", "rainbow", "camuflado", "camuflada", "camo"],
    "tornasol": ["tornasol", "tornasoles", "tornasolado", "tornasolada", "tornasolados", "tornasoladas", "iridiscente", "iridiscentes", "irisado", "irisada", "holografico", "holográfico"],
    "tornasol_amarillo": ["tornasol amarillo", "tornasol dorado", "amarillo tornasol", "dorado tornasol"],
    "tornasol_azul": ["tornasol azul", "azul tornasol"],
    "tornasol_rojo": ["tornasol rojo", "rojo tornasol", "rojo tornasolado", "tornasol rojizo"],
    "tornasol_verde": ["tornasol verde", "verde tornasol"],
    "tornasol_rosa": ["tornasol rosa", "tornasol rosado", "rosa tornasol"],
    "tornasol_violeta": ["tornasol violeta", "tornasol morado", "violeta tornasol"],
};

const COLOR_CSS = {
    "negro": "#111", "negra": "#111", "negros": "#111", "negras": "#111",
    "ebano": "#111", "carbon": "#1a1a1a", "carbón": "#1a1a1a", "noche": "#0d0d0d",
    "black": "#111",
    "oscuro": "#1a1a1a", "oscura": "#1a1a1a", "oscuros": "#1a1a1a", "oscuras": "#1a1a1a",

    "blanco": "#f5f5f5", "blanca": "#f5f5f5", "blancos": "#f5f5f5", "blancas": "#f5f5f5",
    "white": "#f5f5f5", "marfil": "#fffff0", "crema": "#fffdd0", "tiza": "#f0ece4",
    "perla": "#f0e8d8", "nieve": "#fafafa", "ivory": "#fffff0", "blanquito": "#f5f5f5",

    "rojo": "#c62828", "roja": "#c62828", "rojos": "#c62828", "rojas": "#c62828",
    "red": "#c62828", "escarlata": "#d50000", "carmesi": "#b71c1c", "carmesí": "#b71c1c",
    "cereza": "#880e4f", "sangre": "#7b0000",

    "bordo": "#6d1b2e", "bordeau": "#6d1b2e", "bordeaux": "#6d1b2e",
    "burdeos": "#6d1b2e", "vino": "#6d1b2e", "vino tinto": "#6d1b2e",
    "granate": "#7b2d3a", "granate oscuro": "#5c1a26", "marsala": "#955251",

    "azul": "#1565c0", "azules": "#1565c0", "blue": "#1565c0",
    "marino": "#0d2b6b", "navy": "#0d2b6b", "celeste": "#64b5f6",
    "cobalto": "#1a3a8f", "zafiro": "#003153", "klein": "#002fa7",
    "royal": "#1a3a8f", "indigo": "#3949ab", "índigo": "#3949ab",
    "petroleo": "#00454a", "petróleo": "#00454a",
    "azul marino": "#0d2b6b", "azul cielo": "#64b5f6", "cielo": "#64b5f6",
    "azul oscuro": "#0a2a5e", "azul pastel": "#a9c9ec",

    "verde": "#2e7d32", "verdes": "#2e7d32", "green": "#2e7d32",
    "azul francia": "#318ce7",
    "azul rey": "#1434a4",
    "azul electrico": "#0066ff", "azul eléctrico": "#0066ff",
    "azul bebe": "#a7c6ed", "azul bebé": "#a7c6ed",
    "azul acero": "#4863a0",

    "verde militar": "#4b5320",
    "verde ingles": "#123524", "verde inglés": "#123524",
    "verde seco": "#7a7a52",
    "verde bosque": "#0b3d24",
    "verde jade": "#00a86b",
    "verde botella": "#1b4d2e",
    "oliva": "#6b6b2a", "militar": "#4a5240", "kaki": "#8b8040",
    "esmeralda": "#004d40", "menta": "#80cbc4", "sage": "#7d9b76",
    "botella": "#1b4d2e", "musgo": "#556b2f", "selva": "#1a3a26",
    "lima": "#8bc34a", "verde francia": "#267f00",
    "verde manzana": "#8db600",
    "verde oscuro": "#0d3b1e", "verde pastel": "#b8ddc4",

    "marron": "#6d4c41", "marrón": "#6d4c41", "marrones": "#6d4c41",
    "cafe": "#6d4c41", "café": "#6d4c41", "tabaco": "#7a5230",
    "cognac": "#9b5e28", "camel": "#c19a6b", "cuero": "#8b5a2b",
    "chocolate": "#4e342e", "tierra": "#795548", "havana": "#5d3a1a",
    "walnut": "#5c4033", "tobacco": "#7a5230", "avellana": "#9e7b5a",

    "suela": "#8B5E3C", "teja": "#b05c34", "madera": "#8b6347",
    "castano": "#7b4f2e", "castaño": "#7b4f2e", "nuez": "#7a4e2d",
    "roble": "#8c6239", "cobre": "#b87333", "cobre viejo": "#a06535",
    "castañas": "#7b4f2e",

    "rosa": "#e91e8c", "rosas": "#e91e8c", "pink": "#e91e8c",
    "fucsia": "#c2185b", "salmon": "#ff8a65", "salmón": "#ff8a65",
    "palo de rosa": "#d4a0a0", "flamingo": "#fc8eac", "blush": "#f4a7b9",
    "magenta": "#e040fb", "hot pink": "#ff4081",
    "rosa pastel": "#f5c6d8",

    "rosa palo": "#e8c5b0", "nude rosa": "#e0b49a", "piel": "#d4a882",
    "skin": "#d4a882", "durazno": "#ffb347", "peach": "#ffcba4",
    "albaricoque": "#f4a460", "apricot": "#f4a460",
    "melocoton": "#ff8c69", "melocotón": "#ff8c69",

    "lila": "#ba68c8", "lilas": "#ba68c8", "violeta": "#7e57c2",
    "violetas": "#7e57c2", "morado": "#6a1b9a", "morada": "#6a1b9a",
    "purple": "#6a1b9a", "lavanda": "#b39ddb", "lavender": "#b39ddb",
    "malva": "#9c4f96", "orquidea": "#da70d6", "orquídea": "#da70d6",
    "amatista": "#9b59b6", "violeta pastel": "#d8c2ec",

    "gris": "#757575", "grises": "#757575", "grey": "#757575", "gray": "#757575",
    "plata": "#b0bec5", "plateado": "#b0bec5", "plateada": "#b0bec5",
    "antracita": "#3d3d3d", "grafito": "#4a4a4a",
    "piedra": "#9e9e8f", "humo": "#8d8d8d", "ceniza": "#ababab",
    "gris topo": "#8a7f70",

    "acero": "#8da9bc", "acero inoxidable": "#8da9bc", "steel": "#8da9bc",
    "inox": "#9eb4c4", "inoxidable": "#9eb4c4",
    "metalico": "#a0aab4", "metálico": "#a0aab4", "cromado": "#b8c4cc",

    "dorado": "#c9a84c", "dorada": "#c9a84c", "dorados": "#c9a84c", "doradas": "#c9a84c",
    "gold": "#c9a84c", "oro": "#c9a84c", "champagne": "#f5e6c8", "bronce": "#8c6a2f",

    "naranja": "#ef6c00", "naranjas": "#ef6c00", "orange": "#ef6c00",
    "oxido": "#bf4e0a", "óxido": "#bf4e0a", "mango": "#e67e22",
    "calabaza": "#d35400", "ladrillo": "#b94a2c", "brick": "#b94a2c",
    "anaranjado": "#ef6c00", "anaranjada": "#ef6c00", "anaranjados": "#ef6c00", "anaranjadas": "#ef6c00",
    "naranja pastel": "#f7bd8a",

    "terracota": "#c0522a", "terracotta": "#c0522a", "coral": "#e8735a",
    "teja clara": "#c1603a", "ocre rojo": "#b5451b", "arcilla": "#c1694f",
    "canyon": "#c96a40",

    "amarillo": "#f9a825", "amarilla": "#f9a825", "amarillos": "#f9a825", "amarillas": "#f9a825",
    "yellow": "#f9a825", "ocre": "#cc8800", "mostaza": "#c9a227",
    "limón": "#d4e157", "limon": "#d4e157", "canario": "#ffe082", "miel": "#e6ac00",
    "amarillo pastel": "#fbe8a6",

    "beige": "#d4b896", "beis": "#d4b896", "nude": "#d4b49c", "arena": "#c2a882",
    "tostado": "#b8915a", "tostada": "#b8915a", "nute": "#ceb49a", "nutes": "#ceb49a",
    "vison": "#c4a882", "visón": "#c4a882", "bisón": "#c4a882", "bison": "#c4a882",
    "taupe": "#b09880", "natural": "#d2b48c", "crudo": "#c8b89a",
    "ecru": "#c8b89a", "lino": "#cdc2a8", "caqui claro": "#c2b280",

    "turquesa": "#00897b", "turquoise": "#00897b", "agua": "#00acc1",
    "aqua": "#00bcd4", "aguamarina": "#00bfa5", "tiffany": "#0abfbc",
    "verde agua": "#4db6ac", "aqua marine": "#7fffd4",

    "multicolor": "linear-gradient(135deg,#e53935,#1e88e5,#43a047,#fdd835)",
    "estampado": "linear-gradient(135deg,#e53935,#1e88e5,#43a047,#fdd835)",
    "colores": "linear-gradient(135deg,#e53935,#1e88e5,#43a047,#fdd835)",
    "multicolores": "linear-gradient(135deg,#e53935,#1e88e5,#43a047,#fdd835)",
    "arcoiris": "linear-gradient(135deg,#e53935,#fb8c00,#fdd835,#43a047,#1e88e5,#8e24aa)",
    "arco iris": "linear-gradient(135deg,#e53935,#fb8c00,#fdd835,#43a047,#1e88e5,#8e24aa)",
    "rainbow": "linear-gradient(135deg,#e53935,#fb8c00,#fdd835,#43a047,#1e88e5,#8e24aa)",
    "camuflado": "linear-gradient(135deg,#4b5320,#6b6b2a,#3d3d2e,#7a7a52)",
    "camuflada": "linear-gradient(135deg,#4b5320,#6b6b2a,#3d3d2e,#7a7a52)",
    "camo": "linear-gradient(135deg,#4b5320,#6b6b2a,#3d3d2e,#7a7a52)",

    "tornasol": "linear-gradient(135deg,#7b2ff7,#00c6ff,#00e0a8,#f7d046)",
    "tornasoles": "linear-gradient(135deg,#7b2ff7,#00c6ff,#00e0a8,#f7d046)",
    "tornasolado": "linear-gradient(135deg,#7b2ff7,#00c6ff,#00e0a8,#f7d046)",
    "tornasolada": "linear-gradient(135deg,#7b2ff7,#00c6ff,#00e0a8,#f7d046)",
    "tornasolados": "linear-gradient(135deg,#7b2ff7,#00c6ff,#00e0a8,#f7d046)",
    "tornasoladas": "linear-gradient(135deg,#7b2ff7,#00c6ff,#00e0a8,#f7d046)",
    "iridiscente": "linear-gradient(135deg,#7b2ff7,#00c6ff,#00e0a8,#f7d046)",
    "iridiscentes": "linear-gradient(135deg,#7b2ff7,#00c6ff,#00e0a8,#f7d046)",
    "irisado": "linear-gradient(135deg,#7b2ff7,#00c6ff,#00e0a8,#f7d046)",
    "irisada": "linear-gradient(135deg,#7b2ff7,#00c6ff,#00e0a8,#f7d046)",
    "holografico": "linear-gradient(135deg,#7b2ff7,#00c6ff,#00e0a8,#f7d046)",
    "holográfico": "linear-gradient(135deg,#7b2ff7,#00c6ff,#00e0a8,#f7d046)",

    "tornasol amarillo": "linear-gradient(135deg,#f7d046,#ffef8a,#f9a825,#fff3c4)",
    "tornasol dorado": "linear-gradient(135deg,#f7d046,#ffef8a,#c9a84c,#fff3c4)",
    "amarillo tornasol": "linear-gradient(135deg,#f7d046,#ffef8a,#f9a825,#fff3c4)",
    "dorado tornasol": "linear-gradient(135deg,#f7d046,#ffef8a,#c9a84c,#fff3c4)",

    "tornasol azul": "linear-gradient(135deg,#1565c0,#64b5f6,#00c6ff,#3949ab)",
    "azul tornasol": "linear-gradient(135deg,#1565c0,#64b5f6,#00c6ff,#3949ab)",

    "tornasol rojo": "linear-gradient(135deg,#c62828,#ff6659,#e91e8c,#8d0000)",
    "rojo tornasol": "linear-gradient(135deg,#c62828,#ff6659,#e91e8c,#8d0000)",
    "rojo tornasolado": "linear-gradient(135deg,#c62828,#ff6659,#e91e8c,#8d0000)",
    "tornasol rojizo": "linear-gradient(135deg,#c62828,#ff6659,#e91e8c,#8d0000)",

    "tornasol verde": "linear-gradient(135deg,#00a86b,#80cbc4,#00e0a8,#2e7d32)",
    "verde tornasol": "linear-gradient(135deg,#00a86b,#80cbc4,#00e0a8,#2e7d32)",

    "tornasol rosa": "linear-gradient(135deg,#e91e8c,#f4a7b9,#ff4081,#fc8eac)",
    "tornasol rosado": "linear-gradient(135deg,#e91e8c,#f4a7b9,#ff4081,#fc8eac)",
    "rosa tornasol": "linear-gradient(135deg,#e91e8c,#f4a7b9,#ff4081,#fc8eac)",

    "tornasol violeta": "linear-gradient(135deg,#7e57c2,#ba68c8,#9b59b6,#b39ddb)",
    "tornasol morado": "linear-gradient(135deg,#7e57c2,#ba68c8,#9b59b6,#b39ddb)",
    "violeta tornasol": "linear-gradient(135deg,#7e57c2,#ba68c8,#9b59b6,#b39ddb)",

    "bermellon": "#e34234", "bermellón": "#e34234",
    "tie dye": "linear-gradient(135deg,#e91e63,#9c27b0,#3f51b5,#00bcd4,#4caf50)",
    "tie-dye": "linear-gradient(135deg,#e91e63,#9c27b0,#3f51b5,#00bcd4,#4caf50)",

    "ambar": "#c1810f", "ámbar": "#c1810f", "amber": "#c1810f",
    "ambarino": "#c1810f", "ambarina": "#c1810f", "miel oscura": "#a86b0a",
    "topacio": "#d99a2b",

    "oro rosa": "#e0a89a", "rose gold": "#e0a89a", "rosegold": "#e0a89a", "oro rosado": "#e0a89a",
    "oro blanco": "#d9d9d9", "white gold": "#d9d9d9", "plata brillante": "#e0e0e0",

    "rubi": "#9b111e", "rubí": "#9b111e",

    "nacarado": "linear-gradient(135deg,#f5f5f5,#e8dff0,#d8ecf0,#fdf6e3)",
    "nacarada": "linear-gradient(135deg,#f5f5f5,#e8dff0,#d8ecf0,#fdf6e3)",
    "vainilla": "#f3e5ab",

    "denim": "#3b5a80", "jean": "#3b5a80",
    "vinotinto": "#5c1a26",

    "canela": "#a0522d",
    "uva": "#6a3b8c", "berenjena": "#4b1e40",
};

const COLOR_CSS_KEYS_ORDENADAS = Object.keys(COLOR_CSS).sort((a, b) => b.length - a.length);

function _normalizarColorTexto(texto) {
    return texto.toLowerCase().trim()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function _buscarEnColorCSS(norm) {
    if (COLOR_CSS[norm]) return COLOR_CSS[norm];
    for (const key of COLOR_CSS_KEYS_ORDENADAS) {
        if (norm.includes(key)) return COLOR_CSS[key];
    }
    return null;
}

function colorACSS(nombreColor) {
    if (!nombreColor || nombreColor === "—") return "#ccc";


    const normCompleto = _normalizarColorTexto(nombreColor.replace(/[\/,]+/g, " ").replace(/\s+/g, " "));
    if (COLOR_CSS[normCompleto]) return COLOR_CSS[normCompleto];


    const primero = nombreColor.split(/[\/,]/).map(c => c.trim()).filter(Boolean)[0] || nombreColor;
    const norm = _normalizarColorTexto(primero);
    const matchPrimero = _buscarEnColorCSS(norm);
    if (matchPrimero) return matchPrimero;

    if (typeof CSS !== "undefined" && CSS.supports && CSS.supports("color", norm)) return norm;
    return "#ccc";
}
function renderSwatchesColor(prodActual) {
    const swatchBox = document.getElementById("modalColorSwatches");
    if (!swatchBox) return;

    const nombreNorm = normalizar(prodActual.Nombre || "");
    const modeloNorm = normalizar(prodActual.Modelo || "");
    const variantes = productosData.filter(p =>
        normalizar(p.Nombre || "") === nombreNorm &&
        normalizar(p.Modelo || "") === modeloNorm
    );

    if (variantes.length <= 1) {
        swatchBox.style.display = "none";
        swatchBox.innerHTML = "";
        return;
    }
    swatchBox.style.display = "flex";
    swatchBox.innerHTML = "";
    variantes.forEach(variante => {
        const colorNombre = variante.Color || variante.color || "—";
        const colorCSS = colorACSS(colorNombre);
        const esActivo = variante.IdProducto === prodActual.IdProducto;
        const swatch = document.createElement("button");
        swatch.className = "color-swatch" + (esActivo ? " activo" : "");
        swatch.title = colorNombre;
        swatch.setAttribute("aria-label", `Color ${colorNombre}`);
        swatch.setAttribute("type", "button");

        if (colorCSS.startsWith("linear-gradient")) {
            swatch.style.background = colorCSS;
        } else {
            swatch.style.background = colorCSS;
        }

        swatch.addEventListener("click", () => {
            if (variante.IdProducto === productoSeleccionado?.IdProducto) return;
            abrirModal(variante);
        });
        swatchBox.appendChild(swatch);
    });
}
function expandirConSinonimos(color) {
    if (!color || color === "—") return "";
    const colorNorm = normalizar(color.replace(/[\/,]+/g, " "));
    const palabrasColor = colorNorm.split(/\s+/).filter(Boolean);
    const resultado = new Set(palabrasColor);
    let huboMatch = false;
    for (const [canonical, sinonimos] of Object.entries(COLOR_SINONIMOS)) {
        const coincide = sinonimos.some(s => palabrasColor.includes(s) || colorNorm.includes(s));
        if (coincide) {
            huboMatch = true;
            sinonimos.forEach(s => resultado.add(s));
        }
    }
    return huboMatch ? Array.from(resultado).join(" ") : colorNorm;
}

function expandirGenero(genero) {
    if (!genero || genero === "—") return "";
    const n = normalizar(String(genero));
    if (n.includes("unisex"))
        return "unisex hombre mujer masculino femenino caballero dama varon";
    if (n.includes("mujer") || n.includes("femen") || n.includes("dama") || n === "f")
        return "mujer femenino dama";
    if (n.includes("hombre") || n.includes("mascul") || n.includes("caballero") || n.includes("varon") || n === "m")
        return "hombre masculino caballero varon";
    return n;
}
function recalcularCamposBusqueda(prod) {
    const altoStr = prod.Alto && prod.Alto !== "—" ? String(prod.Alto) : null;
    const anchoStr = prod.Ancho && prod.Ancho !== "—" ? String(prod.Ancho) : null;
    const profStr = prod.Profundidad && prod.Profundidad !== "—" ? String(prod.Profundidad) : null;
    const pesoStr = prod.Peso && prod.Peso !== "—" ? String(prod.Peso) : null;
    const diamStr = prod.Diametro && prod.Diametro !== "—" ? String(prod.Diametro) : null;


    const colorNorm = prod.Color && prod.Color !== "—"
        ? normalizar(prod.Color.replace(/[\/,]+/g, " ").replace(/-/g, " "))
        : "";
    prod._indiceBusqueda = {
        nombre: normalizar(prod.Nombre || ""),
        modelo: normalizar(prod.Modelo || ""),
        color: normalizar(prod.Color || ""),
        marca: normalizar(prod.Marca || ""),
        material: normalizar(prod.Material || ""),
        tipo: normalizar(normalizarTipo(prod.Tipo || "")),
        categoria: normalizar(prod.Categoria || ""),
        genero: normalizar(prod.Genero || ""),
        alto: prod.Alto ? String(prod.Alto) : "",
        ancho: prod.Ancho ? String(prod.Ancho) : "",
        profundidad: prod.Profundidad ? String(prod.Profundidad) : "",
        diametro: prod.Diametro ? String(prod.Diametro) : ""
    };
    prod._camposNormalizados = [
        prod.Nombre, prod.Modelo, colorNorm,
        prod.Marca, prod.Material, prod.Tipo,
        prod.Capacidad, prod.Categoria,
        expandirGenero(prod.Genero), prod.TipoCierre,
        String(prod.Stock ?? ""),
        prod.Compartimentos !== "—" ? String(prod.Compartimentos) : null,
        prod.CantidadRuedas !== "—" ? String(prod.CantidadRuedas) : null,
        prod.Disponible ? "disponible" : "sin stock",
        prod.FuelleExpandible === true ? "fuelle expandible" : null,
        prod.FuelleExpandible === false ? "sin fuelle" : null,
        altoStr ? `alto ${altoStr}cm` : null,
        altoStr ? `alto ${altoStr} cm` : null,
        altoStr ? altoStr + "cm" : null,
        altoStr ? altoStr + " cm" : null,
        anchoStr ? `ancho ${anchoStr}cm` : null,
        anchoStr ? anchoStr + "cm" : null,
        anchoStr ? anchoStr + " cm" : null,
        profStr ? `largo ${profStr}cm` : null,
        profStr ? `largo ${profStr} cm` : null,
        profStr ? profStr + "cm" : null,
        pesoStr ? pesoStr + "g" : null,
        pesoStr ? pesoStr + " g" : null,
        diamStr ? diamStr + "mm" : null,
        diamStr ? diamStr + " mm" : null,
        altoStr, anchoStr, profStr, pesoStr, diamStr,
        prod.Color && prod.Color !== "—" ? expandirConSinonimos(prod.Color) : null,
        prod.Material && prod.Material !== "—" ? expandirConSinonimos(prod.Material) : null,
    ].filter(v => v && v !== "—" && v !== "null" && String(v).trim() !== "")
        .join(" ")
        .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/-/g, " ");
    prod._tokensBusqueda = prod._camposNormalizados.split(/\s+/).filter(Boolean);
    return prod;
}
function renderSkeletons(cantidad = 8) {
    const contenedor = document.getElementById("contenedor-productos");
    if (!contenedor) return;
    contenedor.innerHTML = "";
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < cantidad; i++) {
        const skel = document.createElement("div");
        skel.className = "product-card-skeleton";
        skel.innerHTML = `
            <div class="skeleton-image"></div>
            <div class="skeleton-title"></div>
            <div class="skeleton-price"></div>
            <div class="skeleton-buttons"></div>
        `;
        fragment.appendChild(skel);
    }
    contenedor.appendChild(fragment);
}

async function cargarProductos(forzar = false) {
    if (isLoadingProductos) return;
    isLoadingProductos = true;
    try {
        const cacheKey = "delicata_productos_v1";
        const cacheTsKey = "delicata_productos_ts";
        const MAX_AGE = 5 * 60 * 1000;
        const ahora = Date.now();
        const ts = parseInt(localStorage.getItem(cacheTsKey) || "0");
        const cacheVigente = !forzar && (ahora - ts) < MAX_AGE && !!localStorage.getItem(cacheKey);
        const cachedRaw = cacheVigente ? localStorage.getItem(cacheKey) : null;
        if (cachedRaw) {
            try {
                const cached = JSON.parse(cachedRaw);
                if (cached?.length > 0) {
                    productosData = cached;
                    aplicarFiltros();
                }
            } catch (e) {
                localStorage.removeItem(cacheKey);
            }
        } else {
            renderSkeletons(8);
        }

        const resp = await fetch(`${API_URL}?_=${Date.now()}`, {
            cache: "no-store"
        });
        if (!resp.ok) throw new Error("Error cargando productos");
        const data = await resp.json();
        const nuevos = data.map(p => {
            const prod = normalizarProducto(p);
            return recalcularCamposBusqueda(prod);
        });
        try {
            localStorage.setItem(cacheKey, JSON.stringify(nuevos));
            localStorage.setItem(cacheTsKey, String(Date.now()));
        } catch (e) {
        }
        productosData = nuevos;
        aplicarFiltros();
    } catch (err) {
        console.error("Error cargando productos", err);
        if (productosData.length === 0) {
            const contenedor = document.getElementById("contenedor-productos");
            contenedor.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--color-marca-oro);">
                <p style="font-size:1.1rem; margin-bottom:12px;">⏳ El servidor está iniciando, esto puede tardar hasta 1 minuto...</p>
                <p style="font-size:0.9rem; opacity:0.7;">Por favor esperá y recargá la página en unos segundos.</p>
            </div>`;
        }
    } finally {
        isLoadingProductos = false;
    }
}
function levenshtein(a, b) {
    const m = a.length, n = b.length;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
        const curr = [i];
        for (let j = 1; j <= n; j++) {
            curr[j] = a[i - 1] === b[j - 1]
                ? prev[j - 1]
                : 1 + Math.min(prev[j], curr[j - 1], prev[j - 1]);
        }
        prev = curr;
    }
    return prev[n];
}
function parsearGrupos(textoBusqueda) {
    const raw = textoBusqueda.split(/\s+/).filter(Boolean);
    const grupos = [];
    for (let i = 0; i < raw.length; i++) {
        const tok = raw[i];
        if (PALABRAS_IGNORAR.has(tok)) continue;

        if (tok === "y" || tok === "o") continue;
        const prevRaw = i > 0 ? raw[i - 1] : null;
        if ((prevRaw === "y" || prevRaw === "o") && grupos.length > 0) {
            grupos[grupos.length - 1].push(tok);
        } else {
            grupos.push([tok]);
        }
    }
    return grupos;
}

function raizAdjetivo(p) {
    return normalizarTermino(p).replace(/[oa]$/, "");
}
function palabraMatchFuzzy(palabra, tokens) {
    if (/^\d+([.,]\d+)?$/.test(palabra)) {
        return tokens.includes(palabra);
    }

    if (tokens.includes(palabra)) return true;

    if (tokens.some(token => token.startsWith(palabra))) return true;

    if (palabra.length >= 4) {
        const raiz = raizAdjetivo(palabra);
        if (raiz.length >= 3 && tokens.some(token => token.length >= 4 && raizAdjetivo(token) === raiz)) {
            return true;
        }
    }

    if (palabra.length <= 5) return false;
    if (palabra.length >= 8) {
        const prefijo = palabra.slice(0, 4);
        return tokens.some(token => {
            if (!token.startsWith(prefijo)) return false;
            if (Math.abs(token.length - palabra.length) > 2) return false;
            return levenshtein(palabra, token) <= 1;
        });
    }

    return false;
}

const PALABRAS_IGNORAR = new Set([
    "con", "de", "para", "del", "en", "a", "el", "la", "los", "las", "un", "una", "unos", "unas",
    "modelo", "color", "medidas", "marca", "material", "tipo", "categoria",
    "lrg", "alt", "capacidad", "compartimentos",
    "cierre", "simple", "doble",
    "por", "x", "cm", "mm", "y", "o", "u",
    "milimetros", "profundidad", "peso", "g", "diametro",
    "stock", "genero", "cantidad", "ruedas", "triple",
    "imantado", "a presion",
    "quiero", "queres", "quiere", "queremos", "quieren",
    "quisiera", "quisieras", "quisieramos", "quisiese",
    "queria", "querias", "queriamos",
    "querria", "querrias",
    "necesito", "necesitas", "necesita", "necesitamos", "necesitan",
    "preciso", "precisas", "precisa", "precisamos",
    "busco", "buscas", "busca", "buscamos", "buscan", "buscando", "buscar",
    "encontrar", "encuentro", "encuentras",
    "gustaria", "gustarian", "gustan", "gusta",
    "dame", "denme",
    "mostrame", "muestrame", "mostrar", "mostrarme", "mostranos",
    "ensename", "pasame", "traeme", "trae",
    "recomendame", "recomendar", "recomendas", "recomienda",
    "ayudame", "ayuda",
    "tenes", "tiene", "tienen", "tienes", "tenemos", "hay", "habia",
    "ver", "vean", "veo", "mira", "mirar", "mirando", "fijate", "fijense",
    "hola", "buenas", "buenos", "buen",
    "porfa", "porfavor", "favor", "disculpa", "disculpe", "perdon",
    "che", "onda", "bueno", "eh", "este", "osea",
    "algo", "alguna", "algun", "algunos", "algunas", "cualquier", "cualquiera",
    "varios", "varias",
    "podrias", "podes", "puedo", "puedes", "puede", "pueden",
    "sabes", "sabria", "me", "te", "se", "nos", "porque",
    "producto", "productos", "articulo", "articulos", "item", "items"
]);
const BUSQUEDA_ALIAS = {
    "dama": "mujer",
    "femenino": "mujer",
    "masculino": "hombre",
    "caballero": "hombre",
    "varon": "hombre",
};
function normalizarBusqueda(texto) {
    return texto.split(/\s+/).map(p => BUSQUEDA_ALIAS[p] || p).join(" ");
}
function normalizarTermino(p) {
    return p
        .replace(/os$/, "o")
        .replace(/as$/, "a")
        .replace(/([^aeiou]{2,})es$/, "$1")
        .replace(/([^aeiou])es$/, "$1");
}
function extraerFiltrosBusqueda(texto) {
    texto = normalizar(texto);
    const filtros = {};

    let m = texto.match(/(\d+(?:[.,]\d+)?)\s*cm\s*de\s*alto/);
    if (!m) m = texto.match(/alto\s*(\d+(?:[.,]\d+)?)/);
    if (m) filtros.alto = m[1].replace(",", ".");

    m = texto.match(/(\d+(?:[.,]\d+)?)\s*cm\s*de\s*ancho/);
    if (!m) m = texto.match(/ancho\s*(\d+(?:[.,]\d+)?)/);
    if (m) filtros.ancho = m[1].replace(",", ".");
    return filtros;
}
function matchBusquedaFuzzy(tokensProducto, textoBusqueda) {
    const grupos = parsearGrupos(textoBusqueda);
    if (grupos.length === 0) return true;
    return grupos.every(alternativas =>
        alternativas.some(palabra => {
            const normalizada = normalizarTermino(palabra);
            return palabraMatchFuzzy(palabra, tokensProducto) ||
                palabraMatchFuzzy(normalizada, tokensProducto);
        })
    );
}
function filtroAceroMaterial(textoBusqueda, prod) {
    const m = textoBusqueda.match(/\bacero\s+(blanco|dorado|quirurgico|quirúrgico)\b/);
    if (!m) return null;
    const variante = m[1].normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const materialNorm = prod._indiceBusqueda.material;
    return materialNorm.indexOf("acero " + variante) !== -1;
}
const CATEGORIAS_MAP = {
    "marroquineria": "marroquineria",
    "bijouterie": "bijouterie",
    "complementos": "complementos",
    "articulos de viaje": "articulos de viaje",
    "piercing": "piercing",
    "panoleria": "panoleria"
};
const aplicarFiltros = (preservarPaginacion = false) => {
    const productosYaRenderizadosPrevios = productosRenderizados;
    const categoriaActivaRaw = categoriaActivaActual;
    const categoriaActiva = categoriaActivaRaw;

    let base;
    if (categoriaActiva === "" || categoriaActiva === "todos") {
        base = [...productosData];
    } else {
        base = productosData.filter(p => {
            const cat = normalizar(
                p.Categoria?.Nombre ||
                p.categoria?.Nombre ||
                p.Categoria ||
                p.categoria || ""
            );
            return cat === categoriaActiva || cat.startsWith(categoriaActiva);
        });
    }


    if (subcategoriaActivaActual !== "") {
        base = base.filter(p => {
            const tipo = normalizar(
                p.Tipo?.Nombre ||
                p.tipo?.Nombre ||
                p.Tipo ||
                p.tipo || ""
            );
            return tipo === subcategoriaActivaActual ||
                tipo.startsWith(subcategoriaActivaActual) ||
                tipo.includes(subcategoriaActivaActual) ||
                subcategoriaActivaActual.includes(tipo);
        });
    }

    if (modoNuevosActivo) {
        productosFiltrados = [...base]
            .sort((a, b) => (b.IdProducto ?? 0) - (a.IdProducto ?? 0))
            .slice(0, CANTIDAD_NUEVOS);
        productosRenderizados = 0;
        renderizarProductosProgresivo(true);
        while (productosRenderizados < productosFiltrados.length) {
            renderizarProductosProgresivo();
        }
        const btnVerMas = document.getElementById("btnVerMas");
        if (btnVerMas) btnVerMas.style.display = "none";
        return;
    }

    const textoBusqueda = normalizarBusqueda(
        normalizar(domCache.searchInput?.value || "")
            .replace(/[\/,]+/g, " ")
            .replace(/-/g, " ")
            .replace(/\balt\.?\b/gi, "alto")
            .replace(/\blrg\.?\b/gi, "largo")
            .replace(/\bpor\b/gi, "")
            .replace(/\bx\b/g, "")
            .trim()
    );
    if (textoBusqueda !== "") {
        const filtros = extraerFiltrosBusqueda(textoBusqueda);
        const tipoExacto = extraerTipoExacto(textoBusqueda);
        const textoParaFuzzy = tipoExacto ? tipoExacto.textoRestante : textoBusqueda;

        base = base.filter(p => {
            const idx = p._indiceBusqueda;
            const filtroAcero = filtroAceroMaterial(textoBusqueda, p);
            if (filtroAcero !== null) return filtroAcero;
            if (filtros.alto && parseFloat(idx.alto.replace(",", ".")) !== parseFloat(filtros.alto)) return false;
            if (filtros.ancho && parseFloat(idx.ancho.replace(",", ".")) !== parseFloat(filtros.ancho)) return false;

            if (tipoExacto) {
                if (idx.tipo === tipoExacto.tipo) {
                    return textoParaFuzzy === "" || matchBusquedaFuzzy(p._tokensBusqueda, textoParaFuzzy);
                }

                return matchBusquedaFuzzy(p._tokensBusqueda, textoBusqueda);
            }

            if (textoParaFuzzy === "") return true;
            return matchBusquedaFuzzy(p._tokensBusqueda, textoParaFuzzy);
        });
    }
    productosFiltrados = base;
    productosRenderizados = 0;
    const contenedor = document.getElementById("contenedor-productos");
    if (productosFiltrados.length === 0) {
        contenedor.querySelectorAll(".product-card").forEach(card => cardObserver.unobserve(card));
        contenedor.replaceChildren();
        contenedor.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:50px;color:var(--color-marca-oro);">
                <p>No se encontraron productos para "${document.getElementById("searchInput")?.value}"</p>
            </div>`;
        const btnVerMas = document.getElementById("btnVerMas");
        if (btnVerMas) btnVerMas.style.display = "none";
        return;
    }
    if (preservarPaginacion) {
        const objetivo = Math.min(productosYaRenderizadosPrevios, productosFiltrados.length);
        renderizarProductosProgresivo(true);
        while (productosRenderizados < objetivo) {
            renderizarProductosProgresivo();
        }
    } else {
        renderizarProductosProgresivo(true);
    }
};