"""Closed final artifact readback using actual new native/alpha fixture, CPU only."""
import base64
import copy
import importlib.util
import pathlib
import unittest
from unittest.mock import patch

WORKER = pathlib.Path(__file__).resolve().parents[1] / "native-moss"
spec = importlib.util.spec_from_file_location("artifact_proof_fixture", WORKER.parent / "test" / "native-moss-lifecycle-proof.test.py")
proof_tests = importlib.util.module_from_spec(spec)
spec.loader.exec_module(proof_tests)
lc, job = proof_tests.lc, proof_tests.job


class ArtifactTests(unittest.TestCase):
    def setUp(self):
        self.proof = proof_tests.LifecycleProofTests(methodName="test_new_job_reference_phase_alpha_finalize_reconcile_release")
        self.proof.setUp()
        self.addCleanup(self.proof.doCleanups)
        self.fixture = self.proof.fixture

    def finish(self):
        self.fixture.call("alpha")
        return self.fixture.call("finalize")

    def read(self, frame=None):
        with patch.object(lc, "Http", side_effect=AssertionError("read constructed HTTP")), \
             patch.object(lc, "ownership", side_effect=AssertionError("read checked live process")), \
             patch.object(lc, "emit", side_effect=AssertionError("read wrote state")):
            return lc.command(frame or {**self.fixture.frame, "operation": "readArtifacts"},
                              root=self.fixture.root, expected=self.fixture.root,
                              probe=lambda: (_ for _ in ()).throw(AssertionError("read probed host")))

    def test_read13_before_after_release_no_launch_no_write(self):
        final = self.finish()
        before = self.read()
        self.assertEqual(before["state"], "ARTIFACTS")
        self.assertEqual(len(before["artifacts"]), 13)
        self.assertEqual({item["name"] for item in before["artifacts"]}, set(lc.FINAL_ARTIFACTS))
        for item in before["artifacts"]:
            raw = base64.b64decode(item["byteBase64"], validate=True)
            self.assertEqual(base64.b64encode(raw).decode(), item["byteBase64"])
            self.assertEqual(len(raw), item["size"])
            self.assertEqual(job.sha(raw), item["sha256"])
        self.assertEqual(before["receipt"]["finalSHA256"], final["finalSHA256"])
        self.assertEqual(self.fixture.call("release")["state"], "RELEASED")
        self.assertFalse((self.fixture.root / "gpu-lease.json").exists())
        after = self.read()
        self.assertEqual(after, before)
        self.assertEqual(self.fixture.posts, ["/upload/image", "/prompt"])
        self.assertNotIn("exitCode", after["receipt"])

    def test_missing_terminal_is_notready_no_synthesized_artifacts(self):
        result = self.read()
        self.assertEqual(result["state"], "NOT_READY")
        self.assertNotIn("artifacts", result)
        self.assertEqual(self.fixture.posts, [])

    def test_tampered_preflight_missing_mask_symlink_and_hash_drift_reject(self):
        self.finish()
        for name, mode in (("preflight.json", "modified"), ("output/mask352.png", "missing"),
                           ("output/rawmask352.png", "symlink"), ("output/final-RGBA.png", "modified"),
                           ("alpha-submitted.json", "modified")):
            path = self.fixture.target / name
            original = path.read_bytes()
            path.unlink()
            if mode == "modified":
                if name == "alpha-submitted.json":
                    value = job.parse(original)
                    value["promptId"] = "00000000-0000-0000-0000-000000000000"
                    job.exclusive(path, __import__("json").dumps(value).encode())
                else:
                    job.exclusive(path, original + b" ")
            elif mode == "symlink":
                path.symlink_to(self.fixture.target / "output" / "mask352.png")
            with self.subTest(name=name):
                result = self.read()
                self.assertEqual(result["state"], "NOT_READY")
                self.assertNotIn("artifacts", result)
            if path.exists() or path.is_symlink():
                path.unlink()
            job.exclusive(path, original)
        self.assertEqual(self.fixture.posts, ["/upload/image", "/prompt"])

    def test_swapped_nonce_unknown_fields_and_foreign_lease_reject(self):
        self.finish()
        import uuid
        frame = {**self.fixture.frame, "operation": "readArtifacts", "nonce": str(uuid.uuid4())}
        self.assertEqual(self.read(frame)["state"], "NOT_READY")
        frame = {**self.fixture.frame, "operation": "readArtifacts", "path": "../secret"}
        self.assertEqual(self.read(frame)["state"], "NOT_READY")
        lease_path = self.fixture.root / "gpu-lease.json"
        lease = job.parse(lease_path.read_bytes())
        lease["nonce"] = str(uuid.uuid4())
        lease_path.unlink()
        job.exclusive(lease_path, __import__("json").dumps(lease).encode())
        self.assertEqual(self.read()["state"], "NOT_READY")


if __name__ == "__main__":
    unittest.main()
