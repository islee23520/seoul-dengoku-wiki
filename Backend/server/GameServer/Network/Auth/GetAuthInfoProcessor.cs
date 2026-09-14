using System;
using SeoulKenshi.Protocols.WCF.Auth;
using SeoulKenshi.Storage;

namespace SeoulKenshi.GameServer.Service.Auth
{
    public partial class CService : AbstractService, IService
    {
        public ReqGetAuthInfoResult GetAuthInfoProcessor(ReqGetAuthInfo req)
        {
            var result = new ReqGetAuthInfoResult(req.VID);

            try
            {
                using(var ppl = new PacketProcessLock(req.GetUserKey()))
                {
                    var authInfo = PreProcess(req);
                    authInfo.SessionKey = IssueToNewSessionKey();

                    result.AccountIdx = authInfo.UID;
                    result.Nickname = authInfo.Nickname;
                    result.SessionKey = authInfo.SessionKey;

                    AuthInfoProvider.SetCache(authInfo);
                }
            }

            catch (Exception e)
            {
                ExceptionHandler(e, result);
            }

            finally
            {
                PostProcess(result);
            }

            return result;
        }
    }
}