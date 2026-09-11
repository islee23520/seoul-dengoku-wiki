using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Janseon.Core;
using Janseon.Core.Battle.Contracts;
using Janseon.Core.Battle.Sim;
using Janseon.Foundation.AppFlow;
using Janseon.Foundation.Composition;
using Janseon.Foundation.UI;
using NUnit.Framework;
using UnityEngine;

namespace Janseon.Foundation.Tests
{
    /// <summary>
    /// Canvas behavior contracts (Design.md). Asserts structure, FSM action,
    /// snapshot determinism, and readiness — not user-visible prose.
    /// </summary>
    public sealed class UguiScreenTests
    {
        [Test]
        public void MainTitle_BuildMainTitleCanvas_ExposesRequiredNames()
        {
            RectTransform root = UguiHudBuilder.BuildMainTitle(null);
            Assert.That(root, Is.Not.Null, "canvas root must build");

            Transform titleRoot = UguiHudBuilder.Find(root, UiElementNames.MainTitleRoot);
            Assert.That(titleRoot, Is.Not.Null, "missing " + UiElementNames.MainTitleRoot);
            Assert.That(UguiHudBuilder.Find(titleRoot, UiElementNames.MainTitleMark), Is.Not.Null,
                "missing " + UiElementNames.MainTitleMark);

            var start = UguiHudBuilder.ButtonNamed(titleRoot, UiElementNames.MainTitleStart);
            Assert.That(start, Is.Not.Null, "missing " + UiElementNames.MainTitleStart);
        }

        [Test]
        public void MainTitle_MarkIsTextAndStartIsButton()
        {
            RectTransform root = UguiHudBuilder.BuildMainTitle(null);
            Transform mark = UguiHudBuilder.Find(root, UiElementNames.MainTitleMark);
            Assert.That(mark, Is.Not.Null, "missing " + UiElementNames.MainTitleMark);
            var title = mark.GetComponentInChildren<TMPro.TextMeshProUGUI>(true);
            Assert.That(title, Is.Not.Null, "main-title-mark must render TMP");
            Assert.That(title.font, Is.Not.Null);
            Assert.That(title.font.name, Is.EqualTo("NanumGothic SDF"));
            Assert.That(title.font.sourceFontFile, Is.Not.Null);
            Assert.That(title.font.sourceFontFile.name, Does.Contain("NanumGothic"));
            Assert.That(title.font.atlasTextures, Is.Not.Empty);
            Assert.That(title.font.atlasTexture, Is.Not.Null);
            Assert.That(title.font.material, Is.Not.Null);
            Assert.That(title.font.material.shader, Is.Not.Null);
            Assert.That(title.font.TryAddCharacters("잔선서울"), Is.True);
            title.ForceMeshUpdate(true, true);
            Assert.That(title.textInfo.characterCount, Is.GreaterThanOrEqualTo(4));

            var start = UguiHudBuilder.ButtonNamed(root, UiElementNames.MainTitleStart);
            Assert.That(start, Is.Not.Null, "main-title-start must be a Button");
        }

        [Test]
        public async Task MainTitle_Start_CallsOpenFoundationOnPublicCoordinator()
        {
            var loader = new RecordingLoader();
            var coordinator = new ApplicationFlowCoordinator(loader);
            // Commit MainTitle first so OpenFoundation is legal.
            Task<TransitionOutcome> boot = coordinator.OpenMainTitleAsync(CancellationToken.None);
            RecordingLease titleLease = loader.Complete(ContentScreenId.MainTitle);
            titleLease.CompleteReady();
            Assert.That((await boot).Status, Is.EqualTo(TransitionStatus.Completed));

            var presenter = new MainTitlePresenter(coordinator);
            Assert.That(presenter.BindForTest(UguiHudBuilder.BuildMainTitle(null)), Is.True, "presenter must bind MainTitle canvas");

            Task<TransitionOutcome> click = presenter.TriggerStartForTest();
            // Start must request foundation while title lease is still committed.
            Assert.That(
                coordinator.CurrentState == ApplicationFlowState.Transitioning
                || coordinator.CurrentState == ApplicationFlowState.Foundation,
                Is.True,
                "Start must dispatch OpenFoundation on the public coordinator");

            RecordingLease foundationLease = null;
            if (coordinator.CurrentState == ApplicationFlowState.Transitioning)
            {
                foundationLease = loader.Complete(ContentScreenId.Foundation);
                titleLease.CompleteCleanup();
                foundationLease.CompleteReady();
            }

            TransitionOutcome outcome = await click;

            Assert.That(outcome.Status, Is.EqualTo(TransitionStatus.Completed));
            Assert.That(coordinator.CurrentState, Is.EqualTo(ApplicationFlowState.Foundation));
            Assert.That(loader.Requests.Count(r => r == ContentScreenId.Foundation), Is.EqualTo(1));
            Assert.That(loader.Requests.Count(r => r == ContentScreenId.MainTitle), Is.EqualTo(1));
        }

