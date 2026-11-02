"""Read-only qualification fixtures; a passing fixture is not actual host readiness."""
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
import lifecycle
import runtime

spec = importlib.util.spec_from_file_location("readiness_host", WORKER / "newhost-proof.py")
host = importlib.util.module_from_spec(spec)
spec.loader.exec_module(host)
spec_fixture = importlib.util.spec_from_file_location("measured_process_fixtures", WORKER.parent / "test" / "native-moss-process-proof.test.py")
process_fixtures = importlib.util.module_from_spec(spec_fixture)
spec_fixture.loader.exec_module(process_fixtures)


class ReadinessTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = pathlib.Path(self.temp.name)
        self.manifest = job.parse((WORKER / "manifest.json").read_bytes())
        # Review-time source snapshot: another owner may be changing runtime.
        # Do not mutate the shipped manifest or claim this is an admitted bundle.
        for name in self.manifest["files"]:
            raw = (WORKER / name).read_bytes()
            self.manifest["files"][name] = {"sha256": job.sha(raw), "size": len(raw)}
        self.manifest["implementationSHA256"] = job.sha(json.dumps(self.manifest["files"], sort_keys=True, separators=(",", ":")).encode())
        self.proof = process_fixtures.measured_proof()
        for name, value in (("private_roots", {"aclProtected": True}), ("installed_pins", {"allPinsVerified": True}),
                            ("dependencies", {"offlineTokenizer": True, "modelLoaded": False, "torchImported": False}),
                            ("probe", self.proof)):
            mock = patch.object(host, name, return_value=value)
            mock.start()
            self.addCleanup(mock.stop)
        canonical = patch.object(host, "CANONICAL_TRAINING", self.root.parent)
        canonical.start()
        self.addCleanup(canonical.stop)

    def check(self):
        return host.qualify(self.manifest, self.root)

    def test_fully_qualified_fixture_and_job_response(self):
        proof = self.check()
        self.assertTrue(proof["ready"])
        self.assertTrue(proof["lifecycleReadiness"]["ready"])
        self.assertIs(proof["lifecycleReadiness"]["proof"]["processes"], self.proof["processes"])
        self.assertIn("1001", proof["lifecycleReadiness"]["proof"]["processes"])
        with patch.object(job, "host_proof", return_value=host), patch.object(host, "qualify", return_value=proof):
            result = job.command({"schema": "native-moss-command.v1", "operation": "readiness", "profileDigest": job.PROFILE_DIGEST})
        self.assertTrue(result["ready"])
        self.assertFalse(result["modelLoaded"])
        self.assertFalse(result["generationDispatched"])
        self.assertNotIn("torch", sys.modules)

    def test_explicit_missing_root_acl_pin_dependency_failures(self):
        for stage, reason in (("private_roots", "NATIVE_ROOT_NOT_PROVISIONED"),
                              ("private_roots", "NATIVE_PRIVATE_ACL_WRITABLE"),
                              ("installed_pins", "NATIVE_INSTALLED_ASSET_PIN"),
                              ("installed_pins", "NATIVE_TOKENIZER_PIN"),
                              ("dependencies", "NATIVE_DEPENDENCY_UNAVAILABLE")):
            with self.subTest(reason=reason), patch.object(host, stage, side_effect=ValueError(reason)):
                result = self.check()
                self.assertFalse(result["ready"])
                self.assertEqual(result["reason"], reason)

    def test_manifest_profile_and_lifecycle_missing_drift(self):
        self.manifest["profileDigest"] = "0" * 64
        self.assertEqual(self.check()["reason"], "NATIVE_PROFILE_DIGEST")
        self.manifest["profileDigest"] = job.PROFILE_DIGEST
        self.manifest["files"]["lifecycle.py"]["sha256"] = "0" * 64
        self.assertFalse(self.check()["ready"])
        self.manifest["files"]["lifecycle.py"]["sha256"] = job.sha((WORKER / "lifecycle.py").read_bytes())
        del self.manifest["files"]["lifecycle.py"]
        self.manifest["implementationSHA256"] = job.sha(json.dumps(self.manifest["files"], sort_keys=True, separators=(",", ":")).encode())
        self.assertEqual(self.check()["reason"], "NATIVE_LIFECYCLE_MISSING")

    def test_lease_queue_memory_utilization_and_unknown_process_fail(self):
        for key, wrong in (("freeMiB", 8191), ("utilization", 6), ("processInventoryComplete", False),
                           ("queue", {"queue_running": [1], "queue_pending": []})):
            with self.subTest(key=key), patch.object(host, "probe", return_value={**self.proof, key: wrong}):
                self.assertFalse(self.check()["ready"])
        job.exclusive(self.root / "gpu-lease.json", b'{"state":"UNKNOWN"}')
        self.assertEqual(self.check()["reason"], "NATIVE_LEASE_BUSY")
        (self.root / "gpu-lease.json").unlink()
        proof = copy.deepcopy(self.proof)
        proof["processes"]["1001"]["command"] = None
        with patch.object(host, "probe", return_value=proof):
            self.assertEqual(self.check()["reason"], "NATIVE_PROCESS_COMMAND_UNKNOWN")

    def test_lifecycle_protocol_gate_and_readonly_no_reservation(self):
        with patch.object(lifecycle, "command", return_value={"ready": False}), \
             patch.object(host, "reserve", side_effect=AssertionError("readiness reserved")):
            result = self.check()
        self.assertEqual(result["reason"], "NATIVE_LIFECYCLE_NOT_READY")
        self.assertEqual(list(self.root.iterdir()), [])

    def test_real_private_root_check_missing_does_not_create(self):
        # Bypass only setUp's stage mock, exercising the actual platform-neutral
        # missing-root rejection before PowerShell can be invoked.
        source = (WORKER / "newhost-proof.py").read_bytes()
        import ast
        namespace = vars(host).copy()
        function = next(n for n in ast.parse(source).body if isinstance(n, ast.FunctionDef) and n.name == "private_roots")
        exec(compile(ast.Module(body=[function], type_ignores=[]), "<real-private-root-check>", "exec"), namespace)
        missing = self.root / "not-provisioned"
        with patch.object(host.subprocess, "run", side_effect=AssertionError("missing root ran command")):
            with self.assertRaisesRegex(ValueError, "NATIVE_ROOT_NOT_PROVISIONED"):
                namespace["private_roots"](missing)
        self.assertFalse(missing.exists())

    def test_real_asset_pin_function_rejects_wrong_revision_and_source(self):
        import ast
        source = (WORKER / "newhost-proof.py").read_bytes()
        namespace = vars(host).copy()
        function = next(n for n in ast.parse(source).body if isinstance(n, ast.FunctionDef) and n.name == "installed_pins")
        exec(compile(ast.Module(body=[function], type_ignores=[]), "<real-installed-pin-check>", "exec"), namespace)
        with patch.object(host.subprocess, "check_output", return_value="wrong"):
            with self.assertRaisesRegex(ValueError, "NATIVE_TRAINER_REVISION"):
                namespace["installed_pins"]()
        import native_runner_v1 as native
        with patch.object(host.subprocess, "check_output", return_value=native.COMMIT), \
             patch.object(native, "digest", return_value="0" * 64):
            with self.assertRaisesRegex(ValueError, "NATIVE_INSTALLED_SOURCE_PIN"):
                namespace["installed_pins"]()

    def test_demonstrated_training_command_and_comfy_words_never_exempt(self):
        for command, argv in (
            ("python.exe E:/tmp/train.py --note ComfyUI/main.py", ["python.exe", "E:/tmp/train.py", "--note", "ComfyUI/main.py"]),
            ('"python.exe" "E:/tmp/train.py" --note "' + host.COMFY_SCRIPT + '"', ["python.exe", "E:/tmp/train.py", "--note", host.COMFY_SCRIPT]),
            (host.COMFY_PYTHON + " -c evil --note " + host.COMFY_SCRIPT, [host.COMFY_PYTHON, "-c", "evil", "--note", host.COMFY_SCRIPT]),
        ):
            proof = copy.deepcopy(self.proof)
            proof["processes"]["9999"] = process_fixtures.record("python.exe", self.proof["processes"]["1001"]["start"],
                                                                1, host.COMFY_PYTHON, argv)
            proof["processes"]["9999"]["command"] = command
            with self.subTest(command=command), patch.object(host, "probe", return_value=proof):
                self.assertEqual(self.check()["reason"], "NATIVE_COMPETING_PYTHON")
                phase = lifecycle.command({"schema": "native-moss-lifecycle-command.v1", "operation": "readiness", "profileDigest": job.PROFILE_DIGEST},
                                          root=self.root, expected=self.root, http=type("Queue", (), {"request": lambda _, path: proof["queue"]})(), probe=lambda: proof)
                self.assertFalse(phase["ready"])
                self.assertIn("9999", phase["proof"]["processes"])

    def test_spoof_executable_script_flags_pid_start_and_proof_unknown_keys(self):
        mutations = [
            lambda p: p["processes"]["1001"].update(executable="E:/tmp/python.exe"),
            lambda p: p["processes"]["1001"]["argv"].__setitem__(1, host.COMFY_SCRIPT + ".evil"),
            lambda p: p["processes"]["1001"]["argv"].append("--extra"),
            lambda p: p["processes"]["1001"]["argv"].__setitem__(0, "python.exe"),
            lambda p: p["provenComfyInstances"][0].update(pid=9999),
            lambda p: p["provenComfyInstances"][0].update(processStart="2026-10-21T20:41:28.3621760Z"),
            lambda p: p["provenComfyInstances"][0].update(listenerPort=8190),
            lambda p: p["provenComfyInstances"][0].update(extra="unknown"),
            lambda p: p.update(extra="unknown"),
        ]
        for index, change in enumerate(mutations):
            proof = copy.deepcopy(self.proof)
            change(proof)
            with self.subTest(index=index), patch.object(host, "probe", return_value=proof):
                self.assertFalse(self.check()["ready"])
        with self.assertRaisesRegex(ValueError, "NATIVE_COMFY_LISTENER"):
            host.proven_comfy(self.proof["processes"], [])
        with self.assertRaisesRegex(ValueError, "NATIVE_COMFY_PID_REUSED"):
            listeners = copy.deepcopy(self.proof["listeners"])
            listeners[0]["processStart"] = "2026-10-21T20:41:28.3621760Z"
            host.proven_comfy(self.proof["processes"], listeners)

    def test_windows_argv_parser_uses_os_api_and_quoted_arguments(self):
        import ctypes
        from ctypes import wintypes
        raw = '"' + host.COMFY_PYTHON.replace("/", "\\") + '" "' + host.COMFY_SCRIPT.replace("/", "\\") + '" --listen 127.0.0.1 --port 8188'
        expected = [host.COMFY_PYTHON.replace("/", "\\"), host.COMFY_SCRIPT.replace("/", "\\"), *host.COMFY_ARGS]
        array = (wintypes.LPWSTR * len(expected))(*expected)
        class Function:
            def __init__(self, callback):
                self.callback = callback
            def __call__(self, *args):
                return self.callback(*args)
        def parse(command, count):
            self.assertEqual(command, raw)
            ctypes.cast(count, ctypes.POINTER(ctypes.c_int))[0] = len(expected)
            return array
        free_calls = []
        shell = type("Shell", (), {"CommandLineToArgvW": Function(parse)})()
        kernel = type("Kernel", (), {"LocalFree": Function(lambda pointer: free_calls.append(pointer))})()
        with patch.object(host.os, "name", "nt"), patch.object(host.ctypes, "WinDLL", create=True, side_effect=[shell, kernel]):
            self.assertEqual(host.windows_argv(raw), expected)
        self.assertEqual(len(free_calls), 1)


if __name__ == "__main__":
    unittest.main()
