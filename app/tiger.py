"""Tiger Data (TimescaleDB/Postgres) + pgvector: hybrid keyword+vector search over bird/trail KB."""
import os, psycopg, numpy as np
from pgvector.psycopg import register_vector

def _c():
    c = psycopg.connect(os.environ["TIGER_URL"], autocommit=True)
    c.execute("CREATE EXTENSION IF NOT EXISTS vector")
    register_vector(c)
    return c

def init():
    _c().execute("""CREATE TABLE IF NOT EXISTS kb(
        id serial PRIMARY KEY, body text,
        tsv tsvector GENERATED ALWAYS AS (to_tsvector('english', body)) STORED,
        emb vector(768))""")

def add(body: str, emb: list[float]):
    _c().execute("INSERT INTO kb(body, emb) VALUES (%s, %s)", (body, np.array(emb)))

def hybrid(q: str, qemb: list[float], k: int = 4) -> list[str]:
    rows = _c().execute("""SELECT body FROM kb
        ORDER BY 0.5*ts_rank(tsv, plainto_tsquery('english', %s)) + 0.5*(1-(emb <=> %s::vector)) DESC
        LIMIT %s""", (q, np.array(qemb), k)).fetchall()
    return [r[0] for r in rows]
