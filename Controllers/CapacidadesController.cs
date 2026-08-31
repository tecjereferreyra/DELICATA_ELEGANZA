using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using DELICATA_ELEGANZA.Data;
using DELICATA_ELEGANZA.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Npgsql;

namespace DELICATA_ELEGANZA.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CapacidadesController : ControllerBase
    {
        private readonly DelicataContext _context;

        public CapacidadesController(DelicataContext context)
        {
            _context = context;
        }

        // GET: api/Capacidades
        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var lista = await _context.Capacidades
                                      .AsNoTracking()
                                      .ToListAsync();
            return Ok(lista);
        }

        // GET: api/Capacidades/5
        [HttpGet("{id:int}")]
        public async Task<ActionResult<Capacidades>> GetCapacidad(int id)
        {
            var capacidad = await _context.Capacidades
                                          .AsNoTracking()
                                          .FirstOrDefaultAsync(c => c.id_capacidad == id);
            if (capacidad == null) return NotFound();
            return Ok(capacidad);
        }

        // POST: api/Capacidades
        [Authorize(Roles = "Administrador")]
        [HttpPost]
        public async Task<ActionResult<Capacidades>> CreateCapacidad([FromBody] Capacidades capacidad)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var existente = await _context.Capacidades
                .FirstOrDefaultAsync(c => c.Descripcion.ToLower() == capacidad.Descripcion.ToLower());

            if (existente != null)
                return Ok(existente);

            var rol = User.FindFirst(ClaimTypes.Role)?.Value;
            try
            {
                var creada = await _context.Capacidades
                    .FromSqlInterpolated($"SELECT * FROM sp_crear_capacidad({capacidad.Descripcion}, {rol})")
                    .AsNoTracking()
                    .ToListAsync();

                var nueva = creada.FirstOrDefault();
                if (nueva == null) return StatusCode(500, "No se pudo crear la capacidad.");

                return CreatedAtAction(nameof(GetCapacidad), new { id = nueva.id_capacidad }, nueva);
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

        // PUT: api/Capacidades
        [Authorize(Roles = "Administrador")]
        [HttpPut]
        public async Task<ActionResult> UpdateCapacidad([FromBody] Capacidades capacidad)
        {
            if (capacidad == null || capacidad.id_capacidad == 0) return BadRequest("Id inválido.");

            var rol = User.FindFirst(ClaimTypes.Role)?.Value;
            try
            {
                await _context.Database.ExecuteSqlInterpolatedAsync(
                    $"SELECT sp_actualizar_capacidad({capacidad.id_capacidad}, {capacidad.Descripcion}, {rol})");
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

        // DELETE: api/Capacidades/5
        [Authorize(Roles = "Administrador")]
        [HttpDelete("{id:int}")]
        public async Task<ActionResult> DeleteCapacidad(int id)
        {
            var rol = User.FindFirst(ClaimTypes.Role)?.Value;
            try
            {
                await _context.Database.ExecuteSqlInterpolatedAsync(
                    $"SELECT sp_eliminar_capacidad({id}, {rol})");
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