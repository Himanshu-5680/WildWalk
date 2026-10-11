"""Sentry: errors + traces + LLM latency/tokens (Best Use of Sentry)."""
import os, sentry_sdk

def init():
    sentry_sdk.init(dsn=os.getenv("SENTRY_DSN"), traces_sample_rate=1.0,
                    send_default_pii=False, environment=os.getenv("ENV", "dev"))
