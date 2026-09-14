using SeoulKenshi.Contents.Inventory;
using Y2K.Core.Util;

namespace SeoulKenshi.Storage.DataBase
{
    public class EquipmentInventoryDbStorage : IDataStorage, ICreateData
    {
        public UserDataType StorageType { get { return UserDataType.EquipmentInventory; } }
        public ICacheObject MetaClass { get; } = new EquipmentInventory();

        public ICacheObject Create(StorageParameter argument)
        {
            var result = new EquipmentInventory();

            return result;
        }

        public ICacheObject GetData(StorageParameter argument)
        {
            if (argument == null)
            {
                return null;
            }

            // TODO: Equipment DB 엔티티 구현 후 DB 로드 로직 추가
            var result = new EquipmentInventory();

            return result;
        }
    }
}
