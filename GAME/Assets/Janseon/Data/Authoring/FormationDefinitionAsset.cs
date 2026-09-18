using System;
using UnityEngine;
using Janseon.Core;
namespace Janseon.Data.Authoring {
 [Serializable] public sealed class FormationSlotDefinition { public string roleStableId; public int row; public int column; public CardinalDirection facing; }
 [CreateAssetMenu(menuName="Janseon/Data/Formation Definition", fileName="FormationDefinition")]
 public sealed class FormationDefinitionAsset : ScriptableObject {
  public string stableId; public int rowCount; public int columnCount; public FormationSlotDefinition[] slots;
  void OnValidate() { if (string.IsNullOrEmpty(stableId)) Debug.LogError("Formation stableId is required.", this); if (rowCount < 0 || columnCount < 0) Debug.LogError("Formation dimensions are invalid.", this); if (slots != null) for (var i=0;i<slots.Length;i++) if (slots[i]==null) Debug.LogError("Formation slot is null.", this); }
 }
}
