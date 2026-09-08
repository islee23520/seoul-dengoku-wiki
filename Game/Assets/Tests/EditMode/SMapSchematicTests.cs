using NUnit.Framework;
using UnityEngine;
using UnityEngine.UI;
using Janseon.Foundation.UI;
using Janseon.Core;

namespace Janseon.Foundation.Tests
{
    public sealed class SMapSchematicTests
    {
        [Test]
        public void SMap_Is2DSchematic_WithThreeStations_AndNoMeshRenderer()
        {
            var go = new GameObject("TestRoot");
            var root = UguiHudBuilder.BuildGameplay(go.transform);

            var routeRail = UguiHudBuilder.Find(root, UiElementNames.RouteRail);
            Assert.That(routeRail, Is.Not.Null, "S-map 2D schematic overlay must exist");

            var yeongdeungpo = UguiHudBuilder.Find(routeRail, UiElementNames.StationYeongdeungpo);
            var sindorim = UguiHudBuilder.Find(routeRail, UiElementNames.StationSindorim);
            var daerim = UguiHudBuilder.Find(routeRail, UiElementNames.StationGuro); // Using StationGuro ID internally

            Assert.That(yeongdeungpo, Is.Not.Null, "S-map must have Yeongdeungpo node");
            Assert.That(sindorim, Is.Not.Null, "S-map must have Sindorim node");
            Assert.That(daerim, Is.Not.Null, "S-map must have Daerim node");

            var text = daerim.GetComponentInChildren<Text>();
            if (text == null)
            {
                var label = UguiHudBuilder.Find(daerim, "label");
                if (label != null) text = label.GetComponent<Text>();
            }
            Assert.That(text.text, Does.Contain("대림"), "S-map Daerim node should render the text '대림'");

            var routeRenderers = routeRail.GetComponentsInChildren<MeshRenderer>(true);
            Assert.That(routeRenderers.Length, Is.EqualTo(0), "S-Map must not have MeshRenderers on the map layer");

            Object.DestroyImmediate(go);
        }
    }
}
