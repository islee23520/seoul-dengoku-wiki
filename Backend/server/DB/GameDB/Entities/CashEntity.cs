using Dapper.Contrib.Extensions;
using System.Data;
using System.Threading.Tasks;
using SeoulKenshi.Common.ErrorCode;
using SeoulKenshi.Common.Exception;
using Y2K.Core.DataBase;

namespace SeoulKenshi.DB.GameDB.Entities
{
    public interface ICashEntity
    {
        long AccountIdx { get; set; }
        long FreeCash { get; set; }
        long PaidCash { get; set; }
    }

    [Table("tbl_cash")]
    public class CashEntity : Entity, ICashEntity
    {
        #region DB Properties
        [ExplicitKey]
        public long AccountIdx { get; set; }
        public long FreeCash { get; set; }
        public long PaidCash { get; set; }
        #endregion

        #region 생성자
        public CashEntity() { }
        public CashEntity(ICashEntity entity)
            :base(entity.GetHashCode())
        {
            AccountIdx = entity.AccountIdx;
            FreeCash = entity.FreeCash;
            PaidCash = entity.PaidCash;
        }
        #endregion

        public override long GetPrimaryKey()
        {
            return AccountIdx;
        }

        #region DB 관련 함수들
        public static ICashEntity LoadFromDB(IDbConnection conn, long AccountIdx)
        {
            return conn.Get<CashEntity>(AccountIdx);
        }
        public override long InsertToDB(IDbConnection conn)
        {
            conn.Insert(this);

            return AccountIdx;
        }
        public override void SaveToDB(IDbConnection conn)
        {
            if (conn.Update(this) == false)
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_DB_QUERY_ERROR, string.Format("update failed cash entity.. accountIdx: {0}", AccountIdx));
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
