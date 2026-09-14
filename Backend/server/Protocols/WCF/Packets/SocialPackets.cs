using System.Collections.Generic;
using System.Runtime.Serialization;
using Y2K.Core.Web.WCF.HelpPage.Description;

namespace SeoulKenshi.Protocols.WCF.Social
{
    #region 이벤트 로그 조회
    [DataContract]
    public class ReqGetEventLog : BaseWebPacket
    {
        [DataMember, PropertyDesc("최근 N개 (0이면 전체)")]
        public int Count { get; set; }
    }

    [DataContract]
    public class ReqGetEventLogResult : BaseWebPacketResult
    {
        [DataMember, PropertyDesc("시간순 이벤트 목록")]
        public List<EventLogPacket> Events { get; set; } = new List<EventLogPacket>();

        #region 생성자
        public ReqGetEventLogResult() { }
        public ReqGetEventLogResult(long userKey)
            : base(userKey) { }
        #endregion
    }

    public class EventLogPacket
    {
        [DataMember, PropertyDesc("발생 시각(UTC ticks)")]
        public long OccurredAt { get; set; }

        [DataMember, PropertyDesc("이벤트 유형")]
        public string Type { get; set; }

        [DataMember, PropertyDesc("본문")]
        public string Body { get; set; }
    }
    #endregion

    #region 랭킹 조회
    [DataContract]
    public class ReqGetRanking : BaseWebPacket
    {
        [DataMember, PropertyDesc("상위 N명 (0이면 전체)")]
        public int Count { get; set; }
    }

    [DataContract]
    public class ReqGetRankingResult : BaseWebPacketResult
    {
        [DataMember, PropertyDesc("역 규모 랭킹")]
        public List<RankingEntryPacket> Rankings { get; set; } = new List<RankingEntryPacket>();

        #region 생성자
        public ReqGetRankingResult() { }
        public ReqGetRankingResult(long userKey)
            : base(userKey) { }
        #endregion
    }

    public class RankingEntryPacket
    {
        [DataMember, PropertyDesc("순위 (동점은 같은 순위, 다음 순위는 건너뜀)")]
        public int Rank { get; set; }

        [DataMember, PropertyDesc("계정 고유번호")]
        public long AccountIdx { get; set; }

        [DataMember, PropertyDesc("역 규모 점수")]
        public long Score { get; set; }
    }
    #endregion

    #region 동맹 생성
    [DataContract]
    public class ReqCreateAlliance : BaseWebPacket
    {
        [DataMember, PropertyDesc("동맹 이름")]
        public string Name { get; set; }
    }

    [DataContract]
    public class ReqCreateAllianceResult : BaseWebPacketResult
    {
        [DataMember, PropertyDesc("생성된 동맹")]
        public AlliancePacket Alliance { get; set; }

        #region 생성자
        public ReqCreateAllianceResult() { }
        public ReqCreateAllianceResult(long userKey)
            : base(userKey) { }
        #endregion
    }
    #endregion

    #region 동맹 가입
    [DataContract]
    public class ReqJoinAlliance : BaseWebPacket
    {
        [DataMember, PropertyDesc("동맹 이름")]
        public string Name { get; set; }
    }

    [DataContract]
    public class ReqJoinAllianceResult : BaseWebPacketResult
    {
        [DataMember, PropertyDesc("가입한 동맹")]
        public AlliancePacket Alliance { get; set; }

        #region 생성자
        public ReqJoinAllianceResult() { }
        public ReqJoinAllianceResult(long userKey)
            : base(userKey) { }
        #endregion
    }
    #endregion

    public class AlliancePacket
    {
        [DataMember, PropertyDesc("동맹 이름")]
        public string Name { get; set; }

        [DataMember, PropertyDesc("멤버 계정 고유번호 목록")]
        public List<long> Members { get; set; } = new List<long>();
    }
}
