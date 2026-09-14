using log4net;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using SeoulKenshi.Cache.Redis;
using SeoulKenshi.Common.ErrorCode;
using SeoulKenshi.Common.Exception;
using SeoulKenshi.Common.Log;

namespace SeoulKenshi.Storage.DataProviders
{
    public sealed class CacheDataProvider : DataProvider
    {
        #region Public functions
        public override UserData GetData(StorageParameter param)
        {
            var cacheParam = param as CacheStorageParameter;
            if (cacheParam == null)
            {
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_INVALID_TYPE, $"Invalid parameter type: expected {nameof(CacheStorageParameter)}, got {param?.GetType().Name}");
            }

            var cacheData = new Dictionary<string, object>();
            var jsonTypeKeys = new List<string>();
            var byteArrayTypeKeys = new List<string>();
            var storages = new List<IDataStorage>();

            var result = new UserData(cacheParam.Key);

            try
            {
                storages = GetDataStorages(cacheParam.Types);

                foreach (var storage in storages)
                {
                    var metaData = storage.MetaClass.GetCacheMetaData(cacheParam.Key);

                    if (metaData.Value.Equals(typeof(string)))
                    {
                        jsonTypeKeys.Add(metaData.Key);
                    }
                    else
                    {
                        byteArrayTypeKeys.Add(metaData.Key);
                    }
                }

                var cacheClient = RedisCacheManager.Instance.GetUserCacheClient();
                if (jsonTypeKeys.Count != 0)
                {
                    var jsonTypeResults = cacheClient.GetJsonTypeUsingMultiKeys(jsonTypeKeys);
                    foreach (var jsonTypeKey in jsonTypeKeys)
                    {
                        cacheData.Add(jsonTypeKey, jsonTypeResults[jsonTypeKey]);
                    }
                }

                if (byteArrayTypeKeys.Count != 0)
                {
                    var byteArrayTypeResults = cacheClient.GetBytesTypeUsingMultiKeys(byteArrayTypeKeys);
                    for (var index = 0; index < byteArrayTypeKeys.Count; index++)
                    {
                        cacheData.Add(byteArrayTypeKeys[index], byteArrayTypeResults[index]);
                    }
                }
            }
            catch (Exception e)
            {
                var log = LogManager.GetLogger(LogName.Debug);
                log.Error("레디스 캐시 읽기에 실패했습니다. 레디스 상태를 확인해보세요.", e);
            }
            finally
            {
                cacheParam.SourceData = cacheData;

                foreach (var storage in storages)
                {
                    result.Data.Add(storage.StorageType, storage.GetData(cacheParam));
                }
            }

            return result;
        }
        public override async Task<UserData> GetDataAsync(StorageParameter param)
        {
            var cacheParam = param as CacheStorageParameter;
            if (cacheParam == null)
            {
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_INVALID_TYPE, $"Invalid parameter type: expected {nameof(CacheStorageParameter)}, got {param?.GetType().Name}");
            }

            var cacheData = new Dictionary<string, object>();
            var jsonTypeKeys = new List<string>();
            var byteArrayTypeKeys = new List<string>();
            var storages = new List<IDataStorage>();

            var result = new UserData(cacheParam.Key);
            try
            {
                storages = GetDataStorages(cacheParam.Types);
                foreach (var storage in storages)
                {
                    var metaData = storage.MetaClass.GetCacheMetaData(cacheParam.Key);
                    if (metaData.Value.Equals(typeof(string)))
                    {
                        jsonTypeKeys.Add(metaData.Key);
                    }
                    else
                    {
                        byteArrayTypeKeys.Add(metaData.Key);
                    }
                }

                var cacheClient = RedisCacheManager.Instance.GetUserCacheClient();

                // 두 비동기 작업을 병렬로 실행하여 성능 최적화
                Task<Dictionary<string, string>> jsonTask = null;
                Task<byte[][]> byteTask = null;

                if (jsonTypeKeys.Count != 0)
                {
                    jsonTask = cacheClient.GetJsonTypeUsingMultiKeysAsync(jsonTypeKeys);
                }

                if (byteArrayTypeKeys.Count != 0)
                {
                    byteTask = cacheClient.GetBytesTypeUsingMultiKeysAsync(byteArrayTypeKeys);
                }

                if (jsonTask != null)
                {
                    var jsonResults = await jsonTask;
                    foreach (var key in jsonTypeKeys)
                    {
                        cacheData.Add(key, jsonResults[key]);
                    }
                }

                if (byteTask != null)
                {
                    var byteResults = await byteTask;
                    for (int i = 0; i < byteArrayTypeKeys.Count; i++)
                    {
                        cacheData.Add(byteArrayTypeKeys[i], byteResults[i]);
                    }
                }
            }
            catch (Exception e)
            {
                LogManager.GetLogger(LogName.Debug).Error("Redis 비동기 조회 실패", e);
            }
            finally
            {
                cacheParam.SourceData = cacheData;

                foreach (var storage in storages)
                {
                    result.Data.Add(storage.StorageType, storage.GetData(cacheParam));
                }
            }

