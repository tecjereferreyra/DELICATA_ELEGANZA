using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DELICATA_ELEGANZA.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Capacidades",
                columns: table => new
                {
                    id_capacidad = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Descripcion = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Capacidades", x => x.id_capacidad);
                });

            migrationBuilder.CreateTable(
                name: "Categorias",
                columns: table => new
                {
                    id_categoria = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categorias", x => x.id_categoria);
                });

            migrationBuilder.CreateTable(
                name: "Generos",
                columns: table => new
                {
                    id_genero = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Descripcion = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Generos", x => x.id_genero);
                });

            migrationBuilder.CreateTable(
                name: "Marcas",
                columns: table => new
                {
                    id_marca = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Marcas", x => x.id_marca);
                });

            migrationBuilder.CreateTable(
                name: "Materiales",
                columns: table => new
                {
                    id_material = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Materiales", x => x.id_material);
                });

            migrationBuilder.CreateTable(
                name: "Tipos",
                columns: table => new
                {
                    id_tipo = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tipos", x => x.id_tipo);
                });

            migrationBuilder.CreateTable(
                name: "TiposCierre",
                columns: table => new
                {
                    id_tipo_cierre = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TiposCierre", x => x.id_tipo_cierre);
                });

            migrationBuilder.CreateTable(
                name: "Usuarios",
                columns: table => new
                {
                    IdUsuario = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Apellido = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Correo = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    NombreUsuario = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Password = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Rol = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuarios", x => x.IdUsuario);
                });

            migrationBuilder.CreateTable(
                name: "Productos",
                columns: table => new
                {
                    id_producto = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Modelo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Color = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    id_categoria = table.Column<int>(type: "int", nullable: true),
                    id_marca = table.Column<int>(type: "int", nullable: true),
                    id_tipo = table.Column<int>(type: "int", nullable: true),
                    id_material = table.Column<int>(type: "int", nullable: true),
                    Compartimentos = table.Column<int>(type: "int", nullable: true),
                    id_capacidad = table.Column<int>(type: "int", nullable: true),
                    id_genero = table.Column<int>(type: "int", nullable: true),
                    Alto = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    Ancho = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    Profundidad = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    Peso = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    Diametro = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    CantidadRuedas = table.Column<int>(type: "int", nullable: true),
                    FuelleExpandible = table.Column<bool>(type: "bit", nullable: true),
                    id_tipo_cierre = table.Column<int>(type: "int", nullable: true),
                    Stock = table.Column<int>(type: "int", nullable: true),
                    ImagenUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Disponible = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Productos", x => x.id_producto);
                    table.ForeignKey(
                        name: "FK_Productos_Capacidades_id_capacidad",
                        column: x => x.id_capacidad,
                        principalTable: "Capacidades",
                        principalColumn: "id_capacidad",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Productos_Categorias_id_categoria",
                        column: x => x.id_categoria,
                        principalTable: "Categorias",
                        principalColumn: "id_categoria",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Productos_Generos_id_genero",
                        column: x => x.id_genero,
                        principalTable: "Generos",
                        principalColumn: "id_genero",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Productos_Marcas_id_marca",
                        column: x => x.id_marca,
                        principalTable: "Marcas",
                        principalColumn: "id_marca",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Productos_Materiales_id_material",
                        column: x => x.id_material,
                        principalTable: "Materiales",
                        principalColumn: "id_material",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Productos_TiposCierre_id_tipo_cierre",
                        column: x => x.id_tipo_cierre,
                        principalTable: "TiposCierre",
                        principalColumn: "id_tipo_cierre",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Productos_Tipos_id_tipo",
                        column: x => x.id_tipo,
                        principalTable: "Tipos",
                        principalColumn: "id_tipo",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "ProductoImagenes",
                columns: table => new
                {
                    id_imagen = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    id_producto = table.Column<int>(type: "int", nullable: false),
                    Url = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Orden = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductoImagenes", x => x.id_imagen);
                    table.ForeignKey(
                        name: "FK_ProductoImagenes_Productos_id_producto",
                        column: x => x.id_producto,
                        principalTable: "Productos",
                        principalColumn: "id_producto",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProductoImagenes_Producto",
                table: "ProductoImagenes",
                column: "id_producto");

            migrationBuilder.CreateIndex(
                name: "IX_Productos_Categoria",
                table: "Productos",
                column: "id_categoria");

            migrationBuilder.CreateIndex(
                name: "IX_Productos_Disponible",
                table: "Productos",
                column: "Disponible");

            migrationBuilder.CreateIndex(
                name: "IX_Productos_id_capacidad",
                table: "Productos",
                column: "id_capacidad");

            migrationBuilder.CreateIndex(
                name: "IX_Productos_id_genero",
                table: "Productos",
                column: "id_genero");

            migrationBuilder.CreateIndex(
                name: "IX_Productos_id_material",
                table: "Productos",
                column: "id_material");

            migrationBuilder.CreateIndex(
                name: "IX_Productos_id_tipo",
                table: "Productos",
                column: "id_tipo");

            migrationBuilder.CreateIndex(
                name: "IX_Productos_id_tipo_cierre",
                table: "Productos",
                column: "id_tipo_cierre");

            migrationBuilder.CreateIndex(
                name: "IX_Productos_Marca",
                table: "Productos",
                column: "id_marca");

            migrationBuilder.CreateIndex(
                name: "UQ_Usuarios_Correo",
                table: "Usuarios",
                column: "Correo",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProductoImagenes");

            migrationBuilder.DropTable(
                name: "Usuarios");

            migrationBuilder.DropTable(
                name: "Productos");

            migrationBuilder.DropTable(
                name: "Capacidades");

            migrationBuilder.DropTable(
                name: "Categorias");

            migrationBuilder.DropTable(
                name: "Generos");

            migrationBuilder.DropTable(
                name: "Marcas");

            migrationBuilder.DropTable(
                name: "Materiales");

            migrationBuilder.DropTable(
                name: "TiposCierre");

            migrationBuilder.DropTable(
                name: "Tipos");
        }
    }
}
