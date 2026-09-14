using log4net;
using System.IO;
using System.Text.Json.Serialization;
using SeoulKenshi.Common.ErrorCode;
using SeoulKenshi.Common.Exception;
using SeoulKenshi.Common.Log;
using SeoulKenshi.DB.GameDB.Entities;
using SeoulKenshi.LogObject;
using Y2K.Core.DataBase;

namespace SeoulKenshi.Contents.Class
{
    public class Gold : GameDBEntity, IGoldEntity
    {
        #region Properties
        public long AccountIdx { get; set; }
        public long Amount { get; set; }


        [JsonIgnore]
        public IAccountLog AccountLog { get; set; }
        #endregion

        #region 생성자 및 Serializer
        public Gold() { }
        public Gold(IGoldEntity entity)
        {
            AccountIdx = entity.AccountIdx;
            Amount = entity.Amount;
        }

        public void WriteToBinary(BinaryWriter writer)
        {
            writer.Write(AccountIdx);
            writer.Write(Amount);
        }
        public static Gold ReadFromBinary(BinaryReader reader)
        {
            return new Gold()
            {
                AccountIdx = reader.ReadInt64(),
                Amount = reader.ReadInt64()
            };
        }

        public override Entity GetEntity()
        {
            return new GoldEntity(this);
        }
        #endregion

        public static Gold Create(long AccountIdx, int defaultValue)
        {
            return new Gold()
            {
                AccountIdx = AccountIdx,
                Amount = defaultValue,
            };
        }
        public long Increase(GameLogCause cause, int value)
        {
            var before = Amount;

            Amount += value;
            if (Amount < 0)
                Amount = long.MaxValue;


            WriteChangeGoldLog(AccountLog, cause, "+", before, Amount, value);

            return Amount;
        }
        public long Use(GameLogCause cause, int value)
        {
            var before = Amount;

            if (value > Amount)
                throw new ErrorCodeException(GoodsErrorCode.ERROR_NOT_ENOUGHT_GOLD, $"not enought gold.. has amount: {Amount}, need amount: {value}");

            Amount -= value;

            WriteChangeGoldLog(AccountLog, cause, "-", before, Amount, value);

            return Amount;
        }

        void WriteChangeGoldLog(IAccountLog accountLog, GameLogCause where, string operation, long before, long after, long change)
        {
            var logger = LogManager.GetLogger(LogName.UserLog);
            var logObject = GoldLogObject.Create(accountLog, where, operation, before, after, change);
            logger.Info(logObject.ToJson());
        }
    }
}
