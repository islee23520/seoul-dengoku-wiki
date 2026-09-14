using MySqlConnector;
using System;
using Y2K.Core.DataBase;

namespace SeoulKenshi.DB.CommonDB
{
    public sealed class CommonDBConnector : DBConnector<MySqlConnection>, IDisposable
    {
        public static string ConnectionString { get; set; }

        #region 생성자
        public CommonDBConnector(bool useTransaction = false)
            : base(ConnectionString, useTransaction) { }
        #endregion

        public override void Dispose()
        {
            base.Dispose();
        }
    }
}
