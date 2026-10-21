import { createHash } from 'node:crypto';
import { deepStrictEqual } from 'node:assert';

export const CENSUS_DOCUMENT_PINS = Object.freeze({
  ledger: { path: 'lore/editorial/Seoul-Relocation-Ledger.json', sourceSha256: '627a6e7d5059256a06e818b908982b74df68fff656248ee1a90484094f7a535c', documentSha256: '43a794f4319ad2261cda0efcaed2d53620778cd10093fb4446fa655e0c518022' },
  review: { path: 'lore/editorial/Seoul-Narrative-Review.json', sourceSha256: '59c493ad1997695f418e455f57e9c8c0645e8eafb9d11c9877998347b2c6d3eb', documentSha256: '8b3c22125fb90e5df2a3b23f3b4669c4083e1dcbad738df5b0577dddc41633ca' },
});
// Fixed source-derived domain mapping: field names, SQL columns, types, and key-order variants only.
// Each object shape has its own named domain table; no values live in this mapping.
export const CENSUS_DOMAIN_MAPPING = [
  {
    "path": "binding",
    "table": "census_binding",
    "signatures": [
      [
        "baselineSha256",
        "baseCommit",
        "identitySetHashes",
        "task2"
      ]
    ],
    "fields": [
      {
        "key": "baselineSha256",
        "types": [
          "string"
        ],
        "column": "baseline_sha256"
      },
      {
        "key": "baseCommit",
        "types": [
          "string"
        ],
        "column": "base_commit"
      },
      {
        "key": "identitySetHashes",
        "types": [
          "object"
        ],
        "column": "identity_set_hashes"
      },
      {
        "key": "task2",
        "types": [
          "object"
        ],
        "column": "task2"
      }
    ],
    "count": 1
  },
  {
    "path": "binding/identitySetHashes",
    "table": "census_binding_identity_set_hashes",
    "signatures": [
      [
        "persons",
        "titles",
        "holdings",
        "grants",
        "bindings",
        "states",
        "polities",
        "events",
        "relations",
        "courts"
      ]
    ],
    "fields": [
      {
        "key": "persons",
        "types": [
          "string"
        ],
        "column": "persons"
      },
      {
        "key": "titles",
        "types": [
          "string"
        ],
        "column": "titles"
      },
      {
        "key": "holdings",
        "types": [
          "string"
        ],
        "column": "holdings"
      },
      {
        "key": "grants",
        "types": [
          "string"
        ],
        "column": "grants"
      },
      {
        "key": "bindings",
        "types": [
          "string"
        ],
        "column": "bindings"
      },
      {
        "key": "states",
        "types": [
          "string"
        ],
        "column": "states"
      },
      {
        "key": "polities",
        "types": [
          "string"
        ],
        "column": "polities"
      },
      {
        "key": "events",
        "types": [
          "string"
        ],
        "column": "events"
      },
      {
        "key": "relations",
        "types": [
          "string"
        ],
        "column": "relations"
      },
      {
        "key": "courts",
        "types": [
          "string"
        ],
        "column": "courts"
      }
    ],
    "count": 1
  },
  {
    "path": "binding/task2",
    "table": "census_binding_task2",
    "signatures": [
      [
        "mergeCommit",
        "reviewedCommit",
        "geography",
        "spatial",
        "sourceFacts",
        "successor"
      ]
    ],
    "fields": [
      {
        "key": "mergeCommit",
        "types": [
          "string"
        ],
        "column": "merge_commit"
      },
      {
        "key": "reviewedCommit",
        "types": [
          "string"
        ],
        "column": "reviewed_commit"
      },
      {
        "key": "geography",
        "types": [
          "object"
        ],
        "column": "geography"
      },
      {
        "key": "spatial",
        "types": [
          "object"
        ],
        "column": "spatial"
      },
      {
        "key": "sourceFacts",
        "types": [
          "object"
        ],
        "column": "source_facts"
      },
      {
        "key": "successor",
        "types": [
          "object"
        ],
        "column": "successor"
      }
    ],
    "count": 1
  },
  {
    "path": "binding/task2/geography",
    "table": "census_binding_task2_geography",
    "signatures": [
      [
        "path",
        "sha256"
      ]
    ],
    "fields": [
      {
        "key": "path",
        "types": [
          "string"
        ],
        "column": "path"
      },
      {
        "key": "sha256",
        "types": [
          "string"
        ],
        "column": "sha256"
      }
    ],
    "count": 1
  },
  {
    "path": "binding/task2/sourceFacts",
    "table": "census_binding_task2_source_facts",
    "signatures": [
      [
        "membership",
        "census",
        "rights",
        "spatial"
      ]
    ],
    "fields": [
      {
        "key": "membership",
        "types": [
          "object"
        ],
        "column": "membership"
      },
      {
        "key": "census",
        "types": [
          "object"
        ],
        "column": "census"
      },
      {
        "key": "rights",
        "types": [
          "object"
        ],
        "column": "rights"
      },
      {
        "key": "spatial",
        "types": [
          "object"
        ],
        "column": "spatial"
      }
    ],
    "count": 1
  },
  {
    "path": "binding/task2/sourceFacts/census",
    "table": "census_binding_task2_source_facts_census",
    "signatures": [
      [
        "path",
        "sha256"
      ]
    ],
    "fields": [
      {
        "key": "path",
        "types": [
          "string"
        ],
        "column": "path"
      },
      {
        "key": "sha256",
        "types": [
          "string"
        ],
        "column": "sha256"
      }
    ],
    "count": 1
  },
  {
    "path": "binding/task2/sourceFacts/membership",
    "table": "census_binding_task2_source_facts_membership",
    "signatures": [
      [
        "path",
        "sha256"
      ]
    ],
    "fields": [
      {
        "key": "path",
        "types": [
          "string"
        ],
        "column": "path"
      },
      {
        "key": "sha256",
        "types": [
          "string"
        ],
        "column": "sha256"
      }
    ],
    "count": 1
  },
  {
    "path": "binding/task2/sourceFacts/rights",
    "table": "census_binding_task2_source_facts_rights",
    "signatures": [
      [
        "path",
        "sha256"
      ]
    ],
    "fields": [
      {
        "key": "path",
        "types": [
          "string"
        ],
        "column": "path"
      },
      {
        "key": "sha256",
        "types": [
          "string"
        ],
        "column": "sha256"
      }
    ],
    "count": 1
  },
  {
    "path": "binding/task2/sourceFacts/spatial",
    "table": "census_binding_task2_source_facts_spatial",
    "signatures": [
      [
        "path",
        "sha256"
      ]
    ],
    "fields": [
      {
        "key": "path",
        "types": [
          "string"
        ],
        "column": "path"
      },
      {
        "key": "sha256",
        "types": [
          "string"
        ],
        "column": "sha256"
      }
    ],
    "count": 1
  },
  {
    "path": "binding/task2/spatial",
    "table": "census_binding_task2_spatial",
    "signatures": [
      [
        "edition",
        "baseDate",
        "authority",
        "legalSurveyCertification",
        "current2026Geometry",
        "geometry",
        "archiveSha256"
      ]
    ],
    "fields": [
      {
        "key": "edition",
        "types": [
          "string"
        ],
        "column": "edition"
      },
      {
        "key": "baseDate",
        "types": [
          "string"
        ],
        "column": "base_date"
      },
      {
        "key": "authority",
        "types": [
          "string"
        ],
        "column": "authority"
      },
      {
        "key": "legalSurveyCertification",
        "types": [
          "boolean"
        ],
        "column": "legal_survey_certification"
      },
      {
        "key": "current2026Geometry",
        "types": [
          "boolean"
        ],
        "column": "current2026_geometry"
      },
      {
        "key": "geometry",
        "types": [
          "object"
        ],
        "column": "geometry"
      },
      {
        "key": "archiveSha256",
        "types": [
          "string"
        ],
        "column": "archive_sha256"
      }
    ],
    "count": 1
  },
  {
    "path": "binding/task2/spatial/geometry",
    "table": "census_binding_task2_spatial_geometry",
    "signatures": [
      [
        "path",
        "sha256",
        "crs",
        "features"
      ]
    ],
    "fields": [
      {
        "key": "path",
        "types": [
          "string"
        ],
        "column": "path"
      },
      {
        "key": "sha256",
        "types": [
          "string"
        ],
        "column": "sha256"
      },
      {
        "key": "crs",
        "types": [
          "string"
        ],
        "column": "crs"
      },
      {
        "key": "features",
        "types": [
          "number"
        ],
        "column": "features"
      }
    ],
    "count": 1
  },
  {
    "path": "binding/task2/successor",
    "table": "census_binding_task2_successor",
    "signatures": [
      [
        "schema",
        "batchId",
        "previousSha256",
        "beforeArchivePath",
        "proposal",
        "approval",
        "partitionSha256",
        "crossDistrictParentPolicy",
        "geography",
        "application",
        "independentReview"
      ]
    ],
    "fields": [
      {
        "key": "schema",
        "types": [
          "string"
        ],
        "column": "schema"
      },
      {
        "key": "batchId",
        "types": [
          "string"
        ],
        "column": "batch_id"
      },
      {
        "key": "previousSha256",
        "types": [
          "string"
        ],
        "column": "previous_sha256"
      },
      {
        "key": "beforeArchivePath",
        "types": [
          "string"
        ],
        "column": "before_archive_path"
      },
      {
        "key": "proposal",
        "types": [
          "object"
        ],
        "column": "proposal"
      },
      {
        "key": "approval",
        "types": [
          "object"
        ],
        "column": "approval"
      },
      {
        "key": "partitionSha256",
        "types": [
          "string"
        ],
        "column": "partition_sha256"
      },
      {
        "key": "crossDistrictParentPolicy",
        "types": [
          "string"
        ],
        "column": "cross_district_parent_policy"
      },
      {
        "key": "geography",
        "types": [
          "object"
        ],
        "column": "geography"
      },
      {
        "key": "application",
        "types": [
          "object"
        ],
        "column": "application"
      },
      {
        "key": "independentReview",
        "types": [
          "object"
        ],
        "column": "independent_review"
      }
    ],
    "count": 1
  },
  {
    "path": "binding/task2/successor/application",
    "table": "census_binding_task2_successor_application",
    "signatures": [
      [
        "path",
        "sha256"
      ]
    ],
    "fields": [
      {
        "key": "path",
        "types": [
          "string"
        ],
        "column": "path"
      },
      {
        "key": "sha256",
        "types": [
          "string"
        ],
        "column": "sha256"
      }
    ],
    "count": 1
  },
  {
    "path": "binding/task2/successor/approval",
    "table": "census_binding_task2_successor_approval",
    "signatures": [
      [
        "path",
        "sha256"
      ]
    ],
    "fields": [
      {
        "key": "path",
        "types": [
          "string"
        ],
        "column": "path"
      },
      {
        "key": "sha256",
        "types": [
          "string"
        ],
        "column": "sha256"
      }
    ],
    "count": 1
  },
  {
    "path": "binding/task2/successor/geography",
    "table": "census_binding_task2_successor_geography",
    "signatures": [
      [
        "path",
        "sha256"
      ]
    ],
    "fields": [
      {
        "key": "path",
        "types": [
          "string"
        ],
        "column": "path"
      },
      {
        "key": "sha256",
        "types": [
          "string"
        ],
        "column": "sha256"
      }
    ],
    "count": 1
  },
  {
    "path": "binding/task2/successor/independentReview",
    "table": "census_binding_task2_successor_independent_review",
    "signatures": [
      [
        "path",
        "sha256",
        "scope"
      ]
    ],
    "fields": [
      {
        "key": "path",
        "types": [
          "string"
        ],
        "column": "path"
      },
      {
        "key": "sha256",
        "types": [
          "string"
        ],
        "column": "sha256"
      },
      {
        "key": "scope",
        "types": [
          "string"
        ],
        "column": "scope"
      }
    ],
    "count": 1
  },
  {
    "path": "binding/task2/successor/proposal",
    "table": "census_binding_task2_successor_proposal",
    "signatures": [
      [
        "path",
        "sha256"
      ]
    ],
    "fields": [
      {
        "key": "path",
        "types": [
          "string"
        ],
        "column": "path"
      },
      {
        "key": "sha256",
        "types": [
          "string"
        ],
        "column": "sha256"
      }
    ],
    "count": 1
  },
  {
    "path": "ledger",
    "table": "census_ledger",
    "signatures": [
      [
        "schema",
        "binding",
        "people",
        "originalRights",
        "cardOccurrences",
        "candidateIdentity",
        "dependencyDispositions",
        "profileCitationDispositions",
        "localProvenanceDispositions",
        "connectedGroups",
        "sharedSourceGroups",
        "sourceFileOwnership",
        "batches",
        "approvals"
      ]
    ],
    "fields": [
      {
        "key": "schema",
        "types": [
          "string"
        ],
        "column": "schema"
      },
      {
        "key": "binding",
        "types": [
          "object"
        ],
        "column": "binding"
      },
      {
        "key": "people",
        "types": [
          "array"
        ],
        "column": "people",
        "element": "object"
      },
      {
        "key": "originalRights",
        "types": [
          "array"
        ],
        "column": "original_rights",
        "element": "object"
      },
      {
        "key": "cardOccurrences",
        "types": [
          "array"
        ],
        "column": "card_occurrences",
        "element": "object"
      },
      {
        "key": "candidateIdentity",
        "types": [
          "object"
        ],
        "column": "candidate_identity"
      },
      {
        "key": "dependencyDispositions",
        "types": [
          "array"
        ],
        "column": "dependency_dispositions",
        "element": "object"
      },
      {
        "key": "profileCitationDispositions",
        "types": [
          "array"
        ],
        "column": "profile_citation_dispositions",
        "element": "object"
      },
      {
        "key": "localProvenanceDispositions",
        "types": [
          "array"
        ],
        "column": "local_provenance_dispositions",
        "element": "object"
      },
      {
        "key": "connectedGroups",
        "types": [
          "array"
        ],
        "column": "connected_groups",
        "element": "object"
      },
      {
        "key": "sharedSourceGroups",
        "types": [
          "array"
        ],
        "column": "shared_source_groups",
        "element": "object"
      },
      {
        "key": "sourceFileOwnership",
        "types": [
          "array"
        ],
        "column": "source_file_ownership",
        "element": "object"
      },
      {
        "key": "batches",
        "types": [
          "array"
        ],
        "column": "batches",
        "element": "empty"
      },
      {
        "key": "approvals",
        "types": [
          "array"
        ],
        "column": "approvals",
        "element": "empty"
      }
    ],
    "count": 1
  },
  {
    "path": "ledger/candidateIdentity",
    "table": "census_ledger_candidate_identity",
    "signatures": [
      [
        "sourcePath",
        "sourceSha256",
        "existing",
        "candidates"
      ]
    ],
    "fields": [
      {
        "key": "sourcePath",
        "types": [
          "string"
        ],
        "column": "source_path"
      },
      {
        "key": "sourceSha256",
        "types": [
          "string"
        ],
        "column": "source_sha256"
      },
      {
        "key": "existing",
        "types": [
          "array"
        ],
        "column": "existing",
        "element": "object"
      },
      {
        "key": "candidates",
        "types": [
          "array"
        ],
        "column": "candidates",
        "element": "object"
      }
    ],
    "count": 1
  },
  {
    "path": "ledger/candidateIdentity/candidates/*",
    "table": "census_ledger_candidate_identity_candidates_entry",
    "signatures": [
      [
        "original",
        "issuedPersonId",
        "authority"
      ]
    ],
    "fields": [
      {
        "key": "original",
        "types": [
          "object"
        ],
        "column": "original"
      },
      {
        "key": "issuedPersonId",
        "types": [
          "string"
        ],
        "column": "issued_person_id"
      },
      {
        "key": "authority",
        "types": [
          "string"
        ],
        "column": "authority"
      }
    ],
    "count": 600
  },
  {
    "path": "ledger/candidateIdentity/candidates/*/original",
    "table": "census_ledger_candidate_identity_candidates_entry_original",
    "signatures": [
      [
        "ordinal",
        "name",
        "stage",
        "state",
        "title",
        "locked"
      ]
    ],
    "fields": [
      {
        "key": "ordinal",
        "types": [
          "number"
        ],
        "column": "ordinal"
      },
      {
        "key": "name",
        "types": [
          "string"
        ],
        "column": "name"
      },
      {
        "key": "stage",
        "types": [
          "string"
        ],
        "column": "stage"
      },
      {
        "key": "state",
        "types": [
          "string"
        ],
        "column": "state"
      },
      {
        "key": "title",
        "types": [
          "string"
        ],
        "column": "title"
      },
      {
        "key": "locked",
        "types": [
          "boolean"
        ],
        "column": "locked"
      }
    ],
    "count": 600
  },
  {
    "path": "ledger/candidateIdentity/existing/*",
    "table": "census_ledger_candidate_identity_existing_entry",
    "signatures": [
      [
        "original",
        "issuedPersonId"
      ]
    ],
    "fields": [
      {
        "key": "original",
        "types": [
          "object"
        ],
        "column": "original"
      },
      {
        "key": "issuedPersonId",
        "types": [
          "string"
        ],
        "column": "issued_person_id"
      }
    ],
    "count": 422
  },
  {
    "path": "ledger/candidateIdentity/existing/*/original",
    "table": "census_ledger_candidate_identity_existing_entry_original",
    "signatures": [
      [
        "id",
        "name"
      ]
    ],
    "fields": [
      {
        "key": "id",
        "types": [
          "string"
        ],
        "column": "id"
      },
      {
        "key": "name",
        "types": [
          "string"
        ],
        "column": "name"
      }
    ],
    "count": 422
  },
  {
    "path": "ledger/cardOccurrences/*",
    "table": "census_ledger_card_occurrences_entry",
    "signatures": [
      [
        "sourcePath",
        "jsonPointer",
        "anchor",
        "locale",
        "startBlock",
        "endBlockExclusive",
        "personIds",
        "originalSha256",
        "originalKey",
        "currentHash",
        "classification",
        "reviewStatus"
      ]
    ],
    "fields": [
      {
        "key": "sourcePath",
        "types": [
          "string"
        ],
        "column": "source_path"
      },
      {
        "key": "jsonPointer",
        "types": [
          "string"
        ],
        "column": "json_pointer"
      },
      {
        "key": "anchor",
        "types": [
          "string"
        ],
        "column": "anchor"
      },
      {
        "key": "locale",
        "types": [
          "string"
        ],
        "column": "locale"
      },
      {
        "key": "startBlock",
        "types": [
          "number"
        ],
        "column": "start_block"
      },
      {
        "key": "endBlockExclusive",
        "types": [
          "number"
        ],
        "column": "end_block_exclusive"
      },
      {
        "key": "personIds",
        "types": [
          "array"
        ],
        "column": "person_ids",
        "element": "string",
        "table": "census_ledger_card_occurrences_entry_person_ids"
      },
      {
        "key": "originalSha256",
        "types": [
          "string"
        ],
        "column": "original_sha256"
      },
      {
        "key": "originalKey",
        "types": [
          "string"
        ],
        "column": "original_key"
      },
      {
        "key": "currentHash",
        "types": [
          "string"
        ],
        "column": "current_hash"
      },
      {
        "key": "classification",
        "types": [
          "string"
        ],
        "column": "classification"
      },
      {
        "key": "reviewStatus",
        "types": [
          "string"
        ],
        "column": "review_status"
      }
    ],
    "count": 4168
  },
  {
    "path": "ledger/connectedGroups/*",
    "table": "census_ledger_connected_groups_entry",
    "signatures": [
      [
        "nodes",
        "personIds"
      ]
    ],
    "fields": [
      {
        "key": "nodes",
        "types": [
          "array"
        ],
        "column": "nodes",
        "element": "string",
        "table": "census_ledger_connected_groups_entry_nodes"
      },
      {
        "key": "personIds",
        "types": [
          "array"
        ],
        "column": "person_ids",
        "element": "string",
        "table": "census_ledger_connected_groups_entry_person_ids"
      }
    ],
    "count": 6
  },
  {
    "path": "ledger/dependencyDispositions/*",
    "table": "census_ledger_dependency_dispositions_entry",
    "signatures": [
      [
        "key",
        "original",
        "classification",
        "vocabulary",
        "status",
        "reason",
        "targets",
        "required",
        "reviewStatus"
      ],
      [
        "key",
        "original",
        "classification",
        "vocabulary",
        "status",
        "targets",
        "required",
        "reviewStatus"
      ],
      [
        "key",
        "original",
        "classification",
        "vocabulary",
        "status",
        "targets",
        "claims",
        "required",
        "reviewStatus"
      ],
      [
        "original",
        "status",
        "targets",
        "reason",
        "required",
        "reviewStatus"
      ]
    ],
    "fields": [
      {
        "key": "key",
        "types": [
          "string"
        ],
        "column": "key"
      },
      {
        "key": "original",
        "types": [
          "object"
        ],
        "column": "original"
      },
      {
        "key": "classification",
        "types": [
          "string"
        ],
        "column": "classification"
      },
      {
        "key": "vocabulary",
        "types": [
          "string"
        ],
        "column": "vocabulary"
      },
      {
        "key": "status",
        "types": [
          "string"
        ],
        "column": "status"
      },
      {
        "key": "reason",
        "types": [
          "string"
        ],
        "column": "reason"
      },
      {
        "key": "targets",
        "types": [
          "array"
        ],
        "column": "targets",
        "element": "object"
      },
      {
        "key": "required",
        "types": [
          "boolean"
        ],
        "column": "required"
      },
      {
        "key": "reviewStatus",
        "types": [
          "string"
        ],
        "column": "review_status"
      },
      {
        "key": "claims",
        "types": [
          "object"
        ],
        "column": "claims"
      }
    ],
    "count": 923
  },
  {
    "path": "ledger/dependencyDispositions/*/claims",
    "table": "census_ledger_dependency_dispositions_entry_claims",
    "signatures": [
      [
        "personId",
        "dates",
        "parentId",
        "parentAnchors",
        "limitation"
      ]
    ],
    "fields": [
      {
        "key": "personId",
        "types": [
          "string"
        ],
        "column": "person_id"
      },
      {
        "key": "dates",
        "types": [
          "array"
        ],
        "column": "dates",
        "element": "object"
      },
      {
        "key": "parentId",
        "types": [
          "string"
        ],
        "column": "parent_id"
      },
      {
        "key": "parentAnchors",
        "types": [
          "array"
        ],
        "column": "parent_anchors",
        "element": "string",
        "table": "census_ledger_dependency_dispositions_entry_claims_parent_anchors"
      },
      {
        "key": "limitation",
        "types": [
          "string"
        ],
        "column": "limitation"
      }
    ],
    "count": 1
  },
  {
    "path": "ledger/dependencyDispositions/*/claims/dates/*",
    "table": "census_ledger_dependency_dispositions_entry_claims_dates_entry",
    "signatures": [
      [
        "personId",
        "birthDate"
      ]
    ],
    "fields": [
      {
        "key": "personId",
        "types": [
          "string"
        ],
        "column": "person_id"
      },
      {
        "key": "birthDate",
        "types": [
          "string"
        ],
        "column": "birth_date"
      }
    ],
    "count": 2
  },
  {
    "path": "ledger/dependencyDispositions/*/original",
    "table": "census_ledger_dependency_dispositions_entry_original",
    "signatures": [
      [
        "sourcePath",
        "jsonPointer",
        "sourceSha256",
        "recordSha256",
        "target",
        "reason",
        "reviewStatus"
      ]
    ],
    "fields": [
      {
        "key": "sourcePath",
        "types": [
          "string"
        ],
        "column": "source_path"
      },
      {
        "key": "jsonPointer",
        "types": [
          "string"
        ],
        "column": "json_pointer"
      },
      {
        "key": "sourceSha256",
        "types": [
          "string"
        ],
        "column": "source_sha256"
      },
      {
        "key": "recordSha256",
        "types": [
          "string"
        ],
        "column": "record_sha256"
      },
      {
        "key": "target",
        "types": [
          "string"
        ],
        "column": "target"
      },
      {
        "key": "reason",
        "types": [
          "string"
        ],
        "column": "reason"
      },
      {
        "key": "reviewStatus",
        "types": [
          "string"
        ],
        "column": "review_status"
      }
    ],
    "count": 923
  },
  {
    "path": "ledger/dependencyDispositions/*/targets/*",
    "table": "census_ledger_dependency_dispositions_entry_targets_entry",
    "signatures": [
      [
        "sourcePath",
        "jsonPointer",
        "sourceSha256",
        "recordSha256"
      ]
    ],
    "fields": [
      {
        "key": "sourcePath",
        "types": [
          "string"
        ],
        "column": "source_path"
      },
      {
        "key": "jsonPointer",
        "types": [
          "string"
        ],
        "column": "json_pointer"
      },
      {
        "key": "sourceSha256",
        "types": [
          "string"
        ],
        "column": "source_sha256"
      },
      {
        "key": "recordSha256",
        "types": [
          "string"
        ],
        "column": "record_sha256"
      }
    ],
    "count": 913
  },
  {
    "path": "ledger/localProvenanceDispositions/*",
    "table": "census_ledger_local_provenance_dispositions_entry",
    "signatures": [
      [
        "key",
        "original",
        "status",
        "targets",
        "provenanceBoundary",
        "required",
        "reviewStatus"
      ]
    ],
    "fields": [
      {
        "key": "key",
        "types": [
          "string"
        ],
        "column": "key"
      },
      {
        "key": "original",
        "types": [
          "object"
        ],
        "column": "original"
      },
      {
        "key": "status",
        "types": [
          "string"
        ],
        "column": "status"
      },
      {
        "key": "targets",
        "types": [
          "array"
        ],
        "column": "targets",
        "element": "object"
      },
      {
        "key": "provenanceBoundary",
        "types": [
          "object"
        ],
        "column": "provenance_boundary"
      },
      {
        "key": "required",
        "types": [
          "boolean"
        ],
        "column": "required"
      },
      {
        "key": "reviewStatus",
        "types": [
          "string"
        ],
        "column": "review_status"
      }
    ],
    "count": 13
  },
  {
    "path": "ledger/localProvenanceDispositions/*/original",
    "table": "census_ledger_local_provenance_dispositions_entry_original",
    "signatures": [
      [
        "sourcePath",
        "jsonPointer",
        "sourceSha256",
        "recordSha256",
        "target",
        "selector",
        "vocabulary",
        "reason",
        "required",
        "reviewStatus"
      ]
    ],
    "fields": [
      {
        "key": "sourcePath",
        "types": [
          "string"
        ],
        "column": "source_path"
      },
      {
        "key": "jsonPointer",
        "types": [
          "string"
        ],
        "column": "json_pointer"
      },
      {
        "key": "sourceSha256",
        "types": [
          "string"
        ],
        "column": "source_sha256"
      },
      {
        "key": "recordSha256",
        "types": [
          "string"
        ],
        "column": "record_sha256"
      },
      {
        "key": "target",
        "types": [
          "string"
        ],
        "column": "target"
      },
      {
        "key": "selector",
        "types": [
          "null"
        ],
        "column": "selector"
      },
      {
        "key": "vocabulary",
        "types": [
          "string"
        ],
        "column": "vocabulary"
      },
      {
        "key": "reason",
        "types": [
          "string"
        ],
        "column": "reason"
      },
      {
        "key": "required",
        "types": [
          "boolean"
        ],
        "column": "required"
      },
      {
        "key": "reviewStatus",
        "types": [
          "string"
        ],
        "column": "review_status"
      }
    ],
    "count": 13
  },
  {
    "path": "ledger/localProvenanceDispositions/*/provenanceBoundary",
    "table": "census_ledger_local_provenance_dispositions_entry_provenance_boundary",
    "signatures": [
      [
        "kind",
        "schema",
        "currentFactAuthority"
      ],
      [
        "kind",
        "currentBoundary",
        "targets"
      ],
      [
        "kind",
        "boundarySha256",
        "targets"
      ],
      [
        "kind",
        "repository",
        "revision",
        "canonicalPath",
        "currentRuntime",
        "targets"
      ]
    ],
    "fields": [
      {
        "key": "kind",
        "types": [
          "string"
        ],
        "column": "kind"
      },
      {
        "key": "schema",
        "types": [
          "string"
        ],
        "column": "schema"
      },
      {
        "key": "currentFactAuthority",
        "types": [
          "boolean"
        ],
        "column": "current_fact_authority"
      },
      {
        "key": "currentBoundary",
        "types": [
          "boolean"
        ],
        "column": "current_boundary"
      },
      {
        "key": "targets",
        "types": [
          "array"
        ],
        "column": "targets",
        "element": "object"
      },
      {
        "key": "boundarySha256",
        "types": [
          "string"
        ],
        "column": "boundary_sha256"
      },
      {
        "key": "repository",
        "types": [
          "string"
        ],
        "column": "repository"
      },
      {
        "key": "revision",
        "types": [
          "string"
        ],
        "column": "revision"
      },
      {
        "key": "canonicalPath",
        "types": [
          "string"
        ],
        "column": "canonical_path"
      },
      {
        "key": "currentRuntime",
        "types": [
          "boolean"
        ],
        "column": "current_runtime"
      }
    ],
    "count": 13
  },
  {
    "path": "ledger/localProvenanceDispositions/*/provenanceBoundary/targets/*",
    "table": "census_ledger_local_provenance_dispositions_entry_provenance_boundary_targets_entry",
    "signatures": [
      [
        "sourcePath",
        "jsonPointer",
        "sourceSha256",
        "recordSha256"
      ]
    ],
    "fields": [
      {
        "key": "sourcePath",
        "types": [
          "string"
        ],
        "column": "source_path"
      },
      {
        "key": "jsonPointer",
        "types": [
          "string"
        ],
        "column": "json_pointer"
      },
      {
        "key": "sourceSha256",
        "types": [
          "string"
        ],
        "column": "source_sha256"
      },
      {
        "key": "recordSha256",
        "types": [
          "string"
        ],
        "column": "record_sha256"
      }
    ],
    "count": 5
  },
  {
    "path": "ledger/localProvenanceDispositions/*/targets/*",
    "table": "census_ledger_local_provenance_dispositions_entry_targets_entry",
    "signatures": [
      [
        "sourcePath",
        "jsonPointer",
        "sourceSha256",
        "recordSha256"
      ]
    ],
    "fields": [
      {
        "key": "sourcePath",
        "types": [
          "string"
        ],
        "column": "source_path"
      },
      {
        "key": "jsonPointer",
        "types": [
          "string"
        ],
        "column": "json_pointer"
      },
      {
        "key": "sourceSha256",
        "types": [
          "string"
        ],
        "column": "source_sha256"
      },
      {
        "key": "recordSha256",
        "types": [
          "string"
        ],
        "column": "record_sha256"
      }
    ],
    "count": 15
  },
  {
    "path": "ledger/originalRights/*",
    "table": "census_ledger_original_rights_entry",
    "signatures": [
      [
        "set",
        "id",
        "originalRef",
        "newRefs",
        "disposition",
        "batchId",
        "approval"
      ]
    ],
    "fields": [
      {
        "key": "set",
        "types": [
          "string"
        ],
        "column": "set"
      },
      {
        "key": "id",
        "types": [
          "string"
        ],
        "column": "id"
      },
      {
        "key": "originalRef",
        "types": [
          "object"
        ],
        "column": "original_ref"
      },
      {
        "key": "newRefs",
        "types": [
          "array"
        ],
        "column": "new_refs",
        "element": "object"
      },
      {
        "key": "disposition",
        "types": [
          "string"
        ],
        "column": "disposition"
      },
      {
        "key": "batchId",
        "types": [
          "string",
          "null"
        ],
        "column": "batch_id"
      },
      {
        "key": "approval",
        "types": [
          "object",
          "null"
        ],
        "column": "approval"
      }
    ],
    "count": 2021
  },
  {
    "path": "ledger/originalRights/*/approval",
    "table": "census_ledger_original_rights_entry_approval",
    "signatures": [
      [
        "kind",
        "bodySha256",
        "messageRef",
        "authorizationSha256"
      ]
    ],
    "fields": [
      {
        "key": "kind",
        "types": [
          "string"
        ],
        "column": "kind"
      },
      {
        "key": "bodySha256",
        "types": [
          "string"
        ],
        "column": "body_sha256"
      },
      {
        "key": "messageRef",
        "types": [
          "string"
        ],
        "column": "message_ref"
      },
      {
        "key": "authorizationSha256",
        "types": [
          "string"
        ],
        "column": "authorization_sha256"
      }
    ],
    "count": 411
  },
  {
    "path": "ledger/originalRights/*/newRefs/*",
    "table": "census_ledger_original_rights_entry_new_refs_entry",
    "signatures": [
      [
        "id",
        "sourcePath",
        "jsonPointer",
        "sourceSha256",
        "recordSha256"
      ]
    ],
    "fields": [
      {
        "key": "id",
        "types": [
          "string"
        ],
        "column": "id"
      },
      {
        "key": "sourcePath",
        "types": [
          "string"
        ],
        "column": "source_path"
      },
      {
        "key": "jsonPointer",
        "types": [
          "string"
        ],
        "column": "json_pointer"
      },
      {
        "key": "sourceSha256",
        "types": [
          "string"
        ],
        "column": "source_sha256"
      },
      {
        "key": "recordSha256",
        "types": [
          "string"
        ],
        "column": "record_sha256"
      }
    ],
    "count": 263
  },
  {
    "path": "ledger/originalRights/*/originalRef",
    "table": "census_ledger_original_rights_entry_original_ref",
    "signatures": [
      [
        "id",
        "sourcePath",
        "jsonPointer",
        "sourceSha256",
        "recordSha256"
      ]
    ],
    "fields": [
      {
        "key": "id",
        "types": [
          "string"
        ],
        "column": "id"
      },
      {
        "key": "sourcePath",
        "types": [
          "string"
        ],
        "column": "source_path"
      },
      {
        "key": "jsonPointer",
        "types": [
          "string"
        ],
        "column": "json_pointer"
      },
      {
        "key": "sourceSha256",
        "types": [
          "string"
        ],
        "column": "source_sha256"
      },
      {
        "key": "recordSha256",
        "types": [
          "string"
        ],
        "column": "record_sha256"
      }
    ],
    "count": 2021
  },
  {
    "path": "ledger/people/*",
    "table": "census_ledger_people_entry",
    "signatures": [
      [
        "personId",
        "batchId",
        "originalRefs",
        "proposedLocationRefs",
        "proposedHoldingRefs",
        "titleChanges",
        "narrativeChanges",
        "preservedFacts",
        "changedFacts",
        "status",
        "approval",
        "inventory",
        "approvals"
      ]
    ],
    "fields": [
      {
        "key": "personId",
        "types": [
          "string"
        ],
        "column": "person_id"
      },
      {
        "key": "batchId",
        "types": [
          "string"
        ],
        "column": "batch_id"
      },
      {
        "key": "originalRefs",
        "types": [
          "array"
        ],
        "column": "original_refs",
        "element": "object"
      },
      {
        "key": "proposedLocationRefs",
        "types": [
          "array"
        ],
        "column": "proposed_location_refs",
        "element": "empty"
      },
      {
        "key": "proposedHoldingRefs",
        "types": [
          "array"
        ],
        "column": "proposed_holding_refs",
        "element": "empty"
      },
      {
        "key": "titleChanges",
        "types": [
          "array"
        ],
        "column": "title_changes",
        "element": "empty"
      },
      {
        "key": "narrativeChanges",
        "types": [
          "array"
        ],
        "column": "narrative_changes",
        "element": "empty"
      },
      {
        "key": "preservedFacts",
        "types": [
          "array"
        ],
        "column": "preserved_facts",
        "element": "empty"
      },
      {
        "key": "changedFacts",
        "types": [
          "array"
        ],
        "column": "changed_facts",
        "element": "empty"
      },
      {
        "key": "status",
        "types": [
          "string"
        ],
        "column": "status"
      },
      {
        "key": "approval",
        "types": [
          "null"
        ],
        "column": "approval"
      },
      {
        "key": "inventory",
        "types": [
          "object"
        ],
        "column": "inventory"
      },
      {
        "key": "approvals",
        "types": [
          "array"
        ],
        "column": "approvals",
        "element": "object"
      }
    ],
    "count": 1022
  },
  {
    "path": "ledger/people/*/approvals/*",
    "table": "census_ledger_people_entry_approvals_entry",
    "signatures": [
      [
        "kind",
        "bodySha256",
        "messageRef"
      ]
    ],
    "fields": [
      {
        "key": "kind",
        "types": [
          "string"
        ],
        "column": "kind"
      },
      {
        "key": "bodySha256",
        "types": [
          "string"
        ],
        "column": "body_sha256"
      },
      {
        "key": "messageRef",
        "types": [
          "string"
        ],
        "column": "message_ref"
      }
    ],
    "count": 3068
  },
  {
    "path": "ledger/people/*/inventory",
    "table": "census_ledger_people_entry_inventory",
    "signatures": [
      [
        "issued",
        "cardKeys",
        "primaryCard",
        "birthday",
        "originalValues",
        "publicRoute",
        "protectionStatus"
      ]
    ],
    "fields": [
      {
        "key": "issued",
        "types": [
          "object"
        ],
        "column": "issued"
      },
      {
        "key": "cardKeys",
        "types": [
          "array"
        ],
        "column": "card_keys",
        "element": "string",
        "table": "census_ledger_people_entry_inventory_card_keys"
      },
      {
        "key": "primaryCard",
        "types": [
          "object"
        ],
        "column": "primary_card"
      },
      {
        "key": "birthday",
        "types": [
          "object"
        ],
        "column": "birthday"
      },
      {
        "key": "originalValues",
        "types": [
          "object"
        ],
        "column": "original_values"
      },
      {
        "key": "publicRoute",
        "types": [
          "string"
        ],
        "column": "public_route"
      },
      {
        "key": "protectionStatus",
        "types": [
          "string"
        ],
        "column": "protection_status"
      }
    ],
    "count": 1022
  },
  {
    "path": "ledger/people/*/inventory/birthday",
    "table": "census_ledger_people_entry_inventory_birthday",
    "signatures": [
      [
        "id",
        "name",
        "birthDate",
        "sourceStatus",
        "sourceRefs"
      ]
    ],
    "fields": [
      {
        "key": "id",
        "types": [
          "string"
        ],
        "column": "id"
      },
      {
        "key": "name",
        "types": [
          "string"
        ],
        "column": "name"
      },
      {
        "key": "birthDate",
        "types": [
          "string"
        ],
        "column": "birth_date"
      },
      {
        "key": "sourceStatus",
        "types": [
          "string"
        ],
        "column": "source_status"
      },
      {
        "key": "sourceRefs",
        "types": [
          "array"
        ],
        "column": "source_refs",
        "element": "string",
        "table": "census_ledger_people_entry_inventory_birthday_source_refs"
      }
    ],
    "count": 1022
  },
  {
    "path": "ledger/people/*/inventory/issued",
    "table": "census_ledger_people_entry_inventory_issued",
    "signatures": [
      [
        "id",
        "name"
      ],
      [
        "id",
        "name",
        "aliases"
      ]
    ],
    "fields": [
      {
        "key": "id",
        "types": [
          "string"
        ],
        "column": "id"
      },
      {
        "key": "name",
        "types": [
          "string"
        ],
        "column": "name"
      },
      {
        "key": "aliases",
        "types": [
          "array"
        ],
        "column": "aliases",
        "element": "string",
        "table": "census_ledger_people_entry_inventory_issued_aliases"
      }
    ],
    "count": 1022
  },
  {
    "path": "ledger/people/*/inventory/originalValues",
    "table": "census_ledger_people_entry_inventory_original_values",
    "signatures": [
      [
        "name",
        "title",
        "stage",
        "state",
        "state_name",
        "generation",
        "source",
        "minors",
        "values",
        "desire",
        "locked"
      ],
      [
        "name",
        "title",
        "stage",
        "state",
        "state_name",
        "generation",
        "source",
        "minors",
        "values",
        "desire"
      ]
    ],
    "fields": [
      {
        "key": "name",
        "types": [
          "string"
        ],
        "column": "name"
      },
      {
        "key": "title",
        "types": [
          "string"
        ],
        "column": "title"
      },
      {
        "key": "stage",
        "types": [
          "string"
        ],
        "column": "stage"
      },
      {
        "key": "state",
        "types": [
          "string"
        ],
        "column": "state"
      },
      {
        "key": "state_name",
        "types": [
          "string"
        ],
        "column": "state_name"
      },
      {
        "key": "generation",
        "types": [
          "string"
        ],
        "column": "generation"
      },
      {
        "key": "source",
        "types": [
          "string"
        ],
        "column": "source"
      },
      {
        "key": "minors",
        "types": [
          "boolean"
        ],
        "column": "minors"
      },
      {
        "key": "values",
        "types": [
          "object"
        ],
        "column": "values"
      },
      {
        "key": "desire",
        "types": [
          "object"
        ],
        "column": "desire"
      },
      {
        "key": "locked",
        "types": [
          "boolean"
        ],
        "column": "locked"
      }
    ],
    "count": 1022
  },
  {
    "path": "ledger/people/*/inventory/originalValues/desire",
    "table": "census_ledger_people_entry_inventory_original_values_desire",
    "signatures": [
      [
        "갈망",
        "독점",
        "위험",
        "과시",
        "지속",
        "지향",
        "결합"
      ]
    ],
    "fields": [
      {
        "key": "갈망",
        "types": [
          "number"
        ],
        "column": "갈망"
      },
      {
        "key": "독점",
        "types": [
          "number"
        ],
        "column": "독점"
      },
      {
        "key": "위험",
        "types": [
          "number"
        ],
        "column": "위험"
      },
      {
        "key": "과시",
        "types": [
          "number"
        ],
        "column": "과시"
      },
      {
        "key": "지속",
        "types": [
          "number"
        ],
        "column": "지속"
      },
      {
        "key": "지향",
        "types": [
          "string",
          "null"
        ],
        "column": "지향"
      },
      {
        "key": "결합",
        "types": [
          "string",
          "null"
        ],
        "column": "결합"
      }
    ],
    "count": 1022
  },
  {
    "path": "ledger/people/*/inventory/originalValues/values",
    "table": "census_ledger_people_entry_inventory_original_values_values",
    "signatures": [
      [
        "권위",
        "개방",
        "무력",
        "물질",
        "공동",
        "원칙",
        "공개",
        "자격",
        "분산",
        "변혁"
      ]
    ],
    "fields": [
      {
        "key": "권위",
        "types": [
          "number"
        ],
        "column": "권위"
      },
      {
        "key": "개방",
        "types": [
          "number"
        ],
        "column": "개방"
      },
      {
        "key": "무력",
        "types": [
          "number"
        ],
        "column": "무력"
      },
      {
        "key": "물질",
        "types": [
          "number"
        ],
        "column": "물질"
      },
      {
        "key": "공동",
        "types": [
          "number"
        ],
        "column": "공동"
      },
      {
        "key": "원칙",
        "types": [
          "number"
        ],
        "column": "원칙"
      },
      {
        "key": "공개",
        "types": [
          "number"
        ],
        "column": "공개"
      },
      {
        "key": "자격",
        "types": [
          "number"
        ],
        "column": "자격"
      },
      {
        "key": "분산",
        "types": [
          "number"
        ],
        "column": "분산"
      },
      {
        "key": "변혁",
        "types": [
          "number"
        ],
        "column": "변혁"
      }
    ],
    "count": 1022
  },
  {
    "path": "ledger/people/*/inventory/primaryCard",
    "table": "census_ledger_people_entry_inventory_primary_card",
    "signatures": [
      [
        "personId",
        "selected",
        "reason",
        "candidates"
      ]
    ],
    "fields": [
      {
        "key": "personId",
        "types": [
          "string"
        ],
        "column": "person_id"
      },
      {
        "key": "selected",
        "types": [
          "object"
        ],
        "column": "selected"
      },
      {
        "key": "reason",
        "types": [
          "string"
        ],
        "column": "reason"
      },
      {
        "key": "candidates",
        "types": [
          "array"
        ],
        "column": "candidates",
        "element": "object"
      }
    ],
    "count": 1022
  },
  {
    "path": "ledger/people/*/inventory/primaryCard/candidates/*",
    "table": "census_ledger_people_entry_inventory_primary_card_candidates_entry",
    "signatures": [
      [
        "sourcePath",
        "anchor",
        "heading",
        "encounterOrder",
        "length",
        "bodySha256",
        "primary"
      ]
    ],
    "fields": [
      {
        "key": "sourcePath",
        "types": [
          "string"
        ],
        "column": "source_path"
      },
      {
        "key": "anchor",
        "types": [
          "string"
        ],
        "column": "anchor"
      },
      {
        "key": "heading",
        "types": [
          "string"
        ],
        "column": "heading"
      },
      {
        "key": "encounterOrder",
        "types": [
          "number"
        ],
        "column": "encounter_order"
      },
      {
        "key": "length",
        "types": [
          "number"
        ],
        "column": "length"
      },
      {
        "key": "bodySha256",
        "types": [
          "string"
        ],
        "column": "body_sha256"
      },
      {
        "key": "primary",
        "types": [
          "boolean"
        ],
        "column": "primary"
      }
    ],
    "count": 1038
  },
  {
    "path": "ledger/people/*/inventory/primaryCard/selected",
    "table": "census_ledger_people_entry_inventory_primary_card_selected",
    "signatures": [
      [
        "sourcePath",
        "anchor",
        "heading",
        "encounterOrder",
        "length",
        "bodySha256",
        "primary"
      ]
    ],
    "fields": [
      {
        "key": "sourcePath",
        "types": [
          "string"
        ],
        "column": "source_path"
      },
      {
        "key": "anchor",
        "types": [
          "string"
        ],
        "column": "anchor"
      },
      {
        "key": "heading",
        "types": [
          "string"
        ],
        "column": "heading"
      },
      {
        "key": "encounterOrder",
        "types": [
          "number"
        ],
        "column": "encounter_order"
      },
      {
        "key": "length",
        "types": [
          "number"
        ],
        "column": "length"
      },
      {
        "key": "bodySha256",
        "types": [
          "string"
        ],
        "column": "body_sha256"
      },
      {
        "key": "primary",
        "types": [
          "boolean"
        ],
        "column": "primary"
      }
    ],
    "count": 1022
  },
  {
    "path": "ledger/people/*/originalRefs/*",
    "table": "census_ledger_people_entry_original_refs_entry",
    "signatures": [
      [
        "id",
        "sourcePath",
        "jsonPointer",
        "sourceSha256",
        "recordSha256"
      ]
    ],
    "fields": [
      {
        "key": "id",
        "types": [
          "string"
        ],
        "column": "id"
      },
      {
        "key": "sourcePath",
        "types": [
          "string"
        ],
        "column": "source_path"
      },
      {
        "key": "jsonPointer",
        "types": [
          "string"
        ],
        "column": "json_pointer"
      },
      {
        "key": "sourceSha256",
        "types": [
          "string"
        ],
        "column": "source_sha256"
      },
      {
        "key": "recordSha256",
        "types": [
          "string"
        ],
        "column": "record_sha256"
      }
    ],
    "count": 1022
  },
  {
    "path": "ledger/profileCitationDispositions/*",
    "table": "census_ledger_profile_citation_dispositions_entry",
    "signatures": [
      [
        "key",
        "original",
        "status",
        "targets",
        "citationBoundary",
        "required",
        "reviewStatus"
      ]
    ],
    "fields": [
      {
        "key": "key",
        "types": [
          "string"
        ],
        "column": "key"
      },
      {
        "key": "original",
        "types": [
          "object"
        ],
        "column": "original"
      },
      {
        "key": "status",
        "types": [
          "string"
        ],
        "column": "status"
      },
      {
        "key": "targets",
        "types": [
          "array"
        ],
        "column": "targets",
        "element": "object"
      },
      {
        "key": "citationBoundary",
        "types": [
          "object"
        ],
        "column": "citation_boundary"
      },
      {
        "key": "required",
        "types": [
          "boolean"
        ],
        "column": "required"
      },
      {
        "key": "reviewStatus",
        "types": [
          "string"
        ],
        "column": "review_status"
      }
    ],
    "count": 240
  },
  {
    "path": "ledger/profileCitationDispositions/*/citationBoundary",
    "table": "census_ledger_profile_citation_dispositions_entry_citation_boundary",
    "signatures": [
      [
        "kind",
        "candidate",
        "additionalAnchors",
        "corroboration",
        "targets"
      ]
    ],
    "fields": [
      {
        "key": "kind",
        "types": [
          "string"
        ],
        "column": "kind"
      },
      {
        "key": "candidate",
        "types": [
          "string"
        ],
        "column": "candidate"
      },
      {
        "key": "additionalAnchors",
        "types": [
          "array"
        ],
        "column": "additional_anchors",
        "element": "string",
        "table": "census_ledger_profile_citation_dispositions_entry_citation_boundary_additional_anchors"
      },
      {
        "key": "corroboration",
        "types": [
          "object"
        ],
        "column": "corroboration"
      },
      {
        "key": "targets",
        "types": [
          "array"
        ],
        "column": "targets",
        "element": "object"
      }
    ],
    "count": 240
  },
  {
    "path": "ledger/profileCitationDispositions/*/citationBoundary/corroboration",
    "table": "census_ledger_profile_citation_dispositions_entry_citation_boundary_corroboration",
    "signatures": [
      [
        "sourcePath",
        "jsonPointer",
        "sourceSha256",
        "recordSha256"
      ]
    ],
    "fields": [
      {
        "key": "sourcePath",
        "types": [
          "string"
        ],
        "column": "source_path"
      },
      {
        "key": "jsonPointer",
        "types": [
          "string"
        ],
        "column": "json_pointer"
      },
      {
        "key": "sourceSha256",
        "types": [
          "string"
        ],
        "column": "source_sha256"
      },
      {
        "key": "recordSha256",
        "types": [
          "string"
        ],
        "column": "record_sha256"
      }
    ],
    "count": 240
  },
  {
    "path": "ledger/profileCitationDispositions/*/citationBoundary/targets/*",
    "table": "census_ledger_profile_citation_dispositions_entry_citation_boundary_targets_entry",
    "signatures": [
      [
        "sourcePath",
        "jsonPointer",
        "sourceSha256",
        "recordSha256"
      ]
    ],
    "fields": [
      {
        "key": "sourcePath",
        "types": [
          "string"
        ],
        "column": "source_path"
      },
      {
        "key": "jsonPointer",
        "types": [
          "string"
        ],
        "column": "json_pointer"
      },
      {
        "key": "sourceSha256",
        "types": [
          "string"
        ],
        "column": "source_sha256"
      },
      {
        "key": "recordSha256",
        "types": [
          "string"
        ],
        "column": "record_sha256"
      }
    ],
    "count": 360
  },
  {
    "path": "ledger/profileCitationDispositions/*/original",
    "table": "census_ledger_profile_citation_dispositions_entry_original",
    "signatures": [
      [
        "sourcePath",
        "jsonPointer",
        "sourceSha256",
        "recordSha256",
        "target",
        "selector",
        "vocabulary",
        "reason",
        "required",
        "reviewStatus"
      ]
    ],
    "fields": [
      {
        "key": "sourcePath",
        "types": [
          "string"
        ],
        "column": "source_path"
      },
      {
        "key": "jsonPointer",
        "types": [
          "string"
        ],
        "column": "json_pointer"
      },
      {
        "key": "sourceSha256",
        "types": [
          "string"
        ],
        "column": "source_sha256"
      },
      {
        "key": "recordSha256",
        "types": [
          "string"
        ],
        "column": "record_sha256"
      },
      {
        "key": "target",
        "types": [
          "string"
        ],
        "column": "target"
      },
      {
        "key": "selector",
        "types": [
          "null"
        ],
        "column": "selector"
      },
      {
        "key": "vocabulary",
        "types": [
          "string"
        ],
        "column": "vocabulary"
      },
      {
        "key": "reason",
        "types": [
          "string"
        ],
        "column": "reason"
      },
      {
        "key": "required",
        "types": [
          "boolean"
        ],
        "column": "required"
      },
      {
        "key": "reviewStatus",
        "types": [
          "string"
        ],
        "column": "review_status"
      }
    ],
    "count": 240
  },
  {
    "path": "ledger/profileCitationDispositions/*/targets/*",
    "table": "census_ledger_profile_citation_dispositions_entry_targets_entry",
    "signatures": [
      [
        "sourcePath",
        "jsonPointer",
        "sourceSha256",
        "recordSha256"
      ]
    ],
    "fields": [
      {
        "key": "sourcePath",
        "types": [
          "string"
        ],
        "column": "source_path"
      },
      {
        "key": "jsonPointer",
        "types": [
          "string"
        ],
        "column": "json_pointer"
      },
      {
        "key": "sourceSha256",
        "types": [
          "string"
        ],
        "column": "source_sha256"
      },
      {
        "key": "recordSha256",
        "types": [
          "string"
        ],
        "column": "record_sha256"
      }
    ],
    "count": 360
  },
  {
    "path": "ledger/sharedSourceGroups/*",
    "table": "census_ledger_shared_source_groups_entry",
    "signatures": [
      [
        "nodes",
        "personIds"
      ]
    ],
    "fields": [
      {
        "key": "nodes",
        "types": [
          "array"
        ],
        "column": "nodes",
        "element": "string",
        "table": "census_ledger_shared_source_groups_entry_nodes"
      },
      {
        "key": "personIds",
        "types": [
          "array"
        ],
        "column": "person_ids",
        "element": "string",
        "table": "census_ledger_shared_source_groups_entry_person_ids"
      }
    ],
    "count": 1
  },
  {
    "path": "ledger/sourceFileOwnership/*",
    "table": "census_ledger_source_file_ownership_entry",
    "signatures": [
      [
        "sourcePath",
        "writer",
        "batchId",
        "application",
        "dependencyNode"
      ]
    ],
    "fields": [
      {
        "key": "sourcePath",
        "types": [
          "string"
        ],
        "column": "source_path"
      },
      {
        "key": "writer",
        "types": [
          "null"
        ],
        "column": "writer"
      },
      {
        "key": "batchId",
        "types": [
          "null"
        ],
        "column": "batch_id"
      },
      {
        "key": "application",
        "types": [
          "string"
        ],
        "column": "application"
      },
      {
        "key": "dependencyNode",
        "types": [
          "string"
        ],
        "column": "dependency_node"
      }
    ],
    "count": 281
  },
  {
    "path": "review",
    "table": "census_review",
    "signatures": [
      [
        "schema",
        "binding",
        "documents",
        "preservationInventory",
        "occurrenceStorage",
        "mapping",
        "dependencyInventory",
        "dependencyTriage",
        "receipts",
        "approvals",
        "samples",
        "reviewStatus"
      ]
    ],
    "fields": [
      {
        "key": "schema",
        "types": [
          "string"
        ],
        "column": "schema"
      },
      {
        "key": "binding",
        "types": [
          "object"
        ],
        "column": "binding"
      },
      {
        "key": "documents",
        "types": [
          "array"
        ],
        "column": "documents",
        "element": "object"
      },
      {
        "key": "preservationInventory",
        "types": [
          "array"
        ],
        "column": "preservation_inventory",
        "element": "object"
      },
      {
        "key": "occurrenceStorage",
        "types": [
          "object"
        ],
        "column": "occurrence_storage"
      },
      {
        "key": "mapping",
        "types": [
          "object"
        ],
        "column": "mapping"
      },
      {
        "key": "dependencyInventory",
        "types": [
          "object"
        ],
        "column": "dependency_inventory"
      },
      {
        "key": "dependencyTriage",
        "types": [
          "object"
        ],
        "column": "dependency_triage"
      },
      {
        "key": "receipts",
        "types": [
          "array"
        ],
        "column": "receipts",
        "element": "object"
      },
      {
        "key": "approvals",
        "types": [
          "array"
        ],
        "column": "approvals",
        "element": "empty"
      },
      {
        "key": "samples",
        "types": [
          "array"
        ],
        "column": "samples",
        "element": "empty"
      },
      {
        "key": "reviewStatus",
        "types": [
          "string"
        ],
        "column": "review_status"
      }
    ],
    "count": 1
  },
  {
    "path": "review/dependencyInventory",
    "table": "census_review_dependency_inventory",
    "signatures": [
      [
        "path",
        "sha256",
        "payloadSha256",
        "encoding"
      ]
    ],
    "fields": [
      {
        "key": "path",
        "types": [
          "string"
        ],
        "column": "path"
      },
      {
        "key": "sha256",
        "types": [
          "string"
        ],
        "column": "sha256"
      },
      {
        "key": "payloadSha256",
        "types": [
          "string"
        ],
        "column": "payload_sha256"
      },
      {
        "key": "encoding",
        "types": [
          "string"
        ],
        "column": "encoding"
      }
    ],
    "count": 1
  },
  {
    "path": "review/dependencyTriage",
    "table": "census_review_dependency_triage",
    "signatures": [
      [
        "path",
        "sha256"
      ]
    ],
    "fields": [
      {
        "key": "path",
        "types": [
          "string"
        ],
        "column": "path"
      },
      {
        "key": "sha256",
        "types": [
          "string"
        ],
        "column": "sha256"
      }
    ],
    "count": 1
  },
  {
    "path": "review/documents/*",
    "table": "census_review_documents_entry",
    "signatures": [
      [
        "sourcePath",
        "sourceId",
        "slug",
        "sourceStatus",
        "sourceKind",
        "originalSha256",
        "currentSha256",
        "classification",
        "disposition",
        "revisedByBatch",
        "reviewedAt",
        "receipt",
        "extraction",
        "semanticReview",
        "locales",
        "originalIndex",
        "currentIndex"
      ]
    ],
    "fields": [
      {
        "key": "sourcePath",
        "types": [
          "string"
        ],
        "column": "source_path"
      },
      {
        "key": "sourceId",
        "types": [
          "null",
          "string"
        ],
        "column": "source_id"
      },
      {
        "key": "slug",
        "types": [
          "null",
          "string"
        ],
        "column": "slug"
      },
      {
        "key": "sourceStatus",
        "types": [
          "null",
          "string"
        ],
        "column": "source_status"
      },
      {
        "key": "sourceKind",
        "types": [
          "string"
        ],
        "column": "source_kind"
      },
      {
        "key": "originalSha256",
        "types": [
          "string",
          "null"
        ],
        "column": "original_sha256"
      },
      {
        "key": "currentSha256",
        "types": [
          "string"
        ],
        "column": "current_sha256"
      },
      {
        "key": "classification",
        "types": [
          "string"
        ],
        "column": "classification"
      },
      {
        "key": "disposition",
        "types": [
          "string"
        ],
        "column": "disposition"
      },
      {
        "key": "revisedByBatch",
        "types": [
          "null",
          "string"
        ],
        "column": "revised_by_batch"
      },
      {
        "key": "reviewedAt",
        "types": [
          "null",
          "string"
        ],
        "column": "reviewed_at"
      },
      {
        "key": "receipt",
        "types": [
          "null",
          "object"
        ],
        "column": "receipt"
      },
      {
        "key": "extraction",
        "types": [
          "string"
        ],
        "column": "extraction"
      },
      {
        "key": "semanticReview",
        "types": [
          "string"
        ],
        "column": "semantic_review"
      },
      {
        "key": "locales",
        "types": [
          "array"
        ],
        "column": "locales",
        "element": "string",
        "table": "census_review_documents_entry_locales"
      },
      {
        "key": "originalIndex",
        "types": [
          "array"
        ],
        "column": "original_index",
        "element": "object"
      },
      {
        "key": "currentIndex",
        "types": [
          "array"
        ],
        "column": "current_index",
        "element": "object"
      }
    ],
    "count": 323
  },
  {
    "path": "review/documents/*/currentIndex/*",
    "table": "census_review_documents_entry_current_index_entry",
    "signatures": [
      [
        "sourcePath",
        "category",
        "count",
        "sha256"
      ]
    ],
    "fields": [
      {
        "key": "sourcePath",
        "types": [
          "string"
        ],
        "column": "source_path"
      },
      {
        "key": "category",
        "types": [
          "string"
        ],
        "column": "category"
      },
      {
        "key": "count",
        "types": [
          "number"
        ],
        "column": "count"
      },
      {
        "key": "sha256",
        "types": [
          "string"
        ],
        "column": "sha256"
      }
    ],
    "count": 606
  },
  {
    "path": "review/documents/*/originalIndex/*",
    "table": "census_review_documents_entry_original_index_entry",
    "signatures": [
      [
        "sourcePath",
        "category",
        "count",
        "sha256"
      ]
    ],
    "fields": [
      {
        "key": "sourcePath",
        "types": [
          "string"
        ],
        "column": "source_path"
      },
      {
        "key": "category",
        "types": [
          "string"
        ],
        "column": "category"
      },
      {
        "key": "count",
        "types": [
          "number"
        ],
        "column": "count"
      },
      {
        "key": "sha256",
        "types": [
          "string"
        ],
        "column": "sha256"
      }
    ],
    "count": 596
  },
  {
    "path": "review/documents/*/receipt",
    "table": "census_review_documents_entry_receipt",
    "signatures": [
      [
        "path",
        "sha256",
        "approvalRef"
      ],
      [
        "evidencePath",
        "evidenceSha256",
        "scope",
        "semanticReview"
      ]
    ],
    "fields": [
      {
        "key": "path",
        "types": [
          "string"
        ],
        "column": "path"
      },
      {
        "key": "sha256",
        "types": [
          "string"
        ],
        "column": "sha256"
      },
      {
        "key": "approvalRef",
        "types": [
          "string"
        ],
        "column": "approval_ref"
      },
      {
        "key": "evidencePath",
        "types": [
          "string"
        ],
        "column": "evidence_path"
      },
      {
        "key": "evidenceSha256",
        "types": [
          "string"
        ],
        "column": "evidence_sha256"
      },
      {
        "key": "scope",
        "types": [
          "string"
        ],
        "column": "scope"
      },
      {
        "key": "semanticReview",
        "types": [
          "string"
        ],
        "column": "semantic_review"
      }
    ],
    "count": 20
  },
  {
    "path": "review/mapping",
    "table": "census_review_mapping",
    "signatures": [
      [
        "unchangedRule",
        "exceptions"
      ]
    ],
    "fields": [
      {
        "key": "unchangedRule",
        "types": [
          "string"
        ],
        "column": "unchanged_rule"
      },
      {
        "key": "exceptions",
        "types": [
          "array"
        ],
        "column": "exceptions",
        "element": "object"
      }
    ],
    "count": 1
  },
  {
    "path": "review/mapping/exceptions/*",
    "table": "census_review_mapping_exceptions_entry",
    "signatures": [
      [
        "category",
        "originalKeys",
        "currentKeys",
        "disposition",
        "evidence",
        "reviewStatus"
      ]
    ],
    "fields": [
      {
        "key": "category",
        "types": [
          "string"
        ],
        "column": "category"
      },
      {
        "key": "originalKeys",
        "types": [
          "array"
        ],
        "column": "original_keys",
        "element": "string",
        "table": "census_review_mapping_exceptions_entry_original_keys"
      },
      {
        "key": "currentKeys",
        "types": [
          "array"
        ],
        "column": "current_keys",
        "element": "string",
        "table": "census_review_mapping_exceptions_entry_current_keys"
      },
      {
        "key": "disposition",
        "types": [
          "string"
        ],
        "column": "disposition"
      },
      {
        "key": "evidence",
        "types": [
          "string"
        ],
        "column": "evidence"
      },
      {
        "key": "reviewStatus",
        "types": [
          "string"
        ],
        "column": "review_status"
      }
    ],
    "count": 146228
  },
  {
    "path": "review/occurrenceStorage",
    "table": "census_review_occurrence_storage",
    "signatures": [
      [
        "original",
        "markdownSpans",
        "identityOccurrences",
        "keyFormula",
        "indexFormula",
        "currentStorage"
      ]
    ],
    "fields": [
      {
        "key": "original",
        "types": [
          "object"
        ],
        "column": "original"
      },
      {
        "key": "markdownSpans",
        "types": [
          "object"
        ],
        "column": "markdown_spans"
      },
      {
        "key": "identityOccurrences",
        "types": [
          "object"
        ],
        "column": "identity_occurrences"
      },
      {
        "key": "keyFormula",
        "types": [
          "string"
        ],
        "column": "key_formula"
      },
      {
        "key": "indexFormula",
        "types": [
          "string"
        ],
        "column": "index_formula"
      },
      {
        "key": "currentStorage",
        "types": [
          "string"
        ],
        "column": "current_storage"
      }
    ],
    "count": 1
  },
  {
    "path": "review/occurrenceStorage/identityOccurrences",
    "table": "census_review_occurrence_storage_identity_occurrences",
    "signatures": [
      [
        "count",
        "sha256"
      ]
    ],
    "fields": [
      {
        "key": "count",
        "types": [
          "number"
        ],
        "column": "count"
      },
      {
        "key": "sha256",
        "types": [
          "string"
        ],
        "column": "sha256"
      }
    ],
    "count": 1
  },
  {
    "path": "review/occurrenceStorage/markdownSpans",
    "table": "census_review_occurrence_storage_markdown_spans",
    "signatures": [
      [
        "path",
        "sha256"
      ]
    ],
    "fields": [
      {
        "key": "path",
        "types": [
          "string"
        ],
        "column": "path"
      },
      {
        "key": "sha256",
        "types": [
          "string"
        ],
        "column": "sha256"
      }
    ],
    "count": 1
  },
  {
    "path": "review/occurrenceStorage/original",
    "table": "census_review_occurrence_storage_original",
    "signatures": [
      [
        "schema",
        "columns",
        "encoding",
        "chunks",
        "payloadSha256",
        "gzipSha256",
        "payloadBytes",
        "coverageKeyFormula",
        "cardBodies",
        "cardSupplement",
        "issuedIdentityMap"
      ]
    ],
    "fields": [
      {
        "key": "schema",
        "types": [
          "string"
        ],
        "column": "schema"
      },
      {
        "key": "columns",
        "types": [
          "array"
        ],
        "column": "columns",
        "element": "string",
        "table": "census_review_occurrence_storage_original_columns"
      },
      {
        "key": "encoding",
        "types": [
          "string"
        ],
        "column": "encoding"
      },
      {
        "key": "chunks",
        "types": [
          "array"
        ],
        "column": "chunks",
        "element": "object"
      },
      {
        "key": "payloadSha256",
        "types": [
          "string"
        ],
        "column": "payload_sha256"
      },
      {
        "key": "gzipSha256",
        "types": [
          "string"
        ],
        "column": "gzip_sha256"
      },
      {
        "key": "payloadBytes",
        "types": [
          "number"
        ],
        "column": "payload_bytes"
      },
      {
        "key": "coverageKeyFormula",
        "types": [
          "string"
        ],
        "column": "coverage_key_formula"
      },
      {
        "key": "cardBodies",
        "types": [
          "object"
        ],
        "column": "card_bodies"
      },
      {
        "key": "cardSupplement",
        "types": [
          "object"
        ],
        "column": "card_supplement"
      },
      {
        "key": "issuedIdentityMap",
        "types": [
          "object"
        ],
        "column": "issued_identity_map"
      }
    ],
    "count": 1
  },
  {
    "path": "review/occurrenceStorage/original/cardBodies",
    "table": "census_review_occurrence_storage_original_card_bodies",
    "signatures": [
      [
        "path",
        "sha256"
      ]
    ],
    "fields": [
      {
        "key": "path",
        "types": [
          "string"
        ],
        "column": "path"
      },
      {
        "key": "sha256",
        "types": [
          "string"
        ],
        "column": "sha256"
      }
    ],
    "count": 1
  },
  {
    "path": "review/occurrenceStorage/original/cardSupplement",
    "table": "census_review_occurrence_storage_original_card_supplement",
    "signatures": [
      [
        "path",
        "sha256"
      ]
    ],
    "fields": [
      {
        "key": "path",
        "types": [
          "string"
        ],
        "column": "path"
      },
      {
        "key": "sha256",
        "types": [
          "string"
        ],
        "column": "sha256"
      }
    ],
    "count": 1
  },
  {
    "path": "review/occurrenceStorage/original/chunks/*",
    "table": "census_review_occurrence_storage_original_chunks_entry",
    "signatures": [
      [
        "path",
        "sha256",
        "index"
      ]
    ],
    "fields": [
      {
        "key": "path",
        "types": [
          "string"
        ],
        "column": "path"
      },
      {
        "key": "sha256",
        "types": [
          "string"
        ],
        "column": "sha256"
      },
      {
        "key": "index",
        "types": [
          "number"
        ],
        "column": "index"
      }
    ],
    "count": 19
  },
  {
    "path": "review/occurrenceStorage/original/issuedIdentityMap",
    "table": "census_review_occurrence_storage_original_issued_identity_map",
    "signatures": [
      [
        "path",
        "sha256"
      ]
    ],
    "fields": [
      {
        "key": "path",
        "types": [
          "string"
        ],
        "column": "path"
      },
      {
        "key": "sha256",
        "types": [
          "string"
        ],
        "column": "sha256"
      }
    ],
    "count": 1
  },
  {
    "path": "review/preservationInventory/*",
    "table": "census_review_preservation_inventory_entry",
    "signatures": [
      [
        "path",
        "sha256",
        "bytes",
        "kind",
        "classification",
        "binding",
        "admission",
        "reviewStatus"
      ]
    ],
    "fields": [
      {
        "key": "path",
        "types": [
          "string"
        ],
        "column": "path"
      },
      {
        "key": "sha256",
        "types": [
          "string"
        ],
        "column": "sha256"
      },
      {
        "key": "bytes",
        "types": [
          "number"
        ],
        "column": "bytes"
      },
      {
        "key": "kind",
        "types": [
          "string"
        ],
        "column": "kind"
      },
      {
        "key": "classification",
        "types": [
          "string"
        ],
        "column": "classification"
      },
      {
        "key": "binding",
        "types": [
          "string"
        ],
        "column": "binding"
      },
      {
        "key": "admission",
        "types": [
          "string"
        ],
        "column": "admission"
      },
      {
        "key": "reviewStatus",
        "types": [
          "string"
        ],
        "column": "review_status"
      }
    ],
    "count": 833
  },
  {
    "path": "review/receipts/*",
    "table": "census_review_receipts_entry",
    "signatures": [
      [
        "schema",
        "evidencePath",
        "evidenceSha256",
        "reviewedAt",
        "documents"
      ]
    ],
    "fields": [
      {
        "key": "schema",
        "types": [
          "string"
        ],
        "column": "schema"
      },
      {
        "key": "evidencePath",
        "types": [
          "string"
        ],
        "column": "evidence_path"
      },
      {
        "key": "evidenceSha256",
        "types": [
          "string"
        ],
        "column": "evidence_sha256"
      },
      {
        "key": "reviewedAt",
        "types": [
          "string"
        ],
        "column": "reviewed_at"
      },
      {
        "key": "documents",
        "types": [
          "array"
        ],
        "column": "documents",
        "element": "object"
      }
    ],
    "count": 1
  },
  {
    "path": "review/receipts/*/documents/*",
    "table": "census_review_receipts_entry_documents_entry",
    "signatures": [
      [
        "sourcePath",
        "currentSha256",
        "cardOccurrences",
        "approvalRef"
      ]
    ],
    "fields": [
      {
        "key": "sourcePath",
        "types": [
          "string"
        ],
        "column": "source_path"
      },
      {
        "key": "currentSha256",
        "types": [
          "string"
        ],
        "column": "current_sha256"
      },
      {
        "key": "cardOccurrences",
        "types": [
          "number"
        ],
        "column": "card_occurrences"
      },
      {
        "key": "approvalRef",
        "types": [
          "string"
        ],
        "column": "approval_ref"
      }
    ],
    "count": 19
  }
];
const hash = value => createHash('sha256').update(value).digest('hex');
const fail = detail => { throw Object.assign(new Error('E_CENSUS_DOCUMENT_STORE: '+detail),{code:'E_CENSUS_DOCUMENT_STORE'}); };
const scalar = field => field.types.every(type => type !== 'array' && type !== 'object');
const column = field => field.column + (scalar(field) ? '' : '_count');
const byPath = new Map(CENSUS_DOMAIN_MAPPING.map(spec => [spec.path,spec]));

