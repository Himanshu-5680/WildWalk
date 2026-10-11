"""MongoDB Atlas: long-term walk journal with Atlas Vector Search (index name: journal_vec)."""
import os, datetime as dt
import dns.resolver
from pymongo import MongoClient

# Fix: PC/hotspot DNS "SRV timeout" -> use Google/Cloudflare DNS just for this lookup
r = dns.resolver.Resolver(configure=False)
r.nameservers = ["8.8.8.8", "1.1.1.1"]
r.lifetime = 15
dns.resolver.default_resolver = r

_col = None
def col():
    global _col
    if _col is None:
        _col = MongoClient(os.environ["MONGO_URI"], serverSelectionTimeoutMS=20000)["wildwalk"]["journal"]
    return _col

def remember(user: str, text: str, emb: list[float]):
    col().insert_one({"user": user, "text": text, "emb": emb, "ts": dt.datetime.utcnow()})

def recall(user: str, emb: list[float], k: int = 3) -> list[str]:
    pipe = [{"$vectorSearch": {"index": "journal_vec", "path": "emb", "queryVector": emb,
                               "numCandidates": 50, "limit": k, "filter": {"user": user}}},
            {"$project": {"_id": 0, "text": 1}}]
    return [d["text"] for d in col().aggregate(pipe)]