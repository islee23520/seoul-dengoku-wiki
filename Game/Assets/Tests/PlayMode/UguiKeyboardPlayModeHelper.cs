using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Janseon.Core;
using Janseon.Foundation.UI;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace Janseon.Foundation.Tests
{
    /// <summary>
    /// PlayMode keyboard driver for the production uGUI surface. Tab changes the
    /// EventSystem selection; Enter and Escape dispatch uGUI submit/cancel handlers.
    /// </summary>
    public static class UguiKeyboardPlayModeHelper
    {
        static readonly TimeSpan SignalTimeout = TimeSpan.FromSeconds(8);

        public static GameObject Tab(Transform root) => MoveSelection(root, reverse: false);

        public static GameObject ShiftTab(Transform root) => MoveSelection(root, reverse: true);

        public static GameObject FocusNamed(Transform root, string elementName)
        {
            Assert.That(root, Is.Not.Null, "keyboard focus root missing");
            Assert.That(elementName, Is.Not.Null.And.Not.Empty);
            EventSystem eventSystem = RequireEventSystem();
            eventSystem.SetSelectedGameObject(null);

            List<Selectable> selectables = ActiveSelectables(root);
            Assert.That(selectables.Count, Is.GreaterThan(0), "no active uGUI selectables under " + root.name);
            for (var i = 0; i < selectables.Count; i++)
            {
                GameObject selected = Tab(root);
                if (selected != null && selected.name == elementName)
                {
                    return selected;
                }
            }

            Assert.Fail("Tab did not reach active uGUI selectable " + elementName);
            return null;
        }

        public static void Enter()
        {
            EventSystem eventSystem = RequireEventSystem();
            GameObject selected = eventSystem.currentSelectedGameObject;
            Assert.That(selected, Is.Not.Null, "Enter requires a focused uGUI object");
            var eventData = new BaseEventData(eventSystem);
            bool handled = ExecuteEvents.Execute(selected, eventData, ExecuteEvents.submitHandler);
            Assert.That(handled, Is.True, selected.name + " has no uGUI submit handler");
        }

        public static void Escape()
        {
            EventSystem eventSystem = RequireEventSystem();
            GameObject selected = eventSystem.currentSelectedGameObject;
            Assert.That(selected, Is.Not.Null, "Escape requires a focused uGUI object");
            var eventData = new BaseEventData(eventSystem);
            bool handled = ExecuteEvents.ExecuteHierarchy(selected, eventData, ExecuteEvents.cancelHandler) != null;
            Assert.That(handled, Is.True, selected.name + " has no uGUI cancel handler in its hierarchy");
        }

        public static async Task EnterNamedAndAwaitAsync(
            IPocCoreLoopSession session,
            Transform root,
            string elementName,
            Func<IPocCoreLoopSession, bool> predicate)
        {
            Assert.That(session, Is.Not.Null);
            Assert.That(predicate, Is.Not.Null);
            Task signal = WaitSignal(session);
            FocusNamed(root, elementName);
            Enter();
            await AwaitSignal(signal, "state after keyboard Enter on " + elementName);
            Assert.That(predicate(session), Is.True,
                "predicate failed after keyboard Enter on " + elementName
                + "; stage=" + session.Campaign?.Stage
                + "; outcome=" + session.Battle?.Outcome
                + "; rejection=" + (session.LastRejection?.GetType().Name ?? "none"));
        }

        public static async Task<BattleOutcomeKind> FinishCombatKeyboard(
            IPocCoreLoopSession session,
            RectTransform root)
        {
            Assert.That(session, Is.Not.Null);
            Assert.That(root, Is.Not.Null);
            Assert.That(session.Battle, Is.Not.Null, "FinishCombatKeyboard requires an open battle");
            Assert.That(session.Battle.Outcome, Is.EqualTo(BattleOutcomeKind.Ongoing));
            AssertSettleUnavailableDuringOngoing(session, root);

            BattleUnit waitingActor = session.Battle.ActiveUnit;
            Assert.That(waitingActor, Is.Not.Null);
            string waitingActorId = waitingActor.UnitId;
            int apBeforeWait = waitingActor.Ap;
            string hashBeforeWait = session.BattleHash;
            int activeBeforeWait = session.Battle.ActiveIndex;

            await EnterNamedAndAwaitAsync(
                session,
                root,
                UiElementNames.BattleWait,
                s => s.Battle != null
                     && (s.BattleHash != hashBeforeWait || s.Battle.ActiveIndex != activeBeforeWait));

            BattleUnit waitedActor = FindUnit(session.Battle, waitingActorId);
            Assert.That(waitedActor, Is.Not.Null);
            Assert.That(waitedActor.Ap, Is.EqualTo(apBeforeWait),
                "Wait must preserve leftover AP; it must not refill the waiting actor");
            AssertSettleUnavailableDuringOngoing(session, root);

            var commands = 0;
            while (session.Battle != null
                   && session.Battle.Outcome == BattleOutcomeKind.Ongoing
                   && commands < 64)
            {
                string action = ChooseBattleAction(session.Battle);
                string beforeHash = session.BattleHash;
                int beforeActive = session.Battle.ActiveIndex;
                int beforeTick = session.Battle.BattleTick.Value;

                await EnterNamedAndAwaitAsync(
                    session,
                    root,
                    action,
                    s => s.Battle != null
                         && (s.Battle.Outcome != BattleOutcomeKind.Ongoing
                             || s.BattleHash != beforeHash
                             || s.Battle.ActiveIndex != beforeActive
                             || s.Battle.BattleTick.Value != beforeTick));
                commands++;
                if (session.Battle.Outcome == BattleOutcomeKind.Ongoing)
                {
                    AssertSettleUnavailableDuringOngoing(session, root);
                }
            }

            Assert.That(commands, Is.LessThan(64), "keyboard combat exceeded the 64-command cap");
            Assert.That(session.Battle, Is.Not.Null);
            BattleOutcomeKind outcome = session.Battle.Outcome;
            Assert.That(outcome, Is.EqualTo(BattleOutcomeKind.PlayerVictory)
                .Or.EqualTo(BattleOutcomeKind.EnemyVictory));

            Button settle = UguiHudBuilder.ButtonNamed(root, UiElementNames.ActionSettle);
            Assert.That(settle, Is.Not.Null);
            Assert.That(settle.gameObject.activeInHierarchy, Is.True,
                "terminal battle must expose action-settle before keyboard settlement");
            Assert.That(settle.interactable, Is.True);

            await EnterNamedAndAwaitAsync(
                session,
                root,
                UiElementNames.ActionSettle,
                s => s.Campaign.SettlementApplied && s.LastReceipt != null);
            return outcome;
        }

        static GameObject MoveSelection(Transform root, bool reverse)
        {
            Assert.That(root, Is.Not.Null, "keyboard navigation root missing");
            EventSystem eventSystem = RequireEventSystem();
            List<Selectable> selectables = ActiveSelectables(root);
            Assert.That(selectables.Count, Is.GreaterThan(0), "no active uGUI selectables under " + root.name);

            GameObject current = eventSystem.currentSelectedGameObject;
            int index = selectables.FindIndex(selectable => selectable.gameObject == current);
            if (index < 0)
            {
                index = reverse ? selectables.Count - 1 : 0;
            }
            else
            {
                index = reverse
                    ? (index - 1 + selectables.Count) % selectables.Count
                    : (index + 1) % selectables.Count;
            }

            GameObject next = selectables[index].gameObject;
            eventSystem.SetSelectedGameObject(next, new BaseEventData(eventSystem));
            Assert.That(eventSystem.currentSelectedGameObject, Is.SameAs(next));
            return next;
        }

        static List<Selectable> ActiveSelectables(Transform root)
        {
            Selectable[] found = root.GetComponentsInChildren<Selectable>(includeInactive: false);
            var active = new List<Selectable>(found.Length);
            for (var i = 0; i < found.Length; i++)
            {
                Selectable selectable = found[i];
                if (selectable != null
                    && selectable.IsActive()
                    && selectable.IsInteractable()
                    && selectable.gameObject.activeInHierarchy)
                {
                    active.Add(selectable);
                }
            }

            return active;
        }

        static string ChooseBattleAction(BattleState battle)
        {
            BattleUnit actor = battle.ActiveUnit;
            Assert.That(actor, Is.Not.Null);
            BattleUnit target = FindOpponent(battle, actor);
            Assert.That(target, Is.Not.Null, "ongoing battle requires a living opponent");
            int distance = actor.Position.ManhattanTo(target.Position);

            if (distance <= BattleApi.MeleeRange && actor.Ap >= BattleApi.MeleeApCost)
            {
                return "battle-melee";
            }

            if (distance <= BattleApi.RangedRange && actor.Ap >= BattleApi.RangedApCost)
            {
                return "battle-ranged";
            }

            if (actor.Ap >= BattleApi.MoveApCost && distance > 1)
            {
                if (target.Position.X > actor.Position.X)
                {
                    return "battle-move-e";
                }

                if (target.Position.X < actor.Position.X)
                {
                    return "battle-move-w";
                }

                if (target.Position.Y > actor.Position.Y)
                {
                    return "battle-move-n";
                }

                if (target.Position.Y < actor.Position.Y)
                {
                    return "battle-move-s";
                }
            }

            return "battle-end-turn";
        }

        static BattleUnit FindOpponent(BattleState battle, BattleUnit actor)
        {
            for (var i = 0; i < battle.Units.Count; i++)
            {
                BattleUnit candidate = battle.Units[i];
                if (candidate != null && !candidate.IsDowned && candidate.IsPlayer != actor.IsPlayer)
                {
                    return candidate;
                }
            }

            return null;
        }

        static BattleUnit FindUnit(BattleState battle, string unitId)
        {
            if (battle?.Units == null)
            {
                return null;
            }

            for (var i = 0; i < battle.Units.Count; i++)
            {
                if (battle.Units[i] != null && battle.Units[i].UnitId == unitId)
                {
                    return battle.Units[i];
                }
            }

            return null;
        }

        static void AssertSettleUnavailableDuringOngoing(
            IPocCoreLoopSession session,
            Transform root)
        {
            Assert.That(session.Battle, Is.Not.Null);
            Assert.That(session.Battle.Outcome, Is.EqualTo(BattleOutcomeKind.Ongoing));
            Button settle = UguiHudBuilder.ButtonNamed(root, UiElementNames.ActionSettle);
            Assert.That(settle, Is.Not.Null);
            Assert.That(settle.gameObject.activeInHierarchy && settle.interactable, Is.False,
                "action-settle must not be keyboard-reachable while battle outcome is Ongoing");
        }

        static EventSystem RequireEventSystem()
        {
            EventSystem eventSystem = EventSystem.current != null
                ? EventSystem.current
                : UguiHudBuilder.LastEnsuredEventSystem;
            Assert.That(eventSystem, Is.Not.Null, "uGUI EventSystem missing");
            return eventSystem;
        }

        static Task WaitSignal(IPocCoreLoopSession session)
        {
            var completion = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
            void Handler()
            {
                session.StateChanged -= Handler;
                completion.TrySetResult(true);
            }

            session.StateChanged += Handler;
            return completion.Task;
        }

        static async Task AwaitSignal(Task signal, string label)
        {
            Task winner = await Task.WhenAny(signal, Task.Delay(SignalTimeout));
            Assert.That(winner, Is.SameAs(signal), "Timed out waiting for " + label);
            await signal;
        }
    }

    public sealed class KeyboardCancelOverlay : MonoBehaviour, ICancelHandler
    {
        public int CancelCount { get; private set; }

        public void OnCancel(BaseEventData eventData)
        {
            CancelCount++;
            gameObject.SetActive(false);
            eventData.Use();
        }
    }
}
