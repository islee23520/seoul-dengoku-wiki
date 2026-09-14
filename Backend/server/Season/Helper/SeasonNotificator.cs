namespace SeoulKenshi.Contents.Season.Helper
{
    public delegate void DNoticeChangeSeason(BaseSeason newSeason);
    public delegate void DSeasonChangeConfirmation(int seasonType);

    /// <summary>
    /// 시즌 변경 이벤트 알림.
    /// 게임 로직에서 구독하여 시즌 전환 시 처리합니다.
    /// </summary>
    public static class SeasonNotificator
    {
        public static DNoticeChangeSeason ChangeSeasonNotice { get; set; }
        public static DSeasonChangeConfirmation SeasonChangeConfirmation { get; set; }
    }
}
