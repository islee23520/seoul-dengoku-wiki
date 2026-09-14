using System.ComponentModel;
using CoreWCF;
using CoreWCF.Web;
using SeoulKenshi.Protocols.WCF.GMS;

namespace SeoulKenshi.GameServer.Service.GMS
{
    [ServiceContract]
    public interface IService
    {
        [Description("캐시 삭제")]
        [WebInvoke(Method = "POST", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, UriTemplate = "ExpireCache")]
        ReqExpireCacheResult ExpireCacheProcessor(ReqExpireCache req);
    }
};