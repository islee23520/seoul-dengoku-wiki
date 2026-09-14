using System.ComponentModel;
using CoreWCF;
using CoreWCF.Web;
using SeoulKenshi.Protocols.WCF.Front;

namespace SeoulKenshi.GameServer.Service.Front
{
    [ServiceContract]
    public interface IService
    {
        [Description("서버 HealthChek용")]
        [WebInvoke(Method = "GET", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, UriTemplate = "HealthCheck")]
        string HealthCheckProcessor();

        [Description("버전 체크 요청")]
        [WebInvoke(Method = "POST", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, UriTemplate = "CheckVersion")]
        ReqCheckVersionResult CheckVersionProcessor(ReqCheckVersion req);

        [Description("KeepAlive 패킷 요청")]
        [WebInvoke(Method = "POST", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, UriTemplate = "KeepAlive")]
        ReqKeepAliveResult KeepAliveProcessor(ReqKeepAlive req);


    }
}
