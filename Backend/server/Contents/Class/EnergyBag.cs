using System;
using System.Collections.Generic;
using System.Data;
using SeoulKenshi.Common;
using SeoulKenshi.Common.ErrorCode;
using SeoulKenshi.Common.Exception;
using SeoulKenshi.Common.Log;
using SeoulKenshi.DB.GameDB;
using SeoulKenshi.Spec;
using Y2K.Core.DataBase;

namespace SeoulKenshi.Contents.Class
{
    public class EnergyBag
    {
        public Dictionary<EnergyType, Energy> Data { get; set; } = new Dictionary<EnergyType, Energy>();

        public static EnergyBag Create(IY2KDbConnector db, long accountIdx, DateTime now)
        {
            var result = new EnergyBag();

            foreach (var spec in SpecConfig.GLOBAL_CONFIG.EnergySpecData.Values)
            {
                var energy = Energy.Create(accountIdx, spec.Type, spec.DefaultAmount, now.AddSeconds(spec.ChargeIntervalPerSec));
                db.Attach(energy.GetEntity(DbCommandType.Insert));

                result.Data.Add(energy.EnergyType, energy);
            }

            return result;
        }
        public static EnergyBag LoadFromDB(IDbConnection conn, long AccountIdx)
        {
            var result = new EnergyBag();

            foreach (var entity in EnergyEntity.LoadFromDB(conn, AccountIdx))
                result.Data.Add(entity.EnergyType, new Energy(entity));

            return result;
        }

        public Energy UseEnergy(GameLogCause cause, EnergyType type, int amount)
        {
            if (Data.TryGetValue(type, out var energy) == false)
                throw new ErrorCodeException(GoodsErrorCode.ERROR_NOT_FOUND_ENERGY, $"not found energy... energy type: {type}");

            energy.Use(cause, amount);

            return energy;
        }
        public List<Entity> CheckEnergyChargeTime(DateTime now)
        {
            var result = new List<Entity>();

            foreach (var energy in Data.Values)
            {
                if (energy.CheckChargeTime(now) == true)
                    result.Add(energy.GetEntity(DbCommandType.Update));
            }

            return result;
        }
        public Energy GetEnergy(EnergyType type)
        {
            var result = Data[type];

            result.CheckChargeTime(DateTime.Now);

            return result;
        }
    }
}
