using log4net;
using System;
using SeoulKenshi.Common.Log;
using SeoulKenshi.Contents.Class;
using SeoulKenshi.DB.GlobalDB;
using SeoulKenshi.LogObject;
using SeoulKenshi.Protocols.WCF.Auth;
using SeoulKenshi.Storage;

namespace SeoulKenshi.GameServer.Service.Auth
{
    public partial class CService : AbstractService, IService
    {
        public ReqCreateNicknameResult CreateNicknameProcessor(ReqCreateNickname req)
        {
            var result = new ReqCreateNicknameResult(req.AccountIdx);

            try
            {
                using (var ppl = new PacketProcessLock(req.GetUserKey()))
                {
                    var authInfo = PreProcess(req);

                    Config.Instance.CheckIgnoreWord(req.Nickname, true, true, true);

                    var now = DateTime.Now;

                    authInfo.Nickname = req.Nickname;
                    authInfo.LastNicknameChangeTime = now;

                    using (var db = new GlobalDBConnector())
                    {
                        authInfo.UpdateNickname(db.Connection);
                    }

                    authInfo.SetCache();

                    var userData = UserDataProvider.Instance.GetData(req.AccountIdx);
                    var account = userData.GetData<Account>();
                    account.Nickname = req.Nickname;

                    WriteLog(account, now);

                    UserDataProvider.Instance.SetCache(userData);
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

        void WriteLog(IAccountLog accountLog, DateTime now)
        {
            var logger = LogManager.GetLogger(LogName.UserLog);
            var createNickNameObject = CreateNickNameLogObject.Create(accountLog, now);
            logger.Info(createNickNameObject.ToJson());

        }
    }
}