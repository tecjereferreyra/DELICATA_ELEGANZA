using Microsoft.EntityFrameworkCore;
using DELICATA_ELEGANZA.Models;

namespace DELICATA_ELEGANZA.Data
{
    public class DelicataContext : DbContext
    {
        public DelicataContext(DbContextOptions<DelicataContext> options) : base(options) { }

        public DbSet<Productos> Productos { get; set; }
        public DbSet<Categorias> Categorias { get; set; }
        public DbSet<Marcas> Marcas { get; set; }
        public DbSet<Materiales> Materiales { get; set; }
        public DbSet<Tipos> Tipos { get; set; }
        public DbSet<TiposCierre> TiposCierre { get; set; }
        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<Capacidades> Capacidades { get; set; }
        public DbSet<Generos> Generos { get; set; }
        public DbSet<ProductoImagenes> ProductoImagenes { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // ── Claves primarias ──────────────────────────────────────────
            modelBuilder.Entity<Categorias>().HasKey(c => c.id_categoria);
            modelBuilder.Entity<Marcas>().HasKey(m => m.id_marca);
            modelBuilder.Entity<Materiales>().HasKey(m => m.id_material);
            modelBuilder.Entity<Tipos>().HasKey(t => t.id_tipo);
            modelBuilder.Entity<Productos>().HasKey(p => p.id_producto); 
            modelBuilder.Entity<TiposCierre>().HasKey(t => t.id_tipo_cierre);
            modelBuilder.Entity<Usuario>().HasKey(u => u.IdUsuario);
            modelBuilder.Entity<Capacidades>().HasKey(c => c.id_capacidad);
            modelBuilder.Entity<Generos>().HasKey(g => g.id_genero);
            modelBuilder.Entity<ProductoImagenes>().HasKey(i => i.id_imagen);

            modelBuilder.Entity<ProductoImagenes>()
                .HasOne(i => i.Producto)
                .WithMany(p => p.Imagenes)
                .HasForeignKey(i => i.id_producto)
                .OnDelete(DeleteBehavior.Cascade); // si borrás el producto, se borran sus imágenes

            modelBuilder.Entity<ProductoImagenes>()
                .HasIndex(i => i.id_producto)
                .HasDatabaseName("IX_ProductoImagenes_Producto");
            // ── Índices de Usuario ────────────────────────────────────────
            modelBuilder.Entity<Usuario>()
                .HasIndex(u => u.Correo)
                .IsUnique()
                .HasDatabaseName("UQ_Usuarios_Correo");

            // ── Relaciones de Productos ───────────────────────────────────
            modelBuilder.Entity<Productos>()
                .HasOne(p => p.Categoria)
                .WithMany()
                .HasForeignKey(p => p.id_categoria)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Productos>()
                .HasOne(p => p.Marca)
                .WithMany()
                .HasForeignKey(p => p.id_marca)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Productos>()
                .HasOne(p => p.Material)
                .WithMany()
                .HasForeignKey(p => p.id_material)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Productos>()
                .HasOne(p => p.Tipo)
                .WithMany()
                .HasForeignKey(p => p.id_tipo)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Productos>()
                .HasOne(p => p.TipoCierre)
                .WithMany()
                .HasForeignKey(p => p.id_tipo_cierre)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Productos>()
                .HasOne(p => p.Capacidad)
                .WithMany()
                .HasForeignKey(p => p.id_capacidad)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Productos>()
                .HasOne(p => p.Genero)
                .WithMany()
                .HasForeignKey(p => p.id_genero)
                .OnDelete(DeleteBehavior.SetNull);
            // ── Índices de Productos ──────────────────────────────────────
            modelBuilder.Entity<Productos>()
                .HasIndex(p => p.id_categoria)
                .HasDatabaseName("IX_Productos_Categoria");

            modelBuilder.Entity<Productos>()
                .HasIndex(p => p.id_marca)
                .HasDatabaseName("IX_Productos_Marca");

            modelBuilder.Entity<Productos>()
                .HasIndex(p => p.Disponible)
                .HasDatabaseName("IX_Productos_Disponible");
        }
    }
}

