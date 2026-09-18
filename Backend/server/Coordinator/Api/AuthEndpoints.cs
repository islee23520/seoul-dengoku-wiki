using SeoulKenshi.Coordinator.Identity;

namespace SeoulKenshi.Coordinator.Api;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuth(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/auth");

        group.MapPost("/register", (RegisterRequest? body, IdentityStore identities) =>
        {
            if (body is null || string.IsNullOrWhiteSpace(body.Vid))
                return CoordinatorErrorCodes.Problem(
                    StatusCodes.Status400BadRequest, CoordinatorErrorCodes.InvalidBody, "vid is required");

            if (!identities.TryRegister(body.Vid, out var accountIdx, out var sessionKey))
                return CoordinatorErrorCodes.Problem(
                    StatusCodes.Status409Conflict, CoordinatorErrorCodes.DuplicateVid, "vid already registered");

            return Results.Ok(new AuthResponse(accountIdx, sessionKey, Nickname: string.Empty));
        });

        group.MapPost("/login", (LoginRequest? body, IdentityStore identities) =>
        {
            if (body is null || body.AccountIdx < 1 || string.IsNullOrEmpty(body.SessionKey))
                return CoordinatorErrorCodes.Problem(
                    StatusCodes.Status400BadRequest, CoordinatorErrorCodes.InvalidBody,
                    "accountIdx and sessionKey are required");

            if (!identities.TryLogin(body.AccountIdx, body.SessionKey))
                return CoordinatorErrorCodes.Problem(
                    StatusCodes.Status401Unauthorized, CoordinatorErrorCodes.Unauthorized,
                    "invalid accountIdx or sessionKey");

            identities.TryGetNickname(body.AccountIdx, out var nickname);
            return Results.Ok(new AuthResponse(body.AccountIdx, body.SessionKey, nickname));
        });

        return app;
    }

    public sealed record RegisterRequest(string? Vid);

    public sealed record LoginRequest(long AccountIdx, string? SessionKey);

    public sealed record AuthResponse(long AccountIdx, string SessionKey, string Nickname);
}
