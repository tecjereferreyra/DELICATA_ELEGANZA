using System.ComponentModel.DataAnnotations;

namespace DELICATA_ELEGANZA.Models
{
    public class Generos
    {
        [Key]
        public int id_genero { get; set; }

 
        public string Descripcion { get; set; }
    }
}