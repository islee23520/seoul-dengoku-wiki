using System;
using System.IO;
using System.Text.Json;
using System.Text.Json.Nodes;
using SeoulKenshi.Common;
using SeoulKenshi.Common.Log;
using SeoulKenshi.Contents.Inventory;
using SeoulKenshi.DB.GameDB;
using Y2K.Core.DataBase;

namespace SeoulKenshi.Contents.Class
{
    public partial class Hero : GameDBEntity, IHeroEntity
    {
        #region Properties
        public long HeroIdx { get; set; }
        public long AccountIdx { get; set; }
        public int HeroID { get; set; }
        public short Level { get; set; }
        public int Exp { get; set; }
        public byte Reinforce { get; set; }
        public bool IsLock { get; set; }
        public bool IsStorage { get; set; }
        public DateTime RegTime { get; set; }
        #endregion

        #region PrivateMembers
        // 생성 단계에서 셋팅되고 그 후에는 설정되지 않는다.
        HeroInventory _owner;
        GameLogCause _cause;
        #endregion

        #region 생성자 및 Serializer
        public Hero() { }
        public Hero(IHeroEntity entity)
        {
            HeroIdx = entity.HeroIdx;
            AccountIdx = entity.AccountIdx;
            HeroID = entity.HeroID;
            Level = entity.Level;
            Exp = entity.Exp;
            Reinforce = entity.Reinforce;
            IsLock = entity.IsLock;
            IsStorage = entity.IsStorage;
            RegTime = entity.RegTime;
        }

        public void WriteToBinary(BinaryWriter writer)
        {
            writer.Write(HeroIdx);
            writer.Write(AccountIdx);
            writer.Write(HeroID);
            writer.Write(Level);
            writer.Write(Exp);
            writer.Write(Reinforce);
            writer.Write(IsLock);
            writer.Write(IsStorage);
            writer.Write(RegTime.Ticks);
        }
        public static Hero ReadFromBinary(BinaryReader reader)
        {
            return new Hero()
            {
                HeroIdx = reader.ReadInt64(),
                AccountIdx = reader.ReadInt64(),
                HeroID = reader.ReadInt32(),
                Level = reader.ReadInt16(),
                Exp = reader.ReadInt32(),
                Reinforce = reader.ReadByte(),
                IsLock = reader.ReadBoolean(),
                IsStorage = reader.ReadBoolean(),
                RegTime = new DateTime(reader.ReadInt64())
            };
        }
        #endregion

        #region Public Functions
        public static Hero Create(long accountIdx, int heroID, short defaultLevel, byte reinforce, DateTime now)
        {
            return new Hero()
            {
                AccountIdx = accountIdx,
                HeroID = heroID,
                Level = defaultLevel,
                Exp = 0,
                Reinforce = reinforce,
                IsLock = false,
                IsStorage = false,
                RegTime = now
            };
        }
        #endregion

        #region DB 관련 함수
        public void WaitInsert(GameLogCause cause, HeroInventory owner)
        {
            _owner = owner;
            _cause = cause;
        }
        public override Entity GetEntity()
        {
            var result = new HeroEntity(this);

            result.PrimaryKeyCallback += OnSetIndex;

            return result;
        }
        void OnSetIndex(long autoIncrementKey)
        {
            HeroIdx = autoIncrementKey;
            if (_owner != null)
            {
                _owner.Data.Add(HeroIdx, this);
                _owner.WriteGetHeroLog(_cause, this);
            }
        }
        #endregion

        #region RewardResult 인터페이스 구현
        public string ToJson()
        {
            var json = new JsonObject
            {
                ["Idx"] = HeroIdx,
                ["Id"] = HeroID,
                ["Level"] = Level,
                ["Exp"] = Exp,
                ["Reinforce"] = Reinforce,
                ["IsLock"] = IsLock,
                ["RegTime"] = RegTime.Ticks
            };

            return json.ToJsonString();

        }

        internal static Hero Create(long accountIdx, object heroId, object name, object groupId, object rarity, object grade, object weaponType, object defaultSkinId)
        {
            throw new NotImplementedException();
        }
        #endregion
    }
}
