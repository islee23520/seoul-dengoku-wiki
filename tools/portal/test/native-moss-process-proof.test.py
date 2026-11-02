"""Measured two-family private proof contract; no Windows/GPU/model invocation."""
import copy
import importlib.util
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

spec = importlib.util.spec_from_file_location("two_family_host", WORKER / "newhost-proof.py")
host = importlib.util.module_from_spec(spec)
spec.loader.exec_module(host)


def record(name, start, parent, executable, argv=None, cwd=None, resolved=None, script=None, sha=None):
    return {"name": name, "start": start, "startAfter": start, "parentPid": parent,
            "command": "OS measured argv in fixture", "executable": executable, "argv": argv,
            "cwd": cwd, "cwdResolved": resolved, "scriptPath": script, "scriptSHA256": sha}


def measured_proof():
    # PIDs are arbitrary fixtures, not production allowlist literals.
    primary, parent, child, app = 1001, 2001, 2002, 2000
    primary_start = "2026-10-19T04:33:30.2117040Z"
    parent_start = "2026-10-19T15:27:35.7544250Z"
    child_start = "2026-10-19T15:27:35.7830670Z"
    processes = {
        str(primary): record("python.exe", primary_start, 50, host.COMFY_PYTHON,
                             [host.COMFY_PYTHON, "main.py", *host.COMFY_ARGS], host.COMFY_ROOT, host.COMFY_ROOT,
                             host.COMFY_SCRIPT, host.COMFY_MAIN_SHA),
        str(parent): record("python.exe", parent_start, app, host.DESKTOP_PARENT, list(host.DESKTOP_ARGV),
                            host.DESKTOP_CWD, host.DESKTOP_ROOT, host.DESKTOP_SCRIPT, host.DESKTOP_MAIN_SHA),
        str(child): record("python.exe", child_start, parent, host.DESKTOP_CHILD, list(host.DESKTOP_ARGV),
                           host.DESKTOP_CWD, host.DESKTOP_ROOT, host.DESKTOP_SCRIPT, host.DESKTOP_MAIN_SHA),
        str(app): record("Comfy Desktop.exe", "2026-10-19T05:52:52.7225840Z", 40, host.DESKTOP_APP),
        str(os.getpid()): record("python.exe", "2026-10-21T22:29:53.3095720Z", 30, "private-python.exe", ["private-python.exe", "-"])
    }
    listeners = [{"pid": primary, "processStart": primary_start, "address": "127.0.0.1", "port": 8188},
                 {"pid": child, "processStart": child_start, "address": "0.0.0.0", "port": 8189},
                 {"pid": child, "processStart": child_start, "address": "::", "port": 8189}]
    queues = {"8188": {"queue_running": [], "queue_pending": []}, "8189": {"queue_running": [], "queue_pending": []}}
    return {"schema": "native-moss-host-process-proof.v2", "processInventoryComplete": True, "processes": processes,
            "listeners": listeners, "queues": queues, "queue": queues["8188"], "freeMiB": 13834, "utilization": 1,
            "systemStats": {"8188": {"pid": primary, "argv": ["main.py", *host.COMFY_ARGS]}},
            "provenComfyInstances": host.proven_comfy(processes, listeners)}


