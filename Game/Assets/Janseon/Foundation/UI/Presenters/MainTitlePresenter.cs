using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Janseon.Foundation.AppFlow;
using Janseon.Foundation.UI;
using UnityEngine.UIElements;

namespace Janseon.Foundation.Composition
{
    /// <summary>
    /// MainTitle UI presenter: binds Design.md element names and Start → OpenFoundation.
    /// ApplicationFlowCoordinator is constructor-injected from the parent App scope.
    /// </summary>
    public sealed class MainTitlePresenter
    {
        readonly ApplicationFlowCoordinator coordinator;
        Button startButton;
        readonly List<string> focusOrder = new List<string>();

        public MainTitlePresenter(ApplicationFlowCoordinator coordinator)
        {
            this.coordinator = coordinator ?? throw new ArgumentNullException(nameof(coordinator));
        }

        public bool IsReady { get; private set; }

        public IReadOnlyList<string> FocusOrderNames => focusOrder;

        public bool BindForTest(VisualElement root) => Bind(root);

        public bool Bind(VisualElement root)
        {
            focusOrder.Clear();
            startButton = null;
            IsReady = false;

            if (root == null)
            {
                return false;
            }

            VisualElement titleRoot = root.name == UiElementNames.MainTitleRoot
                ? root
                : root.Q(UiElementNames.MainTitleRoot);
            if (titleRoot == null || titleRoot.Q(UiElementNames.MainTitleMark) == null)
            {
                return false;
            }

            startButton = titleRoot.Q<Button>(UiElementNames.MainTitleStart);
            if (startButton == null)
            {
                return false;
            }

            startButton.UnregisterCallback<FocusInEvent>(OnStartFocusIn);
            startButton.UnregisterCallback<FocusOutEvent>(OnStartFocusOut);
            startButton.clicked -= OnStartClicked;
            startButton.clicked += OnStartClicked;
            startButton.RegisterCallback<FocusInEvent>(OnStartFocusIn);
            startButton.RegisterCallback<FocusOutEvent>(OnStartFocusOut);
            focusOrder.Add(UiElementNames.MainTitleStart);
            IsReady = true;
            return true;
        }

        /// <summary>
        /// Drive Start focus through the real VisualElement focus API (Design.md C1/C2).
        /// FocusIn/Out toggles production jk-focused class (mirrors :focus stroke-focus tokens).
        /// </summary>
        public bool FocusStart()
        {
            if (startButton == null)
            {
                return false;
            }

            startButton.focusable = true;
            startButton.tabIndex = 0;
            startButton.Focus();
            // FocusIn may not fire under batchmode panel; ensure class matches focused state.
            startButton.AddToClassList("jk-focused");
            return true;
        }

        void OnStartFocusIn(FocusInEvent _)
        {
            startButton?.AddToClassList("jk-focused");
        }

        void OnStartFocusOut(FocusOutEvent _)
        {
            startButton?.RemoveFromClassList("jk-focused");
        }

        public Task<TransitionOutcome> TriggerStartForTest() => StartAsync();

        public Task<TransitionOutcome> StartAsync()
            => coordinator.OpenFoundationAsync(CancellationToken.None);

        void OnStartClicked() => _ = StartAsync();
    }
}
