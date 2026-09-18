using System;
using System.IO;
using NUnit.Framework;
using UnityEngine;
using UnityEditor.SceneManagement;
using UnityEngine.SceneManagement;

namespace Janseon.Foundation.Tests
{
    public sealed class GenreContractTests
    {
        private const string ContractRelativePath = "ProjectSettings/GenreContract.json";

        [Test]
        public void ContractLocksSingleIsometricExplorationAndCombatGrammar()
        {
            GenreContract contract = ReadContract();

            Assert.That(contract.camera.projection, Is.EqualTo("orthographic"));
            Assert.That(contract.camera.yawDegrees, Is.EqualTo(45f).Within(0.001f));
            Assert.That(contract.camera.pitchDegrees, Is.EqualTo(35.264f).Within(0.001f));
            Assert.That(contract.camera.allowOrbit, Is.False);
            Assert.That(contract.camera.allowPerspective, Is.False);
            Assert.That(contract.loop.explorationAndCombatShareGrid, Is.True);
            Assert.That(contract.loop.allowedDirections, Is.EqualTo(4));
            Assert.That(contract.loop.combatResolution, Is.EqualTo("realtime-formation-card"));
            Assert.That(contract.loop.combatPauseAllowed, Is.True);
        }

        [Test]
        public void ContractLocksSilhouetteAndTileScaleToTheCamera()
        {
            GenreContract contract = ReadContract();

            Assert.That(contract.silhouette.headsTall, Is.EqualTo(2.5f).Within(0.001f));
            Assert.That(contract.silhouette.authoredFacings, Is.EqualTo(4));
            Assert.That(contract.silhouette.pixelHead, Is.True);
            Assert.That(contract.silhouette.meshBody, Is.True);
            Assert.That(contract.tile.meters, Is.EqualTo(1.5f).Within(0.001f));
            Assert.That(contract.tile.unityUnits, Is.EqualTo(1.5f).Within(0.001f));
            Assert.That(contract.tile.standardCorridorWidthTiles, Is.EqualTo(2));
        }

        [Test]
        public void FoundationSceneUsesTheLockedCamera()
        {
            const string scenePath = "Assets/Scenes/Foundation.unity";
            Assert.That(File.Exists(Path.Combine(Directory.GetParent(Application.dataPath)!.FullName, scenePath)), Is.True);

            Scene scene = EditorSceneManager.OpenScene(scenePath, OpenSceneMode.Single);
            Camera camera = UnityEngine.Object.FindAnyObjectByType<Camera>();
            Assert.That(camera, Is.Not.Null);
            Assert.That(camera.orthographic, Is.True);
            Assert.That(Mathf.DeltaAngle(camera.transform.eulerAngles.y, Janseon.Foundation.GenreContract.CameraYawDegrees), Is.EqualTo(0f).Within(0.01f));
            Assert.That(Mathf.DeltaAngle(camera.transform.eulerAngles.x, Janseon.Foundation.GenreContract.CameraPitchDegrees), Is.EqualTo(0f).Within(0.01f));
            Assert.That(scene.path, Is.EqualTo(scenePath));
        }

        [Test]
        public void CameraPitchDegreesIsLockedAtTrueIsometric35_264()
        {
            Assert.That(Janseon.Foundation.GenreContract.CameraPitchDegrees, Is.EqualTo(35.264f).Within(0.001f));
        }

        private static GenreContract ReadContract()
        {
            string projectRoot = Directory.GetParent(Application.dataPath)!.FullName;
            string path = Path.Combine(projectRoot, ContractRelativePath);
            Assert.That(File.Exists(path), Is.True, $"Missing genre contract: {path}");

            GenreContract contract = JsonUtility.FromJson<GenreContract>(File.ReadAllText(path));
            Assert.That(contract, Is.Not.Null, "Genre contract JSON did not parse.");
            return contract;
        }

        [Serializable]
        private sealed class GenreContract
        {
            public CameraContract camera = new();
            public LoopContract loop = new();
            public SilhouetteContract silhouette = new();
            public TileContract tile = new();
        }

        [Serializable]
        private sealed class CameraContract
        {
            public string projection = string.Empty;
            public float yawDegrees;
            public float pitchDegrees;
            public bool allowOrbit;
            public bool allowPerspective;
        }

        [Serializable]
        private sealed class LoopContract
        {
            public bool explorationAndCombatShareGrid;
            public int allowedDirections;
            public string combatResolution = string.Empty;
            public bool combatPauseAllowed;
        }

        [Serializable]
        private sealed class SilhouetteContract
        {
            public float headsTall;
            public int authoredFacings;
            public bool pixelHead;
            public bool meshBody;
        }

        [Serializable]
        private sealed class TileContract
        {
            public float meters;
            public float unityUnits;
            public int standardCorridorWidthTiles;
        }
    }
}
