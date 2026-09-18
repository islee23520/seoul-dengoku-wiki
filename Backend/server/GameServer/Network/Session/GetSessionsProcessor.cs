using System;
using System.Collections.Generic;
using SeoulKenshi.Protocols.WCF.Session;

namespace SeoulKenshi.GameServer.Service.Session
{
    public partial class CService : AbstractService, IService
    {
        public ReqGetSessionsResult GetSessionsProcessor(ReqGetSessions req)
        {
            var result = new ReqGetSessionsResult(req == null ? 0 : req.AccountIdx);

            try
            {
                using (var ppl = new PacketProcessLock(req.GetUserKey()))
                {
                    PreProcess(req);

                    var sessions = SessionRuntime.Sessions.ListOpen();
                    var summaries = new List<SessionSummaryPacket>(sessions.Count);
                    foreach (var session in sessions)
                        summaries.Add(SessionRuntime.ToSummaryPacket(session));

                    result.Sessions = summaries;
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
