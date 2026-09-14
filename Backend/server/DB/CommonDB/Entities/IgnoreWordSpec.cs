using Dapper;
using Dapper.Contrib.Extensions;
using System.Collections.Generic;
using System.Data;
using System.Linq;

namespace SeoulKenshi.DB.CommonDB
{
    [Table("tbl_Ignore_word_spec")]
    public class IgnoreWordSpec
    {
        public string Word { get; set; }
        public bool IsLikeSearch { get; set; }


        public static List<IgnoreWordSpec> LoadFromDB(IDbConnection conn)
        {
            return SqlMapper.Query<IgnoreWordSpec>(conn, "select * from tbl_Ignore_word_spec").ToList();
        }
    }
}
