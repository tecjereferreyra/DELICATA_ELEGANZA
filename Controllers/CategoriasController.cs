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
    public class CategoriasController : ControllerBase
    {
        private readonly DelicataContext _context;

        public CategoriasController(DelicataContext context)
        {
            _context = context;
        }

        // GET: api/Categorias
        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var lista = await _context.Categorias
                                      .AsNoTracking()
                                      .ToListAsync();
            return Ok(lista);
        }

        // GET: api/Categorias/5
        [HttpGet("{id:int}")]
        public async Task<ActionResult<Categorias>> GetCategoria(int id)
        {
            var categoria = await _context.Categorias
                                          .AsNoTracking()
                                          .FirstOrDefaultAsync(c => c.id_categoria == id);
            if (categoria == null) return NotFound();
            return Ok(categoria);
        }

        // POST: api/Categorias
        [HttpPost]
        public async Task<ActionResult<Categorias>> CreateCategoria([FromBody] Categorias categoria)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Verificar si la categoría ya existe
            var existingCategoria = await _context.Categorias
                .FirstOrDefaultAsync(c => c.Nombre.ToLower() == categoria.Nombre.ToLower());

            if (existingCategoria != null)
            {
                // Si ya existe, devolver el ID de la categoría existente
                return Ok(existingCategoria); // Devolver la categoría existente
            }

            // Si no existe, crear una nueva categoría
            _context.Categorias.Add(categoria);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCategoria), new { id = categoria.id_categoria }, categoria);
        }

        // PUT: api/Categorias
        [HttpPut]
        public async Task<ActionResult> UpdateCategoria([FromBody] Categorias categoria)
        {
            if (categoria == null || categoria.id_categoria == 0) return BadRequest("Id inválido.");
            var exists = await _context.Categorias.AnyAsync(c => c.id_categoria == categoria.id_categoria);
            if (!exists) return NotFound("Categoría no encontrada.");

            _context.Entry(categoria).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/Categorias/5
        [HttpDelete("{id:int}")]
        public async Task<ActionResult> DeleteCategoria(int id)
        {
            var categoria = await _context.Categorias.FindAsync(id);
            if (categoria == null) return NotFound("Categoría no encontrada.");

            _context.Categorias.Remove(categoria);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
