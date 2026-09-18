using UnityEngine;
namespace Janseon.Data.Authoring {
 [CreateAssetMenu(menuName="Janseon/Data/Station Definition", fileName="StationDefinition")]
 public sealed class StationDefinitionAsset : ScriptableObject {
  public string stableId; public string coreStationId; public string[] neighbors;
  void OnValidate() { if (string.IsNullOrEmpty(stableId)) Debug.LogError("Station stableId is required.", this); if (string.IsNullOrEmpty(coreStationId)) Debug.LogError("Station coreStationId is required.", this); }
 }
}
