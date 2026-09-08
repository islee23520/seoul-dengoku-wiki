namespace Janseon.Foundation.UI
{
    using System;
    using System.Threading.Tasks;
    using Janseon.Foundation.Composition;
    using UnityEngine;
    using VContainer;

    /// <summary>
    /// uGUI MainTitle screen host. Builds the runtime Canvas via
    /// UguiHudBuilder.BuildMainTitle, binds the presenter, focuses Start,
    /// and keeps the exclusive one-active-screen lease.
    /// </summary>
    public sealed class MainTitleUiHost : MonoBehaviour, IScreenReadiness
    {
        readonly TaskCompletionSource<bool> ready =
            new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);

        MainTitlePresenter presenter;
        UiScreenDocumentLease documentLease;
        RectTransform canvasRoot;
        bool signaled;
        bool leaseAttached;

        public bool IsReady { get; private set; }

        public Task Ready => ready.Task;

        public RectTransform CanvasRoot => canvasRoot;


        [Inject]
        public void Construct(MainTitlePresenter titlePresenter, UiScreenDocumentLease lease)
        {
            presenter = titlePresenter ?? throw new ArgumentNullException(nameof(titlePresenter));
            documentLease = lease;

            if (!documentLease.TryAttach(UiElementNames.MainTitleRoot))
            {
                Fail("MainTitle canvas lease rejected: another screen is active");
                return;
            }

            leaseAttached = true;

            canvasRoot = UguiHudBuilder.BuildMainTitle(transform);
            if (canvasRoot == null)
            {
                Fail("MainTitle canvas build failed");
                return;
            }

            if (!presenter.Bind(canvasRoot))
            {
                Fail("MainTitlePresenter bind failed");
                return;
            }

            presenter.FocusStart();

            IsReady = true;
            if (!signaled)
            {
                signaled = true;
                ready.TrySetResult(true);
            }
        }

        void OnDestroy()
        {
            canvasRoot = null;
            if (leaseAttached)
            {
                documentLease?.Detach();
                leaseAttached = false;
            }
        }

        void Fail(string reason)
        {
            IsReady = false;
            if (!signaled)
            {
                signaled = true;
                ready.TrySetResult(false);
            }

            throw new InvalidOperationException("MainTitle host failed: " + reason);
        }
    }
}
