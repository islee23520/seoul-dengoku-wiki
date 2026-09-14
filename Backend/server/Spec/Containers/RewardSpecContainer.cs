using System.Collections.Generic;
using System.Data;
using SeoulKenshi.Common.ErrorCode;
using SeoulKenshi.Common.Exception;
using SeoulKenshi.Spec.Class;
using SeoulKenshi.Spec.Entities;

namespace SeoulKenshi.Spec.Containers
{
    /// <summary>
    /// 보상과 관련된 기획데이터를 관리하는 객체 입니다.
    /// </summary>
    public partial class RewardSpecContainer
    {
        #region Spec Properties
        /// <summary>
        /// 보상 스펙
        /// </summary>
        public Dictionary<int, List<RewardSpec>> RewardSpecData { get; private set; }

        public Dictionary<string, List<RewardSpec>> NewbieGifeSpecData { get; private set; }
        #endregion

        #region 생성자
        public RewardSpecContainer(IDbConnection conn)
        {
            RewardSpecData = RewardSpecEntity.LoadFromDB(conn);
            NewbieGifeSpecData = NewbieGiftSpecEntity.LoadFromDB(conn);
        }
        #endregion

        public List<RewardSpec> FindRewardSpec(int rewardGroupID)
        {
            if (RewardSpecData.TryGetValue(rewardGroupID, out var result) == false)
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_NOT_FOUND_SPEC_DATA, $"not found reward spec data.. : {rewardGroupID}");

            return result;
        }

        public List<RewardSpec> FindNewbieGiftSpec(string region)
        {
            if (NewbieGifeSpecData.TryGetValue(region, out var result) == false)
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_NOT_FOUND_SPEC_DATA, $"not found newbie gift spec data.. : {region}");

            return result;
        }

    }
}
