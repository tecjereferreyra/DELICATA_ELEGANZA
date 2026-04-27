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
        [HttpPost]
        public async Task<ActionResult<Capacidades>> CreateCapacidad([FromBody] Capacidades capacidad)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var existente = await _context.Capacidades
                .FirstOrDefaultAsync(c => c.Descripcion.ToLower() == capacidad.Descripcion.ToLower());

            if (existente != null)
                return Ok(existente);

            _context.Capacidades.Add(capacidad);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCapacidad), new { id = capacidad.id_capacidad }, capacidad);
        }

        // PUT: api/Capacidades
        [HttpPut]
        public async Task<ActionResult> UpdateCapacidad([FromBody] Capacidades capacidad)
        {
            if (capacidad == null || capacidad.id_capacidad == 0) return BadRequest("Id inválido.");
            var exists = await _context.Capacidades.AnyAsync(c => c.id_capacidad == capacidad.id_capacidad);
            if (!exists) return NotFound("Capacidad no encontrada.");

            _context.Entry(capacidad).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/Capacidades/5
        [HttpDelete("{id:int}")]
        public async Task<ActionResult> DeleteCapacidad(int id)
        {
            var capacidad = await _context.Capacidades.FindAsync(id);
            if (capacidad == null) return NotFound("Capacidad no encontrada.");

            _context.Capacidades.Remove(capacidad);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
