using System;
using System.IO;
using System.Text;
using Janseon.Core;
using NUnit.Framework;
using UnityEngine;

namespace Janseon.Tests.EditMode
{
    [TestFixture]
    public class RouteTraversalTests
    {
        static RouteGraph PocGraph() => RouteGraph.CreateYeongdeungpoSindorimGuro();

        static RouteState StartAtYeongdeungpo()
        {
            return RouteApi.StartAt(StationId.Yeongdeungpo, new Tick(0));
        }

        static TravelCommand Cmd(string id, StationId to)
        {
            return new TravelCommand
            {
                Id = new CommandId(id),
                Destination = to
            };
        }

        [Test]
        public void AdjacentLinks_AreLegal_BothDirections()
        {
            var graph = PocGraph();
            Assert.IsTrue(graph.AreAdjacent(StationId.Yeongdeungpo, StationId.Sindorim));
            Assert.IsTrue(graph.AreAdjacent(StationId.Sindorim, StationId.Yeongdeungpo));
            Assert.IsTrue(graph.AreAdjacent(StationId.Sindorim, StationId.Guro));
            Assert.IsTrue(graph.AreAdjacent(StationId.Guro, StationId.Sindorim));

            var state = StartAtYeongdeungpo();
            var ledger = new Ledger();
            var r1 = RouteApi.TryTravel(graph, state, ledger, Cmd("t-ys", StationId.Sindorim));
            Assert.IsInstanceOf<RouteState>(r1, "Yeongdeungpo->Sindorim must be legal");
            state = (RouteState)r1;
            Assert.AreEqual(StationId.Sindorim, state.Current);
            Assert.AreEqual(1, state.Tick.Value);

            var r2 = RouteApi.TryTravel(graph, state, ledger, Cmd("t-sg", StationId.Guro));
            Assert.IsInstanceOf<RouteState>(r2, "Sindorim->Guro must be legal");
            state = (RouteState)r2;
            Assert.AreEqual(StationId.Guro, state.Current);

            var r3 = RouteApi.TryTravel(graph, state, ledger, Cmd("t-gs", StationId.Sindorim));
            Assert.IsInstanceOf<RouteState>(r3, "Guro->Sindorim must be legal");
            state = (RouteState)r3;
            Assert.AreEqual(StationId.Sindorim, state.Current);

            var r4 = RouteApi.TryTravel(graph, state, ledger, Cmd("t-sy", StationId.Yeongdeungpo));
            Assert.IsInstanceOf<RouteState>(r4, "Sindorim->Yeongdeungpo must be legal");
            state = (RouteState)r4;
            Assert.AreEqual(StationId.Yeongdeungpo, state.Current);
        }

        [Test]
        public void NoDirectYeongdeungpoGuroJump_RejectsWithoutMutation()
        {
            var graph = PocGraph();
            Assert.IsFalse(graph.AreAdjacent(StationId.Yeongdeungpo, StationId.Guro));
            Assert.IsFalse(graph.AreAdjacent(StationId.Guro, StationId.Yeongdeungpo));

            var state = StartAtYeongdeungpo();
            var ledger = new Ledger();
            var beforeHash = RouteApi.ComputeRouteHash(state, ledger);
            var beforeTick = state.Tick.Value;
            var beforeNode = state.Current;
            var beforeEvents = ledger.Events.Count;

            var result = RouteApi.TryTravel(graph, state, ledger, Cmd("t-illegal-yg", StationId.Guro));
            Assert.IsInstanceOf<TravelRejection>(result, "Direct Yeongdeungpo->Guro must be typed rejection");
            var rejection = (TravelRejection)result;
            Assert.AreEqual(TravelRejectReason.NotAdjacent, rejection.Reason);

            Assert.AreEqual(beforeTick, state.Tick.Value, "Invalid travel must not advance tick");
            Assert.AreEqual(beforeNode, state.Current, "Invalid travel must not move current node");
            Assert.AreEqual(beforeEvents, ledger.Events.Count, "Invalid travel must not append ledger events");
            Assert.AreEqual(beforeHash, RouteApi.ComputeRouteHash(state, ledger), "Invalid travel must not change route hash");
        }

        [Test]
        public void SameCommandsProduceSameRouteStateAndHash()
        {
            var graph = PocGraph();

            string Run()
            {
                var state = StartAtYeongdeungpo();
                var ledger = new Ledger();
                state = (RouteState)RouteApi.TryTravel(graph, state, ledger, Cmd("cmd-a", StationId.Sindorim));
                state = (RouteState)RouteApi.TryTravel(graph, state, ledger, Cmd("cmd-b", StationId.Guro));
                return RouteApi.ComputeRouteHash(state, ledger);
            }

            var h1 = Run();
            var h2 = Run();
            Assert.AreEqual(h1, h2, "Same travel commands must produce identical route state and hash");
            Assert.IsFalse(string.IsNullOrEmpty(h1));
        }

