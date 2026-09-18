using UnityEngine;
using Janseon.Core.Battle.Contracts;
namespace Janseon.Data.Authoring {
 [CreateAssetMenu(menuName="Janseon/Data/Card Definition", fileName="CardDefinition")]
 public sealed class CardDefinitionAsset : ScriptableObject {
  public string stableId; public string coreCardId; public CardKind kind; public int rechargeTicks; public int effect; public string effectKey;
  void OnValidate() { if (string.IsNullOrEmpty(stableId)) Debug.LogError("Card stableId is required.", this); if (string.IsNullOrEmpty(coreCardId)) Debug.LogError("Card coreCardId is required.", this); if (rechargeTicks < 0) Debug.LogError("Card numeric value is invalid.", this); }
 }
}
