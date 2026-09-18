using System.Collections.Generic;
using System.Runtime.Serialization;
using Y2K.Core.Web.WCF.HelpPage.Description;

namespace SeoulKenshi.Protocols.WCF.Session
{
    /// <summary>세션 요약. 목록·조회 공용.</summary>
    public class SessionSummaryPacket
    {
        [DataMember, PropertyDesc("세션 ID")]
        public long SessionId { get; set; }

        [DataMember, PropertyDesc("세션 코드(6자)")]
        public string SessionCode { get; set; }

        [DataMember, PropertyDesc("호스트 계정 ID")]
        public long HostAccountIdx { get; set; }

        [DataMember, PropertyDesc("호스트 닉네임")]
        public string HostNickname { get; set; }

        [DataMember, PropertyDesc("현재 게스트 수")]
        public int GuestCount { get; set; }

        [DataMember, PropertyDesc("최대 게스트 수")]
        public int MaxGuests { get; set; }

        [DataMember, PropertyDesc("상태 (Open|Closed)")]
        public string State { get; set; }

        [DataMember, PropertyDesc("생성 시각(unix seconds)")]
        public long CreatedAt { get; set; }
    }

    public class SessionMemberPacket
    {
        [DataMember, PropertyDesc("계정 ID")]
        public long AccountIdx { get; set; }

        [DataMember, PropertyDesc("닉네임")]
        public string Nickname { get; set; }

        [DataMember, PropertyDesc("역할 (0=호스트, 1=게스트)")]
        public int Role { get; set; }

        [DataMember, PropertyDesc("합류 시각(unix seconds)")]
        public long JoinedAt { get; set; }
    }

    #region 세션 생성(호스트)
    [DataContract]
    public class ReqCreateSession : BaseWebPacket
    {
    }

    [DataContract]
    public class ReqCreateSessionResult : BaseWebPacketResult
    {
        [DataMember, PropertyDesc("열린 세션")]
        public SessionSummaryPacket Session { get; set; }

        #region 생성자
        public ReqCreateSessionResult() { }
        public ReqCreateSessionResult(long userKey)
            : base(userKey) { }
        #endregion
    }
    #endregion

    #region 열린 세션 목록
    [DataContract]
    public class ReqGetSessions : BaseWebPacket
    {
    }

    [DataContract]
    public class ReqGetSessionsResult : BaseWebPacketResult
    {
        [DataMember, PropertyDesc("열린 세션 요약 목록")]
        public List<SessionSummaryPacket> Sessions { get; set; }

        #region 생성자
        public ReqGetSessionsResult() { }
        public ReqGetSessionsResult(long userKey)
            : base(userKey) { }
        #endregion
    }
    #endregion

    #region 세션 조회
    [DataContract]
    public class ReqGetSessionInfo : BaseWebPacket
    {
        [DataMember, PropertyDesc("세션 코드(6자)")]
        public string SessionCode { get; set; }
    }

    [DataContract]
    public class ReqGetSessionInfoResult : BaseWebPacketResult
    {
        [DataMember, PropertyDesc("세션 요약")]
        public SessionSummaryPacket Session { get; set; }

        [DataMember, PropertyDesc("구성원 로스터")]
        public List<SessionMemberPacket> Members { get; set; }

        #region 생성자
        public ReqGetSessionInfoResult() { }
        public ReqGetSessionInfoResult(long userKey)
            : base(userKey) { }
        #endregion
    }
    #endregion

    #region 세션 종료(호스트 전용)
    [DataContract]
    public class ReqCloseSession : BaseWebPacket
    {
        [DataMember, PropertyDesc("세션 코드(6자)")]
        public string SessionCode { get; set; }
    }

    [DataContract]
    public class ReqCloseSessionResult : BaseWebPacketResult
    {
        #region 생성자
        public ReqCloseSessionResult() { }
        public ReqCloseSessionResult(long userKey)
            : base(userKey) { }
        #endregion
    }
    #endregion
}
