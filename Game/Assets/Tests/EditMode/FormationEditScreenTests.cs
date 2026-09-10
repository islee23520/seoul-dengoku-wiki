using Janseon.Foundation.Composition;
using Janseon.Foundation.UI;
using NUnit.Framework;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Janseon.Foundation.Tests
{
    /// <summary>
    /// Todo 6: six-unit 3×3 formation editor vs the NESW-only facing modal.
    /// </summary>
    public sealed class FormationEditScreenTests
    {
        const float RailWidth = 370f;
        const float WidthTolerance = 8f;

        static readonly string[] UnitIds =
        {
            "ally-guard-1",
            "ally-guard-2",
            "ally-assault-1",
            "ally-assault-2",
            "ally-archer-1",
            "ally-archer-2",
        };

        static readonly string[] UnitNames =
        {
            "서윤",
            "민재",
            "하린",
            "도윤",
            "지우",
            "은호",
        };

        static readonly string[] SlotIds =
        {
            "front-left",
            "front-center",
            "front-right",
            "middle-left",
            "middle-center",
            "middle-right",
            "rear-left",
            "rear-center",
            "rear-right",
        };

        [Test]
        public void BuildGameplay_FormationEditor_HasSixNamedUnitControls()
        {
            RectTransform root = BuildAt720pConstantPixelSize();
            try
            {
                Transform formationEdit = RequireFormationEdit(root);
                Assert.That(UguiHudBuilder.Find(formationEdit, UiElementNames.DeployToggle(0)), Is.Null,
                    "campaign 3-member deploy toggles are not this formation editor");

                for (var i = 0; i < UnitIds.Length; i++)
                {
                    string name = UiElementNames.FormationEditUnit(UnitIds[i]);
                    Transform unit = UguiHudBuilder.Find(formationEdit, name);
                    Assert.That(unit, Is.Not.Null,
                        "missing unit control " + name + " (current editor is NESW-only, not six units 서윤…은호)");
                    Assert.That(unit.GetComponent<UnityEngine.UI.Button>(), Is.Not.Null, name + " must be a button");
                    TextMeshProUGUI tmp = unit.GetComponentInChildren<TextMeshProUGUI>(true);
                    Assert.That(tmp, Is.Not.Null, name + " must use TMP, not native Text");
                    Assert.That(tmp.font, Is.Not.Null);
                    Assert.That(tmp.font.name, Is.EqualTo("NanumGothic SDF"));
                    Assert.That(tmp.text, Does.Contain(UnitNames[i]), name + " must show " + UnitNames[i]);
                }
            }
            finally
            {
                DestroyBuilt(root);
            }
        }

        [Test]
        public void BuildGameplay_FormationEditor_HasNineSlotControlsAnd370Rail()
        {
            RectTransform root = BuildAt720pConstantPixelSize();
            try
            {
                Transform formationEdit = RequireFormationEdit(root);
                RectTransform rail = formationEdit as RectTransform;
                Assert.That(rail, Is.Not.Null);
                Vector2 size = MeasuredSize(rail);
                Assert.That(size.x, Is.EqualTo(RailWidth).Within(WidthTolerance),
                    "formation editor must be a ~370px right rail, not the centered NESW modal. actual=" + size.x);

                for (var i = 0; i < SlotIds.Length; i++)
                {
                    string name = UiElementNames.FormationEditSlot(SlotIds[i]);
                    Transform slot = UguiHudBuilder.Find(formationEdit, name);
                    Assert.That(slot, Is.Not.Null,
                        "missing slot control " + name + " (need 3×3 destination slots, not four facing buttons alone)");
                    Assert.That(slot.GetComponent<UnityEngine.UI.Button>(), Is.Not.Null, name + " must be a button");
                }
            }
            finally
            {
                DestroyBuilt(root);
            }
        }

        [Test]
        public void BuildGameplay_FormationEditor_HasSelectedReportAndConfirmReeditReset()
        {
            RectTransform root = BuildAt720pConstantPixelSize();
            try
            {
                Transform formationEdit = RequireFormationEdit(root);
                AssertTmp(formationEdit, UiElementNames.FormationEditSelectedName, "서윤");
                AssertTmp(formationEdit, UiElementNames.FormationEditSelectedRole, "근위");
                AssertTmp(formationEdit, UiElementNames.FormationEditSelectedCallsign, "방벽 01");
                AssertButton(formationEdit, UiElementNames.FormationEditConfirm);
                AssertButton(formationEdit, UiElementNames.FormationEditReedit);
                AssertButton(formationEdit, UiElementNames.FormationEditReset);
                AssertButton(formationEdit, UiElementNames.FormationEditCancel);
                AssertButton(formationEdit, UiElementNames.FormationEditFacingN);
                AssertButton(formationEdit, UiElementNames.FormationEditFacingE);
                AssertButton(formationEdit, UiElementNames.FormationEditFacingS);
                AssertButton(formationEdit, UiElementNames.FormationEditFacingW);
            }
            finally
            {
                DestroyBuilt(root);
            }
        }

        [Test]
        public void FormationEdit_DoesNotDeployUntilConfirm()
        {
            RectTransform root = BuildAt720pConstantPixelSize();
            var presenter = new GameplayPresenter();
            try
            {
                Transform formationEdit = RequireFormationEdit(root);
                for (var i = 0; i < UnitIds.Length; i++)
                {
                    Assert.That(UguiHudBuilder.Find(formationEdit, UiElementNames.FormationEditUnit(UnitIds[i])),
                        Is.Not.Null, "missing unit control before confirm-gating can be proved");
                }

                for (var i = 0; i < SlotIds.Length; i++)
                {
                    Assert.That(UguiHudBuilder.Find(formationEdit, UiElementNames.FormationEditSlot(SlotIds[i])),
                        Is.Not.Null, "missing slot control before confirm-gating can be proved");
                }

                Assert.That(presenter.BindForTest(root), Is.True, "presenter must bind the rebuilt formation editor");

                int confirms = 0;
                int editOpens = 0;
                presenter.FormationEditConfirmChosen += () => confirms++;
                presenter.EditFormationChosen += () => editOpens++;

                Click(root, UiElementNames.EditFormation);
                Assert.That(editOpens, Is.EqualTo(1), "EditFormation opens the editor");
                Assert.That(confirms, Is.EqualTo(0), "EditFormation must not deploy / confirm");

                Click(root, UiElementNames.FormationEditUnit(UnitIds[0]));
                Click(root, UiElementNames.FormationEditSlot(SlotIds[1]));
                Click(root, UiElementNames.FormationEditReset);
                Click(root, UiElementNames.FormationEditReedit);
                Assert.That(confirms, Is.EqualTo(0),
                    "unit, slot, reset, and re-edit must not deploy; only confirm sends Deploy");

                Click(root, UiElementNames.FormationEditConfirm);
                Assert.That(confirms, Is.EqualTo(1), "confirm sends the one Deploy");
            }
            finally
            {
                DestroyBuilt(root);
            }
        }

        static Transform RequireFormationEdit(RectTransform root)
        {
            Transform formationEdit = UguiHudBuilder.Find(root, UiElementNames.FormationEdit);
            Assert.That(formationEdit, Is.Not.Null, "missing formation-edit panel");
            return formationEdit;
        }

        static void AssertButton(Transform parent, string name)
        {
            Transform child = UguiHudBuilder.Find(parent, name);
            Assert.That(child, Is.Not.Null, "missing " + name);
            Assert.That(child.GetComponent<UnityEngine.UI.Button>(), Is.Not.Null, name + " must be a button");
        }

        static void AssertTmp(Transform parent, string name, string expected)
        {
            Transform child = UguiHudBuilder.Find(parent, name);
            Assert.That(child, Is.Not.Null, "missing " + name);
            Assert.That(child.GetComponent<UnityEngine.UI.Text>(), Is.Null, name + " must not use native Text");
            TextMeshProUGUI tmp = child.GetComponentInChildren<TextMeshProUGUI>(true);
            Assert.That(tmp, Is.Not.Null, name + " must be TMP");
            Assert.That(tmp.font, Is.Not.Null);
            Assert.That(tmp.font.name, Is.EqualTo("NanumGothic SDF"));
            Assert.That(tmp.text, Does.Contain(expected), name + " actual=" + (tmp.text ?? string.Empty));
        }

        static void Click(RectTransform root, string name)
        {
            UnityEngine.UI.Button button = UguiHudBuilder.ButtonNamed(root, name);
            Assert.That(button, Is.Not.Null, "missing clickable " + name);
            button.onClick.Invoke();
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
