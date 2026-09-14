using System;
using System.Linq;
using SeoulKenshi.Contents.Social;
using SeoulKenshi.Protocols.WCF.Social;

namespace SeoulKenshi.GameServer.Service.Social
{
    public partial class CService : AbstractService, IService
    {
        public ReqGetRankingResult GetRankingProcessor(ReqGetRanking req)
        {
            var result = new ReqGetRankingResult(req == null ? 0 : req.AccountIdx);

            try
            {
                using (var ppl = new PacketProcessLock(req.GetUserKey()))
                {
                    PreProcess(req);

                    var placed = RankingScore.Place(Station.StationRuntime.AllScores());
                    if (req.Count > 0)
                        placed = placed.Take(req.Count).ToList();

                    result.Rankings = placed.Select(p => new RankingEntryPacket
                    {
                        Rank = p.Rank,
                        AccountIdx = p.Score.AccountIdx,
                        Score = p.Score.Value
                    }).ToList();
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
