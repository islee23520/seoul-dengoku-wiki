using Janseon.Data.Authoring;
using Janseon.Data.Validation;

namespace Janseon.Data.Repositories
{
    public sealed class GameDataCatalogIndexProvider
    {
        public GameDataCatalogIndex Index { get; }

        public GameDataCatalogIndexProvider(GameDataCatalogAsset catalog)
        {
            Index = GameDataCatalogIndexBuilder.Build(catalog);
        }
    }
}
