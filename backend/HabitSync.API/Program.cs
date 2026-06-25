using System.Text;
using HabitSync.API.config;
using HabitSync.API.Data;
using HabitSync.API.Services;
using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

// JWT Auth
var jwtSettings = builder.Configuration.GetSection("Jwt");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSettings["Secret"]!))
        };
    });

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IHabitService, HabitService>();

builder.Services.AddHangfire(config =>
    config.UsePostgreSqlStorage(
        builder.Configuration.GetConnectionString("Default")));
builder.Services.AddHangfireServer();

builder.Services.AddScoped<IPartnershipService, PartnershipService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddControllers();

builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer<BearerSecuritySchemeTransformer>();
});

var app = builder.Build();

app.MapOpenApi();         
app.MapScalarApiReference(); 
app.UseHangfireDashboard("/hangfire"); 

// Schedule job chạy lúc 23:59 mỗi ngày
// Cron expression: "59 23 * * *" = phút 59, giờ 23, mọi ngày
RecurringJob.AddOrUpdate<IPartnershipService>(
    "evaluate-shared-streaks",
    service => service.EvaluateSharedStreaksAsync(),
    "59 23 * * *"
);


app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();