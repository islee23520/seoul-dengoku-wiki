using System;
using Janseon.Core.Data;
using Janseon.Data.Validation;

namespace Janseon.Data.Repositories
{
    public sealed class CampaignDefinitionRepository : IReadOnlyCampaignDefinition
    {
        private readonly CampaignDefinitionCatalogItem definition;

        public string BattleRulesVersion => definition.BattleRulesVersion;
        public string PersistentPartyUnitId => definition.PersistentPartyUnitId;
        public int PersistentPartyMaxHp => definition.PersistentPartyMaxHp;

        public CampaignDefinitionRepository(GameDataCatalogIndex index)
        {
            if (index == null)
            {
                throw new ArgumentNullException(nameof(index));
            }

            definition = index.CampaignDefinition;
        }
    }
}
