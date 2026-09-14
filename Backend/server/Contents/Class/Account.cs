using log4net;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using SeoulKenshi.Common;
using SeoulKenshi.Common.Log;
using SeoulKenshi.DB.GameDB;
using SeoulKenshi.LogObject;
using SeoulKenshi.Spec;
using Y2K.Core.DataBase;
using Y2K.Core.Util;

namespace SeoulKenshi.Contents.Class
{
    public partial class Account : GameDBEntity, IAccountLog, IAccountEntity, ICacheObject
    {
        #region Properties
        /// <summary>
        /// 벤더사로부터 받은 유저 고유ID
        /// </summary>
        public string VID { get; set; } = string.Empty;
        public string DID { get; set; }
        public VenderType VenderType { get; set; }

        /// <summary>
        /// 유저 정보가 있는 GameDB의 connection string
        /// </summary>
        public string GameDBString { get; set; }
        /// <summary>
        /// 인증 체크용 세션키
        /// </summary>
        public long SessionKey { get; set; }
        /// <summary>
        /// 유저의 스토어 타입
        /// </summary>
        public StoreType StoreType { get; set; }
        public string ClientRegion { get; set; }
        public string ServerRegion { get; set; }

        /// <summary>
        /// 유저의 닉네임
        /// </summary>
        public string Nickname { get; set; } = string.Empty;
        /// <summary>
        /// 계정 고유번호
        /// </summary>
        public long AccountIdx { get; set; }
        /// <summary>
        /// 계정 레벨
        /// </summary>
        public short Level { get; set; }
        /// <summary>
        /// 계정 경험치
        /// </summary>
        public int Exp { get; set; }
        /// <summary>
        /// 계정의 등급(Normal: 일반 유저, QA: QA용 계정
        /// </summary>
        public string Grade { get; set; }
        /// <summary>
        /// 대표 영웅 고유번호
        /// </summary>
        public long RepresentHeroIdx { get; set; }
        /// <summary>
        /// 영웅 인벤토리 최대 값
        /// </summary>
        public short HeroInventoryMax { get; set; }
        /// <summary>
        /// 장비 인벤토리 최대 값
        /// </summary>
        public short EquipmentInventoryMax { get; set; }
        /// <summary>
        /// 아이템 인벤토리 최대 값
        /// </summary>
        public short ItemInventoryMax { get; set; }
        public int StraightDay { get; set; }
        public int TotalLoginDay { get; set; }
        /// <summary>
        /// 오늘 첫 로그인 시간
        /// </summary>
        public DateTime TodayFirstLoginTime { get; set; }
        /// <summary>
        /// 생성 시간
        /// </summary>
        public DateTime RegTime { get; set; }

        /// <summary>
        /// 레벨업 보상 ID 설정됨(1회성)
        /// </summary>
        [JsonIgnore]
        public List<int> LevelupRewards { get; set; } = new List<int>();
        #endregion

        #region Account에 종속적인 객체들
        public EnergyBag EnergyBag { get; set; }
        #endregion

        #region 생성자 및 cache 관련 함수들
        public Account() { }
        public Account(IAccountEntity entity)
        {
            AccountIdx = entity.AccountIdx;
            Level = entity.Level;
            Exp = entity.Exp;
            RepresentHeroIdx = entity.RepresentHeroIdx;
            HeroInventoryMax = entity.HeroInventoryMax;
            EquipmentInventoryMax = entity.EquipmentInventoryMax;
            ItemInventoryMax = entity.ItemInventoryMax;
            TodayFirstLoginTime = entity.TodayFirstLoginTime;
            RegTime = entity.RegTime;
        }
        public void FillCacheData(long accountIdx, Dictionary<string, object> cacheData)
        {
            var key = CacheKeyMaker.MakeCacheKey<Account>(accountIdx);
            cacheData.Add(key, JsonSerializer.Serialize(this, GetType()));
        }
        public CacheMetaData GetCacheMetaData(long key)
        {
            var result = new CacheMetaData()
            {
                Key = CacheKeyMaker.MakeCacheKey<Account>(key),
                Value = typeof(string)
            };

            return result;
        }
        #endregion

