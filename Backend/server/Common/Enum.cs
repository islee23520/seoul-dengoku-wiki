using Y2K.Core.Web.WCF.HelpPage.Description;

namespace SeoulKenshi.Common
{
    [EnumDesc(false)]
    public enum StoreType : byte
    {
        [PropertyDesc("개발용")]
        Dev = 0,

        [PropertyDesc("앱스토어")]
        Apple,

        [PropertyDesc("구글스토어")]
        Google,
    }

    [EnumDesc(false)]
    public enum VenderType : byte
    {
        Dev = 0,
        [PropertyDesc("페이스북")]
        Facebook,
        [PropertyDesc("구글스토어")]
        Google,
        [PropertyDesc("애플")]
        Apple,
        [PropertyDesc("카카오")]
        Kakao,
    }

    [EnumDesc(false)]
    public enum EnergyType : byte
    {
        [PropertyDesc("일반")]
        Stamina = 1,
        [PropertyDesc("PVP용")]
        PVP
    }

    [EnumDesc(false)]
    public enum GoodsType : byte
    {
        [PropertyDesc("골드")]
        Gold = 1,
        [PropertyDesc("무료재화")]
        FreeCash,
        [PropertyDesc("유료재화")]
        PaidCash,
        [PropertyDesc("마일리지")]
        Mileage,
    }

    [EnumDesc(false)]
    public enum RewardType : byte
    {
        [PropertyDesc("없음")]
        None = 0,
        [PropertyDesc("경험치")]
        Exp,
        [PropertyDesc("재화")]
        Goods,
        [PropertyDesc("에너지")]
        Energy,
        [PropertyDesc("영웅")]
        Hero,
        [PropertyDesc("장착 아이템")]
        Equipment,
        [PropertyDesc("일반 아이템")]
        Item,
        [PropertyDesc("인벤토리 슬롯")]
        InventorySlot
    }

    [EnumDesc(false)]
    public enum ExpType : byte
    {
        [PropertyDesc("계정 경험치")]
        Account,
    }



    [EnumDesc(false)]
    public enum InventoryType : byte
    {
        [PropertyDesc("타입 지정 없음")]
        None = 0,
        [PropertyDesc("영웅")]
        Hero,
        [PropertyDesc("장착 아이템")]
        Equipment,
        [PropertyDesc("일반 아이템")]
        Item
    }

    [EnumDesc(false)]
    public enum EquipType : byte
    {
        [PropertyDesc("없음")]
        None = 0,
        [PropertyDesc("헬멧")]
        Helmet,
        [PropertyDesc("상의")]
        Coat,
        [PropertyDesc("하의")]
        Pants,
        [PropertyDesc("장갑")]
        Globes,
        [PropertyDesc("신발")]
        Boots,
        [PropertyDesc("무기")]
        Weapon,
    }

    [EnumDesc(false)]
    public enum Grade : byte
    {
        [PropertyDesc("일단 등급")]
        N = 1,
        [PropertyDesc("희귀 등급")]
        R,
        [PropertyDesc("매우 희귀 등급")]
        SR,
        [PropertyDesc("초희귀 등급")]
        SSR,
        [PropertyDesc("전설 등급")]
        UR
    }

}
