using System.ComponentModel.DataAnnotations;

namespace DELICATA_ELEGANZA.Models
{
    public class Categorias
    {
        [Key]
        public int? id_categoria { get; set; }
        [Required]
        public string Nombre { get; set; }
    }
}
