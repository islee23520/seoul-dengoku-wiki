using System.Runtime.Serialization;

namespace SeoulKenshi.Protocols.WCF.GMS
{
    [DataContract]
    public class BaseGMSPacket : BaseWebPacket
    {
        [DataMember]
        public long GmIdx { get; set; }

        [DataMember]
        public string GmName { get; set; }
    }

    [DataContract]
    public class ReqExpireCache : BaseGMSPacket
    {
    }


    [DataContract]
    public class ReqExpireCacheResult : BaseWebPacketResult
    {
    }
}
