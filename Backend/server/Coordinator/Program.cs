using SeoulKenshi.Coordinator;

var builder = CoordinatorApp.CreateBuilder(args);

builder.WebHost.ConfigureKestrel((context, options) =>
{
    if (context.HostingEnvironment.IsEnvironment("Testing"))
    {
        return;
    }

    var port = context.Configuration.GetValue("Coordinator:Port", 1219);
    options.ListenAnyIP(port);
});

var app = CoordinatorApp.Build(builder);

app.Run();

public partial class Program;
