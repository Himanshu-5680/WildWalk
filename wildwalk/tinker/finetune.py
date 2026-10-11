"""Thinking Machines Tinker: LoRA-tune a small open model on walk-pack style, then compare vs baseline.
!! Tinker SDK evolves -- follow the official quickstart and adapt names below."""
import json, tinker
from tinker import types

svc = tinker.ServiceClient()
tc = svc.create_lora_training_client(base_model="Qwen/Qwen3-8B", rank=16)  # any model Tinker lists
tok = tc.get_tokenizer()
data = [json.loads(l) for l in open("tinker/walkpacks.jsonl")]  # {"prompt":..., "completion":...}

def to_datum(ex):
    p = tok.encode(ex["prompt"]); c = tok.encode(ex["completion"]); ids = p + c
    return types.Datum(model_input=types.ModelInput.from_ints(ids[:-1]),
                       loss_fn_inputs={"target_tokens": ids[1:], "weights": [0]*(len(p)-1) + [1]*len(c)})

for epoch in range(3):
    tc.forward_backward([to_datum(x) for x in data], loss_fn="cross_entropy").result()
    tc.optim_step(types.AdamParams(learning_rate=1e-4)).result()
print("done -> sample base vs tuned, log latency/length/quality in README table")
