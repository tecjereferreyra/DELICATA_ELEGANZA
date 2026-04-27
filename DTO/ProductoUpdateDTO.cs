using System.ComponentModel.DataAnnotations;

namespace DELICATA_ELEGANZA.DTO
{
    public class ProductoUpdateDTO
    {
        [Required(ErrorMessage = "El producto debe contener un nombre obligatoriamente.")]
        public string Nombre { get; set; }

        public string Modelo { get; set; }
        public string Color { get; set; }

        public string Categoria { get; set; }
        public string Marca { get; set; }
        public string Tipo { get; set; }
        public string Material { get; set; }

        public int? Compartimentos { get; set; }
        public string Capacidad { get; set; }   // sigue siendo string
        public decimal? Alto { get; set; }
        public decimal? Ancho { get; set; }
        public decimal? Profundidad { get; set; }
        public decimal? Peso { get; set; }
        public string Genero { get; set; }      // ídem
        public decimal? Diametro { get; set; }
        public int? CantidadRuedas { get; set; }

        public bool? FuelleExpandible { get; set; }
        public string? TipoCierre { get; set; }
        public int? Stock { get; set; }
        public string? ImagenUrl { get; set; }
        public int? IdTipoCierre { get; set; }
    }
}