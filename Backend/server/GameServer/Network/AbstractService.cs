using log4net;
using System;
using CoreWCF;
using CoreWCF.Web;
using SeoulKenshi.Cache.Redis;
using SeoulKenshi.Common.ErrorCode;
using SeoulKenshi.Common.Exception;
using SeoulKenshi.Common.Log;
using SeoulKenshi.DB.GlobalDB.Entities;
using SeoulKenshi.Protocols.Common;
using SeoulKenshi.Protocols.WCF.Auth;
using SeoulKenshi.Storage;
using Y2K.Core.Util;

namespace SeoulKenshi.GameServer.Service
{
    [ServiceBehavior(InstanceContextMode = InstanceContextMode.Single, ConcurrencyMode = ConcurrencyMode.Multiple)]
    public abstract class AbstractService
    {
        /// <summary>
        /// 패킷 처리 진입시 공통적으로 처리해야 할 내용
        /// </summary>
        /// <param name="packet"></param>
        protected AuthInfo PreProcess(BasePacket packet)
        {
            var remoteIp = IpHelper.GetRemoteIP();
            var userKey = packet.GetUserKey();

            if (string.IsNullOrEmpty(userKey) == true)
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_INVALID_PACKET_DATA, $"userKey가 NULL 입니다. remoteIP: {IpHelper.GetRemoteIP()}");

            PrintPacket(packet);

            CheckClientVersion(packet.Version);

            CheckOverlappedPacket(userKey);

            AuthInfo authInfo;

            if (packet is ReqGetAuthInfo reqPacket)
                authInfo = AuthInfoProvider.GetAuthInfo(reqPacket.VID, reqPacket.VenderType, reqPacket.DeviceModel, reqPacket.StoreType, reqPacket.Region, reqPacket.Version, Config.Instance.Settings.Region, Config.Instance.ServerVersion.ToString());
            else
            {
                if (long.TryParse(userKey, out var key) == false)
                    throw new ErrorCodeException(SystemErrorCode.SYSTEM_INVALID_PACKET_DATA, "invalid packet type..");

                authInfo = AuthInfoProvider.GetAuthInfo(key);
                CheckSessionKey(authInfo.SessionKey);
            }

            return authInfo;
        }

        /// <summary>
        /// 패킷 처리 후 공통적으로 처리해야 할 내용
        /// </summary>
        protected void PostProcess(BasePacket packet)
        {
            packet.Version = Config.Instance.ServerVersion.ToString();

            var userKey = packet.GetUserKey();

            PrintPacket(packet);
        }

        protected void ExceptionHandler(Exception e, IErrorCode properties)
        {
            properties.ErrorCode = SystemErrorCode.SYSTEM_ERROR;
            properties.ErrorMessage = string.Empty;

            var Log = LogManager.GetLogger(LogName.Debug);
            if (e is ErrorCodeException e2)
            {
                properties.ErrorCode = e2.ErrorCode;
                properties.ErrorMessage = e2.Message;

                Log.Debug(e2.ErrorCode, e2);
            }
            else
                Log.Debug(e, e);
        }


        /// <summary>
        /// 중복패킷인지 확인합니다.
        /// </summary>
        /// <param name="account"></param>
        protected void CheckOverlappedPacket(string key)
        {
            var request = WebOperationContext.Current.IncomingRequest;
            var headers = request.Headers;

            long timeStamp = long.Parse(headers["TimeStamp"]);
            string redisKey = "GameServer_RecvPacketTime_" + key;

            if (timeStamp == RedisCacheManager.Instance.GetSystemCacheClient().GetTimeStamp(redisKey))
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_PROCESSED_PACKET, $"this packet is already processed... AccountIdx or vid is [{key}]");

            RedisCacheManager.Instance.GetSystemCacheClient().SetTimeStamp(redisKey, timeStamp);
        }
        protected void CheckClientVersion(string clientVersion)
        {
            if (string.IsNullOrEmpty(clientVersion) == true)
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_ERROR, "Invalid client version");

            var version = new Y2K.Core.Util.Version(clientVersion);
            var serverVersion = Config.Instance.ServerVersion;


            if (version.Height != serverVersion.Height)
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_MISMACH_VERSION_HEIGHT, "mismach height version..");

            if (version.Middle != serverVersion.Middle)
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_MISMACH_VERSION_MIDDLE, "mismach middle version..");
        }

        #region 패킷 출력
        protected void PrintPacket(BasePacket packet)
        {
            if (Config.Instance.Settings.IsWritePacketTraceLog == false)
                return;

            var Log = LogManager.GetLogger(LogName.Debug);
            Log.Info(packet.ToString());
        }
        #endregion

        protected string IssueToNewSessionKey()
        {
            var sessionName = "System.SessionKeys";

            var cacheClient = RedisCacheManager.Instance.GetSystemCacheClient();

            var result = cacheClient.DecrementSequence(sessionName);

            if (result <= 0)
            {
                cacheClient.InitSequence(sessionName, long.MaxValue);
                result = cacheClient.DecrementSequence(sessionName);
            }

            return result.ToString();
        }
        protected void CheckSessionKey(string fromCachKey)
        {
            var request = WebOperationContext.Current.IncomingRequest;
            var headers = request.Headers;
            var sessionKey = headers.Get("SessionKey");

            if (string.IsNullOrEmpty(sessionKey) == true)
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_INVALID_SESSION_KEY, "session key is null...");

            if (sessionKey != fromCachKey)
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_INVALID_SESSION_KEY, "miss match session key...");
        }
    }
}
