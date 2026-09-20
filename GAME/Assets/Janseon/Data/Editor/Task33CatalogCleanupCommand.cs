using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Text;
using Janseon.Data.Authoring;
using UnityEditor;
using UnityEngine;

namespace Janseon.Data.Editor
{
    /// <summary>
    /// Task33 one-shot catalog cleanup.
    /// Loads the external GameDataCatalogAsset identified by JANSEON_GAME_DATA_CATALOG_GUID,
    /// clears the legacy serialized "unitRoles" and "formations" arrays through SerializedObject
    /// when those serialized properties still exist, then SetDirty/SaveAssets/
    /// ForceReserializeAssets/Refresh, reloads the asset, and verifies that neither the catalog
    /// file nor any of its dependencies references the retired catalog GUIDs supplied through
    /// JANSEON_RETIRED_CATALOG_GUIDS (comma separated). No asset path and no GUID are hardcoded
    /// and no asset file is hand-edited. Emits TASK33_CLEANUP_* log markers, a sentinel file, and
    /// a YAML report under JANSEON_TASK33_ARTIFACT_DIR (default: &lt;project&gt;/Temp/Task33CatalogCleanup).
    /// </summary>
    public static class Task33CatalogCleanupCommand
    {
        const string CatalogGuidEnvironmentVariable = "JANSEON_GAME_DATA_CATALOG_GUID";
        const string RetiredGuidsEnvironmentVariable = "JANSEON_RETIRED_CATALOG_GUIDS";
        const string ArtifactDirectoryEnvironmentVariable = "JANSEON_TASK33_ARTIFACT_DIR";

        static readonly string[] LegacyArrayProperties = { "unitRoles", "formations" };

        [MenuItem("Janseon/Data/Task33 Catalog Cleanup From Environment")]
        public static void CleanupCatalogFromEnvironment()
        {
            EditorApplication.Exit(CleanupCatalog());
        }

