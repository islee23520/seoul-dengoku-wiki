using log4net;
using System;
using SeoulKenshi.Common;
using SeoulKenshi.Common.Log;
using SeoulKenshi.Contents.Class;
using SeoulKenshi.Contents.Inventory;
using SeoulKenshi.Contents.Reward;
using SeoulKenshi.DB.GameDB;
using SeoulKenshi.DB.GlobalDB.Entities;
using SeoulKenshi.GameServer.Extensions;
using SeoulKenshi.LogObject;
using SeoulKenshi.Protocols.WCF.Auth;
using SeoulKenshi.Spec;
using SeoulKenshi.Storage;

namespace SeoulKenshi.GameServer.Service.Auth
{
    public partial class CService : AbstractService, IService
    {
        public ReqLoginResult LoginProcessor(ReqLogin req)
        {
            var result = new ReqLoginResult(req.AccountIdx);

            try
            {
                using (var ppl = new PacketProcessLock(req.GetUserKey()))
                {

                    var authInfo = PreProcess(req);

                    var now = DateTime.Now;

                    result.Account = ProcessLogin(authInfo);
                    result.ServerTime = now.Ticks;
                    result.ServerTimeOffset = TimeZoneInfo.Utc.GetUtcOffset(now).Ticks;
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

        AccountPacket ProcessLogin(AuthInfo authInfo)
        {
            // 로그인 때 무조건 날린다.
            UserDataProvider.Instance.ExpireCache(authInfo.UID, UserDataType.ALL);

            var now = DateTime.Now;
            var isNewUser = false;
            var userData = UserDataProvider.Instance.UserDataLoadFromDB(authInfo, UserDataType.ALL);
            if (userData == null || userData.CheckValidation() == false)
            {
                var createParam = new CreateUserDataParameter()
                {
                    AuthInfo = authInfo,
                    Now = now,
                    HeroInventoryDefaultSlot = SpecConfig.GLOBAL_CONFIG.FindInventorySlotSpec(InventoryType.Hero).DefaultSlot,
                    EquipmentInventoryDefaultSlot = SpecConfig.GLOBAL_CONFIG.FindInventorySlotSpec(InventoryType.Equipment).DefaultSlot,
                    ItemInventoryDefaultSlot = SpecConfig.GLOBAL_CONFIG.FindInventorySlotSpec(InventoryType.Item).DefaultSlot
                };
                userData = UserDataProvider.Instance.MakeNewbieData(createParam);
                isNewUser = true;

                GiveNewbieGift(userData);
            }

            var account = userData.GetData<Account>();

            UserDataProvider.Instance.SetCache(userData, UserDataType.ALL);

            WriteLog(account, now, isNewUser);

            var result = account.ToPacket();

            var heroInventory = userData.GetData<HeroInventory>();
            result.HeroCount = (short)heroInventory.Data.Count;

            //var equipInventory = userData.GetEquipmentInventory();
            //result.EquipmentCount = (short)equipInventory.Data.Count;

            return result;
        }


        void GiveNewbieGift(UserData userData)
        {
            var rewards = SpecConfig.REWARD_SPEC.FindNewbieGiftSpec(Config.Instance.Settings.Region);
            if (rewards.Count == 0)
                return;

            var cause = new GameLogCause(CauseType.NewbieAccount);
            var rewardParams = GiveRewardParamMaker.MakeRewardParams(cause, rewards);

            using (var db = new GameDBConnector(userData.GetData<Account>().GameDBString, true))
            {
                GiveReward.Instance.Process(db, userData, rewardParams);

                db.Commit();
            }
        }

        void WriteLog(Account account, DateTime now, bool isNewbie)
        {
            var logger = LogManager.GetLogger(LogName.UserLog);

            if (isNewbie == true)
            {
                var logObject = CreateAccountLogObject.Create(account, now);
                logger.Info(logObject.ToJson());
            }

            // 로그인 행위는 공통
            var loginLogObject = LoginLogObject.Create(account, now);
            logger.Info(loginLogObject.ToJson());
        }
    }
}