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
    public class TiposController : ControllerBase
    {
        private readonly DelicataContext _context;

        public TiposController(DelicataContext context)
        {
            _context = context;
        }

        // GET: api/Tipos
        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var lista = await _context.Tipos
                                      .AsNoTracking()
                                      .ToListAsync();
            return Ok(lista);
        }

        // GET: api/Tipos/5
        [HttpGet("{id:int}")]
        public async Task<ActionResult<Tipos>> GetTipo(int id)
        {
            var tipo = await _context.Tipos
                                     .AsNoTracking()
                                     .FirstOrDefaultAsync(t => t.id_tipo == id);
            if (tipo == null) return NotFound("Tipo no encontrado.");
            return Ok(tipo);
        }

        // POST: api/Tipos
        [Authorize(Roles = "Administrador")]
        [HttpPost]
        public async Task<ActionResult<Tipos>> CreateTipo([FromBody] Tipos tipo)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Verificar si el tipo ya existe
            var existingTipo = await _context.Tipos
                .FirstOrDefaultAsync(t => t.Nombre.ToLower() == tipo.Nombre.ToLower());

            if (existingTipo != null)
            {
                // Si ya existe, devolver el ID del tipo existente
                return Ok(existingTipo); // Devolver el tipo existente
            }

            // Si no existe, crear un nuevo tipo (vía stored procedure validado)
            var rol = User.FindFirst(ClaimTypes.Role)?.Value;
            try
            {
                var creado = await _context.Tipos
                    .FromSqlInterpolated($"SELECT * FROM sp_crear_tipo({tipo.Nombre}, {rol})")
                    .AsNoTracking()
                    .ToListAsync();

                var nuevo = creado.FirstOrDefault();
                if (nuevo == null) return StatusCode(500, "No se pudo crear el tipo.");

                return CreatedAtAction(nameof(GetTipo), new { id = nuevo.id_tipo }, nuevo);
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

        // PUT: api/Tipos
        [Authorize(Roles = "Administrador")]
        [HttpPut]
        public async Task<ActionResult> UpdateTipo([FromBody] Tipos tipo)
        {
            if (tipo == null || tipo.id_tipo == 0) return BadRequest("Id inválido.");

            var rol = User.FindFirst(ClaimTypes.Role)?.Value;
            try
            {
                await _context.Database.ExecuteSqlInterpolatedAsync(
                    $"SELECT sp_actualizar_tipo({tipo.id_tipo}, {tipo.Nombre}, {rol})");
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

        // DELETE: api/Tipos/5
        [Authorize(Roles = "Administrador")]
        [HttpDelete("{id:int}")]
        public async Task<ActionResult> DeleteTipo(int id)
        {
            var rol = User.FindFirst(ClaimTypes.Role)?.Value;
            try
            {
                await _context.Database.ExecuteSqlInterpolatedAsync(
                    $"SELECT sp_eliminar_tipo({id}, {rol})");
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