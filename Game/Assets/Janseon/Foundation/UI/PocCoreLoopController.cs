using System;
using System.Globalization;
using Janseon.Core;
using Janseon.Core.Battle.Contracts;
using Janseon.Core.Battle.Sim;
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

        RouteGraph graph;
        CampaignState campaign;
        Ledger campaignLedger;
        Ledger battleLedger;
        SettlementBook book;
        BattleSimState battle;
        int commandSeq;
        bool wired;
        bool disposed;
        PlaceholderVoxelWorld voxelWorld;

        public PocCoreLoopController(GameplayPresenter presenter, GameplayUiHost host)
        {
            this.presenter = presenter ?? throw new ArgumentNullException(nameof(presenter));
            this.host = host ?? throw new ArgumentNullException(nameof(host));
        }

        public CampaignState Campaign => campaign;
        public BattleSimState Battle => battle;
        public Ledger CampaignLedger => campaignLedger;
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
            WirePresenter();
            EnsureVoxelWorld();
            BeginNewRun(DefaultSeed, DefaultCampaignId);
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
            LastReceipt = null;
            LastDuplicateReceipt = null;
            LastSettledResult = null;
            LastRejection = null;
            LastClickedAction = string.Empty;
            commandSeq = 0;
            campaign = CampaignApi.Start(seed, StationId.Yeongdeungpo, campaignId);
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
            presenter.FaceEncounterChosen += OnFace;
            presenter.EnterResolutionChosen += OnEnterResolution;
            presenter.NegotiateChosen += OnNegotiate;
            presenter.BypassChosen += OnBypass;
            presenter.CombatChosen += OnCombat;
            presenter.BattleAdvanceChosen += OnBattleAdvance;
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
            presenter.FaceEncounterChosen -= OnFace;
            presenter.EnterResolutionChosen -= OnEnterResolution;
            presenter.NegotiateChosen -= OnNegotiate;
            presenter.BypassChosen -= OnBypass;
            presenter.CombatChosen -= OnCombat;
            presenter.BattleAdvanceChosen -= OnBattleAdvance;
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
                    campaign = next; battleLedger = new Ledger(); battle = BattleSim.Open(BattleSetup.FromContext(required.Context)); LastRejection = null; Publish(); return;
                }
                Reject(attached); return;
            }
            Reject(result);
        }

        void OnBattleAdvance()
        {
            LastClickedAction = UiElementNames.BattleAdvance;
            if (battle == null || battle.Outcome != BattleOutcomeKind.Ongoing)
            { Reject(new BattleRejection { Reason = BattleRejectReason.BattleEnded }); return; }
            for (var i = 0; i < 8 && battle.Outcome == BattleOutcomeKind.Ongoing; i++) BattleSim.Step(battle, battleLedger);
            commandSeq++; LastRejection = null; Publish();
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
            if (applied is SettlementSuccess success) { campaign = success.State; LastReceipt = success.Receipt; LastSettledResult = CloneResult(resultPayload); LastDuplicateReceipt = null; LastRejection = null; battle = null; Publish(); return; }
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
            CommandRejected?.Invoke(rejection);
            StateChanged?.Invoke();
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

            Camera camera = Camera.main;
            voxelWorld = PlaceholderVoxelWorld.Create(null, camera);
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
            };
        }


    }
}
