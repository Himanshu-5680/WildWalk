"""Temporal: durable walk-pack pipeline (retries + resume where it stopped)."""
import datetime as dt
from datetime import timedelta
from temporalio import activity, workflow
from temporalio.common import RetryPolicy

with workflow.unsafe.imports_passed_through():
    from app import search, llm, tiger, memory, score, voice

@activity.defn
def a_search(city: str) -> list: return search.find(city)

@activity.defn
def a_score(req: dict) -> float:
    n = dt.datetime.now()
    return score.predict(temp_c=req["temp_c"], humidity=req["humidity"], aqi=req["aqi"], month=n.month, hour=n.hour)

@activity.defn
def a_context(req: dict) -> dict:
    q = f"birds trees autumn {req['city']}"
    e = llm.embed(q)
    return {"kb": tiger.hybrid(q, e), "past": memory.recall(req["user"], e)}

@activity.defn
def a_script(p: dict) -> str:
    return llm.ask(
        f"City: {p['req']['city']}. Walk score: {p['score']}/10. "
        f"Nearby spots: {p['spots']}. Facts: {p['ctx']['kb']}. Past walks: {p['ctx']['past']}. "
        "Write under 170 words: 1) best time to go 2) three stops 3) five things to notice (birds, leaves, sounds) "
        "4) one 'look up' challenge."
    )

@activity.defn
def a_voice(p: dict) -> str:
    return voice.speak(p["text"], f"audio/{p['id']}.mp3")

@activity.defn
def a_save(p: dict) -> None:
    memory.remember(p["user"], p["text"], llm.embed(p["text"]))

@workflow.defn
class WalkPack:
    @workflow.run
    async def run(self, req: dict) -> dict:
        rp = RetryPolicy(maximum_attempts=5, initial_interval=timedelta(seconds=2))
        kw = dict(start_to_close_timeout=timedelta(seconds=90), retry_policy=rp)
        spots = await workflow.execute_activity(a_search, req["city"], **kw)
        sc = await workflow.execute_activity(a_score, req, **kw)
        ctx = await workflow.execute_activity(a_context, req, **kw)
        text = await workflow.execute_activity(a_script, {"req": req, "spots": spots, "score": sc, "ctx": ctx}, **kw)
        wid = workflow.info().workflow_id
        await workflow.execute_activity(a_voice, {"text": text, "id": wid}, **kw)
        await workflow.execute_activity(a_save, {"user": req["user"], "text": text}, **kw)
        return {"id": wid, "score": sc, "spots": spots, "text": text, "audio": f"/audio/{wid}"}
