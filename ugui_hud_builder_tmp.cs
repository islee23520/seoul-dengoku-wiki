using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;
using TMPro;
using Janseon.Core;

namespace Janseon.Foundation.UI
{
    /// <summary>
    /// Visible emergency-console HUD (research grammar). Names match UiElementNames.
    /// </summary>
    public static class UguiHudBuilder
    {
        static Font cachedFont;
        static TMP_FontAsset cachedTmpFont;
        static bool tmpFontInitialized;

        public static EventSystem LastEnsuredEventSystem { get; private set; }

        public static RectTransform BuildGameplay(Transform parent)
        {
            EnsureEventSystem();
            GameObject canvasGo = new GameObject("GameplayCanvas");
            if (parent != null)
            {
                canvasGo.transform.SetParent(parent, false);
            }

            Canvas canvas = canvasGo.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 80;
            CanvasScaler scaler = canvasGo.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1280f, 720f);
            scaler.matchWidthOrHeight = 0.5f;
            canvasGo.AddComponent<GraphicRaycaster>();

            RectTransform root = Stretch(canvasGo.transform, UiElementNames.GameplayRoot);
            Image rootBg = root.gameObject.AddComponent<Image>();
            rootBg.color = new Color(0f, 0f, 0f, 0f);
            rootBg.raycastTarget = false;

            RectTransform rail = Band(root, UiElementNames.StageRail, new Vector2(0f, 1f), new Vector2(1f, 1f), new Vector2(12f, -44f), new Vector2(-12f, -8f));
            Chip(rail, UiElementNames.StageBasePrep, "���� �غ�");
            Chip(rail, UiElementNames.StageExpedition, "����");
            Chip(rail, UiElementNames.StageEncounter, "����");
            Chip(rail, UiElementNames.StageResolution, "�ذ�");
            Chip(rail, UiElementNames.StageSettlement, "����");
            Chip(rail, UiElementNames.StageBaseReady, "����");
            Chip(rail, "layer-chip", "B1");
            Label(rail, UiElementNames.ClockLabel, GameplayUiSnapshot.FormatClock(new Janseon.Core.Tick(0)));

            RectTransform party = Band(root, "party-strip", new Vector2(0f, 1f), new Vector2(0.46f, 1f), new Vector2(12f, -100f), new Vector2(0f, -52f));
            Party(party, "party-slot-0", "Ž�谡");
            Party(party, "party-slot-1", "�ǹ���");
            Party(party, "party-slot-2", "������");

            RectTransform deploy = Panel(root, UiElementNames.DeployPanel,
                new Vector2(0.46f, 1f), new Vector2(0.72f, 1f), new Vector2(8f, -190f), new Vector2(-8f, -52f));
            Label(deploy, UiElementNames.DeployHeading, "���� 3/3 �� ��ġ ���� 3");
            // P0 starts with three, but retain a fourth hidden row so an attempted fourth
            // participation is a real toggle interaction that Core can reject at the cap.
            for (var i = 0; i <= DeploymentApi.DeployCap; i++)
            {
                DeployToggle(deploy, i);
            }

            RectTransform route = Panel(root, UiElementNames.RouteRail, new Vector2(0f, 0f), new Vector2(0f, 1f), new Vector2(12f, 12f), new Vector2(360f, -112f));

            // 2D S-Map overlay (Line 2-like graph)
            RectTransform sMapGraph = new GameObject("s-map-graph").AddComponent<RectTransform>();
            sMapGraph.SetParent(route, false);
            HorizontalLayoutGroup graphLayout = sMapGraph.gameObject.AddComponent<HorizontalLayoutGroup>();
            graphLayout.spacing = 16f;
            graphLayout.childAlignment = TextAnchor.MiddleCenter;
            LayoutElement graphLe = sMapGraph.gameObject.AddComponent<LayoutElement>();
            graphLe.preferredHeight = 48f;
            graphLe.minHeight = 48f;

            HudButton(sMapGraph, UiElementNames.StationYeongdeungpo, "������");

            // Line segment
            GameObject link1 = new GameObject("link1");
            link1.transform.SetParent(sMapGraph, false);
            Image img1 = link1.AddComponent<Image>();
            img1.color = new Color(0.2f, 0.7f, 0.3f, 1f); // Line 2 green
            LayoutElement le1 = link1.AddComponent<LayoutElement>();
            le1.preferredWidth = 24f;
            le1.preferredHeight = 4f;

