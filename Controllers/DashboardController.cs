using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Npgsql;
using System;
using System.Text.Json;
using System.Threading.Tasks;

namespace DELICATA_ELEGANZA.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Administrador")]
    public class DashboardController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<DashboardController> _logger;

        public DashboardController(IConfiguration configuration, ILogger<DashboardController> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        [HttpGet("resumen")]
        public async Task<IActionResult> Resumen()
        {
            try
            {
                using var con = new NpgsqlConnection(_configuration.GetConnectionString("DefaultConnection"));
                await con.OpenAsync();

                using var cmd = new NpgsqlCommand("SELECT sp_dashboard_resumen()", con);
                var resultado = await cmd.ExecuteScalarAsync();

                if (resultado == null || resultado == DBNull.Value)
                    return Ok(new { });

                using var doc = JsonDocument.Parse(resultado.ToString()!);
                return Content(doc.RootElement.GetRawText(), "application/json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener el resumen del dashboard");
                return StatusCode(500, new { mensaje = "Error al obtener el resumen del dashboard" });
            }
        }
    }
}
