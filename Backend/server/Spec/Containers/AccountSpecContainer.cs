using SeoulKenshi.Common;
using SeoulKenshi.Common.ErrorCode;
using SeoulKenshi.Common.Exception;
using SeoulKenshi.Spec.Entities;
using System.Collections.Generic;
using System.Data;
using System.Linq;

namespace SeoulKenshi.Spec.Containers
{
    /// <summary>
    /// 계정과 관련된 기획 데이터들을 관리하는 객체 입니다.
    /// </summary>
    public partial class AccountSpecContainer
    {
        #region Spec  Properties
        /// <summary>
        /// 계정 경험치 스펙
        /// </summary>
        public List<AccountLevelupSpecEntity> LevelUpSpecData { get; private set; }
        #endregion

        #region 생성자
        public AccountSpecContainer(IDbConnection conn)
        {
            LevelUpSpecData = AccountLevelupSpecEntity.LoadFromDB(conn);
         }
        #endregion

        #region Public Functions
        public int MaxAccountLevel()
        {
            return LevelUpSpecData.Max(r => r.Level);
        }

        /// <summary>
        /// 계정 레벨에 대한 에너지 최대 수치 관련 스펙 데이터를 반환합니다.
        /// </summary>
        /// <param name="accountLevel"></param>
        /// <returns></returns>
        public AccountLevelupSpecEntity MaxEnergyByAccountLevel(short accountLevel)
        {
            var result = LevelUpSpecData.Where(r => r.Level == accountLevel).FirstOrDefault();
            if(result == null)
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_NOT_FOUND_SPEC_DATA, string.Format("not found account levelup spec... accountLevel: {0}", accountLevel));

            return result;
        }
        #endregion
    }
}