class ProcessProofTests(unittest.TestCase):
    def lifecycle(self, proof, root):
        class Queue:
            def request(self, path):
                return proof["queue"]
        with patch.object(job, "host_proof", return_value=host):
            return lifecycle.command({"schema": "native-moss-lifecycle-command.v1", "operation": "readiness",
                                      "profileDigest": job.PROFILE_DIGEST}, root=root, expected=root, http=Queue(), probe=lambda: proof)

    def test_actual_measured_relative_main_and_desktop_family_valid(self):
        proof = measured_proof()
        self.assertEqual(host.validate_process_proof(proof), {("1001", proof["processes"]["1001"]["start"]),
                         ("2001", proof["processes"]["2001"]["start"]), ("2002", proof["processes"]["2002"]["start"])})
        with tempfile.TemporaryDirectory() as folder:
            root = pathlib.Path(folder)
            self.assertEqual(host.admit(proof, root, os.getpid()), proof["processes"][str(os.getpid())]["start"])
            result = self.lifecycle(proof, root)
            self.assertTrue(result["ready"])
            self.assertIs(result["proof"]["processes"], proof["processes"])
            self.assertEqual(len(result["proof"]["processes"]), 5)

    def test_cwd_script_hash_pid_reuse_and_system_identity_fail_closed(self):
        mutations = [lambda p: p["processes"]["1001"].update(cwd=None),
                     lambda p: p["processes"]["1001"].update(cwd="D:/tmp"),
                     lambda p: p["processes"]["1001"].update(scriptPath=host.COMFY_ROOT + "/../main.py"),
                     lambda p: p["processes"]["1001"].update(scriptSHA256="0" * 64),
                     lambda p: p["processes"]["1001"].update(startAfter="2026-10-21T22:29:53.3095720Z"),
                     lambda p: p["listeners"][0].update(processStart="2026-10-21T22:29:53.3095720Z"),
                     lambda p: p["systemStats"]["8188"].update(pid=9999),
                     lambda p: p["processes"]["1001"]["argv"].__setitem__(1, "../main.py")]
        for index, mutation in enumerate(mutations):
            proof = measured_proof()
            mutation(proof)
            with self.subTest(index=index), self.assertRaises((ValueError, TypeError)):
                host.validate_process_proof(proof)

    def test_desktop_parent_creation_order_fullargv_and_both_listener_binding(self):
        mutations = [lambda p: p["processes"]["2002"].update(parentPid=1001),
                     lambda p: p["processes"]["2000"].update(executable="D:/evil/Comfy Desktop.exe"),
                     lambda p: p["processes"]["2001"].update(start=p["processes"]["2002"]["start"], startAfter=p["processes"]["2002"]["start"]),
                     lambda p: p["processes"]["2002"].update(scriptSHA256="f" * 64),
                     lambda p: p["processes"]["2001"]["argv"].__setitem__(-1, "C:/arbitrary.yaml"),
                     lambda p: p["listeners"][2].update(pid=2001, processStart=p["processes"]["2001"]["start"]),
                     lambda p: p["listeners"].append(copy.deepcopy(p["listeners"][0])),
                     lambda p: p["processes"]["2001"].update(cwdResolved="D:/tmp")]
        for index, mutation in enumerate(mutations):
            proof = measured_proof()
            mutation(proof)
            with self.subTest(index=index), self.assertRaises((ValueError, TypeError)):
                host.validate_process_proof(proof)

    def test_busy_second_queue_unknown_python_and_shared_argv_text_reject(self):
        with tempfile.TemporaryDirectory() as folder:
            root = pathlib.Path(folder)
            proof = measured_proof()
            proof["queues"]["8189"]["queue_pending"] = [["busy"]]
            with self.assertRaisesRegex(ValueError, "NATIVE_COMFY_QUEUE_BUSY"):
                host.admit(proof, root, os.getpid())
            self.assertFalse(self.lifecycle(proof, root)["ready"])
            proof = measured_proof()
            proof["processes"]["9999"] = record("python.exe", "2026-10-21T22:29:53.3095720Z", 1,
                host.COMFY_PYTHON, [host.COMFY_PYTHON, "E:/tmp/train.py", "--note", host.COMFY_SCRIPT])
            with self.assertRaisesRegex(ValueError, "NATIVE_COMPETING_PYTHON"):
                host.admit(proof, root, os.getpid())
            result = self.lifecycle(proof, root)
            self.assertFalse(result["ready"])
            self.assertIn("9999", result["proof"]["processes"])

    def test_schema_unknown_keys_and_low_memory_utilization(self):
        proof = measured_proof()
        proof["extra"] = "untrusted"
        with self.assertRaises(ValueError): host.validate_process_proof(proof)
        for key, value in (("freeMiB", 8191), ("utilization", 6)):
            proof = measured_proof()
            proof[key] = value
            with tempfile.TemporaryDirectory() as folder, self.assertRaisesRegex(ValueError, "NATIVE_GPU_NOT_IDLE"):
                host.admit(proof, pathlib.Path(folder), os.getpid())


if __name__ == "__main__":
    unittest.main()
