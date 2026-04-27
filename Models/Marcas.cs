using System.ComponentModel.DataAnnotations;

namespace DELICATA_ELEGANZA.Models
{
    public class Marcas
    {
        [Key]
        public int? id_marca {  get; set; }
        [Required]
        public string Nombre { get; set; }
    }
}
