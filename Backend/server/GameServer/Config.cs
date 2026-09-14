using log4net;
using System;
using System.Collections.Generic;
using System.Linq;
using SeoulKenshi.Cache.Redis;
using SeoulKenshi.Common.ErrorCode;
using SeoulKenshi.Common.Exception;
using SeoulKenshi.Common.Log;
using SeoulKenshi.DB;
using SeoulKenshi.DB.CommonDB;
using SeoulKenshi.Spec;
using SeoulKenshi.Storage;
using Y2K.Core.Util;

namespace SeoulKenshi.GameServer
{
    /// <summary>
    /// 서버 구동에 따른 기본 정보들을 설정 및 로딩하는 클래스 입니다.
    /// </summary>
    public class Config
    {
        #region Properties
        /// <summary>
        /// 기획 파일을 관리하는 툴의 커밋 번호(git의 경우 hashcode)
        /// </summary>
        public string SpecVersion { get; set; }
        /// <summary>
        /// 서버 버전
        /// </summary>
        public Y2K.Core.Util.Version ServerVersion { get; set; }

        /// <summary>
        /// 클라로 보내는 데이터 버전
        /// </summary>
        public string DataVersion { get; set; }

        public string LocalIp { get; private set; }
        public string PublicIp { get; private set; }
        public string Url { get; private set; }

        /// <summary>
        /// 금칙어 리스트(일치)
        /// </summary>
        public List<string> IgnoreWords { get; private set; } = new List<string>();
        /// <summary>
        /// 금칙어 리스트(포함 검색용)
        /// </summary>
        public List<string> IgnoreWordsByLikeSearch { get; private set; } = new List<string>();

        /// <summary>
        /// appsettings.json에서 로드된 설정
        /// </summary>
        public GameServerSettings Settings { get; private set; }
        #endregion

        #region Reload용 타임 값들
        DateTime NextIgnorewordReloadTime { get; set; }
        #endregion

        #region Instance
        static Config m_Instance = new Config();
        public static Config Instance
        {
            get { return m_Instance; }
        }
        #endregion

        /// <summary>
        /// GameServerSettings를 주입받아 초기화합니다.
        /// </summary>
        public void Init(GameServerSettings settings)
        {
            Settings = settings;
            ServerVersion = new Y2K.Core.Util.Version(settings.Version);

            UserDataProvider.Region = settings.Region;

            LocalIp = IpHelper.GetLocalIP();
            PublicIp = IpHelper.GetPublicIP();

            var ip = settings.Region == "LOCAL" ? LocalIp : PublicIp;

            Url = "http://" + ip + ":" + settings.GamePort;

            SpecDBConnector.ConnectionString = DBConfig.Instance.GetConnectionString("SPEC_DB");

            CauseTypeString.Check();

            var cacheClient = RedisCacheManager.Instance.GetSystemCacheClient();

            InitSpecData(cacheClient.GetSpecVersion());
        }

        public void InitSpecData(string newVersion)
        {
            var logger = LogManager.GetLogger(LogName.Debug);
            logger.Info("spec data load start.... ");


            using (var db = new SpecDBConnector())
            {
                SpecConfig.Instance.Init(db.Connection);
            }

            SpecVersion = newVersion;

            logger.Info("spec data load end.. now version: " + SpecVersion);
        }

        public void CheckIgnoreWord(string word, bool checkEmpty, bool checkWhiteSpace, bool checkSpecialCharacter)
        {
            // 빈 문자열인지 확인
            if (checkEmpty == true && string.IsNullOrEmpty(word) == true)
            {
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_IGNORE_WORD, "사용할 수 없는 단어가 포함되어 있습니다.");
            }

            // 띄어쓰기가 있는지 확인
            if (checkWhiteSpace == true && string.IsNullOrWhiteSpace(word) == true)
            {
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_IGNORE_WORD, "사용할 수 없는 단어가 포함되어 있습니다.");
            }

            // 특문지 존재하는지 확인
            if (checkSpecialCharacter == true && StringHelper.IsExistSpecialWords(word) == true)
            {
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_IGNORE_WORD, "사용할 수 없는 단어가 포함되어 있습니다.");
            }

            // 금칙어 리스트가 없으면 체크하지 않는다.
            if (IgnoreWords.Count == 0)
            {
                return;
            }

            if (IgnoreWords.Contains(word) == true)
            {
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_IGNORE_WORD, "사용할 수 없는 단어가 포함되어 있습니다.");
            }

            foreach (var data in IgnoreWordsByLikeSearch)
            {
                if (word.ToLower().Contains(data.ToLower()) == true)
                {
                    throw new ErrorCodeException(SystemErrorCode.SYSTEM_IGNORE_WORD, "사용할 수 없는 단어가 포함되어 있습니다.");
                }
            }
        }
        public void IgnoreWordLoadFromDB()
        {
            var now = DateTime.Now;

            if (NextIgnorewordReloadTime == DateTime.MinValue || NextIgnorewordReloadTime <= now)
            {
                NextIgnorewordReloadTime = now.AddSeconds(Settings.CheckIgnoreWordTimeSecond);
            }
            else
            {
                return;
            }

            using (var db = new CommonDBConnector())
            {
                var ignoreWordSpec = IgnoreWordSpec.LoadFromDB(db.Connection);
                IgnoreWords = ignoreWordSpec.Where(r => r.IsLikeSearch == false).Select(r => r.Word).ToList();
                IgnoreWordsByLikeSearch = ignoreWordSpec.Where(r => r.IsLikeSearch == true).Select(r => r.Word).ToList();
            }

            var log = LogManager.GetLogger(LogName.Debug);
            log.Info("check ignore word. " + now);
        }

        public void CheckAcceptableIP()
        {
            if (Settings.Region != "LOCAL" && Settings.Region != "DEV")
            {
                var remoteIp = IpHelper.GetRemoteIP();
                if (Settings.AcceptIP.Contains(remoteIp) == false)
                {
                    throw new ErrorCodeException(SystemErrorCode.SYSTEM_UNACCEPTABLE_PACKET, $"receive to unacceptable ip... remoteIp: {remoteIp}");
                }
            }
        }
    }
}
