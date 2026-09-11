using System;
using System.Globalization;
using Janseon.Core;
using Janseon.Core.Battle.Contracts;
using Janseon.Core.Battle.Sim;
using Janseon.Foundation.AppFlow;
using Janseon.Foundation.Battle;
using Janseon.Foundation.Composition;
using Janseon.Foundation.Presentation;
using UnityEngine;
using VContainer.Unity;

namespace Janseon.Foundation.UI
{
    /// <summary>
    /// Scoped POC session: owns CampaignState/Ledger/SettlementBook/Battle and wires
    /// GameplayPresenter action events to Core APIs. No static state, no SceneManager.
    /// </summary>
    public sealed class PocCoreLoopController : IPocCoreLoopSession, IStartable, IDisposable
    {
        public const int DefaultSeed = 90421;
        public const string DefaultCampaignId = "poc-core-loop";

        readonly GameplayPresenter presenter;
        readonly GameplayUiHost host;
        readonly ApplicationFlowCoordinator coordinator;
        readonly BattleSessionDriver battleDriver;

        RouteGraph graph;
        CampaignState campaign;
        Ledger campaignLedger;
        Ledger battleLedger;
        SettlementBook book;
        BattleSimState battle;
        int commandSeq;
        bool wired;
        bool disposed;
        HeightmapVoxelWorld voxelWorld;

        public PocCoreLoopController(
            GameplayPresenter presenter,
            GameplayUiHost host,
            ApplicationFlowCoordinator coordinator,
            BattleSessionDriver battleDriver)
        {
            this.presenter = presenter ?? throw new ArgumentNullException(nameof(presenter));
            this.host = host ?? throw new ArgumentNullException(nameof(host));
            this.coordinator = coordinator ?? throw new ArgumentNullException(nameof(coordinator));
            this.battleDriver = battleDriver ?? throw new ArgumentNullException(nameof(battleDriver));
        }

        public CampaignState Campaign => campaign;
        public BattleSimState Battle => battle;
        public Ledger CampaignLedger => campaignLedger;
        public Ledger BattleLedger => battleLedger;
        public bool BattlePaused => battleDriver.Paused;
        public SettlementBook Book => book;
        public SettlementReceipt LastReceipt { get; private set; }
        public SettlementReceipt LastDuplicateReceipt { get; private set; }
        public EncounterResult LastSettledResult { get; private set; }
        public object LastRejection { get; private set; }
        public string LastClickedAction { get; private set; } = string.Empty;
        public int CommandSequence => commandSeq;
        public bool IsReady { get; private set; }

        public string CampaignHash
            => campaign == null ? string.Empty : CampaignApi.ComputeCampaignHash(campaign, campaignLedger);

        public string BattleHash
            => battle == null ? string.Empty : battle == null ? string.Empty : battle.Fingerprint();

        public event Action StateChanged;
        public event Action<object> CommandRejected;

        public void Start()
        {
            if (disposed)
            {
                return;
            }

            host.AttachLoop(this);
            battleDriver.CommandRejected += OnDriverCommandRejected;
            battleDriver.StateAdvanced += OnBattleStateAdvanced;
            WirePresenter();
            BeginNewRun(DefaultSeed, DefaultCampaignId);
            EnsureVoxelWorld();
            voxelWorld?.SyncActor(campaign.Node);
            IsReady = true;
        }

        public void Dispose()
        {
            if (disposed)
            {
                return;
            }

            disposed = true;
            UnwirePresenter();
            battleDriver.CommandRejected -= OnDriverCommandRejected;
            battleDriver.StateAdvanced -= OnBattleStateAdvanced;
            battleDriver.Detach();
            if (voxelWorld != null)
            {
                UnityEngine.Object.Destroy(voxelWorld.gameObject);
                voxelWorld = null;
            }
            IsReady = false;
        }

