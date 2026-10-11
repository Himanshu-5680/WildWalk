import asyncio, os
from concurrent.futures import ThreadPoolExecutor
from temporalio.client import Client
from temporalio.worker import Worker
from app import obs, workflow as w, tiger, score

async def main():
    obs.init(); os.makedirs("audio", exist_ok=True); tiger.init()
    print("Loading TabPFN (pehli baar slow)..."); score._model()   # warm-up in main thread
    print("TabPFN ready. Worker started.")
    c = await Client.connect(os.getenv("TEMPORAL_ADDRESS", "localhost:7233"))
    await Worker(c, task_queue="wildwalk", workflows=[w.WalkPack],
                 activities=[w.a_search, w.a_score, w.a_context, w.a_script, w.a_voice, w.a_save],
                 activity_executor=ThreadPoolExecutor(8)).run()

asyncio.run(main())