        #region Public Functions
        public static Account Create(long accountIdx, short defaultLevel, short heroInventoryMax, short equipmentInventoyMax, short itemInventoryMax, DateTime now)
        {
            return new Account()
            {
                AccountIdx = accountIdx,
                Level = defaultLevel,
                Grade = "Normal",
                HeroInventoryMax = heroInventoryMax,
                EquipmentInventoryMax = equipmentInventoyMax,
                ItemInventoryMax = itemInventoryMax,

                // 출석부 같이 로그인 타임 체크하는 이벤트로 인해 기본값은 하루 전으로함.
                TodayFirstLoginTime = now.AddDays(-1),
                RegTime = now,
            };
        }
        /// <summary>
        /// 계정 경험치를 증가시키고 만약 레벨이 올랐을 경우 레벨업 여부를 반환합니다
        /// </summary>
        /// <param name="value"></param>
        /// <returns></returns>
        public bool AddExp(int value)
        {
            var maxLevel = SpecConfig.ACCOUNT_SPEC.MaxAccountLevel();
            if (Level == maxLevel)
                return false;

            var beforeLevel = Level;
            var beforeExp = Exp;

            Exp += value;

            var now = DateTime.Now;
            bool isStart = true;
            while (isStart)
            {
                var levelUpSpec = SpecConfig.ACCOUNT_SPEC.LevelUpSpecData.Where(r=>r.Level == Level).FirstOrDefault();
                if (Exp >= levelUpSpec.Exp)
                {
                    Level++;

                    if (Level == maxLevel)
                    {
                        Exp = 0;
                        isStart = false;
                    }
                    else
                        Exp -= levelUpSpec.Exp;

                    LevelupRewards.Add(levelUpSpec.LevelupRewardGroupID);

                    WriteAccountLevelupLog(beforeExp, beforeLevel, value, Exp, now);
                }
                else isStart = false;
            }

            return beforeLevel != Level;
        }

        /// <summary>
        /// 로그인 타임 기준으로 날짜 변경 여부를 반환합니다.
        /// </summary>
        /// <param name="now"></param>
        /// <returns></returns>
        public bool CheckChangeDay(DateTime now)
        {
            var ts = now.Date - TodayFirstLoginTime.Date;
            return ts.Days >= 1;
        }
        /// <summary>
        /// 로그인 타임 기준으로 날짜 변경 여부를 확인 후 변경과 관련된 값(접속한지 몇일째, 주간,월간 변경 여부)를 반환합니다.
        /// 또, TodayFirstLoginTime, StraightDay을 변경합니다.
        /// </summary>
        /// <param name="now"></param>
        /// <returns></returns>
        public (int changeDayCount, bool isChangeWeek, bool isChangeMonth) CheckChangeDayFromLastLogin(DateTime now)
        {
            var isChangeMonth = false;
            var isChangeWeek = false;
            var ts = now.Date - TodayFirstLoginTime.Date;

            if (ts.Days >= 1)
            {
                isChangeMonth = now.Month != TodayFirstLoginTime.Month;

                if (ts.Days >= 7)
                    isChangeWeek = true;
                else
                {
                    var thisWeekInitDateTime = SpecConfig.GLOBAL_CONFIG.WeeklyWorldResetDateTime.CalculateInitDateTime(now);
                    if (now < thisWeekInitDateTime || now.Day == thisWeekInitDateTime.Day)
                        isChangeWeek = true;
                    else
                        isChangeWeek = now >= thisWeekInitDateTime.AddDays(7);

                    // 신규 생성 계정일 경우 주간 변경이 조건에 걸리지 않기 때문에 별도로 체크를 한번 더 한다.
                    if (isChangeWeek == false && RegTime.Date == now.Date)
                        isChangeWeek = true;
                }

                TodayFirstLoginTime = now;

                if (ts.Days == 1) // 연속출석인 경우에만 증가
                    StraightDay++;
                else // 아닌경우 초기화
                    StraightDay = 0;

                TotalLoginDay++;
            }

            return (changeDayCount: ts.Days, isChangeWeek, isChangeMonth);
        }

        #endregion

        public override Entity GetEntity()
        {
            return new AccountEntity(this);
        }

        void WriteAccountLevelupLog(int beforeExp, short beforeLevel, int gainExp, int nowExp, DateTime now)
        {
            // 레벨업 로그 기록
            var logger = LogManager.GetLogger(LogName.UserLog);
            var logObject = AccountLevelupLogObject.Create(this, now, beforeExp, beforeLevel, gainExp, nowExp);
            logger.Info(logObject.ToJson());
        }

        #region After Load Initialization
        /// <summary>
        /// 캐시/DB에서 로드 후 직렬화되지 않는 런타임 상태를 복원합니다.
        /// </summary>
        public void InitializeAfterLoad()
        {
            foreach (var energy in EnergyBag.Data.Values)
            {
                energy.AccountLog = this;
            }
        }
        #endregion
    }
}
