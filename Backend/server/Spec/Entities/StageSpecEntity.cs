using IslandM.Common.ErrorCode;
using IslandM.Common.Exception;
using System.Collections.Generic;
using System.Linq;

namespace IslandM.Spec
{
    public partial class StageSpecEntity
    {
        //public

        public static List<StageSpecEntity> LoadFromDB(DefinitionDBEntities db)
        {
            var result = db.tbl_stage_spec.ToList();
            if (result.Count == 0)
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_NOT_FOUND_SPEC_DATA, "not found hero spec data....");

            return result;
        }
    }
}
