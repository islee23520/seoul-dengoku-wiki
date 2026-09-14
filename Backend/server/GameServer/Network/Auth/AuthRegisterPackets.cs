using System.Runtime.Serialization;
using SeoulKenshi.Common;
using SeoulKenshi.Protocols.WCF;
using Y2K.Core.Web.WCF.HelpPage.Description;

namespace SeoulKenshi.Protocols.WCF.Auth
{
    [DataContract]
    public class ReqRegister : BaseWebPacketForVID
    {
        [DataMember, PropertyDesc("device model")]
        public string DeviceModel { get; set; }

        [DataMember, PropertyDesc("Store type")]
        public StoreType StoreType { get; set; }

        [DataMember, PropertyDesc("유저의 국가코드")]
        public string Region { get; set; }
    }

    [DataContract]
    public class ReqRegisterResult : BaseWebPacketForVIDResult
    {
        [DataMember, PropertyDesc("유저 고유번호")]
        public long AccountIdx { get; set; }

        [DataMember, PropertyDesc("유저 닉네임")]
        public string Nickname { get; set; }

        [DataMember, PropertyDesc("서버 내부에서 생성한 세션키")]
        public string SessionKey { get; set; }

        public ReqRegisterResult() { }

        public ReqRegisterResult(string vid)
            : base(vid) { }
    }
}
