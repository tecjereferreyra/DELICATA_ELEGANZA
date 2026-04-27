using System.ComponentModel.DataAnnotations;

namespace DELICATA_ELEGANZA.DTO
{
    public class ResetPasswordDto
    {
        [Required]
        public string Token { get; set; }

        [Required]
        public string NuevaContrasena { get; set; }
    }
}

