using System.Collections.Generic;
using System.Runtime.Serialization;
using SeoulKenshi.Common;
using SeoulKenshi.Common.Log;
using Y2K.Core.Web.WCF.HelpPage.Description;

namespace SeoulKenshi.Protocols.Common
{
    public interface IErrorCode
    {
        int ErrorCode { get; set; }
        string ErrorMessage { get; set; }
    }

    [DataContract]
    public abstract class BasePacket
    {
        [DataMember, PropertyDesc("버전")]
        public string Version { get; set; }

        public abstract string GetUserKey();
    }


    public class RewardPacket
    {
        public RewardType Type { get; set; }
        public CauseType CauseType { get; set; }
        public string Data { get; set; }
    }

    public class RewardPacketWithCause : RewardPacket
    {
        [DataMember, PropertyDesc("사유 세부 정보")]
        public string Cause { get; set; }
    }


    public class EnergyPacket
    {
        [DataMember, PropertyDesc("타입")]
        public EnergyType Type { get; set; }

        [DataMember, PropertyDesc("수량")]
        public int Amount { get; set; }

        [DataMember, PropertyDesc("다음 충전 시간")]
        public long NextChargeTime { get; set; }
    }

    public class GoodsBagPacket
    {
        [DataMember, PropertyDesc("보유 골드")]
        public long Gold { get; set; }

        [DataMember, PropertyDesc("보유 무료 재화")]
        public long FreeCash { get; set; }

        [DataMember, PropertyDesc("보유 유료 재화")]
        public long PaidCash { get; set; }
    }
}
