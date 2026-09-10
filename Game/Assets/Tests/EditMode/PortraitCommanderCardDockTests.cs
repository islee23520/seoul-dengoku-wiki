using Janseon.Foundation.UI;
using NUnit.Framework;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Janseon.Foundation.Tests
{
    /// <summary>
    /// Todo 5: portrait commander-card dock geometry (132×180) vs the 250px debug column.
    /// </summary>
    public sealed class PortraitCommanderCardDockTests
    {
        const float CardWidth = 132f;
        const float CardHeight = 180f;
        const float SizeTolerance = 2f;
        const float PortraitSize = 32f;
        const float CancelSize = 44f;
        const string HudTitle = "잔선: 서울 · 지휘관 카드 전투";

        static readonly string[] CharacterOfferings =
        {
            "guard-shieldwall",
            "encourage-morale",
            "pincer-focus",
            "mobility-regroup",
        };

        [Test]
        public void BuildGameplay_CharacterOfferingCards_Are132By180At720pConstantPixelSize()
        {
            RectTransform root = BuildAt720pConstantPixelSize();
            try
            {
                foreach (string cardId in CharacterOfferings)
                {
                    RectTransform card = FindRect(root, "battle-card-" + cardId);
                    Assert.That(card, Is.Not.Null,
                        "missing commander card " + cardId + " (current builder is a 250px HudButton column, not 132×180 portraits)");
                    Vector2 size = MeasuredSize(card);
                    Assert.That(size.x, Is.EqualTo(CardWidth).Within(SizeTolerance),
                        cardId + " width must be 132px, not the 250px debug column. actual=" + size.x);
                    Assert.That(size.y, Is.EqualTo(CardHeight).Within(SizeTolerance),
                        cardId + " height must be 180px. actual=" + size.y);
                }
            }
            finally
            {
                DestroyBuilt(root);
            }
        }

        [Test]
        public void BuildGameplay_OwnerPortrait_Is32By32()
        {
            RectTransform root = BuildAt720pConstantPixelSize();
            try
            {
                RectTransform portrait = FindRect(root, "battle-card-owner-portrait");
                Assert.That(portrait, Is.Not.Null, "missing 32×32 owner portrait");
                Vector2 size = MeasuredSize(portrait);
                Assert.That(size.x, Is.EqualTo(PortraitSize).Within(SizeTolerance), "owner portrait width actual=" + size.x);
                Assert.That(size.y, Is.EqualTo(PortraitSize).Within(SizeTolerance), "owner portrait height actual=" + size.y);
            }
            finally
            {
                DestroyBuilt(root);
            }
        }

        [Test]
        public void BuildGameplay_DoesNotUseDirectionNorthAsOnlyTargetingUi()
        {
            RectTransform root = BuildAt720pConstantPixelSize();
            try
            {
                RectTransform cancel = FindRect(root, UiElementNames.BattleCardCancel);
                Assert.That(cancel, Is.Not.Null, "missing cancel control");
                Assert.That(cancel.GetComponent<UnityEngine.UI.Button>(), Is.Not.Null,
                    "cancel must be a 44×44 Button, not a TMP direction label");
                Vector2 cancelSize = MeasuredSize(cancel);
                Assert.That(cancelSize.x, Is.EqualTo(CancelSize).Within(SizeTolerance), "cancel width actual=" + cancelSize.x);
                Assert.That(cancelSize.y, Is.EqualTo(CancelSize).Within(SizeTolerance), "cancel height actual=" + cancelSize.y);
                Assert.That(cancel.gameObject.activeSelf, Is.False,
                    "cancel is visible only while targeting");

                int portraitCards = 0;
                foreach (string cardId in CharacterOfferings)
                {
                    if (FindRect(root, "battle-card-" + cardId) != null)
                    {
                        portraitCards++;
                    }
                }

                Transform north = UguiHudBuilder.Find(root, UiElementNames.BattleCardDirectionNorth);
                Assert.That(portraitCards, Is.EqualTo(4),
                    "four 132×180 character cards are the targeting chrome, not BattleCardDirectionNorth");
                Assert.That(north == null || !north.gameObject.activeSelf, Is.True,
                    "BattleCardDirectionNorth must not be the live targeting UI");
            }
            finally
            {
                DestroyBuilt(root);
            }
        }

        [Test]
        public void BuildGameplay_KoreanTitleRendersWithoutTofu()
        {
            RectTransform root = BuildAt720pConstantPixelSize();
            try
            {
                Transform titleGo = UguiHudBuilder.Find(root, "battle-hud-title");
                Assert.That(titleGo, Is.Not.Null, "missing battle HUD title");
                TextMeshProUGUI title = titleGo.GetComponentInChildren<TextMeshProUGUI>(true);
                Assert.That(title, Is.Not.Null, "battle HUD title must be TMP");
                Assert.That(title.GetComponent<UnityEngine.UI.Text>(), Is.Null);
                Assert.That(title.font, Is.Not.Null);
                Assert.That(title.font.name, Is.EqualTo("NanumGothic SDF"));
                Assert.That(title.text, Is.EqualTo(HudTitle));
                Assert.That(title.font.TryAddCharacters("잔선서울지휘관카드전투"), Is.True);
                title.ForceMeshUpdate(true, true);
                Assert.That(title.textInfo.characterCount, Is.GreaterThanOrEqualTo(HudTitle.Length));
                int missing = 0;
                for (var i = 0; i < title.textInfo.characterCount; i++)
                {
                    TMP_CharacterInfo info = title.textInfo.characterInfo[i];
                    if (info.character == ' ' || info.character == '·' || info.character == ':' )
                    {
                        continue;
                    }

                    if (!info.isVisible)
                    {
                        missing++;
                    }
                }

                Assert.That(missing, Is.EqualTo(0), "Korean title rendered with missing-glyph tofu");
            }
            finally
            {
                DestroyBuilt(root);
            }
        }

        static RectTransform BuildAt720pConstantPixelSize()
        {
            RectTransform root = UguiHudBuilder.BuildGameplay(null);
            Assert.That(root, Is.Not.Null, "BuildGameplay must return a root");
            Canvas canvas = root.GetComponentInParent<Canvas>();
            Assert.That(canvas, Is.Not.Null);
            CanvasScaler scaler = canvas.GetComponent<CanvasScaler>();
            Assert.That(scaler, Is.Not.Null);
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ConstantPixelSize;
            scaler.scaleFactor = 1f;
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            Rebuild(root);
            return root;
        }

        static RectTransform FindRect(Transform root, string name)
        {
            Transform found = UguiHudBuilder.Find(root, name);
            return found as RectTransform;
        }

        static Vector2 MeasuredSize(RectTransform rt)
        {
            Rebuild(rt);
            return rt.rect.size;
        }

        static void Rebuild(RectTransform rt)
        {
            RectTransform[] stack = rt.GetComponentsInParent<RectTransform>(true);
            for (var i = stack.Length - 1; i >= 0; i--)
            {
                LayoutRebuilder.ForceRebuildLayoutImmediate(stack[i]);
            }

            Canvas.ForceUpdateCanvases();
        }

        static void DestroyBuilt(RectTransform root)
        {
            if (root == null)
            {
                return;
            }

            Transform canvas = root.GetComponentInParent<Canvas>() != null
                ? root.GetComponentInParent<Canvas>().transform
                : root;
            Object.DestroyImmediate(canvas.gameObject);
        }
    }
}
