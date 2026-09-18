using System;
using System.Globalization;
using System.Text;

namespace Janseon.Core
{
    /// <summary>
    /// Discrete vertical layer for stations and battle grids (지상/B1/B2/B3).
    /// </summary>
    public enum LayerId
    {
        Surface = 0,
        B1 = 1,
        B2 = 2,
        B3 = 3
    }

    public enum HeightMaterial
    {
        Water = 0,
        Sand = 1,
        Grass = 2,
        Dirt = 3,
        Rock = 4,
        Snow = 5
    }

    public enum ConnectionKind
    {
        Stair = 0,
        Escalator = 1,
        Ladder = 2
    }

    public enum ConnectionState
    {
        Open = 0,
        Blocked = 1,
        Flooded = 2
    }

    /// <summary>
    /// Integer heightmap. Engine-free; move cost and materials are deterministic rules.
    /// </summary>
    public sealed class Heightmap
    {
        readonly int[] cells;

        public Heightmap(
            int width,
            int height,
            int maxLevel,
            int waterLevel,
            int seed,
            LayerId layer,
            int[] cells)
        {
            if (width <= 0 || height <= 0)
            {
                throw new ArgumentOutOfRangeException(nameof(width));
            }

            if (cells == null || cells.Length != width * height)
            {
                throw new ArgumentException("cells length must equal width*height", nameof(cells));
            }

            Width = width;
            Height = height;
            MaxLevel = maxLevel;
            WaterLevel = waterLevel;
            Seed = seed;
            Layer = layer;
            this.cells = cells;
        }

        public int Width { get; }
        public int Height { get; }
        public int MaxLevel { get; }
        public int WaterLevel { get; }
        public int Seed { get; }
        public LayerId Layer { get; }

        public int Get(int x, int y)
        {
            if (!InBounds(x, y))
            {
                return 0;
            }

            return cells[y * Width + x];
        }

        public int Get(GridCoord coord) => Get(coord.X, coord.Y);

        public bool InBounds(int x, int y)
        {
            return x >= 0 && y >= 0 && x < Width && y < Height;
        }

        public bool IsWater(int x, int y) => Get(x, y) <= WaterLevel;

        public HeightMaterial MaterialAt(int x, int y)
        {
            return HeightmapApi.MaterialForHeight(Get(x, y), WaterLevel);
        }

        /// <summary>
        /// Cardinal step cost: 1 AP plus 1 AP per elevation step. Water is impassable (returns -1).
        /// </summary>
        public int MoveCost(GridCoord from, GridCoord to)
        {
            if (!InBounds(from.X, from.Y) || !InBounds(to.X, to.Y))
            {
                return -1;
            }

            if (from.ManhattanTo(to) != 1)
            {
                return -1;
            }

            if (IsWater(to.X, to.Y))
            {
                return -1;
            }

            int dh = Math.Abs(Get(from.X, from.Y) - Get(to.X, to.Y));
            return 1 + dh * HeightmapApi.ElevationStepApCost;
        }

        public string Fingerprint()
        {
            var sb = new StringBuilder(Width * Height + 64);
            sb.Append("w=").Append(Width.ToString(CultureInfo.InvariantCulture));
            sb.Append(";h=").Append(Height.ToString(CultureInfo.InvariantCulture));
            sb.Append(";max=").Append(MaxLevel.ToString(CultureInfo.InvariantCulture));
            sb.Append(";water=").Append(WaterLevel.ToString(CultureInfo.InvariantCulture));
            sb.Append(";seed=").Append(Seed.ToString(CultureInfo.InvariantCulture));
            sb.Append(";layer=").Append(((int)Layer).ToString(CultureInfo.InvariantCulture));
            sb.Append(";cells=");
            for (var i = 0; i < cells.Length; i++)
            {
                if (i > 0)
                {
                    sb.Append(',');
                }

                sb.Append(cells[i].ToString(CultureInfo.InvariantCulture));
            }

            return CoreApi.StableHashHex(sb.ToString());
        }

        /// <summary>
        /// Owned deep copy: the snapshot never aliases the caller's cell array.
        /// </summary>
        public Heightmap Snapshot()
        {
            return new Heightmap(Width, Height, MaxLevel, WaterLevel, Seed, Layer, (int[])cells.Clone());
        }
    }

    /// <summary>
    /// Heightmap generation matching iso_botw_rain_sim.html (fbm + ridge, terraced 0..8).
    /// </summary>
    public static class HeightmapApi
    {
        public const int MaxLevel = 8;
        public const int DefaultWaterLevel = 2;
        public const int DefaultWidth = 20;
        public const int DefaultHeight = 20;
        public const int ElevationStepApCost = 1;
        public const float DefaultRelief = 1f;

