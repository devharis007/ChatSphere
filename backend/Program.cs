using ChatSphere.Api.Hubs;
using ChatSphere.Api.Services;

var builder = WebApplication.CreateBuilder(args);

const string FrontendCorsPolicy = "FrontendCorsPolicy";

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddSignalR();

// In-memory, thread-safe state for connected users / rooms. Singletons because the
// mappings must be shared across every hub invocation and HTTP request.
builder.Services.AddSingleton<ChatConnectionStore>();
builder.Services.AddSingleton<RoomCatalog>();

// The React dev server (Vite) runs on http://localhost:5173 by default. SignalR needs
// credentials allowed and an explicit origin list (wildcard "*" is not permitted
// together with AllowCredentials).
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:5173", "http://127.0.0.1:5173" };

builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCorsPolicy, policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// HTTPS redirection is intentionally left off for local development: it simplifies
// running the demo (no dev-certificate trust step) for the plain `http://localhost:5082`
// origin used by the frontend. Re-enable behind a reverse proxy / real deployment.
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors(FrontendCorsPolicy);

app.UseAuthorization();

app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat");

app.Run();
