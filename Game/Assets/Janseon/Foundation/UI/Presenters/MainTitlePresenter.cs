namespace Janseon.Foundation.Composition
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Janseon.Foundation.AppFlow;
    using Janseon.Foundation.UI;
    using UnityEngine;
    using UnityEngine.EventSystems;
    using UnityEngine.UI;

    /// <summary>
    /// uGUI MainTitle presenter. Binds the runtime canvas built by
    /// UguiHudBuilder.BuildMainTitle and forwards Start to the public FSM.
    /// </summary>
    public sealed class MainTitlePresenter
    {
        readonly ApplicationFlowCoordinator coordinator;
        Button startButton;
        Toggle stationMasterToggle;
        readonly List<string> focusOrder = new List<string>();

        public MainTitlePresenter(ApplicationFlowCoordinator coordinator)
        {
            this.coordinator = coordinator ?? throw new ArgumentNullException(nameof(coordinator));
        }

        public bool IsReady { get; private set; }

        public IReadOnlyList<string> FocusOrderNames => focusOrder;

        public bool BindForTest(Transform root)
        {
            return Bind(root);
        }

        public bool Bind(Transform root)
        {
            focusOrder.Clear();
            startButton = null;
            stationMasterToggle = null;
            IsReady = false;

            if (root == null)
            {
                return false;
            }

            Transform titleRoot = root.name == UiElementNames.MainTitleRoot
                ? root
                : root.Find(UiElementNames.MainTitleRoot);
            if (titleRoot == null)
            {
                return false;
            }

            Transform mark = titleRoot.Find(UiElementNames.MainTitleMark);
            if (mark == null)
            {
                return false;
            }

            Transform preset = titleRoot.Find(UiElementNames.MainTitleStationMasterPreset);
            stationMasterToggle = preset != null ? preset.GetComponent<Toggle>() : null;
            Transform start = titleRoot.Find(UiElementNames.MainTitleStart);
            startButton = start != null ? start.GetComponent<Button>() : null;
            if (stationMasterToggle == null || startButton == null)
            {
                return false;
            }

            stationMasterToggle.SetIsOnWithoutNotify(
                coordinator.SelectedStartingPreset == Janseon.Core.StartingPreset.StationMaster);
            stationMasterToggle.onValueChanged.RemoveListener(OnStationMasterChanged);
            stationMasterToggle.onValueChanged.AddListener(OnStationMasterChanged);
            startButton.onClick.RemoveListener(PressStart);
            startButton.onClick.AddListener(PressStart);
            focusOrder.Add(UiElementNames.MainTitleStart);
            IsReady = true;
            return true;
        }

        public bool FocusStart()
        {
            if (startButton == null)
            {
                return false;
            }

            EventSystem current = EventSystem.current != null
                ? EventSystem.current
                : UguiHudBuilder.LastEnsuredEventSystem;
            if (current == null)
            {
                return false;
            }

            current.SetSelectedGameObject(startButton.gameObject);
            return true;
        }

        public Task<TransitionOutcome> TriggerStartForTest()
        {
            return StartAsync(CancellationToken.None);
        }

        public void PressStart()
        {
            StartAsync(CancellationToken.None);
        }

        public Task<TransitionOutcome> StartAsync(CancellationToken cancellationToken = default)
        {
            return coordinator.OpenFoundationAsync(cancellationToken);
        }

        void OnStationMasterChanged(bool selected)
        {
            coordinator.SelectedStartingPreset = selected
                ? Janseon.Core.StartingPreset.StationMaster
                : Janseon.Core.StartingPreset.Wanderer;
        }
    }
}
