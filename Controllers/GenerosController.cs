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
        [HttpPost]
        public async Task<ActionResult<Generos>> CreateGenero([FromBody] Generos genero)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var existente = await _context.Generos
                .FirstOrDefaultAsync(g => g.Descripcion.ToLower() == genero.Descripcion.ToLower());

            if (existente != null)
                return Ok(existente);

            _context.Generos.Add(genero);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetGenero), new { id = genero.id_genero }, genero);
        }

        // PUT: api/Generos
        [HttpPut]
        public async Task<ActionResult> UpdateGenero([FromBody] Generos genero)
        {
            if (genero == null || genero.id_genero == 0) return BadRequest("Id inválido.");
            var exists = await _context.Generos.AnyAsync(g => g.id_genero == genero.id_genero);
            if (!exists) return NotFound("Género no encontrado.");

            _context.Entry(genero).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/Generos/5
        [HttpDelete("{id:int}")]
        public async Task<ActionResult> DeleteGenero(int id)
        {
            var genero = await _context.Generos.FindAsync(id);
            if (genero == null) return NotFound("Género no encontrado.");

            _context.Generos.Remove(genero);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}