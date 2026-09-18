using System.Collections.Generic;
using System.Collections.ObjectModel;
using Janseon.Core.Data;
namespace Janseon.Data.Validation {
 public sealed class GameDataCatalogIndex {
  public IReadOnlyList<CardCatalogItem> Cards { get; } public IReadOnlyList<UnitRoleCatalogItem> UnitRoles { get; } public IReadOnlyList<FormationCatalogItem> Formations { get; } public IReadOnlyList<StationCatalogItem> Stations { get; } public ContentVersionStamp Version { get; }
  internal GameDataCatalogIndex(List<CardCatalogItem> c,List<UnitRoleCatalogItem> u,List<FormationCatalogItem> f,List<StationCatalogItem> s,ContentVersionStamp v) { Cards=new ReadOnlyCollection<CardCatalogItem>(c);UnitRoles=new ReadOnlyCollection<UnitRoleCatalogItem>(u);Formations=new ReadOnlyCollection<FormationCatalogItem>(f);Stations=new ReadOnlyCollection<StationCatalogItem>(s);Version=v; }
  internal static GameDataCatalogIndex FromProjections(List<CardCatalogItem> c,List<UnitRoleCatalogItem> u,List<FormationCatalogItem> f,List<StationCatalogItem> s,ContentVersionStamp v) { return new GameDataCatalogIndex(c,u,f,s,v); }
 }
}
