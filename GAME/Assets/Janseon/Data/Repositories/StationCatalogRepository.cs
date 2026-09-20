using System;
using System.Collections.Generic;
using Janseon.Core;
using Janseon.Core.Data;
using Janseon.Data.Validation;

namespace Janseon.Data.Repositories
{
    public sealed class StationCatalogRepository : IReadOnlyStationCatalog
    {
        private readonly Dictionary<string, StationCatalogItem> byId = new Dictionary<string, StationCatalogItem>(StringComparer.Ordinal);
        private readonly Dictionary<string, StationCatalogItem> byCore = new Dictionary<string, StationCatalogItem>(StringComparer.Ordinal);

        public IReadOnlyList<StationCatalogItem> All { get; }

        public StationCatalogRepository(GameDataCatalogIndex index)
        {
            All = index.Stations;
            foreach (var item in All)
            {
                byId.Add(item.StableId, item);
                byCore.Add(item.CoreStationId.Value, item);
            }
        }

        public bool TryGet(string stableId, out StationCatalogItem item)
        {
            return byId.TryGetValue(stableId ?? string.Empty, out item);
        }

        public bool TryGetByCoreId(StationId coreId, out StationCatalogItem item)
        {
            return byCore.TryGetValue(coreId.Value ?? string.Empty, out item);
        }
    }
}
