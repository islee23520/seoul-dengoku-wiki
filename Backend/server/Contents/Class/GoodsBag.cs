using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using SeoulKenshi.Common;
using SeoulKenshi.Common.ErrorCode;
using SeoulKenshi.Common.Exception;
using SeoulKenshi.Common.Log;
using SeoulKenshi.DB.GameDB.Entities;
using Y2K.Core.DataBase;
using Y2K.Core.Util;

namespace SeoulKenshi.Contents.Class
{
    public class GoodsBag : ICacheObject, IAfterLoadInitializer<IAccountLog>
    {
        #region Properties
        public Gold Gold { get; set; }
        public Cash Cash { get; set; }
        #endregion

        #region 생성자 및 Cache 관련 함수들
        public GoodsBag() { }

        public byte[] SerializeToBinary()
        {
            using (var ms = new MemoryStream())
            using (var writer = new BinaryWriter(ms))
            {
                Gold.WriteToBinary(writer);
                Cash.WriteToBinary(writer);
                writer.Flush();
                return ms.ToArray();
            }
        }
        public static GoodsBag DeserializeFromBinary(byte[] data)
        {
            using (var ms = new MemoryStream(data))
            using (var reader = new BinaryReader(ms))
            {
                return new GoodsBag()
                {
                    Gold = Gold.ReadFromBinary(reader),
                    Cash = Cash.ReadFromBinary(reader)
                };
            }
        }

        public CacheMetaData GetCacheMetaData(long key)
        {
            var result = new CacheMetaData()
            {
                Key = CacheKeyMaker.MakeCacheKey<GoodsBag>(key),
                Value = typeof(byte[])
            };

            return result;
        }
        public void FillCacheData(long key, Dictionary<string, object> cacheData)
        {
            var data = SerializeToBinary();
            var cacheKey = CacheKeyMaker.MakeCacheKey<GoodsBag>(key);
            cacheData.Add(cacheKey, data);
        }
        #endregion

        #region 생성 및 로더
        public static GoodsBag Create(IY2KDbConnector db, long accountIdx)
        {
            var defaultValue = 0;

            var gold = Gold.Create(accountIdx, defaultValue);
            db.Attach(gold.GetEntity(DbCommandType.Insert));

            var cash = Cash.Create(accountIdx, defaultValue);
            db.Attach(cash.GetEntity(DbCommandType.Insert));

            return new GoodsBag()
            {
                Gold = gold,
                Cash = cash,
            };
        }
        public static GoodsBag LoadFromDB(IDbConnection conn, long AccountIdx)
        {
            // 골드를 기준 entity로 해서 없으면 null값을 리턴하자.
            var entiy = GoldEntity.LoadFromDB(conn, AccountIdx);
            if (entiy == null)
                return null;


            var gold = new Gold(entiy);
            var cash = new Cash(CashEntity.LoadFromDB(conn, AccountIdx));

            return new GoodsBag()
            {
                Gold = gold,
                Cash = cash,
            };
        }
        #endregion

        public (Entity entity, int gainValue, long nowValue) AddGoods(GameLogCause cause, GoodsType type, int value, int bonus)
        {
            Entity entity;
            long nowValue;
            int gainValue = value + bonus;

            switch (type)
            {
                case GoodsType.Gold:
                    nowValue = Gold.Increase(cause, gainValue);
                    entity = Gold.GetEntity();
                    break;
                case GoodsType.FreeCash:
                case GoodsType.PaidCash:
                    nowValue = Cash.Increase(cause, type, gainValue);
                    entity = Cash.GetEntity();
                    break;
                default: throw new ErrorCodeException(SystemErrorCode.SYSTEM_INVALID_TYPE, $"invalid goodsType...{type}");
            }

            entity.SetDbCommandType(DbCommandType.Update);

            return (entity, gainValue, nowValue);
        }
        public (Entity entity, long nowValue) UseGoods(GameLogCause cause, GoodsType type, int value)
        {
            Entity entity;
            long nowValue;

            switch (type)
            {
                case GoodsType.Gold:
                    nowValue = Gold.Use(cause, value);
                    entity = Gold.GetEntity();
                    break;
                case GoodsType.FreeCash:
                case GoodsType.PaidCash:
                    nowValue = Cash.Decrease(cause, type, value);
                    entity = Cash.GetEntity();
                    break;
                default: throw new ErrorCodeException(SystemErrorCode.SYSTEM_INVALID_TYPE, $"invalid goodsType...{type}");
            }

            entity.SetDbCommandType(DbCommandType.Update);

            return (entity, nowValue);
        }

        #region IAfterLoadInitializer
        public void Initialize(IAccountLog owner)
        {
            Gold.AccountLog = owner;
            Cash.AccountLog = owner;
        }
        #endregion
    }
}
