using DELICATA_ELEGANZA.Data;
using DELICATA_ELEGANZA.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IO.Compression;
using System.Text;
using Npgsql.EntityFrameworkCore.PostgreSQL; 
var builder = WebApplication.CreateBuilder(args);

// ==========================================
// SERVICIOS
// ==========================================

// 1. COMPRESIÓN (Brotli + Gzip)
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
    options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(new[]
    {
        "text/html",
        "text/css",
        "application/javascript",
        "font/woff2",
        "font/woff",
        "font/ttf",
        "font/eot",
        "application/font-woff2",
        "application/font-woff",
        "image/svg+xml"
    });
});

builder.Services.Configure<BrotliCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.Fastest;
});

builder.Services.Configure<GzipCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.Optimal;
});

// 2. CONTROLLERS + JSON
builder.Services
    .AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.PropertyNamingPolicy = null;
        opts.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

// 3. EMAIL SERVICE
builder.Services.AddScoped<EmailService>();

// 4. BASE DE DATOS
// ✅ DESPUÉS — PostgreSQL
builder.Services.AddDbContext<DelicataContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// 5. RESPONSE CACHE
builder.Services.AddResponseCaching();
builder.Services.AddMemoryCache();
// 5. SWAGGER
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.OperationFilter<DELICATA_ELEGANZA.Swagger.FileUploadOperationFilter>();
});

// 6. CORS — una sola política que cubre todo
builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirTodo", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// 7. AUTENTICACIÓN JWT
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Jwt:Key no configurado en appsettings.json");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

// ==========================================
// BUILD
// ==========================================
var app = builder.Build();

// ==========================================
// PIPELINE (ORDEN CRÍTICO)
// ==========================================

// 1. Compresión — debe ser lo primero para comprimir todo lo que sigue
app.UseResponseCompression();
app.UseCors("PermitirTodo");
app.UseResponseCaching();

// 3. Swagger — solo en desarrollo
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// 4. HTTPS Redirect — solo en producción
//    Va DESPUÉS de StaticFiles para no romper las peticiones al frontend
if (app.Environment.IsProduction())
{
    app.UseHttpsRedirection();
}

// 5. Archivos estáticos con caché diferenciado
//    UseDefaultFiles DEBE ir antes de UseStaticFiles
app.UseDefaultFiles();   // mapea "/" → "/index.html"

app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        var path = ctx.File.PhysicalPath ?? ctx.Context.Request.Path.Value ?? "";

        if (path.EndsWith(".woff2") || path.EndsWith(".woff") ||
            path.EndsWith(".ttf") || path.EndsWith(".eot"))
        {
            // Fuentes: inmutables, 1 año
            ctx.Context.Response.Headers.Append("Cache-Control", "public, max-age=31536000, immutable");
        }
        else if (path.EndsWith(".css") || path.EndsWith(".js"))
        {
            // CSS/JS: 1 día (así el fix de las constantes se ve rápido)
            ctx.Context.Response.Headers.Append("Cache-Control", "public, max-age=86400");
        }
        else if (path.EndsWith(".jpg") || path.EndsWith(".jpeg") ||
                 path.EndsWith(".png") || path.EndsWith(".webp") ||
                 path.EndsWith(".svg") || path.EndsWith(".ico"))
        {
            // Imágenes: 1 año
            ctx.Context.Response.Headers.Append("Cache-Control", "public, max-age=31536000, immutable");
        }
        else if (path.EndsWith(".html"))
        {
            // HTML: sin caché para siempre recibir la versión más nueva
            ctx.Context.Response.Headers.Append("Cache-Control", "no-cache, no-store, must-revalidate");
        }
        else
        {
            // Resto: 1 día
            ctx.Context.Response.Headers.Append("Cache-Control", "public, max-age=86400");
        }
    }
});

// 6. Routing
app.UseRouting();

// 7. Autenticación ANTES que Autorización (orden obligatorio)
app.UseAuthentication();
app.UseAuthorization();

// 8. Controllers
app.MapControllers();

// Fallback: cualquier ruta no encontrada devuelve index.html (SPA)
app.MapFallbackToFile("index.html");

app.Run();