        [Test]
        public void SameNodeTraversal_IsRejectedWithoutMutation()
        {
            var graph = PocGraph();
            var state = StartAtYeongdeungpo();
            var ledger = new Ledger();
            var beforeHash = RouteApi.ComputeRouteHash(state, ledger);
            var beforeTick = state.Tick.Value;
            var beforeEvents = ledger.Events.Count;

            var result = RouteApi.TryTravel(graph, state, ledger, Cmd("t-same", StationId.Yeongdeungpo));
            Assert.IsInstanceOf<TravelRejection>(result);
            var rejection = (TravelRejection)result;
            Assert.AreEqual(TravelRejectReason.SameNode, rejection.Reason);
            Assert.AreEqual(beforeTick, state.Tick.Value);
            Assert.AreEqual(beforeEvents, ledger.Events.Count);
            Assert.AreEqual(beforeHash, RouteApi.ComputeRouteHash(state, ledger));
        }

        [Test]
        public void UnknownNodeTraversal_IsRejectedWithoutMutation()
        {
            var graph = PocGraph();
            var state = StartAtYeongdeungpo();
            var ledger = new Ledger();
            var beforeHash = RouteApi.ComputeRouteHash(state, ledger);
            var beforeTick = state.Tick.Value;
            var beforeEvents = ledger.Events.Count;
            var unknown = new StationId("UnknownStation-X");

            var result = RouteApi.TryTravel(graph, state, ledger, Cmd("t-unknown", unknown));
            Assert.IsInstanceOf<TravelRejection>(result);
            var rejection = (TravelRejection)result;
            Assert.AreEqual(TravelRejectReason.UnknownNode, rejection.Reason);
            Assert.AreEqual(beforeTick, state.Tick.Value);
            Assert.AreEqual(StationId.Yeongdeungpo, state.Current);
            Assert.AreEqual(beforeEvents, ledger.Events.Count);
            Assert.AreEqual(beforeHash, RouteApi.ComputeRouteHash(state, ledger));
        }

        /// <summary>
        /// Manual QA consumer: legal Y->S->G path emits final node/tick/hash;
        /// illegal Y->G is typed rejection with unchanged before/after hash.
        /// </summary>
        [Test]
        public void ConsumerSurface_LegalPathAndIllegalJump_Observable()
        {
            var graph = PocGraph();
            var state = StartAtYeongdeungpo();
            var ledger = new Ledger();

            state = (RouteState)RouteApi.TryTravel(graph, state, ledger, Cmd("qa-ys", StationId.Sindorim));
            state = (RouteState)RouteApi.TryTravel(graph, state, ledger, Cmd("qa-sg", StationId.Guro));

            var finalNode = state.Current.Value;
            var finalTick = state.Tick.Value;
            var finalHash = RouteApi.ComputeRouteHash(state, ledger);

            Assert.AreEqual("Guro", finalNode, "Legal path must end at Guro");
            Assert.AreEqual(2, finalTick, "Two legal hops must advance tick by 2");
            Assert.IsFalse(string.IsNullOrEmpty(finalHash));

            var illegalState = StartAtYeongdeungpo();
            var illegalLedger = new Ledger();
            var beforeIllegalHash = RouteApi.ComputeRouteHash(illegalState, illegalLedger);
            var illegalResult = RouteApi.TryTravel(
                graph,
                illegalState,
                illegalLedger,
                Cmd("qa-illegal-yg", StationId.Guro));
            Assert.IsInstanceOf<TravelRejection>(illegalResult);
            var illegalRejection = (TravelRejection)illegalResult;
            Assert.AreEqual(TravelRejectReason.NotAdjacent, illegalRejection.Reason);
            var afterIllegalHash = RouteApi.ComputeRouteHash(illegalState, illegalLedger);
            Assert.AreEqual(beforeIllegalHash, afterIllegalHash, "Illegal attempt must leave hash unchanged");
            Assert.AreEqual(0, illegalState.Tick.Value);
            Assert.AreEqual(StationId.Yeongdeungpo, illegalState.Current);

            TestContext.WriteLine("ROUTE_QA_FINAL_NODE=" + finalNode);
            TestContext.WriteLine("ROUTE_QA_FINAL_TICK=" + finalTick);
            TestContext.WriteLine("ROUTE_QA_FINAL_HASH=" + finalHash);
            TestContext.WriteLine("ROUTE_QA_ILLEGAL_REASON=" + illegalRejection.Reason);
            TestContext.WriteLine("ROUTE_QA_ILLEGAL_BEFORE_HASH=" + beforeIllegalHash);
            TestContext.WriteLine("ROUTE_QA_ILLEGAL_AFTER_HASH=" + afterIllegalHash);

            var repoRoot = Path.GetFullPath(Path.Combine(Application.dataPath, "..", ".."));
            var outDir = Path.Combine(repoRoot, ".omo", "evidence", "unity-poc-core-loop", "task-6-route", "manual-qa");
            Directory.CreateDirectory(outDir);
            var outPath = Path.Combine(outDir, "manual-qa-result.txt");
            var sb = new StringBuilder();
            sb.AppendLine("task-6-route manual QA consumer");
            sb.AppendLine("surface=EditMode RouteTraversalTests.ConsumerSurface_LegalPathAndIllegalJump_Observable");
            sb.AppendLine("start=Yeongdeungpo");
            sb.AppendLine("path=Yeongdeungpo->Sindorim->Guro");
            sb.AppendLine("finalNode=" + finalNode);
            sb.AppendLine("finalTick=" + finalTick.ToString(System.Globalization.CultureInfo.InvariantCulture));
            sb.AppendLine("finalHash=" + finalHash);
            sb.AppendLine("illegalAttempt=Yeongdeungpo->Guro");
            sb.AppendLine("illegalReason=" + illegalRejection.Reason);
            sb.AppendLine("illegalBeforeHash=" + beforeIllegalHash);
            sb.AppendLine("illegalAfterHash=" + afterIllegalHash);
            sb.AppendLine("illegalHashUnchanged=" + string.Equals(beforeIllegalHash, afterIllegalHash, StringComparison.Ordinal));
            sb.AppendLine("MANUAL_QA_PASS=True");
            File.WriteAllText(outPath, sb.ToString(), Encoding.UTF8);
            TestContext.WriteLine("ROUTE_QA_ARTIFACT=" + outPath);
        }

