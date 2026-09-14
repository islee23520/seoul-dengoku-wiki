using System.Collections.Generic;
using System.Threading.Tasks;

namespace SeoulKenshi.Storage.DataProviders
{
    public abstract class DataProvider
    {
        protected Dictionary<UserDataType, IDataStorage> DataStorages { get; private set; } = new Dictionary<UserDataType, IDataStorage>();

        public abstract UserData GetData(StorageParameter param);
        public abstract Task<UserData> GetDataAsync(StorageParameter param);

        /// <summary>
        /// 데이터 스토리지를 등록합니다. UserDataProvider.Init()에서 호출됩니다.
        /// </summary>
        public void AddDataStorage(IDataStorage storage)
        {
            DataStorages[storage.StorageType] = storage;
        }

        /// <summary>
        /// types 플래그에 해당하는 등록된 데이터스토리지 객체들을 반환합니다.
        /// </summary>
        protected List<IDataStorage> GetDataStorages(UserDataType types)
        {
            var result = new List<IDataStorage>();

            foreach (var itr in DataStorages)
            {
                if (types.HasFlag(itr.Key))
                {
                    result.Add(itr.Value);
                }
            }

            return result;
        }
    }
}
