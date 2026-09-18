using System;
using System.Collections.Generic;
using Janseon.Core;
using Janseon.Core.Battle.Contracts;
using Janseon.Core.Battle.Sim;

namespace Janseon.Foundation.UI
{
    public enum CardTargetingStage { Idle, ChoosingAlly, ChoosingDirection, Confirm }
    public enum CardTargetingContext { Character, Stronghold }

    /// <summary>
    /// HUD-only selection state. BeginCard never plays a card; only Confirm submits.
    /// Core owns legality and recharge. Recreate this machine when the battle changes.
    /// </summary>
    public sealed class OwnerCardTargetingMachine
    {
        static readonly IReadOnlyList<CardinalDirection> directions = Array.AsReadOnly(new[]
        {
            CardinalDirection.North, CardinalDirection.East, CardinalDirection.South, CardinalDirection.West,
        });
        static readonly IReadOnlyList<CardinalDirection> noDirections = Array.AsReadOnly(Array.Empty<CardinalDirection>());
        readonly BattleSimState battle;
        readonly Action<BattleTickCommand> submit;
        readonly Func<int> nextSequence;
        CardDefinition definition;

        public OwnerCardTargetingMachine(BattleSimState battle, Action<BattleTickCommand> submit, Func<int> nextSequence)
        {
            this.battle = battle ?? throw new ArgumentNullException(nameof(battle));
            this.submit = submit ?? throw new ArgumentNullException(nameof(submit));
            this.nextSequence = nextSequence ?? throw new ArgumentNullException(nameof(nextSequence));
        }

        public CardTargetingStage Stage { get; private set; }
        public UnitId SelectedOwner { get; private set; }
        public UnitId SelectedTarget { get; private set; }
        public string CardId => definition?.Id;
        public CardinalDirection? Facing { get; private set; }
        public object LastRejection { get; private set; }
        public bool RequiresDirection => definition?.EffectKey == "cardinal_reposition";
        public IReadOnlyList<CardinalDirection> DirectionChoices => RequiresDirection
            && (Stage == CardTargetingStage.ChoosingDirection || Stage == CardTargetingStage.Confirm)
                ? directions : noDirections;

        public bool SelectOwner(UnitId owner)
        {
            if (!IsLivingAlly(owner)) return Reject(BattleRejectReason.CardInvalidOwner);
            if (!SelectedOwner.Equals(owner)) Cancel();
            SelectedOwner = owner;
            LastRejection = null;
            return true;
        }

        public int? RechargeTicksLeft(string cardId)
        {
            var cardDefinition = CardCatalog.Find(cardId);
            if (cardDefinition == null) return null;
            var owner = cardDefinition.Kind == CardKind.Stronghold ? default : SelectedOwner;
            var card = Array.Find(battle.Cards, item => item.Id == cardId && item.OwnerUnitId.Equals(owner));
            return card?.RechargeTicksLeft;
        }

        public bool BeginCard(string cardId, CardTargetingContext context = CardTargetingContext.Character)
        {
            Cancel();
            var card = CardCatalog.Find(cardId);
            if (card == null) return Reject(BattleRejectReason.CardUnknown);
            if ((card.Kind == CardKind.Stronghold) != (context == CardTargetingContext.Stronghold))
                return Reject(BattleRejectReason.CardInvalidOwner);
            if (card.Kind == CardKind.Character && !IsLivingAlly(SelectedOwner))
                return Reject(BattleRejectReason.CardInvalidOwner);
            definition = card;
            Stage = CardTargetingStage.ChoosingAlly;
            return true;
        }

        public bool SelectTarget(UnitId target)
        {
            if (Stage == CardTargetingStage.Idle) return Reject(BattleRejectReason.MalformedCommand);
            SelectedTarget = default;
            Facing = null;
            Stage = CardTargetingStage.ChoosingAlly;
            if (!IsLivingAlly(target)) return Reject(BattleRejectReason.CardInvalidTarget);
            var preview = BuildCommand(target, default);
            LastRejection = BattleSim.PreviewCard(battle, preview);
            // A cardinal destination is not chosen yet. Core still validates owner,
            // ally, radius, cooldown and battle state before checking that destination.
            if (LastRejection != null && !(RequiresDirection && LastRejection is BattleRejection rejection
                && (rejection.Reason == BattleRejectReason.CardDestinationBlocked
                    || rejection.Reason == BattleRejectReason.CardDestinationOutOfBounds))) return false;
            SelectedTarget = target;
            LastRejection = null;
            Stage = RequiresDirection ? CardTargetingStage.ChoosingDirection : CardTargetingStage.Confirm;
            return true;
        }

        public bool PreviewDirection(CardinalDirection facing)
        {
            if (!RequiresDirection || (Stage != CardTargetingStage.ChoosingDirection && Stage != CardTargetingStage.Confirm))
                return Reject(BattleRejectReason.MalformedCommand);
            Facing = null;
            Stage = CardTargetingStage.ChoosingDirection;
            if (facing < CardinalDirection.North || facing > CardinalDirection.West)
                return Reject(BattleRejectReason.MalformedCommand);
            LastRejection = BattleSim.PreviewCard(battle, BuildCommand(SelectedTarget, facing));
            if (LastRejection != null) return false;
            Facing = facing;
            Stage = CardTargetingStage.Confirm;
            return true;
        }

        public bool Confirm()
        {
            if (Stage != CardTargetingStage.Confirm || (RequiresDirection && !Facing.HasValue))
                return Reject(BattleRejectReason.MalformedCommand);
            // Never retain a preview command: ticks and legality may have changed.
            var command = BuildCommand(SelectedTarget, Facing.GetValueOrDefault());
            LastRejection = BattleSim.PreviewCard(battle, command);
            if (LastRejection != null) return false;
            command.Seq = nextSequence();
            command.Id = new CommandId("targeting-card-" + command.Seq.ToString(System.Globalization.CultureInfo.InvariantCulture));
            Cancel();
            submit(command);
            return true;
        }

        public void Cancel()
        {
            Stage = CardTargetingStage.Idle;
            definition = null;
            SelectedTarget = default;
            Facing = null;
            LastRejection = null;
        }

        BattleTickCommand BuildCommand(UnitId target, CardinalDirection facing) => new BattleTickCommand
        {
            At = new Tick(battle.Tick), Kind = BattleTickCommandKind.PlayCard,
            CardId = definition.Id,
            OwnerUnitId = definition.Kind == CardKind.Character ? SelectedOwner : default,
            TargetUnitId = target,
            Facing = RequiresDirection ? facing : default,
        };

        bool IsLivingAlly(UnitId id) => Array.Exists(battle.Units,
            unit => unit.Id.Equals(id) && unit.Side == 0 && unit.Hp > 0 && unit.State != "Down");

        bool Reject(BattleRejectReason reason)
        {
            LastRejection = new BattleRejection { Reason = reason };
            return false;
        }
    }
}