        static int CleanupCatalog()
        {
            string artifactDirectory = null;
            try
            {
                string catalogGuid = RequireEnvironmentVariable(CatalogGuidEnvironmentVariable);
                List<string> retiredGuids = ParseRetiredGuids(RequireEnvironmentVariable(RetiredGuidsEnvironmentVariable));
                artifactDirectory = ResolveArtifactDirectory();
                Directory.CreateDirectory(artifactDirectory);
                string sentinelPath = Path.Combine(artifactDirectory, "Task33CatalogCleanup.sentinel");
                string reportPath = Path.Combine(artifactDirectory, "Task33CatalogCleanup-report.yaml");

                Debug.Log("TASK33_CLEANUP_BEGIN catalogGuid=" + catalogGuid + " retiredGuidCount=" + retiredGuids.Count);

                GameDataCatalogAsset catalog = LoadCatalog(catalogGuid);
                string catalogPath = AssetDatabase.GetAssetPath(catalog);
                if (string.IsNullOrEmpty(catalogPath))
                {
                    throw new InvalidOperationException("Resolved GameDataCatalogAsset has no asset path for YAML verification.");
                }

                List<string> cleared = new List<string>();
                List<string> absentBefore = new List<string>();
                SerializedObject serializedCatalog = new SerializedObject(catalog);
                foreach (string propertyName in LegacyArrayProperties)
                {
                    SerializedProperty property = serializedCatalog.FindProperty(propertyName);
                    if (property == null)
                    {
                        absentBefore.Add(propertyName);
                        Debug.Log("TASK33_CLEANUP_PROP_ABSENT property=" + propertyName);
                        continue;
                    }

                    if (!property.isArray)
                    {
                        throw new InvalidOperationException("Serialized property '" + propertyName + "' exists but is not an array.");
                    }

                    property.ClearArray();
                    serializedCatalog.ApplyModifiedPropertiesWithoutUndo();
                    cleared.Add(propertyName);
                    Debug.Log("TASK33_CLEANUP_PROP_CLEARED property=" + propertyName);
                }

                GameDataCatalogAsset reloaded = catalog;
                if (cleared.Count > 0)
                {
                    EditorUtility.SetDirty(catalog);
                    AssetDatabase.SaveAssets();
                    AssetDatabase.ForceReserializeAssets(new[] { catalogPath });
                    AssetDatabase.Refresh();
                    Debug.Log("TASK33_CLEANUP_SAVE_COMPLETE path=" + catalogPath);

                    AssetDatabase.ImportAsset(catalogPath, ImportAssetOptions.ForceUpdate);
                    reloaded = LoadCatalog(catalogGuid);
                    Debug.Log("TASK33_CLEANUP_RELOAD_OK path=" + catalogPath);
                }

                SerializedObject postState = new SerializedObject(reloaded);
                List<string> presentAfter = new List<string>();
                List<string> absentAfter = new List<string>();
                foreach (string propertyName in LegacyArrayProperties)
                {
                    SerializedProperty property = postState.FindProperty(propertyName);
                    if (property == null)
                    {
                        absentAfter.Add(propertyName);
                    }
                    else
                    {
                        presentAfter.Add(propertyName);
                    }

                    Debug.Log("TASK33_CLEANUP_PROP_AFTER property=" + propertyName + " state=" + (property == null ? "absent" : "present"));
                }

                string[] dependencies = AssetDatabase.GetDependencies(catalogPath, true);
                List<RetiredGuidProbe> probes = new List<RetiredGuidProbe>();
                foreach (string retiredGuid in retiredGuids)
                {
                    bool referenced = TextContainsGuid(catalogPath, retiredGuid);
                    for (int i = 0; !referenced && i < dependencies.Length; i++)
                    {
                        referenced = dependencies[i] != catalogPath && TextContainsGuid(dependencies[i], retiredGuid);
                    }

                    probes.Add(new RetiredGuidProbe(retiredGuid, referenced));
                    Debug.Log("TASK33_CLEANUP_RETIRED_GUID_PROBE guid=" + retiredGuid + " referenced=" + referenced);
                }

                List<string> violations = new List<string>();
                foreach (RetiredGuidProbe probe in probes)
                {
                    if (probe.Referenced)
                    {
                        violations.Add(probe.Guid);
                    }
                }

                string verifiedUtc = DateTimeOffset.UtcNow.ToString("O", CultureInfo.InvariantCulture);
                WriteReport(reportPath, catalogGuid, catalogPath, cleared, absentBefore, presentAfter, absentAfter, probes, dependencies.Length, verifiedUtc, violations.Count > 0 ? "FAIL" : "PASS");
                if (violations.Count > 0)
                {
                    throw new InvalidOperationException("Retired catalog GUIDs are still referenced: " + string.Join(",", violations));
                }

                File.WriteAllText(
                    sentinelPath,
                    "TASK33_CATALOG_CLEANUP_OK" + Environment.NewLine
                    + "verifiedUtc=" + verifiedUtc + Environment.NewLine
                    + "catalogGuid=" + catalogGuid + Environment.NewLine
                    + "catalogPath=" + catalogPath + Environment.NewLine
                    + "cleared=" + JoinOrNone(cleared) + Environment.NewLine
                    + "absentBefore=" + JoinOrNone(absentBefore) + Environment.NewLine
                    + "presentAfter=" + JoinOrNone(presentAfter) + Environment.NewLine
                    + "absentAfter=" + JoinOrNone(absentAfter) + Environment.NewLine
                    + "retiredGuidsVerified=" + probes.Count + Environment.NewLine,
                    Encoding.UTF8);

                Debug.Log("TASK33_YAML_VERIFY_OK retiredGuidCount=" + probes.Count + " dependencyCount=" + dependencies.Length);
                Debug.Log("TASK33_CLEANUP_OK sentinel=" + sentinelPath + " report=" + reportPath);
                return 0;
            }
            catch (Exception exception)
            {
                Debug.LogError("TASK33_CLEANUP_FAILED " + exception.GetType().Name + ": " + exception.Message);
                TryWriteFailureNote(artifactDirectory, exception);
                return 1;
            }
        }

        static string RequireEnvironmentVariable(string name)
        {
            string value = Environment.GetEnvironmentVariable(name);
            if (string.IsNullOrWhiteSpace(value))
            {
                throw new InvalidOperationException("Required environment variable '" + name + "' is not set.");
            }

            return value.Trim();
        }

        static List<string> ParseRetiredGuids(string raw)
        {
            List<string> guids = new List<string>();
            foreach (string token in raw.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries))
            {
                string candidate = token.Trim();
                if (candidate.Length == 0)
                {
                    continue;
                }

                if (!Guid.TryParseExact(candidate, "N", out Guid parsed) && !Guid.TryParseExact(candidate, "D", out parsed))
                {
                    throw new InvalidOperationException("Retired catalog GUID '" + candidate + "' is not a valid GUID.");
                }

                guids.Add(parsed.ToString("N"));
            }

            if (guids.Count == 0)
            {
                throw new InvalidOperationException(RetiredGuidsEnvironmentVariable + " contains no GUIDs.");
            }

            return guids;
        }

