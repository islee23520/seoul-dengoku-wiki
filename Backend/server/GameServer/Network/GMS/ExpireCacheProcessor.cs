using System;
using SeoulKenshi.Protocols.WCF.GMS;
using SeoulKenshi.Storage;

namespace SeoulKenshi.GameServer.Service.GMS
{
    public partial class CService : AbstractService, IService
    {
        public ReqExpireCacheResult ExpireCacheProcessor(ReqExpireCache req)
        {
            var result = new ReqExpireCacheResult();

            try
            {
                UserDataProvider.Instance.ExpireCache(req.AccountIdx, UserDataType.ALL);
            }

            catch (Exception e)
            {
                ExceptionHandler(e, result);
            }

            return result;
        }
    }
}
