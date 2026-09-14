using System.Collections.Generic;
using System.Linq;
using SeoulKenshi.Common.ErrorCode;
using SeoulKenshi.Common.Exception;
using SeoulKenshi.DB.CommonDB;
using SeoulKenshi.DB.GameDB;
using SeoulKenshi.DB.GlobalDB;

namespace SeoulKenshi.DB
{
    public class DBConfig
    {
        /// <summary>
        /// 연결 문자 관리를 위한 컨테이너
        /// </summary>
        Dictionary<string, Dictionary<short, string>> connectionStrings = new Dictionary<string, Dictionary<short, string>>();

        #region Instance
        static DBConfig m_Instance = new DBConfig();
        public static DBConfig Instance
        {
            get { return m_Instance; }
        }
        #endregion

        #region ConnectionString 관련 함수들
        public void Init(string globalDBString)
        {
            connectionStrings.Clear();

            GlobalDBConnector.ConnectionString = globalDBString;

            foreach (var dataGroup in GlobalDBConnector.GetConnectionInfos().GroupBy(r => r.Type))
                connectionStrings.Add(dataGroup.Key, dataGroup.Where(r => r.Type == dataGroup.Key).ToDictionary(r => r.Idx, r => r.ConnectionString));

            if (connectionStrings.Count == 0)
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_ERROR, "Not exist connection info in global_db.dbo.tbl_connection_info..");

            //CommonDBConnector.ConnectionString = GetConnectionString("COMMON_DB");

            // connection pool을 미리 연결한다.
            //using (var db = new CommonDBConnector()) { }
            
            var gameDBStrings = connectionStrings["GAME_DB"];
            // connection pool을 미리 연결한다.
            foreach (var gameDBString in gameDBStrings.Values)
            {
                using (var db = new GameDBConnector(gameDBString)) { }
            }
        }


        public string GetConnectionString(string type, short idx = 0)
        {
            string result = string.Empty;

            Dictionary<short, string> connection;
            if (connectionStrings.TryGetValue(type, out connection) == false)
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_ERROR, string.Format("Not exist connection info. db type : {0}", type));

            if (idx > 0)
            {
                if (connection.TryGetValue(idx, out result) == false)
                    throw new ErrorCodeException(SystemErrorCode.SYSTEM_ERROR, string.Format("Not exist connection info db type : {0}, idx : {1}", type, idx));
            }
            else
                result = connection.Values.FirstOrDefault();

            return result;
        }
        public static string GetGameDBString(short idx)
        {
            return Instance.GetConnectionString("GAME_DB", idx);
        }
        #endregion
    }
}
