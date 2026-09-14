using log4net;
using System;
using SeoulKenshi.Common.Log;
using SeoulKenshi.Contents.Class;
using SeoulKenshi.LogObject;
using SeoulKenshi.Protocols.WCF.Front;
using SeoulKenshi.Storage;

namespace SeoulKenshi.GameServer.Service.Front
{
    public partial class CService : IService
    {
        public ReqKeepAliveResult KeepAliveProcessor(ReqKeepAlive req)
        {
            var result = new ReqKeepAliveResult(req.AccountIdx);

            try
            {
                using(var ppl = new PacketProcessLock(req.GetUserKey()))
                {
                    var userData = UserDataProvider.Instance.GetData(req.AccountIdx);

                    var account = userData.GetData<Account>();

                    // 이 로그를 이용해서 CC를 구한다.
                    var logger = LogManager.GetLogger(LogName.UserLog);
                    var logObject = KeepAliveLogObject.Create(account, DateTime.Now);
                    logger.Info(logObject.ToJson());
                }
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
