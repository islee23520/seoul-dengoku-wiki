using System;
using SeoulKenshi.Contents.Class;
using SeoulKenshi.Protocols.WCF.Lobby;
using SeoulKenshi.Storage;

namespace SeoulKenshi.GameServer.Service.Lobby
{
    public partial class CService : AbstractService, IService
    {
        public ReqCheckChangeDayResult CheckChangeDayProcessor(ReqCheckChangeDay req)
        {
            var result = new ReqCheckChangeDayResult(req.AccountIdx);

            try
            {
                PreProcess(req);

                var userData = UserDataProvider.Instance.GetData(req.AccountIdx);
                var account = userData.GetData<Account>();

                result.IsChange = account.CheckChangeDay(DateTime.Now);
            }

            catch (Exception e)
            {
                ExceptionHandler(e, result);
            }

            finally
            {
                PostProcess(result);
            }

            return result;
        }

    }
}