            HudButton(sMapGraph, UiElementNames.StationSindorim, "�ŵ���");

            // Line segment
            GameObject link2 = new GameObject("link2");
            link2.transform.SetParent(sMapGraph, false);
            Image img2 = link2.AddComponent<Image>();
            img2.color = new Color(0.2f, 0.7f, 0.3f, 1f); // Line 2 green
            LayoutElement le2 = link2.AddComponent<LayoutElement>();
            le2.preferredWidth = 24f;
            le2.preferredHeight = 4f;

            HudButton(sMapGraph, UiElementNames.StationGuro, "�븲"); // Task 20 calls for Daerim

            HudButton(route, UiElementNames.ActionDepart, "����");
            HudButton(route, UiElementNames.ActionFaceEncounter, "����");
            HudButton(route, UiElementNames.ActionEnterResolution, "�ذ� ����");
            Label(route, UiElementNames.HubOvernightCopy, "�ӽ� ���ڸ� �� ������ ���ս� �Ϸ���");
            RectTransform bulletin = Panel(root, UiElementNames.HubBulletinPanel,
                new Vector2(0.5f, 0f), new Vector2(0.5f, 0f), new Vector2(-180f, 12f), new Vector2(180f, 140f));
            Label(bulletin, "hub-bulletin-heading", "������ B1 �Խ���");
            Label(bulletin, "hub-bulletin-copy", "���� �Ƿڿ� ���� ������ Ȯ���Ѵ�.");
            Label(route, UiElementNames.MissionConsole, "�ӹ� �� �ŵ��� B2 ���޼� Ȯ�� | ���� �� ���� -10");
            Label(route, "encounter-context", "");

            RectTransform encounter = Panel(root, UiElementNames.EncounterChoices, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(-190f, -110f), new Vector2(190f, 130f));
            Label(encounter, "encounter-heading", "���� ����");
            HudButton(encounter, UiElementNames.ChoiceNegotiate, "����  ��  �ڿ� -5 / ���� +3");
            HudButton(encounter, UiElementNames.ChoiceBypass, "��ȸ  ��  �ڿ� -2 / ���� -1");
            HudButton(encounter, UiElementNames.ChoiceCombat, "����  ��  ���� ����");

            RectTransform battle = Panel(root, UiElementNames.BattleHud, new Vector2(1f, 0f), new Vector2(1f, 1f), new Vector2(-280f, 12f), new Vector2(-12f, -112f));
            Label(battle, UiElementNames.BattleHp, "HP");
            Meter(battle, UiElementNames.BattleHpMeter, UiElementNames.BattleHpFill, new Color(0.90f, 0.42f, 0.38f));
            Label(battle, UiElementNames.BattleAp, "AP");
            Meter(battle, UiElementNames.BattleApMeter, UiElementNames.BattleApFill, new Color(0.39f, 0.72f, 0.69f));
            HudButton(battle, "battle-move-n", "�̵� ��  ��  AP1");
            HudButton(battle, "battle-move-e", "�̵� ��  ��  AP1");
            HudButton(battle, "battle-move-s", "�̵� ��  ��  AP1");
            HudButton(battle, "battle-move-w", "�̵� ��  ��  AP1");
            HudButton(battle, "battle-melee", "����  ��  AP2 / 5");
            HudButton(battle, "battle-ranged", "���Ÿ�  ��  AP2 / 3");
            HudButton(battle, UiElementNames.BattleWait, "Wait");
            HudButton(battle, UiElementNames.MobilityRegroup, "Regroup");
            RectTransform battleGrid = new GameObject(UiElementNames.BattleGrid).AddComponent<RectTransform>();
            battleGrid.SetParent(battle, false);
            battleGrid.anchorMin = new Vector2(0f, 0f);
            battleGrid.anchorMax = new Vector2(1f, 1f);
            battleGrid.offsetMin = new Vector2(220f, 0f);
            battleGrid.offsetMax = new Vector2(-320f, -56f);
            var gridLayout = battleGrid.gameObject.AddComponent<UnityEngine.UI.GridLayoutGroup>();
            gridLayout.cellSize = new Vector2(72f, 72f);
            gridLayout.spacing = new Vector2(4f, 4f);
            gridLayout.constraint = UnityEngine.UI.GridLayoutGroup.Constraint.FixedColumnCount;
            gridLayout.constraintCount = 5;
            for (int y = 0; y < 5; y++)
            {
                for (int x = 0; x < 5; x++)
                {
                    RectTransform cell = new GameObject(UiElementNames.BattleCell(x, y)).AddComponent<RectTransform>();
                    cell.SetParent(battleGrid, false);
                    Image cellBg = cell.gameObject.AddComponent<Image>();
                    cellBg.color = new Color(0.09f, 0.13f, 0.14f, 0.45f);
                    cellBg.raycastTarget = true;
                }
            }

