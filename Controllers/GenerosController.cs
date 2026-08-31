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
    public class GenerosController : ControllerBase
    {
        private readonly DelicataContext _context;

        public GenerosController(DelicataContext context)
        {
            _context = context;
        }

        // GET: api/Generos
        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var lista = await _context.Generos
                                      .AsNoTracking()
                                      .ToListAsync();
            return Ok(lista);
        }

        // GET: api/Generos/5
        [HttpGet("{id:int}")]
        public async Task<ActionResult<Generos>> GetGenero(int id)
        {
            var genero = await _context.Generos
                                       .AsNoTracking()
                                       .FirstOrDefaultAsync(g => g.id_genero == id);
            if (genero == null) return NotFound();
            return Ok(genero);
        }

        // POST: api/Generos
        [Authorize(Roles = "Administrador")]
        [HttpPost]
        public async Task<ActionResult<Generos>> CreateGenero([FromBody] Generos genero)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var existente = await _context.Generos
                .FirstOrDefaultAsync(g => g.Descripcion.ToLower() == genero.Descripcion.ToLower());

            if (existente != null)
                return Ok(existente);

            var rol = User.FindFirst(ClaimTypes.Role)?.Value;
            try
            {
                var creado = await _context.Generos
                    .FromSqlInterpolated($"SELECT * FROM sp_crear_genero({genero.Descripcion}, {rol})")
                    .AsNoTracking()
                    .ToListAsync();

                var nuevo = creado.FirstOrDefault();
                if (nuevo == null) return StatusCode(500, "No se pudo crear el género.");

                return CreatedAtAction(nameof(GetGenero), new { id = nuevo.id_genero }, nuevo);
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

        // PUT: api/Generos
        [Authorize(Roles = "Administrador")]
        [HttpPut]
        public async Task<ActionResult> UpdateGenero([FromBody] Generos genero)
        {
            if (genero == null || genero.id_genero == 0) return BadRequest("Id inválido.");

            var rol = User.FindFirst(ClaimTypes.Role)?.Value;
            try
            {
                await _context.Database.ExecuteSqlInterpolatedAsync(
                    $"SELECT sp_actualizar_genero({genero.id_genero}, {genero.Descripcion}, {rol})");
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

        // DELETE: api/Generos/5
        [Authorize(Roles = "Administrador")]
        [HttpDelete("{id:int}")]
        public async Task<ActionResult> DeleteGenero(int id)
        {
            var rol = User.FindFirst(ClaimTypes.Role)?.Value;
            try
            {
                await _context.Database.ExecuteSqlInterpolatedAsync(
                    $"SELECT sp_eliminar_genero({id}, {rol})");
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