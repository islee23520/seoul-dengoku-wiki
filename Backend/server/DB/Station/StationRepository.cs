using Dapper.Contrib.Extensions;
using System.Data;

namespace SeoulKenshi.DB.Station
{
    public class StationRepository
    {
        public StationEntity GetStation(IDbConnection conn, long accountIdx)
        {
            return conn.Get<StationEntity>(accountIdx);
        }

        public long InsertStation(IDbConnection conn, StationEntity entity)
        {
            return conn.Insert(entity);
        }

        public bool UpdateStation(IDbConnection conn, StationEntity entity)
        {
            return conn.Update(entity);
        }

        public StationConstructionEntity GetConstruction(IDbConnection conn, long accountIdx)
        {
            return conn.Get<StationConstructionEntity>(accountIdx);
        }

        public long InsertConstruction(IDbConnection conn, StationConstructionEntity entity)
        {
            return conn.Insert(entity);
        }

        public bool UpdateConstruction(IDbConnection conn, StationConstructionEntity entity)
        {
            return conn.Update(entity);
        }

        public bool DeleteConstruction(IDbConnection conn, StationConstructionEntity entity)
        {
            return conn.Delete(entity);
        }
    }
}
