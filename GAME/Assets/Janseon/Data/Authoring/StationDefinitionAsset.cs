using UnityEngine;
namespace Janseon.Data.Authoring {
 [System.Serializable] public sealed class StationConnectionDefinition { public string fromPlaceId; public string toPlaceId; public Janseon.Core.RouteConnectionKind kind; public Janseon.Core.RouteGrade grade; public Janseon.Core.PassageState state; public string cause; public string recovery; }
 [CreateAssetMenu(menuName="Janseon/Data/Station Definition", fileName="StationDefinition")]
 public sealed class StationDefinitionAsset : ScriptableObject {
  public string stableId; public string coreStationId; public string[] neighbors; public StationConnectionDefinition[] connections;
  void OnValidate() { if (string.IsNullOrEmpty(stableId)) Debug.LogError("Station stableId is required.", this); if (string.IsNullOrEmpty(coreStationId)) Debug.LogError("Station coreStationId is required.", this); }
 }
}
