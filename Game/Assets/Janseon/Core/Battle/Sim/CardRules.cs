using System.Collections.Generic;
using Janseon.Core.Battle.Contracts;

namespace Janseon.Core.Battle.Sim
{
    public static class CardCatalog
    {
        public static bool HasDeck { get { return false; } }
        public static bool HasDraw { get { return false; } }
        public static IReadOnlyList<CardDefinition> All()
        {
            return new CardDefinition[] {
                new CardDefinition { Id="guard-shieldwall", Kind=CardKind.Character, RechargeTicks=300, Effect=-3, EffectKey="front_damage" },
                new CardDefinition { Id="encourage-morale", Kind=CardKind.Character, RechargeTicks=600, Effect=10, EffectKey="morale" },
                new CardDefinition { Id="pincer-focus", Kind=CardKind.Character, RechargeTicks=450, Effect=1, EffectKey="front_damage" },
                new CardDefinition { Id="mobility-regroup", Kind=CardKind.Character, RechargeTicks=600, Effect=1, EffectKey="cardinal_reposition" },
                new CardDefinition { Id="supply-heal", Kind=CardKind.Stronghold, RechargeTicks=900, Effect=5, EffectKey="front_heal" },
                new CardDefinition { Id="passage-retreat", Kind=CardKind.Stronghold, RechargeTicks=750, Effect=1, EffectKey="retreat" }
            };
        }
        public static CardDefinition Find(string id) { foreach (var card in All()) if (card.Id == id) return card; return null; }
    }
}
