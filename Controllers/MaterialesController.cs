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
    public class MaterialesController : ControllerBase
    {
        private readonly DelicataContext _context;

        public MaterialesController(DelicataContext context)
        {
            _context = context;
        }

        // GET: api/Materiales
        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var lista = await _context.Materiales
                                      .AsNoTracking()
                                      .ToListAsync();
            return Ok(lista);
        }

        // GET: api/Materiales/5
        [HttpGet("{id:int}")]
        public async Task<ActionResult<Materiales>> GetMaterial(int id)
        {
            var material = await _context.Materiales
                                         .AsNoTracking()
                                         .FirstOrDefaultAsync(m => m.id_material == id);
            if (material == null) return NotFound("Material no encontrado.");
            return Ok(material);
        }

        // POST: api/Materiales
        [Authorize(Roles = "Administrador")]
        [HttpPost]
        public async Task<ActionResult<Materiales>> CreateMaterial([FromBody] Materiales material)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Verificar si el material ya existe
            var existingMaterial = await _context.Materiales
                .FirstOrDefaultAsync(m => m.Nombre.ToLower() == material.Nombre.ToLower());

            if (existingMaterial != null)
            {
                // Si ya existe, devolver el ID del material existente
                return Ok(existingMaterial); // Devolver el material existente
            }

            // Si no existe, crear un nuevo material (vía stored procedure validado)
            var rol = User.FindFirst(ClaimTypes.Role)?.Value;
            try
            {
                var creado = await _context.Materiales
                    .FromSqlInterpolated($"SELECT * FROM sp_crear_material({material.Nombre}, {rol})")
                    .AsNoTracking()
                    .ToListAsync();

                var nuevo = creado.FirstOrDefault();
                if (nuevo == null) return StatusCode(500, "No se pudo crear el material.");

                return CreatedAtAction(nameof(GetMaterial), new { id = nuevo.id_material }, nuevo);
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

        // PUT: api/Materiales
        [Authorize(Roles = "Administrador")]
        [HttpPut]
        public async Task<ActionResult> UpdateMaterial([FromBody] Materiales material)
        {
            if (material == null || material.id_material == 0) return BadRequest("Id inválido.");

            var rol = User.FindFirst(ClaimTypes.Role)?.Value;
            try
            {
                await _context.Database.ExecuteSqlInterpolatedAsync(
                    $"SELECT sp_actualizar_material({material.id_material}, {material.Nombre}, {rol})");
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

        // DELETE: api/Materiales/5
        [Authorize(Roles = "Administrador")]
        [HttpDelete("{id:int}")]
        public async Task<ActionResult> DeleteMaterial(int id)
        {
            var rol = User.FindFirst(ClaimTypes.Role)?.Value;
            try
            {
                await _context.Database.ExecuteSqlInterpolatedAsync(
                    $"SELECT sp_eliminar_material({id}, {rol})");
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