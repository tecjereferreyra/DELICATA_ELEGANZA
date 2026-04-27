using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DELICATA_ELEGANZA.Models
{
    public class ProductoImagenes
    {
        [Key]
        public int id_imagen { get; set; }

        [Required]
        public int id_producto { get; set; }

        [Required]
        public string Url { get; set; }

        public int Orden { get; set; } = 0;

        [ForeignKey("id_producto")]
        public Productos? Producto { get; set; }
    }
}