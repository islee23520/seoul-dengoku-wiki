using System;
using System.Threading.Tasks;
using Janseon.Core;
using Janseon.Core.Battle.Sim;
using Janseon.Foundation.Composition;
using UnityEngine;
using UnityEngine.UIElements;
using VContainer;

namespace Janseon.Foundation.UI
{
    /// <summary>
    /// One UIDocument per Foundation gameplay lease. Readiness completes on VContainer inject.
    /// </summary>
    public sealed class GameplayUiHost : MonoBehaviour, IScreenReadiness
    {
        [SerializeField] UIDocument document;
        [SerializeField] VisualTreeAsset visualTree;
        [SerializeField] StyleSheet gameplayStyle;
        [SerializeField] StyleSheet sharedStyle;
        [SerializeField] PanelSettings panelSettings;
        [SerializeField] Camera stationCamera;
        RenderTexture stationTexture;

        readonly TaskCompletionSource<bool> ready =
            new(TaskCreationOptions.RunContinuationsAsynchronously);
        readonly TaskCompletionSource<bool> coreLoopReady =
            new(TaskCreationOptions.RunContinuationsAsynchronously);

        GameplayPresenter presenter;
        UiScreenDocumentLease documentLease;
        VisualElement screenRoot;
        bool signaled;
        bool leaseAttached;

        public bool IsReady { get; private set; }
        public Task Ready => ready.Task;
        public Task CoreLoopReady => coreLoopReady.Task;
        public UIDocument Document => document;
        public GameplayPresenter Presenter => presenter;
        public IPocCoreLoopSession CoreLoop { get; private set; }

        [Inject] RuntimeSlotView slotView;

        /// <summary>Attached by scoped <see cref="PocCoreLoopController"/> on start.</summary>
        public void AttachLoop(IPocCoreLoopSession session)
        {
            CoreLoop = session ?? throw new ArgumentNullException(nameof(session));
            coreLoopReady.TrySetResult(true);
        }

        [Inject]
        public void Construct(GameplayPresenter gameplayPresenter, UiScreenDocumentLease lease)
        {
            presenter = gameplayPresenter ?? throw new ArgumentNullException(nameof(gameplayPresenter));
            documentLease = lease ?? throw new ArgumentNullException(nameof(lease));

            if (document == null)
            {
                document = GetComponent<UIDocument>();
            }

            // Prefer explicit host refs; fall back to UIDocument source when scene wiring
            // only assigned the document (single source of truth for the tree asset).
            if (visualTree == null && document != null)
            {
                visualTree = document.visualTreeAsset;
            }

            if (panelSettings == null && document != null)
            {
                panelSettings = document.panelSettings;
            }

            // Style sheets are optional: Gameplay.uxml already references Shared+Gameplay USS.
            if (visualTree == null || panelSettings == null || document == null)
            {
                Fail("Gameplay UIDocument/UXML/PanelSettings missing");
                return;
            }

            if (!documentLease.TryAttach("gameplay"))
            {
                Fail("Gameplay UIDocument lease rejected (second active document)");
                return;
            }

            leaseAttached = true;

            document.panelSettings = panelSettings;
            document.visualTreeAsset = visualTree;

            // Always bind the live UIDocument tree so PlayMode clicks hit wired buttons.
            VisualElement root = document.rootVisualElement;
            if (root == null)
            {
                Fail("Gameplay UIDocument rootVisualElement missing after assign");
                return;
            }

            if (root.name != UiElementNames.GameplayRoot && root.Q(UiElementNames.GameplayRoot) == null)
            {
                root.Clear();
                visualTree.CloneTree(root);
            }

            if (sharedStyle != null && !root.styleSheets.Contains(sharedStyle))
            {
                root.styleSheets.Add(sharedStyle);
            }

            if (gameplayStyle != null && !root.styleSheets.Contains(gameplayStyle))
            {
                root.styleSheets.Add(gameplayStyle);
            }

            if (!presenter.Bind(root))
            {
                Fail("GameplayPresenter bind failed");
                return;
            }

            screenRoot = UiResolutionClass.ApplyFromPanel(root, UiElementNames.GameplayRoot, panelSettings);
            slotView.BindGameplay(screenRoot);
            if (stationCamera != null)
            {
                stationTexture = new RenderTexture(640, 360, 24);
                stationTexture.Create();
                stationCamera.targetTexture = stationTexture;
                var preview = new Image { name = "station-prop-preview", image = stationTexture, scaleMode = ScaleMode.ScaleToFit };
                preview.style.height = 240;
                root.Q("route-rail").Add(preview);
            }
            if (screenRoot != null)
            {
                screenRoot.UnregisterCallback<GeometryChangedEvent>(OnGeometryChanged);
                screenRoot.RegisterCallback<GeometryChangedEvent>(OnGeometryChanged);
            }

            // Initial campaign snapshot is owned by PocCoreLoopController (scoped session).
            // Apply a deterministic BasePreparation placeholder until controller Start runs.
            ApplyCampaign(CampaignApi.Start(PocCoreLoopController.DefaultSeed, StationId.Yeongdeungpo, PocCoreLoopController.DefaultCampaignId), null);

            IsReady = true;
            signaled = true;
            ready.TrySetResult(true);
        }

        public void ApplyCampaign(CampaignState campaign, BattleSimState battle)
        {
            if (presenter == null || !presenter.IsReady)
            {
                return;
            }

            presenter.ApplySnapshot(GameplayUiSnapshot.FromCampaign(campaign, battle));
            slotView.ApplyBattle(battle);
        }

        void OnGeometryChanged(GeometryChangedEvent _)
        {
            if (document == null || panelSettings == null)
            {
                return;
            }

            VisualElement tree = document.rootVisualElement ?? screenRoot;
            UiResolutionClass.ApplyFromPanel(tree, UiElementNames.GameplayRoot, panelSettings);
        }

        void OnDestroy()
        {
            if (stationTexture != null)
            {
                if (stationCamera != null) stationCamera.targetTexture = null;
                stationTexture.Release();
                Destroy(stationTexture);
            }
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
