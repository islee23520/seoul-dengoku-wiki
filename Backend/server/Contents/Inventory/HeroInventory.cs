using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using SeoulKenshi.Common;
using SeoulKenshi.Common.ErrorCode;
using SeoulKenshi.Common.Exception;
using SeoulKenshi.Common.Log;
using SeoulKenshi.Spec.Entities;
using Y2K.Core.Util;

using SeoulKenshi.Contents.Class;

namespace SeoulKenshi.Contents.Inventory
{
    public class HeroInventory : ICacheObject, IInventory, IAfterLoadInitializer<Account>
    {
        #region Properties
        public Dictionary<long, Hero> Data { get; private set; } = new Dictionary<long, Hero>();
        public IAccountLog AccountLog { get; set; }
        public short MaxSlotCount { get; set; }
        public int Count => Data.Count;
        #endregion

        #region 생성자 및 Serializer
        public HeroInventory() { }

        public byte[] SerializeToBinary()
        {
            using (var ms = new MemoryStream())
            using (var writer = new BinaryWriter(ms))
            {
                writer.Write(Data.Count);
                foreach (var hero in Data.Values)
                {
                    hero.WriteToBinary(writer);
                }
                writer.Flush();
                return ms.ToArray();
            }
        }
        public static HeroInventory DeserializeFromBinary(byte[] data)
        {
            var result = new HeroInventory();

            using (var ms = new MemoryStream(data))
            using (var reader = new BinaryReader(ms))
            {
                var count = reader.ReadInt32();
                for (var i = 0; i < count; i++)
                {
                    var hero = Hero.ReadFromBinary(reader);
                    result.Data.Add(hero.HeroIdx, hero);
                }
            }

            return result;
        }
        #endregion

        #region Cache와 관련된 함수들
        public void FillCacheData(long accountIdx, Dictionary<string, object> cacheData)
        {
            var data = SerializeToBinary();
            var key = CacheKeyMaker.MakeCacheKey<HeroInventory>(accountIdx);
            cacheData.Add(key, data);
        }
        public CacheMetaData GetCacheMetaData(long key)
        {
            var result = new CacheMetaData()
            {
                Key = CacheKeyMaker.MakeCacheKey<HeroInventory>(key),
                Value = typeof(byte[])
            };

            return result;
        }
        #endregion

        #region Public Functions
        public bool IsEnoughSlot(short addableCount)
        {
            var emptySlots = MaxSlotCount - Data.Count;

            if (emptySlots <= 0 || addableCount > emptySlots)
                return false;

            return true;
        }

        public Hero GetHero(long HeroIdx)
        {
            if (Data.TryGetValue(HeroIdx, out var result) == false)
                throw new ErrorCodeException(HeroErrorCode.ERROR_NOT_FOUND_HERO, $"not found Hero.. idx: {HeroIdx}");

            return result;
        }
        public Hero GetHero(int HeroId)
        {
            var result = Data.Values.Where(r => r.HeroID == HeroId).FirstOrDefault();

            if (result == null)
                throw new ErrorCodeException(HeroErrorCode.ERROR_NOT_FOUND_HERO, $"not found Hero.. id: {HeroId}");

            return result;
        }

        public IEnumerable<Hero> GetHeros(int pageNumber, int pageCount)
        {
            if (pageCount == 0)
                pageCount = 1000;

            return Data.Values.Skip((pageNumber - 1) * pageCount).Take(pageCount);
        }
        public IEnumerable<Hero> GetHeros()
        {
            return Data.Values;
        }


        public Hero CreateHero(GameLogCause cause, long accountIdx, HeroSpecEntity spec, DateTime now)
        {
            var result = Hero.Create(accountIdx, spec.HeroID, 1, 0, now);

            result.WaitInsert(cause, this);

            return result;
        }


        public void RemoveHero(GameLogCause cause, Hero Hero, DateTime now)
        {
            Data.Remove(Hero.HeroIdx);

            WriteHeroDeleteLog(cause, Hero, now);
        }
        public void RemoveHeros(GameLogCause cause, IEnumerable<Hero> Heros)
        {
            var now = DateTime.Now;

            foreach (var Hero in Heros)
                RemoveHero(cause, Hero, now);
        }
        #endregion


        #region 로그 관련
        public void WriteGetHeroLog(GameLogCause cause, Hero Hero)
        {
            if (AccountLog == null)
                return;

            //var logger = LogManager.GetLogger(LogName.UserLog);

            //logger.Info(logObject.ToJson());
        }


        void WriteHeroDeleteLog(GameLogCause cause, Hero Hero, DateTime now)
        {
            //var logger = LogManager.GetLogger(LogName.UserLog);
            //logger.Info(logObject.ToJson());
        }
        #endregion

        #region IAfterLoadInitializer
        public void Initialize(Account owner)
        {
            AccountLog = owner;
            MaxSlotCount = owner.HeroInventoryMax;
        }
        #endregion
    }
}
