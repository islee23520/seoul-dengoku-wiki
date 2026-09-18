using System.Collections.Generic;
using Janseon.Core;
using UnityEngine;

namespace Janseon.Foundation.Presentation
{
    public enum StrategyMapWeatherKind
    {
        Day,
        Sunset,
        Night,
        Rain,
        Snow,
    }

    public enum StrategyMapSeasonKind
    {
        Spring,
        Summer,
        Autumn,
        Winter,
    }

    /// <summary>
    /// Builds and drives the Seoul strategy map screen (Intent 결정 10):
    /// nine baked heightmap chunks with OSM landcover + sixteen-state region
    /// textures, under a perspective pan/zoom camera, with benchmark-style
    /// weather (day/sunset/night/rain/snow) and tree seasons.
    /// Weather and seasons are presentation only — no canon rules attached.
    /// The camera pans and zooms but never orbits; combat is untouched.
    /// </summary>
    public sealed class StrategyMapPresenter : MonoBehaviour
    {
        private const float InitialHeight = 42f;
        private const float PanUnitsPerScreenUnit = 0.06f;
        private const float MinHeight = 12f;
        private const float MaxHeight = 90f;

        private static readonly Dictionary<StrategyMapWeatherKind, Color> SkyColors = new()
        {
            { StrategyMapWeatherKind.Day, new Color(0.55f, 0.70f, 0.90f) },
            { StrategyMapWeatherKind.Sunset, new Color(0.92f, 0.48f, 0.28f) },
            { StrategyMapWeatherKind.Night, new Color(0.02f, 0.04f, 0.10f) },
            { StrategyMapWeatherKind.Rain, new Color(0.28f, 0.32f, 0.38f) },
            { StrategyMapWeatherKind.Snow, new Color(0.80f, 0.84f, 0.92f) },
        };

        private static readonly Dictionary<StrategyMapSeasonKind, Color> SeasonTints = new()
        {
            { StrategyMapSeasonKind.Spring, new Color(1.00f, 0.96f, 0.94f) },
            { StrategyMapSeasonKind.Summer, new Color(1.00f, 1.00f, 1.00f) },
            { StrategyMapSeasonKind.Autumn, new Color(1.00f, 0.86f, 0.72f) },
            { StrategyMapSeasonKind.Winter, new Color(0.88f, 0.90f, 0.98f) },
        };

        private Transform chunkRoot;
        private Camera mapCamera;
        private Light weatherLight;
        private ParticleSystem rainSystem;
        private ParticleSystem snowSystem;
        private readonly List<Material> terrainMaterials = new();

        public int ChunkChildCount => chunkRoot != null ? chunkRoot.childCount : 0;

        public Camera MapCamera => mapCamera;

        public ParticleSystem RainSystem => rainSystem;

        public ParticleSystem SnowSystem => snowSystem;

        public static StrategyMapPresenter Build(
            Component host,
            IReadOnlyList<Mesh> chunkMeshes,
            IReadOnlyList<Texture2D> chunkTextures = null)
        {
            if (host == null) throw new System.ArgumentNullException(nameof(host));
            if (chunkMeshes == null) throw new System.ArgumentNullException(nameof(chunkMeshes));
            if (chunkMeshes.Count != StrategyMapCatalog.Chunks.Length)
            {
                throw new System.ArgumentException(
                    $"strategy map expects {StrategyMapCatalog.Chunks.Length} chunks, got {chunkMeshes.Count}");
            }
            if (chunkTextures != null && chunkTextures.Count != chunkMeshes.Count)
            {
                throw new System.ArgumentException(
                    $"texture count must match chunk count ({chunkMeshes.Count}), got {chunkTextures.Count}");
            }

            StrategyMapPresenter presenter = host.gameObject.AddComponent<StrategyMapPresenter>();
            presenter.BuildInternal(chunkMeshes, chunkTextures);
            return presenter;
        }

