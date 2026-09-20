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
            Chip(rail, UiElementNames.StageBasePrep, "거점 준비");
            Chip(rail, UiElementNames.StageExpedition, "원정");
            Chip(rail, UiElementNames.StageEncounter, "조우");
            Chip(rail, UiElementNames.StageResolution, "해결");
            Chip(rail, UiElementNames.StageSettlement, "정산");
            Chip(rail, UiElementNames.StageBaseReady, "복귀");
            Chip(rail, "layer-chip", "B1");
            Label(rail, UiElementNames.ClockLabel, GameplayUiSnapshot.FormatClock(new Janseon.Core.Tick(0)));

            RectTransform party = Band(root, "party-strip", new Vector2(0f, 1f), new Vector2(0.46f, 1f), new Vector2(12f, -100f), new Vector2(0f, -52f));
            Party(party, "party-slot-0", "탐험가");
            Party(party, "party-slot-1", "의무병");
            Party(party, "party-slot-2", "순찰대");

            RectTransform deploy = Panel(root, UiElementNames.DeployPanel,
                new Vector2(0.46f, 1f), new Vector2(0.72f, 1f), new Vector2(8f, -190f), new Vector2(-8f, -52f));
            Label(deploy, UiElementNames.DeployHeading, "참가 3/3 · 배치 상한 3");
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

            HudButton(sMapGraph, UiElementNames.StationYeongdeungpo, "영등포");

            // Line segment
            GameObject link1 = new GameObject("link1");
            link1.transform.SetParent(sMapGraph, false);
            Image img1 = link1.AddComponent<Image>();
            img1.color = new Color(0.2f, 0.7f, 0.3f, 1f); // Line 2 green
            LayoutElement le1 = link1.AddComponent<LayoutElement>();
            le1.preferredWidth = 24f;
            le1.preferredHeight = 4f;

            HudButton(sMapGraph, UiElementNames.StationSindorim, "신도림");

            // Line segment
            GameObject link2 = new GameObject("link2");
            link2.transform.SetParent(sMapGraph, false);
            Image img2 = link2.AddComponent<Image>();
            img2.color = new Color(0.2f, 0.7f, 0.3f, 1f); // Line 2 green
            LayoutElement le2 = link2.AddComponent<LayoutElement>();
            le2.preferredWidth = 24f;
            le2.preferredHeight = 4f;

            HudButton(sMapGraph, UiElementNames.StationGuro, "대림"); // Task 20 calls for Daerim

            HudButton(route, UiElementNames.ActionDepart, "출정");
            HudButton(route, UiElementNames.ActionFaceEncounter, "조우");
            HudButton(route, UiElementNames.ActionEnterResolution, "해결 진입");
            Label(route, UiElementNames.HubOvernightCopy, "임시 잠자리 · 영등포 대합실 하룻밤");
            Label(route, UiElementNames.RelationsHeading, "관계 — 정산 회복 · 인접 협공에 반영");
            Label(route, UiElementNames.RelationsRowExplorerMedic, "탐험가 ↔ 의무병 ●●○");
            Label(route, UiElementNames.RelationsRowExplorerPatrol, "탐험가 ↔ 순찰대 ●○○");
            Label(route, UiElementNames.RelationsRowMedicPatrol, "의무병 ↔ 순찰대 ○○○");
            RectTransform bulletin = Panel(root, UiElementNames.HubBulletinPanel,
                new Vector2(0.5f, 0f), new Vector2(0.5f, 0f), new Vector2(-180f, 12f), new Vector2(180f, 140f));
            Label(bulletin, "hub-bulletin-heading", "영등포 B1 게시판");
            Label(bulletin, "hub-bulletin-copy", "역내 의뢰와 수리 공지를 확인한다.");
            Label(route, UiElementNames.MissionConsole, "임무 · 신도림 B2 보급선 확보 | 실패 시 보급 -10");
            Label(route, UiElementNames.TravelDetailHeading, "이동 — 신도림 B2 승강장");
            Label(route, UiElementNames.TravelPath, "경로 — B1 계단 → B2 · 반나절");
            Label(route, UiElementNames.TravelCost, "비용 — 보급 -2");
            Label(route, UiElementNames.TravelForecast, "예상 조우 — 순찰대 · 불확실");
            Label(route, UiElementNames.TravelState, "B2 상태 — 침수 40%");
            Label(route, "encounter-context", "");

            RectTransform dataPanel = Panel(root, UiElementNames.DataContractPanel,
                new Vector2(0.72f, 1f), new Vector2(1f, 1f), new Vector2(8f, -190f), new Vector2(-12f, -52f));
            RectTransform disclosure = TmpSizedButton(dataPanel, UiElementNames.DataContractDisclosure, "데이터 계약", 160f, 32f);
            RectTransform dataBody = Panel(dataPanel, UiElementNames.DataContractBody,
                Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
            TmpLabel(dataBody, UiElementNames.DataContentVersion, string.Empty, 16,
                Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero,
                TextAlignmentOptions.MidlineLeft, new Color(0.906f, 0.918f, 0.941f));
            TmpLabel(dataBody, UiElementNames.DataContentCounts, string.Empty, 14,
                Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero,
                TextAlignmentOptions.MidlineLeft, new Color(0.604f, 0.651f, 0.698f));
            TmpLabel(dataBody, UiElementNames.DataContentFingerprint, string.Empty, 14,
                Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero,
                TextAlignmentOptions.MidlineLeft, new Color(0.604f, 0.651f, 0.698f));
            dataBody.gameObject.SetActive(false);
            UnityEngine.UI.Button disclosureButton = disclosure.GetComponent<UnityEngine.UI.Button>();
            disclosureButton.onClick.AddListener(() => dataBody.gameObject.SetActive(!dataBody.gameObject.activeSelf));

            // Campaign-only S-map territory panel (HTML POC §5). Hidden during battle.
            RectTransform territory = Panel(root, UiElementNames.TerritoryPanel,
                new Vector2(0.72f, 1f), new Vector2(1f, 1f), new Vector2(8f, -400f), new Vector2(-12f, -210f));
            Label(territory, UiElementNames.TerritoryHeading, "영토 · 관계 · 통행권", 13);
            Label(territory, UiElementNames.TerritoryRowYeongdeungpo, "영등포 — 본거지 · 아군", 12);
            Label(territory, UiElementNames.TerritoryRowSindorim, "신도림 — 인접 · 통행 협상", 12);
            Label(territory, UiElementNames.TerritoryRowGuro, "대림 — 미개통 · B2 확보 후 개통", 12);

            RectTransform encounter = Panel(root, UiElementNames.EncounterChoices, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(-190f, -110f), new Vector2(190f, 130f));
            Label(encounter, "encounter-heading", "조우 선택");
            HudButton(encounter, UiElementNames.ChoiceNegotiate, "교섭  ·  자원 -5 / 평판 +3");
            HudButton(encounter, UiElementNames.ChoiceBypass, "우회  ·  자원 -2 / 평판 -1");
            HudButton(encounter, UiElementNames.ChoiceCombat, "전투  ·  부대 교전");

            BuildBattleHud(root);

            RectTransform settle = Panel(root, UiElementNames.SettlementPanel, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(-210f, -90f), new Vector2(210f, 90f));
            Image ticket = settle.GetComponent<Image>();
            ticket.color = new Color(0.835f, 0.800f, 0.710f, 0.96f);
            Label(settle, "settlement-heading", "정산");
            Label(settle, UiElementNames.SettlementOutcome, "");
            HudButton(settle, UiElementNames.ActionSettle, "정산 적용");
            HudButton(settle, UiElementNames.ReturnAction, "복귀");

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

            TmpLabel(root, UiElementNames.MainTitleMark, "서울:전국", 72,
                new Vector2(0f, 0.5f), new Vector2(1f, 0.5f), new Vector2(0f, 48f), new Vector2(0f, 148f),
                TextAlignmentOptions.Top, new Color(0.906f, 0.918f, 0.941f));
            TmpLabel(root, "main-title-sub", "붕괴한 서울의 지하철망에서 무명 인물과 파티로 노선의 질서를 세운다", 20,
                new Vector2(0f, 0.5f), new Vector2(1f, 0.5f), new Vector2(0f, -32f), new Vector2(0f, 32f),
                TextAlignmentOptions.Top, new Color(0.604f, 0.651f, 0.698f));
            PresetToggle(root, UiElementNames.MainTitleStationMasterPreset,
                "☀ 떠돌이 삼인조  ·  보급 30  ·  거점 없음\n📜 마지막 역장  ·  보급 40  ·  영등포 B1 게시판",
                new Vector2(0.5f, 0f), new Vector2(0.5f, 0f), new Vector2(-300f, 148f), new Vector2(300f, 230f));
            TmpButton(root, UiElementNames.MainTitleStart, "원정 시작",
                new Vector2(0.5f, 0f), new Vector2(0.5f, 0f), new Vector2(-140f, 64f), new Vector2(140f, 128f));

            return root;
        }

        static void BuildBattleHud(RectTransform root)
        {
            RectTransform battle = Panel(root, UiElementNames.BattleHud,
                new Vector2(0f, 0f), new Vector2(1f, 1f), new Vector2(12f, 12f), new Vector2(-12f, -8f));
            VerticalLayoutGroup battleLayout = battle.GetComponent<VerticalLayoutGroup>();
            battleLayout.spacing = 8f;
            battleLayout.padding = new RectOffset(8, 8, 8, 8);
            battleLayout.childForceExpandHeight = false;
            battleLayout.childForceExpandWidth = true;
            battleLayout.childAlignment = TextAnchor.UpperLeft;

            RectTransform title = TmpLabel(battle, UiElementNames.BattleHudTitle,
                "서울:전국 · 지휘관 카드 전투", 20,
                Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero,
                TextAlignmentOptions.MidlineLeft, new Color(0.906f, 0.918f, 0.941f));
            LayoutElement titleLayout = title.gameObject.AddComponent<LayoutElement>();
            titleLayout.preferredHeight = 28f;
            titleLayout.minHeight = 28f;

            RectTransform provenance = TmpLabel(battle, UiElementNames.LocalReviewProvenanceBanner,
                "로컬 리뷰 파생물 · 원본 아틀라스 미수록", 13,
                Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero,
                TextAlignmentOptions.MidlineLeft, new Color(0.835f, 0.800f, 0.710f));
            LayoutElement provenanceLayout = provenance.gameObject.AddComponent<LayoutElement>();
            provenanceLayout.preferredHeight = 20f;
            provenanceLayout.minHeight = 20f;
            // Keep the component awake but out of layout rebuild so TryAddCharacters still
            // has Hangul to rasterize (TMP returns false when the atlas already contains them).
            TextMeshProUGUI titleTmp = title.GetComponent<TextMeshProUGUI>();
            titleTmp.enabled = false;

            RectTransform battleStatus = Band(battle, "battle-status", Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
            Label(battleStatus, UiElementNames.BattleHp, "HP");
            Meter(battleStatus, UiElementNames.BattleHpMeter, UiElementNames.BattleHpFill, new Color(0.90f, 0.42f, 0.38f));
            Label(battleStatus, UiElementNames.BattleMorale, "사기");
            TmpMeter(battleStatus, UiElementNames.BattleMoralePlayer, "아군 사기", new Color(0.45f, 0.78f, 0.44f));
            TmpMeter(battleStatus, UiElementNames.BattleMoraleEnemy, "적 사기", new Color(0.78f, 0.36f, 0.34f));
            TmpLabel(battleStatus, UiElementNames.BattleReinforcement, "증원 예고", 14, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero, TextAlignmentOptions.MidlineLeft, new Color(0.91f, 0.90f, 0.85f));
            Label(battleStatus, UiElementNames.BattleReinforcementForecast, "증원 예고");
            HudButton(battleStatus, UiElementNames.BattlePlayPause, "일시정지");
            LayoutElement statusLayout = battleStatus.gameObject.AddComponent<LayoutElement>();
            statusLayout.preferredHeight = 42f;
            statusLayout.minHeight = 42f;

            RectTransform battleRow = new GameObject("battle-row").AddComponent<RectTransform>();
            battleRow.SetParent(battle, false);
            HorizontalLayoutGroup rowLayout = battleRow.gameObject.AddComponent<HorizontalLayoutGroup>();
            rowLayout.spacing = 10f;
            rowLayout.childForceExpandWidth = true;
            rowLayout.childForceExpandHeight = true;
            rowLayout.childAlignment = TextAnchor.UpperLeft;
            LayoutElement battleRowLayout = battleRow.gameObject.AddComponent<LayoutElement>();
            battleRowLayout.flexibleHeight = 1f;
            battleRowLayout.minHeight = 280f;

            RectTransform battlefield = Box(battleRow, "battle-field", Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero,
                new Color(0.031f, 0.051f, 0.078f, 0.55f));
            LayoutElement fieldLayout = battlefield.gameObject.AddComponent<LayoutElement>();
            fieldLayout.flexibleWidth = 1f;
            fieldLayout.flexibleHeight = 1f;
            VerticalLayoutGroup fieldStack = battlefield.gameObject.AddComponent<VerticalLayoutGroup>();
            fieldStack.spacing = 8f;
            fieldStack.padding = new RectOffset(8, 8, 8, 8);
            fieldStack.childForceExpandWidth = true;
            fieldStack.childForceExpandHeight = false;
            fieldStack.childAlignment = TextAnchor.UpperCenter;

            RectTransform battleReport = Panel(battlefield, "battle-report", Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
            LayoutElement reportLayout = battleReport.gameObject.AddComponent<LayoutElement>();
            reportLayout.flexibleWidth = 1f;
            reportLayout.preferredHeight = 72f;
            Label(battleReport, "battle-report-heading", "전황 기록");
            Label(battleReport, UiElementNames.BattleLog, "");

            BuildBattleDock(battle);
        }

        static void BuildBattleDock(RectTransform battle)
        {
            RectTransform dock = Box(battle, UiElementNames.BattleDock, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero,
                new Color(0.031f, 0.051f, 0.078f, 0.94f));
            LayoutElement dockLayout = dock.gameObject.AddComponent<LayoutElement>();
            dockLayout.preferredHeight = 52f;
            dockLayout.minHeight = 52f;
            HorizontalLayoutGroup dockRow = dock.gameObject.AddComponent<HorizontalLayoutGroup>();
            dockRow.spacing = 10f;
            dockRow.padding = new RectOffset(10, 10, 10, 10);
            dockRow.childForceExpandWidth = false;
            dockRow.childForceExpandHeight = false;
            dockRow.childControlWidth = false;
            dockRow.childControlHeight = false;
            dockRow.childAlignment = TextAnchor.MiddleLeft;
            HudButton(dock, UiElementNames.BattleReset, "전투 초기화");
            Label(dock, "why-tooltip", string.Empty);
        }

        static RectTransform TmpSizedButton(RectTransform parent, string name, string text, float width, float height)
        {
            GameObject go = new GameObject(name);
            go.transform.SetParent(parent, false);
            RectTransform rt = go.AddComponent<RectTransform>();
            Image img = go.AddComponent<Image>();
            img.color = new Color(0.067f, 0.102f, 0.149f, 1f);
            UnityEngine.UI.Button button = go.AddComponent<UnityEngine.UI.Button>();
            button.targetGraphic = img;
            ColorBlock colors = button.colors;
            colors.highlightedColor = new Color(0.835f, 0.929f, 0.765f, 1f);
            colors.pressedColor = new Color(0.835f, 0.929f, 0.765f, 1f);
            colors.selectedColor = new Color(0.835f, 0.929f, 0.765f, 1f);
            button.colors = colors;
            LayoutElement le = go.AddComponent<LayoutElement>();
            le.preferredWidth = width;
            le.preferredHeight = height;
            le.minWidth = width;
            le.minHeight = height;
            le.flexibleWidth = 0f;
            le.flexibleHeight = 0f;
            rt.anchorMin = new Vector2(0f, 0f);
            rt.anchorMax = new Vector2(0f, 0f);
            rt.pivot = new Vector2(0.5f, 0.5f);
            rt.sizeDelta = new Vector2(width, height);
            GameObject labelGo = new GameObject("label");
            labelGo.transform.SetParent(go.transform, false);
            TextMeshProUGUI label = labelGo.AddComponent<TextMeshProUGUI>();
            label.font = TmpFont();
            label.text = text;
            label.fontSize = 13;
            label.color = new Color(1f, 0.894f, 0.608f);
            label.alignment = TextAlignmentOptions.Center;
            label.raycastTarget = false;
            RectTransform labelRt = label.rectTransform;
            labelRt.anchorMin = Vector2.zero;
            labelRt.anchorMax = Vector2.one;
            labelRt.offsetMin = Vector2.zero;
            labelRt.offsetMax = Vector2.zero;
            return rt;
        }

        static TMP_FontAsset TmpFont()
        {
            if (tmpFontInitialized)
            {
                return cachedTmpFont;
            }

            tmpFontInitialized = true;

            cachedTmpFont = Resources.Load<TMP_FontAsset>("Fonts & Materials/NanumGothic SDF");
            if (cachedTmpFont == null)
            {
                throw new System.InvalidOperationException(
                    "NanumGothic SDF is missing. Run FoundationProjectBuilder.PrepareTmpResources.");
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
            TextMeshProUGUI label = go.AddComponent<TextMeshProUGUI>();
            label.font = TmpFont();
            label.text = text;
            label.fontSize = size;
            label.color = color;
            label.alignment = align;
            label.raycastTarget = false;
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
            TextMeshProUGUI label = labelGo.AddComponent<TextMeshProUGUI>();
            label.font = TmpFont();
            label.text = text;
            label.fontSize = 24;
            label.color = new Color(0.906f, 0.918f, 0.941f);
            label.alignment = TextAlignmentOptions.Center;
            label.raycastTarget = false;
            RectTransform labelRt = label.rectTransform;
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

        /// <summary>
        /// Find-or-create a horizontal row container for presenter-managed dynamic buttons.
        /// </summary>
        public static RectTransform EnsureRow(Transform parent, string name)
        {
            Transform found = Find(parent, name);
            if (found != null)
            {
                return found as RectTransform;
            }

            var go = new GameObject(name);
            RectTransform rt = go.AddComponent<RectTransform>();
            rt.SetParent(parent, false);
            HorizontalLayoutGroup layout = go.AddComponent<HorizontalLayoutGroup>();
            layout.spacing = 8f;
            layout.childAlignment = TextAnchor.MiddleCenter;
            LayoutElement le = go.AddComponent<LayoutElement>();
            le.preferredHeight = 36f;
            le.minHeight = 36f;
            return rt;
        }

        /// <summary>
        /// Find-or-create a labeled button. Existing objects are reused so listener wiring stays stable.
        /// </summary>
        public static UnityEngine.UI.Button EnsureButton(Transform parent, string name, string text)
        {
            UnityEngine.UI.Button found = ButtonNamed(parent, name);
            if (found != null)
            {
                return found;
            }

            var row = parent as RectTransform;
            if (row == null)
            {
                return null;
            }

            HudButton(row, name, text);
            return ButtonNamed(parent, name);
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
            label.text = "참가";
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

        static RectTransform FixedSize(RectTransform parent, string name, float width, float height, Color fill)
        {
            GameObject go = new GameObject(name);
            go.transform.SetParent(parent, false);
            RectTransform rt = go.AddComponent<RectTransform>();
            rt.anchorMin = new Vector2(0f, 0f);
            rt.anchorMax = new Vector2(0f, 0f);
            rt.pivot = new Vector2(0.5f, 0.5f);
            rt.sizeDelta = new Vector2(width, height);
            Image img = go.AddComponent<Image>();
            img.color = fill;
            img.raycastTarget = false;
            LayoutElement le = go.AddComponent<LayoutElement>();
            le.preferredWidth = width;
            le.preferredHeight = height;
            le.minWidth = width;
            le.minHeight = height;
            le.flexibleWidth = 0f;
            le.flexibleHeight = 0f;
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

        static void TmpMeter(RectTransform parent, string name, string labelText, Color fillColor)
        {
            RectTransform meter = Box(parent, name, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero, new Color(0.031f, 0.055f, 0.063f, 1f));
            TmpLabel(meter, name + "-label", labelText, 12, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero, TextAlignmentOptions.MidlineLeft, new Color(0.91f, 0.90f, 0.85f));
            Image fill = new GameObject(name + "-fill").AddComponent<Image>();
            fill.transform.SetParent(meter, false);
            fill.color = fillColor;
            fill.raycastTarget = false;
            RectTransform fillRt = fill.rectTransform;
            fillRt.anchorMin = Vector2.zero;
            fillRt.anchorMax = new Vector2(0.5f, 1f);
            fillRt.offsetMin = Vector2.zero;
            fillRt.offsetMax = Vector2.zero;
        }

        static void Meter(RectTransform parent, string meterName, string fillName, Color fillColor)
        {
            GameObject meterGo = new GameObject(meterName);
            meterGo.transform.SetParent(parent, false);
            Image well = meterGo.AddComponent<Image>();
            well.color = new Color(0.031f, 0.055f, 0.063f, 1f);
            well.raycastTarget = false;
            LayoutElement le = meterGo.AddComponent<LayoutElement>();
            le.preferredWidth = 140f;
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
                string[] prefer = { "Malgun Gothic", "맑은 고딕", "Noto Sans CJK KR", "Noto Sans KR" };
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
