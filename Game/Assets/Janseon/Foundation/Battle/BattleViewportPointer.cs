using System;
using UnityEngine.EventSystems;

namespace Janseon.Foundation.Battle
{
    public sealed class BattleViewportPointer : EventTrigger, IPointerMoveHandler
    {
        public event Action<PointerEventData> Moved;
        public void OnPointerMove(PointerEventData eventData) => Moved?.Invoke(eventData);
    }
}