        [Test]
        public void MainTitle_P0PresetToggle_DefaultsWanderer_AndSelectsStationMaster()
        {
            var coordinator = new ApplicationFlowCoordinator(new RecordingLoader());
            RectTransform root = UguiHudBuilder.BuildMainTitle(null);
            var presenter = new MainTitlePresenter(coordinator);

            Assert.That(presenter.BindForTest(root), Is.True);
            Assert.That(coordinator.SelectedStartingPreset, Is.EqualTo(StartingPreset.Wanderer));
            Assert.That(
                UguiHudBuilder.ToggleNamed(root, UiElementNames.MainTitleStationMasterPreset).isOn,
                Is.False,
                "떠돌이 삼인조 must be the default new-game preset");

            UguiHudBuilder.ToggleNamed(root, UiElementNames.MainTitleStationMasterPreset).isOn = true;

            Assert.That(coordinator.SelectedStartingPreset, Is.EqualTo(StartingPreset.StationMaster));
        }

        [Test]
        public void A_P0StartingPresets_DivergeOnSupplyAndYeongdeungpoBulletinOnly()
        {
            CampaignState wanderer = CampaignApi.StartNewGame(
                22, StationId.Yeongdeungpo, "wanderer", StartingPreset.Wanderer);
            CampaignState stationMaster = CampaignApi.StartNewGame(
                22, StationId.Yeongdeungpo, "station-master", StartingPreset.StationMaster);

            Assert.That(wanderer.PartyMemberCount, Is.EqualTo(3));
            Assert.That(wanderer.Resources, Is.EqualTo(30));
            Assert.That(wanderer.HasStronghold, Is.False);
            Assert.That(wanderer.HasBulletin, Is.False);
            Assert.That(wanderer.OvernightCopy, Is.Not.Empty);

            Assert.That(stationMaster.PartyMemberCount, Is.EqualTo(3));
            Assert.That(stationMaster.Resources, Is.EqualTo(40));
            Assert.That(stationMaster.HasStronghold, Is.True);
            Assert.That(stationMaster.HasBulletin, Is.True);
            Assert.That(stationMaster.HomeBase, Is.EqualTo(StationId.Yeongdeungpo));

            RectTransform root = UguiHudBuilder.BuildGameplay(null);
            var presenter = new GameplayPresenter();
            Assert.That(presenter.BindForTest(root), Is.True);

            presenter.ApplySnapshot(GameplayUiSnapshot.FromCampaign(wanderer, null));
            Assert.That(UguiHudBuilder.Find(root, UiElementNames.HubOvernightCopy).gameObject.activeInHierarchy, Is.True);
            Assert.That(UguiHudBuilder.Find(root, UiElementNames.HubBulletinPanel).gameObject.activeInHierarchy, Is.False);

            presenter.ApplySnapshot(GameplayUiSnapshot.FromCampaign(stationMaster, null));
            Assert.That(UguiHudBuilder.Find(root, UiElementNames.HubOvernightCopy).gameObject.activeInHierarchy, Is.False);
            Assert.That(UguiHudBuilder.Find(root, UiElementNames.HubBulletinPanel).gameObject.activeInHierarchy, Is.True);
        }

