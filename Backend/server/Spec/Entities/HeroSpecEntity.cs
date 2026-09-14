using Dapper;
using Dapper.Contrib.Extensions;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using SeoulKenshi.Common;
using SeoulKenshi.Common.ErrorCode;
using SeoulKenshi.Common.Exception;

namespace SeoulKenshi.Spec.Entities
{
    [Table("tbl_hero_spec")]
    public partial class HeroSpecEntity
    {
        #region Properties
        [ExplicitKey]
        public int HeroID { get; set; }
        public int HeroGroupID { get; set; }
        public string Name { get; set; }
        public Grade HeroGrade { get; set; }
        #endregion

        public static List<HeroSpecEntity> LoadFromDB(IDbConnection conn)
        {
            var result = conn.GetAll<HeroSpecEntity>().ToList();
            if (result.Count == 0)
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_NOT_FOUND_SPEC_DATA, "not found hero spec data....");

            return result;
        }
        public static void InsertToDB(IDbConnection conn, List<HeroSpecEntity> data)
        {
            foreach (var spec in data)
                conn.Insert(spec);
        }
        public static void Truncate(IDbConnection conn)
        {
            conn.Execute("TRUNCATE TABLE tbl_hero_spec;");
        }
    }
}
