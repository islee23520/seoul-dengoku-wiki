using SeoulKenshi.Coordinator;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<CoordinatorOptions>(
    builder.Configuration.GetSection(CoordinatorOptions.SectionName));

builder.WebHost.ConfigureKestrel((context, options) =>
{
    if (context.HostingEnvironment.IsEnvironment("Testing"))
    {
        return;
    }

    var port = context.Configuration.GetValue("Coordinator:Port", 1219);
    options.ListenAnyIP(port);
});

var app = builder.Build();

app.MapGet("/health", () => "ok");

app.Run();

public partial class Program;
