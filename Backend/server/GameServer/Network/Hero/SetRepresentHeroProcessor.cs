using System;
using SeoulKenshi.Contents.Class;
using SeoulKenshi.Contents.Inventory;
using SeoulKenshi.DB.GameDB;
using SeoulKenshi.Protocols.WCF.Hero;
using SeoulKenshi.Storage;
using Y2K.Core.DataBase;

namespace SeoulKenshi.GameServer.Service.Hero
{
    public partial class CService : AbstractService, IService
    {
        public ReqSetRepresentHeroResult SetRepresentHeroProcessor(ReqSetRepresentHero req)
        {
            var result = new ReqSetRepresentHeroResult(req.AccountIdx);

            try
            {
                using (var ppl = new PacketProcessLock(req.GetUserKey()))
                {
                    PreProcess(req);

                    var userData = UserDataProvider.Instance.GetData(req.AccountIdx, UserDataType.HeroInventory);
                    var account = userData.GetData<Account>();
                    var inventory = userData.GetData<HeroInventory>();

                    // 보유하고 있는 영웅인지 체크
                    var hero = inventory.GetHero(req.TargetIdx);

                    account.RepresentHeroIdx = req.TargetIdx;

                    using (var db = new GameDBConnector(account.GameDBString))
                    {
                        db.Attach(account.GetEntity(DbCommandType.Update));
                    }

                    UserDataProvider.Instance.SetCache(userData, UserDataType.Account);
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