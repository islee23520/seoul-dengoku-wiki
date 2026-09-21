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
        private IReadOnlyStrategyMapAssetCatalog catalog;

        public StrategyMapPresenter Presenter { get; private set; }

        [Inject]
        public void Construct(IReadOnlyStrategyMapAssetCatalog value)
        {
            catalog = value ?? throw new System.ArgumentNullException(nameof(value));
        }

        private void Start()
        {
            Build();
        }

        public bool Build()
        {
            Presenter = StrategyMapPresenter.Build(
                transform,
                catalog.Meshes,
                catalog.Textures,
                catalog.BuildingBinaries.Count > 0 ? catalog.BuildingBinaries : null);
            Presenter.EnableStreaming(40f);

            if (catalog.Prefabs.Count > 0 && catalog.Manifest != null)
            {
                Presenter.AttachLandmarks(catalog.Prefabs, catalog.Manifest.text);
            }

            return true;
        }
    }
}
