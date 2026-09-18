using System;
using SeoulKenshi.Common.ErrorCode;
using SeoulKenshi.Common.Exception;
using SeoulKenshi.Contents.Session;
using SeoulKenshi.Protocols.WCF.Session;

namespace SeoulKenshi.GameServer.Service.Session
{
    public partial class CService : AbstractService, IService
    {
        public ReqCloseSessionResult CloseSessionProcessor(ReqCloseSession req)
        {
            var result = new ReqCloseSessionResult(req == null ? 0 : req.AccountIdx);

            try
            {
                using (var ppl = new PacketProcessLock(req.GetUserKey()))
                {
                    PreProcess(req);

                    var session = SessionRuntime.Sessions.GetByCode(req.SessionCode);
                    if (session == null)
                        throw new ErrorCodeException(SessionErrorCode.ERROR_SESSION_NOT_FOUND,
                            $"open session not found. code: {SessionRegistry.NormalizeCode(req.SessionCode)}");

                    if (!SessionRuntime.Sessions.CloseByHost(session.SessionId, req.AccountIdx, DateTime.UtcNow))
                        throw new ErrorCodeException(SessionErrorCode.ERROR_SESSION_NOT_HOST,
                            $"only the host can close a session. accountIdx: {req.AccountIdx}");
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
