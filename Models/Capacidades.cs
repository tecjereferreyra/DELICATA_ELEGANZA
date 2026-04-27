using System.ComponentModel.DataAnnotations;

namespace DELICATA_ELEGANZA.Models
{
    public class Capacidades
    {
        [Key]
        public int id_capacidad { get; set; }

 
        public string Descripcion { get; set; }
    }
}