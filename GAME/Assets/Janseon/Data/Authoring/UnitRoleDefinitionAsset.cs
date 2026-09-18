using UnityEngine;
namespace Janseon.Data.Authoring {
 [CreateAssetMenu(menuName="Janseon/Data/Unit Role Definition", fileName="UnitRoleDefinition")]
 public sealed class UnitRoleDefinitionAsset : ScriptableObject {
  public string stableId; public string coreRole; public int maxHp; public int power; public int rangeMin; public int rangeMax; public int moveTicksPerCell; public int attackCooldownTicks;
  void OnValidate() { if (string.IsNullOrEmpty(stableId)) Debug.LogError("Unit role stableId is required.", this); if (string.IsNullOrEmpty(coreRole)) Debug.LogError("Unit role coreRole is required.", this); if (maxHp < 0 || power < 0 || rangeMin < 0 || rangeMax < 0 || moveTicksPerCell < 0 || attackCooldownTicks < 0) Debug.LogError("Unit role numeric value is invalid.", this); }
 }
}
