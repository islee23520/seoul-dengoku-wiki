using System;
using UnityEditor;
using UnityEngine;
using Janseon.Data.Authoring;
using Janseon.Data.Validation;

namespace Janseon.Data.Editor
{
    public static class Area1GameDataBuilder
    {
        public static void Validate(GameDataCatalogAsset catalog)
        {
            if (catalog == null)
            {
                throw new InvalidOperationException("A GameDataCatalogAsset must be selected for validation.");
            }

            GameDataCatalogIndexBuilder.Build(catalog);
            Debug.Log("Validated Area 1 catalog: " + catalog.name);
        }

        public static void MenuValidate()
        {
            var catalog = Selection.activeObject as GameDataCatalogAsset;
            if (catalog == null)
            {
                throw new InvalidOperationException("Select a GameDataCatalogAsset before validating the Area 1 catalog.");
            }

            Validate(catalog);
        }
    }
}
