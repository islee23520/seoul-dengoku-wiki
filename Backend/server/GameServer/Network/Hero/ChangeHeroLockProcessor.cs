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
        public ReqChangeHeroLockResult ChangeHeroLockProcessor(ReqChangeHeroLock req)
        {
            var result = new ReqChangeHeroLockResult();

            try
            {
                using (var ppl = new PacketProcessLock(req.GetUserKey()))
                {
                    PreProcess(req);

                    var userData = UserDataProvider.Instance.GetData(req.AccountIdx, UserDataType.HeroInventory);
                    var account = userData.GetData<Account>();
                    var inventory = userData.GetData<HeroInventory>();

                    var hero = inventory.GetHero(req.TargetIdx);
                    hero.IsLock = !hero.IsLock;

                    using (var db = new GameDBConnector(account.GameDBString))
                    {
                        db.Attach(hero.GetEntity(DbCommandType.Update));
                    }

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