using System.ComponentModel;
using CoreWCF;
using CoreWCF.Web;
using SeoulKenshi.Protocols.WCF.Lobby;

namespace SeoulKenshi.GameServer.Service.Lobby
{
    [ServiceContract]
    public interface IService
    {
        [Description("로비 입장")]
        [WebInvoke(Method = "POST", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, UriTemplate = "EnterLobby")]
        ReqEnterLobbyResult EnterLobbyProcessor(ReqEnterLobby req);

        [Description("날짜 변경 여부 확인 요청")]
        [WebInvoke(Method = "POST", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, UriTemplate = "CheckChangeDay")]
        ReqCheckChangeDayResult CheckChangeDayProcessor(ReqCheckChangeDay req);
    }
};