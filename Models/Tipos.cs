using System.ComponentModel.DataAnnotations;

namespace DELICATA_ELEGANZA.Models
{
    public class Tipos
    {
        [Key]
        public int? id_tipo { get; set; }
        [Required]
        public string Nombre { get; set; }
    }
}
