using Dapper;
using Dapper.Contrib.Extensions;
using SeoulKenshi.Common.ErrorCode;
using SeoulKenshi.Common.Exception;
using System.Collections.Generic;
using System.Data;
using System.Linq;

namespace SeoulKenshi.Spec.Entities
{
    [Table("tbl_default_value_spec")]
    public partial class DefaultValueSpecEntity
    {
        #region Properties
        /// <summary>
        /// 타입
        /// </summary>
        [ExplicitKey]
        public string Type { get; set; }
        /// <summary>
        ///  데이터
        /// </summary>
        public string Data { get; set; }
        #endregion

        public static Dictionary<string, string> LoadFromDB(IDbConnection conn)
        {
            var result = conn.GetAll<DefaultValueSpecEntity>().ToDictionary(r => r.Type, r => r.Data);
            if (result.Count == 0)
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_NOT_FOUND_SPEC_DATA, "not found default value spec data....");

            return result;
        }
        public static void InsertToDB(IDbConnection conn, List<DefaultValueSpecEntity> data)
        {
            foreach (var spec in data)
                conn.Insert(spec);
        }
        public static void Truncate(IDbConnection conn)
        {
            conn.Execute("TRUNCATE TABLE tbl_default_value_spec;");
        }

    }
}