            return result;
        }

        /// <summary>
        /// 유저 데이터를 캐시에 저장합니다.
        /// </summary>
        /// <param name="account"></param>
        /// <param name="types"></param>
        public void SetCache(UserData data)
        {
            try
            {
                var cacheData = new Dictionary<string, object>();

                foreach (var target in data.Data.Values)
                    target.FillCacheData(data.OwnerIdx, cacheData);

                Dictionary<string, string> dataA = new Dictionary<string, string>();
                Dictionary<string, byte[]> dataB = new Dictionary<string, byte[]>();
                foreach (var pair in cacheData)
                {
                    if (pair.Value is string)
                        dataA.Add(pair.Key, pair.Value as string);
                    else
                        dataB.Add(pair.Key, pair.Value as byte[]);
                }

                var cacheClient = RedisCacheManager.Instance.GetUserCacheClient();
                cacheClient.SetMultiKey(dataA);
                cacheClient.SetMultiKey(dataB);
            }

            catch (Exception e)
            {
                var log = LogManager.GetLogger(LogName.Debug);
                log.Info("레디스 캐시에 쓰기를 실패했습니다. 레디스 상태를 확인하시기 바랍니다.", e);
            }
        }
        public async Task SetCacheAsync(UserData data)
        {
            try
            {
                var cacheData = new Dictionary<string, object>();

                foreach (var target in data.Data.Values)
                    target.FillCacheData(data.OwnerIdx, cacheData);

                Dictionary<string, string> dataA = new Dictionary<string, string>();
                Dictionary<string, byte[]> dataB = new Dictionary<string, byte[]>();

                foreach (var pair in cacheData)
                {
                    if (pair.Value is string)
                        dataA.Add(pair.Key, pair.Value as string);
                    else if (pair.Value is byte[])
                        dataB.Add(pair.Key, pair.Value as byte[]);
                }

                var cacheClient = RedisCacheManager.Instance.GetUserCacheClient();

                // 3. 비동기 저장 작업 목록 생성 (병렬 실행을 위해)
                var tasks = new List<Task>();
                if (dataA.Count > 0)
                    tasks.Add(cacheClient.SetMultiKeyAsync(dataA));
                if (dataB.Count > 0)
                    tasks.Add(cacheClient.SetMultiKeyAsync(dataB));

                // 4. 모든 저장 작업이 완료될 때까지 비동기 대기
                if (tasks.Count > 0)
                    await Task.WhenAll(tasks);
            }
            catch (Exception e)
            {
                var log = LogManager.GetLogger(LogName.Debug);
                log.Error("레디스 캐시 비동기 쓰기를 실패했습니다.", e);
            }
        }

        /// <summary>
        /// 유저 캐시 정보를 캐시에서 삭제 합니다.
        /// </summary>
        /// <param name="key"></param>
        /// <param name="types"></param>
        public void ExpireUserCache(long key, UserDataType types)
        {
            var storages = GetDataStorages(types);

            var cacheClient = RedisCacheManager.Instance.GetUserCacheClient();
            foreach (var storage in storages)
                cacheClient.Expire(storage.MetaClass.GetCacheMetaData(key).Key);
        }
        #endregion
    }
}
