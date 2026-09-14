using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text.Json;
using SeoulKenshi.Common;
using SeoulKenshi.Common.ErrorCode;
using SeoulKenshi.Common.Exception;
using SeoulKenshi.Spec.Entities;
using Y2K.Core.Util;

namespace SeoulKenshi.Spec.Containers
{
    public class GlobalConfigSpecContainer
    {
        #region Properties
        public string WorldResetTime { get; private set; } = "00:00:00";
        public WeeklyResetTime WeeklyWorldResetDateTime { get; private set; }
        /// <summary>
        /// 에너지 스펙
        /// </summary>
        public Dictionary<EnergyType, EnergySpec> EnergySpecData { get; private set; }
        /// <summary>
        /// 인벤토리 기본 설정 스펙
        /// </summary>
        public Dictionary<InventoryType, InventoryDefaultValueSpec> InventoryDefaultSpecData { get; private set; }

        #endregion

        #region 생성자
        public GlobalConfigSpecContainer(IDbConnection conn)
        {
            var data = DefaultValueSpecEntity.LoadFromDB(conn);

            SetWorldResetTime(data);
            SetEnergyDefaultValue(data);
            SetInventorySlotDefaultValue(data);

            WeeklyWorldResetDateTime = new WeeklyResetTime() { DayOfWeek = DayOfWeek.Monday, ResetTime = TimeSpan.Parse(WorldResetTime) };
        }
        #endregion

        #region Public Functions
        /// <summary>
        /// 해당 타입에 맞는 에너지 스펙 데이터를 반환합니다.
        /// </summary>
        /// <param name="type"></param>
        /// <returns></returns>
        public EnergySpec FindEnergySpec(EnergyType type)
        {
            if (EnergySpecData.TryGetValue(type, out var result) == false)
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_NOT_FOUND_SPEC_DATA, $"not found EnergySpec data.. type: {type}");

            return result;
        }

        public InventoryDefaultValueSpec FindInventorySlotSpec(InventoryType type)
        {
            if(InventoryDefaultSpecData.TryGetValue(type,out var result) == false)
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_NOT_FOUND_SPEC_DATA, $"not found inventory slot default spec data.. type: {type}");

            return result;
        }
        #endregion

        #region Private Functions
        void SetWorldResetTime(Dictionary<string, string> data)
        {
            if (data.TryGetValue("WorldResetTime", out var strValue) == false)
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_NOT_FOUND_SPEC_DATA, $"not found world reset time...");

            WorldResetTime = strValue;
        }

        void SetEnergyDefaultValue(Dictionary<string, string> values)
        {
            if (values.TryGetValue("ENERGY", out var data) == false)
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_NOT_FOUND_SPEC_DATA, "not found energy default data in tbl_default_value_spec");

            EnergySpecData = JsonSerializer.Deserialize<List<EnergySpec>>(data).ToDictionary(r => r.Type, r => r);
        }

        void SetInventorySlotDefaultValue(Dictionary<string, string> values)
        {
            if (values.TryGetValue("INVENTOY", out var data) == false)
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_NOT_FOUND_SPEC_DATA, "not found inventory default data in tbl_default_value_spec");

            InventoryDefaultSpecData = JsonSerializer.Deserialize<List<InventoryDefaultValueSpec>>(data).ToDictionary(r => r.Type, r => r);
        }
        #endregion

    }
}