        [Test]
        public void Gameplay_Canvas_ExposesRequiredStableNames()
        {
            RectTransform gameplayRoot = UguiHudBuilder.BuildGameplay(null);
            Assert.That(gameplayRoot.name == UiElementNames.GameplayRoot
                || UguiHudBuilder.Find(gameplayRoot, UiElementNames.GameplayRoot) != null,
                Is.True, "gameplay root must build");
            Assert.That(gameplayRoot, Is.Not.Null, "missing " + UiElementNames.GameplayRoot);

            foreach (string name in UiElementNames.GameplayRequired)
            {
                if (name == UiElementNames.GameplayRoot)
                {
                    continue;
                }

                Assert.That(UguiHudBuilder.Find(gameplayRoot, name), Is.Not.Null, "missing Canvas object name " + name);
            }

            for (int y = 0; y < 5; y++)
            {
                for (int x = 0; x < 5; x++)
                {
                    string cell = UiElementNames.BattleCell(x, y);
                    Assert.That(UguiHudBuilder.Find(gameplayRoot, cell), Is.Not.Null, "missing " + cell);
                }
            }
        }

        [Test]
        public void Gameplay_RealtimeBattleHud_ExposesStableTmpCardMoraleAndReinforcementElements()
        {
            RectTransform root = UguiHudBuilder.BuildGameplay(null);
            Assert.That(UguiHudBuilder.Find(root, UiElementNames.BattleHud), Is.Not.Null);
            Assert.That(UguiHudBuilder.Find(root, "battle-ap"), Is.Null);

            string[] required =
            {
                UiElementNames.BattleCardTray,
                UiElementNames.BattleCardOwner,
                UiElementNames.BattleCardCooldown,
                UiElementNames.BattleCardCooldownMask,
                UiElementNames.BattleCardCooldownText,
                UiElementNames.BattleCardTargetRing,
                UiElementNames.BattleCardDirectionNorth,
                UiElementNames.BattleCardDirectionEast,
                UiElementNames.BattleCardDirectionSouth,
                UiElementNames.BattleCardDirectionWest,
                UiElementNames.BattleCardCancel,
                UiElementNames.BattleCardCancelPath,
                UiElementNames.BattleMoralePlayer,
                UiElementNames.BattleMoraleEnemy,
                UiElementNames.BattleReinforcement,
            };
            foreach (string name in required)
            {
                Transform element = UguiHudBuilder.Find(root, name);
                Assert.That(element, Is.Not.Null, "missing " + name);
                if (name != UiElementNames.BattleCardCooldownMask)
                {
                    Assert.That(element.GetComponentInChildren<TMPro.TextMeshProUGUI>(true), Is.Not.Null,
                        name + " must use TMP");
                    Assert.That(element.GetComponentInChildren<UnityEngine.UI.Text>(true), Is.Null,
                        name + " must not use native Text");
                }
            }
        }

        [Test]
        public void Gameplay_RealtimeBattleHud_BindsActingCardMoraleSidesAndTelegraph()
        {
            RectTransform root = UguiHudBuilder.BuildGameplay(null);
            var presenter = new GameplayPresenter();
            Assert.That(presenter.BindForTest(root), Is.True);

            var graph = RouteGraph.CreateYeongdeungpoSindorimGuro();
            var ledger = new Ledger();
            CampaignState state = CampaignApi.Start(90421, StationId.Yeongdeungpo, "realtime-hud");
            state = (CampaignState)CampaignApi.Apply(graph, state, ledger, new CampaignCommand { Id = new CommandId("d"), Kind = CampaignCommandKind.Depart });
            state = (CampaignState)CampaignApi.Apply(graph, state, ledger, new CampaignCommand { Id = new CommandId("t"), Kind = CampaignCommandKind.Travel, TravelDestination = StationId.Sindorim });
            state = (CampaignState)CampaignApi.Apply(graph, state, ledger, new CampaignCommand { Id = new CommandId("f"), Kind = CampaignCommandKind.FaceEncounter });
            state = (CampaignState)CampaignApi.Apply(graph, state, ledger, new CampaignCommand { Id = new CommandId("r"), Kind = CampaignCommandKind.EnterResolution });
            var combat = (BattleRequired)CampaignApi.Apply(graph, state, ledger, new CampaignCommand { Id = new CommandId("c"), Kind = CampaignCommandKind.ChooseCombat });
            var battle = BattleSim.Open(BattleSetup.FromContext(combat.Context));
            state = (CampaignState)CampaignApi.AttachPendingBattle(state, ledger, combat.Context, new CommandId("a"));
            var commanderCard = System.Array.Find(battle.Cards, card => card.OwnerUnitId.Equals(battle.PlayerCommanderId) && card.Id == "encourage-morale");
            Assert.That(commanderCard, Is.Not.Null);
            commanderCard.RechargeTicksLeft = 17;

            GameplayUiSnapshot snapshot = GameplayUiSnapshot.FromCampaign(state, battle);
            presenter.ApplySnapshot(snapshot);

            Assert.That(UguiHudBuilder.Find(root, UiElementNames.BattleCardOwner).GetComponentInChildren<TMPro.TextMeshProUGUI>(true).text,
                Does.Contain(battle.PlayerCommanderId.ToString()));
            Assert.That(UguiHudBuilder.Find(root, UiElementNames.BattleCardCooldownText).GetComponentInChildren<TMPro.TextMeshProUGUI>(true).text,
                Does.Contain("17"));
            Assert.That(UguiHudBuilder.Find(root, UiElementNames.BattleMoralePlayer).GetComponentInChildren<TMPro.TextMeshProUGUI>(true).text,
                Does.Contain(battle.Sides[0].Morale.ToString()));
            Assert.That(UguiHudBuilder.Find(root, UiElementNames.BattleMoraleEnemy).GetComponentInChildren<TMPro.TextMeshProUGUI>(true).text,
                Does.Contain(battle.Sides[1].Morale.ToString()));
            Assert.That(UguiHudBuilder.Find(root, UiElementNames.BattleReinforcement).GetComponentInChildren<TMPro.TextMeshProUGUI>(true).text,
                Does.Contain("증원"));
        }

