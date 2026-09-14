using Dapper.Contrib.Extensions;
using System;

namespace SeoulKenshi.DB.Station
{
    [Table("tbl_station")]
    public class StationEntity
    {
        [ExplicitKey]
        public long AccountIdx { get; set; }
        public long Food { get; set; }
        public long Parts { get; set; }
        public long Energy { get; set; }
        public long Vouchers { get; set; }
        public DateTime LastUpdated { get; set; }
        public int SupplyLevel { get; set; }
        public int WorkshopLevel { get; set; }
        public int SubstationLevel { get; set; }
        public int ExchangeLevel { get; set; }
    }
}
