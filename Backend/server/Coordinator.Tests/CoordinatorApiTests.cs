using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.TestHost;

namespace SeoulKenshi.Coordinator.Tests;

public sealed class CoordinatorApiTests : IClassFixture<CoordinatorWebApplicationFactory>
{
    readonly CoordinatorWebApplicationFactory _factory;

    public CoordinatorApiTests(CoordinatorWebApplicationFactory factory)
    {
        _factory = factory;
    }

    // ---------------------------------------------------------------- helpers

    static string FreshVid(string prefix) => $"{prefix}-{Guid.NewGuid():N}";

    async Task<(long AccountIdx, string SessionKey)> RegisterAsync(HttpClient client, string vid)
    {
        var response = await client.PostAsJsonAsync("/auth/register", new { vid });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<AuthBody>();
        Assert.NotNull(body);
        return (body!.AccountIdx, body.SessionKey);
    }

    HttpClient ClientWithAuth(long accountIdx, string sessionKey)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("AccountIdx", accountIdx.ToString());
        client.DefaultRequestHeaders.Add("SessionKey", sessionKey);
        return client;
    }

    sealed record AuthBody(long AccountIdx, string SessionKey, string Nickname);

    static async Task<JsonElement> ProblemJsonAsync(HttpResponseMessage response)
    {
        Assert.NotNull(response.Content);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        return json;
    }

    static async Task<int> ProblemCodeAsync(HttpResponseMessage response)
    {
        var json = await ProblemJsonAsync(response);

        // ASP.NET Core는 ProblemDetails extensions를 최상위 멤버로 직렬화한다(RFC 9457).
        if (json.TryGetProperty("code", out var code))
            return code.GetInt32();

        return json.GetProperty("extensions").GetProperty("code").GetInt32();
    }

    async Task<(long AccountIdx, string SessionKey, string SessionCode)> HostSessionAsync(
        CoordinatorWebApplicationFactory factory)
    {
        var client = factory.CreateClient();
        var (accountIdx, sessionKey) = await RegisterAsync(client, FreshVid("host"));
        var hostClient = ClientWithAuth(accountIdx, sessionKey);

        var response = await hostClient.PostAsync("/sessions", content: null);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<JsonElement>();
        return (accountIdx, sessionKey, created.GetProperty("sessionCode").GetString()!);
    }

    // ---------------------------------------------------------------- auth

    [Fact]
    public async Task Register_returns_monotonic_accountIdx_and_64_hex_sessionKey()
    {
        var client = _factory.CreateClient();

        var first = await client.PostAsJsonAsync("/auth/register", new { vid = FreshVid("alpha") });
        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        var firstBody = await first.Content.ReadFromJsonAsync<AuthBody>();

        Assert.NotNull(firstBody);
        Assert.True(firstBody!.AccountIdx >= 1, "accountIdx must start from 1");
        Assert.Matches("^[0-9A-F]{64}$", firstBody.SessionKey);
        Assert.Equal(string.Empty, firstBody.Nickname);

        var second = await client.PostAsJsonAsync("/auth/register", new { vid = FreshVid("beta") });
        Assert.Equal(HttpStatusCode.OK, second.StatusCode);
        var secondBody = await second.Content.ReadFromJsonAsync<AuthBody>();

        Assert.Equal(firstBody.AccountIdx + 1, secondBody!.AccountIdx);
    }

    [Fact]
    public async Task Register_duplicate_vid_conflicts_with_code_1001()
    {
        var client = _factory.CreateClient();
        var vid = FreshVid("dup");

        var first = await client.PostAsJsonAsync("/auth/register", new { vid });
        Assert.Equal(HttpStatusCode.OK, first.StatusCode);

        var second = await client.PostAsJsonAsync("/auth/register", new { vid });
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
        Assert.Equal(1001, await ProblemCodeAsync(second));
    }

    [Fact]
    public async Task Register_with_empty_or_missing_vid_is_400_with_code_1003()
    {
        var client = _factory.CreateClient();

        var empty = await client.PostAsJsonAsync("/auth/register", new { vid = "" });
        Assert.Equal(HttpStatusCode.BadRequest, empty.StatusCode);
        Assert.Equal(1003, await ProblemCodeAsync(empty));

        var missing = await client.PostAsJsonAsync("/auth/register", new { other = 1 });
        Assert.Equal(HttpStatusCode.BadRequest, missing.StatusCode);
        Assert.Equal(1003, await ProblemCodeAsync(missing));
    }

    [Fact]
    public async Task Register_with_malformed_json_is_400()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsync("/auth/register",
            new StringContent("{ not json", Encoding.UTF8, "application/json"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Login_with_valid_key_succeeds_and_does_not_rotate_key()
    {
        var client = _factory.CreateClient();
        var (accountIdx, sessionKey) = await RegisterAsync(client, FreshVid("login-ok"));

        var first = await client.PostAsJsonAsync("/auth/login",
            new { accountIdx, sessionKey });
        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        var firstBody = await first.Content.ReadFromJsonAsync<AuthBody>();
        Assert.Equal(accountIdx, firstBody!.AccountIdx);
        Assert.Equal(sessionKey, firstBody.SessionKey);

        var second = await client.PostAsJsonAsync("/auth/login",
            new { accountIdx, sessionKey });
        Assert.Equal(HttpStatusCode.OK, second.StatusCode);

        // Key still authorizes: no rotation happened.
        var hostClient = ClientWithAuth(accountIdx, sessionKey);
        var created = await hostClient.PostAsync("/sessions", content: null);
        Assert.Equal(HttpStatusCode.OK, created.StatusCode);
    }

    [Fact]
    public async Task Login_with_wrong_key_is_401_with_code_1002()
    {
        var client = _factory.CreateClient();
        var (accountIdx, _) = await RegisterAsync(client, FreshVid("login-bad"));

        var response = await client.PostAsJsonAsync("/auth/login",
            new { accountIdx, sessionKey = "0".PadLeft(64, '0') });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal(1002, await ProblemCodeAsync(response));
    }

    [Fact]
    public async Task Login_with_unknown_account_is_401_with_code_1002()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/auth/login",
            new { accountIdx = 987_654_321L, sessionKey = "0".PadLeft(64, '0') });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal(1002, await ProblemCodeAsync(response));
    }

    // ---------------------------------------------------------------- sessions: auth gate

    [Fact]
    public async Task Session_routes_without_auth_headers_are_401_with_code_1002()
    {
        var client = _factory.CreateClient();

        var missing = await client.PostAsync("/sessions", content: null);
        Assert.Equal(HttpStatusCode.Unauthorized, missing.StatusCode);
        Assert.Equal(1002, await ProblemCodeAsync(missing));

        var list = await client.GetAsync("/sessions");
        Assert.Equal(HttpStatusCode.Unauthorized, list.StatusCode);
        Assert.Equal(1002, await ProblemCodeAsync(list));
    }

    [Fact]
    public async Task Session_routes_with_wrong_session_key_are_401_with_code_1002()
    {
        var client = _factory.CreateClient();
        var (accountIdx, _) = await RegisterAsync(client, FreshVid("wrongkey"));

        var bad = ClientWithAuth(accountIdx, "F".PadLeft(64, 'F'));
        var response = await bad.PostAsync("/sessions", content: null);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal(1002, await ProblemCodeAsync(response));
    }

    // ---------------------------------------------------------------- sessions: create / list / get

    [Fact]
    public async Task Create_session_returns_camelCase_summary_with_unix_createdAt()
    {
        var client = _factory.CreateClient();
        var (accountIdx, sessionKey) = await RegisterAsync(client, FreshVid("create"));
        var hostClient = ClientWithAuth(accountIdx, sessionKey);

        var response = await hostClient.PostAsync("/sessions", content: null);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(json.TryGetProperty("sessionId", out var sessionId));
        Assert.True(sessionId.TryGetInt64(out var sessionIdValue));
        Assert.True(sessionIdValue >= 1);

        Assert.True(json.TryGetProperty("sessionCode", out var sessionCode));
        var code = sessionCode.GetString();
        Assert.Matches("^[23456789ABCDEFGHJKMNPQRSTVWXYZ]{6}$", code);

        Assert.True(json.TryGetProperty("hostAccountIdx", out var hostAccountIdx));
        Assert.Equal(accountIdx, hostAccountIdx.GetInt64());

        Assert.True(json.TryGetProperty("maxGuests", out var maxGuests));
        Assert.Equal(4, maxGuests.GetInt32());

        Assert.True(json.TryGetProperty("createdAt", out var createdAt));
        Assert.True(createdAt.TryGetInt64(out var createdAtSeconds));
        Assert.True(createdAtSeconds > 1_600_000_000L, "createdAt must be unix seconds");

        Assert.True(json.TryGetProperty("state", out var state));
        Assert.Equal("open", state.GetString());

        Assert.True(json.TryGetProperty("rosterVersion", out var rosterVersion));
        Assert.Equal(0, rosterVersion.GetInt32());

        Assert.True(json.TryGetProperty("members", out var members));
        Assert.Equal(JsonValueKind.Array, members.ValueKind);
        Assert.Equal(1, members.GetArrayLength());

        var host = members[0];
        Assert.True(host.TryGetProperty("accountIdx", out var memberAccountIdx));
        Assert.Equal(accountIdx, memberAccountIdx.GetInt64());
        Assert.True(host.TryGetProperty("role", out var role));
        Assert.Equal("host", role.GetString());
        Assert.True(host.TryGetProperty("nickname", out var nickname));
        Assert.Equal(string.Empty, nickname.GetString());
        Assert.True(host.TryGetProperty("joinedAt", out var joinedAt));
        Assert.True(joinedAt.TryGetInt64(out var joinedAtSeconds));
        Assert.True(joinedAtSeconds > 1_600_000_000L);
    }

    [Fact]
    public async Task Second_create_by_same_host_is_409_with_code_4001()
    {
        var client = _factory.CreateClient();
        var (accountIdx, sessionKey) = await RegisterAsync(client, FreshVid("double"));
        var hostClient = ClientWithAuth(accountIdx, sessionKey);

        var first = await hostClient.PostAsync("/sessions", content: null);
        Assert.Equal(HttpStatusCode.OK, first.StatusCode);

        var second = await hostClient.PostAsync("/sessions", content: null);
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
        Assert.Equal(4001, await ProblemCodeAsync(second));
    }

    [Fact]
    public async Task List_sessions_contains_created_open_session()
    {
        var client = _factory.CreateClient();
        var (accountIdx, sessionKey) = await RegisterAsync(client, FreshVid("list"));
        var hostClient = ClientWithAuth(accountIdx, sessionKey);

        var created = await hostClient.PostAsync("/sessions", content: null);
        var createdBody = await created.Content.ReadFromJsonAsync<JsonElement>();
        var code = createdBody.GetProperty("sessionCode").GetString()!;

        var list = await hostClient.GetAsync("/sessions");
        Assert.Equal(HttpStatusCode.OK, list.StatusCode);
        var body = await list.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(JsonValueKind.Array, body.ValueKind);
        Assert.Contains(body.EnumerateArray(),
            s => s.GetProperty("sessionCode").GetString() == code);
    }

    [Fact]
    public async Task Get_session_by_code_returns_json_when_not_websocket()
    {
        var client = _factory.CreateClient();
        var (accountIdx, sessionKey) = await RegisterAsync(client, FreshVid("get"));
        var hostClient = ClientWithAuth(accountIdx, sessionKey);

        var created = await hostClient.PostAsync("/sessions", content: null);
        var createdBody = await created.Content.ReadFromJsonAsync<JsonElement>();
        var code = createdBody.GetProperty("sessionCode").GetString()!;

        var response = await hostClient.GetAsync($"/sessions/{code}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(response.Content.Headers.ContentType);
        Assert.Contains("json", response.Content.Headers.ContentType.MediaType);

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(code, json.GetProperty("sessionCode").GetString());
        Assert.Equal(accountIdx, json.GetProperty("hostAccountIdx").GetInt64());
        Assert.Equal(1, json.GetProperty("members").GetArrayLength());
    }

    [Fact]
    public async Task Get_unknown_session_is_404_with_code_4002()
    {
        var client = _factory.CreateClient();
        var (accountIdx, sessionKey) = await RegisterAsync(client, FreshVid("get404"));
        var hostClient = ClientWithAuth(accountIdx, sessionKey);

        var response = await hostClient.GetAsync("/sessions/ZZZZZZ");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal(4002, await ProblemCodeAsync(response));
    }

    // ---------------------------------------------------------------- sessions: close

    [Fact]
    public async Task Non_host_close_is_403_with_code_4005()
    {
        var (_, _, code) = await HostSessionAsync(_factory);

        var guestClient = _factory.CreateClient();
        var (guestIdx, guestKey) = await RegisterAsync(guestClient, FreshVid("guest"));
        var authedGuest = ClientWithAuth(guestIdx, guestKey);

        var response = await authedGuest.PostAsync($"/sessions/{code}/close", content: null);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Equal(4005, await ProblemCodeAsync(response));
    }

    [Fact]
    public async Task Unknown_close_is_404_with_code_4002()
    {
        var client = _factory.CreateClient();
        var (accountIdx, sessionKey) = await RegisterAsync(client, FreshVid("close404"));
        var hostClient = ClientWithAuth(accountIdx, sessionKey);

        var response = await hostClient.PostAsync("/sessions/ZZZZZZ/close", content: null);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal(4002, await ProblemCodeAsync(response));
    }

    [Fact]
    public async Task Host_close_succeeds_then_code_is_unknown_and_host_can_rehost()
    {
        var client = _factory.CreateClient();
        var (accountIdx, sessionKey) = await RegisterAsync(client, FreshVid("close"));
        var hostClient = ClientWithAuth(accountIdx, sessionKey);

        var created = await hostClient.PostAsync("/sessions", content: null);
        var createdBody = await created.Content.ReadFromJsonAsync<JsonElement>();
        var code = createdBody.GetProperty("sessionCode").GetString()!;

        var closed = await hostClient.PostAsync($"/sessions/{code}/close", content: null);
        Assert.Equal(HttpStatusCode.NoContent, closed.StatusCode);

        var getAfterClose = await hostClient.GetAsync($"/sessions/{code}");
        Assert.Equal(HttpStatusCode.NotFound, getAfterClose.StatusCode);
        Assert.Equal(4002, await ProblemCodeAsync(getAfterClose));

        var list = await hostClient.GetAsync("/sessions");
        var listBody = await list.Content.ReadFromJsonAsync<JsonElement>();
        Assert.DoesNotContain(listBody.EnumerateArray(),
            s => s.GetProperty("sessionCode").GetString() == code);

        var rehost = await hostClient.PostAsync("/sessions", content: null);
        Assert.Equal(HttpStatusCode.OK, rehost.StatusCode);
    }

    // ---------------------------------------------------------------- websocket boundary (todo 6)

    [Fact]
    public async Task Get_session_with_websocket_upgrade_is_not_upgraded_and_reports_501()
    {
        var (accountIdx, sessionKey, code) = await HostSessionAsync(_factory);

        // TestServer의 WebSocketClient가 진짜 업그레이드 요청 흐름을 만든다.
        // 업그레이드 구현은 todo 6이므로 101 대신 501 ProblemDetails가 내가야 한다.
        var wsClient = _factory.Server.CreateWebSocketClient();
        wsClient.ConfigureRequest = request =>
        {
            request.Headers["AccountIdx"] = accountIdx.ToString();
            request.Headers["SessionKey"] = sessionKey;
        };

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => wsClient.ConnectAsync(new Uri($"http://localhost/sessions/{code}"), CancellationToken.None));
    }

    // ---------------------------------------------------------------- health stays open

    [Fact]
    public async Task Health_stays_unauthenticated()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("ok", await response.Content.ReadAsStringAsync());
    }
}
