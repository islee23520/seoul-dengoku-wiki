using SeoulKenshi.Contents.Class;
using Y2K.Core.Util;

namespace SeoulKenshi.Storage.Cache
{
    public class GoodsBagCacheStorage : IDataStorage
    {
        public UserDataType StorageType { get { return UserDataType.GoodsBag; } }

        /// <summary>
        /// 해당 스토리지의 객체 정보를 나타내는 메타 클래스객체
        /// </summary>
        public ICacheObject MetaClass { get; } = new GoodsBag();

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

            var result = GoodsBag.DeserializeFromBinary(param.SourceData[cacheKey] as byte[]);

            return result;
        }

    }
}
