using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("Usuarios")]
public class Usuario
{
    [Key]
    public int IdUsuario { get; set; }

    [Column("UserName")]
    public string? UserName { get; set; }

    [Column("Email")]
    public string? Email { get; set; }

    [Column("PasswordHash")]
    public string? PasswordHash { get; set; }

    public string Rol { get; set; } = "Usuario";
    public bool Activo { get; set; } = true;
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public string? ResetToken { get; set; }
    public DateTime? ResetTokenExpira { get; set; }
}