using System;
using System.Collections.Generic;
using System.Linq;
using Janseon.Core;
using Janseon.Core.Battle.Contracts;
using Janseon.Core.Data;
using Janseon.Data.Authoring;
namespace Janseon.Data.Validation {
 public static class GameDataCatalogIndexBuilder {
  public static GameDataCatalogIndex Build(GameDataCatalogAsset x) { var i=Project(x); GameDataCatalogValidator.Validate(i); return i; }
  internal static GameDataCatalogIndex Project(GameDataCatalogAsset x) { if(x==null) Fail(CatalogValidationReason.MissingReference,"Catalog is null."); var v=new ContentVersionStamp(x.contentSchema,x.contentVersion,x.fingerprintVersion); if(!v.Equals(new ContentVersionStamp())) Fail(CatalogValidationReason.UnsupportedContentSchema,"Unsupported content version."); var c=new List<CardCatalogItem>();var u=new List<UnitRoleCatalogItem>();var f=new List<FormationCatalogItem>();var s=new List<StationCatalogItem>();
   if(x.cards==null||x.unitRoles==null||x.formations==null||x.stations==null) Fail(CatalogValidationReason.MissingReference,"Catalog array is null."); foreach(var a in x.cards){if(a==null)Fail(CatalogValidationReason.MissingReference,"Null card.");c.Add(new CardCatalogItem(a.stableId,a.coreCardId,a.kind,a.rechargeTicks,a.effect,a.effectKey));} foreach(var a in x.unitRoles){if(a==null)Fail(CatalogValidationReason.MissingReference,"Null role.");u.Add(new UnitRoleCatalogItem(a.stableId,a.coreRole,a.maxHp,a.power,a.rangeMin,a.rangeMax,a.moveTicksPerCell,a.attackCooldownTicks));} foreach(var a in x.formations){if(a==null)Fail(CatalogValidationReason.MissingReference,"Null formation.");var z=(a.slots??Array.Empty<FormationSlotDefinition>()).Select(q=>q==null?null:new FormationSlotTemplate(q.roleStableId,q.row,q.column,q.facing)).ToList();if(z.Any(q=>q==null))Fail(CatalogValidationReason.MissingReference,"Null formation slot.");f.Add(new FormationCatalogItem(a.stableId,a.rowCount,a.columnCount,z));} foreach(var a in x.stations){if(a==null)Fail(CatalogValidationReason.MissingReference,"Null station.");s.Add(new StationCatalogItem(a.stableId,new StationId(a.coreStationId),a.neighbors??Array.Empty<string>()));} return GameDataCatalogIndex.FromProjections(c.OrderBy(q=>q.StableId,StringComparer.Ordinal).ToList(),u.OrderBy(q=>q.StableId,StringComparer.Ordinal).ToList(),f.OrderBy(q=>q.StableId,StringComparer.Ordinal).ToList(),s.OrderBy(q=>q.StableId,StringComparer.Ordinal).ToList(),v); }
  internal static void Fail(CatalogValidationReason r,string m){throw new CatalogValidationException(r,m);}
 }
}
