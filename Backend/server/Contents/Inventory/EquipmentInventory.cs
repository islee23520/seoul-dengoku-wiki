using System.Collections.Generic;
using System.IO;
using SeoulKenshi.Common;
using SeoulKenshi.Common.Log;
using SeoulKenshi.Contents.Class;
using Y2K.Core.Util;

namespace SeoulKenshi.Contents.Inventory
{
    public class EquipmentInventory : ICacheObject, IInventory, IAfterLoadInitializer<Account>
    {
        #region Properties
        public Dictionary<long, object> Data { get; private set; } = new Dictionary<long, object>();
        public IAccountLog AccountLog { get; set; }
        public short MaxSlotCount { get; set; }
        public int Count => Data.Count;
        #endregion

        #region 생성자 및 Serializer
        public EquipmentInventory() { }

        public byte[] SerializeToBinary()
        {
            using (var ms = new MemoryStream())
            using (var writer = new BinaryWriter(ms))
            {
                writer.Write(Data.Count);
                // TODO: Equipment 엔티티 구현 후 각 항목 직렬화 추가
                writer.Flush();
                return ms.ToArray();
            }
        }

        public static EquipmentInventory DeserializeFromBinary(byte[] data)
        {
            var result = new EquipmentInventory();

            using (var ms = new MemoryStream(data))
            using (var reader = new BinaryReader(ms))
            {
                var count = reader.ReadInt32();
                // TODO: Equipment 엔티티 구현 후 각 항목 역직렬화 추가
            }

            return result;
        }
        #endregion

        #region Cache와 관련된 함수들
        public void FillCacheData(long accountIdx, Dictionary<string, object> cacheData)
        {
            var data = SerializeToBinary();
            var key = CacheKeyMaker.MakeCacheKey<EquipmentInventory>(accountIdx);
            cacheData.Add(key, data);
        }

        public CacheMetaData GetCacheMetaData(long key)
        {
            var result = new CacheMetaData()
            {
                Key = CacheKeyMaker.MakeCacheKey<EquipmentInventory>(key),
                Value = typeof(byte[])
            };

            return result;
        }
        #endregion

        #region Public Functions
        public bool IsEnoughSlot(short addableCount)
        {
            var emptySlots = MaxSlotCount - Data.Count;

            if (emptySlots <= 0 || addableCount > emptySlots)
            {
                return false;
            }

            return true;
        }
        #endregion

        #region IAfterLoadInitializer
        public void Initialize(Account owner)
        {
            AccountLog = owner;
            MaxSlotCount = owner.EquipmentInventoryMax;
        }
        #endregion
    }
}
