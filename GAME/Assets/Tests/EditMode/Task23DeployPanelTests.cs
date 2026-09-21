using System.Collections.Generic;
using Janseon.Core;
using Janseon.Foundation.Composition;
using Janseon.Foundation.UI;
using Janseon.Tests.EditMode.Fixtures;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.UI;

namespace Janseon.Tests.EditMode
{
    [TestFixture]
    public sealed class Task23DeployPanelTests
    {
        static UnitHpSnapshot Hp(params int[] values)
        {
            var entries = new Dictionary<string, int>();
            for (var i = 0; i < values.Length; i++)
            {
                entries[DeploymentApi.UnitId(i)] = values[i];
            }

            return new UnitHpSnapshot(entries);
        }

        [Test]
        public void FourthParticipant_IsRejectedWithoutMutation()
        {
            DeploymentState state = DeploymentApi.Create(4, Hp(10, 10, 10, 10), 10);
            Assert.That(state.ParticipantCount, Is.EqualTo(DeploymentApi.DeployCap));
            Assert.That(state.IsParticipating(DeploymentApi.UnitId(3)), Is.False,
                "the fourth roster member starts in reserve when three slots are occupied");

            string before = state.Fingerprint();
            object attempted = DeploymentApi.SetParticipation(
                state,
                DeploymentApi.UnitId(3),
                participating: true,
                explicitWoundedOverride: false);

            Assert.That(attempted, Is.TypeOf<DeploymentRejection>());
            Assert.That(((DeploymentRejection)attempted).Reason, Is.EqualTo(DeploymentRejectReason.DeployCapReached));
            Assert.That(state.ParticipantCount, Is.EqualTo(3));
            Assert.That(state.IsParticipating(DeploymentApi.UnitId(3)), Is.False);
            Assert.That(state.Fingerprint(), Is.EqualTo(before), "rejected fourth join must not mutate deployment");

            TestContext.WriteLine("TASK23_FAILURE=FOURTH_JOIN_REJECTED");
            TestContext.WriteLine("TASK23_FAILURE_BEFORE=" + before);
            TestContext.WriteLine("TASK23_FAILURE_AFTER=" + state.Fingerprint());
            TestContext.WriteLine("TASK23_FAILURE_PARTICIPANTS=" + state.ParticipantCount);
        }

        [Test]
        public void FourthToggleThroughPresenter_IsRejectedAndRestoredWithoutCampaignMutation()
        {
            CampaignState campaign = CampaignApi.StartNewGame(23, StationId.Yeongdeungpo, "task-23-fourth-toggle", StartingPreset.Wanderer, TestCampaignDefinition.Instance.BattleRulesVersion, TestCampaignDefinition.Instance.PersistentPartyUnitId, TestCampaignDefinition.Instance.PersistentPartyMaxHp);
            campaign.PartyMemberCount = 4;
            campaign.PartyHp = Hp(10, 10, 10, 10);
            campaign.Deployment = DeploymentApi.Create(4, campaign.PartyHp, 10);

            RectTransform root = UguiHudBuilder.BuildGameplay(null);
            var presenter = new GameplayPresenter();
            Assert.That(presenter.BindForTest(root), Is.True);
            presenter.ApplySnapshot(GameplayUiSnapshot.FromCampaign(campaign, null));

            Toggle fourth = UguiHudBuilder.ToggleNamed(root, UiElementNames.DeployToggle(3));
            Assert.That(fourth, Is.Not.Null);
            Assert.That(fourth.gameObject.activeInHierarchy, Is.True);
            Assert.That(fourth.isOn, Is.False);

            string before = CampaignApi.ComputeStateHash(campaign);
            object result = null;
            presenter.DeploymentParticipationChosen += (index, participating) =>
            {
                result = CampaignApi.SetDeploymentParticipation(
                    campaign,
                    DeploymentApi.UnitId(index),
                    participating,
                    explicitWoundedOverride: false);
                presenter.ApplySnapshot(GameplayUiSnapshot.FromCampaign(campaign, null));
            };

            fourth.isOn = true;

            Assert.That(result, Is.TypeOf<DeploymentRejection>());
            Assert.That(((DeploymentRejection)result).Reason, Is.EqualTo(DeploymentRejectReason.DeployCapReached));
            Assert.That(fourth.isOn, Is.False, "repaint restores the rejected fourth toggle");
            Assert.That(CampaignApi.ComputeStateHash(campaign), Is.EqualTo(before));
        }

