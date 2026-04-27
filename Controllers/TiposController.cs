using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using System.Collections.Generic;
using DELICATA_ELEGANZA.Data;
using DELICATA_ELEGANZA.Models;

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

            // Si no existe, crear un nuevo tipo
            _context.Tipos.Add(tipo);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTipo), new { id = tipo.id_tipo }, tipo);
        }

        // PUT: api/Tipos
        [HttpPut]
        public async Task<ActionResult> UpdateTipo([FromBody] Tipos tipo)
        {
            if (tipo == null || tipo.id_tipo == 0) return BadRequest("Id inválido.");
            var exists = await _context.Tipos.AnyAsync(t => t.id_tipo == tipo.id_tipo);
            if (!exists) return NotFound("Tipo no encontrado.");

            _context.Entry(tipo).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/Tipos/5
        [HttpDelete("{id:int}")]
        public async Task<ActionResult> DeleteTipo(int id)
        {
            var tipo = await _context.Tipos.FindAsync(id);
            if (tipo == null) return NotFound("Tipo no encontrado.");

            _context.Tipos.Remove(tipo);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
