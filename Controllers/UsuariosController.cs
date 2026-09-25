using BCrypt.Net;
using DELICATA_ELEGANZA.DTO;
using DELICATA_ELEGANZA.Services;
using Microsoft.AspNetCore.Mvc;
using Npgsql;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authorization;


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

            string query = @"SELECT * FROM sp_registrar_usuario(@n, @c, @p)";
            using var cmd = new NpgsqlCommand(query, con);
            cmd.Parameters.AddWithValue("@n", usuario.Nombre);
            cmd.Parameters.AddWithValue("@c", usuario.Correo);
            cmd.Parameters.AddWithValue("@p", hashed);

            try
            {
                await cmd.ExecuteNonQueryAsync();
            }
            catch (PostgresException ex) when (ex.SqlState == "23505")
            {
                return BadRequest(new { message = "Ese correo ya está registrado." });
            }
            catch (PostgresException ex) when (ex.SqlState == "23502" || ex.SqlState == "22007")
            {
                return BadRequest(new { message = ex.MessageText });
            }

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
            try
            {
                using var con = new NpgsqlConnection(_configuration.GetConnectionString("DefaultConnection"));
                await con.OpenAsync();

                string query = @"SELECT ""UserName"", ""PasswordHash"", ""Rol"" FROM ""Usuarios""
                         WHERE ""Email"" = @Correo AND ""Activo"" = true";
                using var cmd = new NpgsqlCommand(query, con);
                cmd.Parameters.AddWithValue("@Correo", datos.Correo);

                using var rd = await cmd.ExecuteReaderAsync();
                if (!rd.HasRows) return Unauthorized(new { message = "Usuario no encontrado" });

                await rd.ReadAsync();
                string nombre = rd["UserName"] == DBNull.Value ? "" : rd["UserName"].ToString()!;
                string hash = rd["PasswordHash"] == DBNull.Value ? "" : rd["PasswordHash"].ToString()!;
                string rol = rd["Rol"] == DBNull.Value ? "Usuario" : rd["Rol"].ToString()!;

                bool ok = BCrypt.Net.BCrypt.Verify(datos.Contrasena, hash);
                if (!ok) return Unauthorized(new { message = "Contraseña incorrecta" });

                string token = GenerarToken(datos.Correo, nombre, rol);
                return Ok(new { userName = nombre, correo = datos.Correo, rol = rol, token = token });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[LOGIN ERROR] {ex}");
                return StatusCode(500, new { message = "Error interno al iniciar sesión." });
            }
        }

        private string GenerarToken(string correo, string nombre, string rol)
        {
            var jwtKey = _configuration["Jwt:Key"]
                ?? throw new InvalidOperationException("Jwt:Key no configurado");

            var keyBytes = Encoding.UTF8.GetBytes(jwtKey);


            var claims = new[]
            {
        new Claim(ClaimTypes.Name, nombre),
        new Claim(ClaimTypes.Email, correo),
        new Claim(ClaimTypes.Role, rol)
    };

            var key = new SymmetricSecurityKey(keyBytes);
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(8),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
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

                string token = Guid.NewGuid().ToString();
                DateTime expira = DateTime.UtcNow.AddMinutes(30);

                object userId = null;
                using var cmd = new NpgsqlCommand(
                    @"SELECT * FROM sp_actualizar_reset_token(@email, @token, @expira)", con);
                cmd.Parameters.AddWithValue("@email", dto.Email);
                cmd.Parameters.AddWithValue("@token", token);
                cmd.Parameters.AddWithValue("@expira", expira);

                try
                {
                    using var rd = await cmd.ExecuteReaderAsync();
                    if (await rd.ReadAsync())
                        userId = rd["IdUsuario"];
                }
                catch (PostgresException ex) when (ex.SqlState == "23502" || ex.SqlState == "22007")
                {
                    return BadRequest(new { message = ex.MessageText });
                }

                if (userId == null)
                    return Ok(new { message = "Si el correo existe, se enviará un enlace." });

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

            string hash = BCrypt.Net.BCrypt.HashPassword(dto.NuevaContrasena);

            object userId = null;
            using var cmd = new NpgsqlCommand(
                @"SELECT * FROM sp_resetear_password(@token, @hash)", con);
            cmd.Parameters.AddWithValue("@token", dto.Token);
            cmd.Parameters.AddWithValue("@hash", hash);

            try
            {
                using var rd = await cmd.ExecuteReaderAsync();
                if (await rd.ReadAsync())
                    userId = rd["IdUsuario"];
            }
            catch (PostgresException ex) when (ex.SqlState == "23502")
            {
                return BadRequest(new { message = ex.MessageText });
            }

            if (userId == null) return BadRequest();

            return Ok();
        }
        [Authorize(Roles = "Administrador")]
        [HttpGet]
        public async Task<IActionResult> Listar()
        {
            try
            {
                using var con = new NpgsqlConnection(_configuration.GetConnectionString("DefaultConnection"));
                await con.OpenAsync();

                using var cmd = new NpgsqlCommand("SELECT * FROM sp_listar_usuarios()", con);
                using var rd = await cmd.ExecuteReaderAsync();

                var usuarios = new List<object>();
                while (await rd.ReadAsync())
                {
                    usuarios.Add(new
                    {
                        idUsuario = rd["IdUsuario"],
                        userName = rd["UserName"] == DBNull.Value ? "" : rd["UserName"].ToString(),
                        email = rd["Email"] == DBNull.Value ? "" : rd["Email"].ToString(),
                        rol = rd["Rol"].ToString(),
                        activo = (bool)rd["Activo"],
                        fechaCreacion = rd["FechaCreacion"]
                    });
                }
                return Ok(usuarios);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[USUARIOS LISTAR ERROR] {ex}");
                return StatusCode(500, new { message = "Error al listar usuarios" });
            }
        }

        [Authorize(Roles = "Administrador")]
        [HttpPatch("{id}/rol")]
        public async Task<IActionResult> ActualizarRol(int id, [FromBody] ActualizarRolDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Rol))
                return BadRequest(new { message = "Rol requerido" });

            try
            {
                using var con = new NpgsqlConnection(_configuration.GetConnectionString("DefaultConnection"));
                await con.OpenAsync();

                using var cmd = new NpgsqlCommand("SELECT * FROM sp_actualizar_rol_usuario(@id, @rol)", con);
                cmd.Parameters.AddWithValue("@id", id);
                cmd.Parameters.AddWithValue("@rol", dto.Rol);

                using var rd = await cmd.ExecuteReaderAsync();
                if (!await rd.ReadAsync()) return NotFound();

                return Ok(new { idUsuario = rd["IdUsuario"], rol = rd["Rol"].ToString() });
            }
            catch (PostgresException ex) when (ex.SqlState == "P0002") { return NotFound(); }
            catch (PostgresException ex) when (ex.SqlState == "22023") { return BadRequest(new { message = "Rol inválido" }); }
            catch (Exception ex)
            {
                Console.WriteLine($"[USUARIOS ROL ERROR] {ex}");
                return StatusCode(500, new { message = "Error al actualizar el rol" });
            }
        }

        public class ActualizarRolDto
        {
            public string Rol { get; set; } = "";
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