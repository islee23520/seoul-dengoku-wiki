using System.Collections.Generic;
using System.Linq;
using CoreWCF.Web;
using SeoulKenshi.Common;
using SeoulKenshi.Common.ErrorCode;
using SeoulKenshi.Common.Exception;
using SeoulKenshi.Contents.Class;
using SeoulKenshi.Contents.Reward;
using SeoulKenshi.Protocols.Common;
using SeoulKenshi.Protocols.WCF.Auth;
using SeoulKenshi.Protocols.WCF.Hero;

namespace SeoulKenshi.GameServer.Extensions
{
    public static partial class ExtensionMethod
    {
        #region ���� üũ
        public static void CheckSessionKey(this Account account)
        {
            var request = WebOperationContext.Current.IncomingRequest;
            var headers = request.Headers;

            var sessionKey = headers.Get("SessionKey");

            if (string.IsNullOrEmpty(sessionKey) == true || account.SessionKey != long.Parse(sessionKey))
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_INVALID_SESSION_KEY, "invalid session key...");
        }
        #endregion


        #region Account ����
        public static AccountPacket ToPacket(this Account account)
        {
            return new AccountPacket()
            {
                AccountIdx = account.AccountIdx,
                Nickname = account.Nickname,
                Level = account.Level,
                Exp = account.Exp,
                HeroInventoryMax = account.HeroInventoryMax,
                EquipmentInventoryMax = account.EquipmentInventoryMax,
            };
        }
        #endregion

        #region ����� ����
        public static GoodsBagPacket ToPacket(this GoodsBag data)
        {
            return new GoodsBagPacket()
            {
                Gold = data.Gold.Amount,
                FreeCash = data.Cash.FreeCash,
                PaidCash = data.Cash.PaidCash,
            };
        }
        public static List<EnergyPacket> ToPacket(this Dictionary<EnergyType, Energy> data)
        {
            return data.Select(r => r.Value.ToPacket()).ToList();
        }
        public static EnergyPacket ToPacket(this Energy energy)
        {
            return new EnergyPacket() 
            { 
                Type = energy.EnergyType, 
                Amount = energy.Amount, 
                NextChargeTime = energy.NextChargeTime.Ticks 
            };
        }
        #endregion

        #region ���� ���� 
        public static List<HeroPacket> ToPacket(this IEnumerable<Hero> data)
        {
            return data.Select(r => r.ToPacket()).ToList();
        }
        public static HeroPacket ToPacket(this Hero data)
        {
            return new HeroPacket()
            {
                Idx = data.HeroIdx,
                Id = data.HeroID,
                Level = data.Level,
                Exp = data.Exp,
                Reinforce = data.Reinforce,
                IsLock = data.IsLock,
                RegTime = data.RegTime.Ticks
            };
        }
        #endregion


        #region ������ ����
        public static List<RewardPacket> ToPacket(this IEnumerable<IRewardResult> data)
        {
            return data.Select(r => r.ToPacket()).ToList();
        }
        public static RewardPacket ToPacket(this IRewardResult reward)
        {
            return new RewardPacket()
            {
                Type = reward.RewardType,
                CauseType = reward.Cause.Type,
                Data = reward.ToJson()
            };
        }
        public static List<RewardPacketWithCause> ToRewardPacketWithCause(this IEnumerable<IRewardResult> data)
        {
            return data.Select(r => r.ToRewardPacketWithCause()).ToList();
        }
        public static RewardPacketWithCause ToRewardPacketWithCause(this IRewardResult reward)
        {
            return new RewardPacketWithCause()
            {
                Type = reward.RewardType,
                CauseType = reward.Cause.Type,
                Cause = reward.Cause.fromIdx,
                Data = reward.ToJson()
            };
        }
        #endregion
    }
}