        [Test]
        public void Gameplay_Snapshot_IsDeterministic_ForRouteStageEncounterBattleSettlement()
        {
            const int seed = 90421;
            CampaignState baseState = CampaignApi.Start(seed, StationId.Yeongdeungpo, "ui-snap-campaign");
            GameplayUiSnapshot a = GameplayUiSnapshot.FromCampaign(baseState, battle: null);
            GameplayUiSnapshot b = GameplayUiSnapshot.FromCampaign(baseState.Clone(), battle: null);
            Assert.That(a.Fingerprint, Is.EqualTo(b.Fingerprint));
            Assert.That(a.VisiblePanel, Is.EqualTo(GameplayPanelId.RouteStage));
            Assert.That(a.CurrentStationElement, Is.EqualTo(UiElementNames.StationYeongdeungpo));
            Assert.That(a.CurrentStageElement, Is.EqualTo(UiElementNames.StageBasePrep));
            Assert.That(a.NamedFlags.ContainsKey(UiElementNames.StageBasePrep + ":current"), Is.True);

            // Drive to resolution (encounter choices) via public Core APIs.
            var graph = RouteGraph.CreateYeongdeungpoSindorimGuro();
            var ledger = new Ledger();
            CampaignState s = baseState;
            s = (CampaignState)CampaignApi.Apply(graph, s, ledger, new CampaignCommand
            {
                Id = new CommandId("d1"),
                Kind = CampaignCommandKind.Depart,
            });
            s = (CampaignState)CampaignApi.Apply(graph, s, ledger, new CampaignCommand
            {
                Id = new CommandId("t1"),
                Kind = CampaignCommandKind.Travel,
                TravelDestination = StationId.Sindorim,
            });
            s = (CampaignState)CampaignApi.Apply(graph, s, ledger, new CampaignCommand
            {
                Id = new CommandId("e1"),
                Kind = CampaignCommandKind.FaceEncounter,
            });
            s = (CampaignState)CampaignApi.Apply(graph, s, ledger, new CampaignCommand
            {
                Id = new CommandId("r1"),
                Kind = CampaignCommandKind.EnterResolution,
            });

            GameplayUiSnapshot encounter = GameplayUiSnapshot.FromCampaign(s, battle: null);
            Assert.That(encounter.VisiblePanel, Is.EqualTo(GameplayPanelId.Encounter));
            Assert.That(encounter.CurrentStationElement, Is.EqualTo(UiElementNames.StationSindorim));
            Assert.That(encounter.NamedFlags.ContainsKey(UiElementNames.ChoiceNegotiate + ":visible"), Is.True);
            Assert.That(encounter.NamedFlags.ContainsKey(UiElementNames.ChoiceBypass + ":visible"), Is.True);
            Assert.That(encounter.NamedFlags.ContainsKey(UiElementNames.ChoiceCombat + ":visible"), Is.True);
            Assert.That(
                GameplayUiSnapshot.FromCampaign(s.Clone(), null).Fingerprint,
                Is.EqualTo(encounter.Fingerprint));

            // Battle open from combat choice handoff on the realtime public surface.
            object combat = CampaignApi.Apply(graph, s, ledger, new CampaignCommand
            {
                Id = new CommandId("c1"),
                Kind = CampaignCommandKind.ChooseCombat,
            });
            Assert.That(combat, Is.TypeOf<BattleRequired>());
            var battleCtx = ((BattleRequired)combat).Context;
            BattleSimState battle = BattleSim.Open(BattleSetup.FromContext(battleCtx));
            object attached = CampaignApi.AttachPendingBattle(s, ledger, battleCtx, new CommandId("a1"));
            s = (CampaignState)attached;

            GameplayUiSnapshot battleSnap = GameplayUiSnapshot.FromCampaign(s, battle);
            Assert.That(battleSnap.VisiblePanel, Is.EqualTo(GameplayPanelId.Battle));
            Assert.That(battleSnap.BattleCellOccupancy.Count, Is.GreaterThan(0));
            Assert.That(
                GameplayUiSnapshot.FromCampaign(s.Clone(), battle.Clone()).Fingerprint,
                Is.EqualTo(battleSnap.Fingerprint));

            // Settlement after a real terminal realtime result.
            for (var i = 0; i < battle.Units.Length; i++)
            {
                battle.Units[i].State = "Active";
                battle.Units[i].Hp = Math.Max(1, battle.Units[i].Hp);
                battle.Units[i].MoveTicksLeft = 10000;
                battle.Units[i].CooldownTicksLeft = 10000;
            }
            battle.Tick = BattleRules.MaxTicks - 1;
            BattleSim.Step(battle, new Ledger());
            Assert.That(battle.Outcome, Is.EqualTo(BattleOutcomeKind.Draw));
            var book = new SettlementBook();
            EncounterResult result = SettlementApi.FromRealtimeResult(BattleSim.Result(battle));
            object settled = SettlementApi.Apply(s, ledger, book, result);
            Assert.That(settled, Is.TypeOf<SettlementSuccess>(),
                settled is SettlementRejection rejected ? rejected.Reason.ToString() : settled?.GetType().Name);
            s = ((SettlementSuccess)settled).State;

            GameplayUiSnapshot settlement = GameplayUiSnapshot.FromCampaign(s, battle: null);
            Assert.That(settlement.VisiblePanel, Is.EqualTo(GameplayPanelId.Settlement));
            Assert.That(settlement.NamedFlags.ContainsKey(UiElementNames.ReturnAction + ":visible"), Is.True);
            Assert.That(
                GameplayUiSnapshot.FromCampaign(s.Clone(), null).Fingerprint,
                Is.EqualTo(settlement.Fingerprint));
        }

