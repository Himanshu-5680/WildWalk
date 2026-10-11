import os, uuid
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from temporalio.client import Client
from app import obs, score, tiger, llm
from app.workflow import WalkPack

obs.init()
app = FastAPI(title="WildWalk")

class Req(BaseModel):
    user: str = "demo"; city: str; temp_c: float; humidity: float; aqi: float

class Reading(BaseModel):
    temp_c: float; humidity: float; aqi: float; month: int; hour: int; enjoyment: float

@app.post("/walkpack")
async def walkpack(r: Req):
    c = await Client.connect(os.getenv("TEMPORAL_ADDRESS", "localhost:7233"))
    return await c.execute_workflow(WalkPack.run, r.model_dump(), id=f"walk-{uuid.uuid4().hex[:8]}", task_queue="wildwalk")

@app.get("/audio/{wid}")
def audio(wid: str): return FileResponse(f"audio/{wid}.mp3", media_type="audio/mpeg")

@app.post("/sensor")  # Arduino UNO Q / rated walk -> TabPFN data grows
def sensor(x: Reading): score.add_row(x.model_dump()); return {"ok": True}

@app.post("/kb")  # add bird/trail facts to Tiger Data
def kb(body: str): tiger.add(body, llm.embed(body)); return {"ok": True}

@app.get("/health")
def health(): return {"ok": True}

# Frontend dashboard at http://localhost:8000/  (must stay LAST)
app.mount("/", StaticFiles(directory="static", html=True), name="static")