            Label(battle, UiElementNames.BattleLog, "");
            HudButton(battle, "battle-end-turn", "�� ����");
            HudButton(battle, UiElementNames.BattleAdvance, "�ڵ�");
            Label(battle, "battle-forecast", "");
            Label(battle, "why-tooltip", "");

            RectTransform settle = Panel(root, UiElementNames.SettlementPanel, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(-210f, -90f), new Vector2(210f, 90f));
            Image ticket = settle.GetComponent<Image>();
            ticket.color = new Color(0.835f, 0.800f, 0.710f, 0.96f);
            Label(settle, "settlement-heading", "����");
            Label(settle, UiElementNames.SettlementOutcome, "");
            HudButton(settle, UiElementNames.ActionSettle, "���� ����");
            HudButton(settle, UiElementNames.ReturnAction, "����");

            return root;
        }

        public static RectTransform BuildMainTitle(Transform parent)
        {
            EnsureEventSystem();
            GameObject canvasGo = new GameObject("MainTitleCanvas");
            if (parent != null)
            {
                canvasGo.transform.SetParent(parent, false);
            }

            Canvas canvas = canvasGo.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 70;
            CanvasScaler scaler = canvasGo.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1280f, 720f);
            scaler.matchWidthOrHeight = 0.5f;
            canvasGo.AddComponent<GraphicRaycaster>();

            RectTransform root = Stretch(canvasGo.transform, UiElementNames.MainTitleRoot);
            Image bg = root.gameObject.AddComponent<Image>();
            bg.color = new Color(0.043f, 0.067f, 0.11f, 1f);
            bg.raycastTarget = false;

            TmpLabel(root, UiElementNames.MainTitleMark, "�ܼ�: ����", 72,
                new Vector2(0f, 0.5f), new Vector2(1f, 0.5f), new Vector2(0f, 48f), new Vector2(0f, 148f),
                TextAlignmentOptions.Top, new Color(0.906f, 0.918f, 0.941f));
            TmpLabel(root, "main-title-sub", "Subtext", 20,
                new Vector2(0f, 0.5f), new Vector2(1f, 0.5f), new Vector2(0f, -32f), new Vector2(0f, 32f),
                TextAlignmentOptions.Top, new Color(0.604f, 0.651f, 0.698f));
            PresetToggle(root, UiElementNames.MainTitleStationMasterPreset,
                "? ������ ������  ��  ���� 30  ��  ���� ����\n?? ������ ����  ��  ���� 40  ��  ������ B1 �Խ���",
                new Vector2(0.5f, 0f), new Vector2(0.5f, 0f), new Vector2(-300f, 148f), new Vector2(300f, 230f));
            TmpButton(root, UiElementNames.MainTitleStart, "���� ����",
                new Vector2(0.5f, 0f), new Vector2(0.5f, 0f), new Vector2(-140f, 64f), new Vector2(140f, 128f));

