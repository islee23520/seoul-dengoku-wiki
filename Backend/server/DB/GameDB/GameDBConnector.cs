using MySqlConnector;
using System;
using Y2K.Core.DataBase;

namespace SeoulKenshi.DB.GameDB
{
    public sealed class GameDBConnector : DBConnector<MySqlConnection>, IDisposable
    {
        #region 생성자
        public GameDBConnector(string connectionString, bool useTransaction = false)
            : base(connectionString, useTransaction) { }
        #endregion

        public override void Dispose()
        {
            base.Dispose();
        }
    }
}
