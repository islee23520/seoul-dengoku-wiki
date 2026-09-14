using System.ComponentModel;
using CoreWCF;
using CoreWCF.Web;
using SeoulKenshi.Protocols.WCF.Social;

namespace SeoulKenshi.GameServer.Service.Social
{
    [ServiceContract]
    public interface IService
    {
        [Description("이벤트 로그 조회")]
        [WebInvoke(Method = "POST", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, UriTemplate = "GetEvents")]
        ReqGetEventLogResult GetEventsProcessor(ReqGetEventLog req);

        [Description("랭킹 조회")]
        [WebInvoke(Method = "POST", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, UriTemplate = "GetRanking")]
        ReqGetRankingResult GetRankingProcessor(ReqGetRanking req);

        [Description("동맹 생성")]
        [WebInvoke(Method = "POST", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, UriTemplate = "CreateAlliance")]
        ReqCreateAllianceResult CreateAllianceProcessor(ReqCreateAlliance req);

        [Description("동맹 가입")]
        [WebInvoke(Method = "POST", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, UriTemplate = "JoinAlliance")]
        ReqJoinAllianceResult JoinAllianceProcessor(ReqJoinAlliance req);
    }
}
