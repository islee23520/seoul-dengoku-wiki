"""Lifecycle proof binding against actual job.run and loopback alpha, CPU only."""
import base64
import copy
import importlib.util
import json
import os
import pathlib
import tempfile
import unittest
from unittest.mock import patch

WORKER = pathlib.Path(__file__).resolve().parents[1] / "native-moss"


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


proof_tests = load("lifecycle_job_proof", WORKER.parent / "test" / "native-moss-job-proof.test.py")
alpha_tests = load("lifecycle_alpha_proof", WORKER.parent / "test" / "native-moss-lifecycle.test.py")
job, runtime = proof_tests.job, proof_tests.runtime
lc = alpha_tests.lc


class LifecycleProofTests(unittest.TestCase):
    def setUp(self):
        self.fixture = alpha_tests.LifecycleTests(methodName="test_alpha_only_success_finalize_reconcile_and_release")
        self.fixture.setUp()
        self.addCleanup(self.fixture.doCleanups)
        self.worker_temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.worker_temp.cleanup)
        local = pathlib.Path(self.worker_temp.name)
        manifest = job.parse((WORKER / "manifest.json").read_bytes())
        # An actual-byte test worker copy preserves the parent's frozen3575
        # manifest during review. No bundle verifier is mocked or skipped.
        for name in manifest["files"]:
            raw = (WORKER / name).read_bytes()
            job.exclusive(local / name, raw)
            manifest["files"][name] = {"sha256": job.sha(raw), "size": len(raw)}
        manifest["implementationSHA256"] = job.sha(json.dumps(manifest["files"], sort_keys=True, separators=(",", ":")).encode())
        job.exclusive(local / "manifest.json", json.dumps(manifest).encode())
        for module in (job, runtime):
            context = patch.object(module, "HERE", local)
            context.start()
            self.addCleanup(context.stop)
        terminal = proof_tests.JobProofTests().terminal("lifecycle")
        context = patch.object(runtime, "TERMINAL", job.sha(terminal))
        context.start()
        self.addCleanup(context.stop)
        fixture = self.fixture
        import shutil
        shutil.rmtree(fixture.target)
        (fixture.root / "gpu-lease.json").unlink()
        request = proof_tests.fixtures.envelope()
        request.update(requestId=fixture.request, nonce=fixture.nonce, mode="reference-img2img", recipe="recovery16-native-flow-source025-v1")
        original = fixture.raw
        request["snapshot"]["original"] = proof_tests.fixtures.packed(original)
        request["snapshot"]["sourceSelection"]["sourceSHA256"] = job.sha(original)
        token = job.parse(base64.b64decode(request["snapshot"]["token"]["byteBase64"]))
        token["image"] = {"path": "/portraits/person-1004.png", "sha256": job.sha(original)}
        request["snapshot"]["token"] = proof_tests.fixtures.document(token)
        class ReferenceCPU(proof_tests.ProofRuntime):
            def preflight(self, request, token, retained):
                proof = super().preflight(request, token, retained)
                transform = {"rgb": base64.b64encode(original).decode(), "receipt": {
                    "sourceSHA256": job.sha(original), "rgbSHA256": job.sha(original), "width": 352, "height": 512,
                    "computationalContentRect": {"x": 6, "y": 1, "width": 340, "height": 510}}}
                proof["transform"] = transform
                proof["runtimeAttestation"]["transform"] = transform
                return proof

            def reserve(self, request, root):
                lease = super().reserve(request, root)
                lc.emit(root / "gpu-lease.json", lease)
                return lease

            def execute(self, request, target, proof):
                result = super().execute(request, target, proof)
                result["sampling"] = {"cpuInjected": True, "source": proof["transform"]["receipt"]}
                result["samplingCoverage"] = {"status": "OBSERVED_REFERENCE", "adoptionAllowed": False}
                return result
        self.native = job.run(json.dumps(request).encode(), ReferenceCPU(terminal), fixture.root)
        fixture.raw = (fixture.target / "output" / "raw.png").read_bytes()
        # Use real native output pixels for alpha ownership, with partial alpha.
        import numpy as np
        from PIL import Image
        import io
        with Image.open(io.BytesIO(fixture.raw)) as image:
            raw = np.array(image)
        alpha = np.zeros((512, 352), dtype=np.uint8)
        alpha[90:430, 70:270] = 255
        alpha[220, 245] = 254
        finished = np.zeros((512, 352, 4), dtype=np.uint8)
        finished[:, :, 3] = alpha
        finished[alpha > 0, :3] = raw[alpha > 0]
        mask = alpha_tests.png(np.repeat(alpha[:, :, None], 3, axis=2))
        fixture.images = {"9": alpha_tests.png(finished), "11": mask, "15": mask}
        fixture.frame.update(ownerPid=os.getpid(), ownerStart=self.native["native"]["processStart"],
                             envelopeSHA256=self.native["envelopeSHA256"], bundleSHA256=manifest["implementationSHA256"])

    def rewrite(self, name, value):
        path = self.fixture.target / name
        path.unlink()
        lc.emit(path, value)

    def test_new_job_reference_phase_alpha_finalize_reconcile_release(self):
        self.assertEqual(self.fixture.call("alpha")["state"], "ALPHA_SUBMITTED")
        result = self.fixture.call("finalize")
        observed = job.parse((self.fixture.target / "preflight.json").read_bytes())
        self.assertEqual(result["preflightSHA256"], self.native["preflightSHA256"])
        self.assertEqual(result["terminalReceiptSHA256"], observed["terminalReceiptSHA256"])
        for key in ("contextInputSHA256", "contextResponseSHA256"):
            self.assertEqual(result[key], observed["runtimeAttestation"][key])
        self.assertEqual(result["phaseOutcome"], "RETURNED_SUCCESSFULLY")
        self.assertNotIn("exitCode", result)
        self.assertEqual(self.fixture.call("reconcile")["state"], "HOLD")
        self.assertEqual(self.fixture.call("release")["state"], "RELEASED")
        self.assertEqual(self.fixture.posts, ["/upload/image", "/prompt"])

    def test_missing_or_modified_preflight_reject_before_post(self):
        path = self.fixture.target / "preflight.json"
        raw = path.read_bytes()
        path.unlink()
        with self.assertRaises(ValueError):
            self.fixture.call("alpha")
        job.exclusive(path, raw + b" ")
        with self.assertRaisesRegex(ValueError, "LIFECYCLE_PREFLIGHT_HASH"):
            self.fixture.call("alpha")
        self.assertEqual(self.fixture.posts, [])

    def test_rehashed_context_terminal_and_process_tamper_rejects(self):
        original = job.parse((self.fixture.target / "preflight.json").read_bytes())
        for change in (lambda p: p["hostLease"].update(pid=os.getpid() + 1),
                       lambda p: p["hostLease"].update(processStart="2026-10-21T20:41:28.3621760Z"),
                       lambda p: p.update(terminalReceiptSHA256="0" * 64),
                       lambda p: p["runtimeAttestation"].update(contextInputSHA256="0" * 64),
                       lambda p: p["runtimeAttestation"].update(contextResponseSHA256="0" * 64)):
            proof = copy.deepcopy(original)
            change(proof)
            self.rewrite("preflight.json", proof)
            native = copy.deepcopy(self.native)
            raw = (self.fixture.target / "preflight.json").read_bytes()
            native.update(preflightSHA256=job.sha(raw), preflightSize=len(raw))
            self.rewrite("status.json", native)
            with self.assertRaises(ValueError):
                self.fixture.call("alpha")
        self.assertEqual(self.fixture.posts, [])

    def test_post_submit_preflight_change_blocks_finalize_and_reconcile(self):
        self.fixture.call("alpha")
        path = self.fixture.target / "preflight.json"
        raw = path.read_bytes()
        path.unlink()
        job.exclusive(path, raw + b" ")
        with self.assertRaisesRegex(ValueError, "LIFECYCLE_PREFLIGHT_HASH"):
            self.fixture.call("finalize")
        with self.assertRaisesRegex(ValueError, "LIFECYCLE_PREFLIGHT_HASH"):
            self.fixture.call("reconcile")
        self.assertFalse((self.fixture.target / "execution.json").exists())
        self.assertEqual(self.fixture.posts, ["/upload/image", "/prompt"])


if __name__ == "__main__":
    unittest.main()
