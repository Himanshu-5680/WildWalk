"""Preflight: har service alag test karta hai. Run: python check.py"""
import os, traceback
from dotenv import load_dotenv
load_dotenv()

def t(name, fn):
    try: print(f"✅ {name}: {str(fn())[:70]}")
    except Exception as e: print(f"❌ {name}: {type(e).__name__}: {str(e)[:200]}")

from app import llm, search, tiger, memory, voice, score
t("Gemma (Ollama)", lambda: llm.ask("Say hi in 5 words."))
t("Embeddings", lambda: len(llm.embed("hello")))
t("SerpApi", lambda: search.find("Agra")[0]["title"])
t("Tiger Data", lambda: (tiger.init(), tiger.add("test", llm.embed("test")), tiger.hybrid("test", llm.embed("test")))[2])
t("MongoDB Atlas", lambda: (memory.remember("check", "hello", llm.embed("hello")), "insert ok")[1])
os.makedirs("audio", exist_ok=True)
t("ElevenLabs", lambda: voice.speak("Phone in pocket. Look up.", "audio/check.mp3"))
t("TabPFN", lambda: score.predict(temp_c=24, humidity=50, aqi=90, month=10, hour=7))