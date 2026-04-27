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
    public class MarcasController : ControllerBase
    {
        private readonly DelicataContext _context;

        public MarcasController(DelicataContext context)
        {
            _context = context;
        }

        // GET: api/Marcas
        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var lista = await _context.Marcas
                                      .AsNoTracking()
                                      .ToListAsync();
            return Ok(lista);
        }

        // GET: api/Marcas/5
        [HttpGet("{id:int}")]
        public async Task<ActionResult<Marcas>> GetMarca(int id)
        {
            var marca = await _context.Marcas
                                      .AsNoTracking()
                                      .FirstOrDefaultAsync(m => m.id_marca == id);
            if (marca == null) return NotFound("Marca no encontrada.");
            return Ok(marca);
        }

        // POST: api/Marcas
        [HttpPost]
        public async Task<ActionResult<Marcas>> CreateMarca([FromBody] Marcas marca)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Verificar si la marca ya existe
            var existingMarca = await _context.Marcas
                .FirstOrDefaultAsync(m => m.Nombre.ToLower() == marca.Nombre.ToLower());

            if (existingMarca != null)
            {
                // Si ya existe, devolver el ID de la marca existente
                return Ok(existingMarca); // Devolver la marca existente
            }

            // Si no existe, crear una nueva marca
            _context.Marcas.Add(marca);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMarca), new { id = marca.id_marca }, marca);
        }

        // PUT: api/Marcas
        [HttpPut]
        public async Task<ActionResult> UpdateMarca([FromBody] Marcas marca)
        {
            if (marca == null || marca.id_marca == 0) return BadRequest("Id inválido.");
            var exists = await _context.Marcas.AnyAsync(m => m.id_marca == marca.id_marca);
            if (!exists) return NotFound("Marca no encontrada.");

            _context.Entry(marca).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/Marcas/5
        [HttpDelete("{id:int}")]
        public async Task<ActionResult> DeleteMarca(int id)
        {
            var marca = await _context.Marcas.FindAsync(id);
            if (marca == null) return NotFound("Marca no encontrada.");

            _context.Marcas.Remove(marca);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
