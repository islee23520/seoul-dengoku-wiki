using Dapper.Contrib.Extensions;
using System.Data;
using System.Threading.Tasks;
using SeoulKenshi.Common.ErrorCode;
using SeoulKenshi.Common.Exception;
using Y2K.Core.DataBase;

namespace SeoulKenshi.DB.GameDB.Entities
{
    public interface IGoldEntity
    {
        long AccountIdx { get; set; }
        long Amount { get; set; }
    }

    [Table("tbl_gold")]
    public class GoldEntity : Entity, IGoldEntity
    {
        [ExplicitKey]
        public long AccountIdx { get; set; }
        public long Amount { get; set; }

        #region 생성자
        public GoldEntity() { }
        public GoldEntity(IGoldEntity entity)
            : base(entity.GetHashCode())
        {
            AccountIdx = entity.AccountIdx;
            Amount = entity.Amount;
        }
        #endregion

        public override long GetPrimaryKey()
        {
            return AccountIdx;
        }

        #region DB 관련 함수들
        public static IGoldEntity LoadFromDB(IDbConnection conn, long AccountIdx)
        {
            return conn.Get<GoldEntity>(AccountIdx);
        }
        public override long InsertToDB(IDbConnection conn)
        {
            conn.Insert(this);

            return 0;
        }
        public override void SaveToDB(IDbConnection conn)
        {
            if (conn.Update(this) == false)
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_DB_QUERY_ERROR, string.Format("Failed gold entity.. accountIdx: {0}", AccountIdx));
        }
        public override void DeleteToDB(IDbConnection conn)
        {
            throw new ErrorCodeException(SystemErrorCode.SYSTEM_INVALID_DB_OPERATION, "SYSTEM_INVALID_DB_OPERATION");
        }

        public override ValueTask<long> InsertToDBAsync(IDbConnection conn)
        {
            return new ValueTask<long>(InsertToDB(conn));
        }

        public override ValueTask SaveToDBAsync(IDbConnection conn)
        {
            SaveToDB(conn);
            return default;
        }

        public override ValueTask DeleteToDBAsync(IDbConnection conn)
        {
            DeleteToDB(conn);
            return default;
        }
        #endregion
    }
}
