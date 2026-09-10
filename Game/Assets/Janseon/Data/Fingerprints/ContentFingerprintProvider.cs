using Janseon.Core.Data;using Janseon.Data.Validation;
namespace Janseon.Data.Fingerprints { public sealed class ContentFingerprintProvider:IContentFingerprint { public ContentVersionStamp Version{get;} public string Sha256{get;} public ContentFingerprintProvider(GameDataCatalogIndex i){Version=i.Version;Sha256=CanonicalContentFingerprint.Compute(i);} } }
