using System.Runtime.Serialization;
using Y2K.Core.Web.WCF.HelpPage.Description;

namespace SeoulKenshi.Protocols.WCF.Station
{
    #region 역 조회
    [DataContract]
    public class ReqGetStation : BaseWebPacket
    {
    }

    [DataContract]
    public class ReqGetStationResult : BaseWebPacketResult
    {
        [DataMember, PropertyDesc("역 상태")]
        public StationPacket Station { get; set; }

        [DataMember, PropertyDesc("건설 대기열(없으면 null)")]
        public ConstructionPacket Construction { get; set; }

        #region 생성자
        public ReqGetStationResult() { }
        public ReqGetStationResult(long userKey)
            : base(userKey) { }
        #endregion
    }
    #endregion

    #region 건설 요청
    [DataContract]
    public class ReqStartConstruction : BaseWebPacket
    {
        [DataMember, PropertyDesc("시설 종류 (1=급양시설, 2=정비공장, 3=변전소, 4=교환소)")]
        public int FacilityKind { get; set; }

        [DataMember, PropertyDesc("목표 레벨")]
        public int TargetLevel { get; set; }
    }

    [DataContract]
    public class ReqStartConstructionResult : BaseWebPacketResult
    {
        [DataMember, PropertyDesc("역 상태")]
        public StationPacket Station { get; set; }

        [DataMember, PropertyDesc("등록된 건설 대기열")]
        public ConstructionPacket Construction { get; set; }

        #region 생성자
        public ReqStartConstructionResult() { }
        public ReqStartConstructionResult(long userKey)
            : base(userKey) { }
        #endregion
    }
    #endregion

    #region 건설 완료
    [DataContract]
    public class ReqCompleteConstruction : BaseWebPacket
    {
    }

    [DataContract]
    public class ReqCompleteConstructionResult : BaseWebPacketResult
    {
        [DataMember, PropertyDesc("역 상태")]
        public StationPacket Station { get; set; }

        [DataMember, PropertyDesc("남은 건설 대기열(없으면 null)")]
        public ConstructionPacket Construction { get; set; }

        #region 생성자
        public ReqCompleteConstructionResult() { }
        public ReqCompleteConstructionResult(long userKey)
            : base(userKey) { }
        #endregion
    }
    #endregion

    public class StationPacket
    {
        [DataMember, PropertyDesc("식량")]
        public long Food { get; set; }

        [DataMember, PropertyDesc("부품")]
        public long Parts { get; set; }

        [DataMember, PropertyDesc("전력")]
        public long Energy { get; set; }

        [DataMember, PropertyDesc("교환권")]
        public long Vouchers { get; set; }

        [DataMember, PropertyDesc("급양시설 레벨")]
        public int SupplyLevel { get; set; }

        [DataMember, PropertyDesc("정비공장 레벨")]
        public int WorkshopLevel { get; set; }

        [DataMember, PropertyDesc("변전소 레벨")]
        public int SubstationLevel { get; set; }

        [DataMember, PropertyDesc("교환소 레벨")]
        public int ExchangeLevel { get; set; }

        [DataMember, PropertyDesc("마지막 자원 정산 시각(unix seconds)")]
        public long LastUpdated { get; set; }
    }

    public class ConstructionPacket
    {
        [DataMember, PropertyDesc("시설 종류 (1=급양시설, 2=정비공장, 3=변전소, 4=교환소)")]
        public int FacilityKind { get; set; }

        [DataMember, PropertyDesc("목표 레벨")]
        public int TargetLevel { get; set; }

        [DataMember, PropertyDesc("시작 시각(unix seconds)")]
        public long StartedAt { get; set; }

        [DataMember, PropertyDesc("완료 예정 시각(unix seconds)")]
        public long CompletesAt { get; set; }
    }
}
