using Dapper;
using Dapper.Contrib.Extensions;
using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;
using SeoulKenshi.Common.ErrorCode;
using SeoulKenshi.Common.Exception;
using Y2K.Core.DataBase;

namespace SeoulKenshi.DB.GameDB
{
    public interface IHeroEntity
    {
        long HeroIdx { get; set; }
        long AccountIdx { get; set; }
        int HeroID { get; set; }
        short Level { get; set; }
        int Exp { get; set; }
        byte Reinforce { get; set; }
        bool IsLock { get; set; }
        bool IsStorage { get; set; }
        DateTime RegTime { get; set; }
    }

    [Table("tbl_hero")]
    public partial class HeroEntity : Entity, IHeroEntity, IHaveAutoIncrementKey
    {
        #region DB Properties
        [Key]
        public long HeroIdx { get; set; }

        public long AccountIdx { get; set; }
        public int HeroID { get; set; }
        public short Level { get; set; }
        public int Exp { get; set; }
        public byte Reinforce { get; set; }
        public bool IsLock { get; set; }
        public bool IsStorage { get; set; }
        public DateTime RegTime { get; set; }
        #endregion

        #region delegate
        [Write(false)]
        public DPrimaryKeyCallback PrimaryKeyCallback { get; set; }
        #endregion

        #region 생성자
        public HeroEntity() { }
        public HeroEntity(IHeroEntity entity)
            : base(entity.GetHashCode())
        {
            HeroIdx = entity.HeroIdx;
            AccountIdx = entity.AccountIdx;
            HeroID = entity.HeroID;
            Level = entity.Level;
            Exp = entity.Exp;
            Reinforce = entity.Reinforce;
            IsLock = entity.IsLock;
            IsStorage = entity.IsStorage;
            RegTime = entity.RegTime;
        }
        #endregion

        #region DB 관련 함수들
        public static IEnumerable<HeroEntity> LoadFromDB(IDbConnection conn, long accountIdx)
        {
            var sql = "SELECT * FROM tbl_hero WHERE accountIDX = @accountIDX;";
            return conn.Query<HeroEntity>(sql, new { @accountIDX = accountIdx });
        }
        public static void DeleteToDB(IDbConnection conn, List<IHeroEntity> entities)
        {
            if (entities.Count == 0)
                return;

            conn.Delete(entities);
        }

        public override long GetPrimaryKey()
        {
            return HeroIdx;
        }
        public override long InsertToDB(IDbConnection conn)
        {
            if (conn.Insert(this) == 0)
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_DB_QUERY_ERROR, string.Format("failed insert hero entity... accountIdx: {0}, heroID: {1}", AccountIdx, HeroID));

            PrimaryKeyCallback?.Invoke(HeroIdx);

            return HeroIdx;
        }
        public override void SaveToDB(IDbConnection conn)
        {
            var sql = "UPDATE tbl_hero SET heroID = @heroID, level = @level, exp = @exp, reinforce = @reinforce, isLock = @isLock, isStorage = @isStorage WHERE heroIDX = @heroIDX;";
            if(conn.Execute(sql, this) == 0)
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_DB_QUERY_ERROR, string.Format("failed update hero entity... accountIdx: {0}, heroID: {1}", AccountIdx, HeroID));
        }
        public override void DeleteToDB(IDbConnection conn)
        {
            if (conn.Delete(this) == false)
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_DB_QUERY_ERROR, string.Format("failed delete hero entity... heroIdx: {0}", HeroIdx));
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
