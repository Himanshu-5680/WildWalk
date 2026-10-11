"""Free natural voice: Microsoft Edge neural voices via edge-tts. No API key, no payment."""
import os, asyncio
import edge_tts

VOICE = os.getenv("EDGE_VOICE", "en-IN-NeerjaNeural")  # other options: en-IN-PrabhatNeural (male), en-US-AvaNeural

def speak(text: str, path: str) -> str:
    async def _run():
        await edge_tts.Communicate(text, VOICE, rate="-5%").save(path)
    asyncio.run(_run())
    return path