using System.Net;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Xunit;

namespace SeoulKenshi.Coordinator.Tests;

public sealed class CoordinatorHostTests : IClassFixture<CoordinatorWebApplicationFactory>
{
    private readonly CoordinatorWebApplicationFactory _factory;

    public CoordinatorHostTests(CoordinatorWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Health_returns_200_plain_ok()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/health");
        var body = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("ok", body);
    }

    [Fact]
    public void Session_options_default_to_four_guests_and_thirty_second_timeouts()
    {
        var options = _factory.Services.GetRequiredService<IOptions<CoordinatorOptions>>().Value;

        Assert.Equal(4, options.SessionMaxGuests);
        Assert.Equal(30, options.SessionHostTimeoutSeconds);
        Assert.Equal(30, options.SessionMemberTimeoutSeconds);
    }

    [Fact]
    public void WebApplicationFactory_uses_test_server_and_does_not_bind_1219()
    {
        _ = _factory.CreateClient();

        Assert.IsType<TestServer>(_factory.Server);

        var addresses = _factory.Server.Features.Get<IServerAddressesFeature>()?.Addresses
            ?? Array.Empty<string>();
        Assert.DoesNotContain(addresses, address => address.Contains(":1219", StringComparison.Ordinal));
    }
}
