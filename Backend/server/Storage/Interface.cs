using System;
using System.Collections.Generic;
using System.Data;
using SeoulKenshi.DB.GlobalDB.Entities;
using Y2K.Core.DataBase;
using Y2K.Core.Util;

namespace SeoulKenshi.Storage
{
    [Flags]
    public enum UserDataType : byte
    {
        None = 0,
        Account = 1 << 0,
        GoodsBag = 1 << 1,
        HeroInventory = 1 << 2,
        ItemInventory = 1 << 3,
        EquipmentInventory = 1 << 4,

        AllInventory = HeroInventory | ItemInventory | EquipmentInventory,
        ALL = Account | GoodsBag | AllInventory
    }



    public interface IDataStorage
    {
        /// <summary>
        /// 스토리지 타입
        /// </summary>
        UserDataType StorageType { get; }
        /// <summary>
        /// 해당 스토리지의 객체 정보를 나타내는 메타 클래스객체
        /// </summary>
        ICacheObject MetaClass { get; }

        ICacheObject GetData(StorageParameter param);
    }

    public interface ICreateData
    {
        ICacheObject Create(StorageParameter param);
    }



    public abstract class StorageParameter
    {
        /// <summary>
        /// 요청하려는 유저 데이터 정보
        /// </summary>
        public UserDataType Types { get; set; }
    }

    public class CacheStorageParameter : StorageParameter
    {
        /// <summary>
        /// 유저 데이터를 찾을 키값
        /// </summary>
        public long Key { get; set; }

        /// <summary>
        /// 레디스에서 받아온 원시 데이터들
        /// </summary>
        public Dictionary<string, object> SourceData { get; set; }
    }

    public class DataBaseStorageParameter : StorageParameter
    {
        public AuthInfo AuthInfo { get; set; }
        public string ServerRegion { get; set; }
        public IY2KDbConnector DbConnector { get; set; }

        #region Create에서만 사용되는 프로퍼티들
        /// <summary>
        /// Create 에서만 사용
        /// </summary>
        public DateTime Now { get; set; }
        #endregion
    }

    /// <summary>
    /// 신규 유저 생성 시 사용되는 파라미터.
    /// Spec 의존 없이 인벤토리 기본 슬롯 수 등 생성에 필요한 값을 전달합니다.
    /// </summary>
    public class CreateUserDataParameter : DataBaseStorageParameter
    {
        public short HeroInventoryDefaultSlot { get; set; }
        public short EquipmentInventoryDefaultSlot { get; set; }
        public short ItemInventoryDefaultSlot { get; set; }
    }
}