            return root;
        }

        static TMP_FontAsset TmpFont()
        {
            if (tmpFontInitialized)
            {
                return cachedTmpFont;
            }

            tmpFontInitialized = true;

            // TMP creates runtime assets with its mobile SDF shader. Do not reject
            // graphics hosts just because the desktop Distance Field shader is absent.
            try
            {
                cachedTmpFont = TMP_FontAsset.CreateFontAsset(CjkFont());
            }
            catch (System.Exception ex)
            {
                Debug.LogWarning("TmpFont OS-font asset creation failed: " + ex.Message);
                cachedTmpFont = null;
            }

            if (cachedTmpFont == null)
            {
                // Try to load the bundled asset
                try
                {
                    Font font = Resources.Load<Font>("NanumGothic-Regular");
                    if (font == null)
                    {
                        // Fallback to explicit bundle path load
                        #if UNITY_EDITOR
                        font = UnityEditor.AssetDatabase.LoadAssetAtPath<Font>("Assets/Janseon/Foundation/UI/Fonts/NanumGothic-Regular.ttf");
                        #endif
                    }

                    if (font != null)
                    {
                        cachedTmpFont = TMP_FontAsset.CreateFontAsset(font);
                    }
                }
                catch (System.Exception ex)
                {
                    Debug.LogWarning("TmpFont bundle asset creation failed: " + ex.Message);
                }
            }

            if (cachedTmpFont == null)
            {
                // Direct font file paths bypass the OS registry and yield real glyphs.
                string[] fontFiles =
                {
                    "C:/Windows/Fonts/malgun.ttf",
                    "C:/Windows/Fonts/gulim.ttc",
                };
                for (var i = 0; i < fontFiles.Length && cachedTmpFont == null; i++)
                {
                    if (!System.IO.File.Exists(fontFiles[i]))
                    {
                        continue;
                    }

                    try
                    {
                        cachedTmpFont = TMP_FontAsset.CreateFontAsset(
                            fontFiles[i], 0, 90, 9,
                            UnityEngine.TextCore.LowLevel.GlyphRenderMode.SDFAA, 1024, 1024);
                    }
                    catch (System.Exception ex)
                    {
                        Debug.LogWarning("TmpFont file-path asset creation failed: " + ex.Message);
                        cachedTmpFont = null;
                    }
                }
            }

            if (cachedTmpFont == null)
            {
                cachedTmpFont = TMP_Settings.defaultFontAsset;
            }

            return cachedTmpFont;
        }

        static RectTransform TmpLabel(RectTransform parent, string name, string text, int size,
            Vector2 aMin, Vector2 aMax, Vector2 oMin, Vector2 oMax, TextAlignmentOptions align, Color color)
        {
            GameObject go = new GameObject(name);
            go.transform.SetParent(parent, false);
            RectTransform rt = go.AddComponent<RectTransform>();
            rt.anchorMin = aMin;
            rt.anchorMax = aMax;
            rt.offsetMin = oMin;
            rt.offsetMax = oMax;
            TMP_FontAsset font = TmpFont();
            if (font != null)
            {
                TextMeshProUGUI label = go.AddComponent<TextMeshProUGUI>();
                label.font = font;
                label.text = text;
                label.fontSize = size;
                label.color = color;
                label.alignment = align;
                label.raycastTarget = false;
            }
            else
            {
                Text label = go.AddComponent<Text>();
                label.font = CjkFont();
                label.text = text;
                label.fontSize = size;
                label.color = color;
                label.alignment = align == TextAlignmentOptions.MidlineLeft
                    ? TextAnchor.MiddleLeft
                    : TextAnchor.UpperCenter;
                label.raycastTarget = false;
            }
            return rt;
        }

        static RectTransform TmpButton(RectTransform parent, string name, string text,
            Vector2 aMin, Vector2 aMax, Vector2 oMin, Vector2 oMax)
        {
            GameObject go = new GameObject(name);
            go.transform.SetParent(parent, false);
            RectTransform rt = go.AddComponent<RectTransform>();
            rt.anchorMin = aMin;
            rt.anchorMax = aMax;
            rt.offsetMin = oMin;
            rt.offsetMax = oMax;
            Image img = go.AddComponent<Image>();
            img.color = new Color(0.149f, 0.212f, 0.227f, 1f);
            UnityEngine.UI.Button button = go.AddComponent<UnityEngine.UI.Button>();
            button.targetGraphic = img;
            ColorBlock colors = button.colors;
            colors.highlightedColor = new Color(0.835f, 0.929f, 0.765f, 1f);
            colors.pressedColor = new Color(0.835f, 0.929f, 0.765f, 1f);
            colors.selectedColor = new Color(0.835f, 0.929f, 0.765f, 1f);
            button.colors = colors;
            GameObject labelGo = new GameObject("label");
            labelGo.transform.SetParent(go.transform, false);
            TMP_FontAsset font = TmpFont();
            RectTransform labelRt;
            if (font != null)
            {
                TextMeshProUGUI label = labelGo.AddComponent<TextMeshProUGUI>();
                label.font = font;
                label.text = text;
                label.fontSize = 24;
                label.color = new Color(0.906f, 0.918f, 0.941f);
                label.alignment = TextAlignmentOptions.Center;
                label.raycastTarget = false;
                labelRt = label.rectTransform;
            }
            else
            {
                Text label = labelGo.AddComponent<Text>();
                label.font = CjkFont();
                label.text = text;
                label.fontSize = 24;
                label.color = new Color(0.906f, 0.918f, 0.941f);
                label.alignment = TextAnchor.MiddleCenter;
                label.raycastTarget = false;
                labelRt = label.rectTransform;
            }
            labelRt.anchorMin = Vector2.zero;
            labelRt.anchorMax = Vector2.one;
            labelRt.offsetMin = Vector2.zero;
            labelRt.offsetMax = Vector2.zero;
            return rt;
        }

        public static Transform Find(Transform root, string name)
        {
            if (root == null || string.IsNullOrEmpty(name))
            {
                return null;
            }

            if (root.name == name)
            {
                return root;
            }

            for (var i = 0; i < root.childCount; i++)
            {
                Transform hit = Find(root.GetChild(i), name);
                if (hit != null)
                {
                    return hit;
                }
            }

            return null;
        }

        public static UnityEngine.UI.Button ButtonNamed(Transform root, string name)
        {
            Transform found = Find(root, name);
            return found != null ? found.GetComponent<UnityEngine.UI.Button>() : null;
        }

        public static Text TextNamed(Transform root, string name)
        {
            Transform found = Find(root, name);
            if (found == null)
            {
                return null;
            }

            Text self = found.GetComponent<Text>();
            return self != null ? self : found.GetComponentInChildren<Text>(true);
        }

        static void EnsureEventSystem()
        {
            if (EventSystem.current != null)
            {
                return;
            }

            GameObject go = new GameObject("EventSystem");
            EventSystem created = go.AddComponent<EventSystem>();
            go.AddComponent<StandaloneInputModule>();

            LastEnsuredEventSystem = EventSystem.current != null ? EventSystem.current : created;
        }

        public static Toggle ToggleNamed(Transform root, string name)
        {
            Transform found = Find(root, name);
            return found != null ? found.GetComponent<Toggle>() : null;
        }

        internal static void DeployToggle(RectTransform parent, int rosterIndex)
        {
            string name = UiElementNames.DeployToggle(rosterIndex);
            GameObject go = new GameObject(name);
            go.transform.SetParent(parent, false);
            Image background = go.AddComponent<Image>();
            background.color = new Color(0.031f, 0.055f, 0.063f, 1f);
            Toggle toggle = go.AddComponent<Toggle>();
            toggle.targetGraphic = background;
            toggle.graphic = background;
            toggle.isOn = true;

            GameObject labelGo = new GameObject(name + "-label");
            labelGo.transform.SetParent(go.transform, false);
            Text label = labelGo.AddComponent<Text>();
            label.font = CjkFont();
            label.text = "����";
            label.fontSize = 13;
            label.alignment = TextAnchor.MiddleLeft;
            label.color = new Color(0.91f, 0.90f, 0.85f);
            label.raycastTarget = false;
            RectTransform labelRt = label.rectTransform;
            labelRt.anchorMin = Vector2.zero;
            labelRt.anchorMax = Vector2.one;
            labelRt.offsetMin = new Vector2(8f, 0f);
            labelRt.offsetMax = new Vector2(-8f, 0f);

            LayoutElement layout = go.AddComponent<LayoutElement>();
            layout.preferredHeight = 28f;
            layout.minHeight = 26f;
        }

        static void PresetToggle(
            RectTransform parent,
            string name,
            string text,
            Vector2 anchorMin,
            Vector2 anchorMax,
            Vector2 offsetMin,
            Vector2 offsetMax)
        {
            RectTransform rt = Box(parent, name, anchorMin, anchorMax, offsetMin, offsetMax,
                new Color(0.149f, 0.212f, 0.227f, 1f));
            Toggle toggle = rt.gameObject.AddComponent<Toggle>();
            Image background = rt.GetComponent<Image>();
            toggle.targetGraphic = background;

            GameObject checkGo = new GameObject("checkmark");
            checkGo.transform.SetParent(rt, false);
            Image checkmark = checkGo.AddComponent<Image>();
            checkmark.color = new Color(0.835f, 0.929f, 0.765f, 0.28f);
            checkmark.raycastTarget = false;
            RectTransform checkRt = checkmark.rectTransform;
            checkRt.anchorMin = Vector2.zero;
            checkRt.anchorMax = Vector2.one;
            checkRt.offsetMin = Vector2.zero;
            checkRt.offsetMax = Vector2.zero;
            toggle.graphic = checkmark;
            toggle.isOn = false;

            TmpLabel(rt, name + "-label", text, 18,
                Vector2.zero, Vector2.one, new Vector2(14f, 8f), new Vector2(-14f, -8f),
                TextAlignmentOptions.MidlineLeft, new Color(0.906f, 0.918f, 0.941f));
        }

        static RectTransform Stretch(Transform parent, string name)
        {
            GameObject go = new GameObject(name);
            go.transform.SetParent(parent, false);
            RectTransform rt = go.AddComponent<RectTransform>();
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
            return rt;
        }

        static RectTransform Band(RectTransform parent, string name, Vector2 aMin, Vector2 aMax, Vector2 oMin, Vector2 oMax)
        {
            RectTransform rt = Box(parent, name, aMin, aMax, oMin, oMax, new Color(0.094f, 0.137f, 0.149f, 0.94f));
            HorizontalLayoutGroup layout = rt.gameObject.AddComponent<HorizontalLayoutGroup>();
            layout.spacing = 8f;
            layout.padding = new RectOffset(8, 8, 6, 6);
            layout.childForceExpandHeight = true;
            layout.childForceExpandWidth = false;
            layout.childAlignment = TextAnchor.MiddleLeft;
            return rt;
        }

        static RectTransform Panel(RectTransform parent, string name, Vector2 aMin, Vector2 aMax, Vector2 oMin, Vector2 oMax)
        {
            RectTransform rt = Box(parent, name, aMin, aMax, oMin, oMax, new Color(0.094f, 0.137f, 0.149f, 0.94f));
            VerticalLayoutGroup layout = rt.gameObject.AddComponent<VerticalLayoutGroup>();
            layout.spacing = 6f;
            layout.padding = new RectOffset(10, 10, 10, 10);
            layout.childForceExpandHeight = false;
            layout.childForceExpandWidth = true;
            return rt;
        }

        static RectTransform Box(RectTransform parent, string name, Vector2 aMin, Vector2 aMax, Vector2 oMin, Vector2 oMax, Color fill)
        {
            GameObject go = new GameObject(name);
            go.transform.SetParent(parent, false);
            RectTransform rt = go.AddComponent<RectTransform>();
            rt.anchorMin = aMin;
            rt.anchorMax = aMax;
            rt.offsetMin = oMin;
            rt.offsetMax = oMax;
            Image img = go.AddComponent<Image>();
            img.color = fill;
            img.raycastTarget = false;
            return rt;
        }

        static void Chip(RectTransform parent, string name, string text)
        {
            GameObject go = new GameObject(name);
            go.transform.SetParent(parent, false);
            Image img = go.AddComponent<Image>();
            img.color = new Color(0.031f, 0.055f, 0.063f, 1f);
            LayoutElement le = go.AddComponent<LayoutElement>();
            le.preferredWidth = 88f;
            le.preferredHeight = 28f;
            Label(go.GetComponent<RectTransform>(), name + "-label", text, 13);
        }

        static void Party(RectTransform parent, string name, string role)
        {
            GameObject go = new GameObject(name);
            go.transform.SetParent(parent, false);
            Image img = go.AddComponent<Image>();
            img.color = new Color(0.031f, 0.055f, 0.063f, 1f);
            VerticalLayoutGroup layout = go.AddComponent<VerticalLayoutGroup>();
            layout.padding = new RectOffset(8, 6, 4, 4);
            layout.childForceExpandWidth = true;
            RectTransform rt = go.GetComponent<RectTransform>();
            Label(rt, name + "-name", role, 13);
            Label(rt, name + "-hp", "HP", 12);
            LayoutElement le = go.AddComponent<LayoutElement>();
            le.preferredWidth = 148f;
            le.preferredHeight = 40f;
        }

        static void Label(RectTransform parent, string name, string text, int size = 13)
        {
            GameObject go = new GameObject(name);
            go.transform.SetParent(parent, false);
            Text label = go.AddComponent<Text>();
            label.font = CjkFont();
            label.text = text;
            label.fontSize = size;
            label.color = parent.name == UiElementNames.SettlementPanel
                ? new Color(0.094f, 0.137f, 0.149f)
                : new Color(0.91f, 0.90f, 0.85f);
            label.alignment = TextAnchor.MiddleLeft;
            label.raycastTarget = false;
            LayoutElement le = go.AddComponent<LayoutElement>();
            le.preferredHeight = size + 8;
            le.minHeight = size + 6;
        }

        static void HudButton(RectTransform parent, string name, string text)
        {
            GameObject go = new GameObject(name);
            go.transform.SetParent(parent, false);
            Image img = go.AddComponent<Image>();
            img.color = new Color(0.149f, 0.212f, 0.227f, 1f);
            UnityEngine.UI.Button button = go.AddComponent<UnityEngine.UI.Button>();
            button.targetGraphic = img;
            ColorBlock colors = button.colors;
            colors.highlightedColor = new Color(0.835f, 0.929f, 0.765f, 1f);
            colors.pressedColor = new Color(0.835f, 0.929f, 0.765f, 1f);
            colors.selectedColor = new Color(0.835f, 0.929f, 0.765f, 1f);
            colors.disabledColor = new Color(0.25f, 0.28f, 0.30f, 0.7f);
            button.colors = colors;
            GameObject labelGo = new GameObject("label");
            labelGo.transform.SetParent(go.transform, false);
            Text label = labelGo.AddComponent<Text>();
            label.font = CjkFont();
            label.text = text;
            label.alignment = TextAnchor.MiddleCenter;
            label.color = new Color(0.91f, 0.90f, 0.85f);
            label.fontSize = 13;
            label.raycastTarget = false;
            RectTransform labelRt = label.rectTransform;
            labelRt.anchorMin = Vector2.zero;
            labelRt.anchorMax = Vector2.one;
            labelRt.offsetMin = Vector2.zero;
            labelRt.offsetMax = Vector2.zero;
            LayoutElement le = go.AddComponent<LayoutElement>();
            le.preferredHeight = 32f;
            le.minHeight = 28f;
        }

        static void Meter(RectTransform parent, string meterName, string fillName, Color fillColor)
        {
            GameObject meterGo = new GameObject(meterName);
            meterGo.transform.SetParent(parent, false);
            Image well = meterGo.AddComponent<Image>();
            well.color = new Color(0.031f, 0.055f, 0.063f, 1f);
            well.raycastTarget = false;
            LayoutElement le = meterGo.AddComponent<LayoutElement>();
            le.preferredHeight = 10f;
            le.minHeight = 10f;
            GameObject fillGo = new GameObject(fillName);
            fillGo.transform.SetParent(meterGo.transform, false);
            RectTransform fill = fillGo.AddComponent<RectTransform>();
            fill.anchorMin = Vector2.zero;
            fill.anchorMax = Vector2.one;
            fill.offsetMin = Vector2.zero;
            fill.offsetMax = Vector2.zero;
            Image img = fillGo.AddComponent<Image>();
            img.color = fillColor;
            img.raycastTarget = false;
        }

        static Font CjkFont()
        {
            if (cachedFont != null)
            {
                return cachedFont;
            }

            try
            {
                string[] names = Font.GetOSInstalledFontNames() ?? System.Array.Empty<string>();
                string[] prefer = { "Malgun Gothic", "���� ����", "Noto Sans CJK KR", "Noto Sans KR" };
                for (var i = 0; i < prefer.Length; i++)
                {
                    if (System.Array.IndexOf(names, prefer[i]) >= 0)
                    {
                        cachedFont = Font.CreateDynamicFontFromOSFont(prefer[i], 16);
                        if (cachedFont != null)
                        {
                            return cachedFont;
                        }
                    }
                }
            }
            catch (System.Exception)
            {
            }

            cachedFont = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf")
                         ?? Resources.GetBuiltinResource<Font>("Arial.ttf")
                         ?? Font.CreateDynamicFontFromOSFont("Arial", 16);
            return cachedFont;
        }
    }
}
