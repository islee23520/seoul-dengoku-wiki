using UnityEngine;
using VContainer;

namespace Janseon.Foundation.Battle
{
    public sealed class BattleSessionDriverHost : MonoBehaviour
    {
        public BattleSessionDriver Driver { get; set; }

        [Inject]
        public void Bind(BattleSessionDriver driver) { Driver = driver; }

        void FixedUpdate()
        {
            Driver?.FixedUpdate(Time.fixedDeltaTime);
        }
    }
}
