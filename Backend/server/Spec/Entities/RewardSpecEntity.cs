using Dapper;
using Dapper.Contrib.Extensions;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using SeoulKenshi.Common.ErrorCode;
using SeoulKenshi.Common.Exception;
using SeoulKenshi.Spec.Class;

namespace SeoulKenshi.Spec.Entities
{
    [Table("tbl_reward_spec")]
    public class RewardSpecEntity : RewardSpec
    {
        public int GroupID { get; set; }

        public static Dictionary<int, List<RewardSpec>> LoadFromDB(IDbConnection conn)
        {
            var sql = "SELECT * FROM tbl_reward_master;";
            var queryResult = conn.Query<RewardSpecEntity>(sql).ToList();
            if (queryResult.Count == 0)
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_NOT_FOUND_SPEC_DATA, "not found reward spec data....");

            var result = new Dictionary<int, List<RewardSpec>>();
            foreach (var group in queryResult.GroupBy(r => r.GroupID))
                result.Add(group.Key, group.Cast<RewardSpec>().ToList());

            return result;
        }
    }
}
