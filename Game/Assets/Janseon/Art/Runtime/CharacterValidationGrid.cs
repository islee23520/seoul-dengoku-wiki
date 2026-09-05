using UnityEngine;

namespace Janseon.Art
{
    public sealed class CharacterValidationGrid : MonoBehaviour
    {
        [SerializeField] CharacterFourDirPlayer[] players = System.Array.Empty<CharacterFourDirPlayer>();
        [SerializeField] string[] facings = { "N", "E", "S", "W" };
        [SerializeField] string[] actions = { "idle", "walk", "attack", "hit", "down" };

        public CharacterFourDirPlayer[] Players => players;
        public string[] Facings => facings;
        public string[] Actions => actions;

        public int CycleCount => players.Length * facings.Length * actions.Length;
    }
}
