using System;
using SeoulKenshi.Protocols.WCF.Front;

namespace SeoulKenshi.GameServer.Service.Front
{
    public partial class CService : AbstractService, IService
    {
        public ReqCheckVersionResult CheckVersionProcessor(ReqCheckVersion req)
        {
            var result = new ReqCheckVersionResult();

            try
            {
                result.ServerVersion = Config.Instance.ServerVersion.ToString();
                result.DataVersion = Config.Instance.DataVersion;
            }

            catch (Exception e)
            {
                ExceptionHandler(e, result);
            }

            return result;
        }

    }
}
