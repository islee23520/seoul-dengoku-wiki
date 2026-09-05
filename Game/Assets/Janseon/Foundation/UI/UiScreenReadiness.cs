using UnityEngine.UIElements;

namespace Janseon.Foundation.UI
{
    public readonly struct UiScreenReadinessResult
    {
        public UiScreenReadinessResult(bool isReady, string failureReason)
        {
            IsReady = isReady;
            FailureReason = failureReason ?? string.Empty;
        }

        public bool IsReady { get; }
        public string FailureReason { get; }
    }

    /// <summary>
    /// Fail-closed readiness for required UI Toolkit assets (Design.md §8).
    /// </summary>
    public static class UiScreenReadiness
    {
        public static UiScreenReadinessResult Evaluate(
            VisualTreeAsset mainTitleUxml,
            StyleSheet mainTitleUss,
            VisualTreeAsset gameplayUxml,
            StyleSheet gameplayUss,
            StyleSheet sharedUss,
            PanelSettings panelSettings)
        {
            if (mainTitleUxml == null)
            {
                return new UiScreenReadinessResult(false, "MainTitle UXML missing");
            }

            if (mainTitleUss == null)
            {
                return new UiScreenReadinessResult(false, "MainTitle USS missing");
            }

            if (gameplayUxml == null)
            {
                return new UiScreenReadinessResult(false, "Gameplay UXML missing");
            }

            if (gameplayUss == null)
            {
                return new UiScreenReadinessResult(false, "Gameplay USS missing");
            }

            if (sharedUss == null)
            {
                return new UiScreenReadinessResult(false, "Shared USS missing");
            }

            if (panelSettings == null)
            {
                return new UiScreenReadinessResult(false, "PanelSettings missing");
            }

            return new UiScreenReadinessResult(true, string.Empty);
        }
    }
}
