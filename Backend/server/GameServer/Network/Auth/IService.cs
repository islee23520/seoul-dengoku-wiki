using System.ComponentModel;
using CoreWCF;
using CoreWCF.Web;
using SeoulKenshi.Protocols.WCF.Auth;

namespace SeoulKenshi.GameServer.Service.Auth
{
    [ServiceContract]
    public interface IService
    {
        [Description("인증 정보 요청")]
        [WebInvoke(Method = "POST", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, UriTemplate = "GetAuthInfo")]
        ReqGetAuthInfoResult GetAuthInfoProcessor(ReqGetAuthInfo req);

        [Description("로그인")]
        [WebInvoke(Method = "POST", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, UriTemplate = "Login")]
        ReqLoginResult LoginProcessor(ReqLogin req);

        [Description("닉네임 생성")]
        [WebInvoke(Method = "POST", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, UriTemplate = "CreateNickname")]
        ReqCreateNicknameResult CreateNicknameProcessor(ReqCreateNickname req);
    }
};