/** SELECT-only typed domain reconstruction. No source files, archives, JSON decoding or fallbacks. */
export function readCensusDocuments(db) {
  try {
    const receipts = db.prepare('SELECT * FROM census_document_import ORDER BY document').all();
    if (receipts.length !== 2) fail('receipt coverage');
    for (const [name,pin] of Object.entries(CENSUS_DOCUMENT_PINS)) {
      const receipt = receipts.find(row => row.document === name);
      if (!receipt || receipt.source_sha256 !== pin.sourceSha256 || receipt.document_sha256 !== pin.documentSha256
        || !receipt.actor?.trim() || !receipt.reason?.trim()) fail('receipt pin');
    }
    const tables = new Map();
    for (const spec of CENSUS_DOMAIN_MAPPING) {
      const rows = db.prepare('SELECT * FROM '+spec.table).all();
      if (rows.length !== spec.count) fail(spec.table+': terminal coverage');
      tables.set(spec.table,new Map(rows.map(row => [row.address,row])));
      for (const field of spec.fields.filter(field => field.table)) {
        const groups = new Map();
        for (const row of db.prepare('SELECT * FROM '+field.table+' ORDER BY owner_address,ordinal').all()) {
          if (!groups.has(row.owner_address)) groups.set(row.owner_address,[]);
          const values = groups.get(row.owner_address);
          if (row.ordinal !== values.length) fail(field.table+': ordinal');
          values.push(row[field.column]);
        }
        tables.set(field.table,groups);
      }
    }
    const object = (path,address) => {
      const spec = byPath.get(path);
      if (!spec) fail('unmapped object '+path);
      const rows = tables.get(spec.table), row = rows.get(address);
      if (!row) fail(spec.table+': missing domain row '+address);
      rows.delete(address);
      const keys = spec.signatures[row.key_variant];
      if (!keys) fail('key variant');
      if (spec.fields.some(field => !keys.includes(field.key) && row[column(field)] !== null)) fail('absent field has domain value');
      const result = {};
      for (const key of keys) {
        const field = spec.fields.find(field => field.key === key), value = row[column(field)];
        if (path === 'ledger' && key === 'binding' || path === 'review' && key === 'binding') {
          if (value !== 1) fail('binding cardinality');
          result[key] = binding;
        } else if (scalar(field)) {
          if (value !== null && field.types.includes('boolean')) {
            if (value !== 0 && value !== 1) fail('boolean');
            result[key] = value === 1;
          } else result[key] = value;
        } else if (value === null) {
          if (!field.types.includes('null')) fail('unexpected null');
          result[key] = null;
        } else if (field.types.includes('array')) {
          if (!Number.isSafeInteger(value) || value < 0) fail('array cardinality');
          if (field.element === 'object') result[key] = Array.from({length:value},(_,i) => object(path+'/'+key+'/*',address+'/'+key+'/'+i));
          else if (field.element === 'empty') {
            if (value !== 0) fail('unmapped nonempty collection');
            result[key] = [];
          } else {
            const groups = tables.get(field.table), values = groups.get(address) ?? [];
            groups.delete(address);
            if (values.length !== value) fail(field.table+': cardinality');
            result[key] = values;
          }
        } else {
          if (value !== 1) fail('object cardinality');
          result[key] = object(path+'/'+key,address+'/'+key);
        }
      }
      return result;
    };
    const binding = object('binding','binding');
    const result = {ledger:object('ledger','ledger'),review:object('review','review')};
    if ([...tables.values()].some(rows => rows.size)) fail('orphan domain rows');
    for (const [name,pin] of Object.entries(CENSUS_DOCUMENT_PINS)) if (hash(JSON.stringify(result[name])) !== pin.documentSha256) fail(name+': serialized digest');
    return result;
  } catch (error) {
    if (error.code === 'E_CENSUS_DOCUMENT_STORE') throw error;
    fail(error.message);
  }
}