        [Test]
        public void Gameplay_ClockLabel_MatchesCoreTick_AfterInspectCancelAndMove()
        {
            RectTransform root = UguiHudBuilder.BuildGameplay(null);
            var presenter = new GameplayPresenter();
            Assert.That(presenter.BindForTest(root), Is.True);

            var graph = RouteGraph.CreateYeongdeungpoSindorimGuro();
            var ledger = new Ledger();
            CampaignState state = CampaignApi.Start(21, StationId.Yeongdeungpo, "clock-hud");
            presenter.ApplySnapshot(GameplayUiSnapshot.FromCampaign(state, null));

            var clock = UguiHudBuilder.TextNamed(root, UiElementNames.ClockLabel);
            Assert.That(clock, Is.Not.Null, "clock-label must be present on the gameplay HUD");
            Assert.That(clock.text, Is.EqualTo(GameplayUiSnapshot.FormatClock(state.Tick)));

            string inspected = clock.text;
            presenter.ApplySnapshot(GameplayUiSnapshot.FromCampaign(state, null));
            Assert.That(clock.text, Is.EqualTo(inspected), "inspect/cancel repaint must not tick the clock");

            state = (CampaignState)CampaignApi.Apply(graph, state, ledger, new CampaignCommand
            {
                Id = new CommandId("clock-depart"),
                Kind = CampaignCommandKind.Depart,
            });
            state = (CampaignState)CampaignApi.Apply(graph, state, ledger, new CampaignCommand
            {
                Id = new CommandId("clock-move"),
                Kind = CampaignCommandKind.Travel,
                TravelDestination = StationId.Sindorim,
            });
            presenter.ApplySnapshot(GameplayUiSnapshot.FromCampaign(state, null));

            Assert.That(clock.text, Is.EqualTo(GameplayUiSnapshot.FormatClock(state.Tick)));
            Assert.That(clock.text, Is.Not.EqualTo(inspected), "confirmed movement must repaint the advanced Core clock");
        }

