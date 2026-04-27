using System.ComponentModel.DataAnnotations;

namespace DELICATA_ELEGANZA.Models
{
    public class TiposCierre
    {
        [Key]
        public int id_tipo_cierre { get; set; }


        public string Nombre { get; set; }
    }
}