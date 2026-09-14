using System.Collections.Generic;
using System.Runtime.Serialization;
using Y2K.Core.Web.WCF.HelpPage.Description;

namespace SeoulKenshi.Protocols.WCF.Hero
{
    #region 영웅 정보 요청
    [DataContract]
    public class ReqGetHeroes : BaseWebPacket
    {
        [DataMember, PropertyDesc("페이지 번호(0이면 페이징 사용 안함)")]
        public int PageNum { get; set; }

        [DataMember, PropertyDesc("페이징 할때 한번에 부를 갯수(0이면 기본값인 1000개씩 묶어서 페이징)")]
        public int PageCount { get; set; }
    }
    [DataContract]
    public class ReqGetHeroesResult : BaseWebPacketResult
    {
        [DataMember, PropertyDesc("요청한 영웅 정보")]
        public List<HeroPacket> Data { get; set; } = new List<HeroPacket>();
    }
    #endregion

    #region 대표 영웅 설정
    [DataContract]
    public class ReqSetRepresentHero : BaseWebPacket
    {
        [DataMember, PropertyDesc("타겟 고유번호")]
        public long TargetIdx { get; set; }
    }
    [DataContract]
    public class ReqSetRepresentHeroResult : BaseWebPacketResult
    {
        #region 생성자
        public ReqSetRepresentHeroResult(long userKey)
        : base(userKey) { }
        #endregion
    }
    #endregion


    #region 영웅 잠금 설정 변경
    [DataContract]
    public class ReqChangeHeroLock : BaseWebPacket
    {
        [DataMember, PropertyDesc("IsLock 값을 변경하고 싶은 영웅의 고유번호")]
        public long TargetIdx { get; set; }
    }
    [DataContract]
    public class ReqChangeHeroLockResult : BaseWebPacketResult
    {
    }
    #endregion

    public class HeroPacket
    {
        [DataMember, PropertyDesc("영웅 고유번호")]
        public long Idx { get; set; }

        [DataMember, PropertyDesc("기획ID")]
        public int Id { get; set; }

        [DataMember, PropertyDesc("레벨")]
        public short Level { get; set; }

        [DataMember, PropertyDesc("경험치")]
        public int Exp { get; set; }

        [DataMember, PropertyDesc("강화도")]
        public byte Reinforce { get; set; }

        [DataMember, PropertyDesc("잠금 여부")]
        public bool IsLock { get; set; }
       
        [DataMember, PropertyDesc("습득날짜")]
        public long RegTime { get; set; }
    }
}
