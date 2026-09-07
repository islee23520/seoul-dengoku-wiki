using System;
using System.Threading.Tasks;
using Janseon.Core;
using Janseon.Foundation.Composition;
using UnityEngine;
using VContainer;

namespace Janseon.Foundation.UI
{
    /// <summary>
    /// One uGUI canvas per Foundation gameplay lease. Readiness completes on VContainer inject.
    /// </summary>
    public sealed class GameplayUiHost : MonoBehaviour, IScreenReadiness
    {
        [SerializeField] Camera stationCamera;
        [SerializeField] Transform stationPropsRoot;
        RenderTexture stationTexture;
        Camera previewCamera;

        readonly TaskCompletionSource<bool> ready =
            new(TaskCreationOptions.RunContinuationsAsynchronously);
        readonly TaskCompletionSource<bool> coreLoopReady =
            new(TaskCreationOptions.RunContinuationsAsynchronously);

        GameplayPresenter presenter;
        UiScreenDocumentLease documentLease;

        RectTransform canvasRoot;
        bool signaled;
        bool leaseAttached;

        public bool IsReady { get; private set; }

        public RectTransform CanvasRoot => canvasRoot;
        public Task Ready => ready.Task;
        public Task CoreLoopReady => coreLoopReady.Task;
        public GameplayPresenter Presenter => presenter;
        public Camera StationCamera => stationCamera;
        public Transform StationPropsRoot => stationPropsRoot;
        public IPocCoreLoopSession CoreLoop { get; private set; }


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

            // Canvas-only: the gameplay canvas is built below via UguiHudBuilder (task 13).
            if (!documentLease.TryAttach("gameplay"))
            {
                Fail("Gameplay canvas lease rejected (second active screen)");
                return;
            }

            leaseAttached = true;


            // Presenter binds the uGUI gameplay canvas (single UI surface).
            canvasRoot = UguiHudBuilder.BuildGameplay(transform);
            if (canvasRoot == null)
            {
                Fail("Gameplay canvas build failed");
                return;
            }

            if (!presenter.Bind(canvasRoot))
            {
                Fail("GameplayPresenter bind failed");
                return;
            }

            // Resolution is owned by CanvasScaler; rail/slot binding moves to tasks 13/26.
            if (stationCamera != null)
            {
                // Station preview RT remains builder-wired; uGUI rail binding lands with task 26 slot work.
                stationTexture = new RenderTexture(640, 360, 24);
                stationTexture.filterMode = FilterMode.Point;
                stationTexture.Create();
                GameObject previewCamGo = new GameObject("StationPreviewCamera");
                previewCamGo.transform.SetParent(stationCamera.transform, false);
                previewCamera = previewCamGo.AddComponent<Camera>();
                previewCamera.CopyFrom(stationCamera);
                previewCamera.targetTexture = stationTexture;
                previewCamera.depth = stationCamera.depth - 1;
                stationCamera.targetTexture = null;
                stationCamera.tag = "MainCamera";
            }

            // Initial campaign snapshot is owned by PocCoreLoopController (scoped session).
            // Apply a deterministic BasePreparation placeholder until controller Start runs.
            ApplyCampaign(CampaignApi.Start(PocCoreLoopController.DefaultSeed, StationId.Yeongdeungpo, PocCoreLoopController.DefaultCampaignId), null);

            IsReady = true;
            signaled = true;
            ready.TrySetResult(true);
        }

        public void ApplyCampaign(CampaignState campaign, BattleState battle)
        {
            if (presenter == null || !presenter.IsReady)
            {
                return;
            }

            GameplayUiSnapshot snapshot = GameplayUiSnapshot.FromCampaign(campaign, battle);
            presenter.ApplySnapshot(snapshot);
        }

        public void ApplyWhy(string why)
        {
            presenter?.ApplyWhy(why);
        }

        void OnDestroy()
        {
            canvasRoot = null;

            if (previewCamera != null)
            {
                previewCamera.targetTexture = null;
                previewCamera = null;
            }

            if (stationTexture != null)
            {
                stationTexture.Release();
                Destroy(stationTexture);
                stationTexture = null;
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
