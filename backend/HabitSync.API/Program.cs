using System.Text;
using HabitSync.API.config;
using HabitSync.API.Data;
using HabitSync.API.Hubs;
using HabitSync.API.Services;
using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

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
// HttpClient cho Expo Push API
builder.Services.AddHttpClient("expo", client =>
{
    client.BaseAddress = new Uri("https://exp.host");
    client.DefaultRequestHeaders.Add("Accept", "application/json");
});

builder.Services.AddScoped<IPartnershipService, PartnershipService>();
builder.Services.AddScoped<IUserService, UserService>();

builder.Services.AddSignalR();
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = true;
});

builder.Services.AddScoped<IChatService, ChatService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IStatsService, StatsService>();

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
// Thêm Hangfire job nhắc nhở lúc 21:00 mỗi ngày
RecurringJob.AddOrUpdate<INotificationService>(
    "daily-reminder",
    service => service.SendDailyReminderAsync(),
    "0 21 * * *" // Cron: phút 0, giờ 21, mỗi ngày
);


app.UseAuthentication();
app.UseAuthorization();

app.MapHub<ChatHub>("/hubs/chat");

app.MapControllers();
app.Run();