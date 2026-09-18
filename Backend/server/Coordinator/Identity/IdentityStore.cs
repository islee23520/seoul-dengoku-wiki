using System.Collections.Concurrent;
using System.Security.Cryptography;

namespace SeoulKenshi.Coordinator.Identity;

/// <summary>
/// 프로세스 안 신원 저장소. 계정은 vid 등록 시 만들어지고 세션 키는 32바이트 RNG hex다.
/// ADR-005 정신에 따라 휘발성이며 영속 저장소에 두지 않는다.
/// </summary>
public sealed class IdentityStore
{
    readonly ConcurrentDictionary<string, long> _accountIdxByVid =
        new(StringComparer.Ordinal);

    readonly ConcurrentDictionary<long, AccountRecord> _accounts = new();

    long _nextAccountIdx;

    /// <summary>vid 등록. 같은 vid가 이미 있으면 false. 세션 키는 등록 시 한 번만 발급된다.</summary>
    public bool TryRegister(string vid, out long accountIdx, out string sessionKey)
    {
        if (_accountIdxByVid.ContainsKey(vid))
        {
            accountIdx = 0;
            sessionKey = string.Empty;
            return false;
        }

        // Interlocked.Increment: 첫 계정이 1부터 단조 증가.
        var idx = Interlocked.Increment(ref _nextAccountIdx);
        if (!_accountIdxByVid.TryAdd(vid, idx))
        {
            accountIdx = 0;
            sessionKey = string.Empty;
            return false;
        }

        var record = new AccountRecord(idx, GenerateSessionKey());
        _accounts[idx] = record;
        accountIdx = idx;
        sessionKey = record.SessionKey;
        return true;
    }

    /// <summary>로그인과 세션 헤더 인증이 함께 쓰는 검증. 키는 돌리지 않는다.</summary>
    public bool TryLogin(long accountIdx, string sessionKey)
    {
        return _accounts.TryGetValue(accountIdx, out var record)
            && string.Equals(record.SessionKey, sessionKey, StringComparison.Ordinal);
    }

    public bool TryGetNickname(long accountIdx, out string nickname)
    {
        if (_accounts.TryGetValue(accountIdx, out var record))
        {
            nickname = record.Nickname;
            return true;
        }

        nickname = string.Empty;
        return false;
    }

    /// <summary>32바이트 RNG hex(64글자).</summary>
    static string GenerateSessionKey()
    {
        return Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
    }
}

public sealed class AccountRecord
{
    public AccountRecord(long accountIdx, string sessionKey)
    {
        AccountIdx = accountIdx;
        SessionKey = sessionKey;
        Nickname = string.Empty;
    }

    public long AccountIdx { get; }
    public string SessionKey { get; }

    /// <summary>빈 문자열로 시작한다. 닉네임 설정 단계에서 채워진다.</summary>
    public string Nickname { get; set; }
}
