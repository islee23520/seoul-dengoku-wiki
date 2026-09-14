using System.Collections.Generic;
using SeoulKenshi.Common;
using SeoulKenshi.Common.ErrorCode;
using SeoulKenshi.Common.Exception;
using SeoulKenshi.Common.Log;
using SeoulKenshi.Contents.Class;
using SeoulKenshi.Contents.Inventory;
using Y2K.Core.Util;

namespace SeoulKenshi.Storage
{
    public class UserData
    {
        #region Properties
        /// <summary>
        /// 해당 정보들의 소유자를 나타내며 보통 AccountIdx를 사용합니다.
        /// </summary>
        public long OwnerIdx { get; set; }
        /// <summary>
        /// 캐시 또는 DB로부터 읽어온 데이터들의 집합 입니다.
        /// </summary>
        public Dictionary<UserDataType, ICacheObject> Data { get; private set; } = new Dictionary<UserDataType, ICacheObject>();

        /// <summary>
        /// 캐시 또는 DB에 저장하는 데이터의 종류를 나타내는 Flag Enum값 입니다.
        /// UserData 객체가 cache에 set 될 때 이 값이 지정되어 있지 않으면 ReadCacheDataTypes값을 적용 합니다.
        /// </summary>
        public UserDataType SaveDataTypes { get; set; }

        /// <summary>
        /// 캐시에서 데이터를 읽어올 때 어떠한 컨테이너들을 불러왔는지 표기되는 Flag값 입니다.
        /// </summary>
        public UserDataType ReadCacheDataTypes { get; set; }
        #endregion

        #region 생성자
        public UserData() { }
        public UserData(long key)
        {
            OwnerIdx = key;
        }
        #endregion

        #region Public functions
        /// <summary>
        /// 타입 안전한 데이터 조회.
        /// IAfterLoadInitializer 구현 타입은 자동으로 로드 후 초기화를 수행합니다.
        /// Account는 자체 InitializeAfterLoad()로 초기화됩니다.
        /// </summary>
        public T GetData<T>() where T : class, ICacheObject
        {
            var key = UserDataProvider.GetUserDataType<T>();

            if (Data.TryGetValue(key, out var result) == false)
            {
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_NOT_FOUND_USER_DATA, $"not found {typeof(T).Name} data");
            }

            if (result is not T typed)
            {
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_NOT_FOUND_USER_DATA,
                    $"type mismatch: expected {typeof(T).Name}, got {result?.GetType().Name}");
            }

            if (typed is Account account)
            {
                account.InitializeAfterLoad();
            }
            else if (typed is IAfterLoadInitializer<Account> initializer)
            {
                initializer.Initialize(GetData<Account>());
            }

            return typed;
        }

        public IInventory GetInventory(InventoryType type)
        {
            switch (type)
            {
                case InventoryType.Hero:
                    return GetData<HeroInventory>();
                case InventoryType.Equipment:
                    return GetData<EquipmentInventory>();
                case InventoryType.Item:
                    return GetData<ItemInventory>();
                default:
                    return null;
            }
        }

        public bool CheckValidation()
        {
            foreach (var pair in Data)
            {
                if (pair.Value == null)
                {
                    return false;
                }
            }

            return true;
        }

        public UserDataType CheckEmptyData()
        {
            var result = UserDataType.None;

            foreach (var pair in Data)
            {
                if (pair.Value == null)
                {
                    result |= pair.Key;
                }
            }

            return result;
        }

        public void MergeData(UserDataType types)
        {
            var newUserData = UserDataProvider.Instance.GetData(OwnerIdx, types);

            MergeData(newUserData);
        }

        public void MergeData(UserData newData, bool withAccount = false)
        {
            foreach (var pair in newData.Data)
            {
                if (pair.Key == UserDataType.Account && withAccount == false)
                {
                    continue;
                }

                if (newData.ReadCacheDataTypes.HasFlag(pair.Key))
                {
                    Data[pair.Key] = pair.Value;
                }
            }

            ReadCacheDataTypes |= newData.ReadCacheDataTypes;
        }
        #endregion
    }
}
