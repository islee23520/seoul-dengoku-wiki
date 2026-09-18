using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using Janseon.Core.Battle.Contracts;

namespace Janseon.Core.Data
{
    public interface IReadOnlyCardCatalog { IReadOnlyList<CardCatalogItem> All { get; } bool TryGet(string stableId, out CardCatalogItem item); bool TryGetByCoreId(string coreCardId, out CardCatalogItem item); }
    public interface IReadOnlyUnitRoleCatalog { IReadOnlyList<UnitRoleCatalogItem> All { get; } bool TryGet(string stableId, out UnitRoleCatalogItem item); }
    public interface IReadOnlyFormationCatalog { IReadOnlyList<FormationCatalogItem> All { get; } bool TryGet(string stableId, out FormationCatalogItem item); }
    public interface IReadOnlyStationCatalog { IReadOnlyList<StationCatalogItem> All { get; } bool TryGet(string stableId, out StationCatalogItem item); bool TryGetByCoreId(StationId coreId, out StationCatalogItem item); }
    public interface IContentFingerprint { ContentVersionStamp Version { get; } string Sha256 { get; } }

    public sealed class CardCatalogItem
    {
        public string StableId { get; }
        public string CoreCardId { get; }
        public CardKind Kind { get; }
        public int RechargeTicks { get; }
        public int Effect { get; }
        public string EffectKey { get; }
        public CardCatalogItem(string stableId, string coreCardId, CardKind kind, int rechargeTicks, int effect, string effectKey) { StableId=stableId??string.Empty; CoreCardId=coreCardId??string.Empty; Kind=kind; RechargeTicks=rechargeTicks; Effect=effect; EffectKey=effectKey??string.Empty; }
    }
    public sealed class UnitRoleCatalogItem
    {
        public string StableId { get; }
        public string CoreRole { get; }
        public int MaxHp { get; }
        public int Power { get; }
        public int RangeMin { get; }
        public int RangeMax { get; }
        public int MoveTicksPerCell { get; }
        public int AttackCooldownTicks { get; }
        public UnitRoleCatalogItem(string stableId,string coreRole,int maxHp,int power,int rangeMin,int rangeMax,int moveTicksPerCell,int attackCooldownTicks) { StableId=stableId??string.Empty; CoreRole=coreRole??string.Empty; MaxHp=maxHp;Power=power;RangeMin=rangeMin;RangeMax=rangeMax;MoveTicksPerCell=moveTicksPerCell;AttackCooldownTicks=attackCooldownTicks; }
    }
    public sealed class FormationSlotTemplate
    {
        public string RoleStableId { get; }
        public int Row { get; }
        public int Column { get; }
        public CardinalDirection Facing { get; }
        public FormationSlotTemplate(string roleStableId,int row,int column,CardinalDirection facing) { RoleStableId=roleStableId??string.Empty;Row=row;Column=column;Facing=facing; }
    }
    public sealed class FormationCatalogItem
    {
        public string StableId { get; }
        public int RowCount { get; }
        public int ColumnCount { get; }
        public IReadOnlyList<FormationSlotTemplate> Slots { get; }
        public FormationCatalogItem(string stableId,int rowCount,int columnCount,IEnumerable<FormationSlotTemplate> slots) { StableId=stableId??string.Empty;RowCount=rowCount;ColumnCount=columnCount;Slots=new ReadOnlyCollection<FormationSlotTemplate>(new List<FormationSlotTemplate>(slots??Array.Empty<FormationSlotTemplate>())); }
    }
    public sealed class StationCatalogItem
    {
        public string StableId { get; }
        public StationId CoreStationId { get; }
        public IReadOnlyList<string> NeighborStableIds { get; }
        public StationCatalogItem(string stableId,StationId coreStationId,IEnumerable<string> neighbors) { StableId=stableId??string.Empty;CoreStationId=coreStationId;var a=new List<string>(neighbors??Array.Empty<string>());NeighborStableIds=new ReadOnlyCollection<string>(a); }
    }
    public sealed class ContentVersionStamp : IEquatable<ContentVersionStamp>
    {
        public const int ContentSchemaValue=1; public const string ContentVersionValue="area1-static-content-v1"; public const string FingerprintVersionValue="content-fingerprint-v1";
        public int ContentSchema { get; } public string ContentVersion { get; } public string FingerprintVersion { get; }
        public ContentVersionStamp(int contentSchema=1,string contentVersion=ContentVersionValue,string fingerprintVersion=FingerprintVersionValue) { ContentSchema=contentSchema;ContentVersion=contentVersion??string.Empty;FingerprintVersion=fingerprintVersion??string.Empty; }
        public bool Equals(ContentVersionStamp other) => other!=null && ContentSchema==other.ContentSchema && ContentVersion==other.ContentVersion && FingerprintVersion==other.FingerprintVersion;
        public override bool Equals(object obj)=>Equals(obj as ContentVersionStamp); public override int GetHashCode()=>ContentSchema ^ (ContentVersion??string.Empty).GetHashCode() ^ (FingerprintVersion??string.Empty).GetHashCode();
    }
    public sealed class ContentReplayHeader
    {
        public string RulesVersion { get; } public int ContentSchema { get; } public string ContentVersion { get; } public string FingerprintVersion { get; } public string ContentFingerprint { get; }
        public ContentReplayHeader(string rulesVersion,int contentSchema,string contentVersion,string fingerprintVersion,string contentFingerprint) { RulesVersion=rulesVersion??string.Empty;ContentSchema=contentSchema;ContentVersion=contentVersion??string.Empty;FingerprintVersion=fingerprintVersion??string.Empty;ContentFingerprint=contentFingerprint??string.Empty; }
    }
    public enum ContentMismatchReason { RulesVersionMismatch, ContentSchemaMismatch, ContentVersionMismatch, FingerprintVersionMismatch, ContentFingerprintMismatch }
    public sealed class ContentCompatibilityException : Exception
    {
        public ContentMismatchReason Reason { get; } public string Expected { get; } public string Actual { get; }
        public ContentCompatibilityException(ContentMismatchReason reason,string expected,string actual) : base("CONTENT_MISMATCH:"+reason+":expected="+(expected??string.Empty)+":actual="+(actual??string.Empty)) { Reason=reason;Expected=expected??string.Empty;Actual=actual??string.Empty; }
    }
    public static class ContentCompatibility
    {
        public static void EnsureCompatible(ContentReplayHeader expected, string rulesVersion, ContentVersionStamp version, string fingerprint)
        {
            if (expected==null) throw new ArgumentNullException(nameof(expected)); if(version==null) throw new ArgumentNullException(nameof(version));
            Check(ContentMismatchReason.RulesVersionMismatch,expected.RulesVersion,rulesVersion); Check(ContentMismatchReason.ContentSchemaMismatch,expected.ContentSchema,version.ContentSchema); Check(ContentMismatchReason.ContentVersionMismatch,expected.ContentVersion,version.ContentVersion); Check(ContentMismatchReason.FingerprintVersionMismatch,expected.FingerprintVersion,version.FingerprintVersion); Check(ContentMismatchReason.ContentFingerprintMismatch,expected.ContentFingerprint,fingerprint);
        }
        static void Check(ContentMismatchReason reason,object expected,object actual) { var e=Convert.ToString(expected,System.Globalization.CultureInfo.InvariantCulture)??string.Empty;var a=Convert.ToString(actual,System.Globalization.CultureInfo.InvariantCulture)??string.Empty;if(!string.Equals(e,a,StringComparison.Ordinal))throw new ContentCompatibilityException(reason,e,a); }
    }
}
