using Backend.Data;
using Backend.Hubs;
using Backend.Services;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=sea-battle.db"));

builder.Services.AddSingleton<GameService>();
builder.Services.AddSingleton<AiService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
    {
        policy
            .AllowAnyHeader()
            .AllowAnyMethod()
            .SetIsOriginAllowed(_ => true)
            .AllowCredentials();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
    EnsureStatisticsColumns(db);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("frontend");
app.UseHttpsRedirection();

app.MapControllers();
app.MapHub<GameHub>("/hubs/game");

app.Run();

static void EnsureStatisticsColumns(AppDbContext db)
{
    try
    {
        db.Database.ExecuteSqlRaw("ALTER TABLE Statistics ADD COLUMN Experience INTEGER NOT NULL DEFAULT 0;");
    }
    catch
    {
        // Column already exists.
    }

    try
    {
        db.Database.ExecuteSqlRaw("ALTER TABLE Statistics ADD COLUMN Level INTEGER NOT NULL DEFAULT 1;");
    }
    catch
    {
        // Column already exists.
    }
}
