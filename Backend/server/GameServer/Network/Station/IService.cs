using System.ComponentModel;
using CoreWCF;
using CoreWCF.Web;
using SeoulKenshi.Protocols.WCF.Station;

namespace SeoulKenshi.GameServer.Service.Station
{
    [ServiceContract]
    public interface IService
    {
        [Description("역 조회 (자원·시설·대기열, lazy tick 반영)")]
        [WebInvoke(Method = "POST", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, UriTemplate = "GetStation")]
        ReqGetStationResult GetStationProcessor(ReqGetStation req);

        [Description("건설 요청")]
        [WebInvoke(Method = "POST", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, UriTemplate = "RequestConstruction")]
        ReqStartConstructionResult RequestConstructionProcessor(ReqStartConstruction req);
    }
}
