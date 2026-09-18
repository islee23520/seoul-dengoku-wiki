using Microsoft.Extensions.Options;
using SeoulKenshi.Coordinator.Identity;
using SeoulKenshi.Coordinator.Relay;
using SeoulKenshi.Coordinator.Session;

namespace SeoulKenshi.Coordinator.Api;

public static class SessionEndpoints
{
    internal const string AccountIdxItemKey = "Coordinator.AccountIdx";

    public static IEndpointRouteBuilder MapSessionRoutes(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/sessions");
        group.AddEndpointFilter<SessionAuthFilter>();

        group.MapPost("", (HttpContext http, IdentityStore identities, SessionRegistry sessions,
            IOptions<CoordinatorOptions> options) =>
        {
            var hostAccountIdx = (long)http.Items[AccountIdxItemKey]!;
            identities.TryGetNickname(hostAccountIdx, out var nickname);

            if (!sessions.TryCreate(hostAccountIdx, nickname, options.Value.SessionMaxGuests,
                    DateTime.UtcNow, out var session, out _))
            {
                return CoordinatorErrorCodes.Problem(
                    StatusCodes.Status409Conflict, CoordinatorErrorCodes.AlreadyHosting,
                    "account already hosts an open session");
            }

            return Results.Ok(SessionSummaryMapper.From(session));
        });

        group.MapGet("", (SessionRegistry sessions) =>
            Results.Ok(sessions.ListOpen().Select(SessionSummaryMapper.From).ToList()));

        group.MapGet("/{code}", async (HttpContext http, string code, SessionRegistry sessions,
            SessionRelayHub relay) =>
        {
            // 웹소켓 업그레이드: 인증부터 릴레이 흐름까지 허브가 업그레이드 전후를 끝까지 담당한다.
            if (http.WebSockets.IsWebSocketRequest)
                return await relay.HandleSessionAsync(http, code);

            var session = sessions.GetByCode(code);
            if (session is null)
                return CoordinatorErrorCodes.Problem(
                    StatusCodes.Status404NotFound, CoordinatorErrorCodes.SessionNotFound, "session not found");

            return Results.Ok(SessionSummaryMapper.From(session));
        });

        group.MapPost("/{code}/close", (HttpContext http, string code, SessionRegistry sessions) =>
        {
            var requesterAccountIdx = (long)http.Items[AccountIdxItemKey]!;

            var session = sessions.GetByCode(code);
            if (session is null)
                return CoordinatorErrorCodes.Problem(
                    StatusCodes.Status404NotFound, CoordinatorErrorCodes.SessionNotFound, "session not found");

            if (!sessions.CloseByHost(session.SessionId, requesterAccountIdx, DateTime.UtcNow))
                return CoordinatorErrorCodes.Problem(
                    StatusCodes.Status403Forbidden, CoordinatorErrorCodes.NotHost,
                    "only the host can close the session");

            return Results.NoContent();
        });

        return app;
    }
}

/// <summary>AccountIdx + SessionKey 헤더 인증. 통과하면 accountIdx를 Items에 남긴다.</summary>
sealed class SessionAuthFilter : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var http = context.HttpContext;

        // 웹소켓은 헤더뿐 아니라 쿼리로도 신원을 줄 수 있다. 인증은 릴레이 허브가
        // 업그레이드 전에 자체적으로 마친다(실패는 101 이전에 401로 답한다).
        if (http.WebSockets.IsWebSocketRequest)
            return await next(context);

        var accountIdxHeader = http.Request.Headers["AccountIdx"].ToString();
        var sessionKeyHeader = http.Request.Headers["SessionKey"].ToString();

        if (!long.TryParse(accountIdxHeader, out var accountIdx) || string.IsNullOrEmpty(sessionKeyHeader))
            return CoordinatorErrorCodes.Problem(
                StatusCodes.Status401Unauthorized, CoordinatorErrorCodes.Unauthorized,
                "AccountIdx and SessionKey headers are required");

        var identities = http.RequestServices.GetRequiredService<IdentityStore>();
        if (!identities.TryLogin(accountIdx, sessionKeyHeader))
            return CoordinatorErrorCodes.Problem(
                StatusCodes.Status401Unauthorized, CoordinatorErrorCodes.Unauthorized,
                "invalid AccountIdx or SessionKey");

        http.Items[SessionEndpoints.AccountIdxItemKey] = accountIdx;
        return await next(context);
    }
}

public sealed record SessionSummary(
    long SessionId,
    string SessionCode,
    long HostAccountIdx,
    int MaxGuests,
    long CreatedAt,
    string State,
    int RosterVersion,
    IReadOnlyList<SessionMemberSummary> Members);

public sealed record SessionMemberSummary(long AccountIdx, string Role, string Nickname, long JoinedAt);

static class SessionSummaryMapper
{
    public static SessionSummary From(MultiplayerSession session)
    {
        return new SessionSummary(
            session.SessionId,
            session.SessionCode,
            session.HostAccountIdx,
            session.MaxGuests,
            new DateTimeOffset(session.CreatedAt).ToUnixTimeSeconds(),
            session.State == SessionState.Open ? "open" : "closed",
            session.RosterVersion,
            session.Members
                .Select(m => new SessionMemberSummary(
                    m.AccountIdx,
                    m.Role == SessionMemberRole.Host ? "host" : "guest",
                    m.Nickname,
                    new DateTimeOffset(m.JoinedAt).ToUnixTimeSeconds()))
                .ToList());
    }
}
