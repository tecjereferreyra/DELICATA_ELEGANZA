using DELICATA_ELEGANZA.Data;
using DELICATA_ELEGANZA.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Security.Claims;
using Npgsql;

namespace DELICATA_ELEGANZA.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoriasController : ControllerBase
    {
        private readonly DelicataContext _context;

        public CategoriasController(DelicataContext context)
        {
            _context = context;
        }

        // GET: api/Categorias
        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var lista = await _context.Categorias
                                      .AsNoTracking()
                                      .ToListAsync();
            return Ok(lista);
        }

        // GET: api/Categorias/5
        [HttpGet("{id:int}")]
        public async Task<ActionResult<Categorias>> GetCategoria(int id)
        {
            var categoria = await _context.Categorias
                                          .AsNoTracking()
                                          .FirstOrDefaultAsync(c => c.id_categoria == id);
            if (categoria == null) return NotFound();
            return Ok(categoria);
        }

        // POST: api/Categorias
        [Authorize(Roles = "Administrador")]
        [HttpPost]
        public async Task<ActionResult<Categorias>> CreateCategoria([FromBody] Categorias categoria)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Verificar si la categoría ya existe
            var existingCategoria = await _context.Categorias
                .FirstOrDefaultAsync(c => c.Nombre.ToLower() == categoria.Nombre.ToLower());

            if (existingCategoria != null)
            {
                // Si ya existe, devolver el ID de la categoría existente
                return Ok(existingCategoria); // Devolver la categoría existente
            }

            // Si no existe, crear una nueva categoría (vía stored procedure validado)
            var rol = User.FindFirst(ClaimTypes.Role)?.Value;
            try
            {
                var creada = await _context.Categorias
                    .FromSqlInterpolated($"SELECT * FROM sp_crear_categoria({categoria.Nombre}, {rol})")
                    .AsNoTracking()
                    .ToListAsync();

                var nueva = creada.FirstOrDefault();
                if (nueva == null) return StatusCode(500, "No se pudo crear la categoría.");

                return CreatedAtAction(nameof(GetCategoria), new { id = nueva.id_categoria }, nueva);
            }
            catch (PostgresException ex) when (ex.SqlState == "28000")
            {
                return Forbid();
            }
            catch (PostgresException ex) when (ex.SqlState == "23502")
            {
                return BadRequest(new { message = ex.MessageText });
            }
        }

        // PUT: api/Categorias
        [Authorize(Roles = "Administrador")]
        [HttpPut]
        public async Task<ActionResult> UpdateCategoria([FromBody] Categorias categoria)
        {
            if (categoria == null || categoria.id_categoria == 0) return BadRequest("Id inválido.");

            var rol = User.FindFirst(ClaimTypes.Role)?.Value;
            try
            {
                await _context.Database.ExecuteSqlInterpolatedAsync(
                    $"SELECT sp_actualizar_categoria({categoria.id_categoria}, {categoria.Nombre}, {rol})");
            }
            catch (PostgresException ex) when (ex.SqlState == "28000")
            {
                return Forbid();
            }
            catch (PostgresException ex) when (ex.SqlState == "23502")
            {
                return BadRequest(new { message = ex.MessageText });
            }
            catch (PostgresException ex) when (ex.SqlState == "P0002")
            {
                return NotFound(new { message = ex.MessageText });
            }
            return NoContent();
        }

        // DELETE: api/Categorias/5
        [Authorize(Roles = "Administrador")]
        [HttpDelete("{id:int}")]
        public async Task<ActionResult> DeleteCategoria(int id)
        {
            var rol = User.FindFirst(ClaimTypes.Role)?.Value;
            try
            {
                await _context.Database.ExecuteSqlInterpolatedAsync(
                    $"SELECT sp_eliminar_categoria({id}, {rol})");
            }
            catch (PostgresException ex) when (ex.SqlState == "28000")
            {
                return Forbid();
            }
            catch (PostgresException ex) when (ex.SqlState == "P0002")
            {
                return NotFound(new { message = ex.MessageText });
            }
            return NoContent();
        }
    }
}