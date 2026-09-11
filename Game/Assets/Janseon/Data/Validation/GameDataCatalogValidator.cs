using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using Janseon.Core;
using Janseon.Core.Battle.Contracts;
using Janseon.Core.Battle.Sim;

namespace Janseon.Data.Validation
{
    public static class GameDataCatalogValidator
    {
        static readonly Regex StableId = new Regex("^(card|unit|formation|station)\\.[a-z0-9]+(?:[.-][a-z0-9]+)*$", RegexOptions.CultureInvariant);
        static void Fail(bool condition, CatalogValidationReason reason, string detail) { if (!condition) GameDataCatalogIndexBuilder.Fail(reason, detail); }
        public static void Validate(GameDataCatalogIndex index)
        {
            if (index == null) GameDataCatalogIndexBuilder.Fail(CatalogValidationReason.MissingReference, "Index is null.");
            ValidateCards(index); ValidateRoles(index); ValidateFormations(index); ValidateStations(index);
            Fail(index.Version.ContentSchema == ContentVersionSchema && index.Version.ContentVersion == ContentVersion && index.Version.FingerprintVersion == FingerprintVersion, CatalogValidationReason.UnsupportedContentSchema, "Unsupported content version.");
            Fail(index.Cards.Count == 6 && index.UnitRoles.Count == 3 && index.Formations.Count == 1 && index.Stations.Count == 3, CatalogValidationReason.RuleDrift, "Area 1 counts.");
        }
        const int ContentVersionSchema = 1;
        const string ContentVersion = "area1-static-content-v1";
        const string FingerprintVersion = "content-fingerprint-v1";
        static void ValidateIds<T>(IEnumerable<T> values, Func<T,string> id)
        {
            var seen = new HashSet<string>(StringComparer.Ordinal);
            foreach (var value in values) { var key = id(value); Fail(!string.IsNullOrEmpty(key) && StableId.IsMatch(key), CatalogValidationReason.MalformedStableId, key); Fail(seen.Add(key), CatalogValidationReason.DuplicateStableId, key); }
        }
        static void ValidateCards(GameDataCatalogIndex index)
        {
            ValidateIds(index.Cards, x => x.StableId);
            var coreIds = new HashSet<string>(StringComparer.Ordinal);
            foreach (var card in index.Cards)
            {
                Fail(coreIds.Add(card.CoreCardId), CatalogValidationReason.DuplicateCoreId, card.CoreCardId);
                Fail(card.RechargeTicks >= BattleRules.CardRechargeMinTicks && card.RechargeTicks <= BattleRules.CardRechargeMaxTicks, CatalogValidationReason.RuleDrift, card.StableId);
            }
            var expected = CardCatalog.All();
            Fail(index.Cards.Count == expected.Count, CatalogValidationReason.RuleDrift, "Card count");
            foreach (var source in expected)
            {
                var actual = index.Cards.FirstOrDefault(x => x.CoreCardId == source.Id); Fail(actual != null, CatalogValidationReason.RuleDrift, source.Id);
                if (actual != null) Fail(actual.Kind == source.Kind && actual.RechargeTicks == source.RechargeTicks && actual.Effect == source.Effect && actual.EffectKey == source.EffectKey, CatalogValidationReason.RuleDrift, source.Id);
            }
        }
        static void ValidateRoles(GameDataCatalogIndex index)
        {
            ValidateIds(index.UnitRoles, x => x.StableId);
            var expectedRoles = BattleRoleRules.Roles; var expectedHp = BattleRoleRules.MaxHp; var expectedPower = BattleRoleRules.Power; var expectedRange = BattleRoleRules.RangeMax;
            Fail(index.UnitRoles.Count == 3, CatalogValidationReason.RuleDrift, "Role count");
            for (var i=0;i<expectedRoles.Length;i++) { var role=index.UnitRoles.FirstOrDefault(x=>x.CoreRole==expectedRoles[i]); Fail(role!=null, CatalogValidationReason.RuleDrift, expectedRoles[i]); if (role != null) Fail(role.MaxHp==expectedHp[i]&&role.Power==expectedPower[i]&&role.RangeMin==1&&role.RangeMax==expectedRange[i]&&role.MoveTicksPerCell==BattleRules.MoveTicksPerCell&&role.AttackCooldownTicks==BattleRules.AttackCooldownTicks, CatalogValidationReason.RuleDrift, expectedRoles[i]); }
        }
        static void ValidateFormations(GameDataCatalogIndex index)
        {
            ValidateIds(index.Formations, x => x.StableId);
            foreach (var formation in index.Formations) { Fail(formation.StableId == "formation.default-3x3" && formation.RowCount==BattleRules.FormationRows&&formation.ColumnCount==BattleRules.FormationColumns && formation.Slots.Count == 6, CatalogValidationReason.InvalidFormation, formation.StableId); var cells=new HashSet<string>(StringComparer.Ordinal); for (var n=0;n<formation.Slots.Count;n++){var slot=formation.Slots[n];Fail(slot!=null,CatalogValidationReason.MissingReference,formation.StableId);if(slot==null)continue;Fail(slot.Row>=0&&slot.Row<BattleRules.FormationRows&&slot.Column>=-1&&slot.Column<=1,CatalogValidationReason.InvalidFormation,formation.StableId);Fail(cells.Add(slot.Row+":"+slot.Column),CatalogValidationReason.InvalidFormation,formation.StableId);Fail(index.UnitRoles.Any(x=>x.StableId==slot.RoleStableId),CatalogValidationReason.MissingReference,slot.RoleStableId);Fail(slot.Row==n/2&&slot.Column==n%2-1&&slot.RoleStableId=="unit.role."+new[]{"guard","assault","archer"}[n/2]&&slot.Facing==CardinalDirection.East,CatalogValidationReason.InvalidFormation,formation.StableId);} }
        }
        static void ValidateStations(GameDataCatalogIndex index)
        {
            ValidateIds(index.Stations, x => x.StableId); var stableIds=new HashSet<string>(index.Stations.Select(x=>x.StableId),StringComparer.Ordinal);
            foreach(var station in index.Stations){var neighbors=new HashSet<string>(StringComparer.Ordinal);foreach(var neighbor in station.NeighborStableIds){Fail(neighbor!=station.StableId,CatalogValidationReason.InvalidStationGraph,station.StableId);Fail(neighbors.Add(neighbor),CatalogValidationReason.InvalidStationGraph,station.StableId);Fail(stableIds.Contains(neighbor),CatalogValidationReason.MissingReference,neighbor);}}
            foreach(var station in index.Stations) foreach(var neighborId in station.NeighborStableIds){var neighbor=index.Stations.First(x=>x.StableId==neighborId);Fail(neighbor.NeighborStableIds.Contains(station.StableId),CatalogValidationReason.InvalidStationGraph,station.StableId);}
            foreach (var station in index.Stations) { Fail(station.CoreStationId == StationId.Yeongdeungpo || station.CoreStationId == StationId.Sindorim || station.CoreStationId == StationId.Guro, CatalogValidationReason.RuleDrift, station.StableId); var expected = station.StableId == "station.yeongdeungpo" ? StationId.Yeongdeungpo : station.StableId == "station.sindorim" ? StationId.Sindorim : station.StableId == "station.guro" ? StationId.Guro : new StationId(string.Empty); Fail(station.CoreStationId == expected, CatalogValidationReason.RuleDrift, station.StableId); }
        }
    }
}
