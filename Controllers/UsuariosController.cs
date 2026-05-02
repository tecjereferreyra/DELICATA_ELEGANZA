using BCrypt.Net;
using DELICATA_ELEGANZA.DTO;
using DELICATA_ELEGANZA.Services;
using Microsoft.AspNetCore.Mvc;
using Npgsql;  // ← reemplaza Microsoft.Data.SqlClient

namespace DELICATA_ELEGANZA.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsuariosController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly EmailService _email;

        public UsuariosController(IConfiguration configuration, EmailService email)
        {
            _configuration = configuration;
            _email = email;
        }

        [HttpPost("registro")]
        public async Task<IActionResult> Registro([FromBody] UsuarioLogin usuario)
        {
            if (usuario == null || string.IsNullOrWhiteSpace(usuario.Nombre) ||
                string.IsNullOrWhiteSpace(usuario.Correo) || string.IsNullOrWhiteSpace(usuario.Contrasena))
                return BadRequest(new { message = "Datos incompletos" });

            string hashed = BCrypt.Net.BCrypt.HashPassword(usuario.Contrasena);

            using var con = new NpgsqlConnection(
                _configuration.GetConnectionString("DefaultConnection"));
            await con.OpenAsync();

            string query = @"INSERT INTO ""Usuarios"" (""UserName"", ""Email"", ""PasswordHash"", ""Rol"", ""Activo"", ""FechaCreacion"")
                             VALUES (@n, @c, @p, 'Usuario', true, NOW())";
            using var cmd = new NpgsqlCommand(query, con);
            cmd.Parameters.AddWithValue("@n", usuario.Nombre);
            cmd.Parameters.AddWithValue("@c", usuario.Correo);
            cmd.Parameters.AddWithValue("@p", hashed);
            await cmd.ExecuteNonQueryAsync();

            _ = Task.Run(async () =>
            {
                try { await _email.EnviarMailBienvenida(usuario.Correo, usuario.Nombre); }
                catch (Exception ex) { Console.WriteLine($"[EMAIL ERROR] Bienvenida: {ex.Message}"); }
            });
            return Ok(new { message = "Registro exitoso" });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto datos)
        {
            using var con = new NpgsqlConnection(
                _configuration.GetConnectionString("DefaultConnection"));
            await con.OpenAsync();

            string query = @"SELECT ""UserName"", ""PasswordHash"" FROM ""Usuarios""
                             WHERE ""Email"" = @Correo AND ""Activo"" = true";
            using var cmd = new NpgsqlCommand(query, con);
            cmd.Parameters.AddWithValue("@Correo", datos.Correo);

            using var rd = await cmd.ExecuteReaderAsync();

            if (!rd.HasRows)
                return Unauthorized(new { message = "Usuario no encontrado" });

            await rd.ReadAsync();
            string nombre = rd["UserName"].ToString()!;
            string hash = rd["PasswordHash"].ToString()!;

            bool ok = BCrypt.Net.BCrypt.Verify(datos.Contrasena, hash);
            if (!ok)
                return Unauthorized(new { message = "Contraseña incorrecta" });

            return Ok(new { userName = nombre, correo = datos.Correo });
        }

        [HttpPost("recuperar")]
        public async Task<IActionResult> Recuperar([FromBody] RecuperarDto dto)
        {
            if (!ModelState.IsValid) return BadRequest();

            try
            {
                using var con = new NpgsqlConnection(
                    _configuration.GetConnectionString("DefaultConnection"));
                await con.OpenAsync();

                using var cmd = new NpgsqlCommand(
                    @"SELECT ""IdUsuario"" FROM ""Usuarios"" WHERE ""Email"" = @email AND ""Activo"" = true", con);
                cmd.Parameters.AddWithValue("@email", dto.Email);
                var userId = await cmd.ExecuteScalarAsync();

                if (userId == null)
                    return Ok(new { message = "Si el correo existe, se enviará un enlace." });

                string token = Guid.NewGuid().ToString();
                DateTime expira = DateTime.UtcNow.AddMinutes(30);

                using var updateCmd = new NpgsqlCommand(@"
                    UPDATE ""Usuarios""
                    SET ""ResetToken"" = @token, ""ResetTokenExpira"" = @expira
                    WHERE ""IdUsuario"" = @id", con);
                updateCmd.Parameters.AddWithValue("@token", token);
                updateCmd.Parameters.AddWithValue("@expira", expira);
                updateCmd.Parameters.AddWithValue("@id", userId);
                await updateCmd.ExecuteNonQueryAsync();

                _ = Task.Run(async () =>
                {
                    try { await _email.EnviarMailRecuperacion(dto.Email, token); }
                    catch (Exception ex) { Console.WriteLine($"[EMAIL ERROR] Recuperar: {ex.Message}"); }
                });
                return Ok(new { message = "Si el correo existe, se enviará un enlace." });
            }
            catch (Exception ex)
            {
                Console.WriteLine("ERROR: " + ex.ToString());
                throw;
            }
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            if (!ModelState.IsValid) return BadRequest();

            using var con = new NpgsqlConnection(
                _configuration.GetConnectionString("DefaultConnection"));
            await con.OpenAsync();

            using var cmd = new NpgsqlCommand(@"
                SELECT ""IdUsuario"" FROM ""Usuarios""
                WHERE ""ResetToken"" = @token
                AND ""ResetTokenExpira"" > NOW()
                AND ""Activo"" = true", con);
            cmd.Parameters.AddWithValue("@token", dto.Token);
            var userId = await cmd.ExecuteScalarAsync();

            if (userId == null) return BadRequest();

            string hash = BCrypt.Net.BCrypt.HashPassword(dto.NuevaContrasena);

            using var updateCmd = new NpgsqlCommand(@"
                UPDATE ""Usuarios""
                SET ""PasswordHash"" = @hash, ""ResetToken"" = NULL, ""ResetTokenExpira"" = NULL
                WHERE ""IdUsuario"" = @id", con);
            updateCmd.Parameters.AddWithValue("@hash", hash);
            updateCmd.Parameters.AddWithValue("@id", userId);
            await updateCmd.ExecuteNonQueryAsync();

            return Ok();
        }

        public class UsuarioLogin
        {
            public string? Nombre { get; set; }
            public string? Correo { get; set; }
            public string? Contrasena { get; set; }
        }

        public class LoginDto
        {
            public string Correo { get; set; } = "";
            public string Contrasena { get; set; } = "";
        }
    }
}