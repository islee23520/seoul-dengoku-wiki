"""Owner-only Linux subreaper; transport EOF requests cancellation, never success."""
import ctypes
import json
import os
from pathlib import Path
import selectors
import signal
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from wsl_contract import WireRequest, WslContractError


def main() -> None:
    if os.getuid() != 1000:
        raise WslContractError("WSL_OWNER_REQUIRED")
    # Descendants orphaned by a worker are adopted here, including setsid/fork
    # descendants. We signal only direct unreaped children, never reusable PIDs
    # obtained from process-name matching or an unowned process group.
    libc = ctypes.CDLL(None, use_errno=True)
    if libc.prctl(36, 1, 0, 0, 0) != 0:
        raise OSError(ctypes.get_errno(), "SUBREAPER_REQUIRED")
    signal.signal(signal.SIGCHLD, lambda *_: None)
    read_fd, write_fd = os.pipe2(os.O_NONBLOCK | os.O_CLOEXEC)
    signal.set_wakeup_fd(write_fd)
    child = 0
    cancelled = False
    started = False
    main_status = 1
    request_id = ""
    reaped_pids: list[int] = []
    pending = b""
    with selectors.DefaultSelector() as events:
        events.register(read_fd, selectors.EVENT_READ)
        events.register(sys.stdin.fileno(), selectors.EVENT_READ)
        try:
            while True:
                for key, _ in events.select():
                    if key.fd == read_fd:
                        os.read(read_fd, 4096)
                    else:
                        chunk = os.read(sys.stdin.fileno(), 65537)
                        if not chunk:
                            events.unregister(sys.stdin.fileno())
                            cancelled = True
                            pending = b""
                        pending += chunk
                        if len(pending) > 65536:
                            cancelled = True
                            pending = b""
                        while not cancelled and b"\n" in pending:
                            line, pending = pending.split(b"\n", 1)
                            if started:
                                # A cancel or malformed second frame both revoke;
                                # neither can initiate another dispatch.
                                cancelled = True
                            else:
                                # The collector parses the complete typed request
                                # before any work. UUID only correlates join evidence.
                                request = WireRequest.model_validate_json(line)
                                request_id = request.requestId
                                started = True
                                input_fd, output_fd = os.pipe()
                                child = os.fork()
                                if child == 0:
                                    os.close(output_fd)
                                    os.dup2(input_fd, 0)
                                    os.close(input_fd)
                                    os.setsid()
                                    os.execv(sys.executable, [sys.executable, "-I", sys.argv[1], sys.argv[2]])
                                os.close(input_fd)
                                with os.fdopen(output_fd, "wb") as stream:
                                    stream.write(line)
                    while True:
                        try:
                            reaped, status = os.waitpid(-1, os.WNOHANG)
                        except ChildProcessError:
                            if started:
                                joined = json.dumps({"op": "joined", "requestId": request_id,
                                                     "supervisorPid": os.getpid(), "reaped": reaped_pids,
                                                     "exitCode": 130 if cancelled else main_status})
                                with (Path(sys.argv[2]).parent / f"{request_id}.joined.json").open("x") as receipt:
                                    receipt.write(joined)
                                print(joined, flush=True)
                                return
                            break
                        if reaped == 0:
                            break
                        reaped_pids.append(reaped)
                        if reaped == child:
                            main_status = os.waitstatus_to_exitcode(status)
                            child = 0
                    if cancelled or (started and child == 0):
                        children = Path(f"/proc/self/task/{os.getpid()}/children").read_text().split()
                        for pid in children:
                            # SIGCHLD does not reap: even a just-exited direct child
                            # retains its PID until this supervisor's next waitpid.
                            os.kill(int(pid), signal.SIGKILL)
                    if cancelled and not started:
                        return
        finally:
            signal.set_wakeup_fd(-1)
            os.close(read_fd)
            os.close(write_fd)


if __name__ == "__main__":
    main()