        [Test]
        public void Gameplay_Presenter_AppliesSnapshot_ToNamedCanvasControls()
        {
            RectTransform root = UguiHudBuilder.BuildGameplay(null);
            var presenter = new GameplayPresenter();
            Assert.That(presenter.BindForTest(root), Is.True);

            CampaignState state = CampaignApi.Start(11, StationId.Yeongdeungpo, "bind-campaign");
            GameplayUiSnapshot snap = GameplayUiSnapshot.FromCampaign(state, null);
            presenter.ApplySnapshot(snap);

            var yeong = UguiHudBuilder.ButtonNamed(root, UiElementNames.StationYeongdeungpo);
            var sindorim = UguiHudBuilder.ButtonNamed(root, UiElementNames.StationSindorim);
            Assert.That(yeong.interactable, Is.True, "station labels must stay bright for capture textLum");
            Assert.That(sindorim.interactable, Is.True, "adjacent station must stay clickable");
        }

        [Test]
        public void Gameplay_Presenter_AppliesNamedVisibleFlags_RouteStageKeepsRailsAndStationLabels()
        {
            RectTransform root = UguiHudBuilder.BuildGameplay(null);
            var presenter = new GameplayPresenter();
            Assert.That(presenter.BindForTest(root), Is.True);

            CampaignState state = CampaignApi.Start(90421, StationId.Yeongdeungpo, "named-visible-route");
            GameplayUiSnapshot snap = GameplayUiSnapshot.FromCampaign(state, null);
            Assert.That(snap.VisiblePanel, Is.EqualTo(GameplayPanelId.RouteStage));
            Assert.That(snap.NamedFlags.ContainsKey(UiElementNames.RouteRail + ":visible"), Is.True);
            Assert.That(snap.NamedFlags[UiElementNames.RouteRail + ":visible"], Is.True);
            Assert.That(snap.NamedFlags.ContainsKey(UiElementNames.StageRail + ":visible"), Is.True);
            Assert.That(snap.NamedFlags[UiElementNames.StageRail + ":visible"], Is.True);

            presenter.ApplySnapshot(snap);

            Transform routeRail = UguiHudBuilder.Find(root, UiElementNames.RouteRail);
            Transform stageRail = UguiHudBuilder.Find(root, UiElementNames.StageRail);
            Assert.That(routeRail, Is.Not.Null);
            Assert.That(stageRail, Is.Not.Null);
            Assert.That(routeRail.gameObject.activeSelf, Is.True,
                "route-rail:visible=true must keep rail active");
            Assert.That(stageRail.gameObject.activeSelf, Is.True,
                "stage-rail:visible=true must keep rail active");

            // Route-stage map labels must remain painted (capture textLum regression guard).
            var yeong = UguiHudBuilder.ButtonNamed(root, UiElementNames.StationYeongdeungpo);
            var sindorim = UguiHudBuilder.ButtonNamed(root, UiElementNames.StationSindorim);
            var guro = UguiHudBuilder.ButtonNamed(root, UiElementNames.StationGuro);
            Assert.That(yeong, Is.Not.Null);
            Assert.That(sindorim, Is.Not.Null);
            Assert.That(guro, Is.Not.Null);
            Assert.That(yeong.gameObject.activeInHierarchy, Is.True, "station-Yeongdeungpo must stay visible on route stage");
            Assert.That(sindorim.gameObject.activeInHierarchy, Is.True, "station-Sindorim must stay visible on route stage");
            Assert.That(guro.gameObject.activeInHierarchy, Is.True, "station-Guro must stay visible on route stage");
            // uGUI contract: travel gating is Core rejection + why-tooltip, never muted buttons —
            // labels must stay bright for capture textLum (doneness loop regression guard).
            Assert.That(yeong.interactable, Is.True, "station labels must remain interactable for bright text paint");
            Assert.That(sindorim.interactable, Is.True);
            Assert.That(guro.interactable, Is.True);
            Assert.That(yeong.GetComponentInChildren<UnityEngine.UI.Text>(true).text, Does.Contain("영등포"));
            Assert.That(sindorim.GetComponentInChildren<UnityEngine.UI.Text>(true).text, Does.Contain("신도림"));
            Assert.That(guro.GetComponentInChildren<UnityEngine.UI.Text>(true).text, Does.Contain("대림"));

            // Force-hide NamedFlags must apply deterministically (malformed keys ignored).
            snap.NamedFlags[UiElementNames.RouteRail + ":visible"] = false;
            snap.NamedFlags[UiElementNames.StageRail + ":visible"] = false;
            snap.NamedFlags["not-a-flag"] = true;
            snap.NamedFlags["broken:visible:extra"] = true;
            presenter.ApplySnapshot(snap);
            Assert.That(UguiHudBuilder.Find(root, UiElementNames.RouteRail).gameObject.activeSelf, Is.False,
                "route-rail:visible=false must deactivate the rail");
            Assert.That(UguiHudBuilder.Find(root, UiElementNames.StageRail).gameObject.activeSelf, Is.False,
                "stage-rail:visible=false must deactivate the rail");
        }

