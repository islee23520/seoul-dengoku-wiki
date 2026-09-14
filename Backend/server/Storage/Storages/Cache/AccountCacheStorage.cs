using System.Text.Json;
using SeoulKenshi.Contents.Class;
using Y2K.Core.Util;

namespace SeoulKenshi.Storage.Cache
{
    public class AccountCacheStorage : IDataStorage
    {
        public UserDataType StorageType { get { return UserDataType.Account; } }

        /// <summary>
        /// 해당 스토리지의 객체 정보를 나타내는 메타 클래스객체
        /// </summary>
        public ICacheObject MetaClass { get; } = new Account();


        public ICacheObject GetData(StorageParameter argument)
        {
            if (argument == null)
                return null;

            var param = argument as CacheStorageParameter;
            if (param == null)
            {
                return null;
            }

            string cacheKey = MetaClass.GetCacheMetaData(param.Key).Key;
            if (param.SourceData.ContainsKey(cacheKey) == false || param.SourceData[cacheKey] == null)
                return null;

            var result = JsonSerializer.Deserialize<Account>((string)param.SourceData[cacheKey]);

            return result;
        }
    }
}