        private void BuildInternal(IReadOnlyList<Mesh> chunkMeshes, IReadOnlyList<Texture2D> chunkTextures)
        {
            chunkRoot = new GameObject("strategy-map-chunks").transform;
            chunkRoot.SetParent(transform, false);
            Shader terrainShader = Shader.Find("Sprites/Default"); // texture + tint, pipeline-agnostic
            Shader unlitColor = Shader.Find("Unlit/Color");
            for (int i = 0; i < chunkMeshes.Count; i++)
            {
                var child = new GameObject($"chunk-{StrategyMapCatalog.Chunks[i].TileX}-{StrategyMapCatalog.Chunks[i].TileY}");
                child.transform.SetParent(chunkRoot, false);
                child.AddComponent<MeshFilter>().sharedMesh = chunkMeshes[i];
                var renderer = child.AddComponent<MeshRenderer>();
                Material material;
                if (chunkTextures != null && terrainShader != null)
                {
                    material = new Material(terrainShader);
                    material.mainTexture = chunkTextures[i];
                    material.color = SeasonTints[StrategyMapSeasonKind.Summer];
                }
                else if (unlitColor != null)
                {
                    // Distinct tint per chunk so no-texture builds still render legibly.
                    material = new Material(unlitColor);
                    material.SetColor("_Color", Color.HSVToRGB((i % 3) / 3f, 0.45f, 0.55f + (i / 3) * 0.15f));
                }
                else
                {
                    material = null;
                }
                renderer.sharedMaterial = material;
                if (material != null) terrainMaterials.Add(material);
            }

            var cameraObject = new GameObject("strategy-map-camera");
            cameraObject.transform.SetParent(transform, false);
            mapCamera = cameraObject.AddComponent<Camera>();
            mapCamera.orthographic = false;
            mapCamera.clearFlags = CameraClearFlags.SolidColor;
            ResetCamera();

            var lightObject = new GameObject("strategy-map-weather-light");
            lightObject.transform.SetParent(transform, false);
            lightObject.transform.rotation = Quaternion.Euler(50f, -35f, 0f);
            weatherLight = lightObject.AddComponent<Light>();
            weatherLight.type = LightType.Directional;

            rainSystem = BuildParticles("strategy-map-rain", streaks: true);
            snowSystem = BuildParticles("strategy-map-snow", streaks: false);

            SetWeather(StrategyMapWeatherKind.Day);
        }

        private ParticleSystem BuildParticles(string name, bool streaks)
        {
            var go = new GameObject(name);
            go.transform.SetParent(transform, false);
            // Box volume over the whole map, high enough for fall time.
            float half = (StrategyMapCatalog.UnionMaxX - StrategyMapCatalog.UnionMinX) * 0.5f + 2f;
            float height = (StrategyMapCatalog.UnionMaxZ - StrategyMapCatalog.UnionMinZ) * 0.5f + 2f;
            go.transform.position = new Vector3(0f, 40f, 0f);

            var system = go.AddComponent<ParticleSystem>();
            var main = system.main;
            main.loop = true;
            main.startLifetime = streaks ? 1.4f : 5.0f;
            main.startSpeed = streaks ? 55f : 9f;
            main.startSize = streaks ? 0.45f : 0.30f;
            main.gravityModifier = streaks ? 1.6f : 0.12f;
            main.maxParticles = streaks ? 9000 : 6000;
            main.simulationSpace = ParticleSystemSimulationSpace.World;
            main.startColor = streaks
                ? new Color(0.65f, 0.75f, 0.95f, 0.55f)
                : new Color(1f, 1f, 1f, 0.85f);

            var emission = system.emission;
            emission.rateOverTime = streaks ? 1800f : 700f;

            var shape = system.shape;
            shape.shapeType = ParticleSystemShapeType.Box;
            shape.scale = new Vector3(half * 2f, 1f, height * 2f);

            if (streaks)
            {
                var vel = system.velocityOverLifetime;
                vel.y = new ParticleSystem.MinMaxCurve(-14f, -20f);
                var stretch = system.sizeOverLifetime;
                stretch.size = new ParticleSystem.MinMaxCurve(1.4f);
            }

            var renderer = go.GetComponent<ParticleSystemRenderer>();
            renderer.renderMode = streaks ? ParticleSystemRenderMode.Stretch : ParticleSystemRenderMode.Billboard;
            system.Stop(true, ParticleSystemStopBehavior.StopEmittingAndClear);
            return system;
        }

