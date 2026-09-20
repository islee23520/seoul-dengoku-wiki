#if UNITY_EDITOR
using System;
using System.Collections;
using Janseon.Foundation.Battle;
using UnityEditor;
using UnityEngine;

namespace Janseon.Foundation.Tests
{
    public static class Full3dBattleVisualFixtureAuthoring
    {
        public static IEnumerable Catalogs
        {
            get { yield return RequireCatalog(); }
        }

        public static void BuildFromCommandLine()
        {
            TemporaryBattleVisualCatalog catalog = RequireCatalog();
            Debug.Log("TASK33_VISUAL_FIXTURE_READY catalog=" + GlobalObjectId.GetGlobalObjectIdSlow(catalog));
        }

        static TemporaryBattleVisualCatalog RequireCatalog()
        {
            string guid = Environment.GetEnvironmentVariable("TASK33_VISUAL_CATALOG_GUID");
            if (!Guid.TryParseExact(guid, "N", out _))
                throw new InvalidOperationException("TASK33_VISUAL_CATALOG_GUID must identify the authored catalog");
            var catalog = AssetDatabase.LoadAssetByGUID<TemporaryBattleVisualCatalog>(new UnityEngine.GUID(guid));
            if (catalog == null)
                throw new InvalidOperationException("TASK33_VISUAL_CATALOG_GUID does not identify a battle visual catalog");
            return catalog;
        }
    }
}
#endif
