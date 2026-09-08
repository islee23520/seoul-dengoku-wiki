using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Janseon.Core.Battle.Contracts;
using Janseon.Foundation.UI;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace Janseon.Foundation.Tests
{
    /// <summary>EventSystem-backed keyboard driver for the production uGUI surface.</summary>
    public static class UguiKeyboardPlayModeHelper
    {
        static readonly TimeSpan SignalTimeout = TimeSpan.FromSeconds(8);

        public static GameObject Tab(Transform root) => MoveSelection(root, false);
        public static GameObject ShiftTab(Transform root) => MoveSelection(root, true);

        public static GameObject FocusNamed(Transform root, string elementName)
        {
            Assert.That(root, Is.Not.Null);
            EventSystem eventSystem = RequireEventSystem();
            eventSystem.SetSelectedGameObject(null);
            List<Selectable> selectables = ActiveSelectables(root);
            for (var i = 0; i < selectables.Count; i++)
            {
                GameObject selected = Tab(root);
                if (selected != null && selected.name == elementName) return selected;
            }
            Assert.Fail("Tab did not reach active uGUI selectable " + elementName);
            return null;
        }

        public static void Enter()
        {
            EventSystem eventSystem = RequireEventSystem();
            GameObject selected = eventSystem.currentSelectedGameObject;
            Assert.That(selected, Is.Not.Null);
            Assert.That(ExecuteEvents.Execute(selected, new BaseEventData(eventSystem), ExecuteEvents.submitHandler), Is.True);
        }

        public static void Escape()
        {
            EventSystem eventSystem = RequireEventSystem();
            GameObject selected = eventSystem.currentSelectedGameObject;
            Assert.That(selected, Is.Not.Null);
            Assert.That(ExecuteEvents.ExecuteHierarchy(selected, new BaseEventData(eventSystem), ExecuteEvents.cancelHandler), Is.Not.Null);
        }

        public static async Task EnterNamedAndAwaitAsync(
            IPocCoreLoopSession session,
            Transform root,
            string elementName,
            Func<IPocCoreLoopSession, bool> predicate)
        {
            Task signal = WaitSignal(session);
            FocusNamed(root, elementName);
            Enter();
            await AwaitSignal(signal, "state after keyboard Enter on " + elementName);
            Assert.That(predicate(session), Is.True,
                "predicate failed after " + elementName + "; rejection=" + (session.LastRejection?.GetType().Name ?? "none"));
        }

        public static async Task<BattleOutcomeKind> FinishCombatKeyboard(
            IPocCoreLoopSession session,
            RectTransform root)
        {
            Assert.That(session.Battle, Is.Not.Null);
            Assert.That(session.Battle.Outcome, Is.EqualTo(BattleOutcomeKind.Ongoing));
            AssertSettleUnavailableDuringOngoing(session, root);

            await EnterNamedAndAwaitAsync(
                session,
                root,
                UiElementNames.BattleAdvance,
                s => s.Battle != null && (s.Battle.Tick > 0 || s.Battle.Outcome != BattleOutcomeKind.Ongoing));

            var commands = 1;
            while (session.Battle != null
                   && session.Battle.Outcome == BattleOutcomeKind.Ongoing
                   && commands < 1200)
            {
                int beforeTick = session.Battle.Tick;
                string beforeHash = session.BattleHash;
                await EnterNamedAndAwaitAsync(
                    session,
                    root,
                    UiElementNames.BattleAdvance,
                    s => s.Battle != null
                         && (s.Battle.Tick != beforeTick
                             || s.BattleHash != beforeHash
                             || s.Battle.Outcome != BattleOutcomeKind.Ongoing));
                commands++;
                if (session.Battle.Outcome == BattleOutcomeKind.Ongoing)
                    AssertSettleUnavailableDuringOngoing(session, root);
            }

            Assert.That(commands, Is.LessThan(1200), "realtime combat exceeded the bounded command cap");
            BattleOutcomeKind outcome = session.Battle.Outcome;
            Assert.That(outcome, Is.Not.EqualTo(BattleOutcomeKind.Ongoing));
            await EnterNamedAndAwaitAsync(
                session,
                root,
                UiElementNames.ActionSettle,
                s => s.Campaign.SettlementApplied && s.LastReceipt != null);
            return outcome;
        }

        static GameObject MoveSelection(Transform root, bool reverse)
        {
            EventSystem eventSystem = RequireEventSystem();
            List<Selectable> selectables = ActiveSelectables(root);
            Assert.That(selectables.Count, Is.GreaterThan(0));
            int index = selectables.FindIndex(s => s.gameObject == eventSystem.currentSelectedGameObject);
            index = index < 0 ? (reverse ? selectables.Count - 1 : 0)
                : reverse ? (index - 1 + selectables.Count) % selectables.Count : (index + 1) % selectables.Count;
            GameObject next = selectables[index].gameObject;
            eventSystem.SetSelectedGameObject(next, new BaseEventData(eventSystem));
            return next;
        }

        static List<Selectable> ActiveSelectables(Transform root)
        {
            var active = new List<Selectable>();
            foreach (Selectable selectable in root.GetComponentsInChildren<Selectable>(false))
                if (selectable != null && selectable.IsActive() && selectable.IsInteractable() && selectable.gameObject.activeInHierarchy)
                    active.Add(selectable);
            return active;
        }

        static void AssertSettleUnavailableDuringOngoing(IPocCoreLoopSession session, Transform root)
        {
            Button settle = UguiHudBuilder.ButtonNamed(root, UiElementNames.ActionSettle);
            Assert.That(settle, Is.Not.Null);
            Assert.That(settle.gameObject.activeInHierarchy && settle.interactable, Is.False);
        }

        static EventSystem RequireEventSystem()
        {
            EventSystem eventSystem = EventSystem.current != null ? EventSystem.current : UguiHudBuilder.LastEnsuredEventSystem;
            Assert.That(eventSystem, Is.Not.Null);
            return eventSystem;
        }

        static Task WaitSignal(IPocCoreLoopSession session)
        {
            var completion = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
            void Handler() { session.StateChanged -= Handler; completion.TrySetResult(true); }
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
        public void OnCancel(BaseEventData eventData) { CancelCount++; gameObject.SetActive(false); }
    }
}