        private void ResetCamera()
        {
            // Seoul's north is -Z; sit south of the map and look north-down.
            // Unity cameras look +Z by default, so yaw 180 aims the pitch-down view
            // across the whole map (center ray lands near z ~ 4.6).
            mapCamera.transform.rotation = Quaternion.Euler(55f, 180f, 0f);
            mapCamera.transform.position = new Vector3(0f, InitialHeight, 34f);
            mapCamera.fieldOfView = 45f;
        }

        /// <summary>Pans the map camera over the terrain plane; never rotates.</summary>
        public void Pan(Vector2 screenDelta)
        {
            if (mapCamera == null) return;
            Vector3 position = mapCamera.transform.position;
            position.x = Mathf.Clamp(position.x + screenDelta.x * PanUnitsPerScreenUnit, StrategyMapCatalog.UnionMinX, StrategyMapCatalog.UnionMaxX);
            position.z = Mathf.Clamp(position.z + screenDelta.y * PanUnitsPerScreenUnit, StrategyMapCatalog.UnionMinZ, StrategyMapCatalog.UnionMaxZ);
            mapCamera.transform.position = position;
        }

        /// <summary>Zooms by moving the camera height; never rotates.</summary>
        public void Zoom(float factor)
        {
            if (mapCamera == null) return;
            Vector3 position = mapCamera.transform.position;
            position.y = Mathf.Clamp(position.y * factor, MinHeight, MaxHeight);
            mapCamera.transform.position = position;
        }

        /// <summary>Benchmark-style weather presentation (낮/노을/야경/비/눈).</summary>
        public void SetWeather(StrategyMapWeatherKind kind)
        {
            if (mapCamera == null) return;
            mapCamera.backgroundColor = SkyColors[kind];
            RenderSettings.fog = kind is StrategyMapWeatherKind.Rain or StrategyMapWeatherKind.Snow or StrategyMapWeatherKind.Night;
            RenderSettings.fogColor = SkyColors[kind];
            RenderSettings.fogDensity = kind switch
            {
                StrategyMapWeatherKind.Rain => 0.006f,
                StrategyMapWeatherKind.Snow => 0.004f,
                StrategyMapWeatherKind.Night => 0.003f,
                _ => 0f,
            };

            switch (kind)
            {
                case StrategyMapWeatherKind.Day:
                    weatherLight.color = new Color(1f, 0.98f, 0.92f);
                    weatherLight.intensity = 1.15f;
                    break;
                case StrategyMapWeatherKind.Sunset:
                    weatherLight.color = new Color(1f, 0.62f, 0.38f);
                    weatherLight.intensity = 0.95f;
                    break;
                case StrategyMapWeatherKind.Night:
                    weatherLight.color = new Color(0.55f, 0.65f, 1f);
                    weatherLight.intensity = 0.35f;
                    break;
                case StrategyMapWeatherKind.Rain:
                    weatherLight.color = new Color(0.65f, 0.70f, 0.78f);
                    weatherLight.intensity = 0.55f;
                    break;
                case StrategyMapWeatherKind.Snow:
                    weatherLight.color = new Color(0.92f, 0.95f, 1f);
                    weatherLight.intensity = 1.0f;
                    break;
            }

            SetParticles(rainSystem, kind == StrategyMapWeatherKind.Rain);
            SetParticles(snowSystem, kind == StrategyMapWeatherKind.Snow);
        }

        private static void SetParticles(ParticleSystem system, bool active)
        {
            if (system == null) return;
            if (active && !system.isEmitting) system.Play(true);
            else if (!active && system.isEmitting) system.Stop(true, ParticleSystemStopBehavior.StopEmittingAndClear);
        }

        /// <summary>Benchmark-style tree season tint over the OSM landcover texture.</summary>
        public void SetSeason(StrategyMapSeasonKind season)
        {
            foreach (Material material in terrainMaterials)
            {
                if (material != null && material.HasProperty("_Color"))
                {
                    material.color = SeasonTints[season];
                }
            }
        }
    }
}
