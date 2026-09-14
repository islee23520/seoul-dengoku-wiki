using MySqlConnector;
using System;
using Y2K.Core.DataBase;

namespace SeoulKenshi.Spec
{
    public sealed class SpecDBConnector : DBConnector<MySqlConnection>, IDisposable
    {
        public static string ConnectionString { get; set; }

        #region 생성자
        public SpecDBConnector()
            : base(ConnectionString, false) { }
        #endregion
 
        public override void Dispose()
        {
            base.Dispose();
        }
    }
}
