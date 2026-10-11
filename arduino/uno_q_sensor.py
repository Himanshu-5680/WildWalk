"""Arduino UNO Q (Linux side): read sensors and POST to WildWalk API (feeds TabPFN).
Pair with an App Lab sketch that reads your sensor on the MCU and hands values over via Bridge.
!! Replace read_sensor() with your real sensor read (see Arduino App Lab docs)."""
import os, time, datetime as dt, requests
API = os.getenv("WILDWALK_API", "https://wildwalk-api.onrender.com")

def read_sensor():
    return {"temp_c": 24.0, "humidity": 55.0, "aqi": 80.0}  # TODO: Bridge call to MCU sensor

while True:
    n = dt.datetime.now(); r = read_sensor()
    requests.post(f"{API}/sensor", json={**r, "month": n.month, "hour": n.hour, "enjoyment": 7.0}, timeout=15)
    time.sleep(900)
