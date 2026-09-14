using System;
using System.Collections.Generic;
using System.Data;
using Y2K.Core.Util.Random;

namespace SeoulKenshi.Common
{
    /// <summary>
    /// RandomNumber가 static 클래스이므로 직접 위임합니다.
    /// 원본의 GlobalRandom.RandomGenerator.Between() → GlobalRandom.Between() 으로 호출 변경 필요
    /// </summary>
    public static class GlobalRandom
    {
        public static int Between(int min, int max) => RandomNumber.Between(min, max);
        public static long Between64(long min, long max) => RandomNumber.Between64(min, max);
    }

    /// <summary>
    /// 이벤트에 사용되는 날짜 관련 클래스
    /// </summary>
    public partial class EventDateTime
    {
        /// <summary>
        /// 이벤트 시작 시간
        /// </summary>
        public DateTime StartDateTime { get; set; }
        /// <summary>
        /// 이벤트 종료 시간
        /// </summary>
        public DateTime EndDateTime { get; set; }
        /// <summary>
        /// 이벤트 기간 중 특정 요일마다 반복하고 싶을 때 사용되는 DayOfWeek값으로 0(Sunday) 부터 6(Saturday)까지 설정 가능하다.
        /// </summary>
        public List<DayOfWeek> RepeatDayofWeeks { get; set; }

        /// <summary>
        /// 오늘이 이벤트 날짜에 속해 있는지에 대한 여부를 반환 합니다.
        /// </summary>
        /// <param name="now"></param>
        /// <returns></returns>
        public bool UseableEvent(DateTime now)
        {
            if (now >= StartDateTime && now <= EndDateTime)
            {
                if (RepeatDayofWeeks != null)
                    return RepeatDayofWeeks.Contains(now.DayOfWeek);
                else
                    return true;
            }

            return false;
        }
    }

    public interface ISpecCache
    {
        string GetKey();
        void LoadFromDB(IDbConnection conn, Dictionary<string, string> defaultValueString);
    }

    /// <summary>
    /// 캐시 또는 DB에서 데이터 로드 후 직렬화되지 않는 런타임 상태를 복원/초기화하는 객체가 구현합니다.
    /// </summary>
    public interface IAfterLoadInitializer<in TOwner>
    {
        void Initialize(TOwner owner);
    }

    public sealed class AppID
    {
        static readonly string _dev = "NONE";
        static readonly string _apple = "com.SeoulKenshi.ios.apple.global.normal";
        static readonly string _google = "com.SeoulKenshi.android.google.global.normal";

        public static string GetAppID(StoreType storeType)
        {
            switch (storeType)
            {
                case StoreType.Dev:
                    return _dev;
                case StoreType.Apple:
                    return _apple;
                case StoreType.Google:
                    return _google;
                default:
                    return "NONE";
            }
        }
        public static StoreType GetMarketID(string appID)
        {
            var result = StoreType.Dev;

            if (appID == _apple)
                result = StoreType.Apple;
            else if (appID == _google)
                result = StoreType.Google;

            return result;
        }
    }
}