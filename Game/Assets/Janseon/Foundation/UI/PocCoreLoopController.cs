using System;
using System.Globalization;
using Janseon.Core;
using Janseon.Foundation.Composition;
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
        BattleState battle;
        int commandSeq;
        bool wired;
        bool disposed;

        public PocCoreLoopController(GameplayPresenter presenter, GameplayUiHost host)
        {
            this.presenter = presenter ?? throw new ArgumentNullException(nameof(presenter));
            this.host = host ?? throw new ArgumentNullException(nameof(host));
        }

        public CampaignState Campaign => campaign;
        public BattleState Battle => battle;
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
            => battle == null ? string.Empty : BattleApi.ComputeBattleHash(battle, battleLedger);

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
            if (campaign == null || graph == null || campaignLedger == null)
            {
                return;
            }

            var cmd = new CampaignCommand
            {
                Id = NextCommandId("combat"),
                Kind = CampaignCommandKind.ChooseCombat,
            };
            object result = CampaignApi.Apply(graph, campaign, campaignLedger, cmd);
            if (result is BattleRequired required)
            {
                object attached = CampaignApi.AttachPendingBattle(
                    campaign,
                    campaignLedger,
                    required.Context,
                    NextCommandId("attach"));
                if (attached is CampaignState next)
                {
                    campaign = next;
                    battleLedger = new Ledger();
                    battle = BattleApi.Open(required.Context);
                    LastRejection = null;
                    Publish();
                    return;
                }

                Reject(attached);
                return;
            }

            Reject(result);
        }

        void OnBattleAdvance()
        {
            LastClickedAction = UiElementNames.BattleAdvance;
            if (battle == null || battle.Outcome != BattleOutcomeKind.Ongoing)
            {
                Reject(new BattleRejection(BattleRejectReason.BattleEnded, string.Empty, BattleCommandKind.EndTurn));
                return;
            }

            object lastReject = null;
            BattleCommand[] candidates = BuildDeterministicBattleCandidates(battle, commandSeq);
            for (var i = 0; i < candidates.Length; i++)
            {
                BattleCommand cmd = candidates[i];
                if (cmd == null)
                {
                    continue;
                }

                object result = BattleApi.Apply(battle, battleLedger, cmd);
                if (result is BattleState next)
                {
                    battle = next;
                    commandSeq++;
                    LastRejection = null;
                    Publish();
                    return;
                }

                lastReject = result;
            }

            Reject(lastReject
                   ?? new BattleRejection(BattleRejectReason.InvalidTarget, string.Empty, BattleCommandKind.EndTurn));
        }

        void OnSettle()
        {
            LastClickedAction = UiElementNames.ActionSettle;
            if (campaign == null || campaignLedger == null || book == null)
            {
                return;
            }

            EncounterResult resultPayload = null;
            if (campaign.SettlementApplied && LastSettledResult != null)
            {
                resultPayload = CloneResult(LastSettledResult);
            }
            else if (campaign.PendingBattle != null && battle != null
                     && battle.Outcome != BattleOutcomeKind.Ongoing)
            {
                resultPayload = SettlementApi.FromBattle(battle);
            }
            else if (campaign.Stage == CampaignStage.Settlement
                     && campaign.Choice != EncounterChoice.None
                     && campaign.Choice != EncounterChoice.Combat
                     && !campaign.SettlementApplied)
            {
                resultPayload = SettlementApi.FromNonCombat(campaign);
            }

            if (resultPayload == null)
            {
                Reject(new SettlementRejection(
                    SettlementRejectReason.MissingResolution,
                    campaign.Stage,
                    default));
                return;
            }

            string beforeHash = CampaignHash;
            int beforeRes = campaign.Resources;
            int beforeRep = campaign.Reputation;
            int beforeEvents = campaignLedger.Events.Count;

            object applied = SettlementApi.Apply(campaign, campaignLedger, book, resultPayload);
            if (applied is SettlementSuccess success)
            {
                campaign = success.State;
                LastReceipt = success.Receipt;
                LastSettledResult = CloneResult(resultPayload);
                LastDuplicateReceipt = null;
                LastRejection = null;
                battle = null;
                Publish();
                return;
            }

            if (applied is SettlementReceipt duplicate)
            {
                LastDuplicateReceipt = duplicate;
                LastRejection = null;
                if (!string.Equals(beforeHash, CampaignHash, StringComparison.Ordinal)
                    || beforeRes != campaign.Resources
                    || beforeRep != campaign.Reputation
                    || beforeEvents != campaignLedger.Events.Count)
                {
                    throw new InvalidOperationException("exact-once duplicate mutated campaign state");
                }

                Publish();
                return;
            }

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
            StateChanged?.Invoke();
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

        static BattleCommand[] BuildDeterministicBattleCandidates(BattleState state, int seq)
        {
            var actor = state.ActiveUnit;
            if (actor == null)
            {
                return System.Array.Empty<BattleCommand>();
            }

            BattleUnit foe = null;
            for (var i = 0; i < state.Units.Count; i++)
            {
                var u = state.Units[i];
                if (u != null && !string.Equals(u.UnitId, actor.UnitId, StringComparison.Ordinal))
                {
                    foe = u;
                    break;
                }
            }

            string tag = seq.ToString(CultureInfo.InvariantCulture);
            var list = new System.Collections.Generic.List<BattleCommand>(6);
            if (foe != null && !foe.IsDowned)
            {
                int dist = actor.Position.ManhattanTo(foe.Position);
                if (dist <= BattleApi.MeleeRange && actor.Ap >= BattleApi.MeleeApCost)
                {
                    list.Add(new BattleCommand
                    {
                        Id = new CommandId("b-melee-" + tag),
                        Kind = BattleCommandKind.MeleeAttack,
                        ActorId = actor.UnitId,
                        TargetId = foe.UnitId,
                    });
                }

                if (dist <= BattleApi.RangedRange && actor.Ap >= BattleApi.RangedApCost)
                {
                    list.Add(new BattleCommand
                    {
                        Id = new CommandId("b-ranged-" + tag),
                        Kind = BattleCommandKind.RangedAttack,
                        ActorId = actor.UnitId,
                        TargetId = foe.UnitId,
                    });
                }

                if (actor.Ap >= BattleApi.MoveApCost)
                {
                    int dx = Math.Sign(foe.Position.X - actor.Position.X);
                    int dy = Math.Sign(foe.Position.Y - actor.Position.Y);
                    if (dx != 0)
                    {
                        list.Add(new BattleCommand
                        {
                            Id = new CommandId("b-mx-" + tag),
                            Kind = BattleCommandKind.Move,
                            ActorId = actor.UnitId,
                            Dx = dx,
                            Dy = 0,
                        });
                    }

                    if (dy != 0)
                    {
                        list.Add(new BattleCommand
                        {
                            Id = new CommandId("b-my-" + tag),
                            Kind = BattleCommandKind.Move,
                            ActorId = actor.UnitId,
                            Dx = 0,
                            Dy = dy,
                        });
                    }

                    // Cardinal fallbacks if direct axis blocked.
                    list.Add(new BattleCommand
                    {
                        Id = new CommandId("b-mn-" + tag),
                        Kind = BattleCommandKind.Move,
                        ActorId = actor.UnitId,
                        Dx = 0,
                        Dy = 1,
                    });
                    list.Add(new BattleCommand
                    {
                        Id = new CommandId("b-me-" + tag),
                        Kind = BattleCommandKind.Move,
                        ActorId = actor.UnitId,
                        Dx = 1,
                        Dy = 0,
                    });
                    list.Add(new BattleCommand
                    {
                        Id = new CommandId("b-ms-" + tag),
                        Kind = BattleCommandKind.Move,
                        ActorId = actor.UnitId,
                        Dx = 0,
                        Dy = -1,
                    });
                    list.Add(new BattleCommand
                    {
                        Id = new CommandId("b-mw-" + tag),
                        Kind = BattleCommandKind.Move,
                        ActorId = actor.UnitId,
                        Dx = -1,
                        Dy = 0,
                    });
                }
            }

            list.Add(new BattleCommand
            {
                Id = new CommandId("b-end-" + tag),
                Kind = BattleCommandKind.EndTurn,
                ActorId = actor.UnitId,
            });
            return list.ToArray();
        }
    }
}
