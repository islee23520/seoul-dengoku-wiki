using System.Reflection;
using System.Runtime.Serialization;
using SeoulKenshi.Common.ErrorCode;
using SeoulKenshi.Contents.Session;
using SeoulKenshi.Protocols.WCF.Session;

namespace SeoulKenshi.Server.Tests;

public class SessionPacketsTests
{
    [Fact]
    public void Result_packets_carry_user_key_and_contract_fields()
    {
        var create = new ReqCreateSessionResult(77)
        {
            Session = new SessionSummaryPacket
            {
                SessionId = 1,
                SessionCode = "ABCD23",
                HostAccountIdx = 77,
                HostNickname = "host",
                GuestCount = 0,
                MaxGuests = 4,
                State = "Open",
                CreatedAt = 1_758_000_000
            }
        };
        Assert.Equal(77, create.AccountIdx);
        Assert.Equal("ABCD23", create.Session.SessionCode);
        Assert.Equal("Open", create.Session.State);

        var info = new ReqGetSessionInfoResult(77)
        {
            Session = create.Session,
            Members = new List<SessionMemberPacket>
            {
                new SessionMemberPacket { AccountIdx = 77, Nickname = "host", Role = 0, JoinedAt = 1 }
            }
        };
        var host = Assert.Single(info.Members);
        Assert.Equal((int)SessionMemberRole.Host, host.Role);

        var list = new ReqGetSessionsResult(77) { Sessions = new List<SessionSummaryPacket> { create.Session } };
        Assert.Single(list.Sessions);

        var close = new ReqCloseSessionResult(77);
        Assert.Equal(0, close.ErrorCode);
    }

    [Fact]
    public void Session_packets_expose_data_members_for_help_page_contract()
    {
        Assert.True(HasDataMember<SessionSummaryPacket>(nameof(SessionSummaryPacket.SessionCode)));
        Assert.True(HasDataMember<SessionSummaryPacket>(nameof(SessionSummaryPacket.GuestCount)));
        Assert.True(HasDataMember<SessionSummaryPacket>(nameof(SessionSummaryPacket.MaxGuests)));
        Assert.True(HasDataMember<SessionMemberPacket>(nameof(SessionMemberPacket.Role)));
        Assert.True(HasDataMember<ReqGetSessionInfo>(nameof(ReqGetSessionInfo.SessionCode)));
        Assert.True(HasDataMember<ReqCloseSession>(nameof(ReqCloseSession.SessionCode)));
    }

    [Fact]
    public void Session_error_codes_are_distinct_nonzero_values()
    {
        var codes = new[]
        {
            SessionErrorCode.ERROR_SESSION_HOST_ALREADY_HOSTING,
            SessionErrorCode.ERROR_SESSION_NOT_FOUND,
            SessionErrorCode.ERROR_SESSION_FULL,
            SessionErrorCode.ERROR_SESSION_ALREADY_MEMBER,
            SessionErrorCode.ERROR_SESSION_NOT_HOST,
            SessionErrorCode.ERROR_SESSION_CLOSED
        };

        Assert.All(codes, code => Assert.NotEqual(0, code));
        Assert.Equal(codes.Length, codes.Distinct().Count());
    }

    [Fact]
    public void NormalizeCode_trims_and_uppercases()
    {
        Assert.Equal("ABCD23", SessionRegistry.NormalizeCode(" abcd23 "));
        Assert.Equal(string.Empty, SessionRegistry.NormalizeCode(null));
    }

    static bool HasDataMember<T>(string property)
    {
        var info = typeof(T).GetProperty(property, BindingFlags.Public | BindingFlags.Instance);
        Assert.NotNull(info);
        return info.GetCustomAttribute<DataMemberAttribute>() != null;
    }
}
