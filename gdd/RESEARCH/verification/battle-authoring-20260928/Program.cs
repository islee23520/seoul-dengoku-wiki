using System;
using System.Collections.Generic;
using Janseon.Core;
using Janseon.Core.Battle.Contracts;
using Janseon.Core.Battle.Sim;
using Janseon.Data.Authoring;
using Janseon.Data.Repositories;

static class Program
{
    static int passed;
    static void Check(bool value, string name)
    {
        if (!value) throw new Exception("FAIL: " + name);
        passed++; Console.WriteLine("PASS: " + name);
    }
    static void Reject(Action action, string name)
    {
        try { action(); } catch (ArgumentException) { Check(true, name); return; }
        throw new Exception("FAIL: accepted " + name);
    }
    static BattleParticipantDefinition Unit(string id, string node) => new BattleParticipantDefinition
    {
        id = id, soldierId = "soldier-" + id, squadId = "squad-" + id, nodeId = node,
        role = "synthetic", visualKindId = "synthetic.visual", hp = 20, maxHp = 20,
        power = 3, morale = 61, rangeMaxMm = 1500, moveMillimetersPerSecond = 1000,
        radiusMm = 250, attackCooldownSeconds = .75, initialStatus = BattleUnitStatus.Active
    };
    static BattleSetupDefinition Fixture() => new BattleSetupDefinition
    {
        stableId = "synthetic", rulesVersion = "synthetic-v1",
        rules = new BattleRulesDefinition
        {
            moraleBase = 61, moraleRecoverCap = 73, moraleRecoveryPerSecond = 4, moraleLossPerDeath = 9,
            moraleLossCommanderBelowHalf = 7, surrenderMoraleMax = 19, surrenderCommanderHpPercentMax = 31,
            moraleLock = 13, maximumDurationSeconds = 12.5, decisionIntervalSeconds = .5
        },
        nodes = new[] { new BattleNodeDefinition { id = "a" }, new BattleNodeDefinition { id = "b", xMm = 1000 } },
        segments = new[] { new BattleSegmentDefinition { fromNodeId = "a", toNodeId = "b" }, new BattleSegmentDefinition { fromNodeId = "b", toNodeId = "a" } },
        playerUnits = new[] { Unit("player", "a") }, enemyUnits = new[] { Unit("enemy", "b") },
        playerCommanderId = "player", enemyCommanderId = "enemy", playerSquadId = "squad-player",
        playerHero = new BattleHeroDefinition { id = "hero", nodeId = "a", hp = 20, maxHp = 20 },
        playerRetreatNodes = new[] { "a" }, enemyRetreatNodes = new[] { "b" }, enemyObjectiveNode = "a"
    };
    static void Main()
    {
        var graph = RouteGraph.CreateYeongdeungpoSindorimGuro();
        var state = CampaignApi.Start(42, StationId.Yeongdeungpo, "synthetic-campaign", "synthetic-v1", "player", 20);
        var ledger = new Ledger();
        CampaignCommand Command(string id, CampaignCommandKind kind) => new CampaignCommand { Id = new CommandId(id), Kind = kind, TravelDestination = StationId.Sindorim };
        foreach (var kind in new[] { CampaignCommandKind.Depart, CampaignCommandKind.Travel, CampaignCommandKind.FaceEncounter, CampaignCommandKind.EnterResolution })
            state = (CampaignState)CampaignApi.Apply(graph, state, ledger, Command(kind.ToString(), kind));
        state.PartyHp = new UnitHpSnapshot(new Dictionary<string, int> { ["player"] = 7 });
        var handoff = (BattleRequired)CampaignApi.Apply(graph, state, ledger, Command("combat", CampaignCommandKind.ChooseCombat));
        var before = CampaignApi.ComputeCampaignHash(state, ledger);
        var beforeEvents = ledger.Events.Count;
        var source = Fixture();
        var repository = new BattleSetupRepository(new[] { source });
        var setup = repository.Create("synthetic", handoff.Context);
        var battle = BattleSim.Open(setup);
        Check(battle.Units[0].Hp == 7 && battle.Units[1].Hp == 20, "handoff wounded HP + authored absent-participant default");
        Check(ReferenceEquals(battle.Context, handoff.Context), "context identity retained");
        Check(battle.Heroes.Length == 1 && battle.Units.Length == 2, "explicit hero and soldier roster");
        source.playerUnits[0].maxHp = 999;
        source.nodes[0].xMm = 999;
        setup.PlayerUnits[0].Hp = 0;
        setup.PlayerHero.Hp = 0;
        setup.PlayerFormation[0].Position = new BattlePositionMm(999,0,0);
        setup.PlayerRetreatAnchors[0] = new BattlePositionMm(999,0,0);
        var next = repository.Create("synthetic", handoff.Context);
        Check(BattleSim.Open(next).Fingerprint() == battle.Fingerprint(), "catalog isolated from source + returned setup mutations");
        Reject(() => repository.Create("missing", handoff.Context), "missing catalog entry");
        Reject(() => repository.Create("synthetic", null), "missing context");
        Reject(() => new BattleSetupRepository(null), "missing catalog");
        var duplicate = Fixture();
        Reject(() => new BattleSetupRepository(new[] { duplicate, duplicate }), "duplicate catalog IDs");
        var defects = new Dictionary<string, Action<BattleSetupDefinition>>
        {
            ["wrong rules"] = x => x.rulesVersion = "wrong",
            ["missing rules"] = x => x.rules = null,
            ["missing nodes"] = x => x.nodes = null,
            ["null node"] = x => x.nodes[0] = null,
            ["duplicate nav ID"] = x => x.nodes[1].id = "a",
            ["unknown segment endpoint"] = x => x.segments[0].toNodeId = "missing",
            ["null roster"] = x => x.playerUnits = null,
            ["null participant"] = x => x.playerUnits[0] = null,
            ["unknown spawn"] = x => x.playerUnits[0].nodeId = "missing",
            ["unknown commander"] = x => x.playerCommanderId = "missing",
            ["unknown retreat"] = x => x.playerRetreatNodes[0] = "missing",
            ["missing retreat array"] = x => x.playerRetreatNodes = null,
            ["unknown objective"] = x => x.enemyObjectiveNode = "missing",
            ["duplicate unit IDs"] = x => x.enemyUnits[0].id = "player",
            ["duplicate soldier IDs"] = x => x.enemyUnits[0].soldierId = "soldier-player",
            ["unknown handoff participant"] = x => { x.playerUnits[0].id = "other"; x.playerCommanderId = "other"; },
            ["HP max differs from handoff"] = x => x.playerUnits[0].maxHp++,
            ["invalid authored HP cannot be hidden by handoff"] = x => x.playerUnits[0].hp = -1,
            ["invalid hero HP"] = x => x.playerHero.hp = -1,
            ["NaN duration"] = x => x.rules.maximumDurationSeconds = double.NaN,
            ["infinite decision interval"] = x => x.rules.decisionIntervalSeconds = double.PositiveInfinity,
            ["infinite attack cooldown"] = x => x.playerUnits[0].attackCooldownSeconds = double.PositiveInfinity,
            ["NaN morale"] = x => x.playerUnits[0].morale = float.NaN,
            ["invalid enum"] = x => x.playerUnits[0].initialStatus = (BattleUnitStatus)99,
            ["missing visual ID"] = x => x.playerUnits[0].visualKindId = null,
            ["missing radius"] = x => x.playerUnits[0].radiusMm = 0
        };
        foreach (var defect in defects)
        {
            var data = Fixture(); defect.Value(data);
            Reject(() => new BattleSetupRepository(new[] { data }).Create("synthetic", handoff.Context), defect.Key);
            Check(CampaignApi.ComputeCampaignHash(state, ledger) == before && ledger.Events.Count == beforeEvents && state.PendingBattle == null,
                "campaign + ledger unchanged after " + defect.Key);
        }
        var attached = (CampaignState)CampaignApi.AttachPendingBattle(state, ledger, next.Context, new CommandId("attach"));
        Check(ReferenceEquals(attached.PendingBattle, handoff.Context) && state.PendingBattle == null, "explicit successful attach returns new campaign snapshot");
        Check(attached.Tick.Value == state.Tick.Value && ledger.Events.Count == beforeEvents + 1, "attachment one event + no campaign time");
        Console.WriteLine("DOTNET_ENGINE_FREE_CHECKS_PASSED=" + passed);
    }
}
