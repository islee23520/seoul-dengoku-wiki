using SeoulKenshi.Contents.Inventory;
using Y2K.Core.Util;

namespace SeoulKenshi.Storage.DataBase
{
    public class ItemInventoryDbStorage : IDataStorage, ICreateData
    {
        public UserDataType StorageType { get { return UserDataType.ItemInventory; } }
        public ICacheObject MetaClass { get; } = new ItemInventory();

        public ICacheObject Create(StorageParameter argument)
        {
            var result = new ItemInventory();

            return result;
        }

        public ICacheObject GetData(StorageParameter argument)
        {
            if (argument == null)
            {
                return null;
            }

            // TODO: Item DB 엔티티 구현 후 DB 로드 로직 추가
            var result = new ItemInventory();

            return result;
        }
    }
}