        [Test]
        public void MainTitle_FocusOrder_MatchesDesignContract()
        {
            var root = UguiHudBuilder.BuildMainTitle(null);
            // Coordinator is required for construction; Start is not exercised here.
            var presenter = new MainTitlePresenter(new ApplicationFlowCoordinator(new RecordingLoader()));
            Assert.That(presenter.BindForTest(root), Is.True);
            CollectionAssert.AreEqual(UiElementNames.MainTitleFocusOrder, presenter.FocusOrderNames);
        }

        [Test]
        public void Gameplay_FocusOrder_MatchesDesignContract_ForEncounterActions()
        {
            RectTransform root = UguiHudBuilder.BuildGameplay(null);
            var presenter = new GameplayPresenter();
            Assert.That(presenter.BindForTest(root), Is.True);
            CollectionAssert.AreEqual(UiElementNames.GameplayFocusOrder, presenter.FocusOrderNames);
        }

        [Test]
        public void ActiveLease_RejectsSecondCanvasScreen()
        {
            Assert.That(UiScreenDocumentLease.MaxDocumentsPerLease, Is.EqualTo(1));
            var lease = new UiScreenDocumentLease();
            Assert.That(lease.TryAttach("main-title"), Is.True);
            Assert.That(lease.TryAttach("gameplay-second"), Is.False, "second Canvas screen on same lease must be rejected");
            Assert.That(lease.AttachedCount, Is.EqualTo(1));
            lease.Detach();
            Assert.That(lease.TryAttach("gameplay"), Is.True);
            Assert.That(lease.AttachedCount, Is.EqualTo(1));
        }

        [Test]
        public void Gameplay_DonenessCopy_MissionChoicesWhyParty()
        {
            RectTransform root = UguiHudBuilder.BuildGameplay(null);
            var presenter = new GameplayPresenter();
            Assert.That(presenter.BindForTest(root), Is.True);

            CampaignState state = CampaignApi.Start(2026, StationId.Yeongdeungpo, "doneness-copy");
            GameplayUiSnapshot snap = GameplayUiSnapshot.FromCampaign(state, null);
            presenter.ApplySnapshot(snap);

            // choice costs (select-free: costs visible before confirm)
            var negotiate = UguiHudBuilder.ButtonNamed(root, UiElementNames.ChoiceNegotiate);
            var bypass = UguiHudBuilder.ButtonNamed(root, UiElementNames.ChoiceBypass);
            var combat = UguiHudBuilder.ButtonNamed(root, UiElementNames.ChoiceCombat);
            Assert.That(negotiate.GetComponentInChildren<UnityEngine.UI.Text>(true).text, Does.Contain("-5"),
                "negotiate cost must show supply -5");
            Assert.That(bypass.GetComponentInChildren<UnityEngine.UI.Text>(true).text, Does.Contain("-2"),
                "bypass cost must show supply -2");
            Assert.That(combat.GetComponentInChildren<UnityEngine.UI.Text>(true).text, Does.Contain("전투"),
                "combat row must show the fight risk");

            // mission console: purpose + fail cost
            Transform mission = UguiHudBuilder.Find(root, UiElementNames.MissionConsole);
            Assert.That(mission, Is.Not.Null, "missing mission-console");
            var missionText = mission.GetComponentInChildren<UnityEngine.UI.Text>(true);
            Assert.That(missionText.text, Does.Contain("신도림 B2"), "mission purpose");
            Assert.That(missionText.text, Does.Contain("-10"), "mission fail cost -10");

            // party strip: names + hp bound by snapshot
            var slotName = UguiHudBuilder.Find(root, "party-slot-0-name");
            Assert.That(slotName, Is.Not.Null, "missing party-slot-0-name");
            var slotText = slotName.GetComponentInChildren<UnityEngine.UI.Text>(true);
            Assert.That(slotText.text, Is.Not.Empty, "party slot must show a name");

            // why-tooltip renders anchored reasons
            presenter.ApplyWhy("직결 선로 없음. 신도림 B2 확보 후 개통.");
            var why = UguiHudBuilder.Find(root, "why-tooltip");
            Assert.That(why.GetComponentInChildren<UnityEngine.UI.Text>(true).text, Does.Contain("직결 선로 없음"),
                "why-tooltip must show the anchored reason");
        }