        [Test]
        public void SurfaceToSubwayJourney()
        {
            var surface = new PlaceId(PlaceKind.SurfaceDistrict, "yeongdeungpo-surface");
            var entrance = new PlaceId(PlaceKind.StationLayerOrPlatform, "yeongdeungpo-entrance");
            var transfer = new PlaceId(PlaceKind.Interchange, "sindorim-transfer");
            var destination = new PlaceId(PlaceKind.Station, "guro");
            var graph = RouteGraph.CreateFromConnections(new[] {
                new RouteConnection(surface, entrance, RouteConnectionKind.Walk, RouteGrade.Surface, PassageState.Open),
                new RouteConnection(entrance, transfer, RouteConnectionKind.Vertical, RouteGrade.Entrance, PassageState.Open),
                new RouteConnection(transfer, destination, RouteConnectionKind.Transfer, RouteGrade.Elevated, PassageState.Open) });
            var state = RouteApi.StartAt(surface, new Tick(0));
            var ledger = new Ledger();
            var preview = RouteApi.PreviewJourney(graph, state, destination);
            Assert.AreEqual(3, preview.Faces.Count);
            Assert.AreEqual(0, state.Tick.Value);
            state = (RouteState)RouteApi.ConfirmJourney(graph, state, ledger, preview, new CommandId("surface-subway"));
            Assert.AreEqual(destination, state.Location);
            Assert.AreEqual(3, state.Tick.Value);
            Assert.AreEqual(3, ledger.Events.Count);
        }

        [Test]
        public void RouteBlockedAfterPreviewLeavesStateUnchanged()
        {
            var surface = new PlaceId(PlaceKind.SurfaceDistrict, "yeongdeungpo-surface");
            var entrance = new PlaceId(PlaceKind.StationLayerOrPlatform, "yeongdeungpo-entrance");
            var transfer = new PlaceId(PlaceKind.Interchange, "sindorim-transfer");
            var destination = new PlaceId(PlaceKind.Station, "guro");
            var graph = RouteGraph.CreateFromConnections(new[] {
                new RouteConnection(surface, entrance, RouteConnectionKind.Walk, RouteGrade.Surface, PassageState.Open),
                new RouteConnection(entrance, transfer, RouteConnectionKind.Vertical, RouteGrade.Entrance, PassageState.Open),
                new RouteConnection(transfer, destination, RouteConnectionKind.Transfer, RouteGrade.Elevated, PassageState.Blocked) });
            var state = RouteApi.StartAt(surface, new Tick(0));
            var ledger = new Ledger();
            var before = RouteApi.ComputeRouteHash(state, ledger);
            var preview = RouteApi.PreviewJourney(graph, state, destination);
            Assert.IsInstanceOf<TravelRejection>(RouteApi.ConfirmJourney(graph, state, ledger, preview, new CommandId("blocked")));
            Assert.AreEqual(before, RouteApi.ComputeRouteHash(state, ledger));
            Assert.AreEqual(surface, state.Location);
            Assert.AreEqual(0, state.Tick.Value);
            Assert.AreEqual(0, ledger.Events.Count);
            Assert.IsFalse(graph.CanTraverse(new PlaceId(PlaceKind.Station, "yeongdeungpo"), destination));
        }
    }
}
