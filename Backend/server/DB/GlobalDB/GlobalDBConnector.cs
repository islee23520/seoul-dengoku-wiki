using Dapper;
using Dapper.Contrib.Extensions;
using MySqlConnector;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using SeoulKenshi.Common;
using SeoulKenshi.Common.ErrorCode;
using SeoulKenshi.Common.Exception;
using SeoulKenshi.DB.GlobalDB.Entities;
using Y2K.Core.DataBase;

namespace SeoulKenshi.DB.GlobalDB
{
    public sealed class GlobalDBConnector : DBConnector<MySqlConnection>, IDisposable
    {
        public static string ConnectionString { get; set; }

        #region 생성자
        public GlobalDBConnector(bool useTransaction = false)
            : base(ConnectionString, useTransaction)
        {

        }
        #endregion

        public static AuthInfo GetAuthInfo(string vid, VenderType venderType, string did, StoreType storeType,
            string clientRegion, string clientVersion, string serverRegion, string serverVersion)
        {
            AuthInfo result = null;

            using (var db = new GlobalDBConnector())
            {
                result = AuthInfo.LoadFromDB(db.Connection, vid, venderType, did, (sbyte)storeType, clientRegion, clientVersion, serverRegion, serverVersion);
            }

            return result;
        }
        public static AuthInfo GetAuthInfo(long accountIdx)
        {
            AuthInfo result = null;

            using (var db = new GlobalDBConnector())
            {
                result = AuthInfo.LoadFromDB(db.Connection, accountIdx);
            }

            if (result == null)
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_DB_QUERY_ERROR, string.Format("not found auth info... accountIdx: {0}", accountIdx));

            return result;
        }
        public static AuthInfo GetAuthInfo(string nickName)
        {
            AuthInfo result = null;

            using (var db = new GlobalDBConnector())
            {
                result = AuthInfo.LoadFromDB(db.Connection, nickName);
            }

            if (result == null)
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_DB_QUERY_ERROR, string.Format("not found auth info... nickName: {0}", nickName));

            return result;
        }
        public static AuthInfo GetAuthInfoByVid(string vid)
        {
            AuthInfo result = null;

            using (var db = new GlobalDBConnector())
            {
                result = AuthInfo.LoadFromDBByVid(db.Connection, vid);
            }

            if (result == null)
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_DB_QUERY_ERROR, string.Format("not found auth info... VenderID: {0}", vid));

            return result;
        }
        public static List<ConnectionInfo> GetConnectionInfos()
        {
            using (var db = new GlobalDBConnector())
            {
                return db.Connection.GetAll<ConnectionInfo>().ToList(); ;
            }
        }

        public static string GenerateVID()
        {
            using (var db = new GlobalDBConnector())
            {
                return db.Connection.Query<string>("usp_generate_develop_vid", commandType: CommandType.StoredProcedure).FirstOrDefault();
            }
        }
    }
}
