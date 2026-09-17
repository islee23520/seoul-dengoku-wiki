using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Security.Cryptography;
using System.Text;

namespace Janseon.Foundation.UI
{
    /// <summary>
    /// Source-only dirty-tree fingerprint for capture receipts.
    /// Includes working-tree UI/scene/test/tool changes; excludes .omo evidence outputs
    /// so capture writes cannot self-invalidate the fingerprint.
    /// </summary>
    public static class UiSourceFingerprint
    {
        static readonly string[] EvidencePrefixes =
        {
            ".omo/evidence/",
            ".omo/evidence\\",
            ".omo/",
            "docs/verification/",
            "Game/Logs/",
        };

        public static string Compute(string repoRoot)
        {
            if (string.IsNullOrEmpty(repoRoot) || !Directory.Exists(repoRoot))
            {
                return Sha256Hex(Encoding.UTF8.GetBytes("empty-repo"));
            }

            string porcelain = RunGit(repoRoot, "status --porcelain -uall");
            var lines = new List<string>();
            using (var reader = new StringReader(porcelain ?? string.Empty))
            {
                string line;
                while ((line = reader.ReadLine()) != null)
                {
                    if (string.IsNullOrWhiteSpace(line))
                    {
                        continue;
                    }

                    string path = ExtractPath(line);
                    if (IsGeneratedDirectoryMeta(repoRoot, path) || IsEvidencePath(path))
                    {
                        continue;
                    }

                    // Keep status + path and content hash so already-dirty edits still move the fp.
                    string abs = Path.Combine(repoRoot, path.Replace('/', Path.DirectorySeparatorChar));
                    string contentKey = "missing";
                    if (File.Exists(abs))
                    {
                        try
                        {
                            contentKey = Sha256Hex(File.ReadAllBytes(abs));
                        }
                        catch (IOException)
                        {
                            contentKey = "io-error";
                        }
                    }
                    else if (Directory.Exists(abs))
                    {
                        contentKey = "dir";
                    }

                    lines.Add(line.TrimEnd() + "\0" + contentKey);
                }
            }

            lines.Sort(StringComparer.Ordinal);
            var sb = new StringBuilder();
            for (int i = 0; i < lines.Count; i++)
            {
                sb.Append(lines[i]).Append('\n');
            }

            return Sha256Hex(Encoding.UTF8.GetBytes(sb.ToString()));
        }

        static bool IsGeneratedDirectoryMeta(string repoRoot, string path)
        {
            if (string.IsNullOrEmpty(path) || !path.EndsWith(".meta", StringComparison.Ordinal))
            {
                return false;
            }

            string assetPath = path.Substring(0, path.Length - 5);
            return Directory.Exists(Path.Combine(repoRoot, assetPath.Replace('/', Path.DirectorySeparatorChar)));
        }

        public static bool IsEvidencePath(string path)
        {
            if (string.IsNullOrEmpty(path))
            {
                return false;
            }

            string n = path.Replace('\\', '/');
            if (n.StartsWith("./", StringComparison.Ordinal))
            {
                n = n.Substring(2);
            }

            // Unity Test Runner creates this temporary scene only for the duration of PlayMode.
            const string testScenePrefix = "Game/Assets/InitTestScene";
            string scenePath = n.EndsWith(".meta", StringComparison.Ordinal)
                ? n.Substring(0, n.Length - 5) : n;
            if (scenePath.StartsWith(testScenePrefix, StringComparison.Ordinal)
                && scenePath.EndsWith(".unity", StringComparison.Ordinal)
                && Guid.TryParseExact(scenePath.Substring(testScenePrefix.Length,
                    scenePath.Length - testScenePrefix.Length - 6), "D", out _))
            {
                return true;
            }

            for (int i = 0; i < EvidencePrefixes.Length; i++)
            {
                string p = EvidencePrefixes[i].Replace('\\', '/');
                if (n.StartsWith(p, StringComparison.Ordinal)
                    || n.Contains("/" + p, StringComparison.Ordinal))
                {
                    return true;
                }
            }

            // Explicit capture/evidence folders anywhere under .omo
            if (n.StartsWith(".omo/", StringComparison.Ordinal))
            {
                return true;
            }

            return false;
        }

        static string ExtractPath(string porcelainLine)
        {
            // "XY path" or "XY orig -> path" (rename)
            if (porcelainLine.Length < 4)
            {
                return porcelainLine.Trim();
            }

            string rest = porcelainLine.Substring(3).Trim();
            int arrow = rest.IndexOf(" -> ", StringComparison.Ordinal);
            if (arrow >= 0)
            {
                rest = rest.Substring(arrow + 4).Trim();
            }

            if (rest.Length >= 2 && rest[0] == '"' && rest[rest.Length - 1] == '"')
            {
                rest = rest.Substring(1, rest.Length - 2);
            }

            return rest.Replace('\\', '/');
        }

        static string RunGit(string repoRoot, string args)
        {
            var psi = new ProcessStartInfo("git", args)
            {
                WorkingDirectory = repoRoot,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            };
            using var p = Process.Start(psi);
            if (p == null)
            {
                return string.Empty;
            }

            string o = p.StandardOutput.ReadToEnd();
            p.WaitForExit(30_000);
            return o;
        }

        static string Sha256Hex(byte[] bytes)
        {
            using var sha = SHA256.Create();
            byte[] hash = sha.ComputeHash(bytes ?? Array.Empty<byte>());
            var sb = new StringBuilder(hash.Length * 2);
            for (int i = 0; i < hash.Length; i++)
            {
                sb.Append(hash[i].ToString("x2"));
            }

            return sb.ToString();
        }
    }
}
