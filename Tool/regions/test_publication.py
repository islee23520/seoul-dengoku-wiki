"""Publication checks must reject stale author inputs, not just valid old data."""

import hashlib
import json
import tempfile
import unittest
from pathlib import Path

from verify_region_atlas import publication_errors


class PublicationTests(unittest.TestCase):
    def test_changed_author_file_invalidates_published_atlas(self):
        with tempfile.TemporaryDirectory() as tmp:
            author = Path(tmp) / "author.json"
            document = {"regions": [{"region_id": "region:1", "content": {"title": "first"}}]}
            author.write_text(json.dumps(document), encoding="utf-8")
            atlas = {"content_sources": [{"path": str(author), "sha256": hashlib.sha256(author.read_bytes()).hexdigest()}],
                     "regions": [{"id": "region:1", "content": {"title": "first"}}]}
            self.assertEqual(publication_errors(atlas), [])
            document["regions"][0]["content"]["title"] = "revised"
            author.write_text(json.dumps(document), encoding="utf-8")
            self.assertIn("stale_content_source:" + str(author), publication_errors(atlas))

    def test_missing_publication_receipt_fails(self):
        self.assertIn("missing_content_sources", publication_errors({"regions": []}))
