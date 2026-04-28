# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *

class TrollBridge(gl.Contract):
    bridge_passed: bool
    last_proposal: str
    troll_response: str

    def __init__(self) -> None:
        self.bridge_passed = False
        self.last_proposal = "none"
        self.troll_response = "none"

    @gl.public.write
    def request_passage(self, proposal: str) -> None:
        prompt = f"""You are a grumpy AI troll guarding a bridge.
        The user offers this as tribute to cross: '{proposal}'.
        Does this strictly qualify as an interesting or extremely valuable digital item (like a rare NFT, zero-day exploit, or profound secret)?
        If yes, reply with exactly one word: GRANTED.
        If no, reply with exactly one word: DENIED."""

        def leader_fn():
            return gl.nondet.exec_prompt(prompt)

        def validator_fn(leaders_res) -> bool:
            if not isinstance(leaders_res, gl.vm.Return):
                return False
            return True

        result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        verdict = str(result).strip().lower()

        self.last_proposal = proposal
        self.troll_response = verdict

        if "granted" in verdict and "denied" not in verdict:
            self.bridge_passed = True

    @gl.public.view
    def get_status(self) -> bool:
        return self.bridge_passed

    @gl.public.view
    def get_last_response(self) -> str:
        return self.troll_response

