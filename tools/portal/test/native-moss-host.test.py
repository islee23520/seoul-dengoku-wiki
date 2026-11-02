"""Native reservation and host/alpha compatibility with CPU loopback fixtures."""
import copy
import importlib.util
import json
import os
import pathlib
import sys
import tempfile
import unittest
from unittest.mock import patch

WORKER = pathlib.Path(__file__).resolve().parents[1] / "native-moss"
sys.path.insert(0, str(WORKER))
import job
import runtime


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


host = load("native_host", WORKER / "newhost-proof.py")
worker_tests = load("native_worker_fixtures", WORKER.parent / "test" / "native-moss-worker.test.py")
alpha_tests = load("native_alpha_fixtures", WORKER.parent / "test" / "native-moss-lifecycle.test.py")
process_fixtures = load("host_process_fixtures", WORKER.parent / "test" / "native-moss-process-proof.test.py")


class HostTests(unittest.TestCase):
    def proof(self):
        return process_fixtures.measured_proof()

    def test_admission_exact_start_busy_unknown_queue_gpu(self):
        with tempfile.TemporaryDirectory() as folder:
            root = pathlib.Path(folder)
            proof = self.proof()
            self.assertEqual(host.admit(proof, root, os.getpid()), proof["processes"][str(os.getpid())]["start"])
            changes = [("freeMiB", 8191), ("utilization", 6), ("processInventoryComplete", False),
                       ("queue", {"queue_running": [[1]], "queue_pending": []})]
            for key, value in changes:
                with self.subTest(key=key), self.assertRaises(ValueError):
                    host.admit({**proof, key: value}, root, os.getpid())
            proof["processes"]["999"] = process_fixtures.record("python.exe", proof["processes"]["1001"]["start"], 1,
                                                              "private-python.exe", ["private-python.exe", "train.py"])
            with self.assertRaisesRegex(ValueError, "NATIVE_COMPETING_PYTHON"):
                host.admit(proof, root, os.getpid())
            proof["processes"].pop("999")
            job.exclusive(root / "gpu-lease.json", b'{"state":"UNKNOWN"}')
            with self.assertRaisesRegex(ValueError, "NATIVE_LEASE_BUSY"):
                host.admit(proof, root, os.getpid())

    def test_production_reservation_writes_lifecycle_start_and_never_overwrites(self):
        request = worker_tests.envelope()
        with tempfile.TemporaryDirectory() as folder:
            root = pathlib.Path(folder)
            lease = host.reserve(request, root, host=self.proof, validate=lambda _: None)
            self.assertEqual(lease["processStart"], self.proof()["processes"][str(os.getpid())]["start"])
            self.assertEqual(lease["pid"], os.getpid())
            with self.assertRaisesRegex(ValueError, "NATIVE_LEASE_BUSY"):
                host.reserve(request, root, host=self.proof, validate=lambda _: None)

    def test_job_native_then_alpha_finalize_reconcile_release(self):
        proof_tests = load("final_host_lifecycle_proof", WORKER.parent / "test" / "native-moss-lifecycle-proof.test.py")
        case = proof_tests.LifecycleProofTests(methodName="test_new_job_reference_phase_alpha_finalize_reconcile_release")
        case.setUp()
        try:
            fixture = case.fixture
            preflight_bytes = (fixture.target / "preflight.json").read_bytes()
            observed = job.parse(preflight_bytes)
            self.assertEqual(case.native["preflightSHA256"], job.sha(preflight_bytes))
            self.assertEqual(case.native["native"]["runtimeAttestation"], observed["runtimeAttestation"])
            self.assertEqual(case.native["native"]["processStart"], observed["hostLease"]["processStart"])
            self.assertEqual(fixture.call("alpha")["state"], "ALPHA_SUBMITTED")
            final = fixture.call("finalize")
            self.assertEqual(final["state"], "HOLD")
            self.assertEqual(fixture.call("reconcile")["finalSHA256"], final["finalSHA256"])
            before = fixture.call("readArtifacts")
            self.assertEqual(before["state"], "ARTIFACTS")
            self.assertEqual(len(before["artifacts"]), 13)
            self.assertEqual(fixture.call("release")["state"], "RELEASED")
            self.assertEqual(fixture.call("readArtifacts"), before)
            self.assertFalse((fixture.root / "gpu-lease.json").exists())
            self.assertEqual(fixture.posts, ["/upload/image", "/prompt"])
        finally:
            case.doCleanups()

    def test_uploaded_source_has_zero_reservation(self):
        request = worker_tests.envelope()
        request["snapshot"]["sourceSelection"]["kind"] = "uploaded"
        with tempfile.TemporaryDirectory() as folder, patch.object(host, "reserve") as reserve:
            with self.assertRaisesRegex(ValueError, "NATIVE_UPLOADED_SOURCE_UNSUPPORTED"):
                job.run(json.dumps(request).encode(), worker_tests.CpuRuntime(), pathlib.Path(folder))
            reserve.assert_not_called()
            self.assertEqual(list(pathlib.Path(folder).iterdir()), [])


host_reserve = host.reserve


if __name__ == "__main__":
    unittest.main()
