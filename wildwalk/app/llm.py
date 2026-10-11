"""Gemma (open-weight) through Ollama's OpenAI-compatible API."""
import os, time, sentry_sdk
from openai import OpenAI

_c = OpenAI(base_url=os.getenv("LLM_BASE_URL", "http://localhost:11434/v1"), api_key="ollama")
MODEL = os.getenv("GEMMA_MODEL", "gemma3:4b")
SYSTEM = ("You are WildWalk, a calm outdoor guide. Goal: get people off their screens and outside. "
          "Write short, warm, spoken sentences, as if a friend is talking. No markdown symbols. "
          "End with: 'Phone in your pocket. Look up.'")

def ask(prompt: str, system: str = SYSTEM) -> str:
    t = time.time()
    with sentry_sdk.start_span(op="gen_ai.chat", name=MODEL) as sp:
        r = _c.chat.completions.create(model=MODEL, messages=[
            {"role": "system", "content": system}, {"role": "user", "content": prompt}])
        sp.set_data("gen_ai.request.model", MODEL)
        sp.set_data("gen_ai.usage.total_tokens", getattr(r.usage, "total_tokens", 0))
        sp.set_data("latency_s", round(time.time() - t, 2))
    return r.choices[0].message.content

def embed(text: str) -> list[float]:
    return _c.embeddings.create(model=os.getenv("EMBED_MODEL", "nomic-embed-text"),
                                input=text).data[0].embedding