/** Explicit one-shot initializer; only census tables are inserted, never existing domain tables. */
export function initializeCensusDocuments(db,{schemaSql,sources,actor,reason} = {}) {
  if (db.isTransaction || typeof schemaSql !== 'string' || !schemaSql.trim()
    || ![actor,reason].every(value => typeof value === 'string' && value.trim())) fail('explicit SQL/actor/reason/transaction');
  const documents = {};
  for (const [name,pin] of Object.entries(CENSUS_DOCUMENT_PINS)) {
    const supplied = sources?.[name];
    if (!(supplied?.bytes instanceof Uint8Array) || supplied.expectedSourceHash !== pin.sourceSha256
      || hash(supplied.bytes) !== pin.sourceSha256) fail(name+': actual source bytes/hash');
    documents[name] = JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(supplied.bytes));
    if (hash(JSON.stringify(documents[name])) !== pin.documentSha256) fail(name+': source serialization');
  }
  deepStrictEqual(documents.ledger.binding,documents.review.binding);
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(schemaSql);
    const inserts = new Map();
    for (const spec of CENSUS_DOMAIN_MAPPING) {
      inserts.set(spec.table,db.prepare('INSERT INTO '+spec.table+' VALUES ('+Array(spec.fields.length+2).fill('?').join(',')+')'));
      for (const field of spec.fields.filter(field => field.table)) inserts.set(field.table,db.prepare('INSERT INTO '+field.table+' VALUES (?,?,?)'));
    }
    const object = (value,path,address) => {
      const spec = byPath.get(path);
      if (!spec) fail('unmapped source shape '+path);
      const variant = spec.signatures.findIndex(keys => keys.length === Object.keys(value).length && keys.every((key,i) => Object.keys(value)[i] === key));
      if (variant < 0) fail('unmapped source keys '+path);
      const values = spec.fields.map(field => {
        const v = value[field.key];
        if (v === undefined || v === null) return null;
        return scalar(field) ? typeof v === 'boolean' ? Number(v) : v : Array.isArray(v) ? v.length : 1;
      });
      inserts.get(spec.table).run(address,variant,...values);
      for (const field of spec.fields) {
        const v = value[field.key];
        if (scalar(field) || v === undefined || v === null || ((path === 'ledger' || path === 'review') && field.key === 'binding')) continue;
        if (Array.isArray(v)) v.forEach((item,i) => {
          if (field.element === 'object') object(item,path+'/'+field.key+'/*',address+'/'+field.key+'/'+i);
          else if (field.table) inserts.get(field.table).run(address,i,item);
          else fail('unmapped nonempty collection');
        });
        else object(v,path+'/'+field.key,address+'/'+field.key);
      }
    };
    object(documents.ledger.binding,'binding','binding');
    object(documents.ledger,'ledger','ledger');
    object(documents.review,'review','review');
    const receipt = db.prepare('INSERT INTO census_document_import VALUES (?,?,?,?,?)');
    for (const [name,pin] of Object.entries(CENSUS_DOCUMENT_PINS)) receipt.run(name,pin.sourceSha256,pin.documentSha256,actor,reason);
    const result = readCensusDocuments(db);
    deepStrictEqual(result,documents);
    for (const name of Object.keys(documents)) if (JSON.stringify(result[name]) !== JSON.stringify(documents[name])) fail('precommit serialized parity');
    db.exec('COMMIT');
    return result;
  } catch (error) {
    if (db.isTransaction) db.exec('ROLLBACK');
    throw error;
  }
}
