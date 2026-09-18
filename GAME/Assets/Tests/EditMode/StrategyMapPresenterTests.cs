using System.Collections.Generic;
using Janseon.Core;
using Janseon.Foundation.Presentation;
using NUnit.Framework;
using UnityEngine;

namespace Janseon.Foundation.Tests
{
    public sealed class StrategyMapPresenterTests
    {
        private GameObject host;
        private List<Mesh> chunkMeshes;

        [SetUp]
        public void SetUp()
        {
            host = new GameObject("strategy-map-test");
            chunkMeshes = new List<Mesh>();
            for (int i = 0; i < 9; i++)
            {
                Mesh mesh = new Mesh { name = "test-chunk-" + i };
                mesh.vertices = new[] { Vector3.zero, Vector3.right, Vector3.forward, new Vector3(1f, 0f, 1f) };
                mesh.triangles = new[] { 0, 2, 1, 1, 2, 3 };
                chunkMeshes.Add(mesh);
            }
        }

        [TearDown]
        public void TearDown()
        {
            if (host != null) Object.DestroyImmediate(host);
            foreach (Mesh mesh in chunkMeshes) if (mesh != null) Object.DestroyImmediate(mesh);
        }

        [Test]
        public void BuildSpawnsOneChildPerChunkWithAPerspectiveCamera()
        {
            StrategyMapPresenter presenter = StrategyMapPresenter.Build(host.transform, chunkMeshes);

            Assert.That(presenter, Is.Not.Null);
            Assert.That(presenter.ChunkChildCount, Is.EqualTo(9));
            Assert.That(presenter.MapCamera, Is.Not.Null);
            Assert.That(presenter.MapCamera.orthographic, Is.False, "decision 10: strategy map uses a perspective camera");
        }

        [Test]
        public void BuildRejectsWrongChunkCount()
        {
            chunkMeshes.RemoveAt(0);
            Assert.That(() => StrategyMapPresenter.Build(host.transform, chunkMeshes), Throws.ArgumentException);
        }

        [Test]
        public void PanMovesTheCameraWithoutRotation()
        {
            StrategyMapPresenter presenter = StrategyMapPresenter.Build(host.transform, chunkMeshes);
            Vector3 before = presenter.MapCamera.transform.position;
            Quaternion beforeRotation = presenter.MapCamera.transform.rotation;

            presenter.Pan(new Vector2(2f, 1f));

            Assert.That(Vector3.Distance(before, presenter.MapCamera.transform.position), Is.GreaterThan(0f));
            Assert.That(presenter.MapCamera.transform.rotation, Is.EqualTo(beforeRotation), "pan must never orbit");
        }

        [Test]
        public void ZoomChangesDistanceWithoutRotation()
        {
            StrategyMapPresenter presenter = StrategyMapPresenter.Build(host.transform, chunkMeshes);
            Quaternion beforeRotation = presenter.MapCamera.transform.rotation;
            float beforeHeight = presenter.MapCamera.transform.position.y;

            presenter.Zoom(2f);

            Assert.That(presenter.MapCamera.transform.position.y, Is.GreaterThan(beforeHeight));
            Assert.That(presenter.MapCamera.transform.rotation, Is.EqualTo(beforeRotation), "zoom must never orbit");
        }
    }
}
