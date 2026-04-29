using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace DELICATA_ELEGANZA.Services
{
    public class EmailService
    {
        private readonly IConfiguration _config;

        public EmailService(IConfiguration config)
        {
            _config = config;
        }

        public async Task EnviarMailRecuperacion(string emailDestino, string token)
        {
            var smtp = _config.GetSection("Smtp");

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(
                "Delicata Eleganza",
                smtp["From"]
            ));

            message.To.Add(MailboxAddress.Parse(emailDestino));
            message.Subject = "Recuperación de contraseña";

            string link = $"https://delicata-eleganza.onrender.com/reset.html?token={token}";

            message.Body = new TextPart("plain")
            {
                Text = $"Hacé click en el siguiente enlace para cambiar tu contraseña:\n\n{link}\n\nAtte: Edgar Albert."
            };

            using var client = new SmtpClient();

            await client.ConnectAsync(
                smtp["Host"],
                int.Parse(smtp["Port"]),
                SecureSocketOptions.StartTls
            );

            await client.AuthenticateAsync(
                smtp["User"],
                smtp["Pass"]
            );

            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }

        // ✅ ESTE MÉTODO VA ADENTRO DE LA CLASE
        public async Task EnviarMailBienvenida(string emailDestino, string nombre)
        {
            var smtp = _config.GetSection("Smtp");

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(
                "Delicata Eleganza",
                smtp["From"]
            ));

            message.To.Add(MailboxAddress.Parse(emailDestino));
            message.Subject = "¡Bienvenido a DELICATA ELEGANZA!";

            message.Body = new TextPart("plain")
            {
                Text =
$@"
¡Hola {nombre}!,

Es un gran placer decirte que ya estás formando parte de nuestro local.
Desde ahora podrás disfrutar de nuestros productos, novedades y beneficios exclusivos.

Gracias por elegirnos.

Con cariño,
Edgar Albert."
            };

            using var client = new SmtpClient();

            await client.ConnectAsync(
                smtp["Host"],
                int.Parse(smtp["Port"]),
                SecureSocketOptions.StartTls
            );

            await client.AuthenticateAsync(
                smtp["User"],
                smtp["Pass"]
            );

            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }
    }
}
