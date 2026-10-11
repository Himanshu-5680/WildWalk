"""Backboard: one API key to compare open-weight models.
!! Confirm base URL + model names in Backboard docs and adjust below."""
import os, time
from openai import OpenAI
c = OpenAI(base_url=os.environ["BACKBOARD_BASE_URL"], api_key=os.environ["BACKBOARD_API_KEY"])
PROMPT = "Plan a 30-min screen-free autumn walk. 120 words."
for m in ["gemma-3-27b-it", "llama-3.3-70b", "qwen3-32b"]:   # <- edit to models Backboard lists
    t = time.time(); r = c.chat.completions.create(model=m, messages=[{"role": "user", "content": PROMPT}])
    print(f"{m}: {time.time()-t:.1f}s | {len(r.choices[0].message.content.split())} words")
