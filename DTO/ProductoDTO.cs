using System.Text.Json.Serialization;
using System.Collections.Generic;
public class ProductoDTO
{
    [JsonPropertyName("idProducto")]
    public int IdProducto { get; set; }

    [JsonPropertyName("nombre")]
    public string Nombre { get; set; }

    [JsonPropertyName("modelo")]
    public string Modelo { get; set; }

    [JsonPropertyName("color")]
    public string Color { get; set; }

    [JsonPropertyName("idCategoria")]
    public int? IdCategoria { get; set; }

    [JsonPropertyName("categoria")]
    public string Categoria { get; set; }

    [JsonPropertyName("idMarca")]
    public int? IdMarca { get; set; }

    [JsonPropertyName("marca")]
    public string Marca { get; set; }

    [JsonPropertyName("idMaterial")]
    public int? IdMaterial { get; set; }

    [JsonPropertyName("material")]
    public string Material { get; set; }

    [JsonPropertyName("idTipo")]
    public int? IdTipo { get; set; }

    [JsonPropertyName("tipo")]
    public string Tipo { get; set; }

    [JsonPropertyName("idCapacidad")]
    public int? IdCapacidad { get; set; }

    [JsonPropertyName("capacidad")]
    public string? Capacidad { get; set; }

    [JsonPropertyName("compartimentos")]
    public int? Compartimentos { get; set; }

    [JsonPropertyName("alto")]
    public decimal? Alto { get; set; }

    [JsonPropertyName("ancho")]
    public decimal? Ancho { get; set; }

    [JsonPropertyName("profundidad")]
    public decimal? Profundidad { get; set; }

    [JsonPropertyName("peso")]
    public decimal? Peso { get; set; }

    [JsonPropertyName("idGenero")]
    public int? IdGenero { get; set; }

    [JsonPropertyName("genero")]
    public string? Genero { get; set; }

    [JsonPropertyName("diametro")]
    public decimal? Diametro { get; set; }

    [JsonPropertyName("cantidadRuedas")]
    public int? CantidadRuedas { get; set; }

    [JsonPropertyName("fuelleExpandible")]
    public bool? FuelleExpandible { get; set; }

    [JsonPropertyName("idTipoCierre")]
    public int? IdTipoCierre { get; set; }

    [JsonPropertyName("tipoCierre")]
    public string? TipoCierre { get; set; }

    [JsonPropertyName("stock")]
    public int? Stock { get; set; }

    [JsonPropertyName("imagenUrl")]
    public string? ImagenUrl { get; set; }

    [JsonPropertyName("disponible")]
    public bool Disponible { get; set; }

    [JsonPropertyName("imagenes")]
    public List<string>? Imagenes { get; set; }
}