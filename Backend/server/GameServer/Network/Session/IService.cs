using System.ComponentModel;
using CoreWCF;
using CoreWCF.Web;
using SeoulKenshi.Protocols.WCF.Session;

namespace SeoulKenshi.GameServer.Service.Session
{
    [ServiceContract]
    public interface IService
    {
        [Description("멀티플레이 세션 생성 (호스트가 멀티플레이 옵션을 켠다, ADR-005)")]
        [WebInvoke(Method = "POST", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, UriTemplate = "CreateSession")]
        ReqCreateSessionResult CreateSessionProcessor(ReqCreateSession req);

        [Description("열린 세션 목록")]
        [WebInvoke(Method = "POST", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, UriTemplate = "GetSessions")]
        ReqGetSessionsResult GetSessionsProcessor(ReqGetSessions req);

        [Description("세션 코드로 세션 정보·로스터 조회")]
        [WebInvoke(Method = "POST", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, UriTemplate = "GetSessionInfo")]
        ReqGetSessionInfoResult GetSessionInfoProcessor(ReqGetSessionInfo req);

        [Description("세션 종료 (호스트 전용)")]
        [WebInvoke(Method = "POST", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, UriTemplate = "CloseSession")]
        ReqCloseSessionResult CloseSessionProcessor(ReqCloseSession req);
    }
}
