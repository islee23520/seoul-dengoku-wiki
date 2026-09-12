using System;
using Janseon.Core;
using NUnit.Framework;

namespace Janseon.Tests.EditMode
{
    [TestFixture]
    public class SeoulWorldGraphTests
    {
        [Test]
        public void CreateSeoul_LoadsEveryCatalogStationAndTwentyFiveDistricts()
        {
            var graph = RouteGraph.CreateSeoul();
            Assert.AreEqual(SeoulWorldGraphCatalog.StationCount, graph.StationCount);
            Assert.AreEqual(334, graph.StationCount);
            Assert.AreEqual(25, SeoulWorldGraphCatalog.DistrictCount);
            Assert.AreEqual(25, SeoulWorldGraphCatalog.Districts.Length);
            Assert.AreEqual(SeoulWorldGraphCatalog.EdgeCount, SeoulWorldGraphCatalog.EdgeA.Length);
            Assert.AreEqual(SeoulWorldGraphCatalog.EdgeCount, SeoulWorldGraphCatalog.EdgeB.Length);

            for (var i = 0; i < SeoulWorldGraphCatalog.StationIds.Length; i++)
            {
                Assert.IsTrue(
                    graph.Contains(new StationId(SeoulWorldGraphCatalog.StationIds[i])),
                    SeoulWorldGraphCatalog.StationIds[i]);
            }

            CollectionAssert.AreEqual(
                new[]
                {
                    "강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구",
                    "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구",
                    "성북구", "송파구", "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구"
                },
                SeoulWorldGraphCatalog.Districts);
        }

        [Test]
        public void CreateSeoul_KeepsPocAdjacency()
        {
            var graph = RouteGraph.CreateSeoul();
            Assert.IsTrue(graph.AreAdjacent(StationId.Yeongdeungpo, StationId.Sindorim));
            Assert.IsTrue(graph.AreAdjacent(StationId.Sindorim, StationId.Guro));
            Assert.IsFalse(graph.AreAdjacent(StationId.Yeongdeungpo, StationId.Guro));

            var neighbors = graph.Neighbors(StationId.Yeongdeungpo);
            Assert.Contains(StationId.Sindorim, neighbors);
            Assert.IsFalse(System.Array.IndexOf(neighbors, StationId.Guro) >= 0);
        }

        [Test]
        public void CreateSeoul_UnknownStation_IsRejectedWithoutMutation()
        {
            var graph = RouteGraph.CreateSeoul();
            var state = RouteApi.StartAt(StationId.Yeongdeungpo, new Tick(0));
            var ledger = new Ledger();
            var beforeHash = RouteApi.ComputeRouteHash(state, ledger);
            var unknown = new StationId("NotAStation");
            var cmd = new TravelCommand
            {
                Id = new CommandId("unknown-1"),
                Destination = unknown
            };

            var result = RouteApi.TryTravel(graph, state, ledger, cmd);
            Assert.IsInstanceOf<TravelRejection>(result);
            var rejection = (TravelRejection)result;
            Assert.AreEqual(TravelRejectReason.UnknownNode, rejection.Reason);
            Assert.AreEqual(StationId.Yeongdeungpo, state.Current);
            Assert.AreEqual(beforeHash, RouteApi.ComputeRouteHash(state, ledger));
        }

        [Test]
        public void CreateFromCatalog_EmptyStations_Throws()
        {
            Assert.Throws<ArgumentException>(() =>
                RouteGraph.CreateFromCatalog(Array.Empty<string>(), Array.Empty<string>(), Array.Empty<string>()));
        }

        [Test]
        public void CreateFromCatalog_MismatchedEdges_Throws()
        {
            Assert.Throws<ArgumentException>(() =>
                RouteGraph.CreateFromCatalog(new[] { "A", "B" }, new[] { "A" }, Array.Empty<string>()));
        }

        [Test]
        public void CreateFromCatalog_EdgeOutsideCatalog_Throws()
        {
            Assert.Throws<ArgumentException>(() =>
                RouteGraph.CreateFromCatalog(new[] { "A", "B" }, new[] { "A" }, new[] { "Z" }));
        }
    }
}
