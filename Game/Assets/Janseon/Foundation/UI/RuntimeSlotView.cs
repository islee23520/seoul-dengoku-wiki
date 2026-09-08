using System;
using Janseon.Foundation.Art;
using Janseon.Core;
using Janseon.Core.Battle.Sim;
using UnityEngine;
using UnityEngine.UIElements;

namespace Janseon.Foundation.UI
{
    public sealed class RuntimeSlotView
    {
        readonly IRuntimeSlotCatalog catalog;

        VisualElement gameplayRoot;
        BattleSimState previousBattle;

        public RuntimeSlotView(IRuntimeSlotCatalog catalog)
            => this.catalog = catalog ?? throw new ArgumentNullException(nameof(catalog));

        public void BindTitle(VisualElement root)
        {
            var image = Ensure<Image>(root, "main-title-backdrop", "jk-slot-backdrop");
            image.image = catalog.Get<Texture2D>("title-art", "backdrop");
            image.scaleMode = ScaleMode.ScaleAndCrop;
            image.SendToBack();
            Status(root, "main-title-slot-status", "title-art", "타이틀 아트");
        }

        public void BindGameplay(VisualElement root)
        {
            gameplayRoot = root;
            VisualElement footer = Ensure<VisualElement>(root, "gameplay-slot-status", "jk-slot-footer");
            Status(footer, "slot-status-ui-icon-set", "ui-icon-set", "아이콘");
            Status(footer, "slot-status-history-texture", "history-texture", "바닥·벽·승강장");
            Status(footer, "slot-status-character-explorer", "character-explorer", "탐험가");
            Status(footer, "slot-status-character-medic", "character-medic", "의무병");
            Status(footer, "slot-status-character-patrol", "character-patrol", "순찰대");
            var icons = Ensure<VisualElement>(footer, "slot-icons", "jk-slot-icons");
            foreach (string key in new[] { "talk", "detour", "battle", "heal", "party", "station", "crate", "alert" })
            {
                var icon = Ensure<Image>(icons, "slot-icon-" + key, "jk-slot-icon");
                icon.sprite = catalog.Get<Sprite>("ui-icon-set", "icon-" + key);
                icon.tooltip = key;
                icon.EnableInClassList("jk-slot-blocked", icon.sprite == null);
            }
            var atlas = Ensure<Image>(icons, "slot-icon-atlas", "jk-slot-icon");
            atlas.image = catalog.Get<Texture2D>("ui-icon-set", "atlas");
            atlas.tooltip = "아이콘 아틀라스";
            atlas.EnableInClassList("jk-slot-blocked", atlas.image == null);
            var medic = Ensure<Image>(icons, "slot-medic", "jk-slot-icon");
            medic.sprite = catalog.Get<Sprite>("character-medic", "S/idle/0");
            medic.tooltip = "의무병 · 대기";
        }

        public void ApplyBattle(BattleSimState battle)
        {
            if (gameplayRoot == null) return;
            for (int y = 0; y < 5; y++)
            for (int x = 0; x < 5; x++)
            {
                VisualElement cell = gameplayRoot.Q(UiElementNames.BattleCell(x, y));
                if (cell == null) continue;
                string tile = y == 0 ? "wall" : y == 4 ? "platform" : "floor";
                cell.style.backgroundImage = new StyleBackground(catalog.Get<Texture2D>("history-texture", tile));
            }
            if (battle != null)
            foreach (UnitState unit in battle.Units)
            {
                string slot = unit.Side == 0 ? "character-explorer" : "character-patrol";
                VisualElement cell = gameplayRoot.Q(UiElementNames.BattleCell(unit.Cell.X, unit.Cell.Y));
                if (cell == null) continue;
                UnitState previous = previousBattle == null || previousBattle.Units == null
                    ? null
                    : System.Array.Find(previousBattle.Units, u => u != null && u.Id.Equals(unit.Id));
                string facing = unit.Side == 0 ? "E" : "W";
                string action = unit.State == "Down" ? "down" : "idle";
                if (unit.State != "Down" && previous != null)
                {
                    int dx = unit.Cell.X - previous.Cell.X;
                    int dy = unit.Cell.Y - previous.Cell.Y;
                    if (dx != 0 || dy != 0)
                    {
                        facing = dx > 0 ? "E" : dx < 0 ? "W" : dy > 0 ? "N" : "S";
                        action = "walk";
                    }
                    else if (unit.Hp < previous.Hp) action = "hit";
                    else if (unit.Hp < previous.Hp) action = "hit";
                }
                var image = Ensure<Image>(cell, "unit-" + unit.Id.ToString(), "jk-slot-unit");
                string prefix = facing + "/" + action + "/";
                image.sprite = catalog.Get<Sprite>(slot, prefix + "0");
                image.tooltip = slot + "/" + prefix;
                if (image.sprite == null)
                {
                    var label = Ensure<Label>(cell, "unit-blocked-" + unit.Id.ToString(), "jk-slot-unit-label");
                    label.text = unit.Side == 0 ? "탐험가\n아트 차단" : "순찰대\n아트 차단";
                }
                else if (!gameplayRoot.ClassListContains("jk-motion-off"))
                {
                    AnimationClip clip = catalog.Get<AnimationClip>(slot, prefix + "clip");
                    if (clip != null)
                    {
                        int count = action == "idle" || action == "down" ? 4 : action == "hit" ? 3 : 6;
                        double started = Time.realtimeSinceStartupAsDouble;
                        image.schedule.Execute(() =>
                        {
                            int frame = (int)((Time.realtimeSinceStartupAsDouble - started) * clip.frameRate);
                            frame = action == "idle" || action == "walk" ? frame % count : Math.Min(frame, count - 1);
                            image.sprite = catalog.Get<Sprite>(slot, prefix + frame);
                        }).Every(16);
                    }
                }
            }
            previousBattle = battle?.Clone();
        }

        void Status(VisualElement parent, string name, string slot, string title)
        {
            var label = Ensure<Label>(parent, name, "jk-slot-status");
            bool blocked = !catalog.IsBound(slot);
            label.text = title + (blocked ? " · 아트 차단" : " · 승인됨");
            label.EnableInClassList("jk-slot-blocked", blocked);
        }

        static T Ensure<T>(VisualElement parent, string name, string className) where T : VisualElement, new()
        {
            T element = parent.Q<T>(name);
            if (element == null)
            {
                element = new T { name = name, pickingMode = PickingMode.Ignore };
                element.AddToClassList(className);
                parent.Add(element);
            }
            return element;
        }
    }
}
