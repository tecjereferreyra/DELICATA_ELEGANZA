using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using System.Collections.Generic;
namespace DELICATA_ELEGANZA.Models
{
    public class Productos
    {
        [Key]
        public int id_producto { get; set; }

        [Required]
        public string Nombre { get; set; }
        [Required]
        public string Modelo { get; set; }
        [Required]
        public string Color { get; set; }

        [JsonPropertyName("IdCategoria")]
        public int? id_categoria { get; set; }

        [JsonPropertyName("IdMarca")]
        public int? id_marca { get; set; }

        [JsonPropertyName("IdTipo")]
        public int? id_tipo { get; set; }

        [JsonPropertyName("IdMaterial")]
        public int? id_material { get; set; }

        public int? Compartimentos { get; set; }

        public int? id_capacidad { get; set; }
        public int? id_genero { get; set; }

        [ForeignKey("id_capacidad")]
        public Capacidades? Capacidad { get; set; }

        [ForeignKey("id_genero")]
        public Generos? Genero { get; set; }   // ← esta línea te faltaba

        public decimal? Alto { get; set; }
        public decimal? Ancho { get; set; }
        public decimal? Profundidad { get; set; }
        public decimal? Peso { get; set; }
        public decimal? Diametro { get; set; }
        public int? CantidadRuedas { get; set; }

        public bool? FuelleExpandible { get; set; }

        [JsonPropertyName("IdTipoCierre")]
        public int? id_tipo_cierre { get; set; }

        [ForeignKey("id_tipo_cierre")]
        public TiposCierre? TipoCierre { get; set; }

        public int? Stock { get; set; }
        public string? ImagenUrl { get; set; }
        public bool Disponible { get; set; }

        [ForeignKey("id_categoria")]
        public Categorias? Categoria { get; set; }

        [ForeignKey("id_marca")]
        public Marcas? Marca { get; set; }

        [ForeignKey("id_material")]
        public Materiales? Material { get; set; }

        [ForeignKey("id_tipo")]
        public Tipos? Tipo { get; set; }

        public ICollection<ProductoImagenes>? Imagenes { get; set; }
    }
}