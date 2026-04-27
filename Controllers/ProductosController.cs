using DELICATA_ELEGANZA.Data;
using DELICATA_ELEGANZA.DTO;
using DELICATA_ELEGANZA.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.IO;
using System.Linq;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Formats.Webp;

namespace DELICATA_ELEGANZA.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductosController : ControllerBase
    {
        private readonly DelicataContext _context;

        public ProductosController(DelicataContext context)
        {
            _context = context;
        }

        // ============================================================
        // GET: api/Productos
        // ============================================================
        [HttpGet]
        public async Task<IActionResult> GetProductos()
        {
            try
            {
                var productos = await _context.Productos
                    .AsNoTracking()
                    .Select(p => new ProductoDTO
                    {
                        IdProducto = p.id_producto,
                        Nombre = p.Nombre,
                        Modelo = p.Modelo,
                        Color = p.Color,

                        IdCategoria = p.id_categoria,
                        Categoria = p.Categoria != null ? p.Categoria.Nombre : "Sin categoría",

                        IdMarca = p.id_marca,
                        Marca = p.Marca != null ? p.Marca.Nombre : "Sin marca",

                        IdMaterial = p.id_material,
                        Material = p.Material != null ? p.Material.Nombre : "Sin material",

                        IdTipo = p.id_tipo,
                        Tipo = p.Tipo != null ? p.Tipo.Nombre : "Sin tipo",

                        Compartimentos = p.Compartimentos,

                        // ✅ Capacidad ahora es objeto de navegación
                        IdCapacidad = p.id_capacidad,
                        Capacidad = p.Capacidad != null ? p.Capacidad.Descripcion : "N/D",

                        Alto = p.Alto,
                        Ancho = p.Ancho,
                        Profundidad = p.Profundidad,
                        Peso = p.Peso,

                        // ✅ Genero ahora es objeto de navegación
                        IdGenero = p.id_genero,
                        Genero = p.Genero != null ? p.Genero.Descripcion : null,

                        Diametro = p.Diametro,
                        CantidadRuedas = p.CantidadRuedas,
                        FuelleExpandible = p.FuelleExpandible,
                        IdTipoCierre = p.id_tipo_cierre,
                        TipoCierre = p.TipoCierre != null ? p.TipoCierre.Nombre : null,
                        Stock = p.Stock,

                        ImagenUrl = string.IsNullOrEmpty(p.ImagenUrl)
                            ? "/ImagenUrl/default.jpg"
                            : p.ImagenUrl,

                        Disponible = p.Disponible
                    })
                    .ToListAsync();

                return Ok(productos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    mensaje = "Error al obtener productos",
                    detalle = ex.Message
                });
            }
        }

        // ============================================================
        // GET: api/Productos/paginado
        // ============================================================
        [HttpGet("paginado")]
        public async Task<IActionResult> GetProductosPaginado(
            int page = 1,
            int pageSize = 12)
        {
            var query = _context.Productos.AsNoTracking();

            var total = await query.CountAsync();

            var productos = await query
                .OrderBy(p => p.id_producto)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new ProductoDTO
                {
                    IdProducto = p.id_producto,
                    Nombre = p.Nombre,
                    Modelo = p.Modelo,
                    Color = p.Color,
                    Stock = p.Stock,
                    Disponible = p.Disponible,
                    ImagenUrl = string.IsNullOrEmpty(p.ImagenUrl)
                        ? "/ImagenUrl/default.jpg"
                        : p.ImagenUrl
                })
                .ToListAsync();

            return Ok(new { total, productos });
        }

        // ============================================================
        // GET: api/Productos/{id}
        // ============================================================
        [HttpGet("{id}")]
        public async Task<ActionResult<ProductoDTO>> GetProducto(int id)
        {
            var producto = await _context.Productos
                .AsNoTracking()
                .Include(p => p.Categoria)
                .Include(p => p.Marca)
                .Include(p => p.Material)
                .Include(p => p.Tipo)
                .Include(p => p.TipoCierre)
                .Include(p => p.Capacidad)
                .Include(p => p.Genero)
                .Include(p => p.Imagenes)
                .FirstOrDefaultAsync(p => p.id_producto == id);
            if (producto == null)
                return NotFound();

            var productoDTO = new ProductoDTO
            {
                IdProducto = producto.id_producto,
                Nombre = producto.Nombre,
                Modelo = producto.Modelo,
                Color = producto.Color,

                IdCategoria = producto.id_categoria,
                IdMarca = producto.id_marca,
                IdMaterial = producto.id_material,
                IdTipo = producto.id_tipo,

                Categoria = producto.Categoria?.Nombre ?? "—",
                Marca = producto.Marca?.Nombre ?? "—",
                Material = producto.Material?.Nombre ?? "—",
                Tipo = producto.Tipo?.Nombre ?? "—",

                Compartimentos = producto.Compartimentos,

                // ✅ Capacidad como objeto de navegación
                IdCapacidad = producto.id_capacidad,
                Capacidad = producto.Capacidad?.Descripcion,

                Alto = producto.Alto,
                Ancho = producto.Ancho,
                Profundidad = producto.Profundidad,
                Peso = producto.Peso,

                // ✅ Genero como objeto de navegación
                IdGenero = producto.id_genero,
                Genero = producto.Genero?.Descripcion,

                Diametro = producto.Diametro,
                CantidadRuedas = producto.CantidadRuedas,
                FuelleExpandible = producto.FuelleExpandible,
                IdTipoCierre = producto.id_tipo_cierre,
                TipoCierre = producto.TipoCierre?.Nombre,
                Stock = producto.Stock,

                ImagenUrl = producto.ImagenUrl ?? "/ImagenUrl/default.jpg",
                Disponible = producto.Disponible,
                Imagenes = producto.Imagenes?
                .OrderBy(i => i.Orden)
                .Select(i => i.Url)
                .ToList()
            };

            return Ok(productoDTO);
        }

        // ============================================================
        // PUT: api/Productos/5
        // ============================================================
        [HttpPut("{id}")]
        [ApiExplorerSettings(IgnoreApi = true)]
        public async Task<IActionResult> UpdateProducto(
            int id,
            [FromForm] ProductoUpdateDTO productoDto,
            [FromForm] IFormFile? imagen)
        {
            var producto = await _context.Productos
                .FirstOrDefaultAsync(p => p.id_producto == id);

            if (producto == null)
                return NotFound();

            // 🔹 Datos básicos
            producto.Nombre = productoDto.Nombre;
            producto.Modelo = productoDto.Modelo;
            producto.Color = productoDto.Color;
            producto.Alto = productoDto.Alto;
            producto.Ancho = productoDto.Ancho;
            producto.Profundidad = productoDto.Profundidad;
            producto.Peso = productoDto.Peso;
            producto.Diametro = productoDto.Diametro;
            producto.CantidadRuedas = productoDto.CantidadRuedas;
            producto.FuelleExpandible = productoDto.FuelleExpandible;
            producto.Compartimentos = productoDto.Compartimentos;
            producto.Stock = productoDto.Stock ?? producto.Stock;
            producto.Disponible = producto.Stock > 0;

            // ✅ FKs incluyendo las nuevas entidades
            producto.id_categoria = await GetOrCreateCategoria(productoDto.Categoria);
            producto.id_marca = await GetOrCreateMarca(productoDto.Marca);
            producto.id_tipo = await GetOrCreateTipo(productoDto.Tipo);
            producto.id_material = await GetOrCreateMaterial(productoDto.Material);
            producto.id_tipo_cierre = await GetOrCreateTipoCierre(productoDto.TipoCierre);
            producto.id_capacidad = await GetOrCreateCapacidad(productoDto.Capacidad); // ✅
            producto.id_genero = await GetOrCreateGenero(productoDto.Genero);       // ✅

            // 🔹 Imagen (opcional)
            if (imagen != null && imagen.Length > 0)
            {
                if (!string.IsNullOrEmpty(producto.ImagenUrl))
                {
                    var rutaVieja = Path.Combine(
                        Directory.GetCurrentDirectory(),
                        "wwwroot",
                        producto.ImagenUrl.TrimStart('/')
                    );
                    if (System.IO.File.Exists(rutaVieja))
                        System.IO.File.Delete(rutaVieja);
                }
                producto.ImagenUrl = await ProcesarImagenAsync(imagen);
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // ============================================================
        // POST: api/Productos
        // ============================================================
        [HttpPost]
        [ApiExplorerSettings(IgnoreApi = true)]
        public async Task<ActionResult<Productos>> PostProducto(
            [FromForm] ProductoCreateDTO productoDto,
            [FromForm] IFormFile? imagen)
        {
            if (productoDto == null)
                return BadRequest("Datos incompletos.");

            var nuevoProducto = new Productos
            {
                Nombre = productoDto.Nombre,
                Modelo = productoDto.Modelo,
                Color = productoDto.Color,
                Alto = productoDto.Alto,
                Ancho = productoDto.Ancho,
                Profundidad = productoDto.Profundidad,
                Peso = productoDto.Peso,
                Diametro = productoDto.Diametro,
                CantidadRuedas = productoDto.CantidadRuedas,
                FuelleExpandible = productoDto.FuelleExpandible,
                Compartimentos = productoDto.Compartimentos,
                Stock = productoDto.Stock,
            };
            nuevoProducto.Disponible = nuevoProducto.Stock > 0;

            // ✅ Todas las FKs por GetOrCreate
            nuevoProducto.id_categoria = await GetOrCreateCategoria(productoDto.Categoria);
            nuevoProducto.id_marca = await GetOrCreateMarca(productoDto.Marca);
            nuevoProducto.id_tipo = await GetOrCreateTipo(productoDto.Tipo);
            nuevoProducto.id_material = await GetOrCreateMaterial(productoDto.Material);
            nuevoProducto.id_tipo_cierre = await GetOrCreateTipoCierre(productoDto.TipoCierre);
            nuevoProducto.id_capacidad = await GetOrCreateCapacidad(productoDto.Capacidad);
            nuevoProducto.id_genero = await GetOrCreateGenero(productoDto.Genero);

            if (imagen != null && imagen.Length > 0)
                nuevoProducto.ImagenUrl = await ProcesarImagenAsync(imagen);

            _context.Productos.Add(nuevoProducto);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
     "GetProducto",
     new { id = nuevoProducto.id_producto },
     new ProductoDTO
     {
         IdProducto = nuevoProducto.id_producto,
         Nombre = nuevoProducto.Nombre,
         Modelo = nuevoProducto.Modelo,
         Color = nuevoProducto.Color,
         IdCategoria = nuevoProducto.id_categoria,
         IdMarca = nuevoProducto.id_marca,
         IdTipo = nuevoProducto.id_tipo,
         IdMaterial = nuevoProducto.id_material,
         IdCapacidad = nuevoProducto.id_capacidad,
         IdGenero = nuevoProducto.id_genero,
         IdTipoCierre = nuevoProducto.id_tipo_cierre,
         Compartimentos = nuevoProducto.Compartimentos,
         Alto = nuevoProducto.Alto,
         Ancho = nuevoProducto.Ancho,
         Profundidad = nuevoProducto.Profundidad,
         Peso = nuevoProducto.Peso,
         Diametro = nuevoProducto.Diametro,
         CantidadRuedas = nuevoProducto.CantidadRuedas,
         FuelleExpandible = nuevoProducto.FuelleExpandible,
         Stock = nuevoProducto.Stock,
         Disponible = nuevoProducto.Disponible,
         ImagenUrl = nuevoProducto.ImagenUrl ?? "/ImagenUrl/default.jpg",
         Imagenes = new List<string>()
     });
        }

        // ============================================================
        // DELETE: api/Productos/5
        // ============================================================
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProducto(int id)
        {
            var producto = await _context.Productos.FindAsync(id);
            if (producto == null)
                return NotFound();

            if (!string.IsNullOrEmpty(producto.ImagenUrl))
            {
                var ruta = Path.Combine(
                    Directory.GetCurrentDirectory(),
                    "wwwroot",
                    producto.ImagenUrl.TrimStart('/')
                );
                if (System.IO.File.Exists(ruta))
                    System.IO.File.Delete(ruta);
            }

            _context.Productos.Remove(producto);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // ============================================================
        // Métodos auxiliares GetOrCreate
        // ============================================================
        private async Task<int?> GetOrCreateCategoria(string nombre)
        {
            if (string.IsNullOrWhiteSpace(nombre)) return null;
            nombre = nombre.Trim();
            var existente = await _context.Categorias.FirstOrDefaultAsync(c => c.Nombre.ToLower() == nombre.ToLower());
            if (existente != null) return existente.id_categoria;
            var nueva = new Categorias { Nombre = nombre };
            _context.Categorias.Add(nueva);
            await _context.SaveChangesAsync();
            return nueva.id_categoria;
        }

        private async Task<int?> GetOrCreateMarca(string nombre)
        {
            if (string.IsNullOrWhiteSpace(nombre)) return null;
            nombre = nombre.Trim();
            var existente = await _context.Marcas.FirstOrDefaultAsync(c => c.Nombre.ToLower() == nombre.ToLower());
            if (existente != null) return existente.id_marca;
            var nueva = new Marcas { Nombre = nombre };
            _context.Marcas.Add(nueva);
            await _context.SaveChangesAsync();
            return nueva.id_marca;
        }

        private async Task<int?> GetOrCreateTipo(string nombre)
        {
            if (string.IsNullOrWhiteSpace(nombre)) return null;
            nombre = nombre.Trim();
            var existente = await _context.Tipos.FirstOrDefaultAsync(c => c.Nombre.ToLower() == nombre.ToLower());
            if (existente != null) return existente.id_tipo;
            var nueva = new Tipos { Nombre = nombre };
            _context.Tipos.Add(nueva);
            await _context.SaveChangesAsync();
            return nueva.id_tipo;
        }

        private async Task<int?> GetOrCreateMaterial(string nombre)
        {
            if (string.IsNullOrWhiteSpace(nombre)) return null;
            nombre = nombre.Trim();
            var existente = await _context.Materiales.FirstOrDefaultAsync(c => c.Nombre.ToLower() == nombre.ToLower());
            if (existente != null) return existente.id_material;
            var nueva = new Materiales { Nombre = nombre };
            _context.Materiales.Add(nueva);
            await _context.SaveChangesAsync();
            return nueva.id_material;
        }

        private async Task<int?> GetOrCreateTipoCierre(string nombre)
        {
            if (string.IsNullOrWhiteSpace(nombre)) return null;
            nombre = nombre.Trim();
            var existente = await _context.TiposCierre.FirstOrDefaultAsync(t => t.Nombre.ToLower() == nombre.ToLower());
            if (existente != null) return existente.id_tipo_cierre;
            var nuevo = new TiposCierre { Nombre = nombre };
            _context.TiposCierre.Add(nuevo);
            await _context.SaveChangesAsync();
            return nuevo.id_tipo_cierre;
        }

        private async Task<int?> GetOrCreateCapacidad(string descripcion)
        {
            if (string.IsNullOrWhiteSpace(descripcion)) return null;
            descripcion = descripcion.Trim();
            var existente = await _context.Capacidades.FirstOrDefaultAsync(c => c.Descripcion.ToLower() == descripcion.ToLower());
            if (existente != null) return existente.id_capacidad;
            var nueva = new Capacidades { Descripcion = descripcion };
            _context.Capacidades.Add(nueva);
            await _context.SaveChangesAsync();
            return nueva.id_capacidad;
        }

        private async Task<int?> GetOrCreateGenero(string descripcion)
        {
            if (string.IsNullOrWhiteSpace(descripcion)) return null;
            descripcion = descripcion.Trim();
            var existente = await _context.Generos.FirstOrDefaultAsync(g => g.Descripcion.ToLower() == descripcion.ToLower());
            if (existente != null) return existente.id_genero;
            var nuevo = new Generos { Descripcion = descripcion };
            _context.Generos.Add(nuevo);
            await _context.SaveChangesAsync();
            return nuevo.id_genero;
        }

        private async Task<string> ProcesarImagenAsync(IFormFile imagen)
        {
            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "ImagenUrl");
            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            var fileName = $"{Guid.NewGuid()}.webp";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using var image = await Image.LoadAsync(imagen.OpenReadStream());
            image.Mutate(x => x.Resize(new ResizeOptions
            {
                Size = new Size(400, 0),
                Mode = ResizeMode.Max
            }));
            await image.SaveAsync(filePath, new WebpEncoder { Quality = 75 });

            return $"/ImagenUrl/{fileName}";
        }
        // POST: api/Productos/5/imagenes
        [HttpPost("{id}/imagenes")]
        public async Task<IActionResult> SubirImagenes(int id, [FromForm] List<IFormFile> imagenes)
        {
            var producto = await _context.Productos.FindAsync(id);
            if (producto == null) return NotFound();

            foreach (var img in imagenes)
            {
                if (img.Length == 0) continue;
                var url = await ProcesarImagenAsync(img);
                var orden = await _context.ProductoImagenes
                    .Where(i => i.id_producto == id)
                    .CountAsync();
                _context.ProductoImagenes.Add(new ProductoImagenes
                {
                    id_producto = id,
                    Url = url,
                    Orden = orden
                });
            }
            await _context.SaveChangesAsync();
            return Ok();
        }

        // DELETE: api/Productos/imagenes/{idImagen}
        [HttpDelete("imagenes/{idImagen}")]
        public async Task<IActionResult> EliminarImagen(int idImagen)
        {
            var img = await _context.ProductoImagenes.FindAsync(idImagen);
            if (img == null) return NotFound();

            var ruta = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot",
                                    img.Url.TrimStart('/'));
            if (System.IO.File.Exists(ruta)) System.IO.File.Delete(ruta);

            _context.ProductoImagenes.Remove(img);
            await _context.SaveChangesAsync();
            return NoContent();
        }
        // DELETE: api/Productos/{id}/imagenes/by-url
        [HttpDelete("{id}/imagenes/by-url")]
        public async Task<IActionResult> EliminarImagenPorUrl(int id, [FromBody] string url)
        {
            var img = await _context.ProductoImagenes
                .FirstOrDefaultAsync(i => i.id_producto == id && i.Url == url);
            if (img == null) return NotFound();

            var ruta = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", img.Url.TrimStart('/'));
            if (System.IO.File.Exists(ruta)) System.IO.File.Delete(ruta);

            _context.ProductoImagenes.Remove(img);
            await _context.SaveChangesAsync();
            return NoContent();
        }
        private bool ProductoExists(int id)
        {
            return _context.Productos.Any(p => p.id_producto == id);
        }
    }
}