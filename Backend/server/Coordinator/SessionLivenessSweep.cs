using Microsoft.Extensions.Options;
using SeoulKenshi.Coordinator.Relay;
using SeoulKenshi.Coordinator.Session;

namespace SeoulKenshi.Coordinator;

/// <summary>
/// 세션 생존 스윕 워커. 일정 간격으로 레지스트리 스윕을 돌린다. 호스트 무응답 세션은
/// 레지스트리가 닫고(SessionClosed → 릴레이 허브가 CloseRoom으로 sessionClosed 전파),
/// 무응답 게스트는 로스터에서 빠진 뒤 이 워커가 연결을 닫는다.
/// 대기는 전부 비동기다(블로킹 대기·스레드 슬립 없음). 한 틱의 실패는 로그만 남기고
/// 다음 틱을 계속한다.
/// </summary>
public sealed class SessionLivenessSweep : BackgroundService
{
    readonly SessionRegistry _registry;
    readonly RelayRouter _router;
    readonly CoordinatorOptions _options;
    readonly TimeProvider _clock;
    readonly ILogger<SessionLivenessSweep> _logger;

    /// <summary>스윕 틱 경계 신호. 테스트가 틱 수를 세는 데 쓴다.</summary>
    public event Action? SweepTicked;

    public SessionLivenessSweep(SessionRegistry registry, SessionRelayHub relay,
        IOptions<CoordinatorOptions> options, TimeProvider clock,
        ILogger<SessionLivenessSweep> logger)
    {
        _registry = registry ?? throw new ArgumentNullException(nameof(registry));
        _router = (relay ?? throw new ArgumentNullException(nameof(relay))).Router;
        _options = (options ?? throw new ArgumentNullException(nameof(options))).Value;
        _clock = clock ?? TimeProvider.System;
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(_options.SweepIntervalSeconds));

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                if (!await timer.WaitForNextTickAsync(stoppingToken).ConfigureAwait(false))
                    break;
            }
            catch (OperationCanceledException)
            {
                break;
            }

            try
            {
                SweepOnce();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "session liveness sweep tick failed; retrying next tick");
            }

            RaiseSweepTicked();
        }
    }

    void SweepOnce()
    {
        var now = _clock.GetUtcNow().UtcDateTime;

        // 스윕 판단 시점의 게스트 연결 스냅샷. 판단과 정리 사이에 재접속이 일어나면
        // 방 항목이 다른 인스턴스로 바뀌고, RemoveGuestConnection은 새 연결을 그대로 둔다.
        var guests = _router.SnapshotGuests();

        var report = _registry.Sweep(now, _options.SessionHostTimeoutSeconds,
            _options.SessionMemberTimeoutSeconds);

        foreach (var removed in report.RemovedMembers)
        {
            if (guests.TryGetValue((removed.SessionId, removed.Member.AccountIdx), out var connection))
                _router.RemoveGuestConnection(removed.SessionId, removed.Member.AccountIdx, connection);
        }
    }

    void RaiseSweepTicked()
    {
        var handlers = SweepTicked;
        if (handlers == null)
            return;

        foreach (Action handler in handlers.GetInvocationList())
        {
            try
            {
                handler();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "session liveness sweep tick observer failed");
            }
        }
    }
}
