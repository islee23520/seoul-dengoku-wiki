using System;
using Janseon.Core;

namespace Janseon.Foundation.UI
{
    /// <summary>
    /// Compile-only contract for Todo 12 POC core-loop session (Foundation screen scope).
    /// Production wiring/implementation is intentionally absent until RED is proven.
    /// </summary>
    public interface IPocCoreLoopSession
    {
        bool IsReady { get; }
        CampaignState Campaign { get; }
        BattleState Battle { get; }
        Ledger CampaignLedger { get; }
        SettlementBook Book { get; }
        SettlementReceipt LastReceipt { get; }
        SettlementReceipt LastDuplicateReceipt { get; }
        EncounterResult LastSettledResult { get; }
        object LastRejection { get; }
        string LastClickedAction { get; }
        string CampaignHash { get; }
        string BattleHash { get; }

        event Action StateChanged;
        event Action<object> CommandRejected;
    }
}
