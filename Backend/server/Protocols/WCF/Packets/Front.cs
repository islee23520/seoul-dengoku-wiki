using System.Runtime.Serialization;
using Y2K.Core.Web.WCF.HelpPage.Description;

namespace SeoulKenshi.Protocols.WCF.Front
{
    #region 버전 체크
    [DataContract]
    public class ReqCheckVersion : BaseWebPacket
    {
    }

    [DataContract]
    public class ReqCheckVersionResult : BaseWebPacketResult
    {
        [DataMember, PropertyDesc("서버 버전")]
        public string ServerVersion { get; set; }

        [DataMember, PropertyDesc("데이터 버전")]
        public string DataVersion { get; set; }
    }
    #endregion

    #region KeepAlive 요청 
    [DataContract]
    public class ReqKeepAlive : BaseWebPacket
    {
    }

    [DataContract]
    public class ReqKeepAliveResult : BaseWebPacketResult
    {
        #region 생성자
        public ReqKeepAliveResult() { }
        public ReqKeepAliveResult(long userKey)
            : base(userKey) { }
        #endregion
    }
    #endregion
}
