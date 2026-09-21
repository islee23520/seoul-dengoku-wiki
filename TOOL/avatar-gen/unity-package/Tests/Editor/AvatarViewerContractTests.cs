using System;
using NUnit.Framework;
using UnityEngine;

namespace AvatarGen.Tests
{
    public sealed class AvatarViewerContractTests
    {
        [Test]
        public void CoordinateConversionsRespectRendererHandedness()
        {
            var blender = new Vector3(1f, 2f, 3f);
            Assert.That(AvatarCoordinateSystem.BlenderToGltf(blender), Is.EqualTo(new Vector3(1f, 3f, -2f)));
            Assert.That(AvatarCoordinateSystem.BlenderToUnity(blender), Is.EqualTo(new Vector3(1f, 3f, 2f)));
            Assert.That(AvatarCoordinateSystem.GltfToUnity(new Vector3(1f, 3f, -2f)), Is.EqualTo(new Vector3(1f, 3f, 2f)));
        }

        [Test]
        public void VisibilityUsesStableElementIdAndObjectName()
        {
            var root = new GameObject("AvatarRoot");
            try
            {
                var body = GameObject.CreatePrimitive(PrimitiveType.Cube);
                body.name = "BodyMesh";
                body.transform.SetParent(root.transform, false);
                var contract = AvatarViewerContract.Parse("{\"schemaVersion\":1,\"elements\":[{\"id\":\"body\",\"objectName\":\"BodyMesh\",\"category\":\"body\",\"defaultVisible\":true}]}" );
                var visibility = new AvatarElementVisibility(root, contract);
                Assert.That(visibility.IsVisible("body"), Is.True);
                Assert.That(visibility.SetVisible("body", false), Is.True);
                Assert.That(body.GetComponent<Renderer>().enabled, Is.False);
            }
            finally { UnityEngine.Object.DestroyImmediate(root); }
        }

        [Test]
        public void MissingContractObjectFailsClosed()
        {
            var root = new GameObject("AvatarRoot");
            try
            {
                var contract = AvatarViewerContract.Parse("{\"schemaVersion\":1,\"elements\":[{\"id\":\"body\",\"objectName\":\"Absent\",\"category\":\"body\",\"defaultVisible\":true}]}" );
                Assert.Throws<InvalidOperationException>(() => new AvatarElementVisibility(root, contract));
            }
            finally { UnityEngine.Object.DestroyImmediate(root); }
        }
    }
}
