using System;
using System.Threading.Tasks;
using Janseon.Foundation.Composition;
using UnityEngine;
using UnityEngine.UIElements;
using VContainer;

namespace Janseon.Foundation.UI
{
    /// <summary>
    /// One UIDocument per MainTitle lease. Readiness completes during VContainer inject
    /// (LifetimeScope.Awake), not Start/frame polling.
    /// </summary>
    public sealed class MainTitleUiHost : MonoBehaviour, IScreenReadiness
    {
        [SerializeField] UIDocument document;
        [SerializeField] VisualTreeAsset visualTree;
        [SerializeField] StyleSheet mainStyle;
        [SerializeField] StyleSheet sharedStyle;
        [SerializeField] PanelSettings panelSettings;

        readonly TaskCompletionSource<bool> ready =
            new(TaskCreationOptions.RunContinuationsAsynchronously);

        MainTitlePresenter presenter;
        UiScreenDocumentLease documentLease;
        bool signaled;
        bool leaseAttached;

        public bool IsReady { get; private set; }
        public Task Ready => ready.Task;
        public UIDocument Document => document;

        [Inject] RuntimeSlotView slotView;

        [Inject]
        public void Construct(MainTitlePresenter titlePresenter, UiScreenDocumentLease lease)
        {
            presenter = titlePresenter ?? throw new ArgumentNullException(nameof(titlePresenter));
            documentLease = lease ?? throw new ArgumentNullException(nameof(lease));

            if (document == null)
            {
                document = GetComponent<UIDocument>();
            }

            if (visualTree == null && document != null)
            {
                visualTree = document.visualTreeAsset;
            }

            if (panelSettings == null && document != null)
            {
                panelSettings = document.panelSettings;
            }

            // Style sheets optional: MainTitle.uxml already references Shared+MainTitle USS.
            if (visualTree == null || panelSettings == null || document == null)
            {
                Fail("MainTitle UIDocument/UXML/PanelSettings missing");
                return;
            }

            if (!documentLease.TryAttach("main-title"))
            {
                Fail("MainTitle UIDocument lease rejected (second active document)");
                return;
            }

            leaseAttached = true;

            document.panelSettings = panelSettings;
            document.visualTreeAsset = visualTree;

            // Prefer live panel root; instantiate is deterministic when panel root is not yet realized.
            VisualElement root = document.rootVisualElement;
            if (root == null
                || (root.name != UiElementNames.MainTitleRoot && root.Q(UiElementNames.MainTitleRoot) == null))
            {
                root = visualTree.Instantiate();
            }

            if (sharedStyle != null && !root.styleSheets.Contains(sharedStyle))
            {
                root.styleSheets.Add(sharedStyle);
            }

            if (mainStyle != null && !root.styleSheets.Contains(mainStyle))
            {
                root.styleSheets.Add(mainStyle);
            }

            if (!presenter.Bind(root))
            {
                Fail("MainTitlePresenter bind failed");
                return;
            }

            // Named-root resolution from panel reference dimensions (Design dual-res).
            screenRoot = UiResolutionClass.ApplyFromPanel(root, UiElementNames.MainTitleRoot, panelSettings);
            slotView.BindTitle(screenRoot);
            if (screenRoot != null)
            {
                screenRoot.RegisterCallback<GeometryChangedEvent>(OnGeometryChanged);
            }

            presenter.FocusStart();

            IsReady = true;
            signaled = true;
            ready.TrySetResult(true);
        }

        VisualElement screenRoot;

        void OnGeometryChanged(GeometryChangedEvent _)
        {
            if (document == null || panelSettings == null)
            {
                return;
            }

            UiResolutionClass.ApplyFromPanel(
                document.rootVisualElement ?? screenRoot,
                UiElementNames.MainTitleRoot,
                panelSettings);
        }

        void OnDestroy()
        {
            if (screenRoot != null)
            {
                screenRoot.UnregisterCallback<GeometryChangedEvent>(OnGeometryChanged);
                screenRoot = null;
            }

            if (leaseAttached)
            {
                documentLease?.Detach();
                leaseAttached = false;
            }
        }

        void Fail(string reason)
        {
            if (signaled)
            {
                return;
            }

            if (leaseAttached)
            {
                documentLease?.Detach();
                leaseAttached = false;
            }

            IsReady = false;
            signaled = true;
            ready.TrySetException(new InvalidOperationException(reason));
        }
    }
}