        public void BeginNewRun(int seed, string campaignId)
        {
            graph = RouteGraph.CreateYeongdeungpoSindorimGuro();
            campaignLedger = new Ledger();
            battleLedger = new Ledger();
            book = new SettlementBook();
            battle = null;
            battleDriver.Detach();
            LastReceipt = null;
            LastDuplicateReceipt = null;
            LastSettledResult = null;
            LastRejection = null;
            LastClickedAction = string.Empty;
            commandSeq = 0;
            campaign = CampaignApi.StartNewGame(
                seed,
                StationId.Yeongdeungpo,
                campaignId,
                coordinator.SelectedStartingPreset);
            voxelWorld?.SyncActor(campaign.Node);
            Publish();
        }

        void WirePresenter()
        {
            if (wired || presenter == null)
            {
                return;
            }

            presenter.DepartChosen += OnDepart;
            presenter.TravelChosen += OnTravel;
            presenter.DeploymentParticipationChosen += OnDeploymentParticipation;
            presenter.FaceEncounterChosen += OnFace;
            presenter.EnterResolutionChosen += OnEnterResolution;
            presenter.NegotiateChosen += OnNegotiate;
            presenter.BypassChosen += OnBypass;
            presenter.CombatChosen += OnCombat;
            presenter.BattleAdvanceChosen += OnBattleAdvance;
            presenter.MobilityRegroupChosen += OnMobilityRegroup;
            presenter.SettleChosen += OnSettle;
            presenter.ReturnChosen += OnReturn;
            wired = true;
        }

        void UnwirePresenter()
        {
            if (!wired || presenter == null)
            {
                return;
            }

            presenter.DepartChosen -= OnDepart;
            presenter.TravelChosen -= OnTravel;
            presenter.DeploymentParticipationChosen -= OnDeploymentParticipation;
            presenter.FaceEncounterChosen -= OnFace;
            presenter.EnterResolutionChosen -= OnEnterResolution;
            presenter.NegotiateChosen -= OnNegotiate;
            presenter.BypassChosen -= OnBypass;
            presenter.CombatChosen -= OnCombat;
            presenter.BattleAdvanceChosen -= OnBattleAdvance;
            presenter.MobilityRegroupChosen -= OnMobilityRegroup;
            presenter.SettleChosen -= OnSettle;
            presenter.ReturnChosen -= OnReturn;
            wired = false;
        }

        void OnDepart()
        {
            LastClickedAction = UiElementNames.ActionDepart;
            ApplyCampaign(new CampaignCommand
            {
                Id = NextCommandId("depart"),
                Kind = CampaignCommandKind.Depart,
            });
        }

        void OnTravel(StationId destination)
        {
            LastClickedAction = GameplayUiSnapshot.StationElement(destination);
            ApplyCampaign(new CampaignCommand
            {
                Id = NextCommandId("travel-" + (destination.Value ?? string.Empty)),
                Kind = CampaignCommandKind.Travel,
                TravelDestination = destination,
            });
        }

        void OnDeploymentParticipation(int rosterIndex, bool participating)
        {
            LastClickedAction = UiElementNames.DeployToggle(rosterIndex);
            if (campaign == null || rosterIndex < 0 || rosterIndex >= campaign.PartyMemberCount) return;
            object result = CampaignApi.SetDeploymentParticipation(
                campaign,
                DeploymentApi.UnitId(rosterIndex),
                participating,
                explicitWoundedOverride: false);
            if (result is CampaignState next)
            {
                campaign = next;
                LastRejection = null;
                Publish();
                return;
            }
            Reject(result);
            Publish();
        }

        void OnFace()
        {
            LastClickedAction = UiElementNames.ActionFaceEncounter;
            ApplyCampaign(new CampaignCommand
            {
                Id = NextCommandId("face"),
                Kind = CampaignCommandKind.FaceEncounter,
            });
        }

        void OnEnterResolution()
        {
            LastClickedAction = UiElementNames.ActionEnterResolution;
            ApplyCampaign(new CampaignCommand
            {
                Id = NextCommandId("enter"),
                Kind = CampaignCommandKind.EnterResolution,
            });
        }

