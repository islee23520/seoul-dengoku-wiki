using UnityEngine;

namespace Janseon.Foundation.Battle
{
    public sealed class BattleSessionDriverHost : MonoBehaviour
    {
        public BattleSessionDriver Driver { get; set; }

        void FixedUpdate()
        {
            Driver?.FixedUpdate(Time.fixedDeltaTime);
        }
    }
}
