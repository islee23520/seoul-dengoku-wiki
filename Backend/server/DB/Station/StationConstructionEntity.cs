using Dapper.Contrib.Extensions;
using System;

namespace SeoulKenshi.DB.Station
{
    [Table("tbl_station_construction")]
    public class StationConstructionEntity
    {
        [ExplicitKey]
        public long AccountIdx { get; set; }
        public int FacilityKind { get; set; }
        public int TargetLevel { get; set; }
        public DateTime StartedAt { get; set; }
        public DateTime CompletesAt { get; set; }
    }
}
