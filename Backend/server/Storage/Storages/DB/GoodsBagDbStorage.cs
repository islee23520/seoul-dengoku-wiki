using SeoulKenshi.Contents.Class;
using Y2K.Core.Util;

namespace SeoulKenshi.Storage.DataBase
{
    public class GoodsBagDbStorage : IDataStorage, ICreateData
    {
        public UserDataType StorageType { get { return UserDataType.GoodsBag; } }
        public ICacheObject MetaClass { get; } = new GoodsBag();


        public ICacheObject Create(StorageParameter argument)
        {
            var param = argument as DataBaseStorageParameter;
            if (param == null)
            {
                return null;
            }

            var db = param.DbConnector;

            var result = GoodsBag.Create(db, param.AuthInfo.UID);

            return result;
        }

        public ICacheObject GetData(StorageParameter argument)
        {
            if (argument == null)
                return null;

            var param = argument as DataBaseStorageParameter;
            if (param == null)
            {
                return null;
            }

            var db = param.DbConnector;

            var result = GoodsBag.LoadFromDB(db.Connection, param.AuthInfo.UID);

            return result;
        }
    }
}
