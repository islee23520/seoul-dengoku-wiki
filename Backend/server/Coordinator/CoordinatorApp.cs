using SeoulKenshi.Coordinator.Api;
using SeoulKenshi.Coordinator.Identity;
using SeoulKenshi.Coordinator.Relay;
using SeoulKenshi.Coordinator.Session;

namespace SeoulKenshi.Coordinator;

/// <summary>
/// Program과 릴레이 통합 테스트가 같은 서비스·파이프라인을 쓰게 하는 조립기.
/// 포트 바인딩만 호출자(Program: Kestrel 1219, 테스트: 임시 포트)가 정한다.
/// </summary>
public static class CoordinatorApp
{
    public static WebApplicationBuilder CreateBuilder(string[]? args = null)
    {
        var builder = WebApplication.CreateBuilder(args ?? Array.Empty<string>());

        builder.Services.Configure<CoordinatorOptions>(
            builder.Configuration.GetSection(CoordinatorOptions.SectionName));

        builder.Services.AddSingleton<IdentityStore>();
        builder.Services.AddSingleton<SessionRegistry>();
        builder.Services.AddSingleton<SessionRelayHub>();

        return builder;
    }

    public static WebApplication Build(WebApplicationBuilder builder)
    {
        var app = builder.Build();

        app.UseWebSockets();
        app.MapGet("/health", () => "ok");
        app.MapAuth();
        app.MapSessionRoutes();

        return app;
    }
}
