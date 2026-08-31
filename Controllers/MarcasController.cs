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
    public class MarcasController : ControllerBase
    {
        private readonly DelicataContext _context;

        public MarcasController(DelicataContext context)
        {
            _context = context;
        }

        // GET: api/Marcas
        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var lista = await _context.Marcas
                                      .AsNoTracking()
                                      .ToListAsync();
            return Ok(lista);
        }

        // GET: api/Marcas/5
        [HttpGet("{id:int}")]
        public async Task<ActionResult<Marcas>> GetMarca(int id)
        {
            var marca = await _context.Marcas
                                      .AsNoTracking()
                                      .FirstOrDefaultAsync(m => m.id_marca == id);
            if (marca == null) return NotFound("Marca no encontrada.");
            return Ok(marca);
        }

        // POST: api/Marcas
        [Authorize(Roles = "Administrador")]
        [HttpPost]
        public async Task<ActionResult<Marcas>> CreateMarca([FromBody] Marcas marca)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Verificar si la marca ya existe
            var existingMarca = await _context.Marcas
                .FirstOrDefaultAsync(m => m.Nombre.ToLower() == marca.Nombre.ToLower());

            if (existingMarca != null)
            {
                // Si ya existe, devolver el ID de la marca existente
                return Ok(existingMarca); // Devolver la marca existente
            }

            // Si no existe, crear una nueva marca (vía stored procedure validado)
            var rol = User.FindFirst(ClaimTypes.Role)?.Value;
            try
            {
                var creada = await _context.Marcas
                    .FromSqlInterpolated($"SELECT * FROM sp_crear_marca({marca.Nombre}, {rol})")
                    .AsNoTracking()
                    .ToListAsync();

                var nueva = creada.FirstOrDefault();
                if (nueva == null) return StatusCode(500, "No se pudo crear la marca.");

                return CreatedAtAction(nameof(GetMarca), new { id = nueva.id_marca }, nueva);
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

        // PUT: api/Marcas
        [Authorize(Roles = "Administrador")]
        [HttpPut]
        public async Task<ActionResult> UpdateMarca([FromBody] Marcas marca)
        {
            if (marca == null || marca.id_marca == 0) return BadRequest("Id inválido.");

            var rol = User.FindFirst(ClaimTypes.Role)?.Value;
            try
            {
                await _context.Database.ExecuteSqlInterpolatedAsync(
                    $"SELECT sp_actualizar_marca({marca.id_marca}, {marca.Nombre}, {rol})");
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

        // DELETE: api/Marcas/5
        [Authorize(Roles = "Administrador")]
        [HttpDelete("{id:int}")]
        public async Task<ActionResult> DeleteMarca(int id)
        {
            var rol = User.FindFirst(ClaimTypes.Role)?.Value;
            try
            {
                await _context.Database.ExecuteSqlInterpolatedAsync(
                    $"SELECT sp_eliminar_marca({id}, {rol})");
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