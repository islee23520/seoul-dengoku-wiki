using SeoulKenshi.Common;
using SeoulKenshi.Common.Log;
using SeoulKenshi.Contents.Class;
using SeoulKenshi.Spec;
using SeoulKenshi.Storage;
using Y2K.Core.DataBase;

namespace SeoulKenshi.Contents.Reward.Operators
{
    public class GiveInventorySlotOperator : IGiveRewardOperator
    {
        public RewardType Type { get { return RewardType.InventorySlot; } }

        public IRewardResult Process(IY2KDbConnector db, UserData userData, GiveRewardParam param)
        {
            var rewardParam = param as GiveInventorySlotParam;

            var account = userData.GetData<Account>();

            short now = 0;
            short before = 0;
            var maxSlot = SpecConfig.GLOBAL_CONFIG.FindInventorySlotSpec(rewardParam.InventoryType).MaxSlot;

            switch (rewardParam.InventoryType)
            {
                case InventoryType.Hero:
                    {
                        before = account.HeroInventoryMax;
                        account.HeroInventoryMax += rewardParam.Value;
                        if (account.HeroInventoryMax > maxSlot)
                        {
                            account.HeroInventoryMax = maxSlot;
                        }
                        now = account.HeroInventoryMax;
                        break;
                    }
                case InventoryType.Equipment:
                    {
                        before = account.EquipmentInventoryMax;
                        account.EquipmentInventoryMax += rewardParam.Value;
                        if (account.EquipmentInventoryMax > maxSlot)
                        {
                            account.EquipmentInventoryMax = maxSlot;
                        }
                        now = account.EquipmentInventoryMax;
                        break;
                    }
                case InventoryType.Item:
                    {
                        before = account.ItemInventoryMax;
                        account.ItemInventoryMax += rewardParam.Value;
                        if (account.ItemInventoryMax > maxSlot)
                        {
                            account.ItemInventoryMax = maxSlot;
                        }
                        now = account.ItemInventoryMax;
                        break;
                    }
            }

            db.Attach(account.GetEntity(DbCommandType.Update));

            WriteIncInventorySlotLog(account, rewardParam.InventoryType, before, now, rewardParam.Value);

            return new InventorySlotRewardResult(param.Cause, rewardParam.InventoryType, rewardParam.Value, now);
        }

        void WriteIncInventorySlotLog(IAccountLog accountLog, InventoryType invenType, short before, short now, short change)
        {
            //var logger = LogManager.GetLogger(LogName.UserLog);
            //var logObject = IncInventorySlotLogObject.Create(accountLog, invenType, before, now, change);
            //logger.Info(logObject.ToJson());
        }
    }
}