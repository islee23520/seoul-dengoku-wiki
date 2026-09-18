using System;
namespace Janseon.Data.Validation {
 public enum CatalogValidationReason { DuplicateStableId, DuplicateCoreId, MissingReference, InvalidReference, RuleDrift, MalformedStableId, InvalidFormation, InvalidStationGraph, UnsupportedContentSchema }
 public sealed class CatalogValidationException : Exception { public CatalogValidationReason Reason { get; } public CatalogValidationException(CatalogValidationReason reason,string message) : base(message) { Reason=reason; } }
}
