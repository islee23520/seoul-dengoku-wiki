using System.ComponentModel;
using CoreWCF;
using CoreWCF.Web;
using SeoulKenshi.Protocols.WCF.Hero;

namespace SeoulKenshi.GameServer.Service.Hero
{
    [ServiceContract]
    public interface IService
    {
        [Description("영웅 정보 요청")]
        [WebInvoke(Method = "POST", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, UriTemplate = "GetHeroes")]
        ReqGetHeroesResult GetHeroesProcessor(ReqGetHeroes req);

        [Description("대표 영웅 설정 요청")]
        [WebInvoke(Method = "POST", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, UriTemplate = "SetRepresentHero")]
        ReqSetRepresentHeroResult SetRepresentHeroProcessor(ReqSetRepresentHero req);

        [Description("영웅 잠금 설정 변경 요청")]
        [WebInvoke(Method = "POST", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, UriTemplate = "ChangeHeroLock")]
        ReqChangeHeroLockResult ChangeHeroLockProcessor(ReqChangeHeroLock req);
    }
};