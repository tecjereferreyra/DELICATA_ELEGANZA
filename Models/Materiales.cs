using System.ComponentModel.DataAnnotations;

namespace DELICATA_ELEGANZA.Models
{
    public class Materiales
    {
        [Key]
        public int? id_material { get; set; }
        [Required]
        public string Nombre { get; set; }
    }
}
