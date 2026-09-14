using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using SeoulKenshi.Contents.Season.SeasonProcessor;

namespace SeoulKenshi.Contents.Season
{
    /// <summary>
    /// 시즌 관리 진입점.
    /// 게임별로 상속하여 LoadMasterData/LoadSeasons/CreateProcessor를 구현합니다.
    ///
    /// 사용 예:
    /// <code>
    /// // 게임 프로젝트에서 상속 구현
    /// public class GameSeasonProvider : SeasonProvider
    /// {
    ///     protected override Dictionary&lt;int, SeasonMasterData&gt; LoadMasterData() { ... }
    ///     protected override List&lt;BaseSeason&gt; LoadSeasons() { ... }
    ///     protected override BaseSeasonProcessor CreateProcessor(SeasonMasterData master, BaseSeason season) { ... }
    /// }
    /// </code>
    /// </summary>
    public abstract class SeasonProvider
    {
        public Dictionary<int, SeasonMasterData> MasterData { get; private set; }
            = new Dictionary<int, SeasonMasterData>();

        public ConcurrentDictionary<int, BaseSeason> CurrentSeasons { get; private set; }
            = new ConcurrentDictionary<int, BaseSeason>();

        public Dictionary<int, BaseSeasonProcessor> Processors { get; private set; }
            = new Dictionary<int, BaseSeasonProcessor>();

        /// <summary>
        /// 마스터 데이터 로드 → 시즌 로드 → 프로세서 등록
        /// </summary>
        public void Init()
        {
            MasterData = LoadMasterData();
            RefreshSeasons();
            SetProcessors();
        }

        /// <summary>
        /// 모든 시즌 프로세서를 실행합니다 (주기적 호출용).
        /// </summary>
        public void ProcessSeason()
        {
            foreach (var type in MasterData.Keys)
            {
                Processors[type].Do();
            }
        }

        #region 시즌 조회
        public int GetCurrentSeasonNum(int seasonType)
        {
            if (!CurrentSeasons.TryGetValue(seasonType, out var season))
            {
                throw new InvalidOperationException($"Season not found: type={seasonType}");
            }

            return season.Num;
        }

        public bool IsOutOfSeason(int seasonType)
        {
            if (!CurrentSeasons.TryGetValue(seasonType, out var season))
            {
                return true;
            }

            return !season.IsDuringTheSeason();
        }

        public BaseSeason GetSeason(int seasonType)
        {
            CurrentSeasons.TryGetValue(seasonType, out var result);
            return result;
        }

        public T GetSeason<T>(int seasonType) where T : BaseSeason
        {
            return GetSeason(seasonType) as T;
        }
        #endregion

        void RefreshSeasons()
        {
            var newSeasons = new ConcurrentDictionary<int, BaseSeason>();
            var seasons = LoadSeasons();

            foreach (var season in seasons)
            {
                newSeasons.TryAdd(season.SeasonType, season);
            }

            CurrentSeasons = newSeasons;
        }

        void SetProcessors()
        {
            var newProcessors = new Dictionary<int, BaseSeasonProcessor>();

            foreach (var master in MasterData.Values)
            {
                CurrentSeasons.TryGetValue(master.SeasonType, out var season);
                var processor = CreateProcessor(master, season);
                processor.Do();
                newProcessors.Add(master.SeasonType, processor);
            }

            Processors = newProcessors;
        }

        #region 게임별 구현
        /// <summary>
        /// DB에서 시즌 마스터 데이터를 로드합니다.
        /// </summary>
        protected abstract Dictionary<int, SeasonMasterData> LoadMasterData();

        /// <summary>
        /// DB에서 현재 시즌 목록을 로드합니다.
        /// </summary>
        protected abstract List<BaseSeason> LoadSeasons();

        /// <summary>
        /// 시즌 타입에 맞는 프로세서를 생성합니다.
        /// </summary>
        protected abstract BaseSeasonProcessor CreateProcessor(SeasonMasterData master, BaseSeason season);
        #endregion
    }
}
