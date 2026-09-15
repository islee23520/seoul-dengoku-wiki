using System;
using Janseon.Foundation.AppFlow;

namespace Janseon.Foundation.Composition
{
    public static class FoundationScenes
    {
        public const string Bootstrap = "Assets/Scenes/Bootstrap.unity";
        public const string MainTitle = "Assets/Scenes/MainTitle.unity";
        public const string Foundation = "Assets/Scenes/Foundation.unity";

        public static string PathFor(ContentScreenId screen)
        {
            return screen switch
            {
                ContentScreenId.MainTitle => MainTitle,
                ContentScreenId.Foundation => Foundation,
                _ => throw new ArgumentOutOfRangeException(nameof(screen), screen, "Unknown content screen."),
            };
        }
    }
}
