using System.Collections.Generic;
using Janseon.Core;
using Janseon.Foundation.Composition;
using Janseon.Foundation.UI;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.UI;

namespace Janseon.Tests.EditMode
{
    [TestFixture]
    public sealed class DynamicTravelUiTests
    {
        static CampaignState DepartedFromYeongdeungpo(out RouteGraph graph)
        {
            graph = RouteGraph.CreateSeoul();
            var state = CampaignApi.StartNewGame(
                1234, StationId.Yeongdeungpo, "dynamic-travel", StartingPreset.Wanderer);
            var ledger = new Ledger();
            state = (CampaignState)CampaignApi.Apply(
                graph,
                state,
                ledger,
                new CampaignCommand { Id = new CommandId("dt-depart"), Kind = CampaignCommandKind.Depart });
            return state;
        }

        [Test]
        public void ExpeditionTravelAtYeongdeungpo_SnapshotExposesNonPocNeighbors()
        {
            var state = DepartedFromYeongdeungpo(out var graph);
            var snap = GameplayUiSnapshot.FromCampaign(state, null, false, null, graph);

            Assert.IsTrue(snap.ShowTravelActions);
            var names = new List<string>();
            foreach (var n in snap.TravelNeighbors)
            {
                names.Add(n.Value);
            }

            CollectionAssert.Contains(names, "Sindorim");
            CollectionAssert.Contains(names, "노량진");
            CollectionAssert.Contains(names, "서울역");
        }

        [Test]
        public void Presenter_CreatesClickableButtonForEveryNeighbor_IncludingNonPoc()
        {
            var state = DepartedFromYeongdeungpo(out var graph);
            var snap = GameplayUiSnapshot.FromCampaign(state, null, false, null, graph);

            RectTransform root = UguiHudBuilder.BuildGameplay(null);
            try
            {
                var presenter = new GameplayPresenter();
                Assert.IsTrue(presenter.BindForTest(root));

                StationId chosen = default;
                var fired = 0;
                presenter.TravelChosen += s =>
                {
                    chosen = s;
                    fired++;
                };

                presenter.ApplySnapshot(snap);

                Button nonPoc = UguiHudBuilder.ButtonNamed(root, "station-노량진");
                Assert.IsNotNull(nonPoc, "dynamic neighbor button station-노량진 must exist");
                Assert.IsTrue(nonPoc.gameObject.activeInHierarchy);

                Button poc = UguiHudBuilder.ButtonNamed(root, UiElementNames.StationSindorim);
                Assert.IsNotNull(poc);

                poc.onClick.Invoke();
                nonPoc.onClick.Invoke();

                Assert.AreEqual(2, fired, "both POC and non-POC neighbor buttons must fire TravelChosen");
                Assert.AreEqual(new StationId("노량진"), chosen);
            }
            finally
            {
                Object.DestroyImmediate(root.gameObject);
            }
        }

        [Test]
        public void Presenter_OutsideTravelStage_DynamicNeighborButtonsHidden()
        {
            var graph = RouteGraph.CreateSeoul();
            var state = CampaignApi.StartNewGame(
                1234, StationId.Yeongdeungpo, "dynamic-travel-idle", StartingPreset.Wanderer);
            var snap = GameplayUiSnapshot.FromCampaign(state, null, false, null, graph);
            Assert.IsFalse(snap.ShowTravelActions);

            RectTransform root = UguiHudBuilder.BuildGameplay(null);
            try
            {
                var presenter = new GameplayPresenter();
                Assert.IsTrue(presenter.BindForTest(root));
                presenter.ApplySnapshot(snap);

                Button nonPoc = UguiHudBuilder.ButtonNamed(root, "station-노량진");
                Assert.IsTrue(
                    nonPoc == null || !nonPoc.gameObject.activeInHierarchy,
                    "neighbor buttons must not be active outside travel stage");
            }
            finally
            {
                Object.DestroyImmediate(root.gameObject);
            }
        }
    }
}
