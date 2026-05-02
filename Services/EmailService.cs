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
            _http.DefaultRequestHeaders.Add(
                "Authorization",
                $"Bearer {_config["Resend:ApiKey"]}"
            );
        }

        public async Task EnviarMailRecuperacion(string emailDestino, string token)
        {
            string link = $"https://delicata-eleganza.onrender.com/reset.html?token={token}";

            var body = new
            {
                from = "Delicata Eleganza <onboarding@resend.dev>",
                to = new[] { emailDestino },
                subject = "Recuperación de contraseña",
                text = $"Hacé click en el siguiente enlace para cambiar tu contraseña:\n\n{link}\n\nAtte: Edgar Albert."
            };

            var res = await _http.PostAsJsonAsync("https://api.resend.com/emails", body);
            if (!res.IsSuccessStatusCode)
            {
                var error = await res.Content.ReadAsStringAsync();
                throw new Exception($"Resend error: {error}");
            }
        }

        public async Task EnviarMailBienvenida(string emailDestino, string nombre)
        {
            var body = new
            {
                from = "Delicata Eleganza <onboarding@resend.dev>",
                to = new[] { emailDestino },
                subject = "¡Bienvenido a DELICATA ELEGANZA!",
                text = $"¡Hola {nombre}!\n\nEs un gran placer decirte que ya estás formando parte de nuestro local.\nDesde ahora podrás disfrutar de nuestros productos, novedades y beneficios exclusivos.\n\nGracias por elegirnos.\n\nCon cariño,\nEdgar Albert."
            };

            var res = await _http.PostAsJsonAsync("https://api.resend.com/emails", body);
            if (!res.IsSuccessStatusCode)
            {
                var error = await res.Content.ReadAsStringAsync();
                throw new Exception($"Resend error: {error}");
            }
        }
    }
}