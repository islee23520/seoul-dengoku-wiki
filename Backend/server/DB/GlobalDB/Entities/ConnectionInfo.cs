using Dapper.Contrib.Extensions;

namespace SeoulKenshi.DB.GlobalDB.Entities
{
    [Table("tbl_connection_info")]
    public partial class ConnectionInfo
    {
        [ExplicitKey]
        public short Idx { get; set; }
        public string Type { get; set; }
        public string ConnectionString { get; set; }
        public int UsersCount { get; set; }
    }
}
