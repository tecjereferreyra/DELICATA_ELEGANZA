using System.Net.Http.Json;

namespace DELICATA_ELEGANZA.Services
{
    public class EmailService
    {
        private readonly IConfiguration _config;
        private readonly HttpClient _http;

        public EmailService(IConfiguration config)
        {
            _config = config;
            _http = new HttpClient();
            _http.DefaultRequestHeaders.Add("api-key", _config["Brevo:ApiKey"]);
        }

        private async Task EnviarMail(string emailDestino, string nombre, string subject, string texto)
        {
            var body = new
            {
                sender = new { name = "Delicata Eleganza", email = "tec.jereferreyra@gmail.com" },
                to = new[] { new { email = emailDestino, name = nombre } },
                subject = subject,
                textContent = texto
            };

            var res = await _http.PostAsJsonAsync("https://api.brevo.com/v3/smtp/email", body);
            if (!res.IsSuccessStatusCode)
            {
                var error = await res.Content.ReadAsStringAsync();
                throw new Exception($"Brevo error: {error}");
            }
        }

        public async Task EnviarMailRecuperacion(string emailDestino, string token)
        {
            string link = $"https://delicata-eleganza.onrender.com/reset.html?token={token}";
            await EnviarMail(
                emailDestino,
                emailDestino,
                "Recuperación de contraseña",
                $"Hacé click en el siguiente enlace para cambiar tu contraseña:\n\n{link}\n\nAtte: Edgar Albert."
            );
        }

        public async Task EnviarMailBienvenida(string emailDestino, string nombre)
        {
            await EnviarMail(
                emailDestino,
                nombre,
                "¡Bienvenido a DELICATA ELEGANZA!",
                $"¡Hola {nombre}!\n\nEs un gran placer decirte que ya estás formando parte de nuestro local.\nDesde ahora podrás disfrutar de nuestros productos, novedades y beneficios exclusivos.\n\nGracias por elegirnos.\n\nCon cariño,\nEdgar Albert."
            );
        }
    }
}