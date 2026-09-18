namespace Janseon.Foundation
{
    /// <summary>
    /// Mirror of ProjectSettings/GenreContract.json (Intent 결정 10, 2026-09-18).
    /// Isometric angles, the shared four-direction tile grid, and the SD silhouette
    /// keys were retired with 결정 10. The strategy map owns a pan/zoom perspective
    /// camera and the battle screen presents left/right side-scroll.
    /// </summary>
    public static class GenreContract
    {
        public const string CombatResolution = "realtime-formation-card";
        public const bool CombatPauseAllowed = true;
    }
}
