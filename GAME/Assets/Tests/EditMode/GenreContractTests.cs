using System.IO;
using NUnit.Framework;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace Janseon.Foundation.Tests
{
    /// <summary>
    /// Genre contract tests for Intent 결정 10 (2026-09-18): strategy map is a 3D
    /// heightmap with pan/zoom, combat screen is left/right side-scroll, and the
    /// isometric angle, shared tile grid, and SD silhouette keys are retired.
    /// </summary>
    public sealed class GenreContractTests
    {
        private const string ContractRelativePath = "ProjectSettings/GenreContract.json";

        [Test]
        public void ContractLocksStrategyMapCameraToPanAndZoomPerspective()
        {
            string json = ReadContractText();

            Assert.That(json, Does.Contain("\"projection\""), "camera.projection must stay serialized");
            Assert.That(json, Does.Contain("\"perspective\""), "strategy map uses a perspective 3D camera");
            Assert.That(json, Does.Contain("\"pan\""));
            Assert.That(json, Does.Contain("true"), "pan must be allowed");
            Assert.That(json, Does.Contain("\"zoom\""));
            Assert.That(json, Does.Contain("\"orbit\""));
        }

        [Test]
        public void ContractRetiresIsometricGridAndSilhouetteKeys()
        {
            string json = ReadContractText();

            Assert.That(json, Does.Not.Contain("yawDegrees"), "isometric yaw retired by 결정 10");
            Assert.That(json, Does.Not.Contain("pitchDegrees"), "isometric pitch retired by 결정 10");
            Assert.That(json, Does.Not.Contain("allowedDirections"), "four-direction grid retired by 결정 10");
            Assert.That(json, Does.Not.Contain("explorationAndCombatShareGrid"), "shared grid retired by 결정 10");
            Assert.That(json, Does.Not.Contain("headsTall"), "SD silhouette retired by 결정 10");
            Assert.That(json, Does.Not.Contain("authoredFacings"), "four facings retired by 결정 10");
        }

        [Test]
        public void ContractKeepsRealtimeFormationCardCombatMechanism()
        {
            string json = ReadContractText();

            Assert.That(json, Does.Contain("realtime-formation-card"), "결정 3 combat mechanism stays");
            Assert.That(json, Does.Contain("combatPauseAllowed"));
        }

        [Test]
        public void ContractLocksSideScrollBattleScreen()
        {
            string json = ReadContractText();

            Assert.That(json, Does.Contain("battleScreen"));
            Assert.That(json, Does.Contain("left-right-side-scroll"), "결정 10 combat presentation");
        }

        [Test]
        public void CombatResolutionConstantMirrorsTheContract()
        {
            Assert.That(Janseon.Foundation.GenreContract.CombatResolution, Is.EqualTo("realtime-formation-card"));
            Assert.That(Janseon.Foundation.GenreContract.CombatPauseAllowed, Is.True);
        }

        [Test]
        public void FoundationSceneOpensWithACamera()
        {
            const string scenePath = "Assets/Scenes/Foundation.unity";
            string projectRoot = Directory.GetParent(Application.dataPath)!.FullName;
            Assert.That(File.Exists(Path.Combine(projectRoot, scenePath)), Is.True);

            Scene scene = EditorSceneManager.OpenScene(scenePath, OpenSceneMode.Single);
            Camera camera = UnityEngine.Object.FindAnyObjectByType<Camera>();
            Assert.That(camera, Is.Not.Null, "Foundation scene must keep a camera");
            Assert.That(scene.path, Is.EqualTo(scenePath));
        }

        private static string ReadContractText()
        {
            string projectRoot = Directory.GetParent(Application.dataPath)!.FullName;
            string path = Path.Combine(projectRoot, ContractRelativePath);
            Assert.That(File.Exists(path), Is.True, $"Missing genre contract: {path}");
            return File.ReadAllText(path);
        }
    }
}
