"""Loopback-only alpha HTTP fixtures; no GPU/model/process/remote actions."""
import base64
import copy
import io
import json
import pathlib
import sys
import tempfile
import threading
import unittest
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from unittest.mock import patch

import numpy as np
from PIL import Image

WORKER = pathlib.Path(__file__).resolve().parents[1] / "native-moss"
sys.path.insert(0, str(WORKER))
import job
import lifecycle as lc


def png(array):
    stream = io.BytesIO()
    Image.fromarray(array).save(stream, format="PNG")
    return stream.getvalue()


class LifecycleTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = pathlib.Path(self.temp.name)
        self.manifest = job.parse((WORKER / "manifest.json").read_bytes())
        self.request, self.nonce = str(uuid.uuid4()), str(uuid.uuid4())
        self.target = self.root / self.request
        (self.target / "output").mkdir(parents=True)
        self.frame = {"schema": "native-moss-lifecycle-command.v1", "operation": "alpha", "profileDigest": job.PROFILE_DIGEST,
                      "requestId": self.request, "nonce": self.nonce, "ownerBindingHash": "a" * 64,
                      "envelopeSHA256": job.sha(b"{}"), "bundleSHA256": self.manifest["implementationSHA256"],
                      "ownerPid": 1234, "ownerStart": "2026-10-21T10:00:00.0000000Z"}
        job.exclusive(self.target / "config.json", b"{}")
        raw = np.full((512, 352, 3), [224, 226, 228], dtype=np.uint8)
        raw[90:430, 70:270] = [40, 60, 90]
        alpha = np.zeros((512, 352), dtype=np.uint8)
        alpha[90:430, 70:270] = 255
        before = np.zeros((512, 352, 4), dtype=np.uint8)
        before[:, :, 3] = alpha
        before[alpha > 0, :3] = raw[alpha > 0]
        self.raw = png(raw)
        job.exclusive(self.target / "output" / "raw.png", self.raw)
        crop = png(raw[1:511, 6:346])
        job.exclusive(self.target / "output" / "crop-RGB.png", crop)
        native = {"schema": "native-moss-native-phase.v1", "state": "NATIVE_COMPLETE_ALPHA_PENDING",
                  **{k: self.frame[k] for k in ("requestId", "nonce", "profileDigest", "ownerBindingHash", "envelopeSHA256", "bundleSHA256")},
                  "native": {"noMerge": True, "loadedValuesVerified": True, "nativeTensorCount": 336,
                             "rawSHA256": job.sha(self.raw), "cropSHA256": job.sha(crop)}}
        lc.emit(self.target / "status.json", native)
        self.lease = {"requestId": self.request, "nonce": self.nonce, "pid": 1234,
                      "processStart": self.frame["ownerStart"], "state": "ACTIVE", "scope": "native-through-alpha"}
        lc.emit(self.root / "gpu-lease.json", self.lease)
        self.proof = {"processInventoryComplete": True, "processes": {}, "freeMiB": 16384, "utilization": 0}
        self.prompt = str(uuid.uuid4())
        self.posts, self.submitted = [], None
        self.failed, self.missing, self.drop = False, False, False
        self.descriptor_metadata = {"kind": "image", "width": 352, "height": 512}
        self.wrong_prompt = False
        self.view_queries = []
        mask = png(np.repeat(alpha[:, :, None], 3, axis=2))
        self.images = {"9": png(before), "11": mask, "15": mask}
        fixture = self
        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *args):
                pass

            def send(self, value, binary=False):
                raw = value if binary else json.dumps(value).encode()
                self.send_response(200)
                self.end_headers()
                self.wfile.write(raw)

            def do_GET(self):
                if self.path == "/queue":
                    return self.send({"queue_running": [], "queue_pending": []})
                if self.path.startswith("/history/"):
                    outputs = {node: {"images": [{"filename": fixture.request + "_" + node + ".png", "subfolder": "portal_native_alpha", "type": "output"}]} for node in fixture.images}
                    for output in outputs.values():
                        output["images"][0]["metadata"] = fixture.descriptor_metadata
                    if fixture.missing:
                        del outputs["11"]
                    return self.send({fixture.prompt: {"status": {"completed": True, "status_str": "error" if fixture.failed else "success"},
                                                       "prompt": [0, str(uuid.uuid4()) if fixture.wrong_prompt else fixture.prompt, fixture.submitted], "outputs": outputs}})
                if self.path.startswith("/view?"):
                    query = lc.urllib.parse.parse_qs(lc.urllib.parse.urlsplit(self.path).query)
                    fixture.view_queries.append(query)
                    node = query["filename"][0].rsplit("_", 1)[1].split(".")[0]
                    return self.send(fixture.images[node], True)
                self.send_error(404)

            def do_POST(self):
                raw = self.rfile.read(int(self.headers["Content-Length"]))
                fixture.posts.append(self.path)
                if self.path == "/upload/image":
                    if fixture.raw not in raw:
                        return self.send_error(400)
                    return self.send({"name": "native.png", "subfolder": "", "type": "input"})
                if self.path == "/prompt":
                    fixture.submitted = json.loads(raw)["prompt"]
                    if fixture.drop:
                        self.connection.close()
                        return
                    return self.send({"prompt_id": fixture.prompt})
                self.send_error(404)
        self.server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.addCleanup(self.close_server)
        self.api = patch.object(lc, "API", "http://127.0.0.1:" + str(self.server.server_port))
        self.api.start()
        self.addCleanup(self.api.stop)

    def close_server(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)

    def call(self, operation):
        return lc.command({**self.frame, "operation": operation}, root=self.root, expected=self.root, probe=lambda: self.proof)

    def test_alpha_only_success_finalize_reconcile_and_release(self):
        result = self.call("alpha")
        self.assertEqual(result["state"], "ALPHA_SUBMITTED")
        self.assertFalse(any("sampler" in n["class_type"].lower() for n in self.submitted.values()))
        final = self.call("finalize")
        self.assertEqual(final["state"], "HOLD")
        self.assertFalse(final["qualityQualified"])
        self.assertTrue(final["defringe"]["alphaIdentical"])
        self.assertTrue((self.root / "gpu-lease.json").exists())
        with Image.open(self.target / "output" / "final-RGBA.png") as image:
            self.assertEqual((image.size, image.mode), ((340, 510), "RGBA"))
            pixels = np.array(image)
            self.assertTrue(np.all(pixels[pixels[:, :, 3] == 0, :3] == 0))
        self.assertEqual(self.call("reconcile")["finalSHA256"], final["finalSHA256"])
        self.assertEqual(self.posts, ["/upload/image", "/prompt"])
        self.assertEqual(self.call("release")["state"], "RELEASED")
        self.assertFalse((self.root / "gpu-lease.json").exists())

    def test_forbidden_nodes_and_failed_history(self):
        modified = lc.graph("native.png", self.request)
        modified["evil"] = {"class_type": "KSampler", "inputs": {}}
        with self.assertRaisesRegex(ValueError, "LIFECYCLE_ALPHA_GRAPH"):
            lc.verify_graph(modified, "native.png", self.request)
        self.call("alpha")
        self.failed = True
        with self.assertRaisesRegex(ValueError, "LIFECYCLE_HISTORY_FAILED"):
            self.call("finalize")
        self.assertFalse((self.target / "execution.json").exists())

    def test_missing_artifact_fails_without_final_or_release(self):
        self.call("alpha")
        self.missing = True
        with self.assertRaises(KeyError):
            self.call("finalize")
        with self.assertRaises(ValueError):
            self.call("release")
        self.assertTrue((self.root / "gpu-lease.json").exists())

    def test_nonce_bundle_and_busy_lease_rejected_before_post(self):
        for field, wrong in (("nonce", str(uuid.uuid4())), ("bundleSHA256", "b" * 64), ("ownerStart", "wrong-start")):
            with self.subTest(field=field), self.assertRaises(ValueError):
                lc.command({**self.frame, field: wrong}, root=self.root, expected=self.root, probe=lambda: self.proof)
        self.assertEqual(self.posts, [])

    def test_unknown_read_never_posts_and_lost_submit_never_retries(self):
        self.assertEqual(self.call("reconcile")["state"], "UNKNOWN")
        self.assertEqual(self.posts, [])
        self.drop = True
        with self.assertRaises(Exception):
            self.call("alpha")
        self.assertEqual(self.call("reconcile")["state"], "UNKNOWN")
        with self.assertRaises(ValueError):
            self.call("alpha")
        self.assertEqual(self.posts, ["/upload/image", "/prompt"])

    def test_release_requires_terminal_and_pid_absent(self):
        with self.assertRaises(ValueError):
            self.call("release")
        self.call("alpha")
        self.call("finalize")
        self.proof["processes"]["1234"] = {"name": "python.exe", "start": self.frame["ownerStart"]}
        with self.assertRaisesRegex(ValueError, "LIFECYCLE_PID_REUSED"):
            self.call("release")
        self.proof["processes"]["1234"]["start"] = "reused"
        with self.assertRaisesRegex(ValueError, "LIFECYCLE_PID_REUSED"):
            self.call("release")
        self.assertTrue((self.root / "gpu-lease.json").exists())

    def test_readiness_unknown_busy_and_reparse_rejected(self):
        frame = {"schema": self.frame["schema"], "operation": "readiness", "profileDigest": job.PROFILE_DIGEST}
        self.assertFalse(lc.command(frame, root=self.root, expected=self.root, probe=lambda: self.proof)["ready"])
        (self.root / "gpu-lease.json").unlink()
        self.assertTrue(lc.command(frame, root=self.root, expected=self.root, probe=lambda: self.proof)["ready"])
        self.assertFalse(lc.command(frame, root=self.root, expected=self.root, probe=lambda: (_ for _ in ()).throw(ValueError("unknown")))["ready"])
        (self.target / "escape").symlink_to(self.root)
        with self.assertRaisesRegex(ValueError, "LIFECYCLE_DESCENDANT_REPARSE"):
            self.call("reconcile")
        self.assertEqual(job.sha(base64.b64decode(lc.HELPER_BASE64)), lc.HELPER_PIN)

    def retained_person1003(self):
        folder = WORKER.parents[2] / "ART-ASSETS" / "portrait-training" / "recovery16-native-reference-source025-v1" / "person-1003"
        pins = {
            "alpha-history.json": "d74a682fa52c7c7575f0aaca745a86545b2d8b6509e37733dcfbc98666a1e342",
            "person-1003.png": "90c686aa203bd9479ade7eaf8eccf84d170d5aadd854a7c24ed63945eda3e43a",
            "person-1003-340x510-RGB.png": "cac225e3171370e5add685ae566e1948393878f501f372ccf95631c9bf868094",
            "person-1003-finished352.png": "87158f949427167eff5bd256826e9707216541886605ee8760249b577ffe7541",
            "person-1003-mask352.png": "1ba69178f996cb4de29f51a9f78c02c805b3f73fc812bc6775725cf2280ab67d",
            "person-1003-rawmask352.png": "2bd719a16fa2eb3436bd0f42bc0354e447c1db23c740ed4e4329da5d54de0910",
        }
        retained = {}
        for name, pin in pins.items():
            retained[name] = (folder / name).read_bytes()
            self.assertEqual(job.sha(retained[name]), pin)
        self.descriptor_metadata = json.loads(retained["alpha-history.json"])["outputs"]["9"]["images"][0]["metadata"]
        self.raw = retained["person-1003.png"]
        self.images = {"9": retained["person-1003-finished352.png"], "11": retained["person-1003-mask352.png"],
                       "15": retained["person-1003-rawmask352.png"]}
        for name, raw in (("raw.png", self.raw), ("crop-RGB.png", retained["person-1003-340x510-RGB.png"])):
            path = self.target / "output" / name
            path.unlink()
            job.exclusive(path, raw)
        status = self.target / "status.json"
        native = json.loads(status.read_bytes())
        native["native"].update(rawSHA256=job.sha(self.raw), cropSHA256=job.sha(retained["person-1003-340x510-RGB.png"]))
        status.unlink()
        lc.emit(status, native)
        return retained

    def test_actual_person1003_partial_alpha_and_installed_metadata(self):
        self.retained_person1003()
        with Image.open(io.BytesIO(self.images["15"])) as rawmask, Image.open(io.BytesIO(self.images["11"])) as mask:
            self.assertEqual(rawmask.getpixel((245, 220)), (254, 254, 254))
            self.assertEqual(mask.getpixel((245, 220)), (254, 254, 254))
        self.call("alpha")
        receipt = self.call("finalize")
        self.assertEqual(receipt["state"], "HOLD")
        self.assertTrue(receipt["defringe"]["alphaIdentical"])
        self.assertTrue(all(set(query) == {"filename", "subfolder", "type"} for query in self.view_queries))
        with Image.open(self.target / "output" / "final-RGBA.png") as final:
            self.assertEqual(final.getpixel((245 - 6, 220 - 1))[3], 254)

    def test_actual_partial_masks_wrong_boundary_still_rejected(self):
        self.retained_person1003()
        with Image.open(io.BytesIO(self.images["11"])) as mask:
            pixels = np.array(mask)
        pixels[220, 245] = 253
        self.images["11"] = png(pixels)
        with Image.open(io.BytesIO(self.images["9"])) as finished:
            pixels = np.array(finished)
        pixels[220, 245, 3] = 253
        self.images["9"] = png(pixels)
        self.call("alpha")
        with self.assertRaisesRegex(ValueError, "LIFECYCLE_ALPHA_MASK_CHAIN"):
            self.call("finalize")

    def test_installed_descriptor_unknown_or_wrong_dimensions_and_prompt_reject(self):
        self.call("alpha")
        for metadata in ({"kind": "image", "width": 351, "height": 512},
                         {"kind": "image", "width": 352, "height": 512, "extra": "untrusted"},
                         {"kind": "image", "width": True, "height": 512}):
            self.descriptor_metadata = metadata
            with self.assertRaisesRegex(ValueError, "LIFECYCLE_OUTPUT_METADATA"):
                self.call("finalize")
        self.descriptor_metadata = {"kind": "image", "width": 352, "height": 512}
        self.wrong_prompt = True
        with self.assertRaisesRegex(ValueError, "LIFECYCLE_HISTORY_PROMPT"):
            self.call("finalize")
        self.assertEqual(self.posts, ["/upload/image", "/prompt"])


if __name__ == "__main__":
    unittest.main()
