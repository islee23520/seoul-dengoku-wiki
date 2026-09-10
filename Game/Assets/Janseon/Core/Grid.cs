using System;
using System.Globalization;

namespace Janseon.Core
{
    public readonly struct UnitId : IEquatable<UnitId>
    {
        public readonly string Value;

        public UnitId(string value)
        {
            Value = value ?? string.Empty;
        }

        public bool Equals(UnitId other) => string.Equals(Value, other.Value, StringComparison.Ordinal);
        public override bool Equals(object obj) => obj is UnitId other && Equals(other);
        public override int GetHashCode() => StringComparer.Ordinal.GetHashCode(Value);
        public override string ToString() => Value;
    }

    /// <summary>
    /// Cardinal step on the shared 4-direction integer grid (Concept + Realtime-Formation-Card-Battle).
    /// </summary>
    public enum CardinalDirection
    {
        North = 0,
        East = 1,
        South = 2,
        West = 3
    }

    /// <summary>
    /// Integer grid coordinate. Same orientation grammar as route/station tiles.
    /// </summary>
    public readonly struct GridCoord : IEquatable<GridCoord>
    {
        public readonly int X;
        public readonly int Y;

        public GridCoord(int x, int y)
        {
            X = x;
            Y = y;
        }

        public GridCoord Step(CardinalDirection direction)
        {
            switch (direction)
            {
                case CardinalDirection.North:
                    return new GridCoord(X, Y + 1);
                case CardinalDirection.East:
                    return new GridCoord(X + 1, Y);
                case CardinalDirection.South:
                    return new GridCoord(X, Y - 1);
                case CardinalDirection.West:
                    return new GridCoord(X - 1, Y);
                default:
                    return this;
            }
        }

        public int ManhattanTo(GridCoord other)
        {
            return Math.Abs(X - other.X) + Math.Abs(Y - other.Y);
        }

        public bool Equals(GridCoord other) => X == other.X && Y == other.Y;
        public override bool Equals(object obj) => obj is GridCoord other && Equals(other);
        public override int GetHashCode() => unchecked((X * 397) ^ Y);
        public override string ToString() => X.ToString(CultureInfo.InvariantCulture) + "," + Y.ToString(CultureInfo.InvariantCulture);
    }

    public static class Grid
    {
        /// <summary>
        /// Parse a unit cardinal step into Dx/Dy. Returns false for non-cardinal.
        /// </summary>
        public static bool TryCardinalDelta(CardinalDirection direction, out int dx, out int dy)
        {
            switch (direction)
            {
                case CardinalDirection.North:
                    dx = 0;
                    dy = 1;
                    return true;
                case CardinalDirection.East:
                    dx = 1;
                    dy = 0;
                    return true;
                case CardinalDirection.South:
                    dx = 0;
                    dy = -1;
                    return true;
                case CardinalDirection.West:
                    dx = -1;
                    dy = 0;
                    return true;
                default:
                    dx = 0;
                    dy = 0;
                    return false;
            }
        }
    }
}
