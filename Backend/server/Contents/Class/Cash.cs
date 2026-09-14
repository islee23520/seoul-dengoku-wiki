using log4net;
using System.IO;
using System.Text.Json.Serialization;
using SeoulKenshi.Common;
using SeoulKenshi.Common.ErrorCode;
using SeoulKenshi.Common.Exception;
using SeoulKenshi.Common.Log;
using SeoulKenshi.DB.GameDB.Entities;
using SeoulKenshi.LogObject;
using Y2K.Core.DataBase;

namespace SeoulKenshi.Contents.Class
{
    public class Cash : GameDBEntity, ICashEntity
    {
        #region Properties
        public long AccountIdx { get; set; }
        public long FreeCash { get; set; }
        public long PaidCash { get; set; }


        [JsonIgnore]
        public IAccountLog AccountLog { get; set; }
        #endregion


        #region 생성자 및 Serializer
        public Cash() { }
        public Cash(ICashEntity entity)
        {
            AccountIdx = entity.AccountIdx;
            FreeCash = entity.FreeCash;
            PaidCash = entity.PaidCash;
        }

        public void WriteToBinary(BinaryWriter writer)
        {
            writer.Write(AccountIdx);
            writer.Write(FreeCash);
            writer.Write(PaidCash);
        }
        public static Cash ReadFromBinary(BinaryReader reader)
        {
            return new Cash()
            {
                AccountIdx = reader.ReadInt64(),
                FreeCash = reader.ReadInt64(),
                PaidCash = reader.ReadInt64()
            };
        }

        public override Entity GetEntity()
        {
            return new CashEntity(this);
        }
        #endregion

        public static Cash Create(long AccountIdx, int defaultValue)
        {
            return new Cash()
            {
                AccountIdx = AccountIdx,
                FreeCash = defaultValue,
                PaidCash = 0
            };
        }

        public long Increase(GameLogCause cause, GoodsType type, int value)
        {
            long before;
            long after;

            if (type == GoodsType.FreeCash)
            {
                before = FreeCash;
                after = IncreaseFreeCash(value);
            }
            else
            {
                before = PaidCash;
                after = IncreasePaidCash(value);
            }

            WriteChangeCashLog(AccountLog, cause, "+", type, before, after, value);

            return after;
        }
        public long Decrease(GameLogCause cause, GoodsType type, int value)
        {
            long before;
            long after;

            if (type == GoodsType.FreeCash)
            {
                before = FreeCash;
                after = DecreaseFreeCash(value);
            }
            else
            {
                before = PaidCash;
                after = DecreasePaidCash(value);
            }

            WriteChangeCashLog(AccountLog, cause, "-", type, before, after, value);

            return after;

        }

        public void ExchangePaidCash(int needValue)
        {
            if (PaidCash == 0 || PaidCash < needValue)
                throw new ErrorCodeException(GoodsErrorCode.ERROR_NOT_ENOUGHT_PAID_CASH, $"not enought Paid Cash... value: {PaidCash}");

            var cause = new GameLogCause(CauseType.ExchangePaidCash);
            Decrease(cause, GoodsType.PaidCash, needValue);
            Increase(cause, GoodsType.FreeCash, needValue);
        }


        #region 무료 캐시
        long IncreaseFreeCash(int value)
        {
            FreeCash += value;
            if (FreeCash < 0)
                FreeCash = long.MaxValue;

            return FreeCash;
        }
        long DecreaseFreeCash(int value)
        {
            var temp = FreeCash - value;
            if (temp < 0)
                throw new ErrorCodeException(GoodsErrorCode.ERROR_NOT_ENOUGHT_FREE_CASH, $"not enought Free Cash.. value: {value}");

            return FreeCash -= value;
        }
        #endregion

        #region 유료 캐시
        long IncreasePaidCash(int value)
        {
            PaidCash += value;
            if (PaidCash < 0)
                PaidCash = long.MaxValue;

            return PaidCash;
        }

        long DecreasePaidCash(int value)
        {
            var temp = PaidCash - value;
            if (temp < 0)
                throw new ErrorCodeException(GoodsErrorCode.ERROR_NOT_ENOUGHT_PAID_CASH, $"not enought Paid Cash.. value: {value}");

            return PaidCash -= value;
        }
        #endregion

        void WriteChangeCashLog(IAccountLog accountLog, GameLogCause where, string operation, GoodsType type, long before, long after, long change)
        {
            var logger = LogManager.GetLogger(LogName.UserLog);
            var logObject = CashLogObject.Create(accountLog, where, operation, type, before, after, change);
            logger.Info(logObject.ToJson());
        }
    }
}
