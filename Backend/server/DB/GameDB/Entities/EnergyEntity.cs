using Dapper;
using Dapper.Contrib.Extensions;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using SeoulKenshi.Common;
using SeoulKenshi.Common.ErrorCode;
using SeoulKenshi.Common.Exception;
using Y2K.Core.DataBase;

namespace SeoulKenshi.DB.GameDB
{
    public interface IEnergyEntity
    {
        long EnergyIdx { get; set; }
        long AccountIdx { get; set; }
        EnergyType EnergyType { get; set; }
        int Amount { get; set; }
        int ExtraAmount { get; set; }
        DateTime NextChargeTime { get; set; }

    }

    [Table("tbl_energy")]
    public partial class EnergyEntity : Entity, IEnergyEntity, IHaveAutoIncrementKey
    {
        #region DB Properties
        [Key]
        public long EnergyIdx { get; set; }

        public long AccountIdx { get; set; }
        public EnergyType EnergyType { get; set; }
        public int Amount { get; set; }
        public int ExtraAmount { get; set; }
        public DateTime NextChargeTime { get; set; }
        #endregion

        #region delegate
        [Write(false)]
        public DPrimaryKeyCallback PrimaryKeyCallback { get; set; }
        #endregion

        #region 생성자
        public EnergyEntity() { }
        public EnergyEntity(IEnergyEntity entity)
            : base(entity.GetHashCode())
        {
            EnergyIdx = entity.EnergyIdx;
            AccountIdx = entity.AccountIdx;
            EnergyType = entity.EnergyType;
            Amount = entity.Amount;
            ExtraAmount = entity.ExtraAmount;
            NextChargeTime = entity.NextChargeTime;
        }
        #endregion

        #region DB 관련 함수들
        public static List<EnergyEntity> LoadFromDB(IDbConnection conn, long accountIdx)
        {
            var sql = "SELECT * FROM tbl_energy WHERE accountIDX = @accountIDX;";
            var result = SqlMapper.Query<EnergyEntity>(conn, sql, new { @accountIDX = accountIdx }).ToList();
            if (result.Count == 0)
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_DB_QUERY_ERROR, $"not found energy entity... accountIdx: {accountIdx}");

            return result;
        }

        public override long GetPrimaryKey()
        {
            return EnergyIdx;
        }
        public override long InsertToDB(IDbConnection conn)
        {
            if (conn.Insert(this) == 0)
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_DB_QUERY_ERROR, $"failed insert energy entity... accountIdx: {AccountIdx}, energy type: {EnergyType}");

            PrimaryKeyCallback?.Invoke(EnergyIdx);

            return EnergyIdx;
        }
        public override void SaveToDB(IDbConnection conn)
        {
            if(conn.Update(this) == false)
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_DB_QUERY_ERROR, $"failed update energy entity... accountIdx: {AccountIdx}, energy type: {EnergyType}");
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
