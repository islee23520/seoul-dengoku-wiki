using Dapper;
using Dapper.Contrib.Extensions;
using SeoulKenshi.Common.ErrorCode;
using SeoulKenshi.Common.Exception;
using System;
using System.Data;
using System.Linq;
using SeoulKenshi.Common;
using System.Collections.Generic;

namespace SeoulKenshi.DB.GlobalDB.Entities
{
    [Table("tbl_auth_info")]
    public partial class AuthInfo
    {
        #region DB Properties
        [Key]
        public long UID { get; set; }

        public string VenderID { get; set; }

        public VenderType VenderType { get; set; }
        public sbyte MarketID { get; set; }
        public string DID { get; set; }
        public string Region { get; set; }
        public short GameDB { get; set; }
        public string Nickname { get; set; }
        public DateTime LastNicknameChangeTime { get; set; }
        public DateTime RegTime { get; set; }
        public DateTime UnRegTime { get; set; }

        [Write(false)]
        public string ServerRegion { get; set; }
        [Write(false)]
        public string ClientVersion { get; set; }
        [Write(false)]
        public string ServerVersion { get; set; }
        [Write(false)]
        public string SessionKey { get; set; }
        #endregion

        public static AuthInfo LoadFromDB(IDbConnection conn, string vid, VenderType venderType, string did,
            sbyte marketID, string clientRegion, string clientVersion, string serverRegion, string serverVersion)
        {
            bool isChange = false;

            var result = conn.Query<AuthInfo>("usp_get_auth_info", new { inVenderID = vid, inVenderType = venderType, inRegTime = DateTime.Now }, commandType: CommandType.StoredProcedure).FirstOrDefault();
            if (result == null)
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_DB_QUERY_ERROR, $"not found auth info... vid: {vid}");

            if (result.DID != did)
            {
                result.DID = did;
                isChange = true;
            }

            if (result.MarketID != marketID)
            {
                result.MarketID = marketID;
                isChange = true;
            }

            if (result.Region != clientRegion)
            {
                result.Region = clientRegion;
                isChange = true;
            }

            result.ClientVersion = clientVersion;
            result.ServerRegion = serverRegion;
            result.ServerVersion = serverVersion;

            if (isChange == true)
                result.UpdateClientInfo(conn);

            return result;
        }
        public static AuthInfo LoadFromDB(IDbConnection conn, long AccountIdx)
        {
            return conn.Get<AuthInfo>(AccountIdx);
        }
        public static AuthInfo LoadFromDBByVid(IDbConnection conn, string vid)
        {
            var sql = "SELECT * FROM tbl_auth_info WHERE venderID = @vid";
            return SqlMapper.Query<AuthInfo>(conn, sql, new { vid }).FirstOrDefault();
        }
        public static AuthInfo LoadFromDB(IDbConnection conn, string nickName)
        {
            var sql = "SELECT * FROM tbl_auth_info WHERE nickName = @nickName";
            return SqlMapper.Query<AuthInfo>(conn, sql, new { nickName }).FirstOrDefault();
        }

        public static int GetCount(IDbConnection conn)
        {
            var sql = "SELECT COUNT(UID) FROM tbl_auth_info;";

            return SqlMapper.Query<int>(conn, sql).FirstOrDefault();

        }
        public static IEnumerable<AuthInfo> LoadFromDB(IDbConnection conn, int from, int to)
        {
            var sql = $"SELECT * FROM tbl_auth_info LIMIT {from} OFFSET {to};";

            return SqlMapper.Query<AuthInfo>(conn, sql).ToList();
        }

        public static List<AuthInfo> LoadFromDB(IDbConnection conn, long[] accountIdxs)
        {
            var idxs = string.Join(",", accountIdxs);
            var sql = $"SELECT * FROM tbl_auth_info WHERE UID In ({idxs});";

            return SqlMapper.Query<AuthInfo>(conn, sql).ToList();
        }

        public void UpdateClientInfo(IDbConnection conn)
        {
            var sql = "UPDATE tbl_auth_info SET marketID = @marketID, did = @did, region = @region WHERE UID = @uid";
            if (conn.Execute(sql, new { MarketID, DID, Region, UID }) == 0)
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_DB_QUERY_ERROR, $"Failed update Authinfo... accountIdx: {UID}");
        }
        public void UpdateNickname(IDbConnection conn)
        {
            var queryResult = SqlMapper.Query<int>(conn, "usp_nicknameGenerator", new { inUID = UID, inNickname = Nickname, inUpdateTime = LastNicknameChangeTime }, commandType: CommandType.StoredProcedure).FirstOrDefault();

            if (queryResult == SystemErrorCode.ERROR_ALREADY_EXIST_NICKNAME)
                throw new ErrorCodeException(SystemErrorCode.ERROR_ALREADY_EXIST_NICKNAME, "ERROR_ALREADY_EXIST_NICKNAME");
        }

        public void Unregistered(IDbConnection conn, DateTime now)
        {
            var sql = "UPDATE tbl_auth_info SET venderID = @venderID, unRegTime = @unRegTime WHERE UID = @uid";

            var vid = $"{VenderID}_{now:yyyy-MM-dd HH:mm:ss}";

            if (conn.Execute(sql, new { @venderID = vid, @unRegTime = now, @uid = UID }) == 0)
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_DB_QUERY_ERROR, $"Failed unregistered accountIdx: {UID}");
        }
    }
}
