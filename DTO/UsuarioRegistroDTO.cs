using System.ComponentModel.DataAnnotations;
namespace DELICATA_ELEGANZA.DTO
{
    public class UsuarioRegistroDto
    {
        public string NombreUsuario { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
    }
}