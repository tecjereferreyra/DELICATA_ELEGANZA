using System.ComponentModel.DataAnnotations;

namespace DELICATA_ELEGANZA.DTO
{
    public class RecuperarDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }
    }
}

