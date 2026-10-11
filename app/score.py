"""TabPFN on tabular walk data (CSV): predicts 'walk enjoyment' 1-10 from weather/AQI/time."""
import pandas as pd
from tabpfn import TabPFNRegressor

FEATS = ["temp_c", "humidity", "aqi", "month", "hour"]
_m = None

def _model():
    global _m
    if _m is None:
        df = pd.read_csv("data/walks.csv")
        _m = TabPFNRegressor().fit(df[FEATS], df["enjoyment"])
    return _m

def predict(**f) -> float:
    return round(float(_model().predict(pd.DataFrame([f])[FEATS])[0]), 1)

def add_row(row: dict):
    """Arduino UNO Q posts real readings; user rates the walk later."""
    global _m
    pd.DataFrame([row])[FEATS + ["enjoyment"]].to_csv("data/walks.csv", mode="a", header=False, index=False)
    _m = None