        [Test]
        public void WoundedLeftoverHp_DefaultsResting_AndRequiresExplicitOverride()
        {
            DeploymentState state = DeploymentApi.Create(3, Hp(7, 10, 10), 10);
            string woundedId = DeploymentApi.UnitId(0);

            Assert.That(state.IsParticipating(woundedId), Is.False);
            Assert.That(state.IsWounded(woundedId), Is.True);
            Assert.That(state.ParticipantCount, Is.EqualTo(2));

            string before = state.Fingerprint();
            object rejected = DeploymentApi.SetParticipation(
                state,
                woundedId,
                participating: true,
                explicitWoundedOverride: false);
            Assert.That(rejected, Is.TypeOf<DeploymentRejection>());
            Assert.That(((DeploymentRejection)rejected).Reason, Is.EqualTo(DeploymentRejectReason.WoundedOverrideRequired));
            Assert.That(state.Fingerprint(), Is.EqualTo(before));

            object overridden = DeploymentApi.SetParticipation(
                state,
                woundedId,
                participating: true,
                explicitWoundedOverride: true);
            Assert.That(overridden, Is.TypeOf<DeploymentState>());
            var next = (DeploymentState)overridden;
            Assert.That(next.IsParticipating(woundedId), Is.True);
            Assert.That(next.ParticipantCount, Is.EqualTo(3));

            TestContext.WriteLine("TASK23_WOUNDED_DEFAULT=미참가 — 휴식");
            TestContext.WriteLine("TASK23_WOUNDED_HP=7/10");
            TestContext.WriteLine("TASK23_WOUNDED_OVERRIDE_REQUIRED=True");
        }

        [Test]
        public void WandererThree_StillShowsThreeRealParticipationTogglesAtCap()
        {
            CampaignState campaign = CampaignApi.StartNewGame(23, StationId.Yeongdeungpo, "task-23-wanderer", StartingPreset.Wanderer, TestCampaignDefinition.Instance.BattleRulesVersion, TestCampaignDefinition.Instance.PersistentPartyUnitId, TestCampaignDefinition.Instance.PersistentPartyMaxHp);
            RectTransform root = UguiHudBuilder.BuildGameplay(null);
            var presenter = new GameplayPresenter();
            Assert.That(presenter.BindForTest(root), Is.True);
            presenter.ApplySnapshot(GameplayUiSnapshot.FromCampaign(campaign, null));

            Transform panel = UguiHudBuilder.Find(root, UiElementNames.DeployPanel);
            Assert.That(panel, Is.Not.Null);
            Assert.That(panel.gameObject.activeInHierarchy, Is.True);
            for (var i = 0; i < campaign.PartyMemberCount; i++)
            {
                Toggle toggle = UguiHudBuilder.ToggleNamed(root, UiElementNames.DeployToggle(i));
                Assert.That(toggle, Is.Not.Null, "missing roster toggle " + i);
                Assert.That(toggle.gameObject.activeInHierarchy, Is.True, "at-cap members still need a real choice control");
                Assert.That(toggle.isOn, Is.True);
                Assert.That(toggle.GetComponentInChildren<Text>(true).text, Does.Contain("참가"));
            }

            Assert.That(campaign.PartyMemberCount, Is.EqualTo(3), "task 23 must not grow the P0 roster");
            Assert.That(campaign.Deployment.ParticipantCount, Is.EqualTo(3));
            TestContext.WriteLine("TASK23_HAPPY=THREE_DEPLOYED_WITH_TOGGLES");
            TestContext.WriteLine("TASK23_ROSTER_SIZE=" + campaign.PartyMemberCount);
            TestContext.WriteLine("TASK23_DEPLOY_CAP=" + DeploymentApi.DeployCap);
        }
    }
}
