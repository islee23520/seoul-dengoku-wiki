using System;
using SeoulKenshi.Common.ErrorCode;
using SeoulKenshi.Common.Exception;
using SeoulKenshi.Contents.Class;
using SeoulKenshi.Contents.Session;
using SeoulKenshi.Protocols.WCF.Session;
using SeoulKenshi.Storage;

namespace SeoulKenshi.GameServer.Service.Session
{
    public partial class CService : AbstractService, IService
    {
        public ReqCreateSessionResult CreateSessionProcessor(ReqCreateSession req)
        {
            var result = new ReqCreateSessionResult(req == null ? 0 : req.AccountIdx);

            try
            {
                using (var ppl = new PacketProcessLock(req.GetUserKey()))
                {
                    PreProcess(req);

                    var now = DateTime.UtcNow;
                    var nickname = LoadNickname(req.AccountIdx);

                    if (!SessionRuntime.Sessions.TryCreate(req.AccountIdx, nickname, SessionRuntime.MaxGuests, now,
                            out var session, out var createError))
                    {
                        if (createError == SessionCreateError.HostAlreadyHosting)
                            throw new ErrorCodeException(SessionErrorCode.ERROR_SESSION_HOST_ALREADY_HOSTING,
                                $"host already has an open session. accountIdx: {req.AccountIdx}");

                        throw new ErrorCodeException(SystemErrorCode.SYSTEM_ERROR, "session create failed");
                    }

                    result.Session = SessionRuntime.ToSummaryPacket(session);
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

        /// <summary>세션 로스터에 남길 호스트 닉네임. 계정 데이터에서만 읽는다.</summary>
        static string LoadNickname(long accountIdx)
        {
            var userData = UserDataProvider.Instance.GetData(accountIdx);
            var account = userData.GetData<Account>();
            return account == null || string.IsNullOrEmpty(account.Nickname) ? string.Empty : account.Nickname;
        }
    }
}
