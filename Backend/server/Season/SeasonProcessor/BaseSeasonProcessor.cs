using System;
using SeoulKenshi.Contents.Season.Helper;

namespace SeoulKenshi.Contents.Season.SeasonProcessor
{
    /// <summary>
    /// 시즌 전환 라이프사이클 처리기.
    /// 게임별로 상속하여 CalculateSeason/RedisInit/CreateSeason을 구현합니다.
    /// </summary>
    public abstract class BaseSeasonProcessor
    {
        public SeasonMasterData Master { get; set; }
        public BaseSeason CurrentSeason { get; set; }
        public BaseSeason LastSeason { get; set; }

        protected BaseSeasonProcessor(SeasonMasterData master, BaseSeason lastSeason)
        {
            Master = master;
            SetSeason(lastSeason);
        }

        /// <summary>
        /// 현재 시각을 반환합니다. 테스트 시 override 가능.
        /// </summary>
        protected virtual DateTime GetNow()
        {
            return DateTime.UtcNow;
        }

        public void Do()
        {
            if (LastSeason == null)
            {
                CreateFirstSeason();
            }
            else
            {
                StartNewSeason();
            }
        }

        void CreateFirstSeason()
        {
            var now = GetNow();
            if (now < Master.FirstSeasonDate)
            {
                return;
            }

            var endTime = Master.FirstSeasonDate.AddMinutes(
                Master.WeeklyTimePerMin + Master.StartCalculateBeforeEnd);

            var newSeason = CreateSeason(
                Master.SeasonType, 1, 1,
                1 == Master.MaxWeeklyCount,
                Master.FirstSeasonDate, endTime);

            newSeason.SeasonIdx = SaveSeason(newSeason);
            SetSeason(newSeason);
        }

        void StartNewSeason()
        {
            var now = GetNow();
            var adjustTime = LastSeason.EndTime.AddMinutes(3);

            if (now >= LastSeason.StartTime && now <= adjustTime)
            {
                return;
            }

            if (!LastSeason.IsCalculated)
            {
                CalculateSeason();
                RedisInit();
            }

            var newSeasonStart = LastSeason.StartTime.AddMinutes(Master.WeeklyTimePerMin);
            var newSeasonEnd = newSeasonStart.AddMinutes(
                Master.WeeklyTimePerMin + Master.StartCalculateBeforeEnd);

            if (now < newSeasonStart)
            {
                return;
            }

            int seasonNum;
            short weeklyNum;
            if (LastSeason.WeeklyNum == Master.MaxWeeklyCount)
            {
                seasonNum = LastSeason.Num + 1;
                weeklyNum = 1;
            }
            else
            {
                seasonNum = LastSeason.Num;
                weeklyNum = (short)(LastSeason.WeeklyNum + 1);
            }

            var newSeason = CreateSeason(
                LastSeason.SeasonType, seasonNum, weeklyNum,
                weeklyNum == Master.MaxWeeklyCount,
                newSeasonStart, newSeasonEnd);

            newSeason.SeasonIdx = SaveSeason(newSeason);
            SetSeason(newSeason);
        }

        void SetSeason(BaseSeason newSeason)
        {
            if (newSeason == null)
            {
                return;
            }

            LastSeason = newSeason;
            CurrentSeason = newSeason;

            SeasonNotificator.ChangeSeasonNotice?.Invoke(newSeason);
        }

        #region 게임별 구현
        /// <summary>
        /// 시즌 종료 시 정산 처리
        /// </summary>
        protected abstract void CalculateSeason();

        /// <summary>
        /// Redis 데이터 초기화
        /// </summary>
        protected abstract void RedisInit();

        /// <summary>
        /// 게임별 시즌 인스턴스를 생성합니다.
        /// </summary>
        protected abstract BaseSeason CreateSeason(int seasonType, int num, short weeklyNum,
            bool isFinalSeason, DateTime startTime, DateTime endTime);

        /// <summary>
        /// 시즌을 DB에 저장하고 생성된 SeasonIdx를 반환합니다.
        /// </summary>
        protected abstract int SaveSeason(BaseSeason season);
        #endregion
    }
}
