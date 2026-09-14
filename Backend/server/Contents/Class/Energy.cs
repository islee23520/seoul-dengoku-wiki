using log4net;
using System;
using System.Text.Json.Serialization;
using SeoulKenshi.Common;
using SeoulKenshi.Common.ErrorCode;
using SeoulKenshi.Common.Exception;
using SeoulKenshi.Common.Log;
using SeoulKenshi.DB.GameDB;
using SeoulKenshi.Spec;
using Y2K.Core.DataBase;

namespace SeoulKenshi.Contents.Class
{
    public partial class Energy : GameDBEntity, IEnergyEntity
    {
        #region Properties
        public long EnergyIdx { get; set; }
        public long AccountIdx { get; set; }
        public EnergyType EnergyType { get; set; }
        public int Amount { get; set; }
        public int ExtraAmount { get; set; }
        public DateTime NextChargeTime { get; set; }

        [JsonIgnore]
        public IAccountLog AccountLog { get; set; }
        #endregion


        #region 생성자
        public Energy() { }
        public Energy(IEnergyEntity entity)
        {
            EnergyIdx = entity.EnergyIdx;
            AccountIdx = entity.AccountIdx;
            EnergyType = entity.EnergyType;
            Amount = entity.Amount;
            ExtraAmount = entity.ExtraAmount;
            NextChargeTime = entity.NextChargeTime;
        }
        #endregion

        #region Public Functions
        public static Energy Create(long accountIdx, EnergyType type, int defaultAmount, DateTime nextChargeTime)
        {
            return new Energy()
            {
                AccountIdx = accountIdx,
                EnergyType = type,
                Amount = defaultAmount,
                NextChargeTime = nextChargeTime
            };
        }

        public void IncreaseExtraAmount(GameLogCause cause, int value)
        {
            var before = ExtraAmount;

            ExtraAmount += value;

            if (ExtraAmount < 0)
                ExtraAmount = int.MaxValue;

            WriteChangeEnergyLog(AccountLog, cause, "+", EnergyType, before, ExtraAmount, value);
        }

        public bool CheckChargeTime(DateTime now)
        {
            var spec = SpecConfig.GLOBAL_CONFIG.FindEnergySpec(EnergyType);

            var totalMaxAmount = spec.MaxChargeValue;

            if (GetAmount() >= totalMaxAmount || NextChargeTime > now)
                return false;

            var beforeTime = NextChargeTime;
            var ts = now - beforeTime;

            var multiful = (int)(ts.TotalSeconds / spec.ChargeIntervalPerSec);
            if (multiful == 0)
                multiful = 1;

            var before = Amount;

            Amount += spec.ChargeIntervalPerSec * multiful;

            if (Amount > totalMaxAmount)
                Amount = totalMaxAmount;

            NextChargeTime = beforeTime.AddSeconds(spec.ChargeIntervalPerSec * multiful);

            WriteChangeEnergyLog(AccountLog, new GameLogCause(CauseType.EnergyCharge), "C", EnergyType, before, Amount, Amount - before);

            return true;
        }
        public void Use(GameLogCause cause, int value)
        {
            if (value == 0)
                return;

            if (value < 0)
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_INVALID_ARGUMENT, "invalid parameter value...");

            if (GetAmount() < value)
                throw new ErrorCodeException(GoodsErrorCode.ERROR_NOT_ENOUGHT_ENERGY, "not enought energy...");

            var before = Amount;

            if (ExtraAmount >= value)
                ExtraAmount -= value;
            else
            {
                value -= ExtraAmount;
                ExtraAmount = 0;

                Amount -= value;
            }

            WriteChangeEnergyLog(AccountLog, cause, "-", EnergyType, before, GetAmount(), value);

            var spec = SpecConfig.GLOBAL_CONFIG.FindEnergySpec(EnergyType);

            var totalMaxAmount = spec.ChargeAmount;
            var now = DateTime.Now;
            var isInitChargeTime = true;

            if (GetAmount() < totalMaxAmount - 1)
            {
                var ts = NextChargeTime - now;
                if (ts.TotalSeconds > 0)
                    isInitChargeTime = false;
            }

            if (isInitChargeTime == true)
                NextChargeTime = now.AddSeconds(spec.ChargeIntervalPerSec);
        }

        public int GetAmount()
        {
            return Amount + ExtraAmount;
        }
        #endregion

        #region DB Entity 관련
        public override Entity GetEntity()
        {
            var entity = new EnergyEntity(this);

            entity.PrimaryKeyCallback += OnSetIndex;

            return entity;
        }
        void OnSetIndex(long autoIncrementKey) => EnergyIdx = autoIncrementKey;
        #endregion

        #region 로그 관련
        void WriteChangeEnergyLog(IAccountLog accountLog, GameLogCause where, string operation, EnergyType type, long before, long after, long change)
        {
            //var logger = LogManager.GetLogger(LogName.UserLog);
        }
        #endregion
    }
}
