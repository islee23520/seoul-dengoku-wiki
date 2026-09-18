using System;
using System.Collections.Generic;
using SeoulKenshi.Common.ErrorCode;
using SeoulKenshi.Common.Exception;
using SeoulKenshi.Contents.Session;
using SeoulKenshi.Protocols.WCF.Session;

namespace SeoulKenshi.GameServer.Service.Session
{
    public partial class CService : AbstractService, IService
    {
        public ReqGetSessionInfoResult GetSessionInfoProcessor(ReqGetSessionInfo req)
        {
            var result = new ReqGetSessionInfoResult(req == null ? 0 : req.AccountIdx);

            try
            {
                using (var ppl = new PacketProcessLock(req.GetUserKey()))
                {
                    PreProcess(req);

                    var session = SessionRuntime.Sessions.GetByCode(req.SessionCode);
                    if (session == null)
                        throw new ErrorCodeException(SessionErrorCode.ERROR_SESSION_NOT_FOUND,
                            $"open session not found. code: {SessionRegistry.NormalizeCode(req.SessionCode)}");

                    result.Session = SessionRuntime.ToSummaryPacket(session);
                    var members = new List<SessionMemberPacket>(session.Members.Count);
                    foreach (var member in session.Members)
                        members.Add(SessionRuntime.ToMemberPacket(member));
                    result.Members = members;
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
