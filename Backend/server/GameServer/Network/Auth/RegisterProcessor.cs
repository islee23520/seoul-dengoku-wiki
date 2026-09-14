using System;
using System.Data;
using SeoulKenshi.Common.ErrorCode;
using SeoulKenshi.Common.Exception;
using SeoulKenshi.DB;
using SeoulKenshi.DB.GameDB;
using SeoulKenshi.Protocols.WCF.Auth;
using SeoulKenshi.Storage;

namespace SeoulKenshi.GameServer.Service.Auth
{
    public partial class CService : AbstractService, IService
    {
        public ReqRegisterResult RegisterProcessor(ReqRegister req)
        {
            var result = new ReqRegisterResult(req?.VID);

            try
            {
                if (req == null || string.IsNullOrEmpty(req.VID) == true)
                    throw new ErrorCodeException(SystemErrorCode.SYSTEM_INVALID_PACKET_DATA, "VID is required.");

                using (var ppl = new PacketProcessLock(req.GetUserKey()))
                {
                    CheckClientVersion(req.Version);
                    CheckOverlappedPacket(req.GetUserKey());

                    var authInfo = AuthInfoProvider.GetAuthInfo(
                        req.VID,
                        req.VenderType,
                        req.DeviceModel,
                        req.StoreType,
                        req.Region,
                        req.Version,
                        Config.Instance.Settings.Region,
                        Config.Instance.ServerVersion.ToString());

                    EnsureGameAccount(authInfo.UID, authInfo.GameDB);

                    authInfo.SessionKey = IssueToNewSessionKey();

                    result.AccountIdx = authInfo.UID;
                    result.Nickname = authInfo.Nickname;
                    result.SessionKey = authInfo.SessionKey;

                    AuthInfoProvider.SetCache(authInfo);
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

        static void EnsureGameAccount(long accountIdx, short gameDbIdx)
        {
            using (var db = new GameDBConnector(DBConfig.GetGameDBString(gameDbIdx)))
            {
                Exec(db.Connection, accountIdx,
                    "INSERT IGNORE INTO tbl_account (AccountIdx, Level, Exp, RepresentHeroIdx, HeroInventoryMax, EquipmentInventoryMax, ItemInventoryMax, StraightDay, TotalLoginDay, TodayFirstLoginTime, RegTime) VALUES (@id, 1, 0, 0, 50, 50, 50, 0, 0, DATE_SUB(NOW(), INTERVAL 1 DAY), NOW())");
                Exec(db.Connection, accountIdx,
                    "INSERT IGNORE INTO tbl_gold (AccountIdx, Amount) VALUES (@id, 0)");
                Exec(db.Connection, accountIdx,
                    "INSERT IGNORE INTO tbl_cash (AccountIdx, FreeCash, PaidCash) VALUES (@id, 0, 0)");
                Exec(db.Connection, accountIdx,
                    "INSERT INTO tbl_energy (AccountIdx, EnergyType, Amount, ExtraAmount, NextChargeTime) SELECT @id, 1, 10, 0, DATE_ADD(NOW(), INTERVAL 60 SECOND) FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tbl_energy WHERE AccountIdx=@id AND EnergyType=1)");
                Exec(db.Connection, accountIdx,
                    "INSERT INTO tbl_energy (AccountIdx, EnergyType, Amount, ExtraAmount, NextChargeTime) SELECT @id, 2, 5, 0, DATE_ADD(NOW(), INTERVAL 120 SECOND) FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tbl_energy WHERE AccountIdx=@id AND EnergyType=2)");
            }
        }

        static void Exec(IDbConnection conn, long accountIdx, string sql)
        {
            using (var cmd = conn.CreateCommand())
            {
                cmd.CommandText = sql;
                var p = cmd.CreateParameter();
                p.ParameterName = "@id";
                p.Value = accountIdx;
                cmd.Parameters.Add(p);
                cmd.ExecuteNonQuery();
            }
        }
    }
}
