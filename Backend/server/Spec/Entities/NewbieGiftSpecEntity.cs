using Dapper;
using Dapper.Contrib.Extensions;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using SeoulKenshi.Spec.Class;

namespace SeoulKenshi.Spec.Entities
{
    [Table("tbl_newbie_spec")]
    public class NewbieGiftSpecEntity : RewardSpec
    {
        public string Region { get; set; }

        public static Dictionary<string, List<RewardSpec>> LoadFromDB(IDbConnection conn)
        {
            var result = new Dictionary<string, List<RewardSpec>>();

            var sql = "SELECT * FROM tbl_newbie_spec;";
            var queryResult = conn.Query<NewbieGiftSpecEntity>(sql).ToList();
            if (queryResult.Count == 0)
                return result;

            foreach (var group in queryResult.GroupBy(r => r.Region))
            {
                var rewards = group.Cast<RewardSpec>().ToList();
                result.Add(group.Key, rewards);
            }

            return result;
        }
    }
}
