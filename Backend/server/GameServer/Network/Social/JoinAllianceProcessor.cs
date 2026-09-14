using System;
using SeoulKenshi.Protocols.WCF.Social;

namespace SeoulKenshi.GameServer.Service.Social
{
    public partial class CService : AbstractService, IService
    {
        public ReqJoinAllianceResult JoinAllianceProcessor(ReqJoinAlliance req)
        {
            var result = new ReqJoinAllianceResult(req == null ? 0 : req.AccountIdx);

            try
            {
                using (var ppl = new PacketProcessLock(req.GetUserKey()))
                {
                    PreProcess(req);
                    var alliance = SocialRuntime.JoinAlliance(req.Name, req.AccountIdx);
                    result.Alliance = SocialRuntime.ToPacket(alliance);
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
