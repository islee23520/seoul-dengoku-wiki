using System.Collections.Generic;
using System.Data;
using System.Linq;
using SeoulKenshi.Common.ErrorCode;
using SeoulKenshi.Common.Exception;
using SeoulKenshi.Spec.Entities;

namespace SeoulKenshi.Spec.Containers
{
    /// <summary>
    /// 영웅과 관련된 기획데이터를 관리하는 객체 입니다.
    /// </summary>
    public partial class HeroSpecContainer
    {
        #region Spec Properties
        /// <summary>
        /// 영웅 스펙
        /// </summary>
        public Dictionary<int, HeroSpecEntity> HeroSpecData { get; private set; }
        #endregion

        #region 생성자
        public HeroSpecContainer(IDbConnection conn)
        {
            HeroSpecData = HeroSpecEntity.LoadFromDB(conn).ToDictionary(r=>r.HeroID, r=>r);
        }
        #endregion

        public HeroSpecEntity FindHeroSpec(int heroID)
        {
            if (HeroSpecData.TryGetValue(heroID, out var spec) == false)
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_NOT_FOUND_SPEC_DATA, string.Format("not found hero spec.. heroID: {0}", heroID));

            return spec;
        }
    }
}
