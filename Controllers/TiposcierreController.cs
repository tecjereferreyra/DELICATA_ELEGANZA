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
        [HttpPost]
        public async Task<ActionResult<TiposCierre>> CreateTipoCierre([FromBody] TiposCierre tipoCierre)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var existente = await _context.TiposCierre
                .FirstOrDefaultAsync(t => t.Nombre.ToLower() == tipoCierre.Nombre.ToLower());

            if (existente != null)
                return Ok(existente);

            _context.TiposCierre.Add(tipoCierre);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTipoCierre), new { id = tipoCierre.id_tipo_cierre }, tipoCierre);
        }

        // PUT: api/TiposCierre
        [HttpPut]
        public async Task<ActionResult> UpdateTipoCierre([FromBody] TiposCierre tipoCierre)
        {
            if (tipoCierre == null || tipoCierre.id_tipo_cierre == 0) return BadRequest("Id inválido.");
            var exists = await _context.TiposCierre.AnyAsync(t => t.id_tipo_cierre == tipoCierre.id_tipo_cierre);
            if (!exists) return NotFound("Tipo de cierre no encontrado.");

            _context.Entry(tipoCierre).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/TiposCierre/5
        [HttpDelete("{id:int}")]
        public async Task<ActionResult> DeleteTipoCierre(int id)
        {
            var tipoCierre = await _context.TiposCierre.FindAsync(id);
            if (tipoCierre == null) return NotFound("Tipo de cierre no encontrado.");

            _context.TiposCierre.Remove(tipoCierre);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}