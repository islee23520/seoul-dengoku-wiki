using System.Runtime.Serialization;
using SeoulKenshi.Common;
using Y2K.Core.Web.WCF.HelpPage.Description;

namespace SeoulKenshi.Protocols.WCF.Auth
{
    #region Auth 정보 요청
    public class ReqGetAuthInfo : BaseWebPacketForVID
    {
        [DataMember, PropertyDesc("device model")]
        public string DeviceModel { get; set; }

        [DataMember, PropertyDesc("Store type")]
        public StoreType StoreType { get; set; }

        [DataMember, PropertyDesc("유저의 국가코드")]
        public string Region { get; set; }
    }

    [DataContract]
    public class ReqGetAuthInfoResult : BaseWebPacketForVIDResult
    {
        [DataMember, PropertyDesc("유저 고유번호")]
        public long AccountIdx { get; set; }

        [DataMember, PropertyDesc("유저 닉네임")]
        public string Nickname { get; set; }

        [DataMember, PropertyDesc("서버 내부에서 생성한 세션키")]
        public string SessionKey { get; set; }

        #region 생성자
        public ReqGetAuthInfoResult(string vid)
        : base(vid) { }
        #endregion
    }
    #endregion 

    #region 로그인 요청 패킷
    [DataContract]
    public class ReqLogin : BaseWebPacket
    {
    }

    [DataContract]
    public class ReqLoginResult : BaseWebPacketResult
    {
        [DataMember, PropertyDesc("해당 유저의 정보")]
        public AccountPacket Account { get; set; }

        [DataMember, PropertyDesc("서버 시간")]
        public long ServerTime { get; set; }

        [DataMember, PropertyDesc("서버 시간 offset")]
        public long ServerTimeOffset { get; set; }

        #region 생성자
        public ReqLoginResult() { }
        public ReqLoginResult(long userKey)
            : base(userKey) { }
        #endregion
    }
    #endregion

    #region 닉네임 생성 패킷
    [DataContract]
    public class ReqCreateNickname : BaseWebPacket
    {
        [DataMember, PropertyDesc("사용할 닉네임")]
        public string Nickname { get; set; }
    }

    [DataContract]
    public class ReqCreateNicknameResult : BaseWebPacketResult
    {
        #region 생성자
        public ReqCreateNicknameResult(long userKey)
            : base(userKey) { }
        #endregion
    }
    #endregion


    public class AccountPacket
    {
        [DataMember, PropertyDesc("계정 고유번호")]
        public long AccountIdx { get; set; }

        [DataMember, PropertyDesc("닉네임")]
        public string Nickname { get; set; }

        [DataMember, PropertyDesc("계정 레벨")]
        public short Level { get; set; }

        [DataMember, PropertyDesc("계정 경험치")]
        public int Exp { get; set; }

        [DataMember, PropertyDesc("영웅 인벤토리 최대 값")]
        public short HeroInventoryMax { get; set; }

        [DataMember, PropertyDesc("보유중인 영웅 갯수")]
        public short HeroCount { get; set; }

        [DataMember, PropertyDesc("장비 인벤토리 최대 값")]
        public short EquipmentInventoryMax { get; set; }

        [DataMember, PropertyDesc("보유중인 장비 갯수")]
        public short EquipmentCount { get; set; }


        [DataMember, PropertyDesc("총 누적 로그인 카운트")]
        public int TotalLoginDay { get; set; }
    }
}