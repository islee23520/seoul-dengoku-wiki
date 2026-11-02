using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Janseon.Core;
using Janseon.Foundation.UI;

public static class StateProbe
{
    static int checks;
    static void Check(bool condition, string label)
    {
        checks++;
        if (!condition) throw new Exception("ASSERTION FAILED: " + label);
    }
    static T Need<T>(object value, string label) where T : class
    {
        Check(value is T, label + " actual=" + (value == null ? "null" : value.GetType().Name));
        return (T)value;
    }
    sealed class Run
    {
        public readonly RouteGraph Graph = RouteGraph.CreateYeongdeungpoSindorimGuro();
        public readonly Ledger Ledger = new Ledger();
        public readonly SettlementBook Book = new SettlementBook();
        public CampaignState State;
        public int Seq;
        public string Hash => CampaignApi.ComputeCampaignHash(State, Ledger);
        public readonly List<string> Receipts = new List<string>();
        public readonly List<EncounterResult> Results = new List<EncounterResult>();
        public Run(string id = "poc-core-loop") { State = CampaignApi.Start(90421, StationId.Yeongdeungpo, id); }
        public CampaignCommand Cmd(CampaignCommandKind kind, StationId to = default(StationId))
        { return new CampaignCommand { Id = new CommandId("qa-" + (++Seq) + "-" + kind), Kind = kind, TravelDestination = to }; }
        public void Do(CampaignCommandKind kind, StationId to = default(StationId))
        {
            var before = State;
            State = Need<CampaignState>(CampaignApi.Apply(Graph, State, Ledger, Cmd(kind, to)), kind.ToString());
            Check(!ReferenceEquals(before, State) && before.CampaignId == State.CampaignId, "new snapshot, same campaign identity");
        }
        public void At(int tick, int res, int rep, string label)
        {
            Check(State.Tick.Value == tick && Ledger.Events.Count == tick, label + " exact tick/events");
            Check(State.Resources == res && State.Reputation == rep, label + " exact resources/reputation");
            Check(State.CampaignId == "poc-core-loop" && State.Seed == 90421, label + " campaign/seed");
            Console.WriteLine("STATE|" + label + "|id=" + State.CampaignId + "|stage=" + State.Stage + "|node=" + State.Node + "|tick=" + State.Tick.Value + "|events=" + Ledger.Events.Count + "|res=" + State.Resources + "|rep=" + State.Reputation + "|choice=" + State.Choice + "|result=" + State.SettledResultId + "|rng=" + State.Rng.Fingerprint() + "|hash=" + Hash);
        }
        public void Resolution()
        {
            Do(CampaignCommandKind.Depart);
            Do(CampaignCommandKind.Travel, StationId.Sindorim);
            Do(CampaignCommandKind.FaceEncounter);
            Do(CampaignCommandKind.EnterResolution);
        }
        public void Retry(EncounterResult result, SettlementReceipt expected, string label)
        {
            string before = Hash; int events = Ledger.Events.Count;
            var receipt = Need<SettlementReceipt>(SettlementApi.Apply(State, Ledger, Book, result), label);
            Check(ReferenceEquals(receipt, expected) && receipt.Equals(expected), label + " exact stored receipt");
            Check(Hash == before && Ledger.Events.Count == events, label + " zero mutation");
            Console.WriteLine("RETRY|" + label + "|result=" + result.ResultId + "|receipt=" + receipt.ReceiptHash + "|hash=" + Hash + "|zeroMutation=true");
        }
        public SettlementReceipt Settle(EncounterResult result)
        {
            string before = Hash;
            var success = Need<SettlementSuccess>(SettlementApi.Apply(State, Ledger, Book, result), "settlement");
            State = success.State;
            Check(success.Receipt.BeforeCampaignHash == before && success.Receipt.AfterCampaignHash == Hash, "receipt hash binding");
            Check(State.SettledResultId == result.ResultId.Value && State.LastReceiptHash == success.Receipt.ReceiptHash && State.PendingBattle == null, "result ownership and battle clear");
            Results.Add(result); Receipts.Add(success.Receipt.ReceiptHash);
            Console.WriteLine("SETTLE|result=" + result.ResultId + "|battle=" + result.BattleId + "|outcome=" + result.Outcome + "|receipt=" + success.Receipt.ReceiptHash);
            var snapshot = GameplayUiSnapshot.FromCampaign(State, null);
            Check(snapshot.ShowReturnAction && !snapshot.ShowSettleAction, "settled snapshot return instead of settle");
            Check(snapshot.SettlementOutcomeCode.Contains(result.ResultId.Value), "snapshot result ID binding");
            Retry(result, success.Receipt, "immediate duplicate");
            return success.Receipt;
        }
        public BattleState OpenCombat(int expectedTick, int res, int rep, out Ledger battleLedger)
        {
            var oldHash = Hash;
            var required = Need<BattleRequired>(CampaignApi.Apply(Graph, State, Ledger, Cmd(CampaignCommandKind.ChooseCombat)), "combat handoff");
            var ctx = required.Context;
            Check(Hash == oldHash, "pure combat handoff");
            Check(ctx.CampaignId == State.CampaignId && ctx.Location == State.Node && ctx.WorldSeed == 90421 && ctx.WorldTick.Value == expectedTick && ctx.PartyResources == res && ctx.Reputation == rep, "context copies current campaign numeric/ID state");
            State = Need<CampaignState>(CampaignApi.AttachPendingBattle(State, Ledger, ctx, new CommandId("qa-attach-" + (++Seq))), "attach");
            var battle = BattleApi.Open(ctx); battleLedger = new Ledger();
            Check(ReferenceEquals(ctx, State.PendingBattle) && ReferenceEquals(ctx, battle.Context), "exact immutable context shared");
            Check(battle.Units.Count == 2 && battle.Units.All(u => u.Hp == 10 && u.Ap == 3), "fresh 10HP/3AP combatants");
            Check(BattleApi.FindUnit(battle,"ally-0").Position.Equals(new GridCoord(1,2)) && BattleApi.FindUnit(battle,"foe-0").Position.Equals(new GridCoord(3,2)), "fixed spawn");
            Check(battle.Width == 5 && battle.Height == 5 && battle.BattleTick.Value == 0, "fixed grid and battle tick");
            string h = Hash;
            var ongoing = SettlementApi.FromBattle(battle);
            Check(ongoing.Outcome == SettlementOutcomeKind.None, "ongoing result has no terminal outcome");
            var invalid = Need<SettlementRejection>(SettlementApi.Apply(State, Ledger, Book, ongoing), "ongoing rejected");
            Check(invalid.Reason == SettlementRejectReason.InvalidResult && Hash == h, "ongoing rejects with zero mutation");
            Console.WriteLine("BATTLE_OPEN|campaign=" + ctx.CampaignId + "|battle=" + ctx.BattleId + "|ctx=" + ctx.ContextHash + "|worldTick=" + ctx.WorldTick + "|res=" + ctx.PartyResources + "|rep=" + ctx.Reputation + "|active=" + battle.ActiveUnit.UnitId + "|allyHp=10|foeHp=10");
            return battle;
        }
    }
    static BattleState Fight(Run run, BattleState battle, Ledger ledger, bool playerWins)
    {
        string campaignHash = run.Hash;
        int allyHits = 0, foeHits = 0, commands = 0;
        while (battle.Outcome == BattleOutcomeKind.Ongoing && commands < 64)
        {
            var actor = battle.ActiveUnit;
            bool ally = actor.IsPlayer;
            int hits = ally ? allyHits : foeHits;
            bool shouldAttack = hits == 0 || ally == playerWins;
            BattleCommand cmd;
            if (shouldAttack && actor.Ap >= 2)
            {
                cmd = new BattleCommand { Kind = BattleCommandKind.RangedAttack, ActorId = actor.UnitId, TargetId = ally ? "foe-0" : "ally-0" };
                if (ally) allyHits++; else foeHits++;
            }
            else cmd = new BattleCommand { Kind = BattleCommandKind.EndTurn, ActorId = actor.UnitId };
            cmd.Id = new CommandId("qa-battle-" + commands);
            battle = Need<BattleState>(BattleApi.Apply(battle, ledger, cmd), "legal controlled battle command");
            commands++;
        }
        Check(battle.Outcome == (playerWins ? BattleOutcomeKind.PlayerVictory : BattleOutcomeKind.EnemyVictory), "controlled terminal outcome");
        Check(allyHits + foeHits == 5, "exact five ranged hits");
        Check(BattleApi.FindUnit(battle, playerWins ? "ally-0" : "foe-0").Hp == 7 && BattleApi.FindUnit(battle, playerWins ? "foe-0" : "ally-0").Hp == 0, "terminal winner 7HP loser 0HP");
        Check(run.Hash == campaignHash, "battle cannot mutate campaign or campaign ledger");
        Check(ledger.Events.Count == commands && battle.BattleTick.Value == commands, "separate battle tick/events");
        Check(GameplayUiSnapshot.FromCampaign(run.State,battle).ShowSettleAction, "terminal snapshot exposes settlement");
        Console.WriteLine("BATTLE_END|outcome=" + battle.Outcome + "|commands=" + commands + "|battleTick=" + battle.BattleTick + "|worldTick=" + run.State.Tick + "|allyHp=" + BattleApi.FindUnit(battle,"ally-0").Hp + "|foeHp=" + BattleApi.FindUnit(battle,"foe-0").Hp + "|resultHash=" + BattleApi.ComputeResultHash(battle));
        return battle;
    }
    static string Scenario(string[] expected)
    {
        var r = new Run(); var ledger = r.Ledger; var book = r.Book;
        r.At(0,100,0,"initial");
        r.Do(CampaignCommandKind.Depart);
        string before = r.Hash;
        var bad = Need<CampaignRejection>(CampaignApi.Apply(r.Graph,r.State,r.Ledger,r.Cmd(CampaignCommandKind.Travel,StationId.Guro)),"direct jump rejection");
        Check(bad.Reason == CampaignRejectReason.TravelRejected && before == r.Hash, "illegal travel zero mutation");
        bad = Need<CampaignRejection>(CampaignApi.Apply(r.Graph,r.State,r.Ledger,r.Cmd(CampaignCommandKind.Depart)),"double depart rejection");
        Check(bad.Reason == CampaignRejectReason.WrongStage && before == r.Hash,"double depart zero mutation");
        r.Do(CampaignCommandKind.Travel,StationId.Sindorim); r.Do(CampaignCommandKind.FaceEncounter); r.Do(CampaignCommandKind.EnterResolution); r.Do(CampaignCommandKind.ChooseNegotiate);
        r.At(5,100,0,"negotiate pending"); Check(r.State.PendingResourceDelta == -5 && r.State.PendingReputationDelta == 3 && r.State.ChoiceLocked,"negotiate pending deltas");
        var n = SettlementApi.FromNonCombat(r.State); Check(n.ResultId.Value == expected[0],"independently derived negotiate ID");
        var nr = r.Settle(n); r.At(6,95,3,"negotiate settled"); r.Do(CampaignCommandKind.CompleteReturn); r.At(7,95,3,"first return");
        string rng = r.State.Rng.Fingerprint();
        Check(GameplayUiSnapshot.FromCampaign(r.State,null).ShowDepartAction,"return snapshot enables next departure");
        r.Do(CampaignCommandKind.Depart); r.At(8,95,3,"second departure");
        Check(r.State.Node == StationId.Yeongdeungpo && r.State.Choice == EncounterChoice.None && !r.State.ChoiceLocked && !r.State.SettlementApplied && r.State.PendingBattle == null && r.State.SettledResultId == "" && r.State.LastReceiptHash == "" && r.State.ConsequenceId == "" && rng == r.State.Rng.Fingerprint(),"departure clears only encounter-local state");
        r.Retry(n,nr,"old result on next expedition");
        r.Do(CampaignCommandKind.Travel,StationId.Sindorim); r.Do(CampaignCommandKind.FaceEncounter); r.Do(CampaignCommandKind.EnterResolution); r.Do(CampaignCommandKind.ChooseBypass);
        r.At(12,95,3,"bypass pending"); Check(r.State.PendingResourceDelta == -2 && r.State.PendingReputationDelta == -1,"bypass pending deltas");
        var b = SettlementApi.FromNonCombat(r.State); Check(b.ResultId.Value == expected[1] && b.ResultId.Value != n.ResultId.Value,"independently derived distinct bypass ID");
        r.Settle(b); r.At(13,93,2,"bypass settled"); r.Do(CampaignCommandKind.CompleteReturn); r.At(14,93,2,"second return");
        r.Resolution(); r.At(18,93,2,"third resolution");
        var battle = r.OpenCombat(18,93,2,out var bl); battle = Fight(r,battle,bl,true);
        var win = SettlementApi.FromBattle(battle); r.Settle(win); r.At(20,103,7,"victory settled");
        before = r.Hash;
        var conflict = Need<SettlementConflict>(SettlementApi.Apply(r.State,r.Ledger,r.Book,new EncounterResult{ResultId=new ResultId("qa-conflicting-result"),BattleId=win.BattleId,Outcome=SettlementOutcomeKind.EnemyVictory,ResultHash="different"}),"same battle different payload conflict");
        Check(conflict.BattleId.Equals(win.BattleId) && r.Hash == before,"conflict zero mutation");
        Console.WriteLine("CONFLICT|type=" + conflict.GetType().Name + "|zeroMutation=true");
        r.Do(CampaignCommandKind.CompleteReturn); r.At(21,103,7,"third return");
        r.Resolution(); r.At(25,103,7,"fourth resolution");
        battle = r.OpenCombat(25,103,7,out bl); Check(battle.Context.BattleId != win.BattleId.Value,"new expedition distinct battle ID"); battle = Fight(r,battle,bl,false);
        r.Settle(SettlementApi.FromBattle(battle)); r.At(27,88,2,"defeat settled"); r.Do(CampaignCommandKind.CompleteReturn); r.At(28,88,2,"fourth return"); r.Do(CampaignCommandKind.Depart); r.At(29,88,2,"fifth departure");
        Check(ReferenceEquals(ledger,r.Ledger) && ReferenceEquals(book,r.Book),"same ledger/book lifetime");
        r.Retry(n,nr,"first result after four expeditions");
        foreach(var result in r.Results) { Check(r.Book.TryGetByResultId(result.ResultId,out var receipt,out var payload) && receipt != null,"all receipts retained"); }
        var fresh = CampaignApi.Start(90421,StationId.Yeongdeungpo,"poc-core-loop");
        Check(fresh.Resources == 100 && fresh.Reputation == 0 && fresh.Tick.Value == 0 && fresh.Rng.Fingerprint() == "seed=90421" && fresh.CampaignId == r.State.CampaignId,"same campaign ID can denote fresh reset run");
        Console.WriteLine("RESET_CHARACTERIZATION|sameCampaignId=true|resources=100|reputation=0|tick=0|newStartOnly=true");
        return r.Hash + ":" + CoreApi.ComputeLedgerHash(r.Ledger) + ":" + string.Join(",",r.Results.Select(x=>x.ResultId.Value)) + ":" + string.Join(",",r.Receipts);
    }
    static void TrustedBoundaryCharacterization()
    {
        var a = new Run("campaign-A"); var b = new Run("campaign-B"); a.Resolution(); b.Resolution();
        var required = Need<BattleRequired>(CampaignApi.Apply(a.Graph,a.State,a.Ledger,a.Cmd(CampaignCommandKind.ChooseCombat)),"foreign legitimate context");
        var attached = CampaignApi.AttachPendingBattle(b.State,b.Ledger,required.Context,new CommandId("foreign-attach"));
        var state = attached as CampaignState;
        Console.WriteLine("BOUNDARY|crossCampaignAttach|type=" + attached.GetType().Name + "|receiver=" + b.State.CampaignId + "|attachedContextCampaign=" + (state == null ? "none" : state.PendingBattle.CampaignId));
        var n = new Run("receiver-negotiate"); var bypass = new Run("sender-bypass"); n.Resolution(); bypass.Resolution(); n.Do(CampaignCommandKind.ChooseNegotiate); bypass.Do(CampaignCommandKind.ChooseBypass);
        var payload = SettlementApi.FromNonCombat(bypass.State);
        var applied = SettlementApi.Apply(n.State,n.Ledger,n.Book,payload); var success=applied as SettlementSuccess;
        Console.WriteLine("BOUNDARY|foreignNoncombatResult|type=" + applied.GetType().Name + "|originalChoice=" + n.State.Choice + "|payloadOutcome=" + payload.Outcome + "|appliedChoice=" + (success == null ? "none" : success.State.Choice.ToString()) + "|res=" + (success == null ? -999 : success.State.Resources) + "|rep=" + (success == null ? -999 : success.State.Reputation));
    }
    public static int Main(string[] args)
    {
        try
        {
            Console.WriteLine("ASSEMBLY|core=" + typeof(CampaignApi).Assembly.Location + "|mvid=" + typeof(CampaignApi).Assembly.ManifestModule.ModuleVersionId);
            Console.WriteLine("ASSEMBLY|foundation=" + typeof(GameplayUiSnapshot).Assembly.Location + "|mvid=" + typeof(GameplayUiSnapshot).Assembly.ManifestModule.ModuleVersionId);
            var expected=File.ReadAllLines(args[0]);
            string a = Scenario(expected); string b = Scenario(expected); Check(a == b,"entire consecutive sequence deterministic replay");
            Console.WriteLine("REPLAY|identical=true|final=" + a);
            TrustedBoundaryCharacterization();
            Console.WriteLine("PROBE_PASS|assertions=" + checks + "|domainIntegration=true|pureSnapshot=true|liveUI=false|unityTestsRun=false");
            return 0;
        }
        catch(Exception e) { Console.Error.WriteLine(e); return 1; }
    }
}