        [Test]
        public void Gameplay_BuildGameplayCanvas_ExposesAllRequiredNames()
        {
            RectTransform root = UguiHudBuilder.BuildGameplay(null);
            Assert.That(root, Is.Not.Null, "gameplay canvas must build");

            var missing = new System.Collections.Generic.List<string>();
            foreach (var name in UiElementNames.GameplayRequired)
            {
                if (UguiHudBuilder.Find(root, name) == null) missing.Add(name);
            }
            Assert.That(missing, Is.Empty, "missing gameplay names");

            Canvas canvas = root.GetComponentInParent<Canvas>();
            Assert.That(canvas, Is.Not.Null, "gameplay must render on a Canvas");
            var scaler = canvas.GetComponent<UnityEngine.UI.CanvasScaler>();
            Assert.That(scaler, Is.Not.Null, "gameplay canvas must have a CanvasScaler");
            Assert.That(scaler.referenceResolution, Is.EqualTo(new Vector2(1280f, 720f)));
        }


    sealed class RecordingLoader : Janseon.Foundation.AppFlow.IContentSceneLoader
    {
        readonly Dictionary<Janseon.Foundation.AppFlow.ContentScreenId, RecordingLease> leases =
            new Dictionary<Janseon.Foundation.AppFlow.ContentScreenId, RecordingLease>();

        public readonly List<Janseon.Foundation.AppFlow.ContentScreenId> Requests = new List<Janseon.Foundation.AppFlow.ContentScreenId>();

        // The coordinator awaits the Ready of the lease IT received from LoadAsync, so
        // Complete must hand back the same instance — a fresh one would hang the flow.
        public RecordingLease Complete(Janseon.Foundation.AppFlow.ContentScreenId screen)
        {
            if (!leases.TryGetValue(screen, out RecordingLease lease))
            {
                lease = new RecordingLease(screen);
                leases[screen] = lease;
            }

            return lease;
        }

        public Task<Janseon.Foundation.AppFlow.IContentSceneLease> LoadAsync(
            Janseon.Foundation.AppFlow.ContentScreenId screen, CancellationToken cancellationToken)
        {
            Requests.Add(screen);
            Janseon.Foundation.AppFlow.IContentSceneLease lease = Complete(screen);
            return Task.FromResult(lease);
        }
    }

    sealed class RecordingLease : Janseon.Foundation.AppFlow.IContentSceneLease
    {
        readonly TaskCompletionSource<bool> ready = new(TaskCreationOptions.RunContinuationsAsynchronously);
        readonly TaskCompletionSource<bool> cleaned = new(TaskCreationOptions.RunContinuationsAsynchronously);

        public RecordingLease(Janseon.Foundation.AppFlow.ContentScreenId screen)
        {
            Screen = screen;
        }

        public Janseon.Foundation.AppFlow.ContentScreenId Screen { get; }

        public Task Ready => ready.Task;

        public void CompleteReady() => ready.TrySetResult(true);

        public Task CleanupAsync()
        {
            cleaned.TrySetResult(true);
            return Task.CompletedTask;
        }

        public void CompleteCleanup() => cleaned.TrySetResult(true);

        public void Dispose()
        {
        }
    }

    }
}