        static string ResolveArtifactDirectory()
        {
            string configured = Environment.GetEnvironmentVariable(ArtifactDirectoryEnvironmentVariable);
            if (!string.IsNullOrWhiteSpace(configured))
            {
                return configured;
            }

            string projectRoot = Path.GetDirectoryName(Application.dataPath);
            return Path.Combine(projectRoot, "Temp", "Task33CatalogCleanup");
        }

        static GameDataCatalogAsset LoadCatalog(string catalogGuid)
        {
            if (!UnityEngine.GUID.TryParse(catalogGuid, out UnityEngine.GUID parsedGuid))
            {
                throw new InvalidOperationException("Catalog GUID '" + catalogGuid + "' is not a valid GUID.");
            }

            GameDataCatalogAsset catalog = AssetDatabase.LoadAssetByGUID<GameDataCatalogAsset>(parsedGuid);
            if (catalog == null)
            {
                throw new InvalidOperationException("Failed to load GameDataCatalogAsset for GUID '" + catalogGuid + "'.");
            }

            return catalog;
        }

        static bool TextContainsGuid(string assetPath, string guid)
        {
            string fullPath = Path.IsPathRooted(assetPath) ? assetPath : Path.Combine(Directory.GetCurrentDirectory(), assetPath);
            if (!File.Exists(fullPath))
            {
                return false;
            }

            string text = File.ReadAllText(fullPath);
            return text.IndexOf(guid, StringComparison.OrdinalIgnoreCase) >= 0;
        }

        static string JoinOrNone(List<string> values)
        {
            return values.Count > 0 ? string.Join(",", values) : "none";
        }

        static void WriteReport(
            string reportPath,
            string catalogGuid,
            string catalogPath,
            List<string> cleared,
            List<string> absentBefore,
            List<string> presentAfter,
            List<string> absentAfter,
            List<RetiredGuidProbe> probes,
            int dependencyCount,
            string verifiedUtc,
            string result)
        {
            StringBuilder yaml = new StringBuilder();
            yaml.Append("command: Janseon.Data.Editor.Task33CatalogCleanupCommand.CleanupCatalogFromEnvironment").AppendLine();
            yaml.Append("result: ").Append(result).AppendLine();
            yaml.Append("verifiedUtc: ").Append(verifiedUtc).AppendLine();
            yaml.Append("catalogGuid: ").Append(catalogGuid).AppendLine();
            yaml.Append("catalogPath: ").Append(catalogPath).AppendLine();
            yaml.Append("clearedProperties: [").Append(string.Join(", ", cleared)).AppendLine("]");
            yaml.Append("absentPropertiesBefore: [").Append(string.Join(", ", absentBefore)).AppendLine("]");
            yaml.Append("presentPropertiesAfter: [").Append(string.Join(", ", presentAfter)).AppendLine("]");
            yaml.Append("absentPropertiesAfter: [").Append(string.Join(", ", absentAfter)).AppendLine("]");
            yaml.Append("dependencyCount: ").Append(dependencyCount).AppendLine();
            yaml.Append("retiredGuidVerification:").AppendLine();
            foreach (RetiredGuidProbe probe in probes)
            {
                yaml.Append("  - guid: ").Append(probe.Guid).AppendLine();
                yaml.Append("    referencedInCatalogOrDependencies: ").Append(probe.Referenced ? "true" : "false").AppendLine();
            }

            File.WriteAllText(reportPath, yaml.ToString(), Encoding.UTF8);
        }

        static void TryWriteFailureNote(string artifactDirectory, Exception exception)
        {
            if (string.IsNullOrEmpty(artifactDirectory))
            {
                return;
            }

            try
            {
                Directory.CreateDirectory(artifactDirectory);
                File.WriteAllText(
                    Path.Combine(artifactDirectory, "Task33CatalogCleanup-failure.txt"),
                    DateTimeOffset.UtcNow.ToString("O", CultureInfo.InvariantCulture) + Environment.NewLine
                    + exception.GetType().FullName + ": " + exception.Message + Environment.NewLine
                    + exception.StackTrace + Environment.NewLine,
                    Encoding.UTF8);
            }
            catch (Exception writeException)
            {
                Debug.LogError("TASK33_CLEANUP_FAILURE_NOTE_WRITE_FAILED " + writeException.Message);
            }
        }

        private readonly struct RetiredGuidProbe
        {
            public RetiredGuidProbe(string guid, bool referenced)
            {
                Guid = guid;
                Referenced = referenced;
            }

            public string Guid { get; }

            public bool Referenced { get; }
        }
    }
}
