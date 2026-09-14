using System;
using System.Collections.Generic;
using SeoulKenshi.DB.GlobalDB.Entities;
using SeoulKenshi.Storage.Cache;
using SeoulKenshi.Storage.DataBase;
using SeoulKenshi.Storage.DataProviders;
using Y2K.Core.Util;

namespace SeoulKenshi.Storage
{
    public class UserDataProvider
    {
        #region Properties
        public static string Region { get; set; }

        CacheDataProvider cacheProvider { get; }
        DbDataProvider dbProvider { get; }
        #endregion

        #region Type-Key 매핑
        /// <summary>
        /// ICacheObject 타입 → UserDataType 키 매핑.
        /// Init()에서 Register 시 자동으로 구축됩니다.
        /// </summary>
        static readonly Dictionary<Type, UserDataType> TypeToKeyMap = new Dictionary<Type, UserDataType>();

        /// <summary>
        /// ICacheObject 타입에 해당하는 UserDataType 키를 반환합니다.
        /// </summary>
        public static UserDataType GetUserDataType<T>() where T : class, ICacheObject
        {
            if (!TypeToKeyMap.TryGetValue(typeof(T), out var key))
            {
                throw new InvalidOperationException($"Unmapped type: {typeof(T).Name}. Init()에서 Register 등록이 필요합니다.");
            }

            return key;
        }
        #endregion

        #region Instance
        static UserDataProvider m_Instance = new UserDataProvider();
        public static UserDataProvider Instance
        {
            get { return m_Instance; }
        }
        #endregion

        #region 생성자 및 초기화
        private UserDataProvider()
        {
            cacheProvider = new CacheDataProvider();
            dbProvider = new DbDataProvider();

            Init();
        }

        /// <summary>
        /// Cache/DB 스토리지 쌍을 등록하고 Type-Key 매핑을 구축합니다.
        /// 새로운 데이터 타입 추가 시 이곳에 Register 호출을 추가하세요.
        /// </summary>
        public void Init()
        {
            RegisterStorages(new AccountCacheStorage(), new AccountDbStorage());
            RegisterStorages(new GoodsBagCacheStorage(), new GoodsBagDbStorage());
            RegisterStorages(new HeroInventoryCacheStorage(), new HeroInventoryDbStorage());
            RegisterStorages(new EquipmentInventoryCacheStorage(), new EquipmentInventoryDbStorage());
            RegisterStorages(new ItemInventoryCacheStorage(), new ItemInventoryDbStorage());
        }
        #endregion

        #region Public Functions
        public UserData GetData(long accountIdx, UserDataType types = UserDataType.Account, bool isAutoLoad = true)
        {
            if (types.HasFlag(UserDataType.Account) == false)
            {
                types |= UserDataType.Account;
            }

            var result = cacheProvider.GetData(new CacheStorageParameter() { Key = accountIdx, Types = types });

            var emptyDataTypes = result.CheckEmptyData();
            if (emptyDataTypes != UserDataType.None && isAutoLoad == true)
            {
                var temp = UserDataLoadFromDB(AuthInfoProvider.GetAuthInfo(accountIdx), emptyDataTypes);

                result.MergeData(temp, true);
            }

            return result;
        }

        public void SetCache(UserData data, UserDataType types = UserDataType.None)
        {
            if (types == UserDataType.None)
            {
                data.SaveDataTypes = data.ReadCacheDataTypes;
            }
            else
            {
                data.SaveDataTypes |= data.ReadCacheDataTypes;
            }

            cacheProvider.SetCache(data);
        }

        public void ExpireCache(long accountIdx, UserDataType types)
        {
            cacheProvider.ExpireUserCache(accountIdx, types);
        }

        /// <summary>
        /// 신규 유저 정보를 생성합니다.
        /// </summary>
        public UserData MakeNewbieData(CreateUserDataParameter param)
        {
            param.ServerRegion = Region;
            param.Types = UserDataType.ALL;
            return dbProvider.Create(param);
        }

        public UserData UserDataLoadFromDB(AuthInfo authInfo, UserDataType types)
        {
            return dbProvider.GetData(new DataBaseStorageParameter() { AuthInfo = authInfo, ServerRegion = Region, Types = types });
        }
        #endregion

        /// <summary>
        /// Cache/DB 스토리지를 쌍으로 등록합니다.
        /// StorageType 불일치 시 예외가 발생합니다.
        /// </summary>
        void RegisterStorages(IDataStorage cacheStorage, IDataStorage dbStorage)
        {
            if (cacheStorage.StorageType != dbStorage.StorageType)
            {
                throw new InvalidOperationException(
                    $"Cache/DB StorageType mismatch: Cache={cacheStorage.StorageType}, DB={dbStorage.StorageType}");
            }

            var storageType = cacheStorage.StorageType;
            var cacheObjectType = cacheStorage.MetaClass.GetType();

            cacheProvider.AddDataStorage(cacheStorage);
            dbProvider.AddDataStorage(dbStorage);

            TypeToKeyMap[cacheObjectType] = storageType;
        }
    }
}