        void OnNegotiate()
        {
            LastClickedAction = UiElementNames.ChoiceNegotiate;
            ApplyCampaign(new CampaignCommand
            {
                Id = NextCommandId("nego"),
                Kind = CampaignCommandKind.ChooseNegotiate,
            });
        }

        void OnBypass()
        {
            LastClickedAction = UiElementNames.ChoiceBypass;
            ApplyCampaign(new CampaignCommand
            {
                Id = NextCommandId("bypass"),
                Kind = CampaignCommandKind.ChooseBypass,
            });
        }

        void OnCombat()
        {
            LastClickedAction = UiElementNames.ChoiceCombat;
            if (campaign == null || graph == null || campaignLedger == null) return;
            object result = CampaignApi.Apply(graph, campaign, campaignLedger, new CampaignCommand { Id = NextCommandId("combat"), Kind = CampaignCommandKind.ChooseCombat });
            if (result is BattleRequired required)
            {
                object attached = CampaignApi.AttachPendingBattle(campaign, campaignLedger, required.Context, NextCommandId("attach"));
                if (attached is CampaignState next)
                {
                    campaign = next;
                    battleLedger = new Ledger();
                    var setup = BattleSetup.FromContext(required.Context);
                    battle = BattleSim.Open(setup);
                    battleDriver.Attach(battle, battleLedger);
                    var deploy = new BattleTickCommand
                    {
                        Id = NextCommandId("deploy"),
                        Seq = commandSeq,
                        At = new Tick(battle.Tick),
                        Kind = BattleTickCommandKind.Deploy,
                        Formation = setup.PlayerFormation,
                    };
                    battleDriver.Enqueue(deploy);
                    battleDriver.SubmitCurrentCommands();
                    if (LastRejection is BattleRejection) return;
                    LastRejection = null;
                    Publish();
                    return;
                }
                Reject(attached); return;
            }
            Reject(result);
        }

        void OnMobilityRegroup()
        {
            LastClickedAction = UiElementNames.MobilityRegroup;
            if (battle == null) return;
            UnitState commander = null;
            for (var i = 0; i < battle.Units.Length; i++)
                if (battle.Units[i].Id.Equals(battle.PlayerCommanderId)) { commander = battle.Units[i]; break; }
            if (commander == null) return;
            var command = new BattleTickCommand
            {
                Id = NextCommandId("mobility-regroup"),
                Seq = commandSeq,
                At = new Tick(battle.Tick),
                Kind = BattleTickCommandKind.PlayCard,
                CardId = "mobility-regroup",
                Target = commander.Cell,
                Facing = CardinalDirection.South,
            };
            battleDriver.Enqueue(command);
            battleDriver.SubmitCurrentCommands();
            if (LastRejection is BattleRejection) return;
            LastRejection = null;
            Publish();
        }

        void OnBattleAdvance()
        {
            LastClickedAction = UiElementNames.BattleAdvance;
            if (battle == null || battle.Outcome != BattleOutcomeKind.Ongoing)
            { Reject(new BattleRejection { Reason = BattleRejectReason.BattleEnded }); return; }
            battleDriver.Paused = !battleDriver.Paused;
            LastRejection = null;
            Publish();
        }

