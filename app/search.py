"""SerpApi: live web search for trails/parks/birds near the user."""
import os
from serpapi import GoogleSearch

def find(city: str, q: str = "nature trail park birdwatching autumn") -> list[dict]:
    r = GoogleSearch({"q": f"{q} near {city}", "api_key": os.environ["SERPAPI_KEY"], "num": 5}).get_dict()
    return [{"title": x["title"], "link": x["link"], "snippet": x.get("snippet", "")}
            for x in r.get("organic_results", [])]
