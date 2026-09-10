using Janseon.Foundation.UI;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.UI;

namespace Janseon.Foundation.Tests
{
    public sealed class FormationEditScreenTests
    {
        [Test]
        public void Gameplay_ContainsDedicatedFormationEditScreenControls()
        {
            RectTransform root = UguiHudBuilder.BuildGameplay(null);

            Transform formationEdit = UguiHudBuilder.Find(root, "formation-edit");
            Assert.That(formationEdit, Is.Not.Null, "missing formation-edit panel");

            AssertButton(formationEdit, "formation-edit-confirm");
            AssertButton(formationEdit, "formation-edit-cancel");
            AssertButton(formationEdit, "formation-edit-facing-n");
            AssertButton(formationEdit, "formation-edit-facing-e");
            AssertButton(formationEdit, "formation-edit-facing-s");
            AssertButton(formationEdit, "formation-edit-facing-w");
        }

        static void AssertButton(Transform parent, string name)
        {
            Transform child = UguiHudBuilder.Find(parent, name);
            Assert.That(child, Is.Not.Null, "missing " + name);
            Assert.That(child.GetComponent<Button>(), Is.Not.Null, name + " must be a button");
        }
    }
}
