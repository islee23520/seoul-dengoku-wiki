using SeoulKenshi.Contents.Class;
using SeoulKenshi.Contents.Inventory;
using SeoulKenshi.DB.GameDB;
using Y2K.Core.Util;

namespace SeoulKenshi.Storage.DataBase
{
    public class HeroInventoryDbStorage : IDataStorage, ICreateData
    {
        public UserDataType StorageType { get { return UserDataType.HeroInventory; } }
        public ICacheObject MetaClass { get; } = new HeroInventory();


        public ICacheObject Create(StorageParameter argument)
        {
            var result = new HeroInventory();

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

            var result = new HeroInventory();

            var entities = HeroEntity.LoadFromDB(db.Connection, param.AuthInfo.UID);
            foreach (var entity in entities)
                result.Data.Add(entity.HeroIdx, new Hero(entity));

            return result;
        }
    }
}
