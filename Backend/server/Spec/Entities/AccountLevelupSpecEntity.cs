using Dapper;
using Dapper.Contrib.Extensions;
using SeoulKenshi.Common.ErrorCode;
using SeoulKenshi.Common.Exception;
using System.Collections.Generic;
using System.Data;
using System.Linq;

namespace SeoulKenshi.Spec.Entities
{
    [Table("tbl_account_levelup_spec")]
    public partial class AccountLevelupSpecEntity
    {
        #region Properties
        /// <summary>
        /// 계정 레벨
        /// </summary>
        [ExplicitKey]
        public int Level { get; set; }
        /// <summary>
        ///  경험치
        /// </summary>
        public int Exp { get; set; }
        /// <summary>
        /// 레벨별 최대 에너지 값.
        /// </summary>
        public short MaxEnergy { get; set; }
        /// <summary>
        /// 레벨업 시 획득 할 수 있는 보상 정보
        /// </summary>
        public int LevelupRewardGroupID { get; set; }
        #endregion

        public static List<AccountLevelupSpecEntity> LoadFromDB(IDbConnection conn)
        {
            var result = conn.GetAll<AccountLevelupSpecEntity>().ToList();
            if (result.Count == 0)
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_NOT_FOUND_SPEC_DATA, "not found account levelup spec data....");

            return result;
        }
        public static void InsertToDB(IDbConnection conn, List<AccountLevelupSpecEntity> data)
        {
            foreach (var spec in data)
                conn.Insert(spec);
        }
        public static void Truncate(IDbConnection conn)
        {
            conn.Execute("TRUNCATE TABLE tbl_account_levelup_spec;");
        }
    }
}
