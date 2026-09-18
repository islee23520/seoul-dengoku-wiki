using NUnit.Framework;
using UnityEngine;
using UnityEngine.UI;
using UnityEditor;
using Janseon.Foundation.UI;
using TMPro;

public class FontSnapshotTest
{
    [Test]
    public void VerifyCJKGlyphs()
    {
        var root = UguiHudBuilder.BuildGameplay(null);
        Assert.IsNotNull(root);

        bool hasCJK = false;
        foreach (var txt in root.GetComponentsInChildren<TextMeshProUGUI>(true))
        {
            if (txt.font != null && (txt.font.name.Contains("Nanum") || txt.font.HasCharacter('영')))
            {
                hasCJK = true;
                break;
            }
        }

        if (!hasCJK)
        {
            foreach (var txt in root.GetComponentsInChildren<Text>(true))
            {
                if (txt.font != null && (txt.font.name.Contains("Nanum") || txt.font.name.Contains("Malgun") || txt.font.HasCharacter('영')))
                {
                    hasCJK = true;
                    break;
                }
            }
        }

        Object.DestroyImmediate(root.gameObject);
        Assert.IsTrue(hasCJK, "No CJK glyphs found in TMP or uGUI Text fonts.");
    }
}
