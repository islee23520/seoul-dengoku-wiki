namespace SeoulKenshi.Coordinator.Api;

/// <summary>
/// REST 오류 코드. ProblemDetails extensions.code로 내려간다.
/// 4003/4004/4006은 참가(웹소켓) 흐름이 도착하는 todo 6까지 쓰이지 않는다.
/// </summary>
internal static class CoordinatorErrorCodes
{
    public const int DuplicateVid = 1001;            // 409
    public const int Unauthorized = 1002;            // 401
    public const int InvalidBody = 1003;             // 400

    public const int AlreadyHosting = 4001;          // 409
    public const int SessionNotFound = 4002;         // 404
    public const int SessionFull = 4003;             // 409, todo 6
    public const int AlreadyMember = 4004;           // 409, todo 6
    public const int NotHost = 4005;                 // 403
    public const int SessionClosed = 4006;           // 409, todo 6

    public static IResult Problem(int statusCode, int code, string title)
    {
        return Results.Problem(
            statusCode: statusCode,
            title: title,
            extensions: new Dictionary<string, object?> { ["code"] = code });
    }
}
