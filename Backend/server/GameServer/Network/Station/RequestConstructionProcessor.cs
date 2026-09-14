using System;
using SeoulKenshi.Protocols.WCF.Station;

namespace SeoulKenshi.GameServer.Service.Station
{
    public partial class CService : AbstractService, IService
    {
        public ReqStartConstructionResult RequestConstructionProcessor(ReqStartConstruction req)
        {
            var result = new ReqStartConstructionResult(req == null ? 0 : req.AccountIdx);

            try
            {
                using (var ppl = new PacketProcessLock(req.GetUserKey()))
                {
                    PreProcess(req);

                    var now = DateTime.UtcNow;
                    var session = StationRuntime.Load(req.AccountIdx, now);
                    StationRuntime.TickAndSettle(session, now);
                    StationRuntime.StartConstruction(session, req.FacilityKind, req.TargetLevel, now);

                    result.Station = StationRuntime.ToStationPacket(session.State);
                    result.Construction = StationRuntime.ToConstructionPacket(session.Queue);
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
