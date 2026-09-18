using UnityEngine;
namespace Janseon.Data.Authoring {
 [CreateAssetMenu(menuName="Janseon/Data/Game Data Catalog", fileName="Area1GameDataCatalog")]
 public sealed class GameDataCatalogAsset : ScriptableObject {
  public int contentSchema = 1; public string contentVersion = "area1-static-content-v1"; public string fingerprintVersion = "content-fingerprint-v1";
  public CardDefinitionAsset[] cards; public UnitRoleDefinitionAsset[] unitRoles; public FormationDefinitionAsset[] formations; public StationDefinitionAsset[] stations;
 }
}
