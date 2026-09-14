using System.Collections.Generic;
using System.Runtime.Serialization;
using SeoulKenshi.Protocols.Common;
using Y2K.Core.Web.WCF.HelpPage.Description;

namespace SeoulKenshi.Protocols.WCF.Lobby
{
    #region 날짜 변경 여부 체크
    [DataContract]
    public class ReqCheckChangeDay : BaseWebPacket
    {
    }

    [DataContract]
    public class ReqCheckChangeDayResult : BaseWebPacketResult
    {
        [DataMember, PropertyDesc("변경 여부")]
        public bool IsChange { get; set; }

        #region 생성자
        public ReqCheckChangeDayResult() { }
        public ReqCheckChangeDayResult(long userKey)
            : base(userKey) { }
        #endregion
    }
    #endregion

    #region 로비 입장 패킷
    [DataContract]
    public class ReqEnterLobby : BaseWebPacket
    {
    }

    [DataContract]
    public class ReqEnterLobbyResult : BaseWebPacketResult
    {
        [DataMember, PropertyDesc("오늘 첫 로그인 여부")]
        public bool TodayFirstLogin { get; set; }

        [DataMember, PropertyDesc("재화 관련 정보")]
        public GoodsBagPacket GoodsBag { get; set; }

        [DataMember, PropertyDesc("에너지 정보")]
        public List<EnergyPacket> EnergyData { get; set; }

        [DataMember, PropertyDesc("보상 데이터")]
        public List<RewardPacketWithCause> RewardData { get; set; }


        #region 생성자
        public ReqEnterLobbyResult() { }
        public ReqEnterLobbyResult(long userKey)
            : base(userKey) { }
        #endregion
    }
    #endregion
}