        void OnSettle()
        {
            LastClickedAction = UiElementNames.ActionSettle;
            if (campaign == null || campaignLedger == null || book == null) return;
            EncounterResult resultPayload = null;
            if (campaign.SettlementApplied && LastSettledResult != null) resultPayload = CloneResult(LastSettledResult);
            else if (campaign.PendingBattle != null && battle != null && battle.Outcome != BattleOutcomeKind.Ongoing) resultPayload = BattleSim.Result(battle).ToEncounterResult();
            else if (campaign.Stage == CampaignStage.Settlement && campaign.Choice != EncounterChoice.None && campaign.Choice != EncounterChoice.Combat && !campaign.SettlementApplied) resultPayload = SettlementApi.FromNonCombat(campaign);
            if (resultPayload == null) { Reject(new SettlementRejection(SettlementRejectReason.MissingResolution, campaign.Stage, default)); return; }
            object applied = SettlementApi.Apply(campaign, campaignLedger, book, resultPayload);
            if (applied is SettlementSuccess success) { campaign = success.State; LastReceipt = success.Receipt; LastSettledResult = CloneResult(resultPayload); LastDuplicateReceipt = null; LastRejection = null; battleDriver.Detach(); battle = null; Publish(); return; }
            if (applied is SettlementReceipt duplicate) { LastDuplicateReceipt = duplicate; LastRejection = null; Publish(); return; }
            Reject(applied);
        }

        void OnReturn()
        {
            LastClickedAction = UiElementNames.ReturnAction;
            ApplyCampaign(new CampaignCommand
            {
                Id = NextCommandId("return"),
                Kind = CampaignCommandKind.CompleteReturn,
            });
        }

        void ApplyCampaign(CampaignCommand cmd)
        {
            if (campaign == null || graph == null || campaignLedger == null)
            {
                return;
            }

            object result = CampaignApi.Apply(graph, campaign, campaignLedger, cmd);
            if (result is CampaignState next)
            {
                campaign = next;
                LastRejection = null;
                Publish();
                return;
            }

            Reject(result);
        }

        void Reject(object rejection)
        {
            LastRejection = rejection;
            host.ApplyWhy(FormatWhy(rejection));
            CommandRejected?.Invoke(rejection);
            StateChanged?.Invoke();
        }

        void OnDriverCommandRejected(object rejection) => Reject(rejection);

        void OnBattleStateAdvanced()
        {
            if (battle != null) Publish();
        }

        static string FormatWhy(object rejection)
        {
            switch (rejection)
            {
                case BattleRejection battleRejection:
                    return "�� �Ұ�: " + battleRejection.Reason;
                case CampaignRejection campaignRejection:
                    return "�� �Ұ�: " + campaignRejection.Reason + " �� �ܰ� " + campaignRejection.Stage;
                case SettlementRejection settlementRejection:
                    return "�� �Ұ�: " + settlementRejection.Reason;
                case DeploymentRejection deploymentRejection:
                    return "�� �Ұ�: " + deploymentRejection.Reason + " �� " + deploymentRejection.UnitId;
                default:
                    return rejection == null ? string.Empty : rejection.ToString();
            }
        }

        void Publish()
        {
            host.ApplyCampaign(campaign, battle);
            if (campaign != null)
            {
                voxelWorld?.SyncActor(campaign.Node);
            }
            StateChanged?.Invoke();
        }

        void EnsureVoxelWorld()
        {
            if (voxelWorld != null)
            {
                return;
            }

            Camera camera = host != null ? host.StationCamera : null;
            if (camera == null) camera = Camera.main;
            if (camera == null) throw new InvalidOperationException("Foundation Main Camera missing.");
            LayerId layer = campaign != null && campaign.Node.Equals(StationId.Sindorim) ? LayerId.B2 : LayerId.B1;
            voxelWorld = HeightmapVoxelWorld.Create(null, camera, campaign != null ? campaign.Seed : DefaultSeed, layer);
            voxelWorld.PlaceStationProps(host != null ? host.StationPropsRoot : null);
        }

        CommandId NextCommandId(string kind)
        {
            commandSeq++;
            return new CommandId(
                "poc-" + kind + "-" + commandSeq.ToString(CultureInfo.InvariantCulture));
        }

        static EncounterResult CloneResult(EncounterResult source)
        {
            if (source == null)
            {
                return null;
            }

            return new EncounterResult
            {
                ResultId = source.ResultId,
                BattleId = source.BattleId,
                Outcome = source.Outcome,
                ResultHash = source.ResultHash,
                UnitHp = source.UnitHp,
            };
        }


    }
}
