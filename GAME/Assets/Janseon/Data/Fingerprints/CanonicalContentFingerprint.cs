using System;
using System.Globalization;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using Janseon.Data.Validation;

namespace Janseon.Data.Fingerprints
{
    /// <summary>
    /// Computes a stable, order-independent SHA-256 fingerprint for a
    /// <see cref="GameDataCatalogIndex"/>. The fingerprint covers the
    /// campaign definition, stations, and content version fields.
    /// </summary>
    public static class CanonicalContentFingerprint
    {
        /// <summary>
        /// Appends a length-prefixed UTF-8 field value to <paramref name="buffer"/>.
        /// Null is treated as empty string. The value is NFC-normalised before
        /// encoding so that equivalent Unicode sequences hash identically.
        /// </summary>
        private static void AppendField(StringBuilder buffer, string value)
        {
            value = value ?? string.Empty;
            byte[] encoded = Encoding.UTF8.GetBytes(value.Normalize(NormalizationForm.FormC));
            buffer.Append(encoded.Length.ToString(CultureInfo.InvariantCulture));
            buffer.Append(':');
            buffer.Append(Encoding.UTF8.GetString(encoded));
        }

        /// <summary>
        /// Returns the canonical lowercase SHA-256 hex fingerprint for
        /// <paramref name="catalog"/>.
        /// </summary>
        public static string Compute(GameDataCatalogIndex catalog)
        {
            var buffer = new StringBuilder();

            AppendField(buffer, "content-schema");
            AppendField(buffer, catalog.Version.ContentSchema.ToString(CultureInfo.InvariantCulture));
            AppendField(buffer, "content-version");
            AppendField(buffer, catalog.Version.ContentVersion);
            AppendField(buffer, "fingerprint-version");
            AppendField(buffer, catalog.Version.FingerprintVersion);

            AppendField(buffer, "campaign-definition");
            AppendField(buffer, catalog.CampaignDefinition.BattleRulesVersion);
            AppendField(buffer, catalog.CampaignDefinition.PersistentPartyUnitId);
            AppendField(buffer, catalog.CampaignDefinition.PersistentPartyMaxHp.ToString(CultureInfo.InvariantCulture));

            foreach (var station in catalog.Stations.OrderBy(s => s.StableId, StringComparer.Ordinal))
            {
                AppendField(buffer, "station");
                AppendField(buffer, station.StableId);
                AppendField(buffer, station.CoreStationId.Value);

                foreach (var neighborId in station.NeighborStableIds.OrderBy(id => id, StringComparer.Ordinal))
                {
                    AppendField(buffer, neighborId);
                }
            }

            using (var sha256 = SHA256.Create())
            {
                byte[] hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(buffer.ToString()));
                return string.Concat(hashBytes.Select(b => b.ToString("x2", CultureInfo.InvariantCulture)));
            }
        }
    }
}
