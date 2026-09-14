using System;

namespace SeoulKenshi.Contents.Season
{
    /// <summary>
    /// 시즌 기본 데이터 + 시간 판정.
    /// 게임별 시즌 타입마다 이 클래스를 상속하여 구현합니다.
    /// </summary>
    public abstract class BaseSeason
    {
        /// <summary>
        /// 시즌 고유번호 (DB PK)
        /// </summary>
        public int SeasonIdx { get; set; }

        /// <summary>
        /// 시즌 타입 식별자
        /// </summary>
        public int SeasonType { get; set; }

        /// <summary>
        /// 시즌 번호
        /// </summary>
        public int Num { get; set; }

        /// <summary>
        /// 주차 번호
        /// </summary>
        public short WeeklyNum { get; set; }

        /// <summary>
        /// 정산 완료 여부
        /// </summary>
        public bool IsCalculated { get; set; }

        /// <summary>
        /// 이번 주차가 시즌 마지막인지 여부
        /// </summary>
        public bool IsFinalSeason { get; set; }

        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }

        /// <summary>
        /// 전체 시즌 종료 예정일 (남은 주차 포함)
        /// </summary>
        public DateTime EndOfFinalSeason { get; private set; }

        /// <summary>
        /// 순환 참조 방지용 — 생성 시 주입된 마스터 데이터
        /// </summary>
        protected SeasonMasterData MasterData { get; private set; }

        #region 생성자
        protected BaseSeason(SeasonMasterData masterData, int seasonType, int num, short weeklyNum,
            bool isFinalSeason, DateTime startTime, DateTime endTime)
        {
            MasterData = masterData;
            SeasonType = seasonType;
            Num = num;
            WeeklyNum = weeklyNum;
            IsFinalSeason = isFinalSeason;
            StartTime = startTime;
            EndTime = endTime;
            EndOfFinalSeason = CalculateEndOfFinalSeason();
        }
        #endregion

        #region 시간 판정
        /// <summary>
        /// 현재 시각을 반환합니다. 테스트 시 override 가능.
        /// </summary>
        protected virtual DateTime GetNow()
        {
            return DateTime.UtcNow;
        }

        public bool IsNotStarted()
        {
            return GetNow() < StartTime;
        }

        /// <summary>
        /// 현재 시즌이 진행중인지 여부
        /// </summary>
        public bool IsDuringTheSeason()
        {
            var now = GetNow();
            return now >= StartTime && now <= EndTime;
        }

        /// <summary>
        /// 정산 중인지 여부.
        /// StartCalculateBeforeEnd는 양수 값이며, EndTime 이후의 정산 허용 시간(분)을 의미합니다.
        /// 예: StartCalculateBeforeEnd=5 → EndTime ~ EndTime+5분 구간이 정산 시간
        /// (이름과 달리 "종료 후" 시간이므로 음수 변환하여 AddMinutes에 적용)
        /// </summary>
        public bool IsCalculating()
        {
            var now = GetNow();
            var calculateEnd = EndTime.AddMinutes(MasterData.StartCalculateBeforeEnd * -1);

            return now >= EndTime && now <= calculateEnd;
        }

        public long CalculateSeasonRemainTime(DateTime now)
        {
            if (IsCalculating())
            {
                return 0;
            }

            return (EndTime - now).Ticks;
        }

        /// <summary>
        /// 정산 완료까지 남은 시간
        /// </summary>
        public long GetCalculateEndRemainTime(DateTime now)
        {
            if (!IsCalculating())
            {
                return 0;
            }

            var calculateEnd = EndTime.AddMinutes(MasterData.StartCalculateBeforeEnd * -1);
            return (calculateEnd - now).Ticks;
        }

        public long CalculateSeasonFinalRemainTime(DateTime now)
        {
            if (WeeklyNum == 1)
            {
                return CalculateSeasonRemainTime(now);
            }

            return (EndOfFinalSeason - now).Ticks;
        }
        #endregion

        DateTime CalculateEndOfFinalSeason()
        {
            if (IsFinalSeason)
            {
                return EndTime;
            }

            var remainingWeeks = MasterData.MaxWeeklyCount - WeeklyNum;
            return EndTime.AddMinutes(remainingWeeks * MasterData.WeeklyTimePerMin);
        }
    }
}
