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

            // Si no existe, crear un nuevo material
            _context.Materiales.Add(material);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMaterial), new { id = material.id_material }, material);
        }

        // PUT: api/Materiales
        [HttpPut]
        public async Task<ActionResult> UpdateMaterial([FromBody] Materiales material)
        {
            if (material == null || material.id_material == 0) return BadRequest("Id inválido.");
            var exists = await _context.Materiales.AnyAsync(m => m.id_material == material.id_material);
            if (!exists) return NotFound("Material no encontrado.");

            _context.Entry(material).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/Materiales/5
        [HttpDelete("{id:int}")]
        public async Task<ActionResult> DeleteMaterial(int id)
        {
            var material = await _context.Materiales.FindAsync(id);
            if (material == null) return NotFound("Material no encontrado.");

            _context.Materiales.Remove(material);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
