using DELICATA_ELEGANZA.Data;
using DELICATA_ELEGANZA.DTO;
using DELICATA_ELEGANZA.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Authorization;

namespace DELICATA_ELEGANZA.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductosController : ControllerBase
    {
        private readonly DelicataContext _context;
        private readonly IMemoryCache _cache;
        private readonly Cloudinary _cloudinary;
        private readonly ILogger<ProductosController> _logger;

        public ProductosController(
            DelicataContext context,
            IMemoryCache cache,
            Cloudinary cloudinary,
            ILogger<ProductosController> logger)
        {
            _context = context;
            _cache = cache;
            _cloudinary = cloudinary;
            _logger = logger;
        }

        // ============================================================
        // GET: api/Productos
        // ============================================================
        [HttpGet]
        [ResponseCache(Duration = 300, Location = ResponseCacheLocation.Any, NoStore = false)]
        public async Task<IActionResult> GetProductos()
        {
            const string KEY = "productos_lista";

            if (_cache.TryGetValue(KEY, out List<ProductoDTO> cached))
                return Ok(cached);

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

                        IdCapacidad = p.id_capacidad,
                        Capacidad = p.Capacidad != null ? p.Capacidad.Descripcion : "N/D",

                        Alto = p.Alto,
                        Ancho = p.Ancho,
                        Profundidad = p.Profundidad,
                        Peso = p.Peso,

                        IdGenero = p.id_genero,
                        Genero = p.Genero != null ? p.Genero.Descripcion : null,

                        Diametro = p.Diametro,
                        CantidadRuedas = p.CantidadRuedas,
                        FuelleExpandible = p.FuelleExpandible,
                        IdTipoCierre = p.id_tipo_cierre,
                        TipoCierre = p.TipoCierre != null ? p.TipoCierre.Nombre : null,
                        MedidasTexto = p.MedidasTexto,
                        Stock = p.Stock,

                        ImagenUrl = string.IsNullOrEmpty(p.ImagenUrl)
                            ? "/ImagenUrl/default.jpg"
                            : p.ImagenUrl,

                        Disponible = p.Disponible
                    })
                    .ToListAsync();

                _cache.Set(KEY, productos, TimeSpan.FromMinutes(5));

                return Ok(productos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener productos");
                return StatusCode(500, new { mensaje = "Error al obtener productos" });
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

                IdCapacidad = producto.id_capacidad,
                Capacidad = producto.Capacidad?.Descripcion,

                Alto = producto.Alto,
                Ancho = producto.Ancho,
                Profundidad = producto.Profundidad,
                Peso = producto.Peso,

                IdGenero = producto.id_genero,
                Genero = producto.Genero?.Descripcion,

                Diametro = producto.Diametro,
                CantidadRuedas = producto.CantidadRuedas,
                FuelleExpandible = producto.FuelleExpandible,
                IdTipoCierre = producto.id_tipo_cierre,
                TipoCierre = producto.TipoCierre?.Nombre,
                MedidasTexto = producto.MedidasTexto,
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
        public class StockUpdateDTO
        {
            public int Stock { get; set; }
        }

        [Authorize(Roles = "Administrador")]
        [HttpPatch("{id}/stock")]
        public async Task<IActionResult> ActualizarStock(int id, [FromBody] StockUpdateDTO dto)
        {
            if (dto.Stock < 0)
                return BadRequest(new { mensaje = "El stock no puede ser negativo" });

            _cache.Remove("productos_lista");

            var producto = await _context.Productos.FirstOrDefaultAsync(p => p.id_producto == id);
            if (producto == null)
                return NotFound();

            producto.Stock = dto.Stock;
            producto.Disponible = dto.Stock > 0;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar stock del producto {Id}", id);
                return StatusCode(500, new { mensaje = "Error al actualizar el stock" });
            }

            return Ok(new { id_producto = producto.id_producto, stock = producto.Stock, disponible = producto.Disponible });
        }
        // ============================================================
        // PUT: api/Productos/5
        // ============================================================
        [Authorize(Roles = "Administrador")]
        [HttpPut("{id}")]
        [ApiExplorerSettings(IgnoreApi = true)]
        public async Task<IActionResult> UpdateProducto(
            int id,
            [FromForm] ProductoUpdateDTO productoDto,
            [FromForm] IFormFile? imagen)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            _cache.Remove("productos_lista");

            var producto = await _context.Productos
                .FirstOrDefaultAsync(p => p.id_producto == id);

            if (producto == null)
                return NotFound();
            string imagenViejaUrl = null;
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
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
                producto.MedidasTexto = productoDto.MedidasTexto;
                producto.Compartimentos = productoDto.Compartimentos;
                producto.Stock = productoDto.Stock ?? producto.Stock;
                producto.Disponible = producto.Stock > 0;

                producto.id_categoria = await GetOrCreateCategoria(productoDto.Categoria);
                producto.id_marca = await GetOrCreateMarca(productoDto.Marca);
                producto.id_tipo = await GetOrCreateTipo(productoDto.Tipo);
                producto.id_material = await GetOrCreateMaterial(productoDto.Material);
                producto.id_tipo_cierre = await GetOrCreateTipoCierre(productoDto.TipoCierre);
                producto.id_capacidad = await GetOrCreateCapacidad(productoDto.Capacidad);
                producto.id_genero = await GetOrCreateGenero(productoDto.Genero);

                if (imagen != null && imagen.Length > 0)
                {
                    imagenViejaUrl = producto.ImagenUrl;
                    producto.ImagenUrl = await ProcesarImagenAsync(imagen);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error al actualizar producto {Id}", id);
                return StatusCode(500, new { mensaje = "Error al actualizar el producto" });
            }
            if (!string.IsNullOrEmpty(imagenViejaUrl))
            {
                var publicId = ExtraerPublicIdDeUrl(imagenViejaUrl);
                if (publicId != null)
                {
                    try
                    {
                        var resultado = await _cloudinary.DestroyAsync(new DeletionParams(publicId));
                        if (resultado.Result != "ok" && resultado.Result != "not found")
                            _logger.LogWarning(
                                "Cloudinary no pudo borrar {PublicId} (imagen anterior) del producto {Id}: {Resultado}",
                                publicId, id, resultado.Result);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error al borrar imagen anterior {PublicId} de Cloudinary (producto {Id})", publicId, id);
                    }
                }
            }
            return NoContent();
        }

        // ============================================================
        // POST: api/Productos
        // ============================================================
        [Authorize(Roles = "Administrador")]
        [HttpPost]
        [ApiExplorerSettings(IgnoreApi = true)]
        public async Task<ActionResult<Productos>> PostProducto(
            [FromForm] ProductoCreateDTO productoDto,
            [FromForm] IFormFile? imagen)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (productoDto == null)
                return BadRequest("Datos incompletos.");

            _cache.Remove("productos_lista");

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
                MedidasTexto = productoDto.MedidasTexto,
                Compartimentos = productoDto.Compartimentos,
                Stock = productoDto.Stock,
            };
            nuevoProducto.Disponible = nuevoProducto.Stock > 0;

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
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
                await transaction.CommitAsync();
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error al crear producto");
                return StatusCode(500, new { mensaje = "Error al crear el producto" });
            }

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
                    MedidasTexto = nuevoProducto.MedidasTexto,
                    Stock = nuevoProducto.Stock,
                    Disponible = nuevoProducto.Disponible,
                    ImagenUrl = nuevoProducto.ImagenUrl ?? "/ImagenUrl/default.jpg",
                    Imagenes = new List<string>()
                });
        }

        [Authorize(Roles = "Administrador")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProducto(int id)
        {
            _cache.Remove("productos_lista");

            var producto = await _context.Productos.FindAsync(id);
            if (producto == null)
                return NotFound();

           
            var imagenesCarrusel = await _context.ProductoImagenes
                .Where(i => i.id_producto == id)
                .Select(i => i.Url)
                .ToListAsync();

            var urlsABorrar = new List<string>(imagenesCarrusel);
            if (!string.IsNullOrEmpty(producto.ImagenUrl))
                urlsABorrar.Add(producto.ImagenUrl);

            
            _context.Productos.Remove(producto);
            await _context.SaveChangesAsync();

       
            foreach (var url in urlsABorrar.Distinct())
            {
                var publicId = ExtraerPublicIdDeUrl(url);
                if (publicId == null)
                    continue;

                try
                {
                    var resultado = await _cloudinary.DestroyAsync(new DeletionParams(publicId));
                    if (resultado.Result != "ok" && resultado.Result != "not found")
                        _logger.LogWarning(
                            "Cloudinary no pudo borrar {PublicId} del producto {Id}: {Resultado}",
                            publicId, id, resultado.Result);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error al borrar imagen {PublicId} de Cloudinary (producto {Id})", publicId, id);
                }
            }

            return NoContent();
        }

     
        private async Task<int?> GetOrCreateCategoria(string nombre)
        {
            if (string.IsNullOrWhiteSpace(nombre)) return null;
            nombre = nombre.Trim();

            var existente = await _context.Categorias.FirstOrDefaultAsync(c => c.Nombre.ToLower() == nombre.ToLower());
            if (existente != null) return existente.id_categoria;

            var nueva = new Categorias { Nombre = nombre };
            _context.Categorias.Add(nueva);
            try
            {
                await _context.SaveChangesAsync();
                return nueva.id_categoria;
            }
            catch (DbUpdateException)
            {
                _context.Entry(nueva).State = EntityState.Detached;
                var creadaPorOtroProceso = await _context.Categorias
                    .FirstOrDefaultAsync(c => c.Nombre.ToLower() == nombre.ToLower());
                return creadaPorOtroProceso?.id_categoria;
            }
        }

        private async Task<int?> GetOrCreateMarca(string nombre)
        {
            if (string.IsNullOrWhiteSpace(nombre)) return null;
            nombre = nombre.Trim();

            var existente = await _context.Marcas.FirstOrDefaultAsync(c => c.Nombre.ToLower() == nombre.ToLower());
            if (existente != null) return existente.id_marca;

            var nueva = new Marcas { Nombre = nombre };
            _context.Marcas.Add(nueva);
            try
            {
                await _context.SaveChangesAsync();
                return nueva.id_marca;
            }
            catch (DbUpdateException)
            {
                _context.Entry(nueva).State = EntityState.Detached;
                var creadaPorOtroProceso = await _context.Marcas
                    .FirstOrDefaultAsync(c => c.Nombre.ToLower() == nombre.ToLower());
                return creadaPorOtroProceso?.id_marca;
            }
        }

        private async Task<int?> GetOrCreateTipo(string nombre)
        {
            if (string.IsNullOrWhiteSpace(nombre)) return null;
            nombre = nombre.Trim();

            var existente = await _context.Tipos.FirstOrDefaultAsync(c => c.Nombre.ToLower() == nombre.ToLower());
            if (existente != null) return existente.id_tipo;

            var nueva = new Tipos { Nombre = nombre };
            _context.Tipos.Add(nueva);
            try
            {
                await _context.SaveChangesAsync();
                return nueva.id_tipo;
            }
            catch (DbUpdateException)
            {
                _context.Entry(nueva).State = EntityState.Detached;
                var creadaPorOtroProceso = await _context.Tipos
                    .FirstOrDefaultAsync(c => c.Nombre.ToLower() == nombre.ToLower());
                return creadaPorOtroProceso?.id_tipo;
            }
        }

        private async Task<int?> GetOrCreateMaterial(string nombre)
        {
            if (string.IsNullOrWhiteSpace(nombre)) return null;
            nombre = nombre.Trim();

            var existente = await _context.Materiales.FirstOrDefaultAsync(c => c.Nombre.ToLower() == nombre.ToLower());
            if (existente != null) return existente.id_material;

            var nueva = new Materiales { Nombre = nombre };
            _context.Materiales.Add(nueva);
            try
            {
                await _context.SaveChangesAsync();
                return nueva.id_material;
            }
            catch (DbUpdateException)
            {
                _context.Entry(nueva).State = EntityState.Detached;
                var creadaPorOtroProceso = await _context.Materiales
                    .FirstOrDefaultAsync(c => c.Nombre.ToLower() == nombre.ToLower());
                return creadaPorOtroProceso?.id_material;
            }
        }

        private async Task<int?> GetOrCreateTipoCierre(string nombre)
        {
            if (string.IsNullOrWhiteSpace(nombre)) return null;
            nombre = nombre.Trim();

            var existente = await _context.TiposCierre.FirstOrDefaultAsync(t => t.Nombre.ToLower() == nombre.ToLower());
            if (existente != null) return existente.id_tipo_cierre;

            var nuevo = new TiposCierre { Nombre = nombre };
            _context.TiposCierre.Add(nuevo);
            try
            {
                await _context.SaveChangesAsync();
                return nuevo.id_tipo_cierre;
            }
            catch (DbUpdateException)
            {
                _context.Entry(nuevo).State = EntityState.Detached;
                var creadaPorOtroProceso = await _context.TiposCierre
                    .FirstOrDefaultAsync(t => t.Nombre.ToLower() == nombre.ToLower());
                return creadaPorOtroProceso?.id_tipo_cierre;
            }
        }

        private async Task<int?> GetOrCreateCapacidad(string descripcion)
        {
            if (string.IsNullOrWhiteSpace(descripcion)) return null;
            descripcion = descripcion.Trim();

            var existente = await _context.Capacidades.FirstOrDefaultAsync(c => c.Descripcion.ToLower() == descripcion.ToLower());
            if (existente != null) return existente.id_capacidad;

            var nueva = new Capacidades { Descripcion = descripcion };
            _context.Capacidades.Add(nueva);
            try
            {
                await _context.SaveChangesAsync();
                return nueva.id_capacidad;
            }
            catch (DbUpdateException)
            {
                _context.Entry(nueva).State = EntityState.Detached;
                var creadaPorOtroProceso = await _context.Capacidades
                    .FirstOrDefaultAsync(c => c.Descripcion.ToLower() == descripcion.ToLower());
                return creadaPorOtroProceso?.id_capacidad;
            }
        }

        private async Task<int?> GetOrCreateGenero(string descripcion)
        {
            if (string.IsNullOrWhiteSpace(descripcion)) return null;
            descripcion = descripcion.Trim();

            var existente = await _context.Generos.FirstOrDefaultAsync(g => g.Descripcion.ToLower() == descripcion.ToLower());
            if (existente != null) return existente.id_genero;

            var nuevo = new Generos { Descripcion = descripcion };
            _context.Generos.Add(nuevo);
            try
            {
                await _context.SaveChangesAsync();
                return nuevo.id_genero;
            }
            catch (DbUpdateException)
            {
                _context.Entry(nuevo).State = EntityState.Detached;
                var creadaPorOtroProceso = await _context.Generos
                    .FirstOrDefaultAsync(g => g.Descripcion.ToLower() == descripcion.ToLower());
                return creadaPorOtroProceso?.id_genero;
            }
        }

        private async Task<string> ProcesarImagenAsync(IFormFile imagen)
        {
            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(imagen.FileName, imagen.OpenReadStream()),
                Folder = "delicata-eleganza",
                Transformation = new Transformation()
                    .Width(800)
                    .Crop("limit")
                    .Quality(90)
                    .FetchFormat("webp")
            };

            var result = await _cloudinary.UploadAsync(uploadParams);

            if (result.Error != null)
                throw new Exception("Error Cloudinary: " + result.Error.Message);

            return result.SecureUrl.ToString();
        }

  
        private string ExtraerPublicIdDeUrl(string url)
        {
            if (string.IsNullOrWhiteSpace(url))
                return null;

            const string marcador = "/upload/";
            var indice = url.IndexOf(marcador, StringComparison.OrdinalIgnoreCase);
            if (indice == -1)
                return null;

            var resto = url.Substring(indice + marcador.Length); // v1783.../delicata-eleganza/xxxxx.webp
            var segmentos = resto.Split('/');
            if (segmentos.Length < 2)
                return null;

            // El primer segmento es la versión (v1783...), lo salteamos.
            var carpetaYArchivo = string.Join("/", segmentos.Skip(1)); // delicata-eleganza/xxxxx.webp
            var puntoExtension = carpetaYArchivo.LastIndexOf('.');
            if (puntoExtension == -1)
                return carpetaYArchivo;

            return carpetaYArchivo.Substring(0, puntoExtension); // delicata-eleganza/xxxxx
        }

        // POST: api/Productos/5/imagenes
        [Authorize(Roles = "Administrador")]
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
        // También borra el archivo físico en Cloudinary, no solo la fila en la base.
        [Authorize(Roles = "Administrador")]
        [HttpDelete("imagenes/{idImagen}")]
        public async Task<IActionResult> EliminarImagen(int idImagen)
        {
            var img = await _context.ProductoImagenes.FindAsync(idImagen);
            if (img == null) return NotFound();

            _context.ProductoImagenes.Remove(img);
            await _context.SaveChangesAsync();

            var publicId = ExtraerPublicIdDeUrl(img.Url);
            if (publicId != null)
            {
                try
                {
                    await _cloudinary.DestroyAsync(new DeletionParams(publicId));
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error al borrar imagen {PublicId} de Cloudinary", publicId);
                }
            }

            return NoContent();
        }

        // DELETE: api/Productos/{id}/imagenes/by-url
        // También borra el archivo físico en Cloudinary, no solo la fila en la base.
        [Authorize(Roles = "Administrador")]
        [HttpDelete("{id}/imagenes/by-url")]
        public async Task<IActionResult> EliminarImagenPorUrl(int id, [FromBody] string url)
        {
            var img = await _context.ProductoImagenes
                .FirstOrDefaultAsync(i => i.id_producto == id && i.Url == url);
            if (img == null) return NotFound();

            _context.ProductoImagenes.Remove(img);
            await _context.SaveChangesAsync();

            var publicId = ExtraerPublicIdDeUrl(url);
            if (publicId != null)
            {
                try
                {
                    await _cloudinary.DestroyAsync(new DeletionParams(publicId));
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error al borrar imagen {PublicId} de Cloudinary", publicId);
                }
            }

            return NoContent();
        }

        private bool ProductoExists(int id)
        {
            return _context.Productos.Any(p => p.id_producto == id);
        }
    }
}