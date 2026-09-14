using System;
using System.Collections.Generic;
using SeoulKenshi.Contents.Class;
using SeoulKenshi.Contents.Reward;
using SeoulKenshi.DB.GameDB;
using SeoulKenshi.GameServer.EnterLobby;
using SeoulKenshi.GameServer.Extensions;
using SeoulKenshi.GameServer.Manager;
using SeoulKenshi.Protocols.WCF.Lobby;
using SeoulKenshi.Storage;

namespace SeoulKenshi.GameServer.Service.Lobby
{
    public partial class CService : AbstractService, IService
    {
        public ReqEnterLobbyResult EnterLobbyProcessor(ReqEnterLobby req)
        {
            var result = new ReqEnterLobbyResult(req.AccountIdx);

            try
            {
                using (var ppl = new PacketProcessLock(req.GetUserKey()))
                {
                    PreProcess(req);

                    var userData = UserDataProvider.Instance.GetData(req.AccountIdx, UserDataType.ALL);

                    var account = userData.GetData<Account>();

                    var enterLobbyParam = new EnterLobbyParameter(userData);

                    EnterLobbyProcessManager.Instance.StartEnterLobbyProcess(ref enterLobbyParam);

                    var rewardResult = new List<IRewardResult>();
                    if (enterLobbyParam.Entities.Count > 0)
                    {
                        // 로비 입장 처리 후 변경된 Entitiy들에 대한 저장을 하나의 connection으로 처리한다.
                        using (var db = new GameDBConnector(account.GameDBString, true))
                        {
                            db.AttachList(enterLobbyParam.Entities);

                            rewardResult = GiveReward.Instance.Process(db, userData, enterLobbyParam.RewardParams);

                            db.Commit();
                        }
                    }

                    result.TodayFirstLogin = enterLobbyParam.ChangeDayCount != 0;
                    result.GoodsBag = userData.GetData<GoodsBag>().ToPacket();
                    result.EnergyData = account.EnergyBag.Data.ToPacket();
                    result.RewardData = rewardResult.ToRewardPacketWithCause();

                    UserDataProvider.Instance.SetCache(userData);

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
