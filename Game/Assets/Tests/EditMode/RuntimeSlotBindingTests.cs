using System;
using System.Collections.Generic;
using Janseon.Foundation.Art;
using Janseon.Foundation.UI;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.UIElements;

namespace Janseon.Foundation.Tests
{
    public sealed class RuntimeSlotBindingTests
    {
        RuntimeSlotCatalog catalog;
        Texture2D texture;

        [SetUp]
        public void SetUp()
        {
            catalog = ScriptableObject.CreateInstance<RuntimeSlotCatalog>();
            texture = new Texture2D(2, 2);
        }

        [TearDown]
        public void TearDown()
        {
            UnityEngine.Object.DestroyImmediate(catalog);
            UnityEngine.Object.DestroyImmediate(texture);
        }

        [Test]
        public void Catalog_OnlyBoundEntriesExposeTypedAssets()
        {
            var entry = new RuntimeSlotEntry
            {
                slot = "title-art", bound = false,
                files = new[] { new RuntimeSlotFile { key = "backdrop", asset = texture } },
            };
            catalog.SetEntries(new[] { entry });
            Assert.That(catalog.Get<Texture2D>(entry.slot, "backdrop"), Is.Null);
            Assert.That(catalog.IsBound(entry.slot), Is.False);
            entry.bound = true;
            Assert.That(catalog.IsBound(entry.slot), Is.True);
            Assert.That(catalog.Get<Texture2D>(entry.slot, "backdrop"), Is.SameAs(texture));
            Assert.That(catalog.Get<Sprite>(entry.slot, "backdrop"), Is.Null);
            Assert.That(catalog.Get<Texture2D>(entry.slot, "missing"), Is.Null);
        }

        [Test]
        public void EmptyCatalog_TitleHasBlockedStatusAndNoTexture()
        {
            var root = new VisualElement();
            var view = new RuntimeSlotView(catalog);
            view.BindTitle(root);
            view.BindTitle(root);
            Assert.That(root.Query("main-title-slot-status").ToList().Count, Is.EqualTo(1));
            Assert.That(root.Q("main-title-slot-status").ClassListContains("jk-slot-blocked"), Is.True);
            Assert.That(root.Q<Image>("main-title-backdrop").image, Is.Null);
        }

        [Test]
        public void BoundTitle_RendersCatalogTextureAndRemovesBlockedState()
        {
            catalog.SetEntries(new[] { new RuntimeSlotEntry
            {
                slot = "title-art", bound = true,
                files = new[] { new RuntimeSlotFile { key = "backdrop", asset = texture } },
            } });
            var root = new VisualElement();
            new RuntimeSlotView(catalog).BindTitle(root);
            Assert.That(root.Q<Image>("main-title-backdrop"), Is.Not.Null);
            Assert.That(root.Q<Image>("main-title-backdrop").image, Is.SameAs(texture));
            Assert.That(root.Q("main-title-slot-status").ClassListContains("jk-slot-blocked"), Is.False);
        }

        [Test]
        public void EmptyCatalog_GameplayExposesAllFiveBlockedSlots()
        {
            var root = new VisualElement();
            root.Add(new VisualElement { name = "battle-grid" });
            var view = new RuntimeSlotView(catalog);
            view.BindGameplay(root);
            view.BindGameplay(root);
            foreach (string slot in new[] { "ui-icon-set", "history-texture", "character-explorer", "character-medic", "character-patrol" })
            {
                Assert.That(root.Query("slot-status-" + slot).ToList().Count, Is.EqualTo(1), slot);
                Assert.That(root.Q("slot-status-" + slot).ClassListContains("jk-slot-blocked"), Is.True, slot);
            }
            foreach (string icon in new[] { "talk", "detour", "battle", "heal", "party", "station", "crate", "alert" })
                Assert.That(root.Q<Image>("slot-icon-" + icon), Is.Not.Null, icon);
        }

        [Test]
        public void CharacterCatalog_ResolvesEveryFacingActionAndFrame()
        {
            var sprite = Sprite.Create(texture, new Rect(0, 0, 2, 2), Vector2.zero);
            var clip = new AnimationClip();
            try
            {
                var files = new List<RuntimeSlotFile> { new() { key = "atlas", asset = texture } };
                string[] actions = { "idle", "walk", "attack", "hit", "down" };
                int[] frames = { 4, 6, 6, 3, 4 };
                foreach (string facing in new[] { "N", "E", "S", "W" })
                for (int a = 0; a < actions.Length; a++)
                {
                    string prefix = facing + "/" + actions[a] + "/";
                    files.Add(new RuntimeSlotFile { key = prefix + "clip", asset = clip });
                    for (int i = 0; i < frames[a]; i++) files.Add(new RuntimeSlotFile { key = prefix + i, asset = sprite });
                }
                foreach (string slot in new[] { "character-explorer", "character-medic", "character-patrol" })
                {
                    catalog.SetEntries(new[] { new RuntimeSlotEntry { slot = slot, bound = true, files = files.ToArray() } });
                    foreach (RuntimeSlotFile file in files)
                        Assert.That(catalog.Get<UnityEngine.Object>(slot, file.key), Is.SameAs(file.asset), slot + "/" + file.key);
                }
            }
            finally
            {
                UnityEngine.Object.DestroyImmediate(sprite);
                UnityEngine.Object.DestroyImmediate(clip);
            }
        }
    }
}