        public static HeightMaterial MaterialForHeight(int h, int waterLevel)
        {
            if (h <= waterLevel)
            {
                return HeightMaterial.Water;
            }

            if (h == waterLevel + 1)
            {
                return HeightMaterial.Sand;
            }

            if (h >= MaxLevel - 1)
            {
                return HeightMaterial.Snow;
            }

            if (h >= MaxLevel - 3)
            {
                return HeightMaterial.Rock;
            }

            return HeightMaterial.Grass;
        }

        public static Heightmap Generate(
            int seed,
            LayerId layer,
            int width = DefaultWidth,
            int height = DefaultHeight,
            int waterLevel = DefaultWaterLevel,
            float relief = DefaultRelief)
        {
            if (width <= 0 || height <= 0)
            {
                throw new ArgumentOutOfRangeException(nameof(width));
            }

            if (relief < 0f)
            {
                relief = 0f;
            }

            if (relief > 1f)
            {
                relief = 1f;
            }

            var cells = new int[width * height];
            int w1 = width <= 1 ? 1 : width - 1;
            int h1 = height <= 1 ? 1 : height - 1;
            for (var y = 0; y < height; y++)
            {
                for (var x = 0; x < width; x++)
                {
                    double n = Fbm(x * 0.115, y * 0.115, seed);
                    double rg = 1.0 - Math.Abs(Fbm(x * 0.21 + 40.0, y * 0.21 + 40.0, seed + 555) * 2.0 - 1.0);
                    double v = n * 0.7 + rg * 0.3;
                    v = Math.Pow(Clamp01(v), 1.25);
                    double dx = (x / (double)w1) * 2.0 - 1.0;
                    double dy = (y / (double)h1) * 2.0 - 1.0;
                    double fall = 1.0 - Math.Pow(Math.Min(1.0, Math.Sqrt(dx * dx + dy * dy) / 1.18), 2.2);
                    v *= Clamp01(fall);
                    int cell = (int)Math.Round(v * MaxLevel * relief + (1.0 - relief) * 2.0);
                    if (cell < 0)
                    {
                        cell = 0;
                    }

                    if (cell > MaxLevel)
                    {
                        cell = MaxLevel;
                    }

                    cells[y * width + x] = cell;
                }
            }

            if (layer == LayerId.B2)
            {
                FloodBasin(cells, width, height, waterLevel);
            }

            return new Heightmap(width, height, MaxLevel, waterLevel, seed, layer, cells);
        }

        static void FloodBasin(int[] cells, int width, int height, int waterLevel)
        {
            int cx = width / 2;
            int cy = height / 2;
            int radius = Math.Max(2, Math.Min(width, height) / 5);
            for (var y = 0; y < height; y++)
            {
                for (var x = 0; x < width; x++)
                {
                    int dx = x - cx;
                    int dy = y - cy;
                    if (dx * dx + dy * dy <= radius * radius)
                    {
                        int idx = y * width + x;
                        if (cells[idx] > waterLevel)
                        {
                            cells[idx] = waterLevel;
                        }
                    }
                }
            }
        }

        static double Clamp01(double v)
        {
            if (v < 0.0)
            {
                return 0.0;
            }

            if (v > 1.0)
            {
                return 1.0;
            }

            return v;
        }

        static int Imul(int a, int b)
        {
            return unchecked(a * b);
        }

        static double Hash2(int ix, int iy, int seed)
        {
            unchecked
            {
                int h = Imul(ix, 374761393) + Imul(iy, 668265263) + Imul(seed, 1274126177);
                h = Imul(h ^ (int)((uint)h >> 13), 1274126177);
                uint u = (uint)(h ^ (int)((uint)h >> 16));
                return u / 4294967296.0;
            }
        }

        static double Vnoise(double x, double y, int seed)
        {
            int x0 = (int)Math.Floor(x);
            int y0 = (int)Math.Floor(y);
            double fx = x - x0;
            double fy = y - y0;
            double sx = fx * fx * (3.0 - 2.0 * fx);
            double sy = fy * fy * (3.0 - 2.0 * fy);
            double a = Hash2(x0, y0, seed);
            double b = Hash2(x0 + 1, y0, seed);
            double c = Hash2(x0, y0 + 1, seed);
            double d = Hash2(x0 + 1, y0 + 1, seed);
            return (a + (b - a) * sx) + ((c + (d - c) * sx) - (a + (b - a) * sx)) * sy;
        }

        static double Fbm(double x, double y, int seed)
        {
            double amp = 0.5;
            double f = 1.0;
            double sum = 0.0;
            double norm = 0.0;
            for (var o = 0; o < 4; o++)
            {
                sum += Vnoise(x * f, y * f, seed + o * 7919) * amp;
                norm += amp;
                amp *= 0.5;
                f *= 2.03;
            }

            return sum / norm;
        }
    }
}
