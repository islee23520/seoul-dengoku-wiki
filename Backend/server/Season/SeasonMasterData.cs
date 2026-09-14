using System;

namespace SeoulKenshi.Contents.Season
{
    /// <summary>
    /// 시즌 기획 데이터.
    /// 게임별 DB/기획 테이블에서 로드하여 사용합니다.
    /// </summary>
    public class SeasonMasterData
    {
        /// <summary>
        /// 시즌 타입 식별자 (게임별 enum 캐스팅)
        /// </summary>
        public int SeasonType { get; set; }

        /// <summary>
        /// 한 시즌 내 최대 주차 수
        /// </summary>
        public int MaxWeeklyCount { get; set; }

        /// <summary>
        /// 주차당 시간 (분)
        /// </summary>
        public int WeeklyTimePerMin { get; set; }

        /// <summary>
        /// 종료 전 정산 시작 시간 (분, 음수로 사용)
        /// </summary>
        public int StartCalculateBeforeEnd { get; set; }

        /// <summary>
        /// 첫 시즌 시작일
        /// </summary>
        public DateTime FirstSeasonDate { get; set; }
    }
}
