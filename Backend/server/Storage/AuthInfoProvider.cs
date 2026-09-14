using System.Text.Json;
using SeoulKenshi.Cache;
using SeoulKenshi.Cache.Redis;
using SeoulKenshi.Common;
using SeoulKenshi.DB.GlobalDB;
using SeoulKenshi.DB.GlobalDB.Entities;

namespace SeoulKenshi.Storage
{
    public static class AuthInfoProvider
    {
        public static AuthInfo GetAuthInfo(string vid, VenderType venderType, string did, StoreType storeType,
            string clientRegion, string clientVersion, string serverRegion, string serverVersion)
        {
            var result = GlobalDBConnector.GetAuthInfo(vid, venderType, did, storeType, clientRegion, clientVersion, serverRegion, serverVersion);

            CheckAuthInfoInCache(result);

            return result;
        }
        public static AuthInfo GetAuthInfo(long AccountIdx)
        {
            var userKey = $"{typeof(AuthInfo).Name}_{AccountIdx}";

            var authInfo = RedisCacheManager.Instance.GetCacheClient(RedisType.UserCache).Get<AuthInfo>(userKey);
            if (authInfo == null)
                authInfo = GlobalDBConnector.GetAuthInfo(AccountIdx);

            return authInfo;
        }
        public static void SetCache(this AuthInfo authInfo)
        {
            var userKey = $"{typeof(AuthInfo).Name}_{authInfo.UID}";

            var cacheClient = RedisCacheManager.Instance.GetUserCacheClient();
            cacheClient.Set(userKey, JsonSerializer.Serialize(authInfo));

        }
        public static void Expire(this AuthInfo authInfo)
        {
            var userKey = $"{typeof(AuthInfo).Name}_{authInfo.UID}";

            var cacheClient = RedisCacheManager.Instance.GetUserCacheClient();
            cacheClient.Expire(userKey);
        }

        /// <summary>
        /// AuthInfo가 system redis에 있는지 확인 후 없으면 set 합니다.
        /// </summary>
        /// <param name="authInfo"></param>
        static void CheckAuthInfoInCache(AuthInfo authInfo)
        {
            var userKey = $"{typeof(AuthInfo).Name}_{authInfo.UID}";

            var cacheClient = RedisCacheManager.Instance.GetUserCacheClient();
            cacheClient.GetSetValue(userKey, JsonSerializer.Serialize(authInfo));

        }
    }
}
