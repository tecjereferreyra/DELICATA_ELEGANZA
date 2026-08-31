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
    public class TiposCierreController : ControllerBase
    {
        private readonly DelicataContext _context;

        public TiposCierreController(DelicataContext context)
        {
            _context = context;
        }

        // GET: api/TiposCierre
        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var lista = await _context.TiposCierre
                                      .AsNoTracking()
                                      .ToListAsync();
            return Ok(lista);
        }

        // GET: api/TiposCierre/5
        [HttpGet("{id:int}")]
        public async Task<ActionResult<TiposCierre>> GetTipoCierre(int id)
        {
            var tipoCierre = await _context.TiposCierre
                                           .AsNoTracking()
                                           .FirstOrDefaultAsync(t => t.id_tipo_cierre == id);
            if (tipoCierre == null) return NotFound();
            return Ok(tipoCierre);
        }

        // POST: api/TiposCierre
        [Authorize(Roles = "Administrador")]
        [HttpPost]
        public async Task<ActionResult<TiposCierre>> CreateTipoCierre([FromBody] TiposCierre tipoCierre)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var existente = await _context.TiposCierre
                .FirstOrDefaultAsync(t => t.Nombre.ToLower() == tipoCierre.Nombre.ToLower());

            if (existente != null)
                return Ok(existente);

            var rol = User.FindFirst(ClaimTypes.Role)?.Value;
            try
            {
                var creado = await _context.TiposCierre
                    .FromSqlInterpolated($"SELECT * FROM sp_crear_tipo_cierre({tipoCierre.Nombre}, {rol})")
                    .AsNoTracking()
                    .ToListAsync();

                var nuevo = creado.FirstOrDefault();
                if (nuevo == null) return StatusCode(500, "No se pudo crear el tipo de cierre.");

                return CreatedAtAction(nameof(GetTipoCierre), new { id = nuevo.id_tipo_cierre }, nuevo);
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

        // PUT: api/TiposCierre
        [Authorize(Roles = "Administrador")]
        [HttpPut]
        public async Task<ActionResult> UpdateTipoCierre([FromBody] TiposCierre tipoCierre)
        {
            if (tipoCierre == null || tipoCierre.id_tipo_cierre == 0) return BadRequest("Id inválido.");

            var rol = User.FindFirst(ClaimTypes.Role)?.Value;
            try
            {
                await _context.Database.ExecuteSqlInterpolatedAsync(
                    $"SELECT sp_actualizar_tipo_cierre({tipoCierre.id_tipo_cierre}, {tipoCierre.Nombre}, {rol})");
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

        // DELETE: api/TiposCierre/5
        [Authorize(Roles = "Administrador")]
        [HttpDelete("{id:int}")]
        public async Task<ActionResult> DeleteTipoCierre(int id)
        {
            var rol = User.FindFirst(ClaimTypes.Role)?.Value;
            try
            {
                await _context.Database.ExecuteSqlInterpolatedAsync(
                    $"SELECT sp_eliminar_tipo_cierre({id}, {rol})");
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