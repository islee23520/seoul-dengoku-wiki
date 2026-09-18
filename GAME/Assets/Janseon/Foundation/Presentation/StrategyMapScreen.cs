using System.Collections.Generic;
using Janseon.Core;
using UnityEngine;
using VContainer;

namespace Janseon.Foundation.Presentation
{
    /// <summary>
    /// Scene component that loads the baked Seoul strategy map (decision 10)
    /// through the Foundation VContainer scope: the catalog ScriptableObject is
    /// injected, assets are serialized references — no runtime path lookups.
    /// The strategy map camera is the main perspective view; the POC isometric
    /// station camera stays for battle presentation.
    /// </summary>
    public sealed class StrategyMapScreen : MonoBehaviour
    {
        [Inject] private readonly StrategyMapAssetCatalog catalog = null;

        public StrategyMapPresenter Presenter { get; private set; }

        private void Start()
        {
            Build();
        }

        public bool Build()
        {
            if (catalog == null || catalog.ChunkMeshes.Count == 0 || catalog.ChunkTextures.Count == 0)
            {
                Debug.LogWarning("[StrategyMapScreen] catalog is empty or missing; strategy map skipped");
                return false;
            }

            Presenter = StrategyMapPresenter.Build(
                transform,
                catalog.ChunkMeshes,
                catalog.ChunkTextures,
                catalog.BuildingBinaries.Count > 0 ? catalog.BuildingBinaries : null);
            Presenter.EnableStreaming(40f);

            if (catalog.LandmarkPrefabs.Count > 0 && catalog.LandmarkManifest != null)
            {
                Presenter.AttachLandmarks(catalog.LandmarkPrefabs, catalog.LandmarkManifest.text);
            }

            return true;
        }
    }
}
