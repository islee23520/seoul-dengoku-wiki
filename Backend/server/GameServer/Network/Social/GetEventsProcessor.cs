using System;
using System.Linq;
using SeoulKenshi.Protocols.WCF.Social;

namespace SeoulKenshi.GameServer.Service.Social
{
    public partial class CService : AbstractService, IService
    {
        public ReqGetEventLogResult GetEventsProcessor(ReqGetEventLog req)
        {
            var result = new ReqGetEventLogResult(req == null ? 0 : req.AccountIdx);

            try
            {
                using (var ppl = new PacketProcessLock(req.GetUserKey()))
                {
                    PreProcess(req);

                    result.Events = SocialRuntime.GetEvents(req.AccountIdx, req.Count)
                        .Select(SocialRuntime.ToPacket)
                        .ToList